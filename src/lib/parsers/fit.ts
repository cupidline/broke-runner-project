import FitParser from 'fit-file-parser'
import type { ParseResult } from './types'
import type { ActivityType } from '@/types'

function sportToActivityType(sport?: string): ActivityType {
  if (sport === 'trail_running') return 'TrailRun'
  if (sport === 'virtual_activity') return 'VirtualRun'
  return 'Run'
}

export async function parseFIT(buffer: ArrayBuffer): Promise<ParseResult> {
  return new Promise(resolve => {
    const parser = new FitParser({ force: true, speedUnit: 'km/h' })

    parser.parse(buffer, (error, data) => {
      if (error || !data) {
        resolve({ ok: false, error: error ?? 'Failed to parse FIT file' })
        return
      }

      try {
        const session = data.sessions?.[0]
        if (!session) {
          resolve({ ok: false, error: 'No session data found in FIT file' })
          return
        }

        const startDate = new Date(session.start_time)
        const durationSeconds = Math.round(session.total_elapsed_time ?? 0)
        const distanceMeters = Math.round(session.total_distance ?? 0)
        const elevationGain = Math.round(session.total_ascent ?? 0)
        const avgHR = session.avg_heart_rate
        const maxHR = session.max_heart_rate

        if (durationSeconds < 60) {
          resolve({ ok: false, error: 'Activity is too short' })
          return
        }

        // avg_speed from the library is in km/h (we asked for speedUnit: 'km/h')
        const avgSpeedKmh = session.avg_speed
        const avgPaceSecPerKm = avgSpeedKmh && avgSpeedKmh > 0
          ? Math.round(3600 / avgSpeedKmh)
          : distanceMeters > 0 ? Math.round(durationSeconds / (distanceMeters / 1000)) : undefined

        // Build streams from records
        const records = data.records ?? []
        const hrStream = records.map(r => r.heart_rate).filter((v): v is number => v != null)
        const altStream = records.map(r => r.altitude).filter((v): v is number => v != null)
        const timeStream = records.reduce<number[]>((acc, r) => {
          if (r.timestamp) {
            const t = new Date(r.timestamp).getTime()
            const offset = Math.round((t - startDate.getTime()) / 1000)
            acc.push(offset)
          }
          return acc
        }, [])

        resolve({
          ok: true,
          activity: {
            source: 'fit',
            name: 'Imported run',
            startDate: startDate.toISOString(),
            durationSeconds,
            distanceMeters,
            elevationGainMeters: elevationGain,
            avgHeartRate: avgHR,
            maxHeartRate: maxHR,
            avgPaceSecPerKm,
            activityType: sportToActivityType(session.sport),
            hrStream: hrStream.length > 0 ? hrStream : undefined,
            timeStream: timeStream.length > 0 ? timeStream : undefined,
            altitudeStream: altStream.length > 0 ? altStream : undefined,
          },
        })
      } catch (e) {
        resolve({ ok: false, error: String(e) })
      }
    })
  })
}
