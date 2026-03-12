from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class HCPOut(HCPBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InteractionCreate(BaseModel):
    hcp_id: Optional[int] = None
    hcp_name: str
    interaction_type: str
    date: str
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = []
    samples_distributed: Optional[List[str]] = []
    sentiment: Optional[str] = "neutral"
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None
    logged_via: Optional[str] = "form"
    raw_chat_input: Optional[str] = None


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    interaction_type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    attendees: Optional[str] = None
    topics_discussed: Optional[str] = None
    materials_shared: Optional[List[str]] = None
    samples_distributed: Optional[List[str]] = None
    sentiment: Optional[str] = None
    outcomes: Optional[str] = None
    follow_up_actions: Optional[str] = None


class InteractionOut(InteractionCreate):
    id: int
    ai_summary: Optional[str] = None
    ai_suggested_followups: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []


class AgentResponse(BaseModel):
    response: str
    tool_used: Optional[str] = None
    data: Optional[Any] = None
    interaction_id: Optional[int] = None
    form_data: Optional[dict] = None
