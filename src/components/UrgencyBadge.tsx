import { getUrgencyColor, getUrgencyGlow } from '../utils/format';
import './UrgencyBadge.css';

interface Props {
  urgency: string;
}

export default function UrgencyBadge({ urgency }: Props) {
  return (
    <span
      className="urgency-badge"
      style={{
        color: getUrgencyColor(urgency),
        background: getUrgencyGlow(urgency),
        borderColor: getUrgencyColor(urgency),
      }}
    >
      {urgency}
    </span>
  );
}
