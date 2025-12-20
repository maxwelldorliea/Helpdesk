#!/usr/bin/python3

from src.management.store.customer import CustomerStore
from src.middleware.auth import auth
from src.models.models import Customer
from pydantic import ValidationError

config = {
    "name": "Update Customer",
    "type": "api",
    "method": "PUT",
    "description": "Update an existing customer",
    "path": "/management/customers/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    store = CustomerStore(supabase)
    try:
        customer_data = Customer(**req.get("body", {}))
        customer = store.update(id, customer_data.model_dump(exclude_unset=True))
        return {"status": 200, "body": customer}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
