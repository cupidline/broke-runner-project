const SCALE_MAX = 700

const BANDS = [
  { label: 'Minimal',   to: 30,       color: '#52525B' },
  { label: 'Recovery',  to: 60,       color: '#34D399' },
  { label: 'Easy',      to: 150,      color: '#7DD3FC' },
  { label: 'Moderate',  to: 260,      color: '#F59E0B' },
  { label: 'Hard',      to: 420,      color: '#F97316' },
  { label: 'Very Hard', to: 620,      color: '#EF4444' },
  { label: 'Extreme',   to: Infinity, color: '#7C3AED' },
] as const

// Width of each segment as % of the display scale
const SEGMENTS = BANDS.map((b, i) => {
  const from = i === 0 ? 0 : BANDS[i - 1].to
  const to   = Math.min(b.to, SCALE_MAX)
  return { ...b, from, pct: ((to - from) / SCALE_MAX) * 100 }
})

function getBand(trimp: number) {
  return BANDS.find(b => trimp < b.to) ?? BANDS[BANDS.length - 1]
}

// ── Full bar (RunDetail) ───────────────────────────────────────────────────────

export function TRIMPBar({ trimp }: { trimp: number }) {
  const band = getBand(trimp)
  const markerPct = Math.min(trimp / SCALE_MAX, 1) * 100

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Training Load
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold tabular-nums" style={{ color: band.color }}>
            {Math.round(trimp)}
          </span>
          <span className="text-xs font-medium" style={{ color: band.color }}>
            {band.label}
          </span>
        </div>
      </div>

      {/* Segmented scale bar */}
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            style={{ width: `${s.pct}%`, background: s.color, opacity: 0.35 }}
          />
        ))}
        {/* Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Band labels */}
      <div className="flex mt-1">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            style={{ width: `${s.pct}%` }}
            className="text-center overflow-hidden"
          >
            {s.pct >= 8 && (
              <span className="text-[9px] text-text-muted leading-none truncate block">
                {s.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Compact bar (runs list + last-run card) ────────────────────────────────────

export function TRIMPBarCompact({ trimp }: { trimp: number }) {
  const band = getBand(trimp)
  const markerPct = Math.min(trimp / SCALE_MAX, 1) * 100

  return (
    <div className="flex flex-col items-end gap-0.5 w-16">
      <span className="text-xs tabular-nums font-medium leading-none" style={{ color: band.color }}>
        {Math.round(trimp)}
      </span>
      <div className="relative h-1.5 w-full rounded-full overflow-hidden flex">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            style={{ width: `${s.pct}%`, background: s.color, opacity: 0.35 }}
          />
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <span className="text-[9px] text-text-muted leading-none">{band.label}</span>
    </div>
  )
}
