#!/usr/bin/python3

from src.management.store.team import TeamStore
from src.middleware.auth import auth

config = {
    "name": "Get Teams",
    "type": "api",
    "method": "GET",
    "description": "Get all teams",
    "path": "/management/teams",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    store = TeamStore(supabase)
    teams = store.get_all()
    return {"status": 200, "body": teams}
