import './ScoreBar.css';

interface Props {
  score: number;
  label?: string;
}

export default function ScoreBar({ score, label }: Props) {
  const pct = Math.min(100, Math.max(0, score * 100));
  return (
    <div className="score-bar-wrap">
      {label && <div className="score-bar-label">{label}</div>}
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
