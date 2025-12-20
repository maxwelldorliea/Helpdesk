#!/usr/bin/python3

from src.management.store.kb import KBStore
from src.middleware.auth import auth

config = {
    "name": "Get Articles",
    "type": "api",
    "method": "GET",
    "description": "Get all knowledge base articles",
    "path": "/management/kb",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    store = KBStore(supabase)
    articles = store.get_all()
    return {"status": 200, "body": articles}
