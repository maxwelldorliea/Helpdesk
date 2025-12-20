#!/usr/bin/python3

import os
from datetime import datetime
from supabase import create_client, Client
from src.ticket.store.ticket import Ticket
from src.ai.service.gemini import GeminiService

config = {
    "name": "Ticket Orchestrator",
    "type": "event",
    "description": "Orchestrates ticket lifecycle using Gemini AI for classification and assignment",
    "subscribes": ["ticket.created", "ticket.replied", "ticket.ai_process.requested"],
    "emits": ["ticket.processed", "ticket.replied"],
    "flows": ["HelpDesk"]
}

async def handler(input, ctx):
    try:
        gemini_service = GeminiService()
    except ValueError as e:
        ctx.logger.warn(f"{str(e)}. Skipping AI orchestration.")
        return

    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        ctx.logger.error("SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY not set")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    ticket_store = Ticket(supabase, None)

    ticket_data = input
    ticket_id = ticket_data.get('name') or ticket_data.get('ticket')

    if not ticket_id:
        ctx.logger.error("No ticket ID found in input", input)
        return

    async def stream_event(event, message):
        await ctx.streams.ticket_events.set(ticket_id, "status", {
            "ticket_id": ticket_id,
            "event": event,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })

    ctx.logger.info(f"Orchestrating ticket: {ticket_id}")
    await stream_event("started", "AI Orchestrator started processing...")

    if ticket_data.get('direction') == 'Outbound':
        ctx.logger.info(f"Skipping outbound message for {ticket_id}")
        await stream_event("completed", "Skipped: Outbound message.")
        return

    try:
        await stream_event("fetching_context", "Fetching teams, priorities, and knowledge base...")
        teams_res = supabase.table('Team').select('name, description').execute()
        priorities_res = supabase.table('Priority').select('name, description').execute()
        kb_res = supabase.table('Knowledge_Base').select('title, content').execute()

        await stream_event("fetching_history", "Retrieving conversation history...")
        history_res = supabase.table('Communication')\
            .select('body, direction, creation, raised_by')\
            .eq('ticket', ticket_id)\
            .order('creation', desc=False)\
            .execute()
        history = history_res.data

        if history and history[-1]['direction'] == 'Outbound':
            ctx.logger.info(f"Last message for {ticket_id} was Outbound. Skipping.")
            await stream_event("completed", "Skipped: Last message was outbound.")
            return

        has_confirmation = any(
            c.get('raised_by') == 'AI Orchestrator' and
            "Thank you for providing the details" in c.get('body', '')
            for c in history
        )
        if has_confirmation:
            ctx.logger.info(f"Confirmation already sent for {ticket_id}. Handing over to human agent.")
            await stream_event("completed", "Skipped: AI already processed this ticket.")
            return

        await stream_event("fetching_resolved", "Searching for similar resolved tickets...")
        resolved_res = supabase.table('Ticket')\
            .select('subject, name')\
            .eq('status', 'Resolved')\
            .order('creation', desc=True)\
            .limit(10)\
            .execute()

        resolved_tickets = []
        for t in resolved_res.data:
            comm_res = supabase.table('Communication')\
                .select('body')\
                .eq('ticket', t['name'])\
                .eq('direction', 'Outbound')\
                .order('creation', desc=True)\
                .limit(1)\
                .execute()
            if comm_res.data:
                resolved_tickets.append({
                    "subject": t['subject'],
                    "resolution": comm_res.data[0]['body']
                })

        teams = teams_res.data
        priorities = [p['name'] for p in priorities_res.data]
        kb_articles = kb_res.data

        if not teams or not priorities:
            ctx.logger.error("No teams or priorities found. Check database.")
            await stream_event("completed", "Error: Missing configuration.")
            return

        ticket = ticket_store.get_by_id(ticket_id)
        if not ticket:
            ctx.logger.error(f"Ticket {ticket_id} not found in DB.")
            await stream_event("completed", "Error: Ticket not found.")
            return

        subject = ticket.get('subject', '')
        description = ticket.get('description', '')

        await stream_event("analyzing", "Helpdesk AI is analyzing the ticket and conversation...")
        res = gemini_service.analyze_ticket(
            subject,
            description,
            teams,
            priorities,
            kb_articles=kb_articles,
            resolved_tickets=resolved_tickets,
            history=history
        )

        assigned_group = res.team
        assigned_priority = res.priority

        await stream_event("analysis_complete", f"Analysis complete. Assigned to {assigned_group} with {assigned_priority} priority.")
        ctx.logger.info(f"Gemini AI result for {ticket_id}: {res}")

        updates = {
            'team': assigned_group,
            'priority': assigned_priority
        }

        if res.can_resolve and res.suggested_resolution:
            updates['status'] = 'Resolved'
            updates['resolved_by_bot'] = True
            updates['resolution_date'] = 'now()'

            c = ticket_store.add_communication(
                ticket_id,
                body=f"AI AUTO-RESOLUTION:\n\n{res.suggested_resolution}",
                direction='Outbound',
                channel=ticket.get('channel', 'Email'),
                raised_by='AI Orchestrator'
            )

            if c:
                await ctx.streams.communications.set(ticket_id, str(c['id']), {
                    "id": str(c['id']),
                    "ticket": ticket_id,
                    "body": c['body'],
                    "direction": c['direction'],
                    "creation": c['creation'] if isinstance(c['creation'], str) else c['creation'].isoformat(),
                    "raised_by": c['raised_by'],
                    "channel": c.get('channel'),
                    "attachments": c.get('attachments')
                })
                await ctx.emit({
                    "topic": "ticket.replied",
                    "data": c
                })

            ctx.logger.info(f"Ticket {ticket_id} auto-resolved by AI.")
        elif res.needs_more_info and res.clarifying_question:
            c = ticket_store.add_communication(
                ticket_id,
                body=res.clarifying_question,
                direction='Outbound',
                channel=ticket.get('channel', 'Email'),
                raised_by='AI Orchestrator'
            )

            if c:
                await ctx.streams.communications.set(ticket_id, str(c['id']), {
                    "id": str(c['id']),
                    "ticket": ticket_id,
                    "body": c['body'],
                    "direction": c['direction'],
                    "creation": c['creation'] if isinstance(c['creation'], str) else c['creation'].isoformat(),
                    "raised_by": c['raised_by'],
                    "channel": c.get('channel'),
                    "attachments": c.get('attachments')
                })
                await ctx.emit({
                    "topic": "ticket.replied",
                    "data": c
                })


            if ticket.get('status') not in ['Resolved', 'Closed']:
                updates['status'] = 'Replied'
            ctx.logger.info(f"AI asked clarifying question for {ticket_id}.")

        elif not res.needs_more_info and not res.can_resolve:

            sla_res = supabase.table('SLA').select('resolution_time').eq('priority', assigned_priority).execute()
            est_time = "a few days"
            if sla_res.data:
                est_time = sla_res.data[0]['resolution_time']

            confirmation_msg = (
                f"Thank you for providing the details. We have received your request and assigned it to our {assigned_group}.\n\n"
                f"Your Ticket ID is: {ticket_id}\n"
                f"Estimated Resolution Time: {est_time}\n\n"
                "An agent will be in touch soon."
            )

            if not history or history[-1]['direction'] == 'Inbound':
                c = ticket_store.add_communication(
                    ticket_id,
                    body=confirmation_msg,
                    direction='Outbound',
                    channel=ticket.get('channel', 'Email'),
                    raised_by='AI Orchestrator'
                )

                if c:
                    await ctx.streams.communications.set(ticket_id, str(c['id']), {
                        "id": str(c['id']),
                        "ticket": ticket_id,
                        "body": c['body'],
                        "direction": c['direction'],
                        "creation": c['creation'] if isinstance(c['creation'], str) else c['creation'].isoformat(),
                        "raised_by": c['raised_by'],
                        "channel": c.get('channel'),
                        "attachments": c.get('attachments')
                    })
                    await ctx.emit({
                        "topic": "ticket.replied",
                        "data": c
                    })


                if ticket.get('status') not in ['Resolved', 'Closed']:
                    updates['status'] = 'Replied'
                ctx.logger.info(f"Sent confirmation for {ticket_id}")

        updated_ticket = ticket_store.update(ticket_id, updates)

        if updated_ticket:
            ut = updated_ticket
            await ctx.streams.tickets.set("all", ut['name'], {
                "name": ut['name'],
                "subject": ut['subject'],
                "status": ut['status'],
                "priority": ut.get('priority'),
                "team": ut.get('team'),
                "agent": str(ut.get('agent')) if ut.get('agent') else None,
                "customer": ut.get('customer'),
                "customerName": ut.get('customerName'),
                "customerEmail": ut.get('customerEmail'),
                "customerPhone": ut.get('customerPhone'),
                "raised_by": ut.get('raised_by'),
                "creation": ut['creation'] if isinstance(ut['creation'], str) else ut['creation'].isoformat(),
                "modified": ut['modified'] if isinstance(ut['modified'], str) else ut['modified'].isoformat()
            })

        await stream_event("completed", "AI Orchestration completed successfully.")
        await ctx.emit({
            "topic": "ticket.processed",
            "data": {
                "ticket_id": ticket_id,
                "updates": updates,
                "ai_used": True,
                "auto_resolved": res.can_resolve,
                "asked_question": res.needs_more_info
            }
        })

    except Exception as e:
        ctx.logger.error(f"Error in Ticket Orchestrator: {str(e)}")
        await stream_event("completed", f"Error: {str(e)}")
        raise e
