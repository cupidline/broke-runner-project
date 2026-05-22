export interface TokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: StravaAthlete
}

export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  profile_medium: string
  city: string
  country: string
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  elapsed_time: number
  moving_time: number
  distance: number
  total_elevation_gain: number
  average_heartrate?: number
  max_heartrate?: number
  average_speed: number
  has_heartrate: boolean
  map: {
    summary_polyline: string | null
  }
}

export interface StravaStream {
  type: string
  data: number[]
  series_type: string
  resolution: string
}
