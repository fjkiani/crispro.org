import type { PlatinumWindowResponse } from '../types/platinum';
import UrgencyBadge from './UrgencyBadge';
import ScoreBar from './ScoreBar';
import TreatmentTimeline from './TreatmentTimeline';
import { formatScore, formatTrialRouting } from '../utils/format';
import './ResultsPanel.css';
import { useState } from 'react';

interface Props {
  data: PlatinumWindowResponse;
}

export default function ResultsPanel({ data }: Props) {
  const [showJSON, setShowJSON] = useState(false);

  return (
    <div className="results-panel fade-up">
      <div className="results-header">
        <h2>📊 Results</h2>
        <span className="results-meta">{data.computation_ms}ms · v{data.model_version}</span>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-label">Urgency</div>
          <div className="metric-value"><UrgencyBadge urgency={data.urgency} /></div>
          <div className="metric-sub">{data.urgency_reason}</div>
        </div>

        <div className="metric">
          <div className="metric-label">Window Status</div>
          <div className="metric-value">{data.window_status}</div>
          <div className="metric-sub">
            {data.weeks_remaining != null
              ? `${data.cycles_remaining} cycles · ${data.weeks_remaining} weeks`
              : data.intervention_deadline}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">PLATINUM_SCORE</div>
          <div className="metric-value">{formatScore(data.PLATINUM_SCORE)}</div>
          <ScoreBar score={data.PLATINUM_SCORE} />
          <div className="metric-sub">
            {data.risk_tier} · P{data.PLATINUM_SCORE_percentile} · HR {data.continuous_HR_estimate}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Fingerprint</div>
          <div className="metric-value">
            {data.fingerprint_positive ? '✅ POSITIVE' : '❌ NEGATIVE'}
          </div>
          <div className="metric-sub">
            {data.TIER}{data.TIER_REFINED ? ` / ${data.TIER_REFINED}` : ''}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">OCT1 / Metformin</div>
          <div className="metric-value">OCT1: {data.OCT1_STATUS}</div>
          <div className="metric-sub">
            {data.metformin_eligible ? '✅ Metformin eligible' : '❌ Metformin held'}
          </div>
        </div>

        <div className="metric">
          <div className="metric-label">Trial Routing</div>
          <div className="metric-value">{formatTrialRouting(data.trial_routing)}</div>
          <div className="metric-sub">
            {data.confidence_tier} · {data.score_confidence}
          </div>
        </div>
      </div>

      <TreatmentTimeline steps={data.recommended_sequence} />

      {/* Warnings */}
      {data.assay_warning && (
        <div className="warning-panel">⚠️ {data.assay_warning}</div>
      )}
      {data.cxcl10_imputation && (
        <div className="warning-panel">ℹ️ {data.cxcl10_imputation_note}</div>
      )}
      {data.caveats.length > 0 && (
        <div className="warning-panel">📋 {data.caveats.join(' | ')}</div>
      )}

      {/* JSON toggle */}
      <button className="json-toggle" onClick={() => setShowJSON(!showJSON)}>
        {'{ }'} {showJSON ? 'Hide' : 'View'} Raw JSON
      </button>
      {showJSON && (
        <pre className="json-output">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
