#!/usr/bin/python3

from src.management.store.base import BaseStore

class SettingsStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'System_Settings')

    def get_global(self) -> dict:
        return self.get_by_id('GLOBAL', 'name')

    def update_global(self, obj: dict) -> dict:
        return self.update('GLOBAL', obj, 'name')
