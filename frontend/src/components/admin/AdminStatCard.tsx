import type { StatTone } from './types';

type AdminStatCardProps = {
  label: string;
  value: number;
  icon: string;
  tone?: StatTone;
  onClick?: () => void;
};

export function AdminStatCard({
  label,
  value,
  icon,
  tone = 'cyan',
  onClick,
}: AdminStatCardProps) {
  const className = `admin-stat-card ${tone}`;
  const value_ = value.toLocaleString('es-ES');

  if (!onClick) {
    return (
      <div className={className}>
        <div className="admin-stat-icon" aria-hidden="true">
          {icon}
        </div>
        <div className="admin-stat-info">
          <div className="admin-stat-label">{label}</div>
          <div className="admin-stat-value">{value_}</div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      <div className="admin-stat-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="admin-stat-info">
        <div className="admin-stat-label">{label}</div>
        <div className="admin-stat-value">{value_}</div>
      </div>
    </button>
  );
}

export default AdminStatCard;
