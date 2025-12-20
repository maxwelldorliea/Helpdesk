#!/usr/bin/python3

from src.management.store.handle import HandleStore
from src.middleware.auth import auth

config = {
    "name": "Remove Customer Handle",
    "type": "api",
    "method": "DELETE",
    "description": "Remove a handle from a customer",
    "path": "/management/customers/:customer/handles/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    handle_id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    store = HandleStore(supabase)
    res = store.delete(handle_id, 'id')
    return {"status": 200, "body": res}
