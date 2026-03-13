import { PROVENANCE } from '../constants';
import './ProvenanceFooter.css';

export default function ProvenanceFooter() {
  return (
    <div className="provenance">
      <h4 className="provenance-title">📋 Provenance & Validation</h4>
      <div className="provenance-grid">
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
        <div className="prov-item">
          <span className="prov-label">Genes</span>
          <span className="prov-value">{PROVENANCE.genes.join(', ')}</span>
        </div>
        <div className="prov-item">
          <span className="prov-label">OCT1 Reference</span>
          <span className="prov-value">n={PROVENANCE.referenceOCT1_n} (GTEx normal liver)</span>
        </div>
      </div>
    </div>
  );
}
