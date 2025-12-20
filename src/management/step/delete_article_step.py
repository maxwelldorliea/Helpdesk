#!/usr/bin/python3

from src.management.store.kb import KBStore
from src.middleware.auth import auth

config = {
    "name": "Delete Article",
    "type": "api",
    "method": "DELETE",
    "description": "Delete an existing knowledge base article",
    "path": "/management/kb/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    store = KBStore(supabase)
    res = store.delete(id, 'id')
    return {"status": 200, "body": res}
