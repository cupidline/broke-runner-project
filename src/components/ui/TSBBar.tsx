const MIN = -40
const MAX =  25
const RANGE = MAX - MIN  // 65

const ZONES = [
  { label: 'Cooked',   from: -40, to: -25, color: '#F87171' },
  { label: 'Fatigued', from: -25, to: -10, color: '#FBBF24' },
  { label: 'Balanced', from: -10, to:   5, color: '#7DD3FC' },
  { label: 'Fresh',    from:   5, to:  15, color: '#34D399' },
  { label: 'Peaked',   from:  15, to:  25, color: '#A78BFA' },
] as const


function pct(v: number) {
  return ((Math.min(Math.max(v, MIN), MAX) - MIN) / RANGE) * 100
}

export function TSBBar({ tsb }: { tsb: number }) {
  const activeZone = ZONES.find(z => tsb < z.to) ?? ZONES[ZONES.length - 1]
  const color      = activeZone.color
  const markerPct  = pct(tsb)
  const zeroPct    = pct(0)

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Form
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {tsb >= 0 ? '+' : ''}{Math.round(tsb)}
        </span>
      </div>

      {/* Segmented scale bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {ZONES.map(z => (
          <div
            key={z.label}
            style={{
              width: `${((z.to - z.from) / RANGE) * 100}%`,
              background: z.color,
              opacity: z.label === activeZone.label ? 0.55 : 0.2,
            }}
          />
        ))}
        <div
          className="absolute top-0 bottom-0 w-px bg-text-muted/40"
          style={{ left: `${zeroPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Zone labels centered under each segment */}
      <div className="flex mt-1">
        {ZONES.map(z => {
          const isActive = z.label === activeZone.label
          return (
            <div
              key={z.label}
              className="flex justify-center"
              style={{ width: `${((z.to - z.from) / RANGE) * 100}%` }}
            >
              <span
                className="text-[9px] font-medium leading-none"
                style={{ color: z.color, opacity: isActive ? 1 : 0.4 }}
              >
                {z.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
