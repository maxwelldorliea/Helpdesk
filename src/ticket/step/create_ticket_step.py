#!/usr/bin/python3

from src.ticket.store.ticket import Ticket
from src.models.models import TicketCreate
from src.middleware.auth import auth

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
    ticket = Ticket(supabase, token)
    ticket = ticket.create_from_dict(req['body'])
    await ctx.emit({
        "topic": "ticket.created",
        "data": ticket
    })
    return {"status": 201, "body": ticket}
