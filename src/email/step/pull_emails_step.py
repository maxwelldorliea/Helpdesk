#!/usr/bin/python3

from src.email.service.email import EmailService
from src.models.models import InboundEmail

config = {
    "type": "cron",
    "name": "Pull Email",
    "description": "Pull Emails From Support Inbox Every 5 Seconds",
    "cron": "*/5 * * * * *",
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(ctx):
    ctx.logger.info('Email Pulling has started - scanning for available emails')
    emails: list[InboundEmail] = EmailService().pull()
    for e in emails:
        ctx.logger.info('Email', {'data': e.json()})
