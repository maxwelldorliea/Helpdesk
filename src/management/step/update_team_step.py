#!/usr/bin/python3

from src.management.store.team import TeamStore
from src.middleware.auth import auth
from src.models.models import Team
from pydantic import ValidationError

config = {
    "name": "Update Team",
    "type": "api",
    "method": "PUT",
    "description": "Update an existing team",
    "path": "/management/teams/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    name = req.get("pathParams", {}).get("name")
    supabase = req['supabase']
    store = TeamStore(supabase)
    try:
        team_data = Team(**req.get("body", {}))
        res = store.update(name, team_data.model_dump(exclude_unset=True))
        return {"status": 200, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
