#!/usr/bin/python3

from src.management.store.settings import SettingsStore
from src.middleware.auth import auth
from src.models.models import SystemSettings
from pydantic import ValidationError

config = {
    "name": "Update Settings",
    "type": "api",
    "method": "PUT",
    "description": "Update global system settings",
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
        return {"status": 403, "body": {"error": "Only System Managers and Admin Agents can update settings"}}

    store = SettingsStore(supabase)
    try:
        settings_data = SystemSettings(**req.get("body", {}))
        res = store.update_global(settings_data.model_dump(exclude_unset=True))
        return {"status": 200, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
