interface ProgressRingProps {
  score: number          // 0–100
  size?: number          // px, default 140
  strokeWidth?: number
  color?: string
  children?: React.ReactNode
}

const DEFAULT_COLOR = '#7DD3FC'

export default function ProgressRing({
  score,
  size = 140,
  strokeWidth = 10,
  color = DEFAULT_COLOR,
  children,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${score} out of 100`}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="rgba(82,82,91,0.25)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
