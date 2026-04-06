import { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClinicalMarkdown } from '../features/progression-arbiter/components/white-box/ClinicalMarkdown';
import architectureBlogMarkdown from '../assets/crispro_architecture_blog.md?raw';
import { PLATFORM, ABOUT, PROVENANCE } from '../constants';

export default function About() {
  const [tab, setTab] = useState<'mission' | 'architecture'>('mission');

  return (
    <div>
      <style>{`
        .about-hero {
          padding: clamp(3.5rem, 8vw, 6rem) clamp(1rem, 5vw, 3rem) clamp(2rem, 4vw, 3rem);
          max-width: 1080px;
          margin-inline: auto;
        }
        .about-eyebrow {
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.75rem;
        }
        .about-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          line-height: 1.05;
          max-width: 18ch;
          margin-bottom: 1.25rem;
        }
        .about-lead {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: var(--text-muted);
          max-width: 52ch;
          line-height: 1.6;
        }
        /* ── Tabs ─────────────────────────────────────────────────── */
        .about-tabs {
          display: flex;
          gap: 0.25rem;
          padding: 0 clamp(1rem, 5vw, 3rem);
          max-width: 1080px;
          margin-inline: auto;
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--divider);
        }
        .about-tab-btn {
          padding: 0.6rem 1.1rem 0.85rem;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          border: none;
          background: none;
          cursor: pointer;
          position: relative;
          transition: color var(--transition-ui);
          letter-spacing: -0.01em;
        }
        .about-tab-btn:hover { color: var(--text); }
        .about-tab-btn.active { color: var(--text); }
        .about-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          border-radius: var(--radius-full);
        }
        /* ── Content ──────────────────────────────────────────────── */
        .about-content {
          max-width: 1080px;
          margin-inline: auto;
          padding: 0 clamp(1rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem);
        }
        /* ── Founder ──────────────────────────────────────────────── */
        .about-founder-card {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 2rem;
          margin-bottom: 3rem;
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 600px) { .about-founder-card { flex-direction: column; } }
        .about-founder-avatar {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, var(--accent), #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
          letter-spacing: -0.02em;
        }
        .about-founder-name {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 0.2rem;
        }
        .about-founder-role {
          font-size: var(--text-sm);
          color: var(--accent);
          font-weight: 500;
          margin-bottom: 0.75rem;
        }
        .about-founder-bio {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.65;
          max-width: none;
        }
        /* ── Vision ──────────────────────────────────────────────── */
        .about-vision {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem 4rem;
          align-items: start;
          margin-bottom: 3.5rem;
        }
        @media (max-width: 768px) { .about-vision { grid-template-columns: 1fr; } }
        .about-section-label {
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 0.5rem;
        }
        .about-section-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 2.5vw, 2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          margin-bottom: 1rem;
        }
        .about-body {
          font-size: var(--text-base);
          color: var(--text-muted);
          line-height: 1.7;
          max-width: none;
        }
        /* ── Numbers ─────────────────────────────────────────────── */
        .about-numbers {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1rem;
          margin-bottom: 3.5rem;
        }
        .about-number-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem 1.25rem;
          text-align: center;
          transition: border-color var(--transition-ui);
        }
        .about-number-card:hover { border-color: var(--accent); }
        .about-number-value {
          font-family: var(--font-display);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--text);
          display: block;
          line-height: 1;
          margin-bottom: 0.4rem;
          background: linear-gradient(135deg, var(--text), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .about-number-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          display: block;
          line-height: 1.4;
        }
        /* ── Problems grid ────────────────────────────────────────── */
        .about-problems {
          margin-bottom: 3.5rem;
        }
        .about-problems-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .about-problem-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .about-problem-icon {
          font-size: 1.25rem;
          line-height: 1;
        }
        .about-problem-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .about-problem-detail {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.55;
          max-width: none;
        }
        /* ── How we help ──────────────────────────────────────────── */
        .about-help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
          margin-bottom: 3.5rem;
        }
        .about-help-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          transition: border-color var(--transition-ui), box-shadow var(--transition-ui);
        }
        .about-help-card:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .about-help-icon {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--accent-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .about-help-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.01em;
        }
        .about-help-detail {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.55;
          max-width: none;
        }
        /* ── CTA ─────────────────────────────────────────────────── */
        .about-cta {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .about-cta-text {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .about-cta-sub {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-top: 0.25rem;
          max-width: 44ch;
        }
      `}</style>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="about-hero fade-up">
        <p className="about-eyebrow">About CrisPRO</p>
        <h1 className="about-title">{PLATFORM.tagline}</h1>
        <p className="about-lead">
          Built by <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{ABOUT.founder}</strong>, {ABOUT.founderRole} at CrisPRO.ai —
          on a mission to make molecular-guided oncology accessible to every oncologist, everywhere.
        </p>
      </section>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="about-tabs">
        <button className={`about-tab-btn${tab === 'mission' ? ' active' : ''}`} onClick={() => setTab('mission')}>
          Mission
        </button>
        <button className={`about-tab-btn${tab === 'architecture' ? ' active' : ''}`} onClick={() => setTab('architecture')}>
          Technical Architecture
        </button>
      </div>

      {/* ── Mission Tab ───────────────────────────────────────────────── */}
      {tab === 'mission' && (
        <div className="about-content fade-in">
          {/* Founder */}
          <div className="about-founder-card">
            <div className="about-founder-avatar">FK</div>
            <div>
              <p className="about-founder-name">{ABOUT.founder}</p>
              <p className="about-founder-role">{ABOUT.founderRole}, {ABOUT.createdBy}</p>
              <p className="about-founder-bio">{ABOUT.founderBio}</p>
            </div>
          </div>

          {/* Vision */}
          <div className="about-vision">
            <div>
              <p className="about-section-label">{ABOUT.visionTitle}</p>
              <h2 className="about-section-title">Why the 90% matters</h2>
            </div>
            <div>
              <p className="about-body">{ABOUT.visionBody}</p>
            </div>
          </div>

          {/* By the Numbers */}
          <p className="about-section-label">Evidence</p>
          <h2 className="about-section-title" style={{ marginBottom: '1.5rem' }}>By the Numbers</h2>
          <div className="about-numbers">
            <div className="about-number-card">
              <span className="about-number-value">{PROVENANCE.cohortSize.toLocaleString()}</span>
              <span className="about-number-label">Patients in Reference Cohort</span>
            </div>
            <div className="about-number-card">
              <span className="about-number-value">{PROVENANCE.cohortCount}</span>
              <span className="about-number-label">TCGA Cohorts</span>
            </div>
            <div className="about-number-card">
              <span className="about-number-value">{PROVENANCE.genes.length}</span>
              <span className="about-number-label">Molecular Markers</span>
            </div>
            <div className="about-number-card">
              <span className="about-number-value">{PROVENANCE.hazardRatio}</span>
              <span className="about-number-label">Hazard Ratio (HR)</span>
            </div>
            <div className="about-number-card">
              <span className="about-number-value">{PROVENANCE.pValue}</span>
              <span className="about-number-label">Statistical Significance</span>
            </div>
            <div className="about-number-card">
              <span className="about-number-value">100%</span>
              <span className="about-number-label">Open Source</span>
            </div>
          </div>

          {/* Problems */}
          <div className="about-problems">
            <p className="about-section-label">The Gap</p>
            <h2 className="about-section-title">What we seek to improve</h2>
            <div className="about-problems-grid">
              {ABOUT.standardOfCareProblems.map(item => (
                <div key={item.title} className="about-problem-card">
                  <span className="about-problem-icon">{item.icon}</span>
                  <p className="about-problem-title">{item.title}</p>
                  <p className="about-problem-detail">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How we help */}
          <p className="about-section-label">The Solution</p>
          <h2 className="about-section-title">How {PLATFORM.fullName} helps</h2>
          <div className="about-help-grid">
            {ABOUT.howWeHelp.map(item => (
              <div key={item.title} className="about-help-card">
                <div className="about-help-icon">{item.icon}</div>
                <p className="about-help-title">{item.title}</p>
                <p className="about-help-detail">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="about-cta">
            <div>
              <p className="about-cta-text">Ready to try a clinical tool?</p>
              <p className="about-cta-sub">Two live tools, no login required. Research use only.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/platinum-window" className="btn-primary">
                Platinum Window <ArrowRight size={14} />
              </Link>
              <Link to="/progression-arbiter" className="btn-ghost">
                Progression Arbiter
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Architecture Tab ──────────────────────────────────────────── */}
      {tab === 'architecture' && (
        <div className="about-content fade-in">
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'clamp(1.5rem, 3vw, 2.5rem)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <ClinicalMarkdown content={architectureBlogMarkdown} />
          </div>
        </div>
      )}
    </div>
  );
}
