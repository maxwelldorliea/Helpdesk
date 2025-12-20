#!/usr/bin/python3

import os
from supabase import create_client, Client
from src.middleware.auth import auth

config = {
    "name": "Invite User",
    "type": "api",
    "method": "POST",
    "description": "Invite a new user to the system via email",
    "path": "/management/users/invite",
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
        return {"status": 403, "body": {"error": "Only System Managers and Admin Agents can invite users"}}

    email = req.get("body", {}).get("email")
    if not email:
        return {"status": 400, "body": {"error": "Email is required"}}

    supabase_url = os.environ.get('SUPABASE_URL')
    service_role_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not service_role_key:
        return {"status": 500, "body": {"error": "SUPABASE_SERVICE_ROLE_KEY not configured"}}

    supabase: Client = create_client(supabase_url, service_role_key)

    try:
        res = supabase.auth.admin.invite_user_by_email(email)

        user = res.user if hasattr(res, 'user') else res

        if user:
            supabase.table('Role').insert({
                "user": user.id,
                "name": "Agent"
            }).execute()

            return {
                "status": 201,
                "body": {
                    "message": f"Invitation sent to {email}",
                    "user": {
                        "id": user.id,
                        "email": user.email
                    }
                }
            }
        else:
            return {"status": 500, "body": {"error": "Failed to create user during invitation"}}
    except Exception as e:
        ctx.logger.error(f"Failed to invite user: {str(e)}")
        return {"status": 500, "body": {"error": str(e)}}
