import ScoreForm from '../components/ScoreForm';
import ResultsPanel from '../components/ResultsPanel';
import ProvenanceFooter from '../components/ProvenanceFooter';
import { usePlatinumScore } from '../hooks/usePlatinumScore';
import { PLATFORM, PLATINUM_WINDOW, CLINICAL_CONTEXT } from '../constants';
import './PlatinumWindow.css';

export default function PlatinumWindow() {
  const { data, loading, error, runDemo, scorePatient } = usePlatinumScore();

  return (
    <div className="pw-page">
      <div className="pw-header fade-up">
        <div className="pw-badge">⚕️ {PLATFORM.disclaimer}</div>
        <h1>{PLATINUM_WINDOW.title}</h1>
        <p>
          {PLATINUM_WINDOW.subtitle} — {PLATINUM_WINDOW.stats}
        </p>
      </div>

      {/* Context for clinicians */}
      <div className="pw-context fade-up">
        <p>{CLINICAL_CONTEXT.problemDescription}</p>
        <p className="pw-context-who">
          <strong>Who uses this:</strong> {CLINICAL_CONTEXT.whoNeedsThis}
        </p>
      </div>

      <ScoreForm onDemo={runDemo} onScore={scorePatient} loading={loading} />

      {error && (
        <div className="pw-error fade-up">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && <ResultsPanel data={data} />}

      <ProvenanceFooter />
    </div>
  );
}
