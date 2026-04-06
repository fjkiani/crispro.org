import './InfoCard.css';

interface InfoCardProps {
  icon: string;
  title: string;
  detail: string;
}

export default function InfoCard({ icon, title, detail }: InfoCardProps) {
  return (
    <div className="info-card glass">
      <span className="info-card-icon">{icon}</span>
      <h4 className="info-card-title">{title}</h4>
      <p className="info-card-detail">{detail}</p>
    </div>
  );
}
