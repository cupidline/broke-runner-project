const SCALE_MAX = 2.0
const BANDS = [
  { label: 'Undertrained', from: 0.0, to: 0.5, color: '#71717A' },
  { label: 'Easy week',    from: 0.5, to: 0.8, color: '#7DD3FC' },
  { label: 'Optimal',      from: 0.8, to: 1.3, color: '#34D399' },
  { label: 'Caution',      from: 1.3, to: 1.5, color: '#F59E0B' },
  { label: 'Danger',       from: 1.5, to: 2.0, color: '#F87171' },
] as const

function getActiveBand(acwr: number) {
  return BANDS.find(b => acwr < b.to) ?? BANDS[BANDS.length - 1]
}

function pct(v: number) {
  return (Math.min(Math.max(v, 0), SCALE_MAX) / SCALE_MAX) * 100
}

export function ACWRBar({ acwr }: { acwr: number }) {
  const active = getActiveBand(acwr)
  const markerPct = pct(acwr)

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Workload Ratio
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: active.color }}>
          {acwr.toFixed(2)}
        </span>
      </div>

      {/* Segmented scale bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {BANDS.map(b => (
          <div
            key={b.label}
            style={{
              width: `${((b.to - b.from) / SCALE_MAX) * 100}%`,
              background: b.color,
              opacity: b.label === active.label ? 0.55 : 0.2,
            }}
          />
        ))}
        {/* Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Band labels centered under each segment */}
      <div className="flex mt-1">
        {BANDS.map(b => (
          <div
            key={b.label}
            className="flex justify-center"
            style={{ width: `${((b.to - b.from) / SCALE_MAX) * 100}%` }}
          >
            <span
              className="text-[9px] font-medium leading-none text-center"
              style={{ color: b.color, opacity: b.label === active.label ? 1 : 0.4 }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
