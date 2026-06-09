# Lean Hyphen — Gamified Financial-Literacy Platform

> Behaviour-first, scenario-based learning for Indian students.
> Module: **Smart Spending & Money Choices**.

Two fully interactive, voice-narrated lessons — each embeddable in a third-party
LMS via iframe, each with its own event-sourced **analytics & reporting API** for
the LMS dashboard.

---

## Live

| What | URL |
|---|---|
| **Lesson 1 — Think Before You Spend** (4 acts) | <https://think-before-you-spend.vercel.app/lesson1> |
| **Lesson 2 — Where Does My Money Go?** (3 acts) | <https://where-does-my-money-go.vercel.app/lesson2> |
| **Backend API** (health) | <https://backend-ten-delta-54.vercel.app/api/health> |

The two lessons are **independent** — separate Vercel projects, separate domains,
no cross-links. All acts are **unlocked** (a learner can play any act from the
lesson home page). Identity is carried by a `learnerId` query param at launch.

---

## The two lessons

### Lesson 1 — Think Before You Spend · `think-before-you-spend` · 4 acts

| # | Act | Kind |
|---|---|---|
| 1 | Temptation | Cinematic shopping simulation (28-phase Spree-app story) |
| 2 | Understanding Impulse Buying | Mind-trap drag game + flash cards |
| 3 | Real-life Simulation | Influencer-reel "Better Deal" scenario + pick-3 challenge |
| 4 | Reflect & Realise | Impulse-meter self-snapshot + 5 takeaways |

Highlights: mock iOS shopping app with three nudge waves and interactive
add-to-cart; 12-thought drag-to-zone mind-trap game; full-bleed influencer reel
with a 20-second pick-3 challenge; a 5-zone impulse meter and a sequential
five-takeaway reveal that closes on an identity statement.

### Lesson 2 — Where Does My Money Go? · `where-does-my-money-go` · 3 acts

Narrated by **Kabir** (ElevenLabs voice `iae6jJUCSBOtTkBXKD65`, consistent across
all acts), with calm background music tuned to sit under the narration.

| # | Act | Kind |
|---|---|---|
| 1 | Dream Bedroom Makeover | 3D room simulation — set a vibe, sort **needs vs wants**, shop to a budget, weather random events, see a spending snapshot |
| 2 | The 50/30/20 Rule | 3D pie + looping "Rule TV" explainer (embedded YouTube Short), then the **"Who's Nailing Their First Salary?"** activity (Arjun / Priya / Sneha) |
| 3 | Test Your Understanding | Timed quiz — **45 s per question**, urgency countdown that stops at 0 without revealing the answer |

### Voice & music (both lessons)

- **TTS** is synthesised server-side (`/api/tts`) — ElevenLabs for the lesson
  narrators, with an MS Edge Neural TTS fallback so audio never hard-fails.
- **Background music** is streamed from `/api/music`, mixed under the narration.
- Music stops on the lesson home pages and is cancelled cleanly on navigation.

---

## Analytics & reporting (the LMS-facing system)

Every meaningful interaction is captured as an **event**, projected into rolled-up
session/act/scene/activity rows, scored, and exposed as a **report** the LMS can
read. The whole pipeline is durable (Postgres) and keyed by the learner's stable
`learnerId`.

```
Student plays a lesson (in the LMS iframe)
   │  lesson auto-posts batched events  →  POST /api/analytics/events
   ▼
Backend  →  validate → project → score → badge → store (Postgres JSONB)
   │  LMS dashboard reads on demand  →  GET /api/analytics/lms-export/{lessonId}?sessionId={learnerId}
   ▼
LMS shows the student's score, badge, per-act breakdown, insights
```

> **Pull-based, not push.** The lesson → backend leg is automatic; the backend →
> LMS leg is **not**. The LMS reads our endpoints when it wants a report. We do
> not push to the LMS (no webhook/xAPI today — see *Roadmap*).

### Identity

Launch each lesson iframe with a **stable, unique** `learnerId`:

```
https://where-does-my-money-go.vercel.app/lesson2?learnerId=lms-<tenant>-<studentId>
https://think-before-you-spend.vercel.app/lesson1?learnerId=lms-<tenant>-<studentId>
```

- `learnerId` becomes the `sessionId` on every read endpoint.
- Stable per student across devices/sessions. A replay = a new `attemptNo`
  (report shows the latest; `/sessions` lists all).
- ⚠️ The API is **unauthenticated** and keyed only by `learnerId` — use an
  **opaque internal ID** (not email/name), and treat it as the lookup key to that
  student's data.

### Scoring

Each lesson has its own scoring config (all out of **100**):

| Lesson | Config | Per-act max |
|---|---|---|
| Think Before You Spend | `tbs-v1` | act1–4 = 25 each |
| Where Does My Money Go? | `wdmmg-v1` | act1 = 30, act2 = 30, **act3 = 40** (answer-weighted) |

A report surfaces three 0–100 numbers:

- **Total** — Σ per-act points (scenes completed + activities graded).
- **Learning** — accuracy (60) + scenario quality (25) + completion (15).
- **Engagement** — completion (60) + **interaction count** (25) + activity
  participation (15). **Not time-based** — clicking/answering earns it at any pace.

### Badge (single, by total score)

| Score | Badge |  | Score | Badge |
|---|---|---|---|---|
| 100 | 👑 Legend | | 60–69 | 🥈 Silver |
| 90–99 | 💎 Diamond | | 50–59 | 🥉 Bronze |
| 80–89 | 🏆 Platinum | | 40–49 | ⭐ Rising Star |
| 70–79 | 🥇 Gold | | 30–39 | 🌱 Starter |
| | | | below 30 | no badge (`badge: null`) |

### Incremental & first-time behaviour

- The report returns **one row per act of that lesson** (4 / 3). Finish act1+act2
  → those fill; later acts stay `0` until played. Marks reflect the **latest**
  play of each act, and recompute after every act (the report page auto-refreshes
  on focus and has a manual **Refresh** button).
- **First-time student (no acts):** every read returns `{ "report": null }` (or
  `{ "export": null }`) at HTTP 200 — not an error.

### Read endpoints (`GET`, `?sessionId={learnerId}`)

Base: `https://backend-ten-delta-54.vercel.app`

| Endpoint | Returns |
|---|---|
| `/api/analytics/lms-export/{lessonId}` | **Stable LMS payload** (schemaVersion 1.0) — score, badge, per-act, completion |
| `/api/analytics/lesson/{lessonId}[&attempt=N]` | Full report (latest or attempt N) — adds learning/engagement, insights |
| `/api/analytics/act/{lessonId}/{actId}` | Single-act drill-down |
| `/api/analytics/sessions/{lessonId}` | All attempts (history / leaderboard) |
| `/api/analytics/attempts/{lessonId}` | Best / latest / average roll-up |

`{lessonId}` ∈ { `think-before-you-spend`, `where-does-my-money-go` }.

<details>
<summary><b>Sample <code>lms-export</code> response</b> (schemaVersion 1.0)</summary>

```json
{
  "schemaVersion": "1.0",
  "learner": { "sessionId": "lms-acme-stud123" },
  "lesson": { "lessonId": "where-does-my-money-go", "attemptNo": 1,
              "completed": true, "startedAt": "…", "completedAt": "…" },
  "score": { "total": 33, "learning": 49, "engagement": 19,
             "completionPct": 8.33, "timeMs": 0 },
  "badge": { "tier": "starter", "label": "Starter", "emoji": "🌱", "minScore": 30 },
  "acts": [
    { "actId": "act1", "title": "Act 1 — Dream Bedroom Makeover", "pointsEarned": 0,  "pointsMax": 30 },
    { "actId": "act2", "title": "Act 2 — The 50/30/20 Rule",      "pointsEarned": 0,  "pointsMax": 30 },
    { "actId": "act3", "title": "Act 3 — Test Your Understanding","pointsEarned": 33, "pointsMax": 40, "accuracyPct": 80, "completionPct": 100 }
  ],
  "improvement": null,
  "_extras": { "insights": [ { "kind": "strongest-act", "message": "…80% accuracy." } ] }
}
```
</details>

Full LMS integration reference: [`docs/LMS_BOTH_LESSONS.md`](docs/LMS_BOTH_LESSONS.md).
Deep dives: [`docs/ANALYTICS.md`](docs/ANALYTICS.md), [`docs/REPORT_AND_ANALYTICS.md`](docs/REPORT_AND_ANALYTICS.md).

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Framer Motion, `@react-three/fiber`, React Router 6, lucide-react |
| Backend | Node.js 20, Express 4, PostgreSQL (`pg`) |
| Database | **Supabase** Postgres (production); file fallback when `DATABASE_URL` is absent |
| Voice/Music | ElevenLabs (primary) + MS Edge Neural TTS (fallback), served via `/api/tts` & `/api/music` |
| Deploy | Vercel — **3 projects**: `backend`, `think-before-you-spend`, `where-does-my-money-go` |

The backend degrades gracefully: with no `DATABASE_URL` it uses a local/`/tmp`
JSON file store, so the whole pipeline runs in dev without any Postgres setup.

---

## Repository layout

```
lean-hyphen-learning/
├── frontend/                         # React + Vite app (serves BOTH lessons by route)
│   ├── src/
│   │   ├── pages/                    # HomePage, LessonPage (L1), Lesson2Page (L2),
│   │   │                             #   LessonReportPage, Lesson2ReportPage
│   │   ├── components/
│   │   │   ├── acts/                 # Lesson 1 acts: Act1/ Act2/ Act3/ Act4/
│   │   │   │   └── dreamBedroomMakeover/   # Lesson 2 acts: Act1/ Act2/ Act3/ + useL2Analytics.js
│   │   │   └── shared/LessonReport.jsx     # the report card (score, badge, per-act) — shared by both lessons
│   │   ├── data/lessons/             # lesson content (decoupled from components)
│   │   ├── hooks/useAnalytics.js     # act/scene/activity event helpers
│   │   └── utils/
│   │       ├── api.js                # fetch wrapper + getSessionId() (reads ?learnerId=)
│   │       ├── analytics.js          # batched event queue → POST /api/analytics/events
│   │       └── sounds.js             # TTS + music playback
│   └── vercel.json
└── backend/                          # Express API
    ├── src/
    │   ├── server.js                 # app + open CORS for analytics/tts/music
    │   ├── routes/                   # analytics.js, tts.js, music.js, progress.js, reflections.js, lessons.js
    │   ├── analytics/                # events.js, scoring.js, badges.js, reports.js
    │   ├── storage/analyticsStore.js # durable Postgres JSONB blob (file fallback)
    │   └── db/                        # pg pool + migrations
    └── data/                          # file-store fallback (gitignored)
```

---

## Local development

### Prerequisites
- Node.js 20+
- (Optional) a Postgres `DATABASE_URL` — leave blank to use the file fallback.

### Backend
```bash
cd backend
cp .env.example .env          # paste DATABASE_URL (optional) + ElevenLabs keys (optional)
npm install
npm run migrate               # only if DATABASE_URL is set
npm start                     # → http://localhost:4000
```
Health: <http://localhost:4000/api/health> (reports `"storage": "postgres" | "file"`).

### Frontend
```bash
cd frontend
npm install
npm run dev                   # → http://localhost:5173
```
The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no extra
config is needed. Then open:
- `http://localhost:5173/lesson1` (Lesson 1)
- `http://localhost:5173/lesson2` (Lesson 2)
- `http://localhost:5173/lesson/{lessonId}/report` (the report card)

Append `?learnerId=test-me` to any lesson URL to pin a test identity.

---

## Environment variables

### `backend/.env`
| Var | Required | Notes |
|---|---|---|
| `PORT` | no | Defaults to `4000`. |
| `DATABASE_URL` | no | Supabase/any Postgres. Blank → file fallback. |
| `PGSSL` | no | `true` (default) for managed Postgres. |
| `CORS_ORIGINS` | no | Legacy allow-list. Analytics/TTS/music are **open-CORS** regardless (public, no-credential). |
| `ELEVENLABS_API_KEY` | no | Enables ElevenLabs TTS; falls back to Edge if absent/limited. |
| `ELEVENLABS_VOICE_*` | no | Per-role ElevenLabs voice IDs (e.g. Kabir for Lesson 2). |

### `frontend/.env` / `.env.local`
| Var | Required | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | prod only | Blank locally (uses Vite proxy). Set to the backend URL for production builds (`.env.production` already points at `backend-ten-delta-54.vercel.app`). |

---

## Other API endpoints

Beyond analytics, the backend also serves:

- `GET /api/health` — liveness + storage mode.
- `GET /api/tts?text=…&voice=…` — MP3 narration (ElevenLabs → Edge fallback).
- `GET /api/music?...` — background music stream.
- `POST /api/analytics/events` — batch event ingest (the lessons call this; the LMS does not).
- `POST /api/progress`, `POST /api/reflections` — legacy per-act progress / free-text reflection.

---

## Deployment (Vercel — 3 projects)

All three projects deploy from this one repo:

| Project | Root dir | Domain |
|---|---|---|
| `backend` | `backend/` | `backend-ten-delta-54.vercel.app` |
| `think-before-you-spend` | `frontend/` | `think-before-you-spend.vercel.app` |
| `where-does-my-money-go` | `frontend/` | `where-does-my-money-go.vercel.app` |

Both lesson projects build the **same** `frontend/` code; routing (`/lesson1`,
`/lesson2`) decides which lesson renders. To ship:

```bash
# backend
cd backend && vercel link --project backend --yes && vercel --prod --yes

# each lesson frontend
cd ../frontend
vercel link --project think-before-you-spend --yes && vercel --prod --yes
vercel link --project where-does-my-money-go --yes && vercel --prod --yes
```

> Note: the lesson sites send **no** `X-Frame-Options`/CSP `frame-ancestors`, so
> they embed cleanly in any LMS iframe.

---

## Roadmap

- **Push to LMS (xAPI/webhook):** optionally POST results to an LRS / callback on
  act completion, instead of pull-only reads.
- **Auth:** replace anonymous `learnerId` with signed identity if the LMS needs it.
- **More lessons** in the *Smart Spending & Money Choices* module.
- **Per-row analytics schema** (currently a single JSONB blob) if write contention
  appears at LMS scale.
