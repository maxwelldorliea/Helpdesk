#!/usr/bin/python3

from src.management.store.customer import CustomerStore
from src.middleware.auth import auth

config = {
    "name": "Delete Customer",
    "type": "api",
    "method": "DELETE",
    "description": "Delete an existing customer",
    "path": "/management/customers/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    name = req.get("pathParams", {}).get("name")
    supabase = req['supabase']
    store = CustomerStore(supabase)
    res = store.delete(name)
    return {"status": 200, "body": res}
