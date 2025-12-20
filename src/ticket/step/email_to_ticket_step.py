#!/usr/bin/python3

import os
from supabase import create_client, Client
from datetime import datetime
from src.ticket.store.ticket import Ticket
from src.models.models import CommunicationDirection

config = {
    "name": "Email to Ticket",
    "type": "event",
    "description": "Converts incoming emails to tickets or replies",
    "subscribes": ["email.received"],
    "emits": ["ticket.created", "ticket.replied"],
    "flows": ["HelpDesk"]
}

async def handler(input, ctx):
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        ctx.logger.error("SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY not set")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    ticket_store = Ticket(supabase, None)

    email_data = input

    message_id = email_data.get('message_id')
    in_reply_to = email_data.get('in_reply_to')
    references = email_data.get('references', [])

    target_ticket_id = None

    search_ids = []
    if in_reply_to:
        search_ids.append(in_reply_to)
    if references:
        search_ids.extend(references)

    ctx.logger.info(f"Search IDs: {search_ids}")

    if search_ids:
        comm_res = supabase.table('Communication')\
            .select('ticket')\
            .in_('message_id', search_ids)\
            .limit(1)\
            .execute()

        if comm_res.data:
            target_ticket_id = comm_res.data[0]['ticket']
        else:
            ticket_res = supabase.table('Ticket')\
                .select('name')\
                .in_('external_thread_id', search_ids)\
                .limit(1)\
                .execute()
            if ticket_res.data:
                target_ticket_id = ticket_res.data[0]['name']

    attachments_dict = {}
    if email_data.get('attachments'):
        for att in email_data.get('attachments'):
            if isinstance(att, dict):
                filename = att.get('filename')
                mime_type = att.get('mime_type')
                data = att.get('data')
            else:
                filename = att.filename
                mime_type = att.mime_type
                data = att.data
            if filename and data:
                attachments_dict[filename] = f"data:{mime_type};base64,{data}"

    if target_ticket_id:
        ctx.logger.info(f"Adding email as reply to ticket: {target_ticket_id}")
        reply_obj = {
            'body': email_data.get('body_text', ''),
            'raised_by': email_data.get('sender_email'),
            'channel': 'Email',
            'direction': CommunicationDirection.INBOUND,
            'message_id': message_id,
            'raw_headers': {
                **(email_data.get('raw_headers') or {}),
                'full_body_text': email_data.get('full_body_text')
            },
            'attachments': attachments_dict
        }

        res = supabase.table('Communication').insert({
            'ticket': target_ticket_id,
            **reply_obj
        }).execute()

        if res.data:
            c = res.data[0]

            await ctx.streams.communications.set(target_ticket_id, str(c['id']), {
                "id": str(c['id']),
                "ticket": target_ticket_id,
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
    else:
        ctx.logger.info(f"Creating new ticket from email: {email_data.get('subject')}")

        ticket_obj = {
            'subject': email_data.get('subject', 'No Subject'),
            'description': email_data.get('body_text', ''),
            'raised_by': email_data.get('sender_email'),
            'channel': 'Email',
            'status': 'Open',
            'owner': 'admin@helpdesk.com',
            'external_thread_id': message_id,
            'message_id': message_id,
            'raw_headers': {
                **(email_data.get('raw_headers') or {}),
                'full_body_text': email_data.get('full_body_text')
            },
            'attachments': attachments_dict
        }

        try:
            new_ticket = ticket_store.create_from_dict(ticket_obj)
            ticket_name = new_ticket['name']
        except Exception as e:
            ctx.logger.error(f"Failed to create ticket: {e}")
            return

        await ctx.streams.tickets.set("all", ticket_name, {
            "name": ticket_name,
            "subject": email_data.get('subject', 'No Subject'),
            "status": "Open",
            "priority": None,
            "team": None,
            "agent": None,
            "customer": email_data.get('sender_email'),
            "creation": datetime.now().isoformat(),
            "modified": datetime.now().isoformat()
        })

        await ctx.emit({
            "topic": "ticket.created",
            "data": new_ticket
        })
