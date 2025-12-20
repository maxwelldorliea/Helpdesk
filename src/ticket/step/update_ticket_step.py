#!/usr/bin/python3

from src.ticket.store.ticket import Ticket
from src.middleware.auth import auth

config = {
    "name": "Update Ticket",
    "type": "api",
    "method": "PUT",
    "description": "Update Ticket Details",
    "path": "/tickets/:id",
    "middleware": [auth],
    "emits": ["ticket.updated"],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    token = req['token']
    ticket_store = Ticket(supabase, token)
    updated_ticket = ticket_store.update(id, req.get('body', {}))

    await ctx.emit({
        "topic": "ticket.updated",
        "data": updated_ticket
    })

    await ctx.streams.tickets.set("all", updated_ticket['name'], {
        "name": updated_ticket['name'],
        "subject": updated_ticket['subject'],
        "status": updated_ticket['status'],
        "priority": updated_ticket.get('priority'),
        "team": updated_ticket.get('team'),
        "agent": str(updated_ticket.get('agent')) if updated_ticket.get('agent') else None,
        "customer": updated_ticket.get('customer'),
        "creation": updated_ticket['creation'].isoformat() if hasattr(updated_ticket['creation'], 'isoformat') else str(updated_ticket['creation']),
        "modified": updated_ticket['modified'].isoformat() if hasattr(updated_ticket['modified'], 'isoformat') else str(updated_ticket['modified'])
    })
    return {"status": 200, "body": updated_ticket}
