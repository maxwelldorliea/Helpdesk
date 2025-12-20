#!/usr/bin/python3

from src.management.store.settings import SettingsStore
from src.middleware.auth import auth

config = {
    "name": "Get Settings",
    "type": "api",
    "method": "GET",
    "description": "Get global system settings",
    "path": "/management/settings",
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
        return {"status": 403, "body": {"error": "Only System Managers and Admin Agents can view settings"}}

    store = SettingsStore(supabase)
    settings = store.get_global()
    return {"status": 200, "body": settings}
