# Lean Hyphen — Gamified Learning Platform

> Behaviour-first learning for Indian students. Module 1: **Smart Spending & Money Choices** → Lesson: **Think Before You Spend**.

**Live**
- App: <https://frontend-think-before-you-spend.vercel.app> (also accessible at the legacy URL <https://frontend-one-kappa-15.vercel.app>)
- API health: <https://backend-ten-delta-54.vercel.app/api/health>

Every push to `main` auto-deploys both projects on Vercel.

This repo holds the interactive lesson app (React + Tailwind) and the API (Node.js/Express + PostgreSQL). It is designed to be embedded inside the third-party LMS that the [Lean Hyphen landing page](https://lean-hyphen-user-web-4zrf.vercel.app/#home) sends users to.

The current build ships **all four Acts** of the lesson:

| # | Act | Duration | Kind |
|---|---|---|---|
| 1 | Temptation | ~4 min | Cinematic shopping simulation |
| 2 | Understanding Impulse Buying | ~3 min | Drag game + flash cards |
| 3 | Real-life Simulation | ~2 min | Influencer reel scenario |
| 4 | Reflect & Realise | ~2 min | Impulse meter + 5 takeaways |
| **Total** | | **~12 min** | |

Each Act unlocks **sequentially** — the home page locks Act 2 until Act 1 is completed, locks Act 3 until Act 2 is completed, and so on. Progress lives in `localStorage` (`lh.lessonState.v1`).

---

## What's in each Act

### Act 1 — Temptation (cinematic shopping simulation)

A 28-phase story-driven simulation. Highlights:

- **Cinematic opening:** DiceBear avataaars character (Shanaya) in a flat-illustrated bedroom narrating context. Bedroom SVG vignettes (Meet Shanaya, Birthday, Group Chat, Vision, App Open) with depth, shimmer, and a small iPhone overlaid on the avatar with a real Apple-logo silhouette.
- **Mock Spree shopping app:** iOS-style home grid → tap the Spree icon → app-launch zoom → typed search → results grid → PDP. Trending category strip with a 🔥 Trending tile, hero banner, product cards with real Unsplash imagery (sneakers, hoodie, selfie light, smartwatch, iPhone 17, etc.). Wishlist hearts + free-delivery banner that auto-computes **tomorrow's date**.
- **Three nudge waves with interactive Add-to-Cart:**
  - *Complete the Look* — Branded Socks suggestion
  - *Trending → Flash Deal* — Birthday Hoodie with a live 5-minute countdown + ₹999 → ₹799 strikethrough
  - *NEW OFFER UNLOCKED · Add 1 more & get Phone Case FREE 🎀* — Selfie Glow Clip Light bundle
- **Two ways to tap Add-to-Cart:** the actual coral button inside the phone PDP **and** a yellow "👉 Tap here" pill below the phone — both fire the same handler. Saffron ring + pulsing glow direct the eye.
- **Final cart reveal + checkout flow:** items list with FREE pill on the phone case → total ₹2,796 → "Wait… I only came here to buy shoes" thought → Place Order → Payment screen → Pay ₹2,796 · UPI → processing → Order Placed confirmation → free-text reflection prompt.

### Act 2 — Understanding Impulse Buying

Three scenes that decode *why* Shanaya's brain agreed to every step:

- **Scene 1 — Mind Trap (drag game):** 12 of Shanaya's thoughts float across the panel as glossy 3D bubbles. The learner drags each thought into one of **4 mind-trap zones**: *FOMO*, *Suggestion-driven*, *Emotional justification*, *Spending more to "save"*. Native HTML5 drag-and-drop on desktop, tap-to-select on mobile.
- **Scene 2 — Definition:** narrator names the pattern — *"Four tricks — discounts, FREE offers, emotion, and 'savings'. There's one name for all of them: IMPULSE BUYING."*
- **Scene 3 — Flash cards:** 3 click-through flip cards explain *FOMO*, *Shopping triggers*, and *Small spends add up*. Each card lands on its front and requires a tap to reveal the back; clicking Next/Back cancels in-flight TTS and starts the next card's narration cleanly.

### Act 3 — Real-life Simulation

A single deep scenario (*The "Better Deal" Confusion*) showing impulse buying outside a shopping app:

- An influencer's unboxing reel (full-bleed YouTube Short with Mixkit/Pexels MP4 fallback chain + a ducked lo-fi audio loop) plays in the right pane while the narrator sets up Shanaya's choice.
- **Pick-3 challenge:** choose the three influences nudging Shanaya — *Brand Name*, *Peer Pressure*, *Social Image*. 20-second timer + retry messaging.
- **Mindful Choice unlock:** insight panel reveals title + body + micro-challenge + real-world connect + identity statement.

### Act 4 — Reflect & Realise

The learner turns the lens on themselves:

- **Impulse Meter:** a 5-zone self-snapshot (`Sparked` → `Heated` → `Aware` → `Guarded` → `Anchored`). Picking a zone speaks an affirmation TTS line; the morphing personality card mirrors the choice.
- **Five Key Takeaways:** sequential reveal cards (`Pause first` → `Count the small spends` → `Spot the trap` → `Wait 24 hours` → `Spend on purpose`). When all five are flipped, the **identity statement card** slides in to close the lesson.
- **Celebration screen** confirms completion and routes back to the home page.

### Voice & music

- **TTS:** every spoken line goes through MS Edge Neural TTS via the backend (`hi-IN-SwaraNeural` for Shanaya, `te-IN-MohanNeural` at SSML pitch `+18 %` and 1.3× playback for the narrator). Real-time amplitude lip-sync on the avatar's mouth. Pause/Resume preserves the exact word position.
- **Music:** Web Audio synth (pad + sub-bass + bell arpeggio + shaker + synth pluck + 808-style sub-kick). 6 moods (calm, app-tempo, reflective, thinking, lofi, silent) auto-mapped from the current emotion. Volume is tuned to sit *under* the narrator across all Acts.
- **Optional ElevenLabs upgrade** for the narrator voice — set `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_NARRATOR` in `backend/.env`; falls back to Edge if absent or rate-limited.

---

## Stack

| Layer    | Tech                                                                            |
|----------|---------------------------------------------------------------------------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Framer Motion, lucide-react, React Router     |
| Backend  | Node.js 20, Express, PostgreSQL (`pg`), `msedge-tts`                            |
| DB host  | [Neon](https://neon.tech) free tier (recommended) — any Postgres works          |
| Deploy   | Vercel (frontend + backend), GitHub auto-deploy on push to `main`               |

The backend ships with a **file-based fallback**: with no `DATABASE_URL`, reflections + progress write to `backend/data/fallback.json`. Drop in a Postgres URL and the same routes use Postgres seamlessly.

---

## Repository layout

```
lean-hyphen-learning/
├── frontend/                       # React + Vite app
│   ├── src/
│   │   ├── pages/                  # HomePage, LessonPage (routes by act)
│   │   ├── components/
│   │   │   ├── acts/
│   │   │   │   ├── Act1/           # Cinematic shopping simulation
│   │   │   │   ├── Act2/           # Drag game + flash cards
│   │   │   │   ├── Act3/           # Influencer reel scenario
│   │   │   │   └── Act4/           # Impulse meter + takeaways
│   │   │   ├── shared/             # ShanayaAvatar, ImpulseMeter, KeyTakeawaysGrid, …
│   │   │   └── phone/              # MockShoppingApp internals
│   │   ├── data/lessons/           # Lesson content, decoupled from components
│   │   ├── hooks/                  # useSequencer, useReducedMotion
│   │   ├── context/LessonContext   # session id, progress (sequential unlock), audio toggle
│   │   └── utils/
│   │       ├── api.js              # fetch wrapper
│   │       └── sounds.js           # Web Audio synth + cloud TTS playback
│   ├── vercel.json                 # Vercel rewrites for SPA
│   └── package.json
└── backend/                        # Express API
    ├── src/
    │   ├── server.js
    │   ├── routes/                 # /api/health, /api/tts, /api/progress, /api/reflections
    │   ├── db/                     # pg pool + migrations
    │   ├── storage/                # file fallback (used when DATABASE_URL absent)
    │   └── middleware/             # error + 404
    ├── data/fallback.json          # file-storage fallback (gitignored)
    └── package.json
```

---

## Local development

### Prerequisites
- Node.js 20+
- (Optional) Postgres connection string — sign up for [Neon](https://console.neon.tech) for a free one in ~1 minute.

### 1. Backend
```bash
cd backend
cp .env.example .env
# edit .env: paste your Neon DATABASE_URL (or leave blank to use file fallback)
npm install
npm run migrate            # only if you set DATABASE_URL
npm start                  # → http://localhost:4000
```

Health check: <http://localhost:4000/api/health>

### 2. Frontend
```bash
cd frontend
npm install
npm run dev                # → http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so no extra config is needed.

Open <http://localhost:5173>, click **Start Act 1**, and walk through Shanaya's story.

---

## Environment variables

### `backend/.env`
| Var                          | Required | Notes |
|------------------------------|----------|-------|
| `PORT`                       | no       | Defaults to `4000`. |
| `DATABASE_URL`               | no       | Leave blank to use file fallback (`backend/data/fallback.json`). |
| `PGSSL`                      | no       | `true` (default) for Neon/managed Postgres; `false` for local Postgres. |
| `CORS_ORIGINS`               | no       | Comma-separated allowed origins. Defaults to allow-all in dev. |
| `ELEVENLABS_API_KEY`         | no       | Set to override MS Edge TTS with ElevenLabs. |
| `ELEVENLABS_VOICE_NARRATOR`  | no       | ElevenLabs Voice ID for the narrator role. |
| `ELEVENLABS_VOICE_SHANAYA`   | no       | ElevenLabs Voice ID for Shanaya (optional). |

### `frontend/.env.local`
| Var                  | Required | Notes |
|----------------------|----------|-------|
| `VITE_API_BASE_URL`  | no       | Leave blank for local (uses Vite proxy). Set to your deployed API URL in production. |

---

## API reference

Base URL (production): `https://backend-ten-delta-54.vercel.app`
Base URL (local): `http://localhost:4000`

All response bodies are JSON. Errors return `{ "error": "<message>" }` with the appropriate HTTP status code.

### `GET /api/health`

Lightweight liveness probe. Returns storage mode + build version.

**Response 200**
```json
{
  "ok": true,
  "storage": "postgres",        // "file" when DATABASE_URL is absent
  "version": "0.1.0",
  "time": "2026-05-27T08:15:30.123Z"
}
```

**Example**
```bash
curl https://backend-ten-delta-54.vercel.app/api/health
```

---

### `GET /api/tts`

Synthesises an Indian-English MP3 of the supplied text using MS Edge Neural TTS. Optionally overrides with ElevenLabs if `ELEVENLABS_API_KEY` is configured. Falls back to Google Translate TTS if both fail.

**Query params**
| Param   | Type   | Required | Notes |
|---------|--------|----------|-------|
| `text`  | string | yes      | The phrase to synthesise. Capped at 400 chars per call. |
| `voice` | string | no       | `shanaya` (default) → `hi-IN-SwaraNeural`. `narrator` → `te-IN-MohanNeural` + pitch `+18 %`. |
| `v`     | string | no       | Optional cache-bust token. Bump on the frontend when you change voices on the backend so cached MP3s refetch. |

**Response 200** — `Content-Type: audio/mpeg`
Raw MP3 audio stream. Cached for 24 h on the client (`Cache-Control: public, max-age=86400, immutable`).

**Errors**
- `400` — `text` query param missing.
- `500` — all three engines (ElevenLabs / Edge / Google) failed.

**Example**
```bash
curl -o hello.mp3 \
  "https://backend-ten-delta-54.vercel.app/api/tts?voice=shanaya&text=Hello%20world"
```

The frontend chunks long text into ~180-char sentences before calling, so each request stays under the upstream limit.

---

### `POST /api/progress`

Upserts the learner's act-completion status. Used by the homepage's sequential-unlock logic.

**Body**
```json
{
  "sessionId": "lh-abc123",          // generated client-side, persisted in localStorage
  "lessonId":  "think-before-you-spend",
  "actId":     "act1",
  "status":    "completed",          // "started" | "completed" | "skipped"
  "payload":   { "items": 5, "spent": 2796 }    // optional, JSON-serialisable
}
```

**Response 200**
```json
{
  "saved": {
    "session_id": "lh-abc123",
    "lesson_id":  "think-before-you-spend",
    "act_id":     "act1",
    "status":     "completed",
    "updated_at": "2026-05-27T08:15:30.123Z"
  },
  "storage": "postgres"              // or "file"
}
```

**Errors**
- `400` — `sessionId`, `lessonId`, `actId`, or `status` missing; `status` not in the allowed set.

**Example**
```bash
curl -X POST https://backend-ten-delta-54.vercel.app/api/progress \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId":"lh-abc123",
    "lessonId":"think-before-you-spend",
    "actId":"act1",
    "status":"completed"
  }'
```

Progress records are unique per `(sessionId, lessonId, actId)`; re-posting updates the existing row.

---

### `POST /api/reflections`

Saves Act 1's open-ended free-text reflection. (Other acts use structured activity data; reflections are reserved for free-form prose.)

**Body**
```json
{
  "sessionId": "lh-abc123",
  "lessonId":  "think-before-you-spend",
  "actId":     "act1",
  "prompt":    "What surprised you about Shanaya's cart?",   // optional
  "response":  "I didn't realise how quickly small adds stacked up."
}
```

**Response 201**
```json
{
  "saved": {
    "id": 42,
    "created_at": "2026-05-27T08:15:30.123Z"
  },
  "storage": "postgres"
}
```

**Errors**
- `400` — `sessionId`, `lessonId`, `actId`, or `response` missing.

**Example**
```bash
curl -X POST https://backend-ten-delta-54.vercel.app/api/reflections \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId":"lh-abc123",
    "lessonId":"think-before-you-spend",
    "actId":"act1",
    "prompt":"What surprised you?",
    "response":"How fast the cart grew."
  }'
```

Reflections are append-only — every submission is a new row, so a learner can re-attempt Act 1 and produce multiple records.

---

## Voice setup (free MS Edge → optional ElevenLabs upgrade)

The lesson uses two voices:

- **Shanaya** — `hi-IN-SwaraNeural` (Hindi-locale female, Indian-English accent, youthful range).
- **Narrator** — `te-IN-MohanNeural` at SSML pitch `+18 %` (Telugu-locale male, more measured cadence than Prabhat / Madhur / Salman; pitch shift reads younger).

That's free, no signup needed, and ships with the repo. If you want a genuinely human-sounding narrator, switch to **ElevenLabs**:

1. Sign up at <https://elevenlabs.io/sign-up>. Free tier covers 10,000 chars/month.
2. Profile → **API Keys** → copy your `xi-...` key.
3. **[Voice Library](https://elevenlabs.io/app/voice-library)** → filter `Language: English (Indian)` + `Gender: Male` → preview → "Add to My Voices".
4. **My Voices** → click the voice → copy its **Voice ID**.
5. Add to `backend/.env`:
   ```env
   ELEVENLABS_API_KEY=xi-your-key-here
   ELEVENLABS_VOICE_NARRATOR=paste-voice-id-here
   ```
6. Restart the backend.

The wiring lives in [`backend/src/routes/tts.js`](backend/src/routes/tts.js) (`synthEleven` function). If ElevenLabs ever errors, the request **silently falls back to Edge** — the lesson never breaks.

To override Shanaya's voice too, set `ELEVENLABS_VOICE_SHANAYA` the same way. Leave it blank to keep her on Edge.

### Production (Vercel) ElevenLabs setup

In the Vercel dashboard for the **backend** project:

1. Settings → **Environment Variables**.
2. Add `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_NARRATOR`, and (optional) `ELEVENLABS_VOICE_SHANAYA` for the **Production** environment.
3. Redeploy the backend.

---

## Database setup (Neon, recommended)

1. <https://console.neon.tech> → **Create project** → region: `Singapore` (closest to India).
2. Copy the **Connection string** (the one starting with `postgres://…`).
3. Paste it into `backend/.env` as `DATABASE_URL=…`.
4. Apply schema:
   ```bash
   cd backend && npm run migrate
   ```
5. Restart the backend. Health check will report `"storage":"postgres"`.

The schema lives in [`backend/src/db/migrations/001_init.sql`](backend/src/db/migrations/001_init.sql). Add new numbered migrations alongside it.

---

## Deployment

### Frontend → Vercel
1. Push the repo to GitHub.
2. <https://vercel.com> → **Add New Project** → import the repo.
3. **Root Directory:** `frontend`.
4. Framework auto-detects as **Vite**.
5. Environment variables: set `VITE_API_BASE_URL` to your deployed API URL.
6. Deploy. `frontend/vercel.json` already handles SPA rewrites.

### Backend → Vercel (or Railway / Render / Fly.io)
- **Vercel:** add a new project pointed at `backend/`. Detected as a Node app. Add the env vars from `.env.example`.
- **Render / Railway / Fly.io:** create a service from `backend/`; build `npm install`, start `npm start`. Add env vars.

After deploying, update the frontend's `VITE_API_BASE_URL` and redeploy.

---

## What's next

- **Auth:** OTP-based login + grade-level routing (replaces anonymous `localStorage` sessions).
- **Gamification engine:** XP, streaks, badges, daily goals.
- **Module 2:** the next behaviour-first lesson set after *Smart Spending & Money Choices*.
- **Analytics:** per-act drop-off + reflection-response sentiment tagging.
