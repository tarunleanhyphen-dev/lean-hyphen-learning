# Report Analytics — Field Reference for LMS Dashboards

> **Audience:** LMS engineering + product team building parent / student / teacher dashboards.
> **Goal:** map every report metric to the endpoint that delivers it, with sample payloads, value ranges, and UI rendering suggestions.
>
> Pairs with [LMS_INTEGRATION.md](./LMS_INTEGRATION.md) (the integration handshake) and [ANALYTICS.md](./ANALYTICS.md) (the deeper architecture). This file is the **field-level reference** — what you can show, where to get it.

---

## At a glance

For a learner who finished the lesson, **one** GET call gives you everything you need:

```
GET /api/analytics/lms-export/:lessonId?sessionId=<learnerId>
```

It returns a stable `schemaVersion: "1.0"` JSON with:

| Block | What's in it | Best for |
|---|---|---|
| `score` | total / learning / engagement / completion% / time | Headline KPIs, top-of-dashboard tiles |
| `acts[]` | per-act score, accuracy, completion, time | Drill-down "Act 1 was strongest" |
| `badges[]` | every badge earned | Celebration strip, parent email |
| `improvement` | previous vs current score delta | "Up 14 pts vs last attempt" |
| `_extras.insights[]` | human-readable narrative lines | Plain-English summary |

If you want the **richer** in-app view (per-scene counts, attempt history, more insights), use these three companions:

| Endpoint | Adds | When |
|---|---|---|
| `GET /api/analytics/lesson/:lessonId` | richer report shape, raw scenesCount, attemptsCount | Live student widget |
| `GET /api/analytics/act/:lessonId/:actId` | per-scene breakdown, per-attempt detail | Parent drilling into Act 2 |
| `GET /api/analytics/attempts/:lessonId` | best/latest/avg across all attempts | Growth-over-time chart |

All four take `?sessionId=<learnerId>` and route to **that one student's** report.

---

## 1. The headline score block

From `/lms-export` → `.score`:

```json
"score": {
  "total":         97,
  "learning":      100,
  "engagement":    69,
  "completionPct": 100,
  "timeMs":        527000
}
```

| Field | Range | What it measures | UI suggestion |
|---|---|---|---|
| `total` | 0–100 | Σ of per-act points scored. Lesson max = 100 (25 per act × 4). | Big trophy tile. Color band: ≥90 gold, ≥70 silver, ≥50 bronze, else "needs improvement". |
| `learning` | 0–100 | 60% accuracy + 25% scenario quality + 15% completion. Reflects *quality* of answers, not just showing up. | "Learning quality" tile, teal accent. |
| `engagement` | 0–100 | 60% completion + 25% interaction density + 15% activity participation. Reflects how *thoroughly* they engaged. | "Engagement" tile, coral accent. |
| `completionPct` | 0–100 | % of defined scenes completed across all four acts. | Inline progress bar under the total. |
| `timeMs` | milliseconds | Active time. Idle is stripped server-side. | Format as `Xm Ys`. Show as a footer chip, not headline. |

### How the three scores differ (when to use which)

- **`total`** — "Did the student succeed at the lesson?" Use for grading.
- **`learning`** — "How well did they answer?" Use for academic feedback.
- **`engagement`** — "How present were they?" Use for behavioural feedback. Most useful for parents: a learner can have low `learning` (struggled with the activities) but high `engagement` (tried hard, didn't skip anything) — that distinction matters.

---

## 2. Per-act breakdown

From `/lms-export` → `.acts[]`:

```json
"acts": [
  {
    "actId":          "act1",
    "title":          "Act 1 — Temptation",
    "score":          22,
    "pointsEarned":   22,
    "pointsMax":      25,
    "accuracyPct":    null,
    "completionPct":  100,
    "timeMs":         241000
  },
  {
    "actId":          "act2",
    "title":          "Act 2 — Understanding Impulse Buying",
    "score":          25,
    "pointsEarned":   25,
    "pointsMax":      25,
    "accuracyPct":    null,
    "completionPct":  100,
    "timeMs":         149000
  },
  {
    "actId":          "act3",
    "title":          "Act 3 — Real-life Simulation",
    "score":          25,
    "pointsEarned":   25,
    "pointsMax":      25,
    "accuracyPct":    100,
    "completionPct":  100,
    "timeMs":         74000
  },
  {
    "actId":          "act4",
    "title":          "Act 4 — Reflect & Realise",
    "score":          25,
    "pointsEarned":   25,
    "pointsMax":      25,
    "accuracyPct":    null,
    "completionPct":  100,
    "timeMs":         59000
  }
]
```

| Field | Range | Meaning | UI suggestion |
|---|---|---|---|
| `actId` | `act1` / `act2` / `act3` / `act4` | Stable identifier. | Key for charts. |
| `title` | string | Pre-formatted display label. | Use directly; don't re-format. |
| `score` | 0–25 (default cap) | Earned points capped at `pointsMax`. | Inside-bar number on a horizontal bar chart. |
| `pointsEarned` / `pointsMax` | 0 → 25 | Raw numerator / denominator. | "22 / 25" badge. |
| `accuracyPct` | 0–100 or `null` | Activity accuracy for acts that have *gradable* activities. `null` for acts that are pure exposure (Act 1's clicking through the shopping app, Act 4's self-reflection meter). | Only render the chip when non-null. |
| `completionPct` | 0–100 | % of scenes in this act completed. | Sub-line under the bar. |
| `timeMs` | ms | Time spent inside this act. | Inline duration chip. |

### Recommended drill-down

When a parent taps **Act 2** in your dashboard, hit:

```
GET /api/analytics/act/:lessonId/:actId?sessionId=<learnerId>
```

That returns:

- The same act-level fields above, **plus**
- `scenes[]` — `{ sceneId, completed, skipped, timeMs, pointsEarned, interactionCount }` per scene
- `attempts[]` — `{ activityId, attemptNo, success, pointsEarned, accuracyPct, timeMs }` per activity attempt
- `improvementVsPrevAttempt` — number (positive = improved on a re-take) or `null`

Use for the "show me what they did inside Act 2" view.

---

## 3. Badges

From `/lms-export` → `.badges[]`:

```json
"badges": [
  { "badgeId": "expert-learner",      "earnedAt": "2026-06-03T10:08:47.000Z", "detail": { "scoreBand": 90, "totalScore": 97 } },
  { "badgeId": "perfect-act",         "earnedAt": "2026-06-03T10:06:31.000Z", "detail": { "actId": "act2", "points": 25 } },
  { "badgeId": "no-skip-champion",    "earnedAt": "2026-06-03T10:08:47.000Z", "detail": {} },
  { "badgeId": "fast-finisher",       "earnedAt": "2026-06-03T10:08:47.000Z", "detail": { "totalTimeMs": 527000 } },
  { "badgeId": "critical-thinker",    "earnedAt": "2026-06-03T10:08:47.000Z", "detail": { "accuracyPct": 100 } },
  { "badgeId": "decision-master",     "earnedAt": "2026-06-03T10:07:45.000Z", "detail": {} },
  { "badgeId": "scenario-specialist", "earnedAt": "2026-06-03T10:08:47.000Z", "detail": {} }
]
```

### The full badge catalogue (current set)

#### Score-band (exactly one per session — only the highest tier earned)

| `badgeId` | Display name | Earned when | Visual |
|---|---|---|---|
| `master-strategist` | Master Strategist | `score.total = 100` | 🏆 gold |
| `expert-learner` | Expert Learner | `score.total ≥ 90` | 🎓 gold |
| `advanced-explorer` | Advanced Explorer | `score.total ≥ 80` | 🧭 silver |
| `knowledge-builder` | Knowledge Builder | `score.total ≥ 70` | 📚 silver |
| `emerging-learner` | Emerging Learner | `score.total ≥ 60` | 🌱 bronze |
| `needs-improvement` | Needs Improvement | `0 < score.total < 60` | 🔁 neutral |

#### Behavioural (multiple can stack)

| `badgeId` | Display name | Earned when |
|---|---|---|
| `perfect-act` | Perfect Act | At least one act scored full marks (25/25) |
| `no-skip-champion` | No-Skip Champion | Zero skipped activities across the lesson |
| `fast-finisher` | Fast Finisher | Lesson finished in under 10 minutes |
| `persistence-champion` | Persistence Champion | Retried at least one activity and scored higher on the retry |
| `critical-thinker` | Critical Thinker | Overall accuracy ≥ 90% |
| `decision-master` | Decision Master | Act 3 pick-3 challenge solved perfectly on the first attempt |
| `scenario-specialist` | Scenario Specialist | Both Act 2 mind-trap drag AND Act 3 pick-3 perfect |

### UI suggestion

A horizontal strip of pill-shaped chips, score-band first (highest visual weight), behavioural chips after. Animate them in with a stagger (60ms each) on the parent dashboard for the celebratory feel.

The `detail` block carries the *why* — e.g. for `perfect-act`, `detail.actId` tells you which act got full marks, so you can write "Perfect Act 2" instead of just "Perfect Act".

---

## 4. Improvement vs previous attempt

From `/lms-export` → `.improvement`:

```json
"improvement": {
  "previousScore": 72,
  "currentScore":  97,
  "deltaScore":    25
}
```

| Field | What it is | UI suggestion |
|---|---|---|
| `previousScore` | The `total` from the latest *completed* prior attempt | "Last time: 72" |
| `currentScore` | The `total` from this attempt | "This time: 97" |
| `deltaScore` | `currentScore − previousScore`. Can be negative. | Big "↑ +25 points" if positive, "↓ −5 points" if negative. Always show with sign. |

If `improvement` is `null`, this is the learner's first completed attempt — skip the whole block.

---

## 5. Narrative insights

From `/lms-export` → `._extras.insights[]`:

```json
"_extras": {
  "insights": [
    { "kind": "strongest-act",     "message": "Your strongest performance was in Act 2 with 96% accuracy." },
    { "kind": "weakest-act",       "message": "Act 1 could use another pass — accuracy was 56%." },
    { "kind": "time-spent",        "message": "You spent more time in Act 3, indicating deeper engagement." },
    { "kind": "most-retries",      "message": "You retried \"s1-pick3\" 3 times — persistence counts." }
  ]
}
```

| `kind` | Always there? | Trigger |
|---|---|---|
| `strongest-act` | usually | Act with highest accuracy among gradable acts |
| `weakest-act` | when applicable | Act with accuracy < 70% |
| `time-spent` | usually | Act the learner spent most time in |
| `most-retries` | when applicable | Activity retried 2+ times |

The `message` is plain English and ready to display directly. Show as a list of bullet points or callout cards. Tone is encouraging, not punitive — designed for parents/students to read directly.

Insights live under `_extras` because the *set* of insights may grow (new kinds added in future releases). Top-level `score` / `acts` / `badges` will stay stable for v1.0.

---

## 6. Live progress (mid-lesson)

For the LMS "Sarah is currently on Act 3" widget, poll:

```
GET /api/analytics/lesson/:lessonId?sessionId=<learnerId>
```

Every 5–10 seconds while `report.completed === false`. Returns the same shape with these extras:

| Field | What it tells you |
|---|---|
| `report.completed: false` | Lesson in flight. Keep polling. |
| `report.completed: true` | Lesson done. Stop polling, switch to `/lms-export` for the canonical report. |
| `report.acts[].started` / `.completed` | Boolean per act. Use for a "stepper" UI: `act1 ✓ → act2 ✓ → act3 (in progress) → act4 (locked)`. |
| `report.scenesCount` | Scenes completed so far across all acts. Use for a coarse progress bar. |
| `report.attemptsCount` | Total activity attempts. |
| `report.completionPct` | Live % completion. |
| `report.totalScore` | Live running score. Updates as activities complete. |

### Suggested LMS live widget

```
┌──────────────────────────────────────────────────────┐
│ 👤 Aarav · Think Before You Spend                    │
│ ●●●●○○○○ 50% complete                                │
│                                                       │
│ Act 1 ✓  Act 2 ●  Act 3 ·  Act 4 ·                   │
│                                                       │
│ Current score: 47 / 100                              │
│ Time so far: 6m 12s                                  │
└──────────────────────────────────────────────────────┘
```

Refresh by polling every 5 s. When `completed: true`, flip to a "✓ Finished — view report" CTA that hits `/lms-export`.

---

## 7. Attempt history (growth over time)

For the LMS "Sarah's growth across 3 attempts" chart:

```
GET /api/analytics/attempts/:lessonId?sessionId=<learnerId>
```

Returns:

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

| Field | Meaning | UI suggestion |
|---|---|---|
| `attempts_count` | How many distinct attempts on this lesson | Header chip: "3 attempts" |
| `best_score` | Highest `total` ever achieved on this lesson | Headline: "Best: 97 / 100" |
| `best_attempt_no` | Which attempt achieved that best score | Subtitle: "(on attempt 3)" |
| `latest_score` | Most recent attempt's `total` | Sparkline endpoint |
| `latest_attempt_no` | Most recent attempt number | Used to pair with above |
| `avg_score` | Running average across all attempts | Reference line on the sparkline |
| `best_completion_pct` | Highest completion% ever | "Always finishes — 100%" if 100 |
| `total_time_ms` | Cumulative time on this lesson across all attempts | "Total practice: 30m 20s" |

Returns `{ "history": null }` if the learner has never started — render "Not yet attempted".

---

## 8. Lesson + attempt metadata

Top-level fields you'll likely want on every dashboard:

From `/lms-export`:

```json
"lesson": {
  "lessonId":    "think-before-you-spend",
  "attemptNo":   1,
  "completed":   true,
  "startedAt":   "2026-06-03T10:00:00.000Z",
  "completedAt": "2026-06-03T10:08:47.000Z"
}
```

| Field | Why it matters |
|---|---|
| `lessonId` | Catalogue id. For now we have one lesson; more coming. |
| `attemptNo` | 1-indexed. Show "Attempt 3" badges. |
| `completed` | Toggle between "in progress" UI and "finished" UI. |
| `startedAt` / `completedAt` | Show "Started Monday 10am · Finished Monday 10:09am" timestamps. |

Plus the learner block:

```json
"learner": { "sessionId": "lms-canvas-stu-42" }
```

The `sessionId` is the `?learnerId=…` you sent at launch. Use it as the join key against your own student table.

---

## 9. Sample LMS dashboards

### Parent monthly summary

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

Pulls from **one** call to `/lms-export`.

### Student live progress widget

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

Pulls from `/lesson` polled every 5 s. Hide when `completed: true`.

### Teacher class view (10 students)

For each student, you'll loop over your roster and call `/lms-export?sessionId=<their-id>` (or `/lesson` for live state). Compose into a table:

| Student | Status | Score | Best | Time | Badges |
|---|---|---|---|---|---|
| Aarav | ✓ done | 97 | 97 (#3) | 8m | 🎓 + 6 |
| Priya | ● in progress (Act 3) | 47 | 47 | 6m | — |
| Riya | ○ not started | — | — | — | — |
| … |

For the class summary row (averages), you compute server-side in your LMS by summing/averaging across your loop. We don't expose a "class aggregate" endpoint yet — it'd require us to know your tenant + roster.

---

## 10. Field reference — quick lookup

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
| Badges earned | `/lms-export` | `badges[].badgeId` (look up display name in §3 table) |
| Improvement | `/lms-export` | `improvement.deltaScore` (may be null) |
| Narrative insights | `/lms-export` | `_extras.insights[].message` |
| Started / finished timestamps | `/lms-export` | `lesson.startedAt`, `lesson.completedAt` |
| Live progress (mid-lesson) | `/lesson` | `report.acts[].started` / `.completed`, `report.completionPct` |
| Best score ever | `/attempts` | `history.best_score` |
| Attempt count | `/attempts` | `history.attempts_count` |
| Average across attempts | `/attempts` | `history.avg_score` |
| Per-scene drilldown | `/act/:actId` | `scenes[]` |
| Per-attempt detail | `/act/:actId` | `attempts[]` |

---

## 11. Edge cases & defensive rendering

| Case | What the API returns | What you should show |
|---|---|---|
| Learner never started this lesson | `{ "export": null }` | "Not yet started" empty state |
| Learner currently mid-lesson | `lesson.completed: false`, scores reflect progress so far | "In progress" with live values |
| Learner finished but very recently (events still propagating) | Partial fields | Fall back to "Lesson complete — score syncing" copy |
| API 5xx / network error | HTTP 5xx | "Couldn't load — retry" with retry button |
| Field is `null` (e.g. `acts[i].accuracyPct`) | `null` | Don't render the chip / cell — not all acts have accuracy |

All endpoints return `200` for "no data yet" (not `404`). Treat null/empty as a legitimate state, not an error.

---

## 12. Authentication note

**Today (pilot):** endpoints are open and keyed only on `sessionId`. Anyone who knows the learner's `sessionId` can read that learner's report. Acceptable for closed-pilot integration.

**Before public launch:** the LMS will receive an `X-Lms-Api-Key` header to scope requests to your tenant. Read-side authorization will then verify `(apiKey, learnerId)` belongs to your tenant before returning data. The endpoint shapes won't change.

See [LMS_INTEGRATION.md §5](./LMS_INTEGRATION.md) for the launch-URL handshake and how `?learnerId=` becomes the `sessionId` we key on.

---

## 13. Versioning

- `/lms-export` is stamped `schemaVersion: "1.0"`. Top-level keys are stable. New fields go under `_extras` until promoted in a versioned release.
- `/lesson`, `/act`, `/attempts` are richer and *may* evolve — use them for in-app live views, not for storage / contracts. Anything you want to persist on your side, pull from `/lms-export`.
- When we ship schema `1.1`, you'll receive 60+ days of overlap on both versions plus a changelog entry in this repo's `docs/`.

---

## 14. Contact

`info@leanhyphen.com` — same-day during pilot integration. When reporting issues please include:

- Exact endpoint URL hit
- `learnerId` used
- Response body (or HTTP status + headers)
- UTC timestamp of the request

That gives us a one-shot path to the event in our log.
