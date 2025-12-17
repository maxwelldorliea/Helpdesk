#!/usr/bin/python3

from src.ticket.store.ticket import Ticket

config = {
    "name": "Send New Ticket Notification",
    "type": "event",
    "subscribes": ["ticket.created"],
    "description": "Send New Ticket Notification",
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(input, ctx):
    ctx.logger.info("New Ticket", input)
