#!/usr/bin/python3

from src.management.store.membership import MembershipStore
from src.middleware.auth import auth

config = {
    "name": "Remove Team Member",
    "type": "api",
    "method": "DELETE",
    "description": "Remove a member from a team",
    "path": "/management/teams/:team/members/:user",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    token = req['token']
    user_id = supabase.auth.get_user(token).user.id

    is_manager = supabase.rpc('is_manager', {'user_uuid': user_id}).execute().data
    is_admin = supabase.rpc('is_admin_agent', {'user_uuid': user_id}).execute().data

    if not (is_manager or is_admin):
        return {"status": 403, "body": {"error": "Only System Managers and Admin Agents can remove team members"}}

    team = req.get("pathParams", {}).get("team")
    user = req.get("pathParams", {}).get("user")
    store = MembershipStore(supabase)
    res = store.remove_member(team, user)
    return {"status": 200, "body": res}
