import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyzePanel } from '../api/evo2Api';
import PanelResultsTable from '../components/PanelResultsTable';
import CopilotPanel from '../components/CopilotPanel';
import type { VariantInput, AnnotatedVariant, PanelAnalysisResponse } from '../types/triage';
import './TriageResultsPage.css';

interface LocationState {
  variants: VariantInput[];
  cartItems?: unknown[];
}

export default function TriageResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [panelResponse, setPanelResponse] = useState<PanelAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const variants: VariantInput[] = state?.variants ?? [];

  useEffect(() => {
    if (variants.length === 0) {
      navigate('/variant-triage', { replace: true });
      return;
    }

    setStatus('loading');
    analyzePanel(variants, 'CrisPRO Triage Panel')
      .then((res) => {
        setPanelResponse(res);
        setStatus('done');
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Analysis failed');
        setStatus('error');
      });
  }, []); // run once on mount

  const annotated: AnnotatedVariant[] = panelResponse?.annotated_variants ?? [];
  const hi = panelResponse?.high_priority_count ?? 0;
  const med = panelResponse?.medium_priority_count ?? 0;
  const lo = panelResponse?.low_priority_count ?? 0;

  return (
    <div className="tr-page fade-in">
      {/* Header */}
      <section className="tr-hero">
        <button className="tr-back-btn" onClick={() => navigate('/variant-triage')}>
          ← Back to Panel Builder
        </button>
        <div className="tr-hero-badge">RESEARCH USE ONLY</div>
        <h1 className="tr-title">Triage Results</h1>
        {panelResponse && (
          <p className="tr-subtitle">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} analyzed in{' '}
            {panelResponse.processing_time_seconds.toFixed(1)}s
          </p>
        )}
      </section>

      {/* Loading */}
      {status === 'loading' && (
        <section className="tr-loading glass">
          <div className="tr-loading-spinner" />
          <div className="tr-loading-text">
            <strong>Running Evo2 Analysis…</strong>
            <p>
              Scoring {variants.length} variant{variants.length !== 1 ? 's' : ''} with the Evo2 7B
              genomic model. This may take 30–90 seconds per variant.
            </p>
          </div>
        </section>
      )}

      {/* Error */}
      {status === 'error' && (
        <section className="tr-error glass">
          <div className="tr-error-icon">⚠</div>
          <div>
            <strong>Analysis Failed</strong>
            <p>{error}</p>
            <p className="tr-error-hint">
              Make sure <code>VITE_EVO2_API_URL</code> is set in <code>.env.local</code> and your
              Modal backend is deployed.
            </p>
          </div>
          <button className="tr-retry-btn" onClick={() => navigate('/variant-triage')}>
            ← Return to Panel Builder
          </button>
        </section>
      )}

      {/* Results */}
      {status === 'done' && panelResponse && (
        <>
          {/* Summary stats */}
          <section className="tr-stats-row">
            <div className="tr-stat-card tr-stat-card--high glass">
              <span className="tr-stat-value">{hi}</span>
              <span className="tr-stat-label">High Priority</span>
            </div>
            <div className="tr-stat-card tr-stat-card--medium glass">
              <span className="tr-stat-value">{med}</span>
              <span className="tr-stat-label">Medium Priority</span>
            </div>
            <div className="tr-stat-card tr-stat-card--low glass">
              <span className="tr-stat-value">{lo}</span>
              <span className="tr-stat-label">Low Priority</span>
            </div>
            <div className="tr-stat-card glass">
              <span className="tr-stat-value">{variants.length}</span>
              <span className="tr-stat-label">Total Variants</span>
            </div>
          </section>

          {/* Variants table */}
          <section className="tr-section glass">
            <h2 className="tr-section-title">Panel Variants</h2>
            <p className="tr-section-desc">
              Click any row to expand score breakdown. Sort by priority, gene, Evo2 Δ, or splice
              risk.
            </p>
            <PanelResultsTable variants={annotated} />
          </section>

          {/* AI Copilot */}
          <section className="tr-section">
            <h2 className="tr-section-title">AI Co-Pilot</h2>
            <p className="tr-section-desc">
              Generate a structured triage report or tumor board note, then ask follow-up questions
              about the panel.
            </p>
            <CopilotPanel variants={annotated} panelName="CrisPRO Triage Panel" />
          </section>
        </>
      )}
    </div>
  );
}
