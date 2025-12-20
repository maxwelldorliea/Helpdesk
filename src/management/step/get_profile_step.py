#!/usr/bin/python3

from src.management.store.profile import ProfileStore
from src.middleware.auth import auth

config = {
    "name": "Get Profile",
    "type": "api",
    "method": "GET",
    "description": "Get user profile",
    "path": "/profile",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    token = req['token']

    user = supabase.auth.get_user(token)
    user_id = user.user.id

    store = ProfileStore(supabase)
    profile = store.get_by_id(user_id)

    if not profile:
        profile = {
            "id": user_id,
            "email": user.user.email,
            "full_name": user.user.user_metadata.get('full_name', ''),
            "avatar_url": user.user.user_metadata.get('avatar_url', '')
        }
    else:
        profile['email'] = user.user.email

    return {"status": 200, "body": profile}
