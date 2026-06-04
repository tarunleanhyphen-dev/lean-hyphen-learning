# Report & Analytics — Full Documentation

> **Lesson:** Think Before You Spend (Lesson 1, Module 1).
> **Audience:** LMS integration team (engineering + product) and the Lean Hyphen platform team.
> **Owner:** info@leanhyphen.com.

This is the single source of truth for everything the platform records, computes, and exposes about a learner's lesson session — the data model, the scoring math, the badge rules, the report shape, and the API endpoints an LMS can read.

If you're integrating an LMS dashboard, the only sections you strictly need are §2, §6, §7, §8, §10, §11, §13. Everything else is for deeper context.

---

## Table of contents

1. [Overview & 5-minute quickstart](#1-overview--5-minute-quickstart)
2. [Architecture](#2-architecture)
3. [Multi-student identity (the launch handshake)](#3-multi-student-identity-the-launch-handshake)
4. [Event taxonomy](#4-event-taxonomy)
5. [Database schema](#5-database-schema)
6. [Scoring framework](#6-scoring-framework)
7. [Badge catalogue](#7-badge-catalogue)
8. [The report payload (field-by-field)](#8-the-report-payload-field-by-field)
9. [Insights — narrative summary lines](#9-insights--narrative-summary-lines)
10. [Endpoint reference](#10-endpoint-reference)
11. [Sample LMS dashboards](#11-sample-lms-dashboards)
12. [Live-progress polling pattern](#12-live-progress-polling-pattern)
13. [Authentication, rate limits, edge cases](#13-authentication-rate-limits-edge-cases)
14. [Versioning](#14-versioning)
15. [Contact & support](#15-contact--support)

---

## 1. Overview & 5-minute quickstart

The platform records every meaningful learner interaction as an event, materialises the rolled-up score/badges/report on each event, and exposes the result through a handful of read endpoints. An LMS reads those endpoints to display student progress and parent reports.

**Base URLs**

- Production API: `https://backend-ten-delta-54.vercel.app`
- Production app: `https://frontend-think-before-you-spend.vercel.app`
- LMS will move to `https://api.leanhyphen.com` before public launch.

**Try the full pipeline in 5 minutes:**

1. Decide a learner id. Recommendation: `lms-<tenant>-<your-student-id>`. Example: `lms-canvas-stu-42`.
2. Open the lesson with that id:
   ```
   https://frontend-think-before-you-spend.vercel.app/?learnerId=lms-test-001
   ```
3. Play through Act 1 (~4 min) — events post to the backend in the background.
4. From your server (or curl), fetch the live report:
   ```bash
   curl 'https://backend-ten-delta-54.vercel.app/api/analytics/lms-export/think-before-you-spend?sessionId=lms-test-001'
   ```
5. You'll get a JSON payload with score, badges, per-act breakdown — render it on your dashboard.

That's it. Everything else in this doc is "here's what each field means and when to call which endpoint".

---

## 2. Architecture

```
 Browser ──► /api/analytics/events ──► raw events table (ledger)
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
                       /api/analytics/lesson/:id      ◄── student live view
                       /api/analytics/act/:id         ◄── per-act drill-down
                       /api/analytics/attempts/:id    ◄── attempt history
                       /api/analytics/lms-export/:id  ◄── stable parent report
```

**Design principles**

- **Event-sourced.** Every learner action lands in `analytics_events` as an immutable row. Aggregates are *derived*, so we can re-compute history after a config change or a bug fix.
- **Idempotent ingestion.** Every event carries a client-generated UUID. Retries from a flaky network can't double-count.
- **Anonymous-first.** Everything keys on `sessionId` (a UUID persisted in `localStorage`). When OTP auth lands later, a one-shot migration binds existing `session_id` values to `user_id`. Schema stays the same.
- **LMS-ready out of the box.** The `/lms-export` endpoint returns a stable JSON shape (schema `1.0`). Top-level keys won't break across releases.
- **Pull-based.** No webhooks today. You poll our read endpoints when you need fresh data. Caches are warm and reads are O(1).

---

## 3. Multi-student identity (the launch handshake)

Every student in your LMS has a stable id (`canvas_user_id`, `lms_user_id`, whatever you call it). When you launch our lesson in an iframe, pass that as the `learnerId` query param:

```
https://frontend-think-before-you-spend.vercel.app/?learnerId=lms-<tenant>-<your-student-id>
```

Examples:

- `lms-canvas-stu-42`
- `lms-moodle-7b3c-9a1d`
- `lms-school-acme-grade8-aarav`

Our frontend reads `?learnerId=` on load and uses it as the canonical session id for the whole session. From that moment:

- All learner events (`scene_entered`, `activity_completed`, …) are stamped with the same `learnerId`.
- All per-student API reads take that same `learnerId` as `sessionId`.
- Re-attempts append to the learner's history. We never overwrite.

**Critical rule:** `learnerId` must be stable **per student** across attempts and devices. If you change it between two attempts, the backend treats them as two different learners (separate score, separate history).

**Recommended naming:** `lms-<tenant>-<your-student-id>`. The `lms-` prefix is what lets us (a) later authenticate against your tenant and (b) distinguish LMS-owned sessions from anonymous public ones server-side.

---

## 4. Event taxonomy

Every meaningful interaction lands in `analytics_events` with a `kind` from this enum. Source of truth: [`backend/src/analytics/events.js`](../backend/src/analytics/events.js).

### Lifecycle

| `kind` | Fires when |
|---|---|
| `lesson_started` | Learner enters the first Act of the lesson |
| `lesson_completed` | Last Act finished, all activities done |
| `lesson_abandoned` | Learner navigated away mid-lesson (not yet fully enforced) |
| `act_started` | Each Act mount |
| `act_completed` | Each Act's final phase reached |
| `scene_entered` | Each scene boundary entered |
| `scene_completed` | Each scene's last phase reached |
| `scene_skipped` | Learner used a skip control inside the scene |

### Activity lifecycle

| `kind` | Fires when |
|---|---|
| `activity_started` | An interactive activity (drag game, MCQ, simulation) starts |
| `activity_completed` | Successful or unsuccessful end of an activity attempt |
| `activity_retried` | Learner restarted an activity after a wrong answer |
| `activity_failed` | Backend-determined failure (didn't meet threshold) |
| `activity_passed` | Backend-determined success |

### Interactions

| `kind` | Fires when |
|---|---|
| `drag_drop_completed` | A drag-drop activity finished |
| `mcq_answered` | A multiple-choice question answered |
| `option_selected` | A radio / select option chosen |
| `hint_opened` | Learner opened a hint |
| `reflection_submitted` | Free-text reflection submitted |
| `scenario_decision` | Scenario branching choice taken |

### Controls

| `kind` | Fires when |
|---|---|
| `pause_clicked` | Sequencer paused |
| `resume_clicked` | Sequencer resumed |
| `exit_clicked` | "Back to home" tapped mid-lesson |
| `replay_clicked` | Scene/act replay tapped |

### Event envelope

Every event accepts the same shape:

```json
{
  "clientEventId": "uuid",
  "kind":          "scene_entered",
  "sessionId":     "lms-canvas-stu-42",
  "lessonId":      "think-before-you-spend",
  "actId":         "act1",
  "sceneId":       "scene-0",
  "activityId":    null,
  "attemptNo":     1,
  "clientTs":      "2026-06-04T12:34:56.789Z",
  "payload":       { "timeMs": 4500 }
}
```

`payload` is a free-form JSONB blob — adding new fields never requires a schema change. The frequently-queried fields (act/scene/activity) are promoted to columns for index-friendly reads.

---

## 5. Database schema

Nine tables created by migration `004_analytics.sql`. You don't need this section to integrate as a consumer — included so you know what's stored.

| Table | One row per | Notes |
|---|---|---|
| `analytics_events` | (sessionId, clientEventId) | Append-only ledger. Source of truth. |
| `user_lesson_sessions` | (sessionId, lessonId, attempt) | One row per *attempt*. Re-takes don't overwrite the previous score. |
| `user_act_sessions` | (lessonSession, actId) | Per-act roll-up — points, accuracy, completion. |
| `user_scene_sessions` | (actSession, sceneId) | Per-scene dwell time, interactions, completion. |
| `user_activity_attempts` | each attempt of an activity | Drives "average attempts", "retry rate", "accuracy". |
| `user_scores` | (lessonSession) | Materialised score for fast LMS reads. |
| `user_badges` | (lessonSession, badgeId) | One row per badge earned. |
| `user_attempt_history` | (sessionId, lessonId) | Best/latest/avg roll-up across attempts. |
| `user_learning_progress` | (sessionId) | Cross-lesson cumulative metrics. |

---

## 6. Scoring framework

```
totalScore (0–100) = Σ actScores   (capped at lessonMax = 100)
actScores          = config.acts[actId].max × (points earned / points possible)
learningScore      = 60% accuracy + 25% scenario quality + 15% completion
engagementScore    = 60% completion + 25% interaction density + 15% activity participation
```

**Default per-act distribution**

| Act | Max points | Where points come from |
|---|---|---|
| `act1` | 25 | Scenes (3+5+8+4 = 20 pts) + add-to-cart activities (5 pts) |
| `act2` | 25 | Scenes (4+5+4 = 13 pts) + thought-spiral (8 pts) + flash-cards (4 pts) |
| `act3` | 25 | Scene (5 pts) + s1-pick3 challenge (20 pts) |
| `act4` | 25 | Scene (5 pts) + impulse-meter (8 pts) + takeaways (12 pts) |

**Configurable.** The scoring map lives in [`backend/src/analytics/scoring.js`](../backend/src/analytics/scoring.js) as a single object. When the CMS lands, it loads this map from a database table indexed by `configVersion` — both backend and LMS can fetch the same map.

**Per-activity rules** apply for graded activities (thought-spiral counts correct/total, s1-pick3 applies a 10% retry penalty floored at 30% of max, etc). The materialised `pointsEarned` reflects the result of those rules.

### Score-component meanings (when to use which)

- **`total`** — "Did the student succeed at the lesson?" Use for grading.
- **`learning`** — "How well did they answer?" Use for academic feedback. Reflects *quality* of answers.
- **`engagement`** — "How present were they?" Use for behavioural feedback. A learner can have low `learning` (struggled) but high `engagement` (tried hard, no skips) — that distinction matters for parents.

---

## 7. Badge catalogue

Source of truth: [`backend/src/analytics/badges.js`](../backend/src/analytics/badges.js).

### Score-band badges (exactly one per session — only the highest tier earned)

| `badgeId` | Display name | Earned when | Suggested icon |
|---|---|---|---|
| `master-strategist` | Master Strategist | `total = 100` | 🏆 gold |
| `expert-learner` | Expert Learner | `total ≥ 90` | 🎓 gold |
| `advanced-explorer` | Advanced Explorer | `total ≥ 80` | 🧭 silver |
| `knowledge-builder` | Knowledge Builder | `total ≥ 70` | 📚 silver |
| `emerging-learner` | Emerging Learner | `total ≥ 60` | 🌱 bronze |
| `needs-improvement` | Needs Improvement | `0 < total < 60` | 🔁 neutral |

### Behavioural badges (multiple can stack)

| `badgeId` | Display name | Earned when |
|---|---|---|
| `perfect-act` | Perfect Act | At least one act scored full marks (25/25) |
| `no-skip-champion` | No-Skip Champion | Zero skipped activities across the lesson |
| `fast-finisher` | Fast Finisher | Lesson finished in under 10 minutes |
| `persistence-champion` | Persistence Champion | Retried at least one activity and scored higher on the retry |
| `critical-thinker` | Critical Thinker | Overall accuracy ≥ 90% |
| `decision-master` | Decision Master | Act 3 pick-3 challenge solved perfectly on the first attempt |
| `scenario-specialist` | Scenario Specialist | Both Act 2 mind-trap drag AND Act 3 pick-3 perfect |

### Badge object shape

```json
{
  "badgeId":  "perfect-act",
  "earnedAt": "2026-06-04T10:06:31.000Z",
  "detail":   { "actId": "act2", "points": 25 }
}
```

The `detail` block carries the *why* — e.g. for `perfect-act`, `detail.actId` tells you which act got full marks so you can write "Perfect Act 2" instead of just "Perfect Act".

### UI suggestion

A horizontal strip of pill chips, score-band first (highest visual weight), behavioural chips after. Animate them in with a stagger (~60 ms each) on the parent dashboard for the celebratory feel.

---

## 8. The report payload (field-by-field)

**The one endpoint that does most of the work:**

```
GET /api/analytics/lms-export/:lessonId?sessionId=<learnerId>
```

Stable contract — schema version `1.0` is frozen. New keys go under `_extras` until promoted in a versioned release.

Full sample response:

```json
{
  "export": {
    "schemaVersion": "1.0",
    "learner":  { "sessionId": "lms-canvas-stu-42" },
    "lesson":   {
      "lessonId":    "think-before-you-spend",
      "attemptNo":   1,
      "completed":   true,
      "startedAt":   "2026-06-04T10:00:00.000Z",
      "completedAt": "2026-06-04T10:08:47.000Z"
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
    "_extras":     { "insights": [
      { "kind": "strongest-act", "message": "Your strongest performance was in Act 2 with 96% accuracy." }
    ]}
  }
}
```

### Headline score block (`.score`)

| Field | Range | Meaning | UI suggestion |
|---|---|---|---|
| `total` | 0–100 | Σ per-act points | Big trophy tile. Color band: ≥90 gold, ≥70 silver, ≥50 bronze, else "needs improvement". |
| `learning` | 0–100 | Quality of answers | Teal accent tile. |
| `engagement` | 0–100 | How present they were | Coral accent tile. |
| `completionPct` | 0–100 | % of scenes completed across all acts | Inline progress bar. |
| `timeMs` | ms | Active time (idle stripped) | Format `Xm Ys`. Footer chip, not headline. |

### Per-act breakdown (`.acts[]`)

| Field | Range | Meaning | Notes |
|---|---|---|---|
| `actId` | `act1`–`act4` | Stable identifier | Chart key |
| `title` | string | Pre-formatted display label | Use directly |
| `score` | 0–25 (default) | Earned points (capped at `pointsMax`) | In-bar number |
| `pointsEarned` | int | Raw numerator | "22 / 25" badge |
| `pointsMax` | int | Raw denominator | |
| `accuracyPct` | 0–100 or `null` | Accuracy for acts that have *gradable* activities. `null` for acts that are pure exposure (Act 1's shopping app, Act 4's self-reflection meter) | Only render chip when non-null |
| `completionPct` | 0–100 | % of scenes in this act completed | Sub-line under bar |
| `timeMs` | ms | Time spent in this act | Inline duration chip |

### Badges (`.badges[]`)

Array of `{ badgeId, earnedAt, detail }` objects. Look up display name in the §7 table. Detail block varies by badge.

### Improvement (`.improvement`)

```json
{
  "previousScore": 72,
  "currentScore":  97,
  "deltaScore":    25
}
```

| Field | Meaning | UI |
|---|---|---|
| `previousScore` | Total from the latest *completed* prior attempt | "Last time: 72" |
| `currentScore` | Total from this attempt | "This time: 97" |
| `deltaScore` | `currentScore − previousScore` (can be negative) | "↑ +25 pts" or "↓ −5 pts". Always with sign. |

If `improvement` is `null`, this is the learner's first completed attempt — skip the block.

### Insights (`._extras.insights[]`)

See §9.

### Lesson metadata (`.lesson`)

| Field | Why |
|---|---|
| `lessonId` | Catalogue id. |
| `attemptNo` | 1-indexed. Show "Attempt 3" badges. |
| `completed` | Toggle in-progress vs finished UI. |
| `startedAt` / `completedAt` | "Started Monday 10am · Finished Monday 10:09am". |

### Learner metadata (`.learner`)

```json
{ "sessionId": "lms-canvas-stu-42" }
```

The `sessionId` is the `?learnerId=` you sent at launch. Use it as the join key against your own student table.

---

## 9. Insights — narrative summary lines

Computed under `_extras.insights[]`. Plain-English, ready to display.

```json
[
  { "kind": "strongest-act",  "message": "Your strongest performance was in Act 2 with 96% accuracy." },
  { "kind": "weakest-act",    "message": "Act 1 could use another pass — accuracy was 56%." },
  { "kind": "time-spent",     "message": "You spent more time in Act 3, indicating deeper engagement." },
  { "kind": "most-retries",   "message": "You retried \"s1-pick3\" 3 times — persistence counts." }
]
```

| `kind` | Always there? | Trigger |
|---|---|---|
| `strongest-act` | usually | Act with highest accuracy among gradable acts |
| `weakest-act` | conditional | Act with accuracy < 70% |
| `time-spent` | usually | Act the learner spent most time in |
| `most-retries` | conditional | Activity retried 2+ times |

Tone is encouraging, not punitive — designed for parents/students to read directly. Show as bullets or callout cards.

Insights live under `_extras` because the *set* of insights may grow. Top-level `score` / `acts` / `badges` stay stable for v1.0.

---

## 10. Endpoint reference

Base URL (production): `https://backend-ten-delta-54.vercel.app`
Base URL (local dev): `http://localhost:4000`

All endpoints return `application/json`. Error bodies are `{ "error": "<message>" }` with the appropriate HTTP status. `200` is returned for "no data yet" cases (never `404`).

### 10.1 `GET /api/analytics/lms-export/:lessonId` ⭐ primary

Stable, schemaVersion-1.0 export. **This is the endpoint your LMS uses most.**

| Param | Where | Required | Notes |
|---|---|---|---|
| `lessonId` | path | yes | e.g. `think-before-you-spend` |
| `sessionId` | query | yes | The learner id from the launch URL |
| `attempt` | query | no | Specific attempt number. Defaults to latest. |

**Response 200** — see §8 for the full payload.

**Response when learner hasn't started**

```json
{ "export": null }
```

Show "Not yet started" — don't treat as error.

**curl**

```bash
curl 'https://backend-ten-delta-54.vercel.app/api/analytics/lms-export/think-before-you-spend?sessionId=lms-canvas-stu-42'
```

---

### 10.2 `GET /api/analytics/lesson/:lessonId` — richer in-app view

Same data as `lms-export`, plus extras: `report.scenesCount`, `report.attemptsCount`, raw act session row fields. Use this for **live student progress widgets** while they play.

```bash
curl 'https://backend-ten-delta-54.vercel.app/api/analytics/lesson/think-before-you-spend?sessionId=lms-canvas-stu-42'
```

Sample (in-flight):

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
    "acts":     [ /* same shape as lms-export */ ],
    "badges":   [ /* badges earned so far */ ],
    "insights": [ /* live insights */ ],
    "improvement": null,
    "scenesCount":   6,
    "attemptsCount": 3
  },
  "storage": "file"
}
```

`completed: false` means the lesson is in flight — poll until it flips to `true`, then fetch `/lms-export/…` for the canonical parent report.

---

### 10.3 `GET /api/analytics/act/:lessonId/:actId` — per-act drill-down

When a parent taps **Act 2** in your dashboard, fetch this for the breakdown.

```bash
curl 'https://backend-ten-delta-54.vercel.app/api/analytics/act/think-before-you-spend/act2?sessionId=lms-canvas-stu-42'
```

Returns:

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

### 10.4 `GET /api/analytics/attempts/:lessonId` — growth over time

```bash
curl 'https://backend-ten-delta-54.vercel.app/api/analytics/attempts/think-before-you-spend?sessionId=lms-canvas-stu-42'
```

```json
{
  "history": {
    "attempts_count":      3,
    "best_score":          97,
    "best_attempt_no":     3,
    "latest_score":        97,
    "latest_attempt_no":   3,
    "avg_score":           82.33,
    "best_completion_pct": 100,
    "total_time_ms":       1820000
  }
}
```

| Field | Use for |
|---|---|
| `attempts_count` | Header chip: "3 attempts" |
| `best_score` | "Best: 97 / 100" |
| `best_attempt_no` | "(on attempt 3)" |
| `latest_score` | Sparkline endpoint |
| `latest_attempt_no` | Pair with latest |
| `avg_score` | Reference line on sparkline |
| `best_completion_pct` | "Always finishes — 100%" if 100 |
| `total_time_ms` | "Total practice: 30m 20s" |

Returns `{ "history": null }` if the learner has never started.

---

### 10.5 `POST /api/analytics/events` — write (internal use)

Used by **our frontend** to ingest events. You won't call this directly unless you're building a tooling integration. Documented here for completeness.

**Body**

```json
{
  "events": [ /* up to 200 event envelopes — see §4 */ ]
}
```

**Response 200**

```json
{ "accepted": 7, "rejected": [], "storage": "file" }
```

Validation failures are reported in `rejected[]`; the rest of the batch lands. A single malformed event can't break a session.

---

### 10.6 Common error responses

| Status | Body | Meaning |
|---|---|---|
| `400` | `{ "error": "sessionId query param required" }` | Missing `sessionId` |
| `200` | `{ "report": null }` or `{ "export": null }` or `{ "history": null }` | Learner hasn't started this lesson — treat as empty state, NOT error |
| `429` | `{ "error": "rate limit" }` | Back off, retry — see §13 |
| `5xx` | `{ "error": "…" }` | Transient — retry with exponential backoff |

---

## 11. Sample LMS dashboards

### Parent monthly summary

Pulls from **one** call to `/lms-export`.

```
┌────────────────────────────────────────────────────────────────┐
│ Aarav — Think Before You Spend                                 │
│                                                                │
│  🏆 97 / 100        🎯 100% accuracy      ⚡ 8m 47s            │
│  total              learning              time                 │
│                                                                │
│  Acts                                                          │
│  ████████████████░░  Act 1 — Temptation               22/25   │
│  ████████████████████ Act 2 — Understanding Impulse   25/25   │
│  ████████████████████ Act 3 — Real-life Simulation    25/25   │
│  ████████████████████ Act 4 — Reflect & Realise       25/25   │
│                                                                │
│  Badges                                                        │
│  🎓 Expert Learner   💯 Perfect Act 2   🚀 No-Skip            │
│  ⚡ Fast Finisher    🧠 Critical Thinker   🎯 Decision Master │
│                                                                │
│  What stood out                                                │
│  • Strongest performance in Act 2 (96% accuracy)              │
│  • Spent extra time in Act 3 — deeper engagement              │
│                                                                │
│  ↑ +25 points improvement vs last attempt (72 → 97)           │
└────────────────────────────────────────────────────────────────┘
```

### Student live progress widget

Pulls from `/lesson` polled every 5 s. Hide when `completed: true`.

```
┌──────────────────────────────────┐
│ Aarav                            │
│ Think Before You Spend           │
│                                   │
│ Currently on Act 2               │
│ ████████░░ 50% complete          │
│                                   │
│ Score so far: 47 / 100           │
│ Time so far: 6m 12s              │
└──────────────────────────────────┘
```

### Teacher class view

Loop over your roster, hit `/lms-export?sessionId=<their-id>` (or `/lesson` for live state), compose into a table:

| Student | Status | Score | Best | Time | Badges |
|---|---|---|---|---|---|
| Aarav | ✓ done | 97 | 97 (#3) | 8m | 🎓 + 6 |
| Priya | ● in progress (Act 3) | 47 | 47 | 6m | — |
| Riya | ○ not started | — | — | — | — |

For class averages, compute server-side in your LMS by summing/averaging across your loop. We don't expose a "class aggregate" endpoint yet — would require knowing your tenant + roster.

---

## 12. Live-progress polling pattern

For the "currently playing" widget, poll `/lesson` every **5–10 seconds** while `report.completed === false`. When it flips to `true`, switch to `/lms-export` for the canonical parent payload.

```
Poll every 5–10s while in flight:
  GET /api/analytics/lesson/think-before-you-spend?sessionId=<id>
  if response.report.completed === true:
      stop polling
      fetch GET /api/analytics/lms-export/think-before-you-spend?sessionId=<id>
      store + render canonical parent report
```

**Polling budget.** Reads are cheap server-side. Poll once every 5 seconds per active learner; the LMS export needs to be called only once when the lesson completes. Per-key rate limit is 60 requests / minute / learner (will be enforced when API-key auth lands).

---

### Field reference — quick lookup

| Want to display… | Get from | Field |
|---|---|---|
| Total score | `/lms-export` | `score.total` (0–100) |
| Learning quality | `/lms-export` | `score.learning` (0–100) |
| Engagement | `/lms-export` | `score.engagement` (0–100) |
| Completion % | `/lms-export` | `score.completionPct` (0–100) |
| Total time | `/lms-export` | `score.timeMs` (ms) |
| Per-act score | `/lms-export` | `acts[].score`, `acts[].pointsEarned`, `acts[].pointsMax` |
| Per-act accuracy | `/lms-export` | `acts[].accuracyPct` (may be null) |
| Per-act completion | `/lms-export` | `acts[].completionPct` |
| Per-act time | `/lms-export` | `acts[].timeMs` |
| Badges earned | `/lms-export` | `badges[].badgeId` (display name in §7) |
| Improvement | `/lms-export` | `improvement.deltaScore` (may be null) |
| Narrative insights | `/lms-export` | `_extras.insights[].message` |
| Started / finished timestamps | `/lms-export` | `lesson.startedAt`, `lesson.completedAt` |
| Live progress (mid-lesson) | `/lesson` | `report.acts[].started`/`completed`, `report.completionPct` |
| Best score ever | `/attempts` | `history.best_score` |
| Attempt count | `/attempts` | `history.attempts_count` |
| Average across attempts | `/attempts` | `history.avg_score` |
| Per-scene drilldown | `/act/:actId` | `scenes[]` |
| Per-attempt detail | `/act/:actId` | `attempts[]` |

---

## 13. Authentication, rate limits, edge cases

### Authentication

**Today (pilot):** endpoints are open and keyed only on `sessionId`. Anyone who knows the learner's `sessionId` can read that learner's report. Acceptable for closed-pilot integration.

**Before public launch** we ship API-key auth (~1 week of work once you confirm rollout date):

1. You're issued an `X-Lms-Api-Key` per environment.
2. All read endpoints require:
   ```
   X-Lms-Api-Key: lms_live_…
   X-Lms-Tenant:  canvas        (optional; lets multiple subtenants share a key)
   ```
3. Backend verifies `(apiKey, learnerId)` belongs to your tenant before returning data — a Canvas key can't read a Moodle student.
4. Rate limit per key: 60 requests / minute / learner. Bump on request.

The launch URL stays the same — `learnerId` continues to be sent as a query string. The API key is server-to-server only; never exposed to the browser.

**Future:** LTI 1.3 support on request only (~1–2 weeks of work). Canvas / Moodle / Blackboard native standard.

### Rate limits, retries, caching

- **Reads** are cheap (materialised JSON). Poll the live endpoint up to once every 5 seconds per learner. LMS export only on completion.
- **Retries:** exponential backoff on `5xx` and `429`. We return `Retry-After` in seconds where applicable.
- **Cache headers:** today reads are uncached. When auth lands we'll add per-tenant CDN caching with a 5-second TTL so polling stays cheap at scale.
- **Idempotency:** GETs are pure. POSTs (event ingest, which only we call) are idempotent via client-generated UUIDs.

### Edge cases & defensive rendering

| Case | What the API returns | What you should show |
|---|---|---|
| Learner never started this lesson | `{ "export": null }` | "Not yet started" empty state |
| Learner currently mid-lesson | `lesson.completed: false`, scores reflect progress so far | "In progress" with live values |
| Learner finished but very recently (events still propagating) | Partial fields | Fall back to "Lesson complete — score syncing" copy |
| API 5xx / network error | HTTP 5xx | "Couldn't load — retry" with retry button |
| Field is `null` (e.g. `acts[i].accuracyPct`) | `null` | Don't render the chip / cell — not all acts have accuracy |

All endpoints return `200` for "no data yet" (not `404`). Treat null/empty as a legitimate state, not an error.

---

## 14. Versioning

- `/lms-export` is stamped `schemaVersion: "1.0"`. Top-level keys are stable. New fields go under `_extras` until promoted in a versioned release.
- `/lesson`, `/act`, `/attempts` are richer and *may* evolve — use them for in-app live views, not for storage or contracts. Anything you want to persist on your side, pull from `/lms-export`.
- When we ship schema `1.1`, you'll receive **60+ days of overlap** on both versions plus a changelog entry in this repo's `docs/`.

---

## 15. Contact & support

**`info@leanhyphen.com`** — same-day during pilot integration. When reporting issues please include:

- Exact endpoint URL hit
- `learnerId` used
- Response body (or HTTP status + headers)
- UTC timestamp of the request

That gives us a one-shot path to the event in our log.

---

*Generated for Lesson 1 — Think Before You Spend. Source: `lean-hyphen-learning` repo on GitHub. Last reviewed 2026-06-04.*
