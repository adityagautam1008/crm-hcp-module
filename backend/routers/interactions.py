from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.db import get_db
from database.models import Interaction, HCP, SentimentEnum
from schemas import InteractionCreate, InteractionUpdate, InteractionOut, HCPOut, ChatMessage, AgentResponse
from agent.graph import run_agent
import json

router = APIRouter()


# ─── HCP Endpoints ────────────────────────────────────────────

@router.get("/hcps", response_model=List[HCPOut], tags=["HCPs"])
def list_hcps(search: str = "", db: Session = Depends(get_db)):
    """Search/list all HCPs in the database."""
    query = db.query(HCP)
    if search:
        query = query.filter(
            (HCP.name.ilike(f"%{search}%")) |
            (HCP.specialty.ilike(f"%{search}%")) |
            (HCP.hospital.ilike(f"%{search}%"))
        )
    return query.limit(20).all()


@router.get("/hcps/{hcp_id}", response_model=HCPOut, tags=["HCPs"])
def get_hcp(hcp_id: int, db: Session = Depends(get_db)):
    hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp


# ─── Interaction Endpoints ────────────────────────────────────

@router.get("/interactions", response_model=List[InteractionOut], tags=["Interactions"])
def list_interactions(db: Session = Depends(get_db)):
    """Get all logged interactions, newest first."""
    return db.query(Interaction).order_by(Interaction.created_at.desc()).all()


@router.get("/interactions/{interaction_id}", response_model=InteractionOut, tags=["Interactions"])
def get_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


@router.post("/interactions", response_model=InteractionOut, tags=["Interactions"])
def create_interaction(payload: InteractionCreate, db: Session = Depends(get_db)):
    """Create a new interaction via the structured form."""
    # Find HCP
    hcp = None
    if payload.hcp_id:
        hcp = db.query(HCP).filter(HCP.id == payload.hcp_id).first()

    interaction = Interaction(
        hcp_id=payload.hcp_id,
        hcp_name=payload.hcp_name,
        interaction_type=payload.interaction_type,
        date=payload.date,
        time=payload.time or "",
        attendees=payload.attendees or "",
        topics_discussed=payload.topics_discussed or "",
        materials_shared=payload.materials_shared or [],
        samples_distributed=payload.samples_distributed or [],
        sentiment=SentimentEnum(payload.sentiment) if payload.sentiment else SentimentEnum.neutral,
        outcomes=payload.outcomes or "",
        follow_up_actions=payload.follow_up_actions or "",
        ai_summary="",
        ai_suggested_followups=[],
        logged_via=payload.logged_via or "form",
        raw_chat_input=payload.raw_chat_input or "",
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.put("/interactions/{interaction_id}", response_model=InteractionOut, tags=["Interactions"])
def update_interaction(interaction_id: int, payload: InteractionUpdate, db: Session = Depends(get_db)):
    """Update an existing interaction."""
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if key == "sentiment" and val:
            setattr(interaction, key, SentimentEnum(val))
        else:
            setattr(interaction, key, val)

    db.commit()
    db.refresh(interaction)
    return interaction


@router.delete("/interactions/{interaction_id}", tags=["Interactions"])
def delete_interaction(interaction_id: int, db: Session = Depends(get_db)):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(interaction)
    db.commit()
    return {"message": f"Interaction {interaction_id} deleted successfully."}


# ─── AI Chat Endpoint ─────────────────────────────────────────

@router.post("/agent/chat", response_model=AgentResponse, tags=["AI Agent"])
async def chat_with_agent(payload: ChatMessage):
    """
    Chat with the LangGraph AI agent.
    The agent can log interactions, edit them, search HCPs,
    analyze sentiment, and suggest follow-ups — all via natural language.
    """
    try:
        result = await run_agent(
            user_message=payload.message,
            conversation_history=payload.conversation_history
        )
        return AgentResponse(
            response=result["response"],
            tool_used=result.get("tool_used"),
            data=None,
            form_data=result.get("form_data", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


# ─── Direct Tool Endpoints (for demo/testing) ─────────────────

@router.post("/tools/search-hcp", tags=["Tools"])
async def tool_search_hcp(query: str):
    """Directly invoke the search_hcp tool."""
    from agent.tools import search_hcp
    result = search_hcp.invoke({"query": query})
    return json.loads(result)


@router.post("/tools/analyze-sentiment/{interaction_id}", tags=["Tools"])
async def tool_analyze_sentiment(interaction_id: int, text: str = ""):
    """Directly invoke the analyze_sentiment tool."""
    from agent.tools import analyze_sentiment
    result = analyze_sentiment.invoke({
        "interaction_id": interaction_id,
        "text_to_analyze": text
    })
    return json.loads(result)


@router.post("/tools/followup-suggestions/{interaction_id}", tags=["Tools"])
async def tool_followup_suggestions(interaction_id: int):
    """Directly invoke the get_followup_suggestions tool."""
    from agent.tools import get_followup_suggestions
    result = get_followup_suggestions.invoke({"interaction_id": interaction_id})
    return json.loads(result)
