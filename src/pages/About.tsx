import { useState } from 'react';
import InfoCard from '../components/InfoCard';
import { ClinicalMarkdown } from '../features/progression-arbiter/components/white-box/ClinicalMarkdown';
import architectureBlogMarkdown from '../assets/crispro_architecture_blog.md?raw';
import { PLATFORM, ABOUT, PROVENANCE } from '../constants';
import './About.css';

export default function About() {
  const [activeTab, setActiveTab] = useState<'mission' | 'architecture'>('mission');

  return (
    <div className="about">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="about-hero fade-up">
        <h1 className="about-title">{PLATFORM.tagline}</h1>
        <p className="about-lead">
          Created by <strong>{ABOUT.createdBy}</strong> ·
        </p>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="about-tabs fade-up">
        <button 
          className={`about-tab ${activeTab === 'mission' ? 'active' : ''}`}
          onClick={() => setActiveTab('mission')}
        >
          Our Mission
        </button>
        <button 
          className={`about-tab ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          Technical Architecture
        </button>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────── */}
      {activeTab === 'mission' && (
        <div className="tab-pane fade-in">
          {/* ── Vision ────────────────────────────────────────────────── */}
          <section className="about-section fade-up">
            <h2>{ABOUT.visionTitle}</h2>
            <p className="about-body">{ABOUT.visionBody}</p>
          </section>

          {/* ── Founder ───────────────────────────────────────────────── */}
          <section className="about-section about-founder glass fade-up">
            <div className="founder-info">
              <div className="founder-avatar">FK</div>
              <div>
                <h3>{ABOUT.founder}</h3>
                <p className="founder-role">{ABOUT.founderRole}, {ABOUT.createdBy}</p>
              </div>
            </div>
            <p className="about-body">{ABOUT.founderBio}</p>
          </section>

          {/* ── Standard of Care Problems ────────────────────────────── */}
          <section className="about-section fade-up">
            <h2>What we seek to improve</h2>
          
            <div className="about-grid">
              {ABOUT.standardOfCareProblems.map((item) => (
                <InfoCard key={item.title} icon={item.icon} title={item.title} detail={item.detail} />
              ))}
            </div>
          </section>

          {/* ── How We Help ───────────────────────────────────────────── */}
          <section className="about-section fade-up">
            <h2>How {PLATFORM.fullName} Helps</h2>
            <div className="about-grid about-grid-3">
              {ABOUT.howWeHelp.map((item) => (
                <InfoCard key={item.title} icon={item.icon} title={item.title} detail={item.detail} />
              ))}
            </div>
          </section>

          {/* ── By The Numbers ────────────────────────────────────────── */}
          <section className="about-section about-numbers glass fade-up">
            <h2>By The Numbers</h2>
            <div className="numbers-grid">
              <div className="number-item">
                <span className="number-value">{PROVENANCE.cohortSize.toLocaleString()}</span>
                <span className="number-label">Patients in Reference Cohort</span>
              </div>
              <div className="number-item">
                <span className="number-value">{PROVENANCE.cohortCount}</span>
                <span className="number-label">TCGA Cohorts</span>
              </div>
              <div className="number-item">
                <span className="number-value">{PROVENANCE.genes.length}</span>
                <span className="number-label">Molecular Markers</span>
              </div>
              <div className="number-item">
                <span className="number-value">{PROVENANCE.hazardRatio}</span>
                <span className="number-label">Hazard Ratio (HR)</span>
              </div>
              <div className="number-item">
                <span className="number-value">{PROVENANCE.pValue}</span>
                <span className="number-label">Statistical Significance</span>
              </div>
              <div className="number-item">
                <span className="number-value">100%</span>
                <span className="number-label">Open Source</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="tab-pane fade-in bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm overflow-hidden">
          <ClinicalMarkdown content={architectureBlogMarkdown} />
        </div>
      )}
    </div>
  );
}
