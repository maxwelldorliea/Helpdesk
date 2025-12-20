#!/usr/bin/python3

from src.management.store.membership import MembershipStore
from src.middleware.auth import auth

config = {
    "name": "Get Team Members",
    "type": "api",
    "method": "GET",
    "description": "Get all members of a specific team",
    "path": "/management/teams/:team/members",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    team = req.get("pathParams", {}).get("team")
    supabase = req['supabase']
    store = MembershipStore(supabase)
    members = store.get_by_team(team)
    return {"status": 200, "body": members}
