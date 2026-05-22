import Dexie, { type Table } from 'dexie'
import type { Activity, DailyMetrics } from '@/types'

interface SettingRow {
  key: string
  value: unknown
}

interface StreamRow {
  activityId: string
  type: string
  data: number[]
  time: number[]
}

export class BrokeRunnerDB extends Dexie {
  activities!: Table<Activity>
  dailyMetrics!: Table<DailyMetrics>
  settings!: Table<SettingRow>
  streams!: Table<StreamRow>

  constructor() {
    super('broke-runner')
    this.version(1).stores({
      activities: 'id, startDate, type, source',
      dailyMetrics: 'date',
      settings: 'key',
      streams: '[activityId+type]',
    })
  }
}

export const db = new BrokeRunnerDB()
