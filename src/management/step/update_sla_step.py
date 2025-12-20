#!/usr/bin/python3

from src.management.store.sla import SLAStore
from src.middleware.auth import auth
from src.models.models import SLA
from pydantic import ValidationError

config = {
    "name": "Update SLA",
    "type": "api",
    "method": "PUT",
    "description": "Update an existing SLA",
    "path": "/management/slas/:name",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    name = req.get("pathParams", {}).get("name")
    supabase = req['supabase']
    store = SLAStore(supabase)
    try:
        sla_data = SLA(**req.get("body", {}))
        res = store.update(name, sla_data.model_dump(exclude_unset=True))
        return {"status": 200, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
