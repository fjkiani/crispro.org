import React, { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { useZetaCore, type AnalysisResult } from '../features/zeta-core/hooks/useZetaCore';
import StreamPanel from '../features/zeta-core/components/StreamPanel';

// ─── Example queries ──────────────────────────────────────────────────────────
const EXAMPLES = [
  { label: 'Paclitaxel + CYP2C8', question: 'Does paclitaxel interact with CYP2C8 inhibitors causing increased toxicity?', category: 'drug' },
  { label: 'PARP inhibitors BRCA1', question: 'Are PARP inhibitors effective in BRCA1-mutant ovarian cancer?', category: 'clinical' },
  { label: 'MBD4 synthetic lethality', question: 'Synthetic lethality MBD4 deficiency in cancer', category: 'genomic' },
  { label: 'Olaparib resistance', question: 'Mechanisms of acquired resistance to olaparib in ovarian cancer', category: 'clinical' },
  { label: 'FAP stromal HGSOC', question: 'FAP stromal fibroblast marker platinum sensitivity HGSOC', category: 'genomic' },
  { label: 'Metformin AMPK cancer', question: 'Metformin AMPK activation anti-tumor mechanism cancer', category: 'drug' },
];

const CAT_COLORS: Record<string, string> = {
  drug: 'var(--accent-subtle)',
  clinical: 'rgba(16,185,129,0.08)',
  genomic: 'rgba(139,92,246,0.08)',
};
const CAT_BORDER: Record<string, string> = {
  drug: 'var(--accent)',
  clinical: '#10b981',
  genomic: '#8b5cf6',
};

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  'RCT': { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' },
  'Meta-Analysis': { background: '#ede9fe', color: '#4c1d95', border: '1px solid #ddd6fe' },
  'Pathway-Aligned': { background: '#dcfce7', color: '#14532d', border: '1px solid #bbf7d0' },
  'Mechanism-Match': { background: '#fef3c7', color: '#78350f', border: '1px solid #fde68a' },
  'PATHWAY-BLOCK': { background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5', fontWeight: '700' },
  'Pre-Clinical Only': { background: '#fef9c3', color: '#713f12', border: '1px solid #fde047', fontWeight: '700' },
};

const TIER_CONFIG = {
  SUPPORTED: { border: '#34d399', text: '#065f46', bg: '#f0fdf4', icon: '✓', label: 'SUPPORTED' },
  CONSIDER: { border: '#fbbf24', text: '#78350f', bg: '#fffbeb', icon: '~', label: 'CONSIDER' },
  MECHANISTIC_SPECULATION: { border: '#f59e0b', text: '#92400e', bg: '#fffbeb', icon: '⚗', label: 'MECHANISTIC SPECULATION' },
  INSUFFICIENT: { border: '#f87171', text: '#7f1d1d', bg: '#fef2f2', icon: '✕', label: 'INSUFFICIENT' },
};

function PubMedLink({ pmid }: { pmid: string }) {
  return (
    <a href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} target="_blank" rel="noopener noreferrer"
       style={{ display: 'inline-flex', alignItems: 'center', gap: '2px',
                color: 'var(--accent)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
      PMID:{pmid} <ExternalLink size={10} />
    </a>
  );
}

function EvidenceBadge({ label }: { label: string }) {
  const s = BADGE_STYLE[label] ?? { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
  return (
    <span style={{ ...s, padding: '2px 8px', borderRadius: '9999px',
                   fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em',
                   whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, background: 'var(--surface-offset)', borderRadius: '9999px', height: '5px' }}>
        <div style={{ background: color, width: `${pct}%`, height: '5px', borderRadius: '9999px',
                      transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', minWidth: '28px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Results renderer ─────────────────────────────────────────────────────────
function Results({ result }: { result: AnalysisResult }) {
  const [showAll, setShowAll] = React.useState(false);
  const tier = TIER_CONFIG[result.evidence_tier] ?? TIER_CONFIG.INSUFFICIENT;
  const findings = result.findings ?? [];
  const visible = showAll ? findings : findings.slice(0, 5);
  const isAbort = result.clinical_directive?.startsWith('[ABORT]');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Clinical Directive */}
      <div style={{ borderRadius: '12px', border: `2px solid ${isAbort ? '#f87171' : '#34d399'}`,
                    background: isAbort ? '#fef2f2' : '#f0fdf4', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem', marginTop: '2px' }}>{isAbort ? '🚫' : '⚡'}</span>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: isAbort ? '#991b1b' : '#065f46',
                          marginBottom: '4px' }}>
              Clinical Directive
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600,
                        color: isAbort ? '#7f1d1d' : '#064e3b', lineHeight: '1.5', margin: 0 }}>
              {result.clinical_directive}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Tier Header */}
      <div style={{ background: tier.bg, border: `1px solid ${tier.border}`,
                    borderRadius: '12px', padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                           textTransform: 'uppercase', color: tier.text, opacity: 0.7 }}>
              Evidence Tier
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: tier.text, lineHeight: 1.2 }}>
              {tier.icon} {tier.label}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: tier.text }}>
                {result.articlesRetrieved}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                             letterSpacing: '0.05em' }}>analyzed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                {result.human_clinical_papers_found ?? '?'}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                             letterSpacing: '0.05em' }}>human clinical</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
                {result.preclinical_papers_found ?? '?'}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                             letterSpacing: '0.05em' }}>pre-clinical</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                {result.totalFound?.toLocaleString() ?? 0}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                             letterSpacing: '0.05em' }}>on PubMed</div>
            </div>
          </div>
          {result.badges && result.badges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginLeft: 'auto' }}>
              {result.badges.map(b => <EvidenceBadge key={b} label={b} />)}
            </div>
          )}
        </div>

        {/* PubMed query used */}
        <details style={{ marginTop: '0.75rem' }}>
          <summary style={{ fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer',
                             userSelect: 'none' }}>
            PubMed query used
          </summary>
          <code style={{ display: 'block', marginTop: '4px', fontSize: '0.65rem',
                          color: 'var(--text-muted)', background: 'var(--surface-offset)',
                          padding: '6px 8px', borderRadius: '6px', overflowX: 'auto',
                          wordBreak: 'break-all' }}>
            {result.pubmedQuery}
          </code>
        </details>
      </div>

      {/* Cynical Summary */}
      {result.cynical_summary && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Zeta-Core Verdict
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.6', margin: 0 }}>
            {result.cynical_summary}
          </p>
        </div>
      )}

      {/* Drug Interactions */}
      {(result.drug_interactions ?? []).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid #fca5a5',
                      borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: '#dc2626', marginBottom: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚠ Drug Interactions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.drug_interactions.map((di, i) => {
              const isHuman = di.evidence_source === 'Human Clinical';
              return (
                <div key={i} style={{ padding: '0.75rem', borderRadius: '8px',
                                      background: isHuman ? '#f0fdf4' : '#fffbeb',
                                      border: `1px solid ${isHuman ? '#bbf7d0' : '#fde68a'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
                                 flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{di.drug_a}</span>
                    <span style={{ color: 'var(--text-muted)' }}>↔</span>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{di.drug_b}</span>
                    <span style={{ marginLeft: '4px', padding: '1px 8px', borderRadius: '9999px',
                                   fontSize: '0.62rem', fontWeight: 700,
                                   background: isHuman ? '#dcfce7' : '#fef3c7',
                                   color: isHuman ? '#065f46' : '#78350f',
                                   border: `1px solid ${isHuman ? '#bbf7d0' : '#fde68a'}` }}>
                      {isHuman ? '✓ Human Clinical' : '⚠ Pre-Clinical Only'}
                    </span>
                    {di.auc_change && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600,
                                     color: '#dc2626' }}>
                        AUC: {di.auc_change}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0,
                               lineHeight: '1.5' }}>
                    {di.mechanism}
                    {di.clinical_impact && ` — ${di.clinical_impact}`}
                  </p>
                  {di.source_pmid && (
                    <div style={{ marginTop: '4px' }}>
                      <PubMedLink pmid={di.source_pmid} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mechanisms */}
      {(result.synthesized_mechanisms ?? []).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Synthesized Mechanisms
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.synthesized_mechanisms.map((m, i) => (
              <div key={i} style={{ padding: '0.75rem', borderRadius: '8px',
                                    background: 'var(--surface-offset)',
                                    border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                               marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{m.mechanism}</span>
                  {m.target && (
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.62rem',
                                   background: 'rgba(139,92,246,0.1)', color: '#7c3aed',
                                   border: '1px solid rgba(139,92,246,0.2)' }}>
                      {m.target}
                    </span>
                  )}
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto',
                                 fontWeight: 600 }}>
                    {m.evidence_strength}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0,
                             lineHeight: '1.5' }}>
                  {m.clinical_relevance}
                </p>
                {(m.supporting_pmids ?? []).length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {m.supporting_pmids.map(p => <PubMedLink key={p} pmid={p} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings */}
      {findings.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Paper-Level Findings ({findings.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visible.map((f, i) => {
              const isHuman = f.is_human_clinical;
              return (
                <div key={i} style={{ padding: '0.75rem', borderRadius: '8px',
                                      background: isHuman ? 'var(--surface-offset)' : '#fffbeb',
                                      border: `1px solid ${isHuman ? 'var(--border)' : '#fde68a'}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px',
                                 marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.62rem',
                                   fontWeight: 700,
                                   background: isHuman ? '#dcfce7' : '#fef3c7',
                                   color: isHuman ? '#065f46' : '#78350f' }}>
                      {isHuman ? '✓ Human Clinical' : '⚠ Pre-Clinical'}
                    </span>
                    <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.62rem',
                                   background: 'var(--surface-offset)', color: 'var(--text-muted)',
                                   border: '1px solid var(--border)' }}>
                      {f.evidence_type}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                      {f.year} · {f.journal}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)',
                               margin: '0 0 4px 0', lineHeight: '1.4' }}>
                    {f.title}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0,
                               lineHeight: '1.5' }}>
                    {f.finding}
                  </p>
                  {f.key_data_point && (
                    <div style={{ marginTop: '6px', padding: '4px 8px', borderRadius: '6px',
                                  background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)',
                                  fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                      {f.key_data_point}
                    </div>
                  )}
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center',
                                 gap: '8px', flexWrap: 'wrap' }}>
                    <PubMedLink pmid={f.pmid} />
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <ConfidenceBar value={f.confidence} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {findings.length > 5 && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{ marginTop: '0.75rem', width: '100%', padding: '8px', borderRadius: '8px',
                       background: 'transparent', border: '1px solid var(--border)',
                       color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
              {showAll ? '▲ Show fewer' : `▼ Show all ${findings.length} findings`}
            </button>
          )}
        </div>
      )}

      {/* Knowledge Gaps */}
      {(result.knowledge_gaps ?? []).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Knowledge Gaps
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 1.25rem' }}>
            {result.knowledge_gaps.map((g, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-muted)',
                                    lineHeight: '1.6', marginBottom: '4px' }}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discarded */}
      {(result.papers_discarded ?? []).length > 0 && (
        <details>
          <summary style={{ fontSize: '0.72rem', color: 'var(--text-faint)', cursor: 'pointer',
                             userSelect: 'none' }}>
            {result.papers_discarded.length} papers discarded (irrelevant / insufficient)
          </summary>
          <div style={{ marginTop: '0.5rem', padding: '0.75rem',
                        background: 'var(--surface-offset)', borderRadius: '8px' }}>
            {result.papers_discarded.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px',
                                    fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <PubMedLink pmid={p.pmid} />
                <span>— {p.reason}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Main ZetaCore page ───────────────────────────────────────────────────────
export default function ZetaCore() {
  const {
    question, setQuestion,
    disease, setDisease,
    compound, setCompound,
    treatmentLine, setTreatmentLine,
    genes, setGenes,
    queryHint, maxResults, setMaxResults,
    parsing, loading, result, error,
    streamState, showTrace, setShowTrace,
    resetContext, parseContext, analyze,
    hasContext,
  } = useZetaCore();

  const resultRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  }, [result]);

  return (
    <div>
      <style>{`
        @keyframes zc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .zc-hero {
          position: relative;
          padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 3rem) clamp(2.5rem, 6vw, 4rem);
          max-width: 1280px;
          margin-inline: auto;
          text-align: center;
          overflow: hidden;
        }
        .zc-hero-glow {
          position: absolute;
          top: -60px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 350px;
          background: radial-gradient(ellipse at center, rgba(8,145,178,0.12), transparent 70%);
          pointer-events: none;
        }
        .zc-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.25rem 0.9rem;
          background: var(--accent-subtle);
          border: 1px solid var(--accent);
          border-radius: 9999px;
          font-size: var(--text-xs); font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 1.25rem;
        }
        .zc-h1 {
          font-family: var(--font-display);
          font-size: clamp(2.25rem, 6vw, 4.5rem);
          font-weight: 800; letter-spacing: -0.03em;
          color: var(--text); margin-bottom: 1rem;
          line-height: 1.05;
        }
        .zc-h1-accent {
          background: linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .zc-lead {
          font-size: clamp(0.95rem, 1.8vw, 1.15rem);
          color: var(--text-muted); line-height: 1.7;
          max-width: 56ch; margin-inline: auto; margin-bottom: 0;
        }
        .zc-page { max-width: 860px; margin-inline: auto; padding: 0 clamp(1rem,4vw,2rem) 4rem; }
        .zc-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow-sm);
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .zc-label {
          font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 0.4rem;
          display: block;
        }
        .zc-input {
          width: 100%; padding: 0.5rem 0.75rem;
          background: var(--surface-offset);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.85rem; color: var(--text);
          font-family: var(--font-body);
          outline: none; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .zc-input:focus { border-color: var(--accent); }
        .zc-textarea {
          width: 100%; min-height: 80px;
          padding: 0.75rem; resize: none;
          background: var(--surface-offset);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.9rem; font-weight: 500; color: var(--text);
          font-family: var(--font-body); outline: none;
          box-sizing: border-box; transition: border-color 0.15s;
          line-height: 1.5;
        }
        .zc-textarea:focus { border-color: var(--accent); }
        .zc-btn-primary {
          flex: 1; padding: 0.65rem 1.25rem;
          background: var(--accent); color: #fff;
          border: none; border-radius: 8px;
          font-size: 0.875rem; font-weight: 700;
          cursor: pointer; transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .zc-btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
        .zc-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .zc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .zc-btn-ghost {
          padding: 0.5rem 0.875rem;
          background: transparent; border: 1px solid var(--border);
          border-radius: 8px; font-size: 0.78rem; color: var(--text-muted);
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
          display: flex; align-items: center; gap: 0.35rem;
        }
        .zc-btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .zc-ctx-tag {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 3px 10px;
          background: rgba(8,145,178,0.08); border: 1px solid rgba(8,145,178,0.2);
          border-radius: 9999px; font-size: 0.7rem;
        }
        .zc-ctx-remove {
          background: none; border: none; cursor: pointer;
          color: var(--text-faint); font-size: 0.75rem; line-height: 1;
          padding: 0; margin-left: 2px;
        }
        .zc-ctx-remove:hover { color: var(--text); }
        .zc-chip {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 4px 12px; border-radius: 9999px;
          font-size: 0.72rem; font-weight: 600; cursor: pointer;
          border: 1px solid; transition: opacity 0.15s;
        }
        .zc-chip:hover { opacity: 0.8; }
        .zc-chip:disabled { opacity: 0.5; cursor: not-allowed; }
        .zc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        @media (max-width: 600px) { .zc-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero */}
      <div className="zc-hero">
        <div className="zc-hero-glow" aria-hidden="true" />
        <div className="zc-eyebrow">
          <span>◆</span> Zeta-Core Evidence Engine
        </div>
        <h1 className="zc-h1">
          Evidence that <span className="zc-h1-accent">doesn't bullshit you</span>
        </h1>
        <p className="zc-lead">
          Ask a clinical question. Zeta-Core searches PubMed in real time, separates human
          clinical data from pre-clinical noise, and gives you a blunt verdict — with full glass-box
          transparency into every step.
        </p>
      </div>

      {/* Body */}
      <div className="zc-page">

        {/* Example chips */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--text-faint)',
                        marginBottom: '0.5rem' }}>
            Quick Start
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EXAMPLES.map(ex => (
              <button
                key={ex.label}
                className="zc-chip"
                disabled={loading || parsing}
                style={{ background: CAT_COLORS[ex.category] ?? 'var(--surface-offset)',
                         borderColor: CAT_BORDER[ex.category] ?? 'var(--border)',
                         color: CAT_BORDER[ex.category] ?? 'var(--text-muted)' }}
                onClick={() => {
                  setQuestion(ex.question);
                  resetContext();
                  parseContext(ex.question);
                }}
              >
                › {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input card */}
        <div className="zc-card">
          {/* Question textarea */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <textarea
              className="zc-textarea"
              placeholder={'Type your clinical question…\ne.g. "Does olaparib work in BRCA1-mutant ovarian cancer second line?"'}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) analyze(); }}
            />
            <button
              className="zc-btn-ghost"
              style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.7rem',
                       padding: '4px 10px' }}
              disabled={parsing || !question.trim() || question.trim().length < 10}
              onClick={() => parseContext(question)}
            >
              {parsing ? '↻ Parsing…' : '✦ AI Parse'}
            </button>
          </div>

          {/* Context tags */}
          {hasContext && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
                             flexWrap: 'wrap', marginBottom: '4px' }}>
                {disease && (
                  <span className="zc-ctx-tag">
                    <span style={{ color: 'var(--text-muted)' }}>Disease:</span>
                    <span style={{ fontWeight: 600 }}>{disease}</span>
                    <button className="zc-ctx-remove" onClick={() => setDisease('')}>✕</button>
                  </span>
                )}
                {compound && (
                  <span className="zc-ctx-tag">
                    <span style={{ color: 'var(--text-muted)' }}>Drug:</span>
                    <span style={{ fontWeight: 600 }}>{compound}</span>
                    <button className="zc-ctx-remove" onClick={() => setCompound('')}>✕</button>
                  </span>
                )}
                {treatmentLine && (
                  <span className="zc-ctx-tag">
                    <span style={{ color: 'var(--text-muted)' }}>Line:</span>
                    <span style={{ fontWeight: 600 }}>{treatmentLine}</span>
                    <button className="zc-ctx-remove" onClick={() => setTreatmentLine('')}>✕</button>
                  </span>
                )}
                {genes.map(g => (
                  <span key={g} className="zc-ctx-tag">
                    <span style={{ color: 'var(--text-muted)' }}>Gene:</span>
                    <span style={{ fontWeight: 600 }}>{g}</span>
                    <button className="zc-ctx-remove" onClick={() => setGenes(prev => prev.filter(x => x !== g))}>✕</button>
                  </span>
                ))}
                <button className="zc-ctx-remove" style={{ marginLeft: 'auto', fontSize: '0.68rem',
                                                            color: 'var(--text-faint)', textDecoration: 'underline' }}
                        onClick={resetContext}>
                  Clear all
                </button>
              </div>
              {queryHint && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontStyle: 'italic',
                             margin: 0, paddingLeft: '2px' }}>
                  {queryHint}
                </p>
              )}
            </div>
          )}

          {/* Edit context */}
          <details style={{ marginBottom: '0.75rem' }}>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-muted)',
                               cursor: 'pointer', userSelect: 'none' }}>
              Edit context manually
            </summary>
            <div className="zc-grid2" style={{ marginTop: '0.75rem' }}>
              {[
                { label: 'Disease', val: disease, set: setDisease, ph: 'e.g. ovarian cancer' },
                { label: 'Drug / Compound', val: compound, set: setCompound, ph: 'e.g. olaparib' },
                { label: 'Treatment Line', val: treatmentLine, set: setTreatmentLine, ph: 'e.g. 2nd line' },
              ].map(f => (
                <div key={f.label}>
                  <label className="zc-label">{f.label}</label>
                  <input className="zc-input" value={f.val}
                         onChange={e => f.set(e.target.value)} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label className="zc-label">Genes (comma-separated)</label>
                <input className="zc-input"
                       value={genes.join(', ')}
                       onChange={e => setGenes(e.target.value.split(',').map(g => g.trim()).filter(Boolean))}
                       placeholder="e.g. BRCA1, MBD4" />
              </div>
            </div>
          </details>

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Papers:</span>
              <select
                style={{ height: '32px', borderRadius: '6px', border: '1px solid var(--border)',
                          background: 'var(--surface)', padding: '0 8px', fontSize: '0.78rem',
                          color: 'var(--text)' }}
                value={maxResults}
                onChange={e => setMaxResults(e.target.value)}
              >
                {['5', '8', '12', '20'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>

            {result && (
              <button className="zc-btn-ghost"
                      onClick={() => { /* reset handled in hook result */ }}>
                ↺ New query
              </button>
            )}

            <button className="zc-btn-primary" disabled={loading || !question.trim()}
                    onClick={analyze}>
              {loading
                ? <><span style={{ animation: 'zc-spin 1s linear infinite', display: 'inline-block' }}>↻</span> Running analysis…</>
                : <>◆ Run Zeta-Core</>}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px',
                          background: '#fef2f2', border: '1px solid #fca5a5',
                          fontSize: '0.82rem', color: '#991b1b', fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Streaming trace */}
        {streamState.phase !== 'idle' && (
          <div style={{ marginBottom: '1rem' }}>
            <StreamPanel
              state={streamState}
              collapsible={streamState.phase === 'complete'}
              open={showTrace}
              onToggle={() => setShowTrace(v => !v)}
            />
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultRef}>
            <Results result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
