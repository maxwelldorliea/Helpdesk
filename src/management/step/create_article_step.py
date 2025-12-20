#!/usr/bin/python3

from src.management.store.kb import KBStore
from src.middleware.auth import auth
from src.models.models import KnowledgeBaseArticle
from pydantic import ValidationError

config = {
    "name": "Create Article",
    "type": "api",
    "method": "POST",
    "description": "Create a new knowledge base article",
    "path": "/management/kb",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    supabase = req['supabase']
    store = KBStore(supabase)
    try:
        article_data = KnowledgeBaseArticle(**req.get("body", {}))
        res = store.create(article_data.model_dump(exclude_unset=True))
        return {"status": 201, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
