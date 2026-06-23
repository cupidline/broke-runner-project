# Broke Runner

Personal training analytics for runners. Connects to Strava and tracks fitness, fatigue, readiness, and training recommendations. All computation runs client-side in the browser — no server, no account beyond Strava.

## Features

- **Training readiness (0–100)** — composite of TSB, ACWR, and monotony, personally calibrated to your own history
- **PMC (Performance Management Chart)** — CTL (fitness), ATL (fatigue), TSB (form) over time
- **TRIMP load** — Banister formula with zone-based intensity multiplier and personal band calibration
- **Heart rate zones** — Karvonen method; time-in-zone chart per period
- **Pace zones** — 5 personal zones auto-derived from your run percentiles; time-in-zone per period
- **Workout recommendations** — daily suggestion with target zone, duration, and pace range
- **Fitness Score** — composite of CTL, VO2max estimate, and aerobic efficiency
- **Endurance Capacity** — long run history, volume, and weekly consistency
- **Weekly charts** — load, distance, runs per week, long run progression
- **Activity load table** — per-run TRIMP with personal band labels
- **Run type distribution** — TRIMP gauge (undertrained → overreaching) per period
- **Pace prediction** — data-driven pace ranges for each workout type, sourced from your recent runs only
- **PWA** — installable on Android via Chrome "Add to Home Screen", works offline

All metrics documented in [CALCULATIONS.md](./CALCULATIONS.md).

## Prerequisites

- Node.js 18+
- A [Strava API application](https://www.strava.com/settings/api)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Strava API app

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application
3. Set **Authorization Callback Domain** to `localhost`
4. Note down your **Client ID** and **Client Secret**

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
VITE_STRAVA_CLIENT_SECRET=your_client_secret
VITE_STRAVA_REDIRECT_URI=http://localhost:5173
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser, go to **Settings**, and connect your Strava account.

## Other commands

```bash
npm run build        # production build
npm run preview      # preview the production build locally
npm test             # run tests in watch mode
npm run test:run     # run tests once
npm run typecheck    # TypeScript type check
```

## Deploying to Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Add environment variables in Vercel → Settings → Environment Variables:
   - `VITE_STRAVA_CLIENT_ID`
   - `VITE_STRAVA_CLIENT_SECRET`
   - `VITE_STRAVA_REDIRECT_URI` → set to your Vercel production URL (e.g. `https://your-app.vercel.app`)
3. In your Strava API settings, update **Authorization Callback Domain** to your Vercel domain (e.g. `your-app.vercel.app`)
4. Redeploy after saving env vars
