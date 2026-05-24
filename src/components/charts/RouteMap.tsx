import { useMemo } from 'react'

interface Props {
  latlng: [number, number][]
}

const W = 400
const H = 180
const PAD = 14

function downsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = arr.length / max
  return Array.from({ length: max }, (_, i) => arr[Math.round(i * step)])
}

export default function RouteMap({ latlng }: Props) {
  const result = useMemo(() => {
    const pts = downsample(latlng, 300)
    if (pts.length < 2) return null

    const lats = pts.map(p => p[0])
    const lngs = pts.map(p => p[1])
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)

    const latRange = maxLat - minLat || 0.001
    const lngRange = maxLng - minLng || 0.001

    const drawW = W - PAD * 2
    const drawH = H - PAD * 2

    // Correct lng scale for latitude (equirectangular)
    const cosLat = Math.cos(((maxLat + minLat) / 2) * (Math.PI / 180))
    const lngAdj = lngRange * cosLat

    const scale = Math.min(drawW / lngAdj, drawH / latRange)
    const projW = lngAdj * scale
    const projH = latRange * scale
    const ox = PAD + (drawW - projW) / 2
    const oy = PAD + (drawH - projH) / 2

    const toX = (lng: number) => ox + (lng - minLng) * cosLat * scale
    const toY = (lat: number) => oy + projH - (lat - minLat) * scale

    const polyPoints = pts
      .map(p => `${toX(p[1]).toFixed(1)},${toY(p[0]).toFixed(1)}`)
      .join(' ')

    return {
      polyPoints,
      sx: toX(pts[0][1]),  sy: toY(pts[0][0]),
      ex: toX(pts[pts.length - 1][1]),  ey: toY(pts[pts.length - 1][0]),
    }
  }, [latlng])

  if (!result) return null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 160 }}>
      <polyline
        points={result.polyPoints}
        fill="none"
        stroke="#7DD3FC"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <circle cx={result.sx} cy={result.sy} r={4} fill="#34D399" />
      <circle cx={result.ex} cy={result.ey} r={4} fill="#F97316" />
    </svg>
  )
}
