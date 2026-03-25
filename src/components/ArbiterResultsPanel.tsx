import type { ArbiterScoreResponse } from '../types/arbiter';
import { useState } from 'react';
import { ARBITER_RISK_LABELS } from '../constants';
import './ArbiterResultsPanel.css';

interface Props {
  data: ArbiterScoreResponse;
}

function RiskBadge({ bucket }: { bucket: string }) {
  const cls = `risk-badge risk-${bucket.toLowerCase()}`;
  const label = ARBITER_RISK_LABELS[bucket as keyof typeof ARBITER_RISK_LABELS] ?? bucket;
  return <span className={cls}>{label}</span>;
}

export default function ArbiterResultsPanel({ data }: Props) {
  const [showJSON, setShowJSON] = useState(false);
  const pPct = (data.p_true_progression * 100).toFixed(1);

  // Format recommendation for display
  const recLabel = data.recommendation.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  // Sort contributions by absolute value
  const sortedContributions = Object.entries(data.term_contributions)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

  return (
    <div className="arbiter-results fade-up">
      <div className="results-header">
        <h2>📊 Results</h2>
      </div>

      <div className="arbiter-metrics-grid">
        <div className="metric">
          <div className="metric-label">Risk Level</div>
          <div className="metric-value"><RiskBadge bucket={data.risk_bucket} /></div>
        </div>

        <div className="metric">
          <div className="metric-label">P(True Progression)</div>
          <div className="metric-value">{pPct}%</div>
          <div className="metric-sub">Logit: {data.logit.toFixed(3)}</div>
        </div>

        <div className="metric">
          <div className="metric-label">Recommendation</div>
          <div className="metric-value rec-value">{recLabel}</div>
        </div>

        <div className="metric">
          <div className="metric-label">Driving Feature</div>
          <div className="metric-value">{data.driving_feature}</div>
          <div className="metric-sub">
            {data.driving_feature_contribution > 0 ? '→ true progression' : '→ pseudo-progression'}
            {' '}({data.driving_feature_contribution > 0 ? '+' : ''}{data.driving_feature_contribution.toFixed(4)})
          </div>
        </div>
      </div>

      {/* Term contributions table */}
      <div className="contributions-section">
        <h3>Feature Contributions</h3>
        <table className="contributions-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Contribution</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {sortedContributions.map(([feature, value]) => (
              <tr key={feature} className={value > 0 ? 'prog' : 'pseudo'}>
                <td>{feature}</td>
                <td>{value > 0 ? '+' : ''}{value.toFixed(4)}</td>
                <td>{value > 0 ? '⬆ PROGRESSION' : '⬇ PSEUDO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="warning-panel">⚠️ {data.disclaimer}</div>

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
