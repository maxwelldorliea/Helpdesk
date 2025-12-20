#!/usr/bin/python3

from src.management.store.profile import ProfileStore
from src.middleware.auth import auth

config = {
    "name": "Update Profile",
    "type": "api",
    "method": "PUT",
    "description": "Update user profile",
    "path": "/profile",
    "middleware": [auth],
    "emits": ["profile.updated"],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    token = req['token']

    user = supabase.auth.get_user(token)
    user_id = user.user.id

    store = ProfileStore(supabase)
    updated_profile = store.update(user_id, req.get('body', {}))

    await ctx.emit({
        "topic": "profile.updated",
        "data": updated_profile
    })

    return {"status": 200, "body": updated_profile}
