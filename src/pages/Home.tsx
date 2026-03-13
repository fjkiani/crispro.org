import { Link } from 'react-router-dom';
import InfoCard from '../components/InfoCard';
import StatBadge from '../components/StatBadge';
import ProvenanceFooter from '../components/ProvenanceFooter';
import {
  PLATFORM, CAPABILITIES, CLINICAL_CONTEXT, MISSION, PROVENANCE,
} from '../constants';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero fade-up">
        <div className="hero-badge">⚕️ {PLATFORM.disclaimer}</div>
        <h1 className="hero-title">
          {PLATFORM.name}<span className="dot">{PLATFORM.domain}</span>
        </h1>
        <p className="hero-subtitle">{PLATFORM.tagline}</p>
        <p className="hero-desc">{PLATFORM.description}</p>

        <div className="hero-stats">
          <StatBadge value={PROVENANCE.cohortSize.toLocaleString()} label="Patients" />
          <StatBadge value={PROVENANCE.cohortCount} label="Cohorts" />
          <StatBadge value={PROVENANCE.hazardRatio} label="Hazard Ratio" />
          <StatBadge value={PROVENANCE.genes.length} label="Genes" />
        </div>

        <Link to="/platinum-window" className="hero-cta">
          Try Platinum Window →
        </Link>
      </section>

      {/* ── Clinical Context — Why This Matters ──────────────────── */}
      <section className="context fade-up">
        <h2 className="section-title">{CLINICAL_CONTEXT.problemTitle}</h2>
        <p className="context-body">{CLINICAL_CONTEXT.problemDescription}</p>

        <h3 className="context-subtitle">{CLINICAL_CONTEXT.solutionTitle}</h3>
        <p className="context-body">{CLINICAL_CONTEXT.solutionDescription}</p>

        <div className="context-grid">
          {CLINICAL_CONTEXT.solutionPoints.map((pt) => (
            <InfoCard key={pt.title} icon={pt.icon} title={pt.title} detail={pt.detail} />
          ))}
        </div>

        <p className="context-who">
          <strong>Who uses this:</strong> {CLINICAL_CONTEXT.whoNeedsThis}
        </p>
      </section>

      {/* ── Capabilities ──────────────────────────────────────────── */}
      <section className="capabilities">
        <h2 className="section-title">Capabilities</h2>
        <div className="cap-grid">
          {CAPABILITIES.map((cap) => (
            <div
              className={`cap-card glass ${cap.status === 'COMING SOON' ? 'cap-soon' : ''}`}
              key={cap.title}
            >
              <div className="cap-top">
                <span className="cap-icon">{cap.icon}</span>
                <span className={`cap-status ${cap.status === 'LIVE' ? 'status-live' : 'status-soon'}`}>
                  {cap.status}
                </span>
              </div>
              <h3 className="cap-title">{cap.title}</h3>
              <p className="cap-desc">{cap.desc}</p>
              {cap.link && (
                <Link to={cap.link} className="cap-link">Open →</Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────── */}
      <section className="mission glass fade-up">
        <h2>{MISSION.title}</h2>
        <p>{MISSION.body}</p>
      </section>

      {/* ── Provenance ────────────────────────────────────────────── */}
      <ProvenanceFooter />
    </div>
  );
}
