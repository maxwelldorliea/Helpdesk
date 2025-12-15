from ..store.ticket import Ticket

config = {
    "name": "Get Tickets",
    "type": "api",
    "method": "GET",
    "path": "/tickets",
    "emits": []
}

async def handler(req, ctx=None):
    ticket = Ticket()
    return {"status": 200, "body": ticket.get_all()}
