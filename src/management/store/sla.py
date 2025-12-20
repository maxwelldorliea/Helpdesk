#!/usr/bin/python3

from src.management.store.base import BaseStore

class SLAStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'SLA')

    def get_by_priority(self, priority: str):
        return self.get_all_filtered('priority', priority)
