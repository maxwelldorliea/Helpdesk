#!/usr/bin/python3

from src.middleware.auth import auth

config = {
    "name": "Get Agents",
    "type": "api",
    "method": "GET",
    "description": "Get all users with the Agent role",
    "path": "/management/agents",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']

    query = supabase.table('Role').select('user, name, Profile(*)').eq('name', 'Agent')
    res = query.execute()

    return {"status": 200, "body": res.data}
