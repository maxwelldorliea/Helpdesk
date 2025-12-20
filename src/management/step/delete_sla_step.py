#!/usr/bin/python3

from src.management.store.sla import SLAStore
from src.middleware.auth import auth

config = {
    "name": "Delete SLA",
    "type": "api",
    "method": "DELETE",
    "description": "Delete an existing SLA",
    "path": "/management/slas/:name",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    name = req.get("pathParams", {}).get("name")
    supabase = req['supabase']
    store = SLAStore(supabase)
    res = store.delete(name)
    return {"status": 200, "body": res}
