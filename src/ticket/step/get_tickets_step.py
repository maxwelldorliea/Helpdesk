#!/usr/bin/python3

from src.ticket.store.ticket import Ticket
from src.middleware.auth import auth

config = {
    "name": "Get Tickets",
    "type": "api",
    "method": "GET",
    "description": "Get All Tickets",
    "path": "/tickets",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx=None):
    supabase = req['supabase']
    token = req['token']
    ticket = Ticket(supabase, token)
    return {"status": 200, "body": ticket.get_all()}
