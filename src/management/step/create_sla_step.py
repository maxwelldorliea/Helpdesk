#!/usr/bin/python3

from src.management.store.sla import SLAStore
from src.middleware.auth import auth
from src.models.models import SLA
from pydantic import ValidationError

config = {
    "name": "Create SLA",
    "type": "api",
    "method": "POST",
    "description": "Create a new SLA",
    "path": "/management/slas",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    supabase = req['supabase']
    store = SLAStore(supabase)
    try:
        sla_data = SLA(**req.get("body", {}))
        res = store.create(sla_data.model_dump(exclude_unset=True))
        return {"status": 201, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
