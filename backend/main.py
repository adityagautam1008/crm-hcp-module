"""
AI-First CRM HCP Module – Backend API
=======================================
FastAPI + LangGraph + Groq (gemma2-9b-it)
Author: Assignment Submission
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.db import init_db
from routers.interactions import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    print("🚀 Initializing database...")
    init_db()
    print("✅ Database ready. CRM HCP API is live.")
    yield
    print("🔒 Shutting down CRM HCP API.")


app = FastAPI(
    title="AI-First CRM – HCP Module API",
    description="""
## AI-First CRM HCP Module

Backend API for the Healthcare Professional (HCP) interaction management system.

### Features
- **LangGraph Agent** powered by Groq (gemma2-9b-it)
- **5 AI Tools**: Log Interaction, Edit Interaction, Search HCP, Follow-up Suggestions, Sentiment Analysis
- **Dual Input**: Structured form OR conversational chat
- **PostgreSQL** database for persistent storage

### Tools
| Tool | Description |
|------|-------------|
| `log_interaction` | Capture & AI-summarize HCP interactions |
| `edit_interaction` | Modify logged interaction fields |
| `search_hcp` | Find HCPs by name/specialty/hospital |
| `get_followup_suggestions` | AI-generated next steps |
| `analyze_sentiment` | Infer HCP receptiveness from text |
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes under /api/v1
app.include_router(router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "live",
        "app": "AI-First CRM HCP Module",
        "version": "1.0.0",
        "docs": "/docs",
        "agent": "LangGraph + Groq gemma2-9b-it",
        "tools": [
            "log_interaction",
            "edit_interaction",
            "search_hcp",
            "get_followup_suggestions",
            "analyze_sentiment",
        ]
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
