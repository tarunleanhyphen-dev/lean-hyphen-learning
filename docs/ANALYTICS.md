# Analytics, Scoring, Gamification & LMS Reporting — Architecture

> Status: **foundation in place, one Act wired**. Everything in this doc works locally today; the remaining Acts only need to add `useAnalytics` + a handful of `activityCompleted` calls.

The platform's analytics layer is designed so it can scale from a single lesson to dozens of lessons across multiple modules, and so an external LMS can read a stable JSON shape from our API without us re-shipping a schema every quarter.

---

## 1. Goal & shape

For every learner interaction we want to:

1. Record the raw event (immutable, durable, replay-able).
2. Project that event onto rolled-up aggregates (`user_*_sessions`).
3. Recompute scores, badges, and report shapes on the fly so reads are O(1).
4. Expose the result through a small set of REST endpoints that an LMS can consume.

```
 Browser ──► /api/analytics/events ──► raw events table
                                       │
                                       ▼
                            projection (sync, in-process)
                                       │
              ┌────────────────────────┼─────────────────────────┐
              ▼                        ▼                         ▼
       lesson sessions          act/scene/activity         scores + badges
              │                       sessions                   │
              └───────────────────────┬─────────────────────────┘
                                       ▼
                       /api/analytics/lesson/:id      ◄── learner dashboard
                       /api/analytics/act/:id         ◄── post-act card
                       /api/analytics/attempts/:id    ◄── attempt history
                       /api/analytics/lms-export/:id  ◄── external LMS
```

---

## 2. Data model

Nine tables, all created by migration `004_analytics.sql`.

| Table                       | One row per                       | Notes |
|-----------------------------|-----------------------------------|-------|
| `analytics_events`          | (sessionId, clientEventId)        | Append-only ledger. Source of truth. |
| `user_lesson_sessions`      | (sessionId, lessonId, attempt)    | One row per *attempt*, so re-takes don't overwrite the previous score. |
| `user_act_sessions`         | (lessonSession, actId)            | Per-act roll-up. Points, accuracy, completion. |
| `user_scene_sessions`       | (actSession, sceneId)             | Per-scene dwell time, interactions, completion. |
| `user_activity_attempts`    | each attempt of an activity       | Drives "average attempts", "retry rate", "accuracy". |
| `user_scores`               | (lessonSession)                   | Materialised score for fast LMS reads. |
| `user_badges`               | (lessonSession, badgeId)          | One row per badge earned. |
| `user_attempt_history`      | (sessionId, lessonId)             | Best/latest/avg roll-up across attempts. |
| `user_learning_progress`    | (sessionId)                       | Cross-lesson cumulative metrics. |

**Idempotency.** Every event row carries a client-generated UUID (`client_event_id`) with a `UNIQUE` constraint. The frontend keeps the queue in `localStorage`, so a network hiccup that retries the same batch can't double-count.

**Anonymous-first.** Everything keys on `sessionId` (a UUID persisted in `localStorage`). When OTP auth lands we add `user_id` and a single migration that binds prior `session_id` values to the now-known user.

**Event-sourced.** Aggregate rows are *derived* — if we change the scoring config or fix a projection bug, we can re-derive every row from `analytics_events` history. Backups don't need to dump every aggregate table.

---

## 3. Event taxonomy

Source of truth: [`backend/src/analytics/events.js`](../backend/src/analytics/events.js).

```
Lifecycle:    lesson_started, lesson_completed, lesson_abandoned,
              act_started, act_completed,
              scene_entered, scene_completed, scene_skipped
Activities:   activity_started, activity_completed, activity_retried,
              activity_failed, activity_passed
Interactions: drag_drop_completed, mcq_answered, option_selected,
              hint_opened, reflection_submitted, scenario_decision
Controls:     pause_clicked, resume_clicked, exit_clicked, replay_clicked
```

Every event accepts the same envelope:

```json
{
  "clientEventId": "uuid",
  "kind":          "scene_entered",
  "sessionId":     "lh-abc123",
  "lessonId":      "think-before-you-spend",
  "actId":         "act1",
  "sceneId":       "scene-0",
  "activityId":    null,
  "attemptNo":     1,
  "clientTs":      "2026-05-27T12:34:56.789Z",
  "payload":       { "timeMs": 4500 }
}
```

`payload` is a free-form JSONB blob — adding a new field never requires a schema change. Frequently-queried fields (act/scene/activity) are promoted to columns for index-friendly reads.

---

## 4. Scoring framework

Source of truth: [`backend/src/analytics/scoring.js`](../backend/src/analytics/scoring.js).

```
totalScore (0–100) = Σ actScores
actScores          = config.acts[actId].max * (points earned / points possible)
learningScore      = 60% accuracy + 25% scenario quality + 15% completion
engagementScore    = 60% completion + 25% interaction density + 15% participation
```

`SCORING_CONFIG` is a single JS object. Each Act lists a `max` (default 25), a `scenes` map (scene id → points), and an `activities` map (activity id → points). Per-activity rules (`ACTIVITY_POINT_RULES`) convert raw attempt detail into points — full marks if all 12 mind-trap chips land correctly, proportional credit otherwise, a 10% retry penalty floored at 30% of max, etc.

**CMS-ready.** The config lives in code today because there's only one lesson; the only change to move it behind a CMS is reading it from a table at request time and caching by `configVersion`.

---

## 5. Badges

Source of truth: [`backend/src/analytics/badges.js`](../backend/src/analytics/badges.js).

Two flavours:

* **Score-band badges** — exactly one per session. Picks the highest band the learner cleared (`Master Strategist` ≥ 100 → `Emerging Learner` ≥ 60 → `Needs Improvement`).
* **Behavioural badges** — multiple allowed. Earned for: perfect-act, no-skip, fast-finish (<10 min), persistence (retry improvement), critical-thinker (≥90% accuracy), decision-master (Act 3 pick-3 perfect on first try), scenario-specialist (perfect Act 2 + Act 3).

Each badge's `when` is a pure predicate over `{ session, acts, attempts }`, so adding a new badge is one push:

```js
{ id: 'speed-runner', title: 'Speed Runner', when: ({ session }) =>
    session.completed_at && session.total_time_ms < 5 * 60 * 1000 }
```

---

## 6. API reference

Base URL: `https://backend-ten-delta-54.vercel.app` (prod) · `http://localhost:4000` (dev).

### `POST /api/analytics/events`

Batch ingest. Body shape:

```json
{
  "events": [ /* up to 200 envelopes (see §3) */ ]
}
```

**Response 200**

```json
{ "accepted": 7, "rejected": [], "storage": "file" }
```

Validation failures are reported in `rejected[]`; the rest of the batch still lands. This is intentional — a single malformed event can't break a session.

### `GET /api/analytics/lesson/:lessonId?sessionId=…&attempt=…`

Returns the end-of-lesson dashboard payload:

```json
{
  "report": {
    "sessionId": "...",
    "lessonId":  "...",
    "attemptNo": 1,
    "totalScore": 86,
    "learningScore": 78,
    "engagementScore": 92,
    "completionPct": 100,
    "totalTimeMs": 712000,
    "acts": [
      { "actId": "act1", "title": "Act 1 — Temptation",
        "score": 22, "pointsEarned": 22, "pointsMax": 25,
        "accuracyPct": 88, "completionPct": 100, "timeMs": 230000 },
      ...
    ],
    "badges": [
      { "badgeId": "advanced-explorer", "detail": { "scoreBand": 80, ... } },
      { "badgeId": "perfect-act", "detail": { "actId": "act2" } }
    ],
    "insights": [
      { "kind": "strongest-act", "message": "Your strongest performance was in Act 2 with 96% accuracy." }
    ],
    "improvement": { "previousScore": 72, "currentScore": 86, "deltaScore": 14 }
  }
}
```

### `GET /api/analytics/act/:lessonId/:actId?sessionId=…`

The per-act post-completion card. Includes the breakdown of scenes + attempts inside the act, plus `improvementVsPrevAttempt` if a prior attempt exists.

### `GET /api/analytics/attempts/:lessonId?sessionId=…`

The attempt-history roll-up: best score, latest score, average, total attempts, total time across all of them. This is what the LMS uses for the "learner growth" timeline.

### `GET /api/analytics/lms-export/:lessonId?sessionId=…`

The **stable** payload — `schemaVersion: '1.0'`. We promise not to break the top-level shape; experimental additions live under `_extras`.

```json
{
  "schemaVersion": "1.0",
  "learner":  { "sessionId": "lh-..." },
  "lesson":   { "lessonId": "...", "attemptNo": 1, "completed": true,
                "startedAt": "...", "completedAt": "..." },
  "score":    { "total": 86, "learning": 78, "engagement": 92,
                "completionPct": 100, "timeMs": 712000 },
  "badges":   [ ... ],
  "acts":     [ ... ],
  "improvement": null,
  "_extras":  { "insights": [...] }
}
```

---

## 7. Frontend client

Source of truth: [`frontend/src/utils/analytics.js`](../frontend/src/utils/analytics.js).

```js
import { useAnalytics } from '../../hooks/useAnalytics.js';

const a = useAnalytics({ sessionId, lessonId, actId: 'act1' });

useEffect(() => { a.actStarted(); }, []);
a.sceneEntered('scene-0');
a.activityCompleted('add-shoes', { sceneId: 'scene-1',
  payload: { kind: 'add-to-cart', detail: { productId: 'shoes' } } });
a.actCompleted({ timeMs: elapsed });
```

Under the hood:

* Each `track()` call generates a UUID and appends to an in-memory queue.
* The queue mirrors to `localStorage` so a crash mid-act doesn't lose data.
* Flushes on: 2s debounce after the last enqueue, batch size ≥ 40, `pagehide`/`beforeunload` (`sendBeacon`), or explicit `analytics.flush()`.
* Network failures push the batch back onto the queue head; the next flush retries.

The post-Act and post-lesson dashboards `await a.flush()` before fetching the report so the numbers always reflect the just-finished session.

---

## 8. LMS integration

External LMS calls only the two stable endpoints:

* `GET /api/analytics/lms-export/:lessonId?sessionId=…` — current attempt's full report.
* `GET /api/analytics/attempts/:lessonId?sessionId=…` — multi-attempt history.

Auth on these endpoints is **planned**: a per-LMS API key in a header, scoped to that LMS's tenant. Until the API gateway lands the endpoints are `sessionId`-keyed and rate-limited at the platform level.

---

## 9. What's wired today vs. left to do

| Area                         | Status |
|------------------------------|--------|
| Schema (migration 004)       | ✅ done |
| Event taxonomy + validators  | ✅ done |
| Scoring engine + config      | ✅ done |
| Badge engine + rules         | ✅ done |
| Reports + LMS export builder | ✅ done |
| Route: `/api/analytics/*`    | ✅ done |
| File-storage fallback        | ✅ done (works without Postgres) |
| Frontend client + hook       | ✅ done |
| **Act 1 wired**              | ✅ done — `act_started`, scene enter/complete, add-to-cart |
| Act 2 wired                  | ⬜ next — drag game `correct/total`, flashcards `seen/total` |
| Act 3 wired                  | ⬜ next — pick-3 `correct/total/attempts` |
| Act 4 wired                  | ⬜ next — meter zone, takeaways revealed count |
| Post-act / post-lesson UI    | ⬜ next — call `flush()` then GET the report and render |
| Postgres backend (vs file)   | ⬜ once migration applied via `npm run migrate` |
| Auth-scoped LMS API key      | ⬜ pre-launch hardening |

Order to bolt on next: wire Acts 2–4 (small additive change per Act), build the `LessonReport.jsx` component, then flip `usingPg()` to `hasDb()` in the route.

---

## 10. Trying it locally

1. Backend already serves the new routes — restart with `npm start` in `backend/` if you haven't already.
2. Open the app, finish Act 1.
3. The analytics file lands at `backend/data/analytics.json`. Watch it grow as you play:
   ```bash
   tail -F backend/data/analytics.json | jq '.user_lesson_sessions, .analytics_events | length'
   ```
4. Hit the report endpoint:
   ```bash
   SID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('backend/data/analytics.json')).user_lesson_sessions[0].session_id)")
   curl "http://localhost:4000/api/analytics/lesson/think-before-you-spend?sessionId=$SID" | jq
   ```
5. Stable LMS shape:
   ```bash
   curl "http://localhost:4000/api/analytics/lms-export/think-before-you-spend?sessionId=$SID" | jq
   ```

Nothing is deployed. Push when ready.
