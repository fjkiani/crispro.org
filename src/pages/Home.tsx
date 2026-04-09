import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Dna, ShieldCheck, FileText, FlaskConical, Hospital, Zap } from 'lucide-react';
import { PLATFORM, PROVENANCE, PRODUCTS } from '../constants';

// ── Icon map by product title ──────────────────────────────────────────────
const PRODUCT_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  'Platinum Window':     Dna,
  'Progression Arbiter': ShieldCheck,
  'PAE-Onc':             FileText,
  'Evidence':            Zap,
  'Zeta-Core':           Zap,
  'Resistance Profiler': FlaskConical,
  'Trial Matcher':        Hospital,
  'Research Intelligence': FlaskConical,
};

// ── Gradient map by product title ─────────────────────────────────────────
const GRADIENT_MAP: Record<string, [string, string]> = {
  'Platinum Window':     ['#7c3aed', '#4f46e5'],
  'Progression Arbiter': ['#059669', '#0d9488'],
  'PAE-Onc':             ['#dc2626', '#e11d48'],
  'Evidence':            ['#0891b2', '#2563eb'],
  'Zeta-Core':           ['#0891b2', '#2563eb'],
  'Resistance Profiler': ['#d97706', '#ea580c'],
  'Trial Matcher':        ['#0284c7', '#2563eb'],
  'Research Intelligence': ['#6366f1', '#7c3aed'],
};

export default function Home() {
  const liveProducts = PRODUCTS.filter(p => p.status === 'LIVE' || p.status === 'BETA');
  const soonProducts = PRODUCTS.filter(p => p.status === 'COMING SOON');

  return (
    <div>
      <style>{`
        /* ── Hero ────────────────────────────────────────────────────── */
        .home-hero {
          position: relative;
          padding: clamp(5rem, 12vw, 9rem) clamp(1rem, 5vw, 3rem) clamp(4rem, 8vw, 7rem);
          max-width: 1280px;
          margin-inline: auto;
          text-align: center;
          overflow: hidden;
        }
        .home-hero-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .home-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.9rem;
          background: var(--accent-subtle);
          border: 1px solid var(--accent);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 1.5rem;
        }
        .home-h1 {
          font-family: var(--font-display);
          font-size: clamp(2.75rem, 7vw, 5.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.0;
          color: var(--text);
          margin-bottom: 1.25rem;
          max-width: 14ch;
          margin-inline: auto;
        }
        .home-h1-accent {
          background: linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .home-lead {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 54ch;
          margin-inline: auto;
          margin-bottom: 2.5rem;
        }
        .home-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 3.5rem;
        }
        .home-hero-disclaimer {
          font-size: var(--text-xs);
          color: var(--text-faint);
          letter-spacing: 0.04em;
        }
        /* ── Stats Bar ─────────────────────────────────────────────── */
        .home-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          flex-wrap: wrap;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 0;
          overflow: hidden;
          max-width: 900px;
          margin-inline: auto;
          box-shadow: var(--shadow-md);
        }
        .home-stat {
          flex: 1;
          min-width: 120px;
          text-align: center;
          padding: 1.25rem 1rem;
          position: relative;
        }
        .home-stat + .home-stat::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 1px;
          background: var(--divider);
        }
        .home-stat-value {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 3vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          line-height: 1;
          display: block;
        }
        .home-stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          display: block;
          margin-top: 0.25rem;
          letter-spacing: 0.02em;
        }
        /* ── Section headings ──────────────────────────────────────── */
        .home-section {
          padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 3rem);
          max-width: 1280px;
          margin-inline: auto;
        }
        .home-section-label {
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        .home-section-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2.25rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          margin-bottom: 0.75rem;
          max-width: 20ch;
        }
        .home-section-sub {
          font-size: var(--text-base);
          color: var(--text-muted);
          max-width: 52ch;
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }
        /* ── Product Cards ─────────────────────────────────────────── */
        .home-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
        }
        .home-product-card {
          display: flex;
          flex-direction: column;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          overflow: hidden;
          transition: transform 220ms var(--ease-out-expo), box-shadow 220ms var(--ease-out-expo), border-color 220ms ease;
          text-decoration: none;
          color: inherit;
        }
        .home-product-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-hover);
        }
        .home-product-card-header {
          padding: 1.5rem 1.5rem 1rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .home-product-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
        }
        .home-product-meta {
          flex: 1;
          min-width: 0;
        }
        .home-product-tag {
          font-size: var(--text-xs);
          color: var(--text-faint);
          margin-bottom: 0.25rem;
          letter-spacing: 0.02em;
        }
        .home-product-title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
          line-height: 1.2;
        }
        .home-product-body {
          padding: 0 1.5rem 1rem;
          flex: 1;
        }
        .home-product-desc {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.6;
          max-width: none;
        }
        .home-product-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border-top: 1px solid var(--divider);
          border-bottom: 1px solid var(--divider);
        }
        .home-product-stat {
          text-align: center;
          padding: 0.75rem 0.5rem;
          position: relative;
        }
        .home-product-stat + .home-product-stat::before {
          content: '';
          position: absolute;
          left: 0;
          top: 15%;
          height: 70%;
          width: 1px;
          background: var(--divider);
        }
        .home-product-stat-val {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text);
          display: block;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .home-product-stat-lbl {
          font-size: 0.65rem;
          color: var(--text-faint);
          display: block;
          margin-top: 0.15rem;
          letter-spacing: 0.02em;
        }
        .home-product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
        }
        .home-product-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--accent);
          letter-spacing: -0.01em;
          transition: gap 180ms ease;
        }
        .home-product-card:hover .home-product-cta { gap: 0.55rem; }
        /* ── Disabled card ────────────────────────────── */
        .home-product-card.disabled {
          opacity: 0.65;
          cursor: default;
          pointer-events: none;
        }
        /* ── The 90% section ──────────────────────────────────────── */
        .home-mission {
          background: var(--surface);
          border-top: 1px solid var(--divider);
          border-bottom: 1px solid var(--divider);
          padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 3rem);
        }
        .home-mission-inner {
          max-width: 1080px;
          margin-inline: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem 5rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .home-mission-inner { grid-template-columns: 1fr; gap: 2rem; }
        }
        .home-mission-stat-big {
          font-family: var(--font-display);
          font-size: clamp(4rem, 10vw, 7rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--text);
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .home-mission-stat-big span {
          background: linear-gradient(135deg, var(--accent), #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .home-mission-caption {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: var(--text-muted);
          max-width: 38ch;
          line-height: 1.5;
        }
        .home-mission-points {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .home-mission-point {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }
        .home-mission-point-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          margin-top: 7px;
        }
        .home-mission-point-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 0.15rem;
          letter-spacing: -0.01em;
        }
        .home-mission-point-body {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.55;
          max-width: none;
        }
        /* ── Pipeline section ─────────────────────────────────────── */
        .home-pipeline {
          padding: clamp(3rem, 8vw, 6rem) clamp(1rem, 5vw, 3rem);
          max-width: 1080px;
          margin-inline: auto;
        }
        .home-pipeline-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          position: relative;
        }
        .home-pipeline-step {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: border-color var(--transition-ui), box-shadow var(--transition-ui);
        }
        .home-pipeline-step:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .home-pipeline-num {
          font-family: var(--font-display);
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent);
          text-transform: uppercase;
        }
        .home-pipeline-icon {
          font-size: 1.5rem;
          line-height: 1;
        }
        .home-pipeline-label {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .home-pipeline-desc {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.5;
          max-width: none;
        }
        /* ── Coming soon section ──────────────────────────────────── */
        .home-soon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }
        .home-soon-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          opacity: 0.7;
        }
        .home-soon-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .home-soon-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .home-soon-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .home-soon-desc {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.5;
          max-width: none;
        }
        /* ── CTA Banner ────────────────────────────────────────────── */
        .home-cta-banner {
          margin: 0 clamp(1rem, 4vw, 3rem) clamp(3rem, 6vw, 5rem);
          background: linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%);
          border-radius: var(--radius-2xl);
          padding: clamp(2.5rem, 5vw, 4rem);
          text-align: center;
          position: relative;
          overflow: hidden;
          max-width: 1080px;
          margin-inline: auto;
        }
        .home-cta-banner-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.12), transparent 60%);
          pointer-events: none;
        }
        .home-cta-banner-eyebrow {
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          margin-bottom: 0.75rem;
        }
        .home-cta-banner-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2.25rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: white;
          margin-bottom: 0.75rem;
          max-width: 20ch;
          margin-inline: auto;
        }
        .home-cta-banner-sub {
          font-size: var(--text-base);
          color: rgba(255,255,255,0.75);
          max-width: 44ch;
          margin-inline: auto;
          margin-bottom: 2rem;
          line-height: 1.6;
          max-width: none;
        }
        .home-cta-banner-btns {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .btn-white {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.7em 1.4em;
          background: white;
          color: #0891b2;
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          font-weight: 700;
          letter-spacing: -0.01em;
          transition: transform var(--transition-ui), box-shadow var(--transition-ui);
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .btn-white:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); color: #0e7490; }
        .btn-ghost-white {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.65em 1.3em;
          background: rgba(255,255,255,0.12);
          color: white;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          font-weight: 600;
          transition: all var(--transition-ui);
          text-decoration: none;
          cursor: pointer;
        }
        .btn-ghost-white:hover { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); color: white; }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="home-hero fade-up">
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="home-eyebrow">
          <span>⚕</span>
          {PLATFORM.disclaimer} · Open Source
        </div>
        <h1 className="home-h1">
          Precision Oncology<br />for the{' '}
          <span className="home-h1-accent">90%</span>
        </h1>
        <p className="home-lead">
          {PLATFORM.description}
        </p>
        <div className="home-cta-group">
          <Link to="/platinum-window" className="btn-primary">
            Try Platinum Window <ArrowRight size={15} />
          </Link>
          <Link to="/about" className="btn-ghost">
            Why it matters
          </Link>
        </div>
        <p className="home-hero-disclaimer">
          {liveProducts.length} clinical tools live · {soonProducts.length} in development · Research use only
        </p>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 clamp(1rem, 5vw, 3rem) clamp(2.5rem, 5vw, 4rem)', maxWidth: '1280px', marginInline: 'auto' }}>
        <div className="home-stats fade-up delay-2">
          <div className="home-stat">
            <span className="home-stat-value">{PROVENANCE.cohortSize.toLocaleString()}</span>
            <span className="home-stat-label">Patients</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{PROVENANCE.cohortCount}</span>
            <span className="home-stat-label">TCGA Cohorts</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{PROVENANCE.hazardRatio}</span>
            <span className="home-stat-label">Hazard Ratio</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{PROVENANCE.genes.length}</span>
            <span className="home-stat-label">Molecular Markers</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">100%</span>
            <span className="home-stat-label">Open Source</span>
          </div>
        </div>
      </div>

      {/* ── The 90% Mission ───────────────────────────────────────────── */}
      <div className="home-mission">
        <div className="home-mission-inner">
          <div className="fade-up">
            <div className="home-mission-stat-big"><span>90</span>%</div>
            <p className="home-mission-caption">
              of cancer patients receive calendar-based treatment — not molecular-guided care.
              CrisPRO exists to close that gap.
            </p>
          </div>
          <div className="home-mission-points fade-up delay-1">
            {[
              {
                title: 'The problem is timing',
                body: 'In HGSOC, the window for effective platinum chemotherapy closes as stromal fibroblasts seal around the tumor. Standard 21-day cycles miss this entirely.',
              },
              {
                title: 'Molecular data exists. Tools don\'t.',
                body: 'TCGA, GEO, and NCCN guidelines contain everything needed to compute a patient-specific treatment window. No tool has made this accessible at the bedside.',
              },
              {
                title: 'CrisPRO changes that.',
                body: 'Open-source, peer-reviewed models. Live inference APIs. Built for the community oncologist, not just academic centers.',
              },
            ].map(pt => (
              <div key={pt.title} className="home-mission-point">
                <div className="home-mission-point-dot" />
                <div>
                  <p className="home-mission-point-title">{pt.title}</p>
                  <p className="home-mission-point-body">{pt.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Products ─────────────────────────────────────────────── */}
      <section className="home-section">
        <p className="home-section-label">Clinical Tools</p>
        <h2 className="home-section-title">Live on CrisPRO</h2>
        <p className="home-section-sub">
          Each tool is a self-contained clinical decision-support engine backed by peer-reviewed data.
          No login required. Research use only.
        </p>
        <div className="home-products-grid">
          {liveProducts.map((p, i) => {
            const Icon = PRODUCT_ICONS[p.title] ?? Dna;
            const [c1, c2] = GRADIENT_MAP[p.title] ?? ['#0891b2', '#7c3aed'];
            return (
              <Link
                key={p.title}
                to={p.link ?? '#'}
                className={`home-product-card fade-up delay-${Math.min(i + 1, 5)}`}
              >
                <div className="home-product-card-header">
                  <div
                    className="home-product-icon"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="home-product-meta">
                    <p className="home-product-tag">{p.tag}</p>
                    <h3 className="home-product-title">{p.title}</h3>
                  </div>
                  <span className={`status-badge status-${p.status.toLowerCase()}`}>{p.status}</span>
                </div>
                <div className="home-product-body">
                  <p className="home-product-desc">{p.desc}</p>
                </div>
                {p.stats && (
                  <div className="home-product-stats">
                    {p.stats.map(s => (
                      <div key={s.label} className="home-product-stat">
                        <span className="home-product-stat-val">{s.value}</span>
                        <span className="home-product-stat-lbl">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="home-product-footer">
                  <span className="home-product-cta">
                    {p.ctaLabel} <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── The Pipeline ──────────────────────────────────────────────── */}
      <div className="home-pipeline">
        <p className="home-section-label" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>How it works</p>
        <h2 className="home-section-title" style={{ textAlign: 'center', marginInline: 'auto', marginBottom: '0.75rem' }}>
          From biopsy to recommendation
        </h2>
        <p className="home-section-sub" style={{ textAlign: 'center', marginInline: 'auto', marginBottom: '2.5rem' }}>
          Every CrisPRO tool follows the same evidence-grounded pipeline.
        </p>
        <div className="home-pipeline-steps">
          {[
            { num: '01', icon: '🧬', label: 'Molecular Input', desc: 'Gene expression values, biomarker profile, clinical history' },
            { num: '02', icon: '📊', label: 'Evidence Match', desc: 'Cross-referenced against validated TCGA / published cohort data' },
            { num: '03', icon: '🧮', label: 'Model Scoring', desc: 'Elastic net Cox or L2 logistic regression — peer-reviewed' },
            { num: '04', icon: '📋', label: 'Clinical Output', desc: 'Actionable recommendation with full provenance and confidence intervals' },
          ].map(({ num, icon, label, desc }) => (
            <div key={num} className="home-pipeline-step">
              <span className="home-pipeline-num">Step {num}</span>
              <span className="home-pipeline-icon">{icon}</span>
              <p className="home-pipeline-label">{label}</p>
              <p className="home-pipeline-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Coming Soon ───────────────────────────────────────────────── */}
      {soonProducts.length > 0 && (
        <section className="home-section" style={{ paddingTop: '0' }}>
          <p className="home-section-label">Roadmap</p>
          <h2 className="home-section-title">In Development</h2>
          <p className="home-section-sub">Next tools in the pipeline — each expanding coverage to more cancer types.</p>
          <div className="home-soon-grid">
            {soonProducts.map(p => {
              const Icon = PRODUCT_ICONS[p.title] ?? FlaskConical;
              const [c1, c2] = GRADIENT_MAP[p.title] ?? ['#94a3b8', '#64748b'];
              return (
                <div key={p.title} className="home-soon-card">
                  <div className="home-soon-card-top">
                    <div className="home-soon-icon" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <span className="status-badge status-soon">Coming Soon</span>
                  </div>
                  <p className="home-soon-title">{p.title}</p>
                  <p className="home-soon-desc">{p.subtitle}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <div style={{ padding: '0 clamp(1rem, 4vw, 3rem) clamp(3rem, 6vw, 5rem)' }}>
        <div className="home-cta-banner fade-up">
          <div className="home-cta-banner-glow" aria-hidden="true" />
          <p className="home-cta-banner-eyebrow">Open Source · Research Use Only</p>
          <h2 className="home-cta-banner-title">Start using molecular-guided oncology today.</h2>
          <p className="home-cta-banner-sub">
            Two live tools. Real clinical data. Built for oncologists, researchers, and tumor boards — not just academic centers.
          </p>
          <div className="home-cta-banner-btns">
            <Link to="/platinum-window" className="btn-white">
              Platinum Window <ArrowRight size={14} />
            </Link>
            <Link to="/progression-arbiter" className="btn-ghost-white">
              Progression Arbiter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
