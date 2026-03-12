"""
LangGraph Agent Graph for HCP CRM
===================================
ReAct-style agent using LangGraph StateGraph.
Uses llama-3.3-70b-versatile via Groq.
Extracts structured form fields from natural language.
"""

from typing import Annotated, TypedDict, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AnyMessage
import operator
import os
import json
import re
from dotenv import load_dotenv

from agent.tools import ALL_TOOLS

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[Sequence[AnyMessage], operator.add]


SYSTEM_PROMPT = """You are an AI assistant for a Life Sciences CRM system helping field medical representatives manage HCP (Healthcare Professional) interactions.

You have 5 tools: log_interaction, edit_interaction, search_hcp, get_followup_suggestions, analyze_sentiment.

CRITICAL INSTRUCTION - FORM AUTO-FILL:
When the user describes an interaction, you MUST:
1. Extract structured data from their message
2. At the END of your response, always include a JSON block wrapped in <form_data> tags like this:

<form_data>
{
  "hcp_name": "Dr. Full Name or empty string",
  "interaction_type": "Meeting or Call or Email or Conference or Webinar or Site Visit",
  "topics_discussed": "extracted topics",
  "outcomes": "extracted outcomes or empty string",
  "follow_up_actions": "extracted follow-up or empty string",
  "sentiment": "positive or neutral or negative",
  "attendees": "extracted attendees or empty string",
  "materials_shared": ["item1", "item2"],
  "samples_distributed": ["item1", "item2"]
}
</form_data>

Examples of extraction:
- "Met Dr. Sharma, discussed OncoBoost" → hcp_name: "Dr. Sharma", topics: "OncoBoost"
- "she was very excited" → sentiment: "positive"
- "Call with Dr. Mehta" → interaction_type: "Call", hcp_name: "Dr. Mehta"
- "shared brochure about drug X" → materials_shared: ["Drug X Brochure"]
- "gave 2 samples of OncoBoost" → samples_distributed: ["OncoBoost"]

Always include <form_data> tags even if fields are empty strings.
Be helpful, professional, and concise.
"""


def _build_llm():
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1,
    )
    return llm.bind_tools(ALL_TOOLS)


def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


def call_model(state: AgentState) -> AgentState:
    llm_with_tools = _build_llm()
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def build_graph() -> StateGraph:
    tool_node = ToolNode(ALL_TOOLS)
    graph = StateGraph(AgentState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()


_compiled_graph = None

def get_agent():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def extract_form_data(text: str) -> dict:
    """Extract <form_data> JSON from agent response."""
    try:
        match = re.search(r'<form_data>(.*?)</form_data>', text, re.DOTALL)
        if match:
            return json.loads(match.group(1).strip())
    except Exception:
        pass
    return {}


def clean_response(text: str) -> str:
    """Remove <form_data> block from visible response text."""
    return re.sub(r'<form_data>.*?</form_data>', '', text, flags=re.DOTALL).strip()


async def run_agent(user_message: str, conversation_history: list = None) -> dict:
    agent = get_agent()

    messages = []
    if conversation_history:
        for msg in conversation_history:
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_message))

    result = await agent.ainvoke({"messages": messages})

    final_messages = result["messages"]
    raw_response = ""
    tool_used = None

    for msg in reversed(final_messages):
        if isinstance(msg, AIMessage) and msg.content:
            raw_response = msg.content
            break

    for msg in final_messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            tool_used = msg.tool_calls[0].get("name")
            break

    form_data = extract_form_data(raw_response)
    clean_text = clean_response(raw_response)

    return {
        "response": clean_text,
        "tool_used": tool_used,
        "form_data": form_data,
    }
