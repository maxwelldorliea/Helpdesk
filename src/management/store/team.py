#!/usr/bin/python3

from src.management.store.base import BaseStore

class TeamStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'Team')
