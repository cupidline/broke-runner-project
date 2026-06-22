import { usePersonalTRIMPBands } from '@/hooks/usePersonalTRIMPBands'
import type { TRIMPCalibration } from '@/lib/metrics/personalCalibration'

const BAND_DEFS = [
  { label: 'Minimal',   color: '#52525B' },
  { label: 'Recovery',  color: '#34D399' },
  { label: 'Easy',      color: '#7DD3FC' },
  { label: 'Moderate',  color: '#F59E0B' },
  { label: 'Hard',      color: '#F97316' },
  { label: 'Very Hard', color: '#EF4444' },
  { label: 'Extreme',   color: '#7C3AED' },
] as const

function buildBands(cal: TRIMPCalibration) {
  const thresholds = [20, cal.recovery, cal.easy, cal.moderate, cal.hard, cal.veryHard, Infinity]
  return BAND_DEFS.map((def, i) => ({ ...def, to: thresholds[i] }))
}

function buildSegments(cal: TRIMPCalibration) {
  const bands = buildBands(cal)
  return bands.map((b, i) => {
    const from = i === 0 ? 0 : bands[i - 1].to as number
    const to   = Math.min(b.to === Infinity ? cal.scaleMax : b.to, cal.scaleMax)
    return { ...b, from, pct: ((to - from) / cal.scaleMax) * 100 }
  })
}

function getBand(trimp: number, cal: TRIMPCalibration) {
  const bands = buildBands(cal)
  return bands.find(b => trimp < b.to) ?? bands[bands.length - 1]
}

// ── Full bar (RunDetail) ───────────────────────────────────────────────────────

export function TRIMPBar({ trimp }: { trimp: number }) {
  const cal = usePersonalTRIMPBands()
  const band = getBand(trimp, cal)
  const segments = buildSegments(cal)
  const markerPct = Math.min(trimp / cal.scaleMax, 1) * 100

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
        {segments.map(s => (
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
        {segments.map(s => (
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
  const cal = usePersonalTRIMPBands()
  const band = getBand(trimp, cal)
  const segments = buildSegments(cal)
  const markerPct = Math.min(trimp / cal.scaleMax, 1) * 100

  return (
    <div className="flex flex-col items-end gap-0.5 w-16">
      <span className="text-xs tabular-nums font-medium leading-none" style={{ color: band.color }}>
        {Math.round(trimp)}
      </span>
      <div className="relative h-1.5 w-full rounded-full overflow-hidden flex">
        {segments.map(s => (
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
