#!/usr/bin/python3

config = {
    "name": "communications",
    "schema": {
        "type": "object",
        "properties": {
            "id": {"type": "string"},
            "ticket": {"type": "string"},
            "body": {"type": "string"},
            "direction": {"type": "string"},
            "creation": {"type": "string"},
            "raised_by": {"type": "string"},
            "channel": {"type": ["string", "null"]},
            "attachments": {"type": ["object", "null"]}
        },
        "required": ["id", "ticket", "body", "direction", "creation", "raised_by"]
    },
    "baseConfig": {"storageType": "default"}
}
