import { PLATFORM, PROVENANCE, PRODUCTS } from '../constants';
import './Home.css';
import ProvenanceFooter from '../components/ProvenanceFooter';

export default function Home() {
  const liveProducts = PRODUCTS.filter(p => p.status === 'LIVE' || p.status === 'BETA');

  return (

    <div className="home">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="hero fade-up">
        <div className="hero-badge">⚕️ {PLATFORM.disclaimer}</div>
        <h1 className="hero-title">
          {PLATFORM.name}<span className="dot">{PLATFORM.domain}</span>
        </h1>
        <p className="hero-subtitle">{PLATFORM.tagline}</p>
        <p className="hero-desc">{PLATFORM.description}</p>

        <div className="hero-stats">
          <div className="stat-badge">
            <span className="stat-value">{PROVENANCE.cohortSize.toLocaleString()}</span>
            <span className="stat-label">Patients</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{PROVENANCE.cohortCount}</span>
            <span className="stat-label">Cohorts</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{PROVENANCE.hazardRatio}</span>
            <span className="stat-label">Hazard Ratio</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{PROVENANCE.genes.length}</span>
            <span className="stat-label">Genes</span>
          </div>
          <div className="stat-badge">
            <span className="stat-value">{liveProducts.length}</span>
            <span className="stat-label">Live Tools</span>
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────────────── */}
    

      {/* ── Live Products ───────────────────────────────────────────── */}
     
      {/* ── Pipeline Preview ────────────────────────────────────────── */}
      <section className="pipeline-section fade-up">
        {/* <h2 className="section-title">The CrisPRO Pipeline</h2> */}
        <div className="pipeline-steps">
          {[
            { icon: '🧬', step: '01', label: 'Molecular Input', desc: 'Gene expression, biomarker profile, clinical history' },
            { icon: '📊', step: '02', label: 'Evidence Match', desc: 'Cross-referenced against validated cohort data' },
            { icon: '🧮', step: '03', label: 'Model Scoring', desc: 'Peer-reviewed regression or ML model' },
            { icon: '📋', step: '04', label: 'Clinical Output', desc: 'Actionable recommendation with full provenance' },
          ].map(({ icon, step, label, desc }) => (
            <div key={step} className="pipeline-step">
              <div className="pipeline-step__number">{step}</div>
              <div className="pipeline-step__icon">{icon}</div>
              <div className="pipeline-step__label">{label}</div>
              <div className="pipeline-step__desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Coming Soon ─────────────────────────────────────────────── */}
  

      {/* ── Provenance ──────────────────────────────────────────────── */}
      <ProvenanceFooter />
    </div>
  );
}
