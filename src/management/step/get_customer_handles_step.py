#!/usr/bin/python3

from src.management.store.handle import HandleStore
from src.middleware.auth import auth

config = {
    "name": "Get Customer Handles",
    "type": "api",
    "method": "GET",
    "description": "Get all handles of a specific customer",
    "path": "/management/customers/:customer/handles",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    customer = req.get("pathParams", {}).get("customer")
    supabase = req['supabase']
    store = HandleStore(supabase)
    handles = store.get_by_customer(customer)
    return {"status": 200, "body": handles}
