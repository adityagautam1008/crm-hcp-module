import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateFormField, resetForm, createInteraction,
  fetchHCPs, getFollowupSuggestions, clearMessages,
} from '../store/slices/interactionSlice';
import {
  User, Calendar, Clock, Users, MessageSquare, Package,
  FlaskConical, Target, ListChecks, Sparkles, Search,
  Plus, Loader2, CheckCircle, AlertCircle, X, FileText, Upload,
} from 'lucide-react';

const INTERACTION_TYPES = ['Meeting', 'Call', 'Email', 'Conference', 'Webinar', 'Site Visit'];
const SENTIMENT_OPTIONS = [
  { value: 'positive', label: 'Positive', emoji: '😊', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  { value: 'negative', label: 'Negative', emoji: '😟', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
];

// ── Reusable field label ──────────────────────────────────────
const Label = ({ icon, text, required }) => (
  <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
    {icon && React.cloneElement(icon, { size: 11, style: { color: '#64748b' } })}
    {text} {required && <span style={{ color: '#ef4444' }}>*</span>}
  </div>
);

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: '8px', fontSize: '13px', color: '#0f172a', outline: 'none',
  background: '#fff', fontFamily: 'Inter, sans-serif', transition: 'border 0.15s',
  boxSizing: 'border-box',
};
const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: '76px', lineHeight: '1.5',
};
const sectionStyle = {
  background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9',
  padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '14px',
};
const sectionTitleStyle = {
  fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase',
  letterSpacing: '0.07em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '5px',
};

export default function FormMode() {
  const dispatch = useDispatch();
  const { form, hcps, loading, error, successMessage, lastCreatedId, followupSuggestions } = useSelector(s => s.interaction);
  const [hcpSearch, setHcpSearch] = useState('');
  const [showHcpList, setShowHcpList] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [newSample, setNewSample] = useState('');
  const [materialFiles, setMaterialFiles] = useState([]);
  const materialFileRef = useRef(null);

  useEffect(() => { dispatch(fetchHCPs('')); }, [dispatch]);

  useEffect(() => {
    if (hcpSearch.length > 1) {
      dispatch(fetchHCPs(hcpSearch));
      setShowHcpList(true);
    } else {
      setShowHcpList(false);
    }
  }, [hcpSearch, dispatch]);

  useEffect(() => {
    // Sync hcpSearch display when form is filled by AI
    if (form.hcp_name && form.hcp_name !== hcpSearch) {
      setHcpSearch(form.hcp_name);
    }
  }, [form.hcp_name]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => dispatch(clearMessages()), 5000);
      return () => clearTimeout(t);
    }
  }, [successMessage, dispatch]);

  const setField = (field, value) => dispatch(updateFormField({ field, value }));

  const handleHCPSelect = (hcp) => {
    setField('hcp_name', hcp.name);
    setField('hcp_id', hcp.id);
    setHcpSearch(hcp.name);
    setShowHcpList(false);
  };

  // ── Materials ──
  const addMaterial = () => {
    const val = newMaterial.trim();
    if (!val) return;
    setField('materials_shared', [...(form.materials_shared || []), val]);
    setNewMaterial('');
  };

  const removeMaterial = (idx) => {
    setField('materials_shared', form.materials_shared.filter((_, i) => i !== idx));
  };

  const handleMaterialFile = (e) => {
    const files = Array.from(e.target.files);
    const newNames = files.map(f => f.name);
    setMaterialFiles(prev => [...prev, ...files]);
    setField('materials_shared', [...(form.materials_shared || []), ...newNames]);
    e.target.value = '';
  };

  // ── Samples ──
  const addSample = () => {
    const val = newSample.trim();
    if (!val) return;
    setField('samples_distributed', [...(form.samples_distributed || []), val]);
    setNewSample('');
  };

  const removeSample = (idx) => {
    setField('samples_distributed', form.samples_distributed.filter((_, i) => i !== idx));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!form.hcp_name || !form.interaction_type || !form.date) {
      alert('Please fill in HCP Name, Interaction Type, and Date.');
      return;
    }
    const result = await dispatch(createInteraction({ ...form, logged_via: 'form' }));
    if (result.payload?.id) {
      dispatch(getFollowupSuggestions(result.payload.id));
      setHcpSearch('');
      setMaterialFiles([]);
    }
  };

  // ── Focus style helper ──
  const onFocus = e => e.target.style.borderColor = '#3b82f6';
  const onBlur = e => e.target.style.borderColor = '#e2e8f0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingBottom: '8px' }}>

      {/* Toast */}
      {successMessage && (
        <div style={{
          padding: '11px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
          background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0',
          animation: 'fadeIn 0.25s ease',
        }}>
          <CheckCircle size={15} /> {successMessage}
        </div>
      )}
      {error && (
        <div style={{
          padding: '11px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
          background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* ── Section 1: Interaction Details ── */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><User size={11} /> Interaction Details</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* HCP Name */}
          <div>
            <Label icon={<Search />} text="HCP Name" required />
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                style={{ ...inputStyle, paddingLeft: '30px' }}
                placeholder="Search or select HCP..."
                value={hcpSearch}
                onChange={e => { setHcpSearch(e.target.value); setField('hcp_name', e.target.value); }}
                onFocus={e => { setShowHcpList(true); onFocus(e); }}
                onBlur={e => { setTimeout(() => setShowHcpList(false), 180); onBlur(e); }}
              />
              {showHcpList && hcps.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                  border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 100, marginTop: '4px', maxHeight: '180px', overflowY: 'auto',
                }}>
                  {hcps.map(hcp => (
                    <div key={hcp.id}
                      onMouseDown={() => handleHCPSelect(hcp)}
                      style={{ padding: '10px 13px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ fontWeight: '500', fontSize: '13px', color: '#0f172a' }}>{hcp.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{hcp.specialty} · {hcp.hospital}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interaction Type */}
          <div>
            <Label text="Interaction Type" required />
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.interaction_type}
              onChange={e => setField('interaction_type', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}>
              {INTERACTION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <Label icon={<Calendar />} text="Date" required />
            <input type="date" style={inputStyle} value={form.date}
              onChange={e => setField('date', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <Label icon={<Clock />} text="Time" />
            <input type="time" style={inputStyle} value={form.time}
              onChange={e => setField('time', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <Label icon={<Users />} text="Attendees" />
          <input style={inputStyle} placeholder="Enter names or search..."
            value={form.attendees || ''}
            onChange={e => setField('attendees', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
        </div>

        <div>
          <Label icon={<MessageSquare />} text="Topics Discussed" />
          <textarea style={textareaStyle} placeholder="Enter key discussion points..."
            value={form.topics_discussed || ''}
            onChange={e => setField('topics_discussed', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>

      {/* ── Section 2: Materials & Samples ── */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><Package size={11} /> Materials Shared / Samples Distributed</div>

        {/* Materials */}
        <div style={{ marginBottom: '16px' }}>
          <Label icon={<FileText />} text="Materials Shared" />

          {/* Add by name */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="e.g. OncoBoost Efficacy Brochure"
              value={newMaterial}
              onChange={e => setNewMaterial(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMaterial()}
              onFocus={onFocus} onBlur={onBlur}
            />
            <button
              onClick={addMaterial}
              style={{
                padding: '9px 14px', background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
              <Plus size={13} /> Add
            </button>
          </div>

          {/* Upload file button */}
          <input
            ref={materialFileRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
            style={{ display: 'none' }}
            onChange={handleMaterialFile}
          />
          <button
            onClick={() => materialFileRef.current?.click()}
            style={{
              width: '100%', padding: '9px 14px', background: '#fff', color: '#64748b',
              border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '500',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.15s', marginBottom: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}>
            <Upload size={13} /> Upload Brochure / File (PDF, PPT, Image)
          </button>

          {/* Materials list */}
          {(form.materials_shared || []).length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(form.materials_shared || []).map((m, i) => (
                <span key={i} style={{
                  background: '#eff6ff', color: '#2563eb', padding: '4px 10px',
                  borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  border: '1px solid #bfdbfe',
                }}>
                  <FileText size={10} /> {m}
                  <button onClick={() => removeMaterial(i)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb',
                    padding: '0 0 0 2px', lineHeight: 1, fontSize: '14px', opacity: 0.6,
                  }}>×</button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 0' }}>No materials added yet</div>
          )}
        </div>

        {/* Samples */}
        <div>
          <Label icon={<FlaskConical />} text="Samples Distributed" />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="e.g. OncoBoost 50mg"
              value={newSample}
              onChange={e => setNewSample(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSample()}
              onFocus={onFocus} onBlur={onBlur}
            />
            <button
              onClick={addSample}
              style={{
                padding: '9px 14px', background: '#ecfdf5', color: '#10b981',
                border: '1px solid #a7f3d0', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'}
              onMouseLeave={e => e.currentTarget.style.background = '#ecfdf5'}>
              <Plus size={13} /> Add Sample
            </button>
          </div>

          {(form.samples_distributed || []).length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(form.samples_distributed || []).map((s, i) => (
                <span key={i} style={{
                  background: '#ecfdf5', color: '#10b981', padding: '4px 10px',
                  borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  border: '1px solid #a7f3d0',
                }}>
                  <FlaskConical size={10} /> {s}
                  <button onClick={() => removeSample(i)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: '#10b981',
                    padding: '0 0 0 2px', lineHeight: 1, fontSize: '14px', opacity: 0.6,
                  }}>×</button>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8', padding: '4px 0' }}>No samples added yet</div>
          )}
        </div>
      </div>

      {/* ── Section 3: Sentiment & Outcomes ── */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><Target size={11} /> Sentiment & Outcomes</div>

        {/* Sentiment */}
        <div style={{ marginBottom: '14px' }}>
          <Label text="Observed / Inferred HCP Sentiment" />
          <div style={{ display: 'flex', gap: '8px' }}>
            {SENTIMENT_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={() => setField('sentiment', opt.value)}
                style={{
                  flex: 1, padding: '9px 8px', borderRadius: '9px', cursor: 'pointer',
                  border: `2px solid ${form.sentiment === opt.value ? opt.border : '#e2e8f0'}`,
                  background: form.sentiment === opt.value ? opt.bg : '#fff',
                  color: form.sentiment === opt.value ? opt.color : '#64748b',
                  fontWeight: form.sentiment === opt.value ? '600' : '400',
                  fontSize: '12px', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                }}>
                <span style={{ fontSize: '15px' }}>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <Label icon={<Target />} text="Outcomes" />
          <textarea style={textareaStyle} placeholder="Key outcomes or agreements reached..."
            value={form.outcomes || ''}
            onChange={e => setField('outcomes', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
        </div>

        <div>
          <Label icon={<ListChecks />} text="Follow-up Actions" />
          <textarea style={textareaStyle} placeholder="Enter next steps or tasks..."
            value={form.follow_up_actions || ''}
            onChange={e => setField('follow_up_actions', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
        </div>
      </div>

      {/* ── AI Follow-up Suggestions ── */}
      {followupSuggestions?.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff, #eff6ff)',
          border: '1px solid #c4b5fd', borderRadius: '10px', padding: '14px', marginBottom: '14px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={13} /> AI Suggested Follow-ups
          </div>
          {followupSuggestions.map((s, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#374151', padding: '3px 0', display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
              <span style={{ color: '#7c3aed', fontWeight: '600', marginTop: '1px' }}>›</span> {s}
            </div>
          ))}
        </div>
      )}

      {/* ── Submit Row ── */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => { dispatch(resetForm()); setHcpSearch(''); setMaterialFiles([]); }}
          style={{
            padding: '11px 18px', background: '#fff', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: '9px', fontWeight: '500',
            fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
          Reset
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            flex: 1, padding: '11px 20px', background: loading ? '#93c5fd' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '600',
            fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}>
          {loading
            ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Logging...</>
            : <><CheckCircle size={15} /> Log Interaction</>
          }
        </button>
      </div>
    </div>
  );
}
