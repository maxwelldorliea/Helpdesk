#!/usr/bin/python3

from src.ticket.store.ticket import Ticket

config = {
    "name": "Get Tickets",
    "type": "api",
    "method": "GET",
    "description": "Get All Tickets",
    "path": "/tickets",
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx=None):
    ticket = Ticket()
    return {"status": 200, "body": ticket.get_all()}
