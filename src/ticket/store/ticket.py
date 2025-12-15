#!/usr/bin/python3

import os
from supabase import create_client, Client

class Ticket:
    def __init__(self):
        supabase_url = os.environ.get('SUPABASE_URL')
        if not supabase_url:
            raise ValueError('ENV SUPABASE_URL is required')
        supabase_key = os.environ.get('SUPABASE_KEY')
        if not supabase_key:
            raise ValueError('ENV SUPABASE_KEY is required')
        self.supabase: Client = create_client(supabase_url, supabase_key)

    def get_by_id(self, id: str) -> dict:
        res = self.supabase.table('Ticket')\
        .select('*', 'Communication(*)').eq('name', id).execute()
        return res.json()

    def get_all(self) -> list[dict]:
        res = self.supabase.table('Ticket')\
        .select('*', 'Communication(*)').execute()
        return res.json()
