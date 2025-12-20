#!/usr/bin/python3

config = {
    "name": "ticket_events",
    "schema": {
        "type": "object",
        "properties": {
            "ticket_id": {"type": "string"},
            "event": {"type": "string"},
            "message": {"type": "string"},
            "timestamp": {"type": "string"}
        },
        "required": ["ticket_id", "event", "message", "timestamp"]
    },
    "baseConfig": {"storageType": "default"}
}
