"""
LangGraph Tools for AI-First CRM HCP Module
============================================
Five tools for the LangGraph agent managing HCP interactions:
1. log_interaction     – Capture & AI-summarize a new interaction
2. edit_interaction    – Modify an existing logged interaction
3. search_hcp          – Search healthcare professionals by name/specialty
4. get_followup_suggestions – AI-generated next-step recommendations
5. analyze_sentiment   – Infer HCP sentiment from interaction text
"""

import json
from typing import Optional
from langchain_core.tools import tool
from database.db import SessionLocal
from database.models import HCP, Interaction, SentimentEnum


# ─────────────────────────────────────────────────────────────
# TOOL 1: Log Interaction
# ─────────────────────────────────────────────────────────────
@tool
def log_interaction(
    hcp_name: str,
    interaction_type: str,
    date: str,
    topics_discussed: str,
    time: Optional[str] = None,
    attendees: Optional[str] = None,
    materials_shared: Optional[str] = None,
    samples_distributed: Optional[str] = None,
    outcomes: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
    raw_chat_input: Optional[str] = None,
) -> str:
    """
    Log a new HCP interaction to the database.
    Uses the LLM (via the agent) to generate an AI summary and extract entities
    from the raw input before saving. Returns the saved interaction ID and details.

    Args:
        hcp_name: Full name of the Healthcare Professional (e.g., 'Dr. Anika Sharma')
        interaction_type: Type such as 'Meeting', 'Call', 'Email', 'Conference'
        date: Date of interaction in YYYY-MM-DD format
        topics_discussed: Key topics discussed during the interaction
        time: Time of interaction (optional)
        attendees: Comma-separated names of attendees (optional)
        materials_shared: Comma-separated list of materials/brochures shared (optional)
        samples_distributed: Comma-separated list of samples given (optional)
        outcomes: Key outcomes or agreements reached (optional)
        follow_up_actions: Next steps or tasks (optional)
        raw_chat_input: Original unstructured chat text if logged via chat (optional)
    """
    db = SessionLocal()
    try:
        # Find HCP in database (flexible match)
        hcp = db.query(HCP).filter(
            HCP.name.ilike(f"%{hcp_name.replace('Dr.', '').strip()}%")
        ).first()
        hcp_id = hcp.id if hcp else None

        # Parse list fields
        materials = [m.strip() for m in materials_shared.split(",")] if materials_shared else []
        samples = [s.strip() for s in samples_distributed.split(",")] if samples_distributed else []

        # Build AI summary (will be enriched by LLM in the agent loop)
        summary_parts = []
        if topics_discussed:
            summary_parts.append(f"Discussed: {topics_discussed}")
        if outcomes:
            summary_parts.append(f"Outcomes: {outcomes}")
        if materials:
            summary_parts.append(f"Materials shared: {', '.join(materials)}")
        ai_summary = " | ".join(summary_parts)

        interaction = Interaction(
            hcp_id=hcp_id,
            hcp_name=hcp_name,
            interaction_type=interaction_type,
            date=date,
            time=time or "",
            attendees=attendees or "",
            topics_discussed=topics_discussed,
            materials_shared=materials,
            samples_distributed=samples,
            sentiment=SentimentEnum.neutral,
            outcomes=outcomes or "",
            follow_up_actions=follow_up_actions or "",
            ai_summary=ai_summary,
            ai_suggested_followups=[],
            logged_via="chat" if raw_chat_input else "form",
            raw_chat_input=raw_chat_input or "",
        )

        db.add(interaction)
        db.commit()
        db.refresh(interaction)

        return json.dumps({
            "success": True,
            "interaction_id": interaction.id,
            "message": f"Interaction with {hcp_name} logged successfully (ID: {interaction.id})",
            "hcp_found_in_db": hcp_id is not None,
        })
    except Exception as e:
        db.rollback()
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# TOOL 2: Edit Interaction
# ─────────────────────────────────────────────────────────────
@tool
def edit_interaction(
    interaction_id: int,
    field_to_update: str,
    new_value: str,
) -> str:
    """
    Edit/modify a specific field of an already-logged HCP interaction.
    Only the specified field is updated; all other data remains unchanged.
    Returns a confirmation with old and new values for audit trail.

    Args:
        interaction_id: The numeric ID of the interaction to edit
        field_to_update: Field name to update. Valid fields: 'topics_discussed',
                        'outcomes', 'follow_up_actions', 'sentiment', 'attendees',
                        'materials_shared', 'samples_distributed', 'interaction_type'
        new_value: The new value to set for the field
    """
    ALLOWED_FIELDS = {
        "topics_discussed", "outcomes", "follow_up_actions",
        "sentiment", "attendees", "interaction_type",
        "materials_shared", "samples_distributed"
    }

    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return json.dumps({"success": False, "error": f"Interaction ID {interaction_id} not found."})

        if field_to_update not in ALLOWED_FIELDS:
            return json.dumps({
                "success": False,
                "error": f"Field '{field_to_update}' cannot be edited. Allowed: {list(ALLOWED_FIELDS)}"
            })

        old_value = getattr(interaction, field_to_update)

        # Handle list-type fields
        if field_to_update in ("materials_shared", "samples_distributed"):
            new_val = [v.strip() for v in new_value.split(",")]
            setattr(interaction, field_to_update, new_val)
        elif field_to_update == "sentiment":
            if new_value.lower() not in ("positive", "neutral", "negative"):
                return json.dumps({"success": False, "error": "Sentiment must be positive, neutral, or negative."})
            setattr(interaction, field_to_update, SentimentEnum(new_value.lower()))
        else:
            setattr(interaction, field_to_update, new_value)

        db.commit()
        return json.dumps({
            "success": True,
            "interaction_id": interaction_id,
            "field_updated": field_to_update,
            "old_value": str(old_value),
            "new_value": new_value,
            "message": f"Interaction {interaction_id} updated: {field_to_update} changed successfully.",
        })
    except Exception as e:
        db.rollback()
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# TOOL 3: Search HCP
# ─────────────────────────────────────────────────────────────
@tool
def search_hcp(query: str) -> str:
    """
    Search for Healthcare Professionals (HCPs) in the database by name or specialty.
    Returns a list of matching HCPs with their details to help the rep select
    the correct HCP when logging an interaction.

    Args:
        query: Search term - can be partial HCP name, specialty, or hospital name
               (e.g., 'Sharma', 'Oncology', 'Apollo')
    """
    db = SessionLocal()
    try:
        results = db.query(HCP).filter(
            (HCP.name.ilike(f"%{query}%")) |
            (HCP.specialty.ilike(f"%{query}%")) |
            (HCP.hospital.ilike(f"%{query}%"))
        ).limit(5).all()

        if not results:
            return json.dumps({
                "success": True,
                "count": 0,
                "message": f"No HCPs found matching '{query}'.",
                "hcps": []
            })

        hcps_data = [
            {
                "id": h.id,
                "name": h.name,
                "specialty": h.specialty,
                "hospital": h.hospital,
                "email": h.email,
            }
            for h in results
        ]

        return json.dumps({
            "success": True,
            "count": len(hcps_data),
            "hcps": hcps_data,
            "message": f"Found {len(hcps_data)} HCP(s) matching '{query}'."
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# TOOL 4: Get Follow-up Suggestions
# ─────────────────────────────────────────────────────────────
@tool
def get_followup_suggestions(interaction_id: int) -> str:
    """
    Retrieve AI-powered follow-up action suggestions for a specific interaction.
    Analyzes the interaction's topics, outcomes, and sentiment to generate
    actionable next steps for the field representative.
    Returns a list of specific, time-bound follow-up recommendations.

    Args:
        interaction_id: The numeric ID of the interaction to generate suggestions for
    """
    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return json.dumps({"success": False, "error": f"Interaction ID {interaction_id} not found."})

        # Rule-based + stored suggestions
        suggestions = list(interaction.ai_suggested_followups or [])

        # Add context-aware suggestions based on interaction data
        if interaction.sentiment == SentimentEnum.positive:
            suggestions.append("Schedule follow-up meeting within 2 weeks to maintain momentum")
            suggestions.append("Send thank-you note with additional clinical data requested")
        elif interaction.sentiment == SentimentEnum.negative:
            suggestions.append("Schedule a call with medical affairs team to address concerns raised")
            suggestions.append("Prepare tailored objection-handling materials for next visit")
        else:
            suggestions.append("Send meeting summary email with key discussion points")
            suggestions.append("Schedule next touchpoint in 3-4 weeks")

        if interaction.samples_distributed:
            suggestions.append(f"Follow up on feedback for samples: {', '.join(interaction.samples_distributed)}")

        if interaction.materials_shared:
            suggestions.append("Check if shared materials were reviewed; offer to clarify any questions")

        # Save back to DB
        interaction.ai_suggested_followups = suggestions[:5]
        db.commit()

        return json.dumps({
            "success": True,
            "interaction_id": interaction_id,
            "hcp_name": interaction.hcp_name,
            "suggestions": suggestions[:5],
            "message": f"Generated {len(suggestions[:5])} follow-up suggestions for interaction with {interaction.hcp_name}."
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# TOOL 5: Analyze Sentiment
# ─────────────────────────────────────────────────────────────
@tool
def analyze_sentiment(interaction_id: int, text_to_analyze: Optional[str] = None) -> str:
    """
    Analyze the HCP's sentiment from the interaction's topics, outcomes, and notes.
    Updates the interaction record with the inferred sentiment classification
    (positive, neutral, or negative) based on keyword signals and context.
    This helps field reps gauge receptiveness and tailor future engagement strategies.

    Args:
        interaction_id: The numeric ID of the interaction to analyze
        text_to_analyze: Optional additional text to include in sentiment analysis.
                        If not provided, uses the interaction's stored topics and outcomes.
    """
    db = SessionLocal()
    try:
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            return json.dumps({"success": False, "error": f"Interaction ID {interaction_id} not found."})

        # Gather all text for analysis
        text_corpus = " ".join(filter(None, [
            interaction.topics_discussed or "",
            interaction.outcomes or "",
            interaction.follow_up_actions or "",
            text_to_analyze or "",
            interaction.raw_chat_input or "",
        ])).lower()

        # Keyword-based sentiment signals (LLM will refine this in the agent)
        positive_keywords = [
            "interested", "positive", "agreed", "enthusiastic", "supportive",
            "impressed", "happy", "great", "excellent", "willing", "approved",
            "receptive", "open", "excited", "committed", "confirmed"
        ]
        negative_keywords = [
            "concerned", "resistant", "skeptical", "doubt", "refuse", "rejected",
            "negative", "unhappy", "frustrated", "issue", "problem", "complaint",
            "not interested", "avoid", "competitor", "dissatisfied"
        ]

        pos_count = sum(1 for kw in positive_keywords if kw in text_corpus)
        neg_count = sum(1 for kw in negative_keywords if kw in text_corpus)

        if pos_count > neg_count:
            inferred = "positive"
        elif neg_count > pos_count:
            inferred = "negative"
        else:
            inferred = "neutral"

        # Update in DB
        interaction.sentiment = SentimentEnum(inferred)
        db.commit()

        return json.dumps({
            "success": True,
            "interaction_id": interaction_id,
            "hcp_name": interaction.hcp_name,
            "inferred_sentiment": inferred,
            "positive_signals": pos_count,
            "negative_signals": neg_count,
            "message": f"Sentiment for interaction {interaction_id} analyzed and updated to '{inferred}'.",
            "recommendation": (
                "Continue engagement proactively." if inferred == "positive"
                else "Address concerns before next visit." if inferred == "negative"
                else "Nurture relationship with educational content."
            )
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# Export all tools as a list for the LangGraph agent
ALL_TOOLS = [
    log_interaction,
    edit_interaction,
    search_hcp,
    get_followup_suggestions,
    analyze_sentiment,
]
