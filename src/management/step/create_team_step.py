#!/usr/bin/python3

from src.management.store.team import TeamStore
from src.middleware.auth import auth
from src.models.models import Team
from pydantic import ValidationError

config = {
    "name": "Create Team",
    "type": "api",
    "method": "POST",
    "description": "Create a new team",
    "path": "/management/teams",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    supabase = req['supabase']
    store = TeamStore(supabase)
    try:
        team_data = Team(**req.get("body", {}))
        res = store.create(team_data.model_dump(exclude_unset=True))
        return {"status": 201, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
