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
    ticket = Ticket(supabase, token)
    updated_ticket = ticket.update(id, req.get('body', {}))
    await ctx.emit({
        "topic": "ticket.updated",
        "data": updated_ticket
    })
    return {"status": 200, "body": updated_ticket}
