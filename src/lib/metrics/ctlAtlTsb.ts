const CTL_DAYS = 42
const ATL_DAYS = 7

export interface DayLoad {
  date: string // YYYY-MM-DD
  trimp: number
}

export interface PMCPoint {
  date: string
  ctl: number
  atl: number
  tsb: number
}

// Fills a Date range into YYYY-MM-DD strings (inclusive)
function dateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

export function calcPMC(dayLoads: DayLoad[]): PMCPoint[] {
  if (dayLoads.length === 0) return []
  const sorted = [...dayLoads].sort((a, b) => a.date.localeCompare(b.date))
  const loadMap = new Map(sorted.map(d => [d.date, d.trimp]))

  let ctl = 0
  let atl = 0
  const result: PMCPoint[] = []

  for (const date of dateRange(sorted[0].date, sorted[sorted.length - 1].date)) {
    const trimp = loadMap.get(date) ?? 0
    ctl = ctl + (trimp - ctl) / CTL_DAYS
    atl = atl + (trimp - atl) / ATL_DAYS
    result.push({ date, ctl, atl, tsb: ctl - atl })
  }

  return result
}
