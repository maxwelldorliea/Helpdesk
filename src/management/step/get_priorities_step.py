#!/usr/bin/python3

from src.management.store.priority import PriorityStore
from src.middleware.auth import auth

config = {
    "name": "Get Priorities",
    "type": "api",
    "method": "GET",
    "description": "Get all ticket priorities",
    "path": "/management/priorities",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    store = PriorityStore(supabase)
    priorities = store.get_all()
    return {"status": 200, "body": priorities}
