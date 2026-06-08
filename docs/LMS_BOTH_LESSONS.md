# LMS Integration — Both Lessons (quick API reference)

Pull-based, keyed by a stable **`learnerId`** passed at iframe launch. No auth,
CORS-open (`Access-Control-Allow-Origin: *`). (Lesson-1 deep doc:
[REPORT_AND_ANALYTICS.md](./REPORT_AND_ANALYTICS.md) / [LMS_INTEGRATION.md](./LMS_INTEGRATION.md).)

## Lessons

| Lesson | `lessonId` | Acts | Embed URL |
|---|---|---|---|
| Think Before You Spend | `think-before-you-spend` | 4 (act1–act4) | `https://think-before-you-spend.vercel.app/lesson1` |
| Where Does My Money Go? | `where-does-my-money-go` | 3 (act1–act3) | `https://where-does-my-money-go.vercel.app/lesson2` |

**API base:** `https://backend-ten-delta-54.vercel.app`

## Launch

```
<embed-url>?learnerId=lms-<tenant>-<studentId>
```
Stable per student across attempts/devices. It becomes the `sessionId` on every read below. A replay = a new `attemptNo` (report shows the latest; `/sessions` lists all).

## Read endpoints (`GET`, `?sessionId=<learnerId>`)

| Endpoint | Use |
|---|---|
| `/api/analytics/lms-export/:lessonId?sessionId=` | **Stable dashboard payload** (schema 1.0): score, badges, per-act, completion, time |
| `/api/analytics/lesson/:lessonId?sessionId=[&attempt=N]` | Full report (latest or attempt N) |
| `/api/analytics/act/:lessonId/:actId?sessionId=` | One act drill-down |
| `/api/analytics/sessions/:lessonId?sessionId=` | All attempts (history/leaderboard) |
| `/api/analytics/attempts/:lessonId?sessionId=` | Best/latest/avg roll-up |

`:lessonId` ∈ { `think-before-you-spend`, `where-does-my-money-go` }.
The app posts events automatically to `POST /api/analytics/events` — the LMS only reads.

## Incremental + first-time behaviour

- Report returns **one row per act of that lesson** (4 for Lesson 1, 3 for Lesson 2), each with `started` / `completed` flags + marks. Finish act1+act2 → those fill; later acts stay `0` until played. Marks reflect the **latest** play of each act.
- **First-time student (no acts yet):** every read returns `{ "report": null }` at HTTP 200 — the report page shows a friendly "No report yet" state (no error).

## Durability note

Analytics currently uses a per-serverless-instance `/tmp` store — reliable for a single student viewing their report soon after playing, but for LMS scale it should be moved to Postgres (Supabase configured; migration `004_analytics.sql` ready) so reads are durable across instances. Flagged for the next iteration.
