import type { TreatmentStep } from '../types/platinum';
import './TreatmentTimeline.css';

interface Props {
  steps: TreatmentStep[];
}

export default function TreatmentTimeline({ steps }: Props) {
  if (!steps.length) return null;
  return (
    <div className="timeline">
      <h3 className="timeline-title">Treatment Sequence</h3>
      {steps.map((step, i) => (
        <div className="timeline-step" key={i}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-cycle">Cycle {step.cycle}</div>
            <div className="timeline-drugs">
              {step.drugs.map(d => d.replace(/_/g, ' ')).join(' + ')}
            </div>
            <div className="timeline-rationale">{step.rationale}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
