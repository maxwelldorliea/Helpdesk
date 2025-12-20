#!/usr/bin/python3

from src.management.store.handle import HandleStore
from src.middleware.auth import auth

config = {
    "name": "Add Customer Handle",
    "type": "api",
    "method": "POST",
    "description": "Add a handle to a customer",
    "path": "/management/customers/:customer/handles",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    customer = req.get("pathParams", {}).get("customer")
    body = req.get("body", {})
    supabase = req['supabase']
    store = HandleStore(supabase)
    res = store.add_handle(customer, body.get("channel"), body.get("handle"))
    return {"status": 201, "body": res}
