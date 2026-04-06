import { useRef, useEffect } from 'react';
import type { StreamStep, StreamState } from '../hooks/useZetaCore';

function StepIcon({ type }: { type: string }) {
  if (['query_ready', 'pubmed_results', 'synthesis_done'].includes(type))
    return <span style={{ color: 'var(--emerald)' }}>✓</span>;
  if (type === 'query_fallback')
    return <span style={{ color: 'var(--amber)' }}>⚠</span>;
  if (type === 'no_results')
    return <span style={{ color: 'var(--red)' }}>✕</span>;
  if (type === 'synthesis_tick')
    return <span style={{ color: 'var(--text-dim)' }}>·</span>;
  if (type === 'synthesis_start')
    return <span style={{ color: 'var(--purple)' }}>◆</span>;
  if (['pubmed_searching', 'query_formulating'].includes(type))
    return <span className="zc-spin" style={{ color: 'var(--cyan)', display: 'inline-block' }}>↻</span>;
  return <span style={{ color: 'var(--text-muted)' }}>›</span>;
}

function stepColor(type: string): string {
  if (['query_ready', 'pubmed_results', 'synthesis_done'].includes(type)) return 'var(--emerald)';
  if (type === 'query_fallback') return 'var(--amber)';
  if (type === 'no_results') return 'var(--red)';
  if (type === 'synthesis_tick') return 'var(--text-secondary)';
  if (type === 'synthesis_start') return 'var(--purple)';
  if (['pubmed_searching', 'query_formulating'].includes(type)) return 'var(--cyan)';
  return 'var(--text-muted)';
}

function StreamLine({ step }: { step: StreamStep }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                    fontSize: '0.7rem', color: stepColor(step.type) }}>
        <span style={{ marginTop: '1px', minWidth: '14px', textAlign: 'center' }}>
          <StepIcon type={step.type} />
        </span>
        <span style={{ lineHeight: '1.5', flex: 1, color: 'var(--text-secondary)' }}>{step.message}</span>
        {step.count !== undefined && step.total !== undefined && (
          <span style={{ marginLeft: 'auto', flexShrink: 0, color: 'var(--text-muted)',
                         fontVariantNumeric: 'tabular-nums', fontSize: '0.65rem' }}>
            {step.count}/{step.total.toLocaleString()}
          </span>
        )}
      </div>
      {step.query && (
        <div style={{ marginLeft: '1.5rem', marginTop: '2px', fontSize: '0.6rem',
                      color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all',
                      lineHeight: '1.5' }}>
          <span style={{ color: 'var(--text-secondary)' }}>→ </span>{step.query}
        </div>
      )}
      {step.papers && step.papers.length > 0 && (
        <div style={{ marginLeft: '1.5rem', marginTop: '4px' }}>
          {step.papers.slice(0, 12).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                                   fontSize: '0.62rem', marginBottom: '2px' }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0, width: '18px', textAlign: 'right',
                             fontVariantNumeric: 'tabular-nums' }}>{i + 1}.</span>
              <span style={{ color: 'var(--cyan)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                [{p.pmid}]
              </span>
              <span style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>{p.title}</span>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }}>{p.year}</span>
            </div>
          ))}
          {step.papers.length > 12 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', marginLeft: '1rem' }}>
              +{step.papers.length - 12} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  state: StreamState;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}

export default function StreamPanel({ state, collapsible, open, onToggle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunning = state.phase === 'running';

  useEffect(() => {
    if (scrollRef.current && isRunning) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.steps.length, isRunning]);

  const collapsed = collapsible && !open;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '12px',
                  background: 'var(--surface-offset)', overflow: 'hidden', fontFamily: 'var(--font-mono)' }}>
      <style>{`
        @keyframes zc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .zc-spin { animation: zc-spin 1s linear infinite; }
        @keyframes zc-bounce { 0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-3px);opacity:0.5} }
        .zc-live-dot { display:inline-block; width:6px; height:6px; border-radius:50%;
                       background: var(--emerald); animation:zc-bounce 0.8s ease infinite; }
        .zc-live-dot:nth-child(2){animation-delay:0.15s}
        .zc-live-dot:nth-child(3){animation-delay:0.3s}
      `}</style>

      <button
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                 padding: '0.5rem 0.75rem', background: 'var(--surface)',
                 borderBottom: '1px solid var(--border)',
                 cursor: collapsible ? 'pointer' : 'default', border: 'none', textAlign: 'left' }}
        onClick={collapsible ? onToggle : undefined}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>◆</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                       textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Analysis Trace
        </span>
        {isRunning && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
            <span className="zc-live-dot" />
            <span className="zc-live-dot" />
            <span className="zc-live-dot" />
            <span style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--emerald)',
                           textTransform: 'uppercase', marginLeft: '3px' }}>live</span>
          </span>
        )}
        {state.phase === 'complete' && (
          <span style={{ fontSize: '0.6rem', color: 'var(--emerald)', marginLeft: '4px',
                         letterSpacing: '0.08em', textTransform: 'uppercase' }}>✓ done</span>
        )}
        {state.phase === 'error' && (
          <span style={{ fontSize: '0.6rem', color: 'var(--red)', marginLeft: '4px',
                         letterSpacing: '0.08em', textTransform: 'uppercase' }}>error</span>
        )}
        {collapsible && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            {open ? '▲' : '▼'}
          </span>
        )}
      </button>

      {!collapsed && (
        <div ref={scrollRef} style={{ padding: '0.75rem',
                                      maxHeight: isRunning ? '420px' : '260px',
                                      overflowY: 'auto' }}>
          {state.steps.length === 0 && isRunning && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex',
                          alignItems: 'center', gap: '0.5rem' }}>
              <span className="zc-spin" style={{ color: 'var(--cyan)' }}>↻</span>
              Initializing engine…
            </div>
          )}
          {state.steps.map((step, i) => <StreamLine key={i} step={step} />)}
        </div>
      )}
    </div>
  );
}
