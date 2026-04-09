import { useCallback, useMemo, useState } from 'react';
import { Copy, Check, Loader2, Microscope } from 'lucide-react';
import { PLATFORM } from '../constants';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';

type ResearchResponse = Record<string, unknown>;

function buildExportText(
  question: string,
  deep: boolean,
  contextJson: string,
  data: ResearchResponse | null,
  lastError: string | null,
): string {
  let contextParsed: unknown = {};
  try {
    contextParsed = contextJson.trim() ? JSON.parse(contextJson) : {};
  } catch {
    contextParsed = { _parse_error: 'invalid JSON in context field', raw: contextJson };
  }
  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      site: PLATFORM.fullName,
      question,
      deep_research: deep,
      context: contextParsed,
      api_response: data,
      last_error: lastError,
      note: 'gemini_api_key is never included in exports',
    },
    null,
    2,
  );
}

export default function ResearchIntelligence() {
  const [question, setQuestion] = useState('');
  const [contextJson, setContextJson] = useState('{}');
  const [deep, setDeep] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => {
    if (!question.trim()) return false;
    if (deep && !geminiKey.trim()) return false;
    return true;
  }, [question, deep, geminiKey]);

  const runResearch = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      let context: Record<string, unknown> = {};
      try {
        context = contextJson.trim() ? (JSON.parse(contextJson) as Record<string, unknown>) : {};
      } catch {
        throw new Error('Context must be valid JSON (e.g. {} or {"disease":"..."})');
      }
      const body: Record<string, unknown> = {
        question: question.trim(),
        context,
        deep,
      };
      if (deep) {
        body.gemini_api_key = geminiKey.trim();
      }
      const url = `${API_BASE}/api/v1/research-intelligence/research`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      let json: ResearchResponse;
      try {
        json = JSON.parse(text) as ResearchResponse;
      } catch {
        throw new Error(text.slice(0, 400) || `HTTP ${resp.status}`);
      }
      if (!resp.ok) {
        const detail = (json as { detail?: unknown }).detail;
        const msg =
          typeof detail === 'string'
            ? detail
            : JSON.stringify(detail ?? json);
        throw new Error(msg || `HTTP ${resp.status}`);
      }
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const canCopy = useMemo(
    () => Boolean(question.trim() || contextJson.trim() || result || error),
    [question, contextJson, result, error],
  );

  const copyAll = useCallback(async () => {
    if (!canCopy) return;
    const text = buildExportText(question, deep, contextJson, result, error);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard not available');
    }
  }, [question, deep, contextJson, result, error, canCopy]);

  const sf = (result?.synthesized_findings ?? {}) as Record<string, unknown>;
  const evidenceSummary = typeof sf.evidence_summary === 'string' ? sf.evidence_summary : '';
  const mechanisms = Array.isArray(sf.mechanisms) ? sf.mechanisms : [];
  const tier = typeof sf.evidence_tier === 'string' ? sf.evidence_tier : '';
  const method = typeof sf.method === 'string' ? sf.method : '';

  return (
    <div className="ri-page">
      <style>{`
        .ri-page { max-width: 900px; margin: 0 auto; padding: clamp(1.5rem, 4vw, 2.5rem) 1rem 3rem; }
        .ri-hero { text-align: center; margin-bottom: 2rem; }
        .ri-eyebrow {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 0.75rem;
        }
        .ri-h1 {
          font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.35rem);
          font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin: 0 0 0.75rem;
        }
        .ri-lead { color: var(--text-muted); font-size: 0.95rem; line-height: 1.55; max-width: 52ch; margin: 0 auto; }
        .ri-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
          padding: 1.25rem 1.35rem; margin-bottom: 1rem;
        }
        .ri-label { display: block; font-size: 0.72rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem; }
        .ri-input, .ri-textarea {
          width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem;
          border-radius: 8px; border: 1px solid var(--border); background: var(--surface-offset);
          color: var(--text); font-size: 0.88rem; font-family: var(--font-body);
        }
        .ri-textarea { min-height: 100px; resize: vertical; }
        .ri-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .ri-switch {
          display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;
          font-size: 0.85rem; font-weight: 600; color: var(--text);
        }
        .ri-switch input { width: 1rem; height: 1rem; accent-color: var(--accent); }
        .ri-hint { font-size: 0.72rem; color: var(--text-faint); margin-top: 0.35rem; line-height: 1.4; }
        .ri-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; margin-top: 1rem; }
        .ri-btn-primary {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.65rem 1.2rem; border: none; border-radius: 8px;
          background: var(--accent); color: #fff; font-weight: 700; font-size: 0.85rem; cursor: pointer;
        }
        .ri-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .ri-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.55rem 1rem; border-radius: 8px; border: 1px solid var(--border);
          background: transparent; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; cursor: pointer;
        }
        .ri-btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .ri-error {
          margin-top: 0.75rem; padding: 0.75rem; border-radius: 8px;
          background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 0.82rem;
        }
        .ri-summary {
          white-space: pre-wrap; font-size: 0.88rem; line-height: 1.55; color: var(--text);
          background: var(--surface-offset); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);
        }
        .ri-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }
        @keyframes ri-spin { to { transform: rotate(360deg); } }
        .ri-spin { animation: ri-spin 1s linear infinite; }
      `}</style>

      <div className="ri-hero">
        <div className="ri-eyebrow">
          <Microscope size={14} /> Research Intelligence
        </div>
        <h1 className="ri-h1">Multi-portal synthesis</h1>
        <p className="ri-lead">
          PubMed-backed research pipeline with optional <strong>Deep Research</strong> (BM25 → map–reduce → Zeta-Core
          directive). Deep mode uses <strong>your</strong> Gemini API key for this request only — it is never stored.
          Baseline mode uses server configuration only.
        </p>
      </div>

      <div className="ri-card">
        <label className="ri-label">Clinical question</label>
        <textarea
          className="ri-textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Efficacy of trastuzumab deruxtecan in HER2-low metastatic breast cancer"
        />

        <label className="ri-label" style={{ marginTop: '1rem' }}>
          Context (JSON object)
        </label>
        <textarea
          className="ri-textarea"
          style={{ minHeight: 72, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
          value={contextJson}
          onChange={(e) => setContextJson(e.target.value)}
          placeholder='{"disease":"breast cancer","treatment_line":"2nd line"}'
        />

        <div className="ri-row" style={{ marginTop: '1rem' }}>
          <label className="ri-switch">
            <input type="checkbox" checked={deep} onChange={(e) => setDeep(e.target.checked)} />
            Deep Research (Gemini key required)
          </label>
        </div>
        {deep && (
          <>
            <label className="ri-label">Your Gemini API key (Google AI Studio)</label>
            <input
              className="ri-input"
              type="password"
              autoComplete="off"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza…"
            />
            <p className="ri-hint">
              Sent once over HTTPS with your request; the backend does not persist it. Required to run the deep
              map–reduce path (large context / JSON contract).
            </p>
          </>
        )}

        <div className="ri-actions">
          <button type="button" className="ri-btn-primary" disabled={!canSubmit || loading} onClick={runResearch}>
            {loading ? (
              <>
                <Loader2 size={16} className="ri-spin" /> Running…
              </>
            ) : (
              'Run research'
            )}
          </button>
          {canCopy && (
            <button type="button" className="ri-btn-ghost" onClick={copyAll}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy all context'}
            </button>
          )}
        </div>

        {!API_BASE && (
          <p className="ri-hint" style={{ marginTop: '0.75rem', color: '#b45309' }}>
            Set <code>VITE_API_URL</code> to your FastAPI origin (e.g. production Render URL) before building for
            production.
          </p>
        )}

        {error && <div className="ri-error">{error}</div>}
      </div>

      {result && (
        <div className="ri-card">
          <div className="ri-label">Synthesis</div>
          {tier && (
            <p className="ri-meta">
              Evidence tier: <strong>{tier}</strong>
              {method ? ` · method: ${method}` : ''}
            </p>
          )}
          {evidenceSummary ? (
            <div className="ri-summary">{evidenceSummary}</div>
          ) : (
            <p className="ri-meta">No evidence_summary in response. Use &quot;Copy all context&quot; for full JSON.</p>
          )}
          <p className="ri-meta">Mechanisms extracted: {mechanisms.length}</p>
        </div>
      )}
    </div>
  );
}
