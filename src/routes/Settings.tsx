import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStrava } from '@/hooks/useStrava'
import { useSync } from '@/hooks/useSync'
import { useActivityCount } from '@/hooks/useActivities'
import { useSettings } from '@/hooks/useSettings'
import { setSetting } from '@/lib/db/settings'
import { getAllActivities, upsertActivities } from '@/lib/db/activities'
import { backfillMetrics } from '@/lib/metrics/backfill'
import { calcZoneBounds } from '@/lib/metrics/zones'
import { db } from '@/lib/db/schema'
import { parseGPX } from '@/lib/parsers/gpx'
import { parseFIT } from '@/lib/parsers/fit'
import { parsedToActivity, manualToActivity } from '@/lib/parsers/toActivity'
import { saveStreams } from '@/lib/db/streams'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityType } from '@/types'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ZONE_COLORS = {
  Z1: '#34D399',
  Z2: '#7DD3FC',
  Z3: '#F59E0B',
  Z4: '#F97316',
  Z5: '#EF4444',
}
const ZONE_LABELS = {
  Z1: 'Recovery',
  Z2: 'Aerobic base',
  Z3: 'Tempo',
  Z4: 'Threshold',
  Z5: 'VO₂max',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3"
    >
      {children}
    </h2>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-lg divide-y divide-muted/20">
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="p-4 flex items-center justify-between gap-3">{children}</div>
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        checked ? 'bg-accent' : 'bg-muted/40'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ── Main route ────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate()
  const settings = useSettings()
  const { isAuthed, isLoading, login, logout } = useStrava()
  const { sync, state: syncState, progress, errorMsg, lastSyncedAt, isOnline } = useSync()
  const activityCount = useActivityCount()

  // Profile local state — initialize from settings once loaded
  const [maxHR, setMaxHR] = useState(192)
  const [restHR, setRestHR] = useState(53)
  const [weightKg, setWeightKg] = useState<string>('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!settings) return
    setMaxHR(settings.maxHR)
    setRestHR(settings.restHR)
    setWeightKg(settings.weightKg !== undefined ? String(settings.weightKg) : '')
  }, [settings?.maxHR, settings?.restHR, settings?.weightKg])

  // PWA install prompt
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [installOutcome, setInstallOutcome] = useState<'accepted' | 'dismissed' | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      installPromptRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setCanInstall(false))
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const triggerInstall = useCallback(async () => {
    const prompt = installPromptRef.current
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    setInstallOutcome(outcome)
    if (outcome === 'accepted') {
      setCanInstall(false)
      installPromptRef.current = null
    }
  }, [])

  const zoneBounds = calcZoneBounds(maxHR, restHR)
  const zones = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as const

  async function saveProfile() {
    const maxVal = Math.max(140, Math.min(220, maxHR))
    const restVal = Math.max(30, Math.min(100, restHR))
    setProfileSaving(true)
    await setSetting('maxHR', maxVal)
    await setSetting('restHR', restVal)
    const kg = parseFloat(weightKg)
    if (!isNaN(kg) && kg > 0) {
      await setSetting('weightKg', kg)
    }
    await backfillMetrics()
    setProfileSaving(false)
    setProfileSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handleRpeToggle(val: boolean) {
    await setSetting('rpeEnabled', val)
  }

  // ── File import ──
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportStatus('parsing')
    setImportMsg('')

    try {
      let result
      if (file.name.toLowerCase().endsWith('.gpx')) {
        const text = await file.text()
        result = parseGPX(text)
      } else if (file.name.toLowerCase().endsWith('.fit')) {
        const buf = await file.arrayBuffer()
        result = await parseFIT(buf)
      } else {
        setImportStatus('error')
        setImportMsg('Unsupported file type. Use .gpx or .fit')
        return
      }

      if (!result.ok) {
        setImportStatus('error')
        setImportMsg(result.error)
        return
      }

      const activity = parsedToActivity(result.activity)
      await upsertActivities([activity])

      // Save streams if available
      const p = result.activity
      if (p.hrStream || p.timeStream) {
        await saveStreams(activity.id, {
          heartrate: p.hrStream,
          time: p.timeStream,
          altitude: p.altitudeStream,
        })
      }

      await backfillMetrics()
      setImportStatus('done')
      setImportMsg(`Imported: ${result.activity.name}`)
    } catch (err) {
      setImportStatus('error')
      setImportMsg(String(err))
    }
  }

  // ── Manual entry ──
  const [showManual, setShowManual] = useState(false)
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10))
  const [mHours, setMHours] = useState(0)
  const [mMins, setMMins] = useState(45)
  const [mDistKm, setMDistKm] = useState('')
  const [mEle, setMEle] = useState('')
  const [mType, setMType] = useState<ActivityType>('Run')
  const [mName, setMName] = useState('')
  const [mRpe, setMRpe] = useState<number>(5)
  const [mSaving, setMSaving] = useState(false)
  const [mSaved, setMSaved] = useState(false)

  async function saveManual() {
    const durationSeconds = mHours * 3600 + mMins * 60
    if (durationSeconds < 60) return
    setMSaving(true)
    const activity = manualToActivity({
      name: mName || `Manual ${mType}`,
      startDate: new Date(mDate).toISOString(),
      durationSeconds,
      distanceMeters: Math.round(parseFloat(mDistKm || '0') * 1000),
      elevationGainMeters: Math.round(parseFloat(mEle || '0')),
      type: mType,
      rpe: mRpe,
    })
    await upsertActivities([activity])
    await backfillMetrics()
    setMSaving(false)
    setMSaved(true)
    setShowManual(false)
    setTimeout(() => setMSaved(false), 3000)
  }

  // ── Export ──
  async function exportData() {
    const [activities, dailyMetrics] = await Promise.all([
      getAllActivities(),
      db.dailyMetrics.toArray(),
    ])
    const blob = new Blob(
      [JSON.stringify({ activities, dailyMetrics, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `broke-runner-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Clear data ──
  const [confirmClear, setConfirmClear] = useState(false)
  async function clearAllData() {
    await Promise.all([
      db.activities.clear(),
      db.dailyMetrics.clear(),
      db.streams.clear(),
      db.settings.clear(),
    ])
    setConfirmClear(false)
    navigate('/', { replace: true })
  }

  const lastSyncLabel = lastSyncedAt
    ? `${formatDistanceToNow(new Date(lastSyncedAt))} ago`
    : 'Never'

  const rpeEnabled = settings?.rpeEnabled ?? true

  return (
    <div className="p-4 max-w-lg mx-auto pb-10">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>

      {/* ── Profile ── */}
      <section aria-labelledby="profile-heading" className="mb-6">
        <SectionHeading id="profile-heading">Profile</SectionHeading>
        <SectionCard>
          <Row>
            <label htmlFor="maxHR" className="flex-1">
              <p className="text-text-primary font-medium">Max Heart Rate</p>
              <p className="text-text-secondary text-xs mt-0.5">Used for TRIMP and HR zones</p>
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                id="maxHR"
                type="number"
                min={140}
                max={220}
                value={maxHR}
                onChange={e => setMaxHR(parseInt(e.target.value, 10) || 192)}
                className="w-16 bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums text-center focus:outline-none focus:border-accent/60"
                aria-label="Max heart rate in bpm"
              />
              <span className="text-text-secondary text-xs">bpm</span>
            </div>
          </Row>
          <Row>
            <label htmlFor="restHR" className="flex-1">
              <p className="text-text-primary font-medium">Resting Heart Rate</p>
              <p className="text-text-secondary text-xs mt-0.5">Resting HR for Karvonen formula</p>
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                id="restHR"
                type="number"
                min={30}
                max={100}
                value={restHR}
                onChange={e => setRestHR(parseInt(e.target.value, 10) || 53)}
                className="w-16 bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums text-center focus:outline-none focus:border-accent/60"
                aria-label="Resting heart rate in bpm"
              />
              <span className="text-text-secondary text-xs">bpm</span>
            </div>
          </Row>
          <Row>
            <label htmlFor="weightKg" className="flex-1">
              <p className="text-text-primary font-medium">Body Weight</p>
              <p className="text-text-secondary text-xs mt-0.5">Optional, for future load metrics</p>
            </label>
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                id="weightKg"
                type="number"
                min={30}
                max={200}
                step={0.5}
                placeholder="—"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className="w-16 bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums text-center focus:outline-none focus:border-accent/60"
                aria-label="Body weight in kilograms"
              />
              <span className="text-text-secondary text-xs">kg</span>
            </div>
          </Row>
          <div className="p-4 flex items-center justify-between">
            <p className="text-text-muted text-xs">
              Saving recomputes all metrics
            </p>
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-bg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {profileSaving ? 'Saving…' : profileSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </SectionCard>
      </section>

      {/* ── HR Zones ── */}
      <section aria-labelledby="zones-heading" className="mb-6">
        <SectionHeading id="zones-heading">HR Zones (Karvonen)</SectionHeading>
        <div className="bg-surface rounded-lg overflow-hidden">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-muted/20">
                <th className="text-left px-4 py-2 text-text-muted text-xs font-medium w-12">Zone</th>
                <th className="text-left px-4 py-2 text-text-muted text-xs font-medium">Name</th>
                <th className="text-right px-4 py-2 text-text-muted text-xs font-medium">Range</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z} className="border-b border-muted/10 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: ZONE_COLORS[z] }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-text-primary tabular-nums">{z}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{ZONE_LABELS[z]}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-text-primary">
                    {zoneBounds[z][0]}–{zoneBounds[z][1]} bpm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-text-muted text-xs border-t border-muted/10">
            Preview updates live — save profile to persist
          </p>
        </div>
      </section>

      {/* ── RPE prefs ── */}
      <section aria-labelledby="rpe-heading" className="mb-6">
        <SectionHeading id="rpe-heading">RPE Input</SectionHeading>
        <SectionCard>
          <Row>
            <div className="flex-1">
              <p className="text-text-primary font-medium">Enable RPE-based TRIMP</p>
              <p className="text-text-secondary text-xs mt-0.5">
                Estimate training load from effort rating when HR data is unavailable
              </p>
            </div>
            <Toggle
              checked={rpeEnabled}
              onChange={handleRpeToggle}
              label="Enable RPE-based TRIMP"
            />
          </Row>
        </SectionCard>
      </section>

      {/* ── Strava ── */}
      <section aria-labelledby="strava-heading" className="mb-6">
        <SectionHeading id="strava-heading">Strava</SectionHeading>
        <SectionCard>
          <Row>
            <div>
              <p className="text-text-primary font-medium">Strava Account</p>
              <p className="text-text-secondary text-sm mt-0.5">
                {isLoading ? 'Loading…' : isAuthed ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {!isLoading && (
              <button
                onClick={isAuthed ? logout : login}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isAuthed
                    ? 'bg-danger/10 text-danger hover:bg-danger/20'
                    : 'bg-accent text-bg hover:bg-accent/90'
                }`}
              >
                {isAuthed ? 'Disconnect' : 'Connect Strava'}
              </button>
            )}
          </Row>
          {isAuthed && (
            <Row>
              <div>
                <p className="text-text-primary font-medium">Sync Activities</p>
                <p className={`text-sm mt-0.5 ${syncState === 'error' ? 'text-danger' : 'text-text-secondary'}`}>
                  {!isOnline
                    ? "You're offline — sync unavailable"
                    : syncState === 'syncing'
                      ? `Fetching… ${progress} activities`
                      : syncState === 'error'
                        ? errorMsg
                        : `Last synced: ${lastSyncLabel} · ${activityCount} runs`}
                </p>
              </div>
              <button
                onClick={sync}
                disabled={syncState === 'syncing' || !isOnline}
                className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-muted/40 text-text-primary hover:border-accent/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncState === 'syncing' ? 'Syncing…' : 'Sync now'}
              </button>
            </Row>
          )}
        </SectionCard>
      </section>

      {/* ── Import ── */}
      <section aria-labelledby="import-heading" className="mb-6">
        <SectionHeading id="import-heading">Import</SectionHeading>
        <SectionCard>
          {/* File import */}
          <Row>
            <div className="flex-1">
              <p className="text-text-primary font-medium">GPX / FIT file</p>
              <p className="text-text-secondary text-xs mt-0.5">
                Import from Strava export, Garmin, or Huawei
              </p>
              {importStatus === 'done' && (
                <p className="text-success text-xs mt-1">{importMsg}</p>
              )}
              {importStatus === 'error' && (
                <p className="text-danger text-xs mt-1">{importMsg}</p>
              )}
              {importStatus === 'parsing' && (
                <p className="text-text-muted text-xs mt-1">Parsing…</p>
              )}
            </div>
            <label className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-muted/40 text-text-primary hover:border-accent/60 transition-colors cursor-pointer">
              Choose file
              <input
                type="file"
                accept=".gpx,.fit"
                className="sr-only"
                onChange={handleFileImport}
              />
            </label>
          </Row>

          {/* Manual entry */}
          <div className="p-4">
            <button
              onClick={() => setShowManual(v => !v)}
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              {showManual ? '− Hide manual entry' : '+ Add activity manually'}
            </button>
            {mSaved && (
              <p className="text-success text-xs mt-1">Activity saved</p>
            )}

            {showManual && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Date</label>
                    <input
                      type="date"
                      value={mDate}
                      onChange={e => setMDate(e.target.value)}
                      className="w-full bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent/60"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Type</label>
                    <select
                      value={mType}
                      onChange={e => setMType(e.target.value as ActivityType)}
                      className="w-full bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent/60"
                    >
                      <option value="Run">Run</option>
                      <option value="TrailRun">Trail Run</option>
                      <option value="VirtualRun">Virtual Run</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Name (optional)</label>
                  <input
                    type="text"
                    placeholder="Morning Run"
                    value={mName}
                    onChange={e => setMName(e.target.value)}
                    className="w-full bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent/60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Duration</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="number"
                        min={0} max={12}
                        value={mHours}
                        onChange={e => setMHours(parseInt(e.target.value) || 0)}
                        className="w-14 bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums text-center focus:outline-none focus:border-accent/60"
                      />
                      <span className="text-text-muted text-xs">h</span>
                      <input
                        type="number"
                        min={0} max={59}
                        value={mMins}
                        onChange={e => setMMins(parseInt(e.target.value) || 0)}
                        className="w-14 bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums text-center focus:outline-none focus:border-accent/60"
                      />
                      <span className="text-text-muted text-xs">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Distance (km)</label>
                    <input
                      type="number"
                      min={0} step={0.1}
                      placeholder="0.0"
                      value={mDistKm}
                      onChange={e => setMDistKm(e.target.value)}
                      className="w-full bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums focus:outline-none focus:border-accent/60"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">
                    RPE (1–10) — effort rating
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        onClick={() => setMRpe(n)}
                        aria-pressed={mRpe === n}
                        className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                          mRpe === n
                            ? 'bg-accent text-bg'
                            : 'bg-bg border border-muted/40 text-text-secondary hover:border-accent/50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted block mb-1">Elevation gain (m, optional)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={mEle}
                    onChange={e => setMEle(e.target.value)}
                    className="w-28 bg-bg border border-muted/40 rounded-md px-2 py-1.5 text-sm text-text-primary tabular-nums focus:outline-none focus:border-accent/60"
                  />
                </div>

                <button
                  onClick={saveManual}
                  disabled={mSaving || (mHours === 0 && mMins === 0)}
                  className="w-full py-2 rounded-md text-sm font-medium bg-accent text-bg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {mSaving ? 'Saving…' : 'Save activity'}
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      {/* ── Install ── */}
      {(canInstall || installOutcome) && (
        <section aria-labelledby="install-heading" className="mb-6">
          <SectionHeading id="install-heading">Install App</SectionHeading>
          <SectionCard>
            <Row>
              <div>
                <p className="text-text-primary font-medium">Add to Home Screen</p>
                <p className="text-text-secondary text-xs mt-0.5">
                  {installOutcome === 'accepted'
                    ? 'Installed — launch from your home screen'
                    : installOutcome === 'dismissed'
                      ? 'Dismissed — tap to try again'
                      : 'Install Broke Runner as a standalone app'}
                </p>
              </div>
              {canInstall && (
                <button
                  onClick={triggerInstall}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-accent text-bg hover:bg-accent/90 transition-colors"
                >
                  Install
                </button>
              )}
            </Row>
          </SectionCard>
        </section>
      )}

      {/* ── Data ── */}
      <section aria-labelledby="data-heading" className="mb-6">
        <SectionHeading id="data-heading">Data</SectionHeading>
        <SectionCard>
          <Row>
            <div>
              <p className="text-text-primary font-medium">Export all data</p>
              <p className="text-text-secondary text-xs mt-0.5">
                Downloads activities and metrics as JSON
              </p>
            </div>
            <button
              onClick={exportData}
              className="px-4 py-2 rounded-md text-sm font-medium bg-surface border border-muted/40 text-text-primary hover:border-accent/60 transition-colors"
            >
              Export
            </button>
          </Row>
          <div className="p-4">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full py-2 rounded-md text-sm font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
              >
                Clear all data
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-text-primary text-sm font-medium">
                  Delete all activities, metrics, and settings?
                </p>
                <p className="text-text-secondary text-xs">This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-2 rounded-md text-sm font-medium bg-surface border border-muted/40 text-text-primary hover:border-muted/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={clearAllData}
                    className="flex-1 py-2 rounded-md text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
                  >
                    Delete everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  )
}
