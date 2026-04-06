import { PROVENANCE } from '../constants';
import './ProvenanceFooter.css';

export default function ProvenanceFooter() {
  return (
    <div className="provenance flex flex-col lg:flex-row gap-8">
      {/* Platinum Window */}
      <div className="flex-1">
        <h4 className="provenance-title text-indigo-700">⏱️ Platinum Window Provenance</h4>
        <div className="provenance-grid mt-4">
          <div className="prov-item">
            <span className="prov-label">Data Source</span>
            <span className="prov-value">{PROVENANCE.dataSource}</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Cohort</span>
            <span className="prov-value">{PROVENANCE.cohort} (n={PROVENANCE.cohortSize.toLocaleString()})</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Method</span>
            <span className="prov-value">{PROVENANCE.regressionMethod}</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">HR</span>
            <span className="prov-value">{PROVENANCE.hazardRatio} {PROVENANCE.hazardRatioCI}</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">P-value</span>
            <span className="prov-value">{PROVENANCE.pValue}</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Validation</span>
            <span className="prov-value">{PROVENANCE.validationType}</span>
          </div>
        </div>
      </div>

      {/* Progression Arbiter */}
      <div className="flex-1">
        <h4 className="provenance-title text-blue-700">🦴 Progression Arbiter Provenance</h4>
        <div className="provenance-grid mt-4">
          <div className="prov-item">
            <span className="prov-label">Data Source</span>
            <span className="prov-value">9 Diverse mBC Bone Imaging Studies</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Cohort</span>
            <span className="prov-value">Metastatic Breast Cancer Bone Events (n=239)</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Method</span>
            <span className="prov-value">L2-Regularized Logistic Regression (lambda=0.5)</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Brier Score</span>
            <span className="prov-value">0.0034</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Err Switch Rate</span>
            <span className="prov-value">0.7% (1 of 148 predicted STAY classifications)</span>
          </div>
          <div className="prov-item">
            <span className="prov-label">Core Anchor</span>
            <span className="prov-value">healing_flag (-3.1381 weight) computationally dominates.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
