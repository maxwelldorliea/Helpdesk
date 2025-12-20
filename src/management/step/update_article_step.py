#!/usr/bin/python3

from src.management.store.kb import KBStore
from src.middleware.auth import auth
from src.models.models import KnowledgeBaseArticle
from pydantic import ValidationError

config = {
    "name": "Update Article",
    "type": "api",
    "method": "PUT",
    "description": "Update an existing knowledge base article",
    "path": "/management/kb/:id",
    "middleware": [auth],
    "emits": [],
    "flows": ["HelpDesk"]
}


async def handler(req, ctx):
    id = req.get("pathParams", {}).get("id")
    supabase = req['supabase']
    store = KBStore(supabase)
    try:
        article_data = KnowledgeBaseArticle(**req.get("body", {}))
        res = store.update(id, article_data.model_dump(exclude_unset=True), 'id')
        return {"status": 200, "body": res}
    except ValidationError as e:
        return {"status": 400, "body": {"error": e.errors()}}
