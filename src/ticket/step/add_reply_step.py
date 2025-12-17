#!/usr/bin/python3

from src.ticket.store.ticket import Ticket
from src.middleware.auth import auth

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
    ticket = Ticket(supabase, token)
    reply = ticket.add_reply(id, req.get('body', {}))

    await ctx.emit({
        "topic": "ticket.replied",
        "data": reply
    })

    return {"status": 201, "body": reply}
