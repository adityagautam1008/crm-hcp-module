import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FormMode from './FormMode';
import ChatMode from './ChatMode';
import InteractionsList from './InteractionsList';
import { Bot, ClipboardList, LayoutGrid, Activity, ChevronRight, ChevronLeft } from 'lucide-react';

const TOOLS = [
  { label: 'Log Interaction', color: '#10b981' },
  { label: 'Edit Interaction', color: '#f59e0b' },
  { label: 'Search HCP', color: '#3b82f6' },
  { label: 'Follow-up AI', color: '#7c3aed' },
  { label: 'Sentiment', color: '#ef4444' },
];

export default function LogInteractionScreen() {
  const [mode, setMode] = useState('form');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lastToolUsed } = useSelector(s => s.agent);
  const { interactions } = useSelector(s => s.interaction);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', background: '#f8fafc', overflow: 'hidden' }}>

      {/* ── TOP BAR ── */}
      <div style={{ flexShrink: 0, height: '56px', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', zIndex: 50 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>LifeScience CRM</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>HCP Interaction Module</div>
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${sidebarOpen ? '#bfdbfe' : '#e2e8f0'}`, fontFamily: 'Inter, sans-serif', background: sidebarOpen ? '#eff6ff' : '#fff', color: sidebarOpen ? '#2563eb' : '#64748b', fontWeight: '500', fontSize: '13px', transition: 'all 0.2s' }}>
            <ClipboardList size={14} />
            History
            {interactions.length > 0 && <span style={{ background: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '20px' }}>{interactions.length}</span>}
            {sidebarOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            AI Agent Live · llama-3.1-8b
          </div>
        </div>
      </div>

      {/* ── MAIN PANELS ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — Form panel */}
        <div style={{ width: '400px', flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#fff' }}>

          {/* Panel header with tabs */}
          <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Log HCP Interaction</div>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
              {[{ key: 'form', icon: <LayoutGrid size={11} />, label: 'Form' }, { key: 'chat', icon: <Bot size={11} />, label: 'Chat' }].map(tab => (
                <button key={tab.key} onClick={() => setMode(tab.key)} style={{ padding: '5px 11px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', border: 'none', fontFamily: 'Inter, sans-serif', background: mode === tab.key ? '#fff' : 'transparent', color: mode === tab.key ? '#0f172a' : '#64748b', boxShadow: mode === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
            {mode === 'form' ? <FormMode /> : <ChatMode fillsForm={false} />}
          </div>
        </div>

        {/* MIDDLE — AI Assistant */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
          <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={14} style={{ color: '#7c3aed' }} />
              AI Assistant
              {lastToolUsed && <span style={{ fontSize: '11px', background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Last: {lastToolUsed.replace(/_/g, ' ')}</span>}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Describe interaction → AI fills form automatically ✨
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ChatMode fillsForm={true} />
          </div>
        </div>

        {/* RIGHT — Collapsible history sidebar */}
        <div style={{ width: sidebarOpen ? '320px' : '0', flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s ease', background: '#fff', borderLeft: sidebarOpen ? '1px solid #e2e8f0' : 'none', display: 'flex', flexDirection: 'column' }}>
          {sidebarOpen && (
            <>
              <div style={{ flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClipboardList size={13} /> Interaction History
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Recent HCP interactions</div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px' }}>
                <InteractionsList />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TOOLS STRIP ── */}
      <div style={{ flexShrink: 0, height: '38px', borderTop: '1px solid #e2e8f0', background: '#fff', padding: '0 20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em', marginRight: '4px' }}>AI TOOLS:</span>
        {TOOLS.map(t => (
          <span key={t.label} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30` }}>
            {t.label}
          </span>
        ))}
      </div>

    </div>
  );
}
