import { useState } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClinicalMarkdown } from '../features/progression-arbiter/components/white-box/ClinicalMarkdown';
import architectureBlogMarkdown from '../assets/crispro_architecture_blog.md?raw';
import { PLATFORM, ABOUT } from '../constants';

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
          max-width: 20ch;
          margin-bottom: 1.25rem;
        }
        .about-lead {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: var(--text-muted);
          max-width: 48ch;
          line-height: 1.6;
        }
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
        .about-content {
          max-width: 1080px;
          margin-inline: auto;
          padding: 0 clamp(1rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem);
        }
        .about-founders {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 768px) { .about-founders { grid-template-columns: 1fr; } }
        .about-founder-card {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 1.75rem;
          box-shadow: var(--shadow-sm);
          height: 100%;
        }
        @media (max-width: 600px) { .about-founder-card { flex-direction: column; } }
        .about-founder-avatar {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, var(--accent), #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 800;
          color: white;
          flex-shrink: 0;
          letter-spacing: -0.02em;
        }
        .about-founder-avatar.alt {
          background: linear-gradient(135deg, #059669, var(--accent));
        }
        .about-founder-name {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
          margin-bottom: 0.15rem;
        }
        .about-founder-role {
          font-size: var(--text-sm);
          color: var(--accent);
          font-weight: 600;
          margin-bottom: 0.65rem;
        }
        .about-founder-bio {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.65;
        }
        .about-founder-quote p {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0 0 1rem;
        }
        .about-founder-quote p:last-child { margin-bottom: 0; }
        .about-affiliation-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          padding: 1.5rem 1.75rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }
        .about-affiliation-card a {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .about-affiliation-card a:hover { text-decoration: underline; }
        .about-affiliation-body {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }
        .about-affiliation-meta {
          font-size: var(--text-xs);
          color: var(--text-faint);
          line-height: 1.5;
          padding-top: 0.85rem;
          margin-top: 0.5rem;
          border-top: 1px solid var(--divider);
        }
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
          font-size: clamp(1.35rem, 2.5vw, 1.75rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          margin-bottom: 0.75rem;
        }
        .about-body {
          font-size: var(--text-base);
          color: var(--text-muted);
          line-height: 1.65;
          max-width: 65ch;
        }
        .about-tools {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--divider);
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
        .about-tools-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
      `}</style>

      <section className="about-hero fade-up">
        <p className="about-eyebrow">About</p>
        <h1 className="about-title">{PLATFORM.tagline}</h1>
        <p className="about-lead">
          <strong style={{ color: 'var(--text)' }}>{ABOUT.founder}</strong> and{' '}
          <strong style={{ color: 'var(--text)' }}>{ABOUT.coFounder}</strong>. Open tools for research—not medical advice.
        </p>
      </section>

      <div className="about-tabs">
        <button type="button" className={`about-tab-btn${tab === 'mission' ? ' active' : ''}`} onClick={() => setTab('mission')}>
          Mission
        </button>
        <button type="button" className={`about-tab-btn${tab === 'architecture' ? ' active' : ''}`} onClick={() => setTab('architecture')}>
          Technical Architecture
        </button>
      </div>

      {tab === 'mission' && (
        <div className="about-content fade-in">
          <div className="about-founders">
            <div className="about-founder-card">
              <div className="about-founder-avatar">FK</div>
              <div>
                <p className="about-founder-name">{ABOUT.founder}</p>
                <p className="about-founder-role">{ABOUT.founderRole}, {ABOUT.createdBy}</p>
                <p className="about-founder-bio">{ABOUT.founderBio}</p>
              </div>
            </div>
            <div className="about-founder-card">
              <div className="about-founder-avatar alt">KS</div>
              <div>
                <p className="about-founder-name">{ABOUT.coFounder}</p>
                <p className="about-founder-role">{ABOUT.coFounderRole}</p>
                <div className="about-founder-quote">
                  {ABOUT.coFounderMessage.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="about-affiliation-card">
            <p className="about-section-label" style={{ marginBottom: '0.4rem' }}>Affiliation</p>
            <p className="about-affiliation-body">{ABOUT.affiliationIntro}</p>
            <a href={ABOUT.noorHospitalUrl} target="_blank" rel="noopener noreferrer">
              UOL Noor Hospital — The Noor Project
              <ExternalLink size={14} aria-hidden />
            </a>
            <p className="about-affiliation-meta">{ABOUT.affiliationLegalLine}</p>
          </div>

          <p className="about-section-label">{ABOUT.visionTitle}</p>
          <h2 className="about-section-title">The gap</h2>
          <p className="about-body">{ABOUT.visionBody}</p>

          <div className="about-tools">
            <span>Live demos: </span>
            <div className="about-tools-links">
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

      {tab === 'architecture' && (
        <div className="about-content fade-in">
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'clamp(1.5rem, 3vw, 2.5rem)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ClinicalMarkdown content={architectureBlogMarkdown} />
          </div>
        </div>
      )}
    </div>
  );
}
