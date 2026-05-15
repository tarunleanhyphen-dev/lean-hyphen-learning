# Lean Hyphen — Gamified Learning Platform

> Behaviour-first learning. Module 1: **Smart Spending & Money Choices** → Lesson: **Think Before You Spend**.

This repo holds the interactive lesson app (React + Tailwind) and the API (Node.js/Express + PostgreSQL). It is designed to be embedded inside the third-party LMS that the [Lean Hyphen landing page](https://lean-hyphen-user-web-4zrf.vercel.app/#home) sends users to.

The current build ships **Act 1 — Story Hook & Setup**. Acts 2/3/4 are scaffolded as placeholders so they can be implemented later without touching Act 1.

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
| Var             | Required | Notes |
|-----------------|----------|-------|
| `PORT`          | no       | Defaults to `4000`. |
| `DATABASE_URL`  | no       | Leave blank to use file fallback (`backend/data/fallback.json`). |
| `PGSSL`         | no       | `true` (default) for Neon/managed Postgres; `false` for local Postgres. |
| `CORS_ORIGINS`  | no       | Comma-separated allowed origins. Defaults to allow-all in dev. |

### `frontend/.env.local`
| Var                  | Required | Notes |
|----------------------|----------|-------|
| `VITE_API_BASE_URL`  | no       | Leave blank for local (uses Vite proxy). Set to your deployed API URL in production. |

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

- **Act 2:** interactive cards revealing why each item entered the cart → introduces the **Pause & Think** framework.
- **Act 3:** four scenario simulations + a final micro-challenge.
- **Act 4:** Impulse Meter + identity-closing statement.
- **Gamification engine:** XP, streaks, badges, daily goals.
- **Auth:** OTP-based login + grade-level routing.

Each Act lives under `frontend/src/components/acts/Act{N}/`. Build one Act at a time without touching the others.
