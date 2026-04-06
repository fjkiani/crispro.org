import { useState } from 'react';
import type { PlatinumWindowRequest } from '../types/platinum';
import { PATIENT_1_DEFAULTS, GENE_FIELDS } from '../constants';
import './ScoreForm.css';

interface Props {
  onDemo: () => void;
  onScore: (request: PlatinumWindowRequest, apiKey: string) => void;
  loading: boolean;
}

export default function ScoreForm({ onDemo, onScore, loading }: Props) {
  const [form, setForm] = useState<PlatinumWindowRequest>(PATIENT_1_DEFAULTS);


  const updateGene = (gene: string, value: string) => {
    setForm(prev => ({ ...prev, [gene]: parseFloat(value) || 0 }));
  };

  const handleScore = () => {
    onScore(form, '');
  };

  return (
    <div className="score-form glass">
      <h2 className="form-title">🔬 Score a Patient</h2>

      <h4 className="section-label">Gene Expression (TPM)</h4>
      <div className="gene-grid">
        {GENE_FIELDS.map(gene => (
          <div className="field" key={gene}>
            <label>{gene === 'SLC22A1' ? 'SLC22A1 (OCT1)' : gene}</label>
            <input
              type="number"
              value={form[gene] ?? 0}
              onChange={e => updateGene(gene, e.target.value)}
              step="0.1"
              min="0"
            />
          </div>
        ))}
      </div>

      <h4 className="section-label">Clinical State</h4>
      <div className="clinical-grid">
        <div className="field">
          <label>Platinum Status</label>
          <select
            value={form.platinum_status}
            onChange={e => setForm(prev => ({ ...prev, platinum_status: e.target.value as 'sensitive' | 'resistant' | 'naive' }))}
          >
            <option value="sensitive">Sensitive</option>
            <option value="resistant">Resistant</option>
            <option value="naive">Naïve</option>
          </select>
        </div>
        <div className="field">
          <label>Prior Cycles</label>
          <input
            type="number"
            value={form.prior_platinum_cycles}
            onChange={e => setForm(prev => ({ ...prev, prior_platinum_cycles: parseInt(e.target.value) || 0 }))}
            min="0"
            max="20"
          />
        </div>
        <div className="field">
          <label>Histotype</label>
          <select
            value={form.histotype}
            onChange={e => setForm(prev => ({ ...prev, histotype: e.target.value as 'HGSOC' | 'PAAD' | 'other' }))}
          >
            <option value="HGSOC">HGSOC</option>
            <option value="PAAD">PAAD</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>



      <div className="btn-row">
        <button className="btn btn-demo" onClick={onDemo} disabled={loading}>
          {loading ? '⏳' : '▶'} Run Demo
        </button>
        <button className="btn btn-score" onClick={handleScore} disabled={loading}>
          {loading ? '⏳' : '🔒'} Score Patient
        </button>
      </div>
    </div>
  );
}
