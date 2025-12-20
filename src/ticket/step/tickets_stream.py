#!/usr/bin/python3

config = {
    "name": "tickets",
    "schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "subject": {"type": "string"},
            "status": {"type": "string"},
            "priority": {"type": ["string", "null"]},
            "team": {"type": ["string", "null"]},
            "agent": {"type": ["string", "null"]},
            "customer": {"type": ["string", "null"]},
            "creation": {"type": "string"},
            "modified": {"type": "string"}
        },
        "required": ["name", "subject", "status", "creation", "modified"]
    },
    "baseConfig": {"storageType": "default"}
}
