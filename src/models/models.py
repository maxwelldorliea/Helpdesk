#!/usr/bin/python3

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timedelta
from enum import Enum
import uuid


PgInterval = timedelta
ContactInfo = EmailStr | str

class TicketStatus(str, Enum):
    OPEN = 'Open'
    REPLIED = 'Replied'
    RESOLVED = 'Resolved'
    CLOSED = 'Closed'

class AgreementStatus(str, Enum):
    FIRST_RESPONSE_DUE = 'First Response Due'
    RESOLUTION_DUE = 'Resolution Due'
    FAILED = 'Failed'
    FULFILLED = 'Fulfilled'
    PAUSED = 'Paused'

class CommunicationDirection(str, Enum):
    INBOUND = 'Inbound'
    OUTBOUND = 'Outbound'
    SYSTEM = 'System'
    ESCALATION = 'Escalation'

class Channel(BaseModel):
    name: str = Field(max_length=50)
    description: str | None = None
    icon_slug: str | None = Field(None, max_length=50)
    is_active: bool = True

    model_config = {"from_attributes": True}

class Customer(BaseModel):
    name: str = Field(max_length=140)
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    organization: str | None = None
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}

class CustomerHandle(BaseModel):
    id: int | None = None
    customer: str = Field(max_length=140)
    channel: str = Field(max_length=50)
    handle: str = Field(max_length=140)
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}

class TicketBase(BaseModel):
    subject: str = Field(max_length=140)
    description: str
    raised_by: ContactInfo
    channel: str = Field('Email')
    customer: str | None = None

class TicketCreate(TicketBase):
    priority: str | None = None
    agent_group: str | None = None


class Ticket(TicketBase):
    name: str = Field(max_length=140)
    owner: str = Field(max_length=140)
    external_thread_id: str | None = Field(None, max_length=255)
    creation: datetime
    modified: datetime
    status: TicketStatus = TicketStatus.OPEN
    priority: str | None
    agent_group: str | None
    assigned_agent: uuid.UUID | None
    resolution_date: datetime | None
    resolved_by_bot: bool = False
    resolved_by_agent: uuid.UUID | None
    sla_name: str | None
    agreement_status: AgreementStatus | None = None
    response_by: datetime | None
    resolution_by: datetime | None
    total_hold_time: PgInterval | None
    escalation_count: int = 0

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            timedelta: lambda v: str(v)
        }
    }


class CommunicationBase(BaseModel):
    ticket: str
    body: str
    direction: CommunicationDirection
    channel: str | None
    attachments: dict | None = None

class CommunicationCreate(CommunicationBase):
    sender: uuid.UUID | None
    raised_by: ContactInfo

class Communication(CommunicationBase):
    name: str = Field(max_length=140)
    creation: datetime
    modified: datetime
    event_type: str | None

    model_config = {"from_attributes": True}


class SLA(BaseModel):
    name: str = Field(max_length=140)
    priority_name: str = Field(max_length=140)
    description: str | None
    first_response_time: PgInterval | None
    resolution_time: PgInterval | None
    applies_to_contract_group: str | None
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}


class Priority(BaseModel):
    name: str = Field(max_length=140)
    description: str | None
    color_code: str | None = Field(None, max_length=7)
    sort_order: int | None
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}


class Team(BaseModel):
    name: str = Field(max_length=140)
    description: str | None
    escalation_team: str | None = Field(None, max_length=140)
    last_assigned_agent: uuid.UUID | None
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}


class Role(BaseModel):
    user_id: uuid.UUID
    name: str = Field(max_length=50)
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}


class AgentMembership(BaseModel):
    id: int
    user_id: uuid.UUID
    team: str = Field(max_length=140)
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}


class KnowledgeBaseArticle(BaseModel):
    name: str = Field(max_length=140)
    title: str = Field(max_length=255)
    content: str
    category: str | None = None
    is_public: bool = False
    creation: datetime
    modified: datetime

    model_config = {"from_attributes": True}

class Attachment(BaseModel):
    filename: str
    mime_type: str
    size_bytes: int
    data: str

class InboundEmail(BaseModel):
    unique_id: str
    subject: str
    body_text: str
    sender_email: EmailStr
    sender_name: str | None = None
    received_at: datetime | None
    message_id: str
    in_reply_to: str | None = None
    references: list[str] = Field(default_factory=list)
    raw_headers: dict[str, str] = Field(default_factory=dict)
    attachments: list[Attachment] = Field(default_factory=list)
