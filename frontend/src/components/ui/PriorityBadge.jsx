const LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export default function PriorityBadge({ priority = 'normal' }) {
  if (!priority || priority === 'normal') return null;
  return (
    <span className={`priority-badge priority-${priority}`}>
      {LABELS[priority] || priority}
    </span>
  );
}
