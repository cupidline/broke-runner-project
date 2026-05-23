import type { ParseResult } from './types'

// Haversine distance between two lat/lon points in metres
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function textOf(el: Element, tag: string): string | null {
  return el.querySelector(tag)?.textContent?.trim() ?? null
}

function numOf(el: Element, tag: string): number | null {
  const t = textOf(el, tag)
  return t != null ? parseFloat(t) : null
}

// HR from multiple common extension namespaces
function hrFromTrkpt(trkpt: Element): number | null {
  for (const tag of ['gpxtpx:hr', 'hr', 'ns3:hr', 'ns2:hr']) {
    const v = numOf(trkpt, tag)
    if (v != null) return v
  }
  return null
}

export function parseGPX(text: string): ParseResult {
  try {
    const doc = new DOMParser().parseFromString(text, 'application/xml')
    const parseErr = doc.querySelector('parsererror')
    if (parseErr) return { ok: false, error: 'Invalid GPX file' }

    const trk = doc.querySelector('trk')
    if (!trk) return { ok: false, error: 'No track found in GPX' }

    const name = textOf(trk, 'name') ?? 'Imported run'
    const trkpts = Array.from(doc.querySelectorAll('trkpt'))
    if (trkpts.length < 2) return { ok: false, error: 'Track has fewer than 2 points' }

    let distanceMeters = 0
    let elevationGain = 0
    let prevLat: number | null = null
    let prevLon: number | null = null
    let prevEle: number | null = null
    const hrValues: number[] = []
    const timeValues: number[] = []
    const altValues: number[] = []
    let startTime: Date | null = null
    let lastTime: Date | null = null

    for (const pt of trkpts) {
      const lat = parseFloat(pt.getAttribute('lat') ?? '')
      const lon = parseFloat(pt.getAttribute('lon') ?? '')
      const ele = numOf(pt, 'ele')
      const timeStr = textOf(pt, 'time')
      const hr = hrFromTrkpt(pt)

      if (isNaN(lat) || isNaN(lon)) continue

      if (timeStr) {
        const t = new Date(timeStr)
        if (!startTime) startTime = t
        lastTime = t
        timeValues.push(Math.round((t.getTime() - startTime.getTime()) / 1000))
      }

      if (prevLat != null && prevLon != null) {
        distanceMeters += haversine(prevLat, prevLon, lat, lon)
      }

      if (ele != null) {
        if (prevEle != null && ele > prevEle) elevationGain += ele - prevEle
        altValues.push(ele)
        prevEle = ele
      }

      if (hr != null) hrValues.push(hr)

      prevLat = lat
      prevLon = lon
    }

    if (!startTime || !lastTime) {
      return { ok: false, error: 'GPX has no timestamps' }
    }

    const durationSeconds = (lastTime.getTime() - startTime.getTime()) / 1000
    if (durationSeconds < 60) return { ok: false, error: 'Activity is too short' }

    const avgHR = hrValues.length > 0
      ? Math.round(hrValues.reduce((s, v) => s + v, 0) / hrValues.length)
      : undefined
    const maxHR = hrValues.length > 0 ? Math.round(Math.max(...hrValues)) : undefined
    const avgPace = distanceMeters > 0 ? durationSeconds / (distanceMeters / 1000) : undefined

    return {
      ok: true,
      activity: {
        source: 'gpx',
        name,
        startDate: startTime.toISOString(),
        durationSeconds: Math.round(durationSeconds),
        distanceMeters: Math.round(distanceMeters),
        elevationGainMeters: Math.round(elevationGain),
        avgHeartRate: avgHR,
        maxHeartRate: maxHR,
        avgPaceSecPerKm: avgPace != null ? Math.round(avgPace) : undefined,
        activityType: 'Run',
        hrStream: hrValues.length > 0 ? hrValues : undefined,
        timeStream: timeValues.length > 0 ? timeValues : undefined,
        altitudeStream: altValues.length > 0 ? altValues : undefined,
      },
    }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
