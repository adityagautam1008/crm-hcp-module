from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class SentimentEnum(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    specialty = Column(String(255))
    hospital = Column(String(255))
    email = Column(String(255), unique=True)
    phone = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, nullable=False, index=True)
    hcp_name = Column(String(255), nullable=False)
    interaction_type = Column(String(100), nullable=False)
    date = Column(String(20), nullable=False)
    time = Column(String(20))
    attendees = Column(Text)
    topics_discussed = Column(Text)
    ai_summary = Column(Text)
    materials_shared = Column(JSON, default=list)
    samples_distributed = Column(JSON, default=list)
    sentiment = Column(Enum(SentimentEnum), default=SentimentEnum.neutral)
    outcomes = Column(Text)
    follow_up_actions = Column(Text)
    ai_suggested_followups = Column(JSON, default=list)
    logged_via = Column(String(50), default="form")  # 'form' or 'chat'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    raw_chat_input = Column(Text)
