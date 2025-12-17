#!/usr/bin/python3

import os
from supabase import create_client, Client


async def auth(req, ctx, next_fn):
    supabase_url = os.environ.get('SUPABASE_URL')
    if not supabase_url:
        raise ValueError('ENV SUPABASE_URL is required')
    supabase_key = os.environ.get('SUPABASE_KEY')
    if not supabase_key:
        raise ValueError('ENV SUPABASE_KEY is required')
    try:
        token = req['headers'].get('authorization', '').replace('Bearer ', '')
        if not token:
            token = req['headers'].get('Authorization', '').replace('Bearer ', '')
        supabase: Client = create_client(supabase_url, supabase_key)
        supabase.postgrest.auth(token)
        req['supabase'] = supabase
        req['token'] = token
    except Exception as e:
        ctx.logger.error('An exception occurred during auth', str(e))
        return {
            'status': 401,
            'body': { 'error': 'Unauthorized' }
        }
    return await next_fn()
