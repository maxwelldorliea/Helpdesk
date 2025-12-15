#!/usr/bin/python3

from ..store.ticket import Ticket

config = {
    "name": "Get Ticket By ID",
    "type": "api",
    "method": "GET",
    "path": "/tickets/:id",
    "emits": []
}

async def handler(req, ctx=None):
    id = req.get("pathParams", {}).get("id")
    ticket = Ticket()
    return {"status": 200, "body": ticket.get_by_id(id)}

