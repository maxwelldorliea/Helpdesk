#!/usr/bin/python3

import os
from supabase import create_client, Client
from src.email.service.email import EmailService

config = {
    "name": "Communication Dispatcher",
    "type": "event",
    "description": "Dispatches outbound communications to the correct channel",
    "subscribes": ["ticket.replied"],
    "emits": ["communication.dispatched"],
    "flows": ["HelpDesk"]
}

async def handler(input, ctx):
    comm_data = input
    direction = comm_data.get('direction')

    if direction != 'Outbound':
        return

    ticket_id = comm_data.get('ticket')
    body = comm_data.get('body')

    if not ticket_id or not body:
        ctx.logger.error("Missing ticket_id or body in communication data")
        return

    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        ctx.logger.error("SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY not set")
        return

    supabase: Client = create_client(supabase_url, supabase_key)

    ticket_res = supabase.table('Ticket').select('subject, raised_by, channel, external_thread_id').eq('name', ticket_id).execute()
    if not ticket_res.data:
        ctx.logger.error(f"Ticket {ticket_id} not found")
        return

    ticket = ticket_res.data[0]
    channel = ticket.get('channel')
    recipient = ticket.get('raised_by')
    subject = f"Re: {ticket.get('subject')}"

    if channel == 'Email':
        try:
            email_service = EmailService()
            history_res = supabase.table('Communication')\
                .select('message_id')\
                .eq('ticket', ticket_id)\
                .eq('direction', 'Inbound')\
                .order('creation', desc=True)\
                .execute()

            history = history_res.data
            reply_to = None
            references = []

            if history:
                reply_to = history[0].get('message_id')
                references = [h.get('message_id') for h in history if h.get('message_id')]

            if ticket.get('external_thread_id') and ticket.get('external_thread_id') not in references:
                references.insert(0, ticket.get('external_thread_id'))
                if not reply_to:
                    reply_to = ticket.get('external_thread_id')

            ctx.logger.info(f"Sending email reply to {recipient} for ticket {ticket_id}")

            new_message_id = email_service.send(
                recipient=recipient,
                subject=subject,
                body=body,
                reply_to_message_id=reply_to,
                references_chain=references,
                attachments=comm_data.get('attachments')
            )

            if new_message_id:
                supabase.table('Communication')\
                    .update({'message_id': new_message_id})\
                    .eq('id', comm_data.get('id'))\
                    .execute()
                await ctx.emit({
                    "topic": "communication.dispatched",
                    "data": { "communication_id": comm_data.get('id'), "channel": "Email", "message_id": new_message_id }
                })
        except Exception as e:
            ctx.logger.error(f"Error sending email: {str(e)}")
    else:
        ctx.logger.info(f"Channel {channel} not supported for automated dispatch yet.")
