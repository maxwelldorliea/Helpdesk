from datetime import datetime, timezone
from pydantic import BaseModel


class GreetingInput(BaseModel):
    timestamp: str
    appName: str
    greetingPrefix: str
    requestId: str

config = {
    "name": "ProcessGreeting",
    "type": "event",
    "description": "Processes greeting in the background",
    "subscribes": ["process-greeting"],
    "emits": [],
    "flows": ["hello-world-flow"],
    "input": GreetingInput.model_json_schema()
}

async def handler(input_data, context):
    timestamp = input_data.get("timestamp")
    app_name = input_data.get("appName")
    greeting_prefix = input_data.get("greetingPrefix")
    request_id = input_data.get("requestId")

    context.logger.info("Processing greeting", {
        "request_id": request_id,
        "app_name": app_name
    })

    greeting = f"{greeting_prefix} {app_name}!"

    await context.state.set("greetings", request_id, {
        "greeting": greeting,
        "processedAt": datetime.now(timezone.utc).isoformat(),
        "originalTimestamp": timestamp
    })

    context.logger.info("Greeting processed successfully", {
        "request_id": request_id,
        "greeting": greeting,
        "stored_in_state": True
    })
