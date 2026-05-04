import { ROLE_LABELS, ROLE_COLORS } from '../../config/permissions';

export default function RoleBadge({ role }) {
  if (!role) return null;
  const label = ROLE_LABELS[role] || role;
  const color = ROLE_COLORS[role] || '#888';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '100px',
      fontSize: '10px', fontWeight: '700',
      background: `${color}20`,
      color: color,
      border: `1px solid ${color}40`,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
