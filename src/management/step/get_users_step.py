#!/usr/bin/python3

import os
from supabase import create_client, Client
from src.middleware.auth import auth

config = {
    "name": "Get All Users",
    "type": "api",
    "method": "GET",
    "description": "Get all users from Supabase Auth (Admin only)",
    "path": "/management/users",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase_url = os.environ.get('SUPABASE_URL')
    service_role_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not service_role_key or not supabase_url:
        ctx.logger.error("SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY not set")
        return {
                "status": 500,
                "body": {"error": "An error occurred! It's on us!"}
        }

    supabase: Client = create_client(supabase_url, service_role_key)

    try:
        res = supabase.auth.admin.list_users()
        users_data = res.users if hasattr(res, 'users') else res

        users = []
        for user in users_data:
            users.append({
                "id": user.id,
                "email": user.email,
            })

        return {"status": 200, "body": users}
    except Exception as e:
        ctx.logger.error(f"Failed to list users: {str(e)}")
        return {"status": 500, "body": {"error": str(e)}}
