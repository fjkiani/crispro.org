import { useState } from 'react';
import type { AnnotatedVariant } from '../types/triage';
import './PanelResultsTable.css';

interface Props {
  variants: AnnotatedVariant[];
}

type SortKey = 'priority' | 'gene' | 'delta' | 'splice';

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

function priorityClass(priority: string): string {
  if (priority === 'High') return 'priority-badge--high';
  if (priority === 'Medium') return 'priority-badge--medium';
  return 'priority-badge--low';
}

function spliceClass(risk: string): string {
  if (risk?.toLowerCase().includes('high')) return 'splice-badge--high';
  if (risk?.toLowerCase().includes('moderate')) return 'splice-badge--moderate';
  return 'splice-badge--low';
}

function fmt(n: number | null | undefined, digits = 4): string {
  if (n == null) return '—';
  return n >= 0 ? `+${n.toFixed(digits)}` : n.toFixed(digits);
}

function pct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(0)}%`;
}

export default function PanelResultsTable({ variants }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...variants].sort((a, b) => {
    const ap = a.composite?.priority ?? 'Low';
    const bp = b.composite?.priority ?? 'Low';
    if (sortKey === 'priority') return PRIORITY_ORDER[ap] - PRIORITY_ORDER[bp];
    if (sortKey === 'gene') return (a.input.gene_symbol ?? '').localeCompare(b.input.gene_symbol ?? '');
    if (sortKey === 'delta') {
      const ad = a.evo2?.delta_score ?? 0;
      const bd = b.evo2?.delta_score ?? 0;
      return ad - bd; // most negative first (LOF direction)
    }
    if (sortKey === 'splice') {
      const sorder = { 'High Risk': 0, 'Moderate Risk': 1, 'Low/Unknown Risk': 2 };
      const as_ = sorder[(a.evo2?.splice_risk as keyof typeof sorder)] ?? 2;
      const bs_ = sorder[(b.evo2?.splice_risk as keyof typeof sorder)] ?? 2;
      return as_ - bs_;
    }
    return 0;
  });

  function SortBtn({ label, k }: { label: string; k: SortKey }) {
    return (
      <button
        className={`sort-btn${sortKey === k ? ' sort-btn--active' : ''}`}
        onClick={() => setSortKey(k)}
      >
        {label} {sortKey === k ? '↑' : ''}
      </button>
    );
  }

  return (
    <div className="panel-results">
      <div className="panel-results-toolbar">
        <span className="panel-results-label">Sort by:</span>
        <SortBtn label="Priority" k="priority" />
        <SortBtn label="Gene" k="gene" />
        <SortBtn label="Evo2 Δ" k="delta" />
        <SortBtn label="Splice Risk" k="splice" />
      </div>

      <div className="panel-results-scroll">
        <table className="panel-results-table">
          <thead>
            <tr>
              <th></th>
              <th>Priority</th>
              <th>Gene</th>
              <th>Evo2 Δ Score</th>
              <th>Prediction</th>
              <th>Splice Risk</th>
              <th>Cancer Tier</th>
              <th>Pathways</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v) => {
              const id = v.input.clinvar_id ?? `${v.input.gene_symbol}-${v.input.pos}`;
              const isExpanded = expandedIds.has(id);
              const priority = v.composite?.priority ?? 'Low';
              const hasError = !!v.error;

              return (
                <>
                  <tr
                    key={id}
                    className={`panel-row${isExpanded ? ' panel-row--expanded' : ''}${hasError ? ' panel-row--error' : ''}`}
                    onClick={() => toggleExpand(id)}
                  >
                    <td className="panel-cell-expand">{isExpanded ? '▼' : '▶'}</td>
                    <td>
                      <span className={`priority-badge ${priorityClass(priority)}`}>{priority}</span>
                    </td>
                    <td className="panel-cell-gene">
                      <span className="panel-gene-symbol">{v.input.gene_symbol}</span>
                      <span className="panel-gene-locus">
                        {v.input.chr}:{v.input.pos.toLocaleString()}
                      </span>
                    </td>
                    <td className="panel-cell-delta">
                      {hasError ? (
                        <span className="panel-error-tag">Error</span>
                      ) : (
                        <span className={`delta-value${(v.evo2?.delta_score ?? 0) < 0 ? ' delta-value--neg' : ' delta-value--pos'}`}>
                          {fmt(v.evo2?.delta_score, 5)}
                        </span>
                      )}
                    </td>
                    <td>
                      {!hasError && v.evo2 && (
                        <span className={`pred-badge${v.evo2.prediction.toLowerCase().includes('pathogenic') ? ' pred-badge--path' : ' pred-badge--benign'}`}>
                          {v.evo2.prediction}
                        </span>
                      )}
                    </td>
                    <td>
                      {!hasError && v.evo2?.splice_risk && (
                        <span className={`splice-badge ${spliceClass(v.evo2.splice_risk)}`}>
                          {v.evo2.splice_risk}
                        </span>
                      )}
                    </td>
                    <td>
                      {v.cancer_annotation?.cancer_gene_tier && (
                        <span className="tier-badge">{v.cancer_annotation.cancer_gene_tier}</span>
                      )}
                    </td>
                    <td className="panel-cell-pathways">
                      {v.cancer_annotation?.pathways?.slice(0, 2).map((p) => (
                        <span key={p} className="pathway-tag">{p}</span>
                      ))}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${id}-detail`} className="panel-row-detail">
                      <td colSpan={8}>
                        <div className="panel-detail">
                          {hasError ? (
                            <div className="panel-detail-error">
                              <strong>Analysis error:</strong> {v.error}
                            </div>
                          ) : (
                            <div className="panel-detail-grid">
                              {/* Score breakdown */}
                              {v.composite && (
                                <div className="panel-detail-card">
                                  <div className="panel-detail-card-title">Score Breakdown</div>
                                  <div className="panel-detail-rows">
                                    <div className="panel-detail-row">
                                      <span>Composite Score</span>
                                      <strong>{v.composite.raw_score.toFixed(3)}</strong>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Evo2 Pathogenicity (35%)</span>
                                      <span>{v.composite.score_components.evo2_pathogenicity.toFixed(2)}</span>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Splice Severity (30%)</span>
                                      <span>{v.composite.score_components.splice_severity.toFixed(2)}</span>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Cancer Gene Tier (20%)</span>
                                      <span>{v.composite.score_components.cancer_gene_tier.toFixed(2)}</span>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Evo2 Confidence (15%)</span>
                                      <span>{pct(v.composite.score_components.evo2_confidence)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Evo2 model details */}
                              {v.evo2 && (
                                <div className="panel-detail-card">
                                  <div className="panel-detail-card-title">Evo2 Model Details</div>
                                  <div className="panel-detail-rows">
                                    <div className="panel-detail-row">
                                      <span>Delta Score</span>
                                      <strong className={`delta-value${v.evo2.delta_score < 0 ? ' delta-value--neg' : ' delta-value--pos'}`}>
                                        {fmt(v.evo2.delta_score, 6)}
                                      </strong>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Confidence</span>
                                      <span>{pct(v.evo2.classification_confidence)}</span>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Splice Risk</span>
                                      <span>{v.evo2.splice_risk}</span>
                                    </div>
                                    {v.evo2.splice_position != null && (
                                      <div className="panel-detail-row">
                                        <span>Nearest Boundary</span>
                                        <span className="mono">{v.evo2.splice_position.toLocaleString()} ({v.evo2.splice_boundary})</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Cancer annotation */}
                              {v.cancer_annotation?.is_cancer_gene && (
                                <div className="panel-detail-card">
                                  <div className="panel-detail-card-title">Cancer Gene Context</div>
                                  <div className="panel-detail-rows">
                                    <div className="panel-detail-row">
                                      <span>Tier</span>
                                      <span>{v.cancer_annotation.cancer_gene_tier}</span>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Role</span>
                                      <span>{v.cancer_annotation.gene_role}</span>
                                    </div>
                                    {v.cancer_annotation.oncokb_level && (
                                      <div className="panel-detail-row">
                                        <span>OncoKB</span>
                                        <span>{v.cancer_annotation.oncokb_level}</span>
                                      </div>
                                    )}
                                    <div className="panel-detail-row">
                                      <span>Cancer Types</span>
                                      <span>{v.cancer_annotation.cancer_types.join(', ')}</span>
                                    </div>
                                    <div className="panel-detail-row">
                                      <span>Pathways</span>
                                      <span>{v.cancer_annotation.pathways.join(', ')}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* ClinVar context */}
                              {v.clinvar_context && (
                                <div className="panel-detail-card panel-detail-card--wide">
                                  <div className="panel-detail-card-title">ClinVar Context</div>
                                  <p className="panel-detail-clinvar">{v.clinvar_context}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
