import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, addUserMessage, clearChat } from '../store/slices/agentSlice';
import { fetchInteractions, setFormFromAgent } from '../store/slices/interactionSlice';
import { Bot, Send, Loader2, Trash2, User, CheckCircle, Sparkles } from 'lucide-react';

const QUICK_PROMPTS = [
  "Met Dr. Anika Sharma, discussed OncoBoost efficacy, she was very receptive",
  "Call with Dr. Mehta about Phase III trial, he seemed skeptical",
  "Search for oncologists in database",
  "Get follow-up suggestions for interaction ID 1",
];

const TOOL_COLORS = {
  log_interaction: '#10b981',
  edit_interaction: '#f59e0b',
  search_hcp: '#3b82f6',
  get_followup_suggestions: '#7c3aed',
  analyze_sentiment: '#ef4444',
};

export default function ChatMode({ fillsForm = false }) {
  const dispatch = useDispatch();
  const { messages, loading, lastToolUsed } = useSelector(s => s.agent);
  const [input, setInput] = useState('');
  const [formFilled, setFormFilled] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!formFilled) return;
    const t = setTimeout(() => setFormFilled(false), 3000);
    return () => clearTimeout(t);
  }, [formFilled]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, [input]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    dispatch(addUserMessage(msg));
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const result = await dispatch(sendChatMessage({ message: msg, history }));
    if (fillsForm && result?.payload?.form_data) {
      const fd = result.payload.form_data;
      const hasData = Object.values(fd).some(v =>
        Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : false
      );
      if (hasData) { dispatch(setFormFromAgent(fd)); setFormFilled(true); }
    }
    if (result?.payload?.tool_used === 'log_interaction') dispatch(fetchInteractions());
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    /*
      LAYOUT — input pinned at BOTTOM, messages scroll above
      ┌──────────────────────────┐
      │  messages scroll here ↑  │  ← flex:1, minHeight:0
      ├──────────────────────────┤
      │  [ type here...    ] [▶] │  ← flexShrink:0, never moves
      └──────────────────────────┘
    */
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fafafa', fontFamily: 'Inter, sans-serif' }}>

      {/* ── MESSAGES — scrollable, flex:1 fills all space above input ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Success banner */}
        {formFilled && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: '#059669', fontWeight: '500' }}>
            <CheckCircle size={13} /> ✨ Form filled automatically!
          </div>
        )}

        {/* Empty state + quick prompts */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ textAlign: 'center', padding: '20px 10px 14px' }}>
              <Sparkles size={24} style={{ color: '#c4b5fd', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>Describe an interaction below</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>"Met Dr. Sharma at Apollo, discussed OncoBoost, she was excited"</div>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '2px' }}>QUICK PROMPTS</div>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)}
                style={{ padding: '8px 12px', fontSize: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontFamily: 'Inter, sans-serif', textAlign: 'left', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}>
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '7px' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                <Bot size={12} color="#fff" />
              </div>
            )}
            <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? '#2563eb' : '#fff', color: msg.role === 'user' ? '#fff' : '#0f172a', fontSize: '13px', lineHeight: '1.55', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                <User size={12} color="#fff" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '7px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={12} color="#fff" />
            </div>
            <div style={{ display: 'flex', gap: '4px', padding: '11px 14px', background: '#fff', borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
              {[0, 0.18, 0.36].map((d, i) => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: `pulse 1.2s ease-in-out ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT — flexShrink:0 means it NEVER shrinks or disappears ── */}
      <div style={{ flexShrink: 0, padding: '10px 16px 14px', background: '#fff', borderTop: '1px solid #e8ecf0', boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>

        {/* Rounded input box like Claude */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '8px 10px 8px 14px', transition: 'all 0.15s' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe interaction or ask anything..."
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', fontFamily: 'Inter, sans-serif', lineHeight: '1.5', resize: 'none', color: '#0f172a', minHeight: '22px', maxHeight: '120px', overflowY: 'auto', padding: '2px 0' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <button onClick={() => dispatch(clearChat())} title="Clear chat"
              style={{ width: '30px', height: '30px', border: 'none', borderRadius: '8px', background: 'transparent', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>
              <Trash2 size={13} />
            </button>
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: '34px', height: '34px', border: 'none', borderRadius: '10px', cursor: input.trim() && !loading ? 'pointer' : 'default', background: input.trim() && !loading ? '#2563eb' : '#e2e8f0', color: input.trim() && !loading ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { if (input.trim() && !loading) e.currentTarget.style.background = '#2563eb'; }}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            </button>
          </div>
        </div>

        {/* Hint row */}
        <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '5px', paddingLeft: '2px', display: 'flex', justifyContent: 'space-between' }}>
          <span>↵ Enter to send · Shift+Enter for new line</span>
          {lastToolUsed && <span style={{ color: TOOL_COLORS[lastToolUsed] || '#94a3b8', fontWeight: '600' }}>● {lastToolUsed.replace(/_/g, ' ')}</span>}
        </div>
      </div>

    </div>
  );
}
