#!/usr/bin/python3

from src.management.store.base import BaseStore

class KBStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'Knowledge_Base')

    def get_by_id(self, id_val: any, id_col: str = 'id') -> dict:
        return super().get_by_id(id_val, id_col)

    def update(self, id_val: any, obj: dict, id_col: str = 'id') -> dict:
        return super().update(id_val, obj, id_col)

    def delete(self, id_val: any, id_col: str = 'id') -> dict:
        return super().delete(id_val, id_col)
