#!/usr/bin/python3

from src.management.store.priority import PriorityStore
from src.middleware.auth import auth
from src.models.models import Priority
from pydantic import ValidationError

config = {
    "name": "Update Priority",
    "type": "api",
    "method": "PUT",
    "description": "Update an existing ticket priority",
    "path": "/management/priorities/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    store = PriorityStore(supabase)
    try:
        priority_data = Priority(**req.get("body", {}))
        priority = store.update(id, priority_data.model_dump(exclude_unset=True))
        return {"status": 200, "body": priority}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
