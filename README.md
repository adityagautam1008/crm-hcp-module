# AI-First CRM – HCP Interaction Module

A full-stack, AI-powered CRM system for Life Sciences field representatives to log and manage Healthcare Professional (HCP) interactions. Built with React + Redux, FastAPI, LangGraph and Groq (llama-3.1-8b).


*********************************************************************************************
TO RUN BACKEND -:
1. OPEN TERMINAL 
" cd backend "
" source venv/bin/activate     
python -m uvicorn main:app --reload --port 8000 " 
2. THIS WILL RUN THE BACKEND AND NOW TO RUN THE FRONTEND 
" cd frontend "
" npm start "
3. FOR MORE DETAIL YOU CAN DO THOUGH THIS FILE

*********************************************************************************************

 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Redux Toolkit, Lucide Icons |
| Styling | CSS-in-JS with Google Inter font |
| Backend | Python 3.11+, FastAPI |
| AI Agent | LangGraph (StateGraph / ReAct) |
| LLM | Groq – `gemma2-9b-it` (primary), `llama-3.3-70b-versatile` (fallback) |
| Database | PostgreSQL (via SQLAlchemy ORM) |
| State Mgmt | Redux Toolkit (interactionSlice + agentSlice) |

---

 🤖 LangGraph Agent & 5 Tools

The agent uses a **ReAct-style StateGraph** — it decides which tool to call based on the user's natural language input.

### Tool 1: `log_interaction` ✅
**Purpose:** Capture a new HCP interaction and save it to the database.

**How it works:**
- Takes structured fields (HCP name, type, date, topics, sentiment, etc.)
- The LLM extracts these from natural language input in the chat
- Performs entity extraction: HCP name, sentiment cues, products mentioned
- Generates an AI summary of the interaction
- Saves to `interactions` table with `logged_via = 'chat'` or `'form'`

**Example prompt:** *"Met Dr. Sharma, she was excited about OncoBoost efficacy data"*
→ Agent extracts: `hcp_name=Dr. Sharma`, `sentiment=positive`, `topics=OncoBoost efficacy`

---

### Tool 2: `edit_interaction` ✅
**Purpose:** Modify a specific field of an already-logged interaction.

**How it works:**
- Takes `interaction_id` + `field_to_update` + `new_value`
- Validates field is in the allowed editable set
- Stores old value for audit trail in the response
- Handles list fields (materials, samples) by parsing comma-separated values
- Returns old vs new value for confirmation

**Example prompt:** *"Update interaction 3, change outcomes to 'Dr. agreed to trial OncoBoost'"*

---

### Tool 3: `search_hcp` 🔍
**Purpose:** Search for Healthcare Professionals by name, specialty, or hospital.

**How it works:**
- Performs SQL ILIKE search across name, specialty, and hospital fields
- Returns top 5 matches with full HCP profile
- Used before logging to confirm correct HCP selection
- Helps reps avoid duplicate entries

**Example prompt:** *"Find cardiologists in our database"*

---

### Tool 4: `get_followup_suggestions` ✨
**Purpose:** Generate AI-powered follow-up action recommendations.

**How it works:**
- Fetches interaction by ID
- Analyzes sentiment, samples distributed, materials shared
- Generates context-aware suggestions (e.g., if positive → schedule follow-up in 2 weeks)
- Saves suggestions back to `ai_suggested_followups` field
- Returns up to 5 actionable, time-bound recommendations

**Example prompt:** *"What follow-up actions should I take for interaction 2?"*

---

### Tool 5: `analyze_sentiment` 📊
**Purpose:** Infer HCP sentiment from interaction text and update the record.

**How it works:**
- Collects all text from `topics_discussed`, `outcomes`, `follow_up_actions`, `raw_chat_input`
- Runs keyword-based signal detection (positive/negative lexicon)
- Calculates net sentiment score
- Updates `sentiment` field in DB
- Returns recommendation based on inferred sentiment

**Example prompt:** *"Analyze the sentiment of my last interaction with Dr. Mehta"*

---

## 🚀 Setup & Run (Mac)

### Prerequisites
- **IDE:** [Cursor](https://cursor.com) (recommended) or VS Code
- Node.js 18+ (`brew install node`)
- Python 3.11+ (`brew install python@3.11`)
- PostgreSQL (`brew install postgresql@16 && brew services start postgresql@16`)

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/crm-hcp-module.git
cd crm-hcp-module
```

### 2. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE crm_hcp_db;"
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
# Get it free from: https://console.groq.com/keys

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at: http://localhost:8000
API Docs (Swagger): http://localhost:8000/docs

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm start
```

The app will be live at: http://localhost:3000

---

## 🔑 Environment Variables

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:password@localhost:5432/crm_hcp_db
```

Get your free Groq API key at: https://console.groq.com/keys


 📱 Feature Walkthrough

 Dual Input Mode
| Mode | How it works |

| 📝 **Form Mode** | Structured fields with HCP search, date/time pickers, sentiment toggle, material/sample tags |
| 🤖 **Chat Mode** | Conversational AI — type naturally, agent extracts all fields automatically |


📂 Project Structure

```
crm-hcp-module/
├── README.md
├── backend/
│   ├── main.py                    # FastAPI app + CORS + lifespan
│   ├── requirements.txt
│   ├── .env
│   ├── database/
│   │   ├── __init__.py
│   │   ├── db.py                  # SQLAlchemy engine + seed data
│   │   └── models.py              # HCP + Interaction ORM models
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── graph.py               # LangGraph StateGraph (ReAct)
│   │   └── tools.py               # All 5 LangGraph tools
│   ├── schemas/
│   │   └── __init__.py            # Pydantic request/response models
│   └── routers/
│       └── interactions.py        # All API endpoints
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html             # Google Inter font
    └── src/
        ├── App.jsx
        ├── index.js
        ├── store/
        │   ├── index.js           # Redux store
        │   └── slices/
        │       ├── interactionSlice.js   # Form + interactions state
        │       └── agentSlice.js         # Chat/agent state
        ├── components/
        │   ├── LogInteractionScreen.jsx  # Main screen (3-panel layout)
        │   ├── FormMode.jsx              # Structured form
        │   ├── ChatMode.jsx              # AI chat interface
        │   └── InteractionsList.jsx      # History panel
        ├── services/
        │   └── api.js             # Axios instance
        └── styles/
            └── global.css



👨‍💻 Built With
- [LangGraph](https://github.com/langchain-ai/langgraph) — AI Agent framework
- [Groq](https://console.groq.com) — LLM inference (gemma2-9b-it)
- [FastAPI](https://fastapi.tiangolo.com) — Python backend
- [React](https://react.dev) + [Redux Toolkit](https://redux-toolkit.js.org) — Frontend
- [SQLAlchemy](https://sqlalchemy.org) — ORM
- Google Inter — Font
