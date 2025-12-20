#!/usr/bin/python3

from src.management.store.customer import CustomerStore
from src.middleware.auth import auth

config = {
    "name": "Get Customers",
    "type": "api",
    "method": "GET",
    "description": "Get all customers",
    "path": "/management/customers",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}

async def handler(req, ctx):
    supabase = req['supabase']
    store = CustomerStore(supabase)
    query_params = req.get('queryParams', {})
    search = query_params.get('search')
    if search:
        res = supabase.table('Customer').select('*').or_(f"name.ilike.%{search}%,full_name.ilike.%{search}%").execute()
        customers = res.data
    else:
        customers = store.get_all()
    return {
        "status": 200,
        "body": {
            "data": customers,
            "total": len(customers),
            "page": 1,
            "limit": len(customers)
        }
    }
