#!/usr/bin/python3

from src.management.store.customer import CustomerStore
from src.middleware.auth import auth
from src.models.models import Customer
from pydantic import ValidationError

config = {
    "name": "Create Customer",
    "type": "api",
    "method": "POST",
    "description": "Create a new customer",
    "path": "/management/customers",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    supabase = req['supabase']
    store = CustomerStore(supabase)
    try:
        customer_data = Customer(**req.get("body", {}))
        res = store.create(customer_data.model_dump(exclude_unset=True))
        return {"status": 201, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
