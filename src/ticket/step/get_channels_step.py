#!/usr/bin/python3

from src.ticket.store.ticket import Ticket
from src.middleware.auth import auth

config = {
    "name": "Get Active Channels",
    "type": "api",
    "method": "GET",
    "description": "Fetch all active ticket channels",
    "path": "/channels",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    token = req['token']
    ticket = Ticket(supabase, token)
    channels = ticket.get_channels()
    return {"status": 200, "body": channels}
