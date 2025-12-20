#!/usr/bin/python3

from supabase import Client

class BaseStore:
    def __init__(self, supabase: Client, table_name: str):
        self.supabase = supabase
        self.table_name = table_name
        self.table = self.supabase.table(self.table_name)

    def get_all(self) -> list[dict]:
        res = self.table.select('*').execute()
        return res.data

    def get_all_filtered(self, col: str, val: any) -> list[dict]:
        res = self.table.select('*').eq(col, val).execute()
        return res.data

    def get_by_id(self, id_val: any, id_col: str = 'name') -> dict:
        res = self.table.select('*').eq(id_col, id_val).execute()
        return res.data[0] if res.data else {}

    def create(self, obj: dict) -> dict:
        res = self.table.insert(obj).execute()
        return res.data[0] if res.data else {}

    def update(self, id_val: any, obj: dict, id_col: str = 'name') -> dict:
        res = self.table.update(obj).eq(id_col, id_val).execute()
        return res.data[0] if res.data else {}

    def delete(self, id_val: any, id_col: str = 'name') -> dict:
        res = self.table.delete().eq(id_col, id_val).execute()
        return res.data[0] if res.data else {}
