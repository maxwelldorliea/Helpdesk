#!/usr/bin/python3

import os
from supabase import Client, create_client

config = {
    "name": "Reset Ticket Current Count",
    "description": "Reset Ticket Current Count Emails Every 12 AM",
    "type": "cron",
    "cron": "0 0 * * *",
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(ctx):
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        ctx.logger.error("SUPABASE_URL or SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY not set")
        return
    supabase: Client = create_client(supabase_url, supabase_key)
    supabase.table("System_Setting")\
    .update({'current_count': 1}).eq('name', 'GLOBAL').execute()
