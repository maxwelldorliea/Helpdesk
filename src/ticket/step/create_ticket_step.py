#!/usr/bin/python3

from src.ticket.store.ticket import Ticket
from src.models.models import TicketCreate
from src.middleware.auth import auth
from pydantic import ValidationError

config = {
    "name": "Create a New Ticket",
    "type": "api",
    "method": "POST",
    "description": "Create a New Ticket",
    "path": "/tickets",
    "bodySchema": TicketCreate.model_json_schema(),
    "middleware": [auth],
    "emits": ["ticket.created"],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    supabase = req['supabase']
    token = req['token']
    ticket_store = Ticket(supabase, token)
    try:
        ticket_data = TicketCreate(**req['body'])
        ticket = ticket_store.create_from_dict(ticket_data.model_dump(exclude_unset=True))
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
    await ctx.emit({
        "topic": "ticket.created",
        "data": ticket
    })

    await ctx.streams.tickets.set("all", ticket['name'], {
        "name": ticket['name'],
        "subject": ticket['subject'],
        "status": ticket['status'],
        "priority": ticket.get('priority'),
        "team": ticket.get('team'),
        "agent": str(ticket.get('agent')) if ticket.get('agent') else None,
        "customer": ticket.get('customer'),
        "creation": ticket['creation'].isoformat() if hasattr(ticket['creation'], 'isoformat') else str(ticket['creation']),
        "modified": ticket['modified'].isoformat() if hasattr(ticket['modified'], 'isoformat') else str(ticket['modified'])
    })
    return {"status": 201, "body": ticket}
