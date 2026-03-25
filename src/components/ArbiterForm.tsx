import { useState } from 'react';
import type { ArbiterScoreRequest, ImagingChangeType, TherapyClass } from '../types/arbiter';
import { ARBITER_DEFAULTS, IMAGING_TYPES, THERAPY_CLASSES } from '../constants';
import './ArbiterForm.css';

interface Props {
  onDemo: () => void;
  onScore: (request: ArbiterScoreRequest) => void;
  loading: boolean;
}

export default function ArbiterForm({ onDemo, onScore, loading }: Props) {
  const [form, setForm] = useState<ArbiterScoreRequest>(ARBITER_DEFAULTS);

  const handleScore = () => {
    onScore(form);
  };

  return (
    <div className="arbiter-form glass">
      <h2 className="form-title">🦴 Score an Imaging Event</h2>

      <h4 className="section-label">Imaging Finding</h4>
      <div className="arbiter-grid">
        <div className="field">
          <label>Imaging Change Type</label>
          <select
            value={form.imaging_change_type}
            onChange={e => setForm(prev => ({ ...prev, imaging_change_type: e.target.value as ImagingChangeType }))}
          >
            {IMAGING_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Therapy Class</label>
          <select
            value={form.therapy_class}
            onChange={e => setForm(prev => ({ ...prev, therapy_class: e.target.value as TherapyClass }))}
          >
            {THERAPY_CLASSES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <h4 className="section-label">Clinical State</h4>
      <div className="arbiter-grid">
        <div className="field">
          <label>Symptomatic</label>
          <select
            value={form.symptomatic === null ? 'unknown' : form.symptomatic ? 'true' : 'false'}
            onChange={e => {
              const v = e.target.value;
              setForm(prev => ({
                ...prev,
                symptomatic: v === 'unknown' ? null : v === 'true',
              }));
            }}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="field">
          <label>New Pain at Site</label>
          <select
            value={form.new_pain_at_site === null ? 'unknown' : form.new_pain_at_site ? 'true' : 'false'}
            onChange={e => {
              const v = e.target.value;
              setForm(prev => ({
                ...prev,
                new_pain_at_site: v === 'unknown' ? null : v === 'true',
              }));
            }}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="field">
          <label>Healing Flag</label>
          <select
            value={form.healing_flag ? 'true' : 'false'}
            onChange={e => setForm(prev => ({ ...prev, healing_flag: e.target.value === 'true' }))}
          >
            <option value="true">Yes — sclerotic/healing context</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <h4 className="section-label">Lab Values & Timing</h4>
      <div className="arbiter-grid">
        <div className="field">
          <label>Weeks on Therapy</label>
          <input
            type="number"
            value={form.weeks_on_therapy}
            onChange={e => setForm(prev => ({ ...prev, weeks_on_therapy: parseFloat(e.target.value) || 0 }))}
            min="0"
            step="1"
          />
        </div>
        <div className="field">
          <label>ALP Change (%)</label>
          <input
            type="number"
            value={form.alp_delta_pct}
            onChange={e => setForm(prev => ({ ...prev, alp_delta_pct: parseFloat(e.target.value) || 0 }))}
            step="1"
          />
        </div>
        <div className="field">
          <label>CA 15-3 Change (%)</label>
          <input
            type="number"
            value={form.ca153_delta_pct}
            onChange={e => setForm(prev => ({ ...prev, ca153_delta_pct: parseFloat(e.target.value) || 0 }))}
            step="1"
          />
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-demo" onClick={onDemo} disabled={loading}>
          {loading ? '⏳' : '▶'} Run Demo
        </button>
        <button className="btn btn-score" onClick={handleScore} disabled={loading}>
          {loading ? '⏳' : '🦴'} Score Event
        </button>
      </div>
    </div>
  );
}
