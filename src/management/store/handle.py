#!/usr/bin/python3

from src.management.store.base import BaseStore

class HandleStore(BaseStore):
    def __init__(self, supabase):
        super().__init__(supabase, 'Customer_Handle')

    def get_by_customer(self, customer_name: str):
        return self.get_all_filtered('customer', customer_name)

    def add_handle(self, customer_name: str, channel: str, handle: str):
        return self.create({
            "customer": customer_name,
            "channel": channel,
            "handle": handle
        })
