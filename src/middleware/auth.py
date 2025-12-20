#!/usr/bin/python3

import os
import traceback
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
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        ctx.logger.error('An exception occurred during auth', error_msg)
        return {
            'status': 401,
            'body': { 'error': 'Unauthorized', 'details': str(e) }
        }
    return await next_fn()
