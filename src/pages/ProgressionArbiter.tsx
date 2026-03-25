import ArbiterForm from '../components/ArbiterForm';
import ArbiterResultsPanel from '../components/ArbiterResultsPanel';
import { useArbiterScore } from '../hooks/useArbiterScore';
import { PLATFORM, PROGRESSION_ARBITER, ARBITER_CONTEXT } from '../constants';
import './ProgressionArbiter.css';

export default function ProgressionArbiter() {
  const { data, loading, error, runDemo, scoreEvent } = useArbiterScore();

  return (
    <div className="pa-page">
      <div className="pa-header fade-up">
        <div className="pa-badge">⚕️ {PLATFORM.disclaimer}</div>
        <h1>{PROGRESSION_ARBITER.title}</h1>
        <p>
          {PROGRESSION_ARBITER.subtitle} — {PROGRESSION_ARBITER.stats}
        </p>
      </div>

      {/* Context for clinicians */}
      <div className="pa-context fade-up">
        <p>{ARBITER_CONTEXT.problemDescription}</p>
        <p className="pa-context-who">
          <strong>Who uses this:</strong> {ARBITER_CONTEXT.whoNeedsThis}
        </p>
      </div>

      <ArbiterForm onDemo={runDemo} onScore={scoreEvent} loading={loading} />

      {error && (
        <div className="pa-error fade-up">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && <ArbiterResultsPanel data={data} />}

      {/* Literature sources footer */}
      <div className="pa-provenance fade-up">
        <h3>Literature Sources</h3>
        <p>
          Model trained on <strong>239 imaging events</strong> from <strong>9 published studies</strong> (1999–2025).
          Key references: Zhang 2021 (PMC8209838), Yuan 2025 (PMC12507583), Jung 2022 (PMC8750286),
          Koizumi 1999 (PMID 9890487), Costelloe 2013 (PMC3863546).
        </p>
        <p className="pa-disclaimer">{PLATFORM.disclaimer}</p>
      </div>
    </div>
  );
}
