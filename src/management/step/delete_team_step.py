#!/usr/bin/python3

from src.management.store.team import TeamStore
from src.middleware.auth import auth

config = {
    "name": "Delete Team",
    "type": "api",
    "method": "DELETE",
    "description": "Delete an existing team",
    "path": "/management/teams/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    name = req.get("pathParams", {}).get("name")
    supabase = req['supabase']
    store = TeamStore(supabase)
    res = store.delete(name)
    return {"status": 200, "body": res}
