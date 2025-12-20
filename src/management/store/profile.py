#!/usr/bin/python3

from src.management.store.base import BaseStore

class ProfileStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'Profile')

    def get_by_id(self, id: str) -> dict:
        try:
            res = self.supabase.table(self.table_name).select('*').eq('id', id).execute()
            return res.data[0] if res.data else {}
        except Exception:
            return {}

    def update(self, id: str, obj: dict) -> dict:
        existing = self.get_by_id(id)
        if not existing:
            obj['id'] = id
            return self.create(obj)
        return super().update(id, obj, id_col='id')
