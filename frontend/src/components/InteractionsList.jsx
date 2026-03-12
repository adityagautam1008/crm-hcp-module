import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInteractions } from '../store/slices/interactionSlice';
import { ClipboardList, Calendar, Loader2, TrendingUp } from 'lucide-react';

const TYPE_ICONS = { Meeting: '🤝', Call: '📞', Email: '📧', Conference: '🎤', Webinar: '💻', 'Site Visit': '🏥' };
const SENTIMENT = {
  positive: { color: '#10b981', bg: '#ecfdf5', label: '😊 Positive' },
  neutral:  { color: '#94a3b8', bg: '#f8fafc', label: '😐 Neutral' },
  negative: { color: '#ef4444', bg: '#fef2f2', label: '😟 Negative' },
};

export default function InteractionsList() {
  const dispatch = useDispatch();
  const { interactions, loading } = useSelector(s => s.interaction);

  useEffect(() => { dispatch(fetchInteractions()); }, [dispatch]);

  if (loading && !interactions.length) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
      <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
      <div style={{ fontSize: '12px' }}>Loading...</div>
    </div>
  );

  if (!interactions.length) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
      <TrendingUp size={30} style={{ margin: '0 auto 10px', opacity: 0.25, display: 'block' }} />
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>No interactions yet</div>
      <div style={{ fontSize: '12px', marginTop: '4px' }}>Log your first HCP interaction</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ClipboardList size={14} /> Recent Interactions
        </div>
        <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
          {interactions.length}
        </span>
      </div>

      {/* Cards */}
      {interactions.map(i => (
        <div key={i.id}
          style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '13px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '7px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>
                {TYPE_ICONS[i.interaction_type] || '📋'} {i.hcp_name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{i.interaction_type} · #{i.id}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Calendar size={10} /> {i.date}
              </div>
              <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', color: SENTIMENT[i.sentiment]?.color || '#94a3b8', background: SENTIMENT[i.sentiment]?.bg || '#f8fafc' }}>
                {SENTIMENT[i.sentiment]?.label || '😐 Neutral'}
              </span>
            </div>
          </div>

          {/* Topics */}
          {i.topics_discussed && (
            <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '8px' }}>
              {i.topics_discussed.length > 100 ? i.topics_discussed.slice(0, 100) + '...' : i.topics_discussed}
            </div>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '20px', background: i.logged_via === 'chat' ? '#f5f3ff' : '#eff6ff', color: i.logged_via === 'chat' ? '#7c3aed' : '#2563eb' }}>
              {i.logged_via === 'chat' ? '🤖 via Chat' : '📝 via Form'}
            </span>
            {i.materials_shared?.length > 0 && <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '20px' }}>📄 {i.materials_shared.length} material(s)</span>}
            {i.samples_distributed?.length > 0 && <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '20px' }}>🧪 {i.samples_distributed.length} sample(s)</span>}
            {i.ai_suggested_followups?.length > 0 && <span style={{ fontSize: '11px', background: '#f5f3ff', color: '#7c3aed', padding: '2px 7px', borderRadius: '20px' }}>✨ {i.ai_suggested_followups.length} follow-up(s)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
