# Lean Hyphen — Gamified Learning Platform

> Behaviour-first learning. Module 1: **Smart Spending & Money Choices** → Lesson: **Think Before You Spend**.

**Live**
- App: <https://frontend-one-kappa-15.vercel.app>
- API: <https://backend-ten-delta-54.vercel.app/api/health>

Every push to `main` auto-deploys both projects on Vercel.

This repo holds the interactive lesson app (React + Tailwind) and the API (Node.js/Express + PostgreSQL). It is designed to be embedded inside the third-party LMS that the [Lean Hyphen landing page](https://lean-hyphen-user-web-4zrf.vercel.app/#home) sends users to.

The current build ships **Act 1 — Story Hook & Setup** and **Act 2 — Understanding Impulse Buying**. Acts 3/4 are scaffolded as placeholders so they can be implemented later without touching the live acts.

---

## What's in Act 1 today

Act 1 is a full cinematic + interactive simulation, ~50 phases long. Highlights:

- **Cinematic opening (Scenes 1–7):** DiceBear avataaars character (Shanaya) in a flat-illustrated bedroom, narrating context. Bedroom SVG vignettes (Meet Shanaya, Birthday, Group Chat, Vision, App Open) with depth, shimmer, fairy lights, and a small iPhone overlaid on the avatar with a real Apple logo.
- **Mock Spree shopping app (Scene 8+):** iOS-style home grid → tap the Spree icon → app-launch zoom → typed search → results grid → PDP. Trending category strip (with a 🔥 Trending tile), hero banner, product cards with real Unsplash imagery (sneakers, hoodie, selfie light, smartwatch, iPhone 17 orange, etc.) + inline SVG socks. Wishlist hearts + free-delivery banner that auto-computes **tomorrow's date**.
- **Three nudge waves with interactive Add-to-Cart:**
  - *Complete the Look* — Branded Socks suggestion (Pair your shoes with these matching socks)
  - *Trending → Flash Deal* — Birthday Hoodie with a live 5-minute countdown + ₹999→₹799 strikethrough
  - *NEW OFFER UNLOCKED · Add 1 more & get Phone Case FREE 🎀* — Selfie Glow Clip Light bundle from the Electronics shelf
- **Two ways to tap Add-to-Cart:** the actual coral button inside the phone PDP **and** a yellow "👉 Tap here" pill below the phone — both fire the same handler. Saffron ring + pulsing glow direct the eye. Replay + Back re-arm interactive prompts so the learner can walk through again.
- **Final cart reveal + checkout flow:** items list with FREE pill on the phone case → total ₹2,796 → "Wait… I only came here to buy shoes" thought → Place Order → Payment screen → Pay ₹2,796 · UPI → processing → Order Placed confirmation → free-text reflection prompt.
- **Voice:** every spoken line goes through MS Edge Neural TTS via the backend (`hi-IN-SwaraNeural` for Shanaya, `en-IN-PrabhatNeural` at 1.3× playback for the narrator). Real-time amplitude lip-sync on the avatar's mouth. Pause/Resume preserves the exact word position.
- **Background music:** Web Audio synth (pad + sub-bass + bell arpeggio + shaker + synth pluck + 808-style sub-kick). 5 moods (calm, app-tempo, reflective, thinking, silent) auto-mapped from the current emotion. vi-IV-I-V chord progression for an emotional coming-of-age feel; the shopping mood gets a GenZ "TikTok shopping reel" energy.

---

## What's in Act 2 today

Act 2 takes the cart Shanaya built in Act 1 and explains *why* her brain agreed to every step. Three scenes, ~8 phases:

- **Scene 1 — Mind Trap (drag game):** 12 of Shanaya's thoughts float across the panel as glossy 3D bubbles in a hand-scattered "flying-across-the-sky" layout. The learner drags each thought into one of **4 mind-trap zones**: *FOMO*, *Suggestion-driven*, *Emotional justification*, *Spending more to "save"*. Native HTML-5 drag-and-drop on desktop, tap-to-select on mobile. Progress bar fills 0/12 → 12/12. Subtle pastel **3D-marble bubble backdrop** drifts behind the chips on the right; the same effect lives behind Shanaya on the left for visual continuity. A discreet `skip` link tucks into the bottom-right for learners who want to bypass the game.
- **Scene 2 — Definition:** narrator names the pattern — *"Buying something you didn't plan to buy — because it feels right in the moment. This is called IMPULSE BUYING."* Shanaya reacts with *"Oh… so that's what it's called."*
- **Scene 3 — Flash cards:** 3 click-through flip cards explain *FOMO*, *Shopping triggers*, and *Small spends add up*. Each card has a glossy front (emoji + title + subtitle + "Tap card to reveal") and a back (live countdown / labelled trigger tiles / receipt-style ₹ stacking). Clicking Next/Back cancels the in-flight TTS, auto-flips the next card, and starts its narration — no chunk bleed, no double-voice.
- **Lo-fi soundtrack:** Act 2 swaps to a dedicated `lofi` mood — Cmaj9 → Am9 → Fmaj9 → G13 jazz progression, Rhodes-style detuned pad, half-time brushed hat, syncopated plucks, sub-octave bass, and a continuous vinyl-crackle layer for the bedroom-pop texture.
- **Robust Back navigation:** stepping back across phases cancels speech, clears dedup state, and *re-arms the activity* (the drag game or flash cards) so re-entering a hold phase plays it again instead of getting stuck on a "complete" placeholder.
- **40/60 responsive grid:** avatar + narration on the left, activity panel on the right; stacks on phones, side-by-side from `md:` upward, with typography and min-heights scaling at every breakpoint.

---

## Stack

| Layer    | Tech                                          |
|----------|-----------------------------------------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Framer Motion, lucide-react, React Router |
| Backend  | Node.js 20, Express, PostgreSQL (`pg`)         |
| DB host  | [Neon](https://neon.tech) free tier (recommended) — any Postgres works |
| Deploy   | Vercel (frontend) · Vercel or Render/Railway/Fly (backend) |

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
│   │   │   │   ├── Act1/           ← THIS IS WHAT'S BUILT
│   │   │   │   ├── Act2/  Act3/  Act4/   ← coming-soon placeholders
│   │   │   │   └── ComingSoonAct.jsx
│   │   │   ├── shared/             # PhoneFrame, SpeechBubble, ReflectionPrompt, …
│   │   │   └── phone/              # MockShoppingApp internals
│   │   ├── data/lessons/           # Lesson content, decoupled from components
│   │   ├── hooks/                  # useSequencer, useReducedMotion
│   │   ├── context/LessonContext   # session id, progress, audio toggle
│   │   └── utils/api.js            # fetch wrapper
│   ├── vercel.json                 # Vercel rewrites for SPA
│   └── package.json
└── backend/                        # Express API
    ├── src/
    │   ├── server.js
    │   ├── routes/                 # /api/reflections, /api/progress
    │   ├── db/                     # pg pool + migrations
    │   ├── storage/                # file fallback (used when DATABASE_URL absent)
    │   └── middleware/             # error + 404
    └── package.json
```

**Extending to Act 2/3/4:** add the real component under `frontend/src/components/acts/Act{N}/`. The lesson page already routes to it. Don't refactor Act 1 in the process — extend shared primitives instead.

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
| `ELEVENLABS_API_KEY`         | no       | Set to override MS Edge TTS with ElevenLabs. See section below. |
| `ELEVENLABS_VOICE_NARRATOR`  | no       | ElevenLabs Voice ID for the narrator role. |
| `ELEVENLABS_VOICE_SHANAYA`   | no       | ElevenLabs Voice ID for Shanaya (optional). |

### `frontend/.env.local`
| Var                  | Required | Notes |
|----------------------|----------|-------|
| `VITE_API_BASE_URL`  | no       | Leave blank for local (uses Vite proxy). Set to your deployed API URL in production. |

---

## Voice setup (free MS Edge → optional ElevenLabs upgrade)

The lesson uses two voices:

- **Shanaya** — `hi-IN-SwaraNeural` (Hindi-locale female, Indian-English accent, youthful range).
- **Narrator** — `en-IN-PrabhatNeural` at SSML pitch `+15 %` (the only en-IN male MS Edge serves, formant-shifted to read younger).

That's free, no signup needed, and ships with the repo. If the narrator still sounds too synthetic for you, there's a one-env-var upgrade path to **ElevenLabs** for a genuinely human-sounding voice.

### Switching to ElevenLabs (5 min, free tier)

1. Sign up at <https://elevenlabs.io/sign-up>. The free tier covers 10,000 chars/month — plenty for testing the full lesson.
2. Profile menu → **API Keys** → copy your `xi-...` key.
3. Open the **[Voice Library](https://elevenlabs.io/app/voice-library)** → filter `Language: English (Indian)` + `Gender: Male` → preview voices → click "Add to My Voices" on one that fits.
4. **My Voices** → click the voice → copy its **Voice ID** (looks like `21m00Tcm4TlvDq8ikWAM`).
5. Add to `backend/.env`:
   ```env
   ELEVENLABS_API_KEY=xi-your-key-here
   ELEVENLABS_VOICE_NARRATOR=paste-voice-id-here
   ```
6. Restart the backend (`npm start` inside `backend/`).

Done — every narrator line now comes from ElevenLabs instead of Edge. The wiring lives in [`backend/src/routes/tts.js`](backend/src/routes/tts.js) (`synthEleven` function); if ElevenLabs ever errors, the request **silently falls back to Edge** so the lesson never breaks.

To override Shanaya's voice too, set `ELEVENLABS_VOICE_SHANAYA` the same way. Leave it blank to keep her on Edge.

### Production (Vercel) ElevenLabs setup

In the Vercel dashboard for the **backend** project:

1. Settings → **Environment Variables**.
2. Add `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_NARRATOR`, and (optional) `ELEVENLABS_VOICE_SHANAYA` for the **Production** environment.
3. Redeploy the backend (any push to `main`, or "Redeploy" from the Deployments tab).

The same fallback applies — if the keys aren't set in production, the deployed backend uses MS Edge TTS just like it does today.

---

## Database setup (Neon, recommended)

1. Go to <https://console.neon.tech> → **Create project** → region: `Singapore` (closest to India).
2. Copy the **Connection string** (the one starting with `postgres://…`).
3. Paste it into `backend/.env` as `DATABASE_URL=…`.
4. Apply schema:
   ```bash
   cd backend && npm run migrate
   ```
5. Restart the backend. Health check will now report `"storage":"postgres"`.

The schema lives in [`backend/src/db/migrations/001_init.sql`](backend/src/db/migrations/001_init.sql). Add new numbered migrations alongside it.

---

## Pushing to GitHub

```bash
cd lean-hyphen-learning
git init
git add .
git commit -m "feat: Act 1 — Story Hook & Setup (frontend + backend skeleton)"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

> Don't commit `.env`. The `.gitignore` already covers that.

---

## Deployment

### Frontend → Vercel
1. Push the repo to GitHub.
2. Go to <https://vercel.com> → **Add New Project** → import the repo.
3. **Root Directory**: `frontend`.
4. Framework auto-detects as **Vite**.
5. Environment variables: set `VITE_API_BASE_URL` to your deployed API URL (e.g. `https://api.lean-hyphen.app`).
6. Deploy. The `frontend/vercel.json` already handles SPA rewrites.

### Backend → Vercel (or Railway / Render)
The Express app is plain Node — drop it anywhere that runs Node 20.

- **Vercel:** add a new project pointed at `backend/`. Vercel will detect it as a Node app; you may want to expose it under a subdomain like `api.yourdomain.com`. Add the same env vars from `.env.example`.
- **Render / Railway / Fly.io:** create a service from the `backend/` directory; build command `npm install`, start command `npm start`. Add env vars.

After deploying, update the frontend's `VITE_API_BASE_URL` and redeploy.

---

## API reference (current)

| Method | Path                  | Body                                                                 | Notes |
|--------|-----------------------|----------------------------------------------------------------------|-------|
| GET    | `/api/health`         | —                                                                    | Reports storage mode (`postgres` / `file`). |
| POST   | `/api/reflections`    | `{ sessionId, lessonId, actId, prompt, response }`                   | Saves Act 1's open-ended reflection. |
| POST   | `/api/progress`       | `{ sessionId, lessonId, actId, status, payload? }`                   | `status ∈ {started, completed, skipped}`. Upserts. |

`sessionId` is generated client-side and persisted in `localStorage`. The schema is anonymous-friendly; identity will plug in when auth lands.

---

## What's next

- **Act 3:** four scenario simulations + a final micro-challenge.
- **Act 4:** Impulse Meter + identity-closing statement.
- **Gamification engine:** XP, streaks, badges, daily goals.
- **Auth:** OTP-based login + grade-level routing.

Each Act lives under `frontend/src/components/acts/Act{N}/`. Build one Act at a time without touching the others.
