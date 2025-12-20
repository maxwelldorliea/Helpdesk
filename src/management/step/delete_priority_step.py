#!/usr/bin/python3

from src.management.store.priority import PriorityStore
from src.middleware.auth import auth

config = {
    "name": "Delete Priority",
    "type": "api",
    "method": "DELETE",
    "description": "Delete an existing ticket priority",
    "path": "/management/priorities/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    name = req.get("pathParams", {}).get("name")
    supabase = req['supabase']
    store = PriorityStore(supabase)
    res = store.delete(name)
    return {"status": 200, "body": res}
