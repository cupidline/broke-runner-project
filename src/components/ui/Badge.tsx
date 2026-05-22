interface BadgeProps {
  label: string
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'muted'
}

const COLOR_MAP = {
  accent:  'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger:  'bg-danger/15 text-danger',
  muted:   'bg-muted/20 text-text-secondary',
}

export default function Badge({ label, color = 'muted' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${COLOR_MAP[color]}`}>
      {label}
    </span>
  )
}
