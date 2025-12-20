#!/usr/bin/python3

from src.management.store.priority import PriorityStore
from src.middleware.auth import auth
from src.models.models import Priority
from pydantic import ValidationError

config = {
    "name": "Create Priority",
    "type": "api",
    "method": "POST",
    "description": "Create a new ticket priority",
    "path": "/management/priorities",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    supabase = req['supabase']
    store = PriorityStore(supabase)
    try:
        priority_data = Priority(**req.get("body", {}))
        res = store.create(priority_data.model_dump(exclude_unset=True))
        return {"status": 201, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
