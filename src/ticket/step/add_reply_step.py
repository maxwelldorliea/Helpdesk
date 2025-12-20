#!/usr/bin/python3

from datetime import datetime
from src.ticket.store.ticket import Ticket
from src.middleware.auth import auth
from src.models.models import ReplyRequest
from pydantic import ValidationError

config = {
    "name": "Add Ticket Reply",
    "type": "api",
    "method": "POST",
    "description": "Add a reply to a ticket",
    "path": "/tickets/:id/reply",
    "middleware": [auth],
    "emits": ["ticket.replied"],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    token = req['token']
    ticket_store = Ticket(supabase, token)
    try:
        reply_data = ReplyRequest(**req.get('body', {}))
        reply = ticket_store.add_reply(id, reply_data.model_dump(exclude_unset=True))
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}

    await ctx.emit({
        "topic": "ticket.replied",
        "data": reply
    })

    full_ticket = ticket_store.get_by_id(id)
    current_status = full_ticket.get('status')
    new_status = current_status

    if current_status not in ['Resolved', 'Closed']:
        ticket_store.update(id, {"status": "Replied"})
        new_status = "Replied"

    await ctx.streams.tickets.set("all", id, {
        "name": id,
        "subject": full_ticket.get('subject'),
        "status": new_status,
        "priority": full_ticket.get('priority'),
        "team": full_ticket.get('team'),
        "agent": str(full_ticket.get('agent')) if full_ticket.get('agent') else None,
        "customer": full_ticket.get('customer'),
        "customerName": full_ticket.get('customerName'),
        "customerEmail": full_ticket.get('customerEmail'),
        "customerPhone": full_ticket.get('customerPhone'),
        "raised_by": full_ticket.get('raised_by'),
        "creation": full_ticket['creation'].isoformat() if hasattr(full_ticket['creation'], 'isoformat') else str(full_ticket['creation']),
        "modified": datetime.now().isoformat()
    })

    await ctx.streams.communications.set(id, str(reply['id']), {
        "id": str(reply['id']),
        "ticket": id,
        "body": reply['body'],
        "direction": reply['direction'],
        "creation": reply['creation'].isoformat() if hasattr(reply['creation'], 'isoformat') else str(reply['creation']),
        "raised_by": reply['raised_by'],
        "channel": reply.get('channel'),
        "attachments": reply.get('attachments')
    })

    return {"status": 201, "body": reply}
