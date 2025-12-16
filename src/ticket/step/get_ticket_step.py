#!/usr/bin/python3

from src.ticket.store.ticket import Ticket

config = {
    "name": "Get Ticket By ID",
    "type": "api",
    "method": "GET",
    "description": "Get Ticket Details and Communication By ID",
    "path": "/tickets/:id",
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx=None):
    id = req.get("pathParams", {}).get("id")
    ticket = Ticket()
    return {"status": 200, "body": ticket.get_by_id(id)}

