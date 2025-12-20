#!/usr/bin/python3

from src.management.store.sla import SLAStore
from src.middleware.auth import auth

config = {
    "name": "Get SLAs",
    "type": "api",
    "method": "GET",
    "description": "Get all SLAs",
    "path": "/management/slas",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    store = SLAStore(supabase)
    slas = store.get_all()
    return {"status": 200, "body": slas}
