import './StatBadge.css';

interface StatBadgeProps {
  label: string;
  value: string | number;
}

export default function StatBadge({ label, value }: StatBadgeProps) {
  return (
    <div className="stat-badge">
      <span className="stat-badge-value">{value}</span>
      <span className="stat-badge-label">{label}</span>
    </div>
  );
}
