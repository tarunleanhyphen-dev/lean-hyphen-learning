# LMS Integration Guide

> **Audience:** LMS engineering team.
> **Goal:** show each student their own learning progress + give parents a per-lesson performance report.
> **Owner on our side:** Lean Hyphen platform team (info@leanhyphen.com).

---

## 1. The picture

```
                ┌───────────────────────────────────────────────────────┐
                │                Your LMS                               │
                │                                                       │
   Student ─►   │  1. Click "Start Lesson"                              │
   (logged in)  │     ───►  iframe https://lean-hyphen…?learnerId=X     │  ──► launches our app
                │                                                       │
                │  3. Live progress widget                              │
                │     ◄───  GET /api/analytics/lesson/:id?sessionId=X   │  ◄── polled live
                │                                                       │
                │  4. After lesson_completed                            │
                │     ◄───  GET /api/analytics/lms-export/:id?session…  │  ◄── parent report JSON
                │                                                       │
                │  5. Show JSON in parent dashboard / email it          │
                └───────────────────────────────────────────────────────┘
```

The whole API is **pull-based**: you call us, we return JSON. No webhooks required (one is offered as a v1.1 add-on).

Every read endpoint is **idempotent and always returns the current state** — our backend recomputes the score, badges, and report shape on every analytics event we receive, so a poll a millisecond after the student answered a question already shows the new number.

---

## 2. The multi-student model

Each student in your LMS has a stable user id (`canvas_user_id`, `lms_user_id`, whatever you call it). When you launch our lesson, pass that id as **`learnerId`** in the iframe URL:

```
https://frontend-think-before-you-spend.vercel.app/?learnerId=lms-<tenant>-<your-student-id>
```

We use that string as the canonical session id for everything. From that moment on:

* All learner events (`scene_entered`, `activity_completed`, …) are stamped with the same `learnerId`.
* Every per-student API read takes that same `learnerId` as `sessionId`.
* Re-attempts by the same student append to that learner's history — we never overwrite.

**Naming convention** (recommended, not enforced today):

```
lms-<tenant>-<your-student-id>
```

e.g. `lms-canvas-stu-42`, `lms-moodle-7b3c…`. The `lms-` prefix is what lets us later (a) authenticate the request against your tenant and (b) keep LMS sessions distinct from anonymous public ones.

> **Important:** `learnerId` must be stable per student across attempts and per device. If you change it between two attempts, our backend treats them as two different learners (separate score, separate history).

---

## 3. Endpoints

Base URL: `https://backend-ten-delta-54.vercel.app`   (we'll move you to `https://api.leanhyphen.com` before public launch).

All endpoints return `application/json`. Error payloads are `{ "error": "<message>" }` with the right HTTP status.

### 3.1 `GET /api/analytics/lms-export/:lessonId?sessionId=<learnerId>` ⭐

**This is the endpoint you'll use most.** Stable contract — schema version frozen at `1.0`. New keys go under `_extras` until promoted in a versioned release.

| Param | Where | Required | Notes |
|---|---|---|---|
| `lessonId` | path | yes | e.g. `think-before-you-spend` |
| `sessionId` | query | yes | The learner id you used in the iframe URL |
| `attempt` | query | no | Specific attempt number. Defaults to latest. |

**Response 200**

```json
{
  "export": {
    "schemaVersion": "1.0",
    "learner":  { "sessionId": "lms-canvas-stu-42" },
    "lesson":   {
      "lessonId":    "think-before-you-spend",
      "attemptNo":   1,
      "completed":   true,
      "startedAt":   "2026-06-01T10:00:00.000Z",
      "completedAt": "2026-06-01T10:08:47.000Z"
    },
    "score": {
      "total":         97,
      "learning":      100,
      "engagement":    69,
      "completionPct": 100,
      "timeMs":        527000
    },
    "badges": [
      { "badgeId": "expert-learner",      "earnedAt": "...", "detail": { "scoreBand": 90, "totalScore": 97 } },
      { "badgeId": "perfect-act",         "earnedAt": "...", "detail": { "actId": "act2", "points": 25 } },
      { "badgeId": "no-skip-champion",    "earnedAt": "...", "detail": {} },
      { "badgeId": "fast-finisher",       "earnedAt": "...", "detail": { "totalTimeMs": 527000 } },
      { "badgeId": "critical-thinker",    "earnedAt": "...", "detail": { "accuracyPct": 100 } },
      { "badgeId": "decision-master",     "earnedAt": "...", "detail": {} },
      { "badgeId": "scenario-specialist", "earnedAt": "...", "detail": {} }
    ],
    "acts": [
      { "actId":"act1", "title":"Act 1 — Temptation",                  "score":22, "pointsEarned":22, "pointsMax":25, "accuracyPct":null, "completionPct":100, "timeMs":241000 },
      { "actId":"act2", "title":"Act 2 — Understanding Impulse Buying","score":25, "pointsEarned":25, "pointsMax":25, "accuracyPct":null, "completionPct":100, "timeMs":149000 },
      { "actId":"act3", "title":"Act 3 — Real-life Simulation",        "score":25, "pointsEarned":25, "pointsMax":25, "accuracyPct":100,  "completionPct":100, "timeMs":74000  },
      { "actId":"act4", "title":"Act 4 — Reflect & Realise",           "score":25, "pointsEarned":25, "pointsMax":25, "accuracyPct":null, "completionPct":100, "timeMs":59000  }
    ],
    "improvement": { "previousScore": 72, "currentScore": 97, "deltaScore": 25 },
    "_extras":     { "insights": [ { "kind": "strongest-act", "message": "Your strongest performance was in Act 2 with 96% accuracy." } ] }
  }
}
```

**Response when the student hasn't started the lesson yet**

```json
{ "export": null }
```

→ Show "Not yet started" in your UI; **do not** treat this as an error.

**Curl example**

```bash
curl "https://backend-ten-delta-54.vercel.app/api/analytics/lms-export/think-before-you-spend?sessionId=lms-canvas-stu-42"
```

---

### 3.2 `GET /api/analytics/lesson/:lessonId?sessionId=<learnerId>` — full live view

Same data as `lms-export`, plus richer fields (per-scene counts, raw act session rows). Use this when the LMS shows a **live student progress widget** while they're playing — poll every 5–10 s.

```bash
curl "https://backend-ten-delta-54.vercel.app/api/analytics/lesson/think-before-you-spend?sessionId=lms-canvas-stu-42"
```

Shape:

```json
{
  "report": {
    "sessionId": "lms-canvas-stu-42",
    "lessonId":  "think-before-you-spend",
    "attemptNo": 1,
    "completed": false,
    "totalScore": 47,
    "learningScore": 60,
    "engagementScore": 55,
    "completionPct": 55.55,
    "totalTimeMs": 280000,
    "acts": [ /* same shape as lms-export */ ],
    "badges":   [ /* badges earned so far */ ],
    "insights": [ /* live insights */ ],
    "improvement": null,
    "scenesCount":   6,
    "attemptsCount": 3
  },
  "storage": "file"   // "postgres" once we move to managed Postgres
}
```

`completed: false` means the lesson is in-flight — poll until it flips to `true`, then fetch `/lms-export/…` for the canonical parent report.

---

### 3.3 `GET /api/analytics/attempts/:lessonId?sessionId=<learnerId>` — growth over time

For the LMS dashboard's "learner growth" timeline (parent: "is my child improving?").

```bash
curl "https://backend-ten-delta-54.vercel.app/api/analytics/attempts/think-before-you-spend?sessionId=lms-canvas-stu-42"
```

```json
{
  "history": {
    "attempts_count":    3,
    "best_score":        97,
    "best_attempt_no":   3,
    "latest_score":      97,
    "latest_attempt_no": 3,
    "avg_score":         82.33,
    "best_completion_pct": 100,
    "total_time_ms":     1820000
  }
}
```

Returns `{ "history": null }` if the student has never started the lesson.

---

### 3.4 `GET /api/analytics/act/:lessonId/:actId?sessionId=<learnerId>` — per-act drilldown

When the parent clicks into "Act 2" in your dashboard, fetch this for the breakdown.

```bash
curl "https://backend-ten-delta-54.vercel.app/api/analytics/act/think-before-you-spend/act2?sessionId=lms-canvas-stu-42"
```

```json
{
  "report": {
    "actId": "act2",
    "title": "Act 2 — Understanding Impulse Buying",
    "score": 25,
    "pointsEarned": 25,
    "pointsMax":    25,
    "completionPct":100,
    "accuracyPct":  null,
    "timeMs":       149000,
    "scenes": [
      { "sceneId":"scene-6", "completed":true, "skipped":false, "timeMs":28000,  "pointsEarned":4, "interactionCount":12 },
      { "sceneId":"scene-7", "completed":true, "skipped":false, "timeMs":15000,  "pointsEarned":5, "interactionCount":0  },
      { "sceneId":"scene-8", "completed":true, "skipped":false, "timeMs":15000,  "pointsEarned":4, "interactionCount":0  }
    ],
    "attempts": [
      { "activityId":"thought-spiral", "attemptNo":1, "success":true, "pointsEarned":8, "accuracyPct":100, "timeMs":60000 },
      { "activityId":"impulse-cards",  "attemptNo":1, "success":true, "pointsEarned":4, "accuracyPct":null,"timeMs":30000 }
    ],
    "improvementVsPrevAttempt": null
  }
}
```

---

### 3.5 Common error responses

| Status | Body                              | Meaning |
|--------|-----------------------------------|---------|
| `400`  | `{ "error": "sessionId query param required" }` | Missing `sessionId` |
| `404`  | (we don't 404; we return `report: null`)        | Treat empty payloads as "not started" |
| `429`  | `{ "error": "rate limit" }`       | Back off and retry — see §6 |
| `5xx`  | `{ "error": "…" }`                | Transient — retry with exponential backoff |

---

## 4. The launch flow (step by step)

1. **Student opens your LMS** and clicks "Start Lesson".
2. **Your LMS opens an iframe / new tab** pointing to:
   ```
   https://frontend-think-before-you-spend.vercel.app/?learnerId=lms-canvas-stu-42
   ```
3. **Our frontend reads `?learnerId=…`** and uses it as the session id (already implemented).
4. **Student plays.** As they progress, our app emits events to `POST /api/analytics/events` — you don't see this, it's our internal pipeline.
5. **Live view** (optional): your LMS dashboard polls `GET /api/analytics/lesson/...` every 5–10 s to update a progress bar.
6. **Lesson completes.** Last event is `lesson_completed`. The next poll of `/lms-export/...` returns `lesson.completed: true` with the final score + badges.
7. **You fetch and store** `/lms-export/...` once and render it in (a) the student's transcript and (b) the parent report email.

---

## 5. Authentication & multi-tenancy

**Today (pilot):** the API is open. `learnerId` is the only credential — anyone who knows it can read that student's report. Acceptable for a closed pilot with you, not acceptable for a public launch.

**Before public launch (we'll ship this within ~1 week of you signing off):**

1. You're issued an **`X-Lms-Api-Key`** (a random 32-byte string) per environment.
2. All read endpoints require:
   ```
   X-Lms-Api-Key: lms_live_…
   X-Lms-Tenant:  canvas        // optional; lets multiple subtenants share a key
   ```
3. The backend verifies `(apiKey, learnerId)` belongs to your tenant before returning data — so a Canvas key can't read a Moodle student.
4. Rate limit per key: 60 requests / minute / learner. Bump on request.

The launch URL stays the same — `learnerId` continues to be sent as query string. The key is server-to-server only; you don't expose it to the browser.

Future option: **LTI 1.3** (Canvas / Moodle / Blackboard native standard). We can add this if you require it. Quote ~1–2 weeks of work.

---

## 6. Rate limits, retries, caching

* **Reads** are cheap on our side — every endpoint serves a materialised JSON. Poll the live endpoint up to once every 5 seconds per learner; the LMS export needs to be called only once when the lesson completes.
* **Retries:** use exponential backoff on `5xx` and `429`. We return `Retry-After` in seconds where applicable.
* **Cache headers:** today reads are uncached (`Cache-Control: no-store`). When auth lands we'll add per-tenant CDN caching with a 5-second TTL so polling stays cheap at scale.
* **Idempotency:** GETs are pure; POSTs (the event ingest, which only WE call) are idempotent via client-generated UUIDs.

---

## 7. The data dictionary

### Score components

| Field             | Range   | Definition |
|-------------------|---------|------------|
| `score.total`     | 0–100   | Σ of the four per-act scores (each act caps at 25 by default) |
| `score.learning`  | 0–100   | 60% accuracy + 25% scenario quality + 15% completion |
| `score.engagement`| 0–100   | 60% completion + 25% interaction density + 15% activity participation |
| `score.completionPct` | 0–100 | % of defined scenes completed across all four acts |
| `score.timeMs`    | ms      | Active time (idle is stripped backend-side) |

### Badges (current set)

| `badgeId`             | Title                  | Triggered when |
|-----------------------|------------------------|----------------|
| `master-strategist`   | Master Strategist      | Total score = 100 |
| `expert-learner`      | Expert Learner         | Total score ≥ 90 |
| `advanced-explorer`   | Advanced Explorer      | Total score ≥ 80 |
| `knowledge-builder`   | Knowledge Builder      | Total score ≥ 70 |
| `emerging-learner`    | Emerging Learner       | Total score ≥ 60 |
| `needs-improvement`   | Needs Improvement      | Total score > 0 but < 60 |
| `perfect-act`         | Perfect Act            | At least one act scored full marks |
| `no-skip-champion`    | No-Skip Champion       | Zero skipped activities |
| `fast-finisher`       | Fast Finisher          | Lesson completed in under 10 min |
| `persistence-champion`| Persistence Champion   | Retried at least one activity and scored higher |
| `critical-thinker`    | Critical Thinker       | Overall accuracy ≥ 90% |
| `decision-master`     | Decision Master        | Act 3 pick-3 perfect on first try |
| `scenario-specialist` | Scenario Specialist    | Perfect mind-trap drag + perfect Act 3 pick-3 |

The score-band badge is **mutually exclusive** (only the highest band is held). Behavioural badges stack.

### Act ids (lesson "Think Before You Spend")

| `actId` | `title`                                | Max points |
|---------|----------------------------------------|------------|
| `act1`  | Act 1 — Temptation                     | 25 |
| `act2`  | Act 2 — Understanding Impulse Buying   | 25 |
| `act3`  | Act 3 — Real-life Simulation           | 25 |
| `act4`  | Act 4 — Reflect & Realise              | 25 |

---

## 8. Quickstart — five minutes

1. Decide your `learnerId` format. Recommendation: `lms-<tenant>-<your-student-id>`. Use one **per student**.
2. Open the lesson in a browser to simulate a student:
   ```
   https://frontend-think-before-you-spend.vercel.app/?learnerId=lms-test-001
   ```
3. Play through to the end. The end-of-Act-4 modal will show the same numbers your dashboard will pull.
4. From your server (or curl), fetch the report:
   ```bash
   curl 'https://backend-ten-delta-54.vercel.app/api/analytics/lms-export/think-before-you-spend?sessionId=lms-test-001'
   ```
5. Wire that JSON into your parent report email + dashboard.

For the live view, swap step 4 with `/api/analytics/lesson/...` and poll every 5–10 s while `report.completed === false`.

---

## 9. Open items / what's still being built

| Item                                  | Owner | Status         |
|---------------------------------------|-------|----------------|
| `?learnerId=` launch param            | Lean Hyphen | ✅ implemented |
| Postgres backend (vs. file storage)   | Lean Hyphen | 🟡 migration ready, will flip before public launch |
| `X-Lms-Api-Key` header + tenant scoping | Lean Hyphen | ⬜ ~1 week, ships when you confirm rollout date |
| Per-tenant CORS allow-list             | Lean Hyphen | ⬜ same milestone as auth |
| Webhook (`POST <your-url>` on lesson_completed) | Lean Hyphen | ⬜ optional, ~2 days |
| LTI 1.3 support                       | Lean Hyphen | ⬜ on request only |

---

## 10. Contact

Anything ambiguous, send to **info@leanhyphen.com**. Please include:
* the exact request URL,
* the response body,
* the `learnerId` you used,
* a timestamp (UTC).

That gives us a one-shot path to the event in our log; turnaround on integration questions is same-day during the pilot.
