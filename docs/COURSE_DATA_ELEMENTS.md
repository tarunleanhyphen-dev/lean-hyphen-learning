# Course Data Elements — what our courses send to the LMS

> For the BanyanPro LMS team. Our courses are "dumb" emitters: they send raw
> activity data to the LMS via the Activity Tracker (`postMessage`), and the LMS
> stores it and generates reports. Nothing report-specific is hard-coded per
> course, so new metrics or report designs are a one-time change on the LMS side.

## Transport

Each event is sent to the parent LMS window:

```js
window.parent.postMessage({ type: 'LMS_TRACK_EVENT', payload: <event> }, '*')
```

## Event envelope (per BanyanPro's SDK guide)

```jsonc
{
  "eventId":    "string",          // unique, for dedup
  "verb":       "COMPLETED",       // see below
  "objectType": "QUIZ",            // see below
  "objectId":   "where-does-my-money-go:act3:a3-quiz",  // stable, namespaced
  "objectName": "Understanding Quiz",
  "result": {                      // present on completion events
    "score":      4,
    "maxScore":   5,
    "percentage": 80,
    "passed":     true,
    "duration":   42,              // seconds
    "response":   "..."            // only for open-ended / cart picks
  },
  "context":  { "sessionId": "<auto>", "attemptNumber": 1 },
  "timestamp": "2026-06-10T00:00:00.000Z"
}
```

Student identity is **not** included — the LMS attributes events to the logged-in
student from the iframe session.

## Verbs & object types we use

| Verb | Object types | When |
|---|---|---|
| `STARTED` | `LESSON`, `ACTIVITY` | Lesson opened; an act started |
| `COMPLETED` | `LESSON`, `ACTIVITY`, `QUIZ` | Lesson finished (with total score); act finished; graded activity/quiz finished |
| `FAILED` | `ACTIVITY`, `QUIZ` | A graded item failed |
| `INTERACTED` | `ACTIVITY` | Lightweight interaction (e.g. add-to-cart) |

## objectId scheme (stable across students & deployments)

- Lesson: `<lessonId>` → e.g. `think-before-you-spend`
- Act: `<lessonId>:<actId>` → e.g. `think-before-you-spend:act2`
- Activity: `<lessonId>:<actId>:<activityId>` → e.g. `where-does-my-money-go:act3:a3-quiz`

## Data elements per course

### Course 1 — Think Before You Spend (`think-before-you-spend`, 4 acts)

| Object | objectId | Type | result fields |
|---|---|---|---|
| Lesson | `think-before-you-spend` | LESSON | score (0–100), maxScore 100, percentage, passed |
| Act 1–4 | `…:act1` … `…:act4` | ACTIVITY | duration |
| Mind Trap (drag game) | `…:act2:thought-spiral` | ACTIVITY | score, maxScore, percentage, passed, duration |
| Impulse Flash Cards | `…:act2:impulse-cards` | ACTIVITY | score, maxScore, percentage, passed, duration |
| Pick-3 Challenge | `…:act3:s1-pick3` | ACTIVITY | score, maxScore, percentage, passed, duration |
| Impulse Meter | `…:act4:meter` | ACTIVITY | percentage, response (zone), duration |
| Key Takeaways | `…:act4:takeaways` | ACTIVITY | score, maxScore, percentage, duration |
| Add-to-cart (impulse buys) | `…:act1:add-*` | ACTIVITY (`INTERACTED`) | response (product) |

### Course 2 — Where Does My Money Go? (`where-does-my-money-go`, 3 acts)

| Object | objectId | Type | result fields |
|---|---|---|---|
| Lesson | `where-does-my-money-go` | LESSON | score (0–100), maxScore 100, percentage, passed |
| Act 1–3 | `…:act1` … `…:act3` | ACTIVITY | duration |
| Needs vs Wants Sort | `…:act1:a1-sort` | ACTIVITY | score, maxScore, percentage, passed, duration |
| Spending Snapshot Question | `…:act1:a1-snapshot-mcq` | ACTIVITY | score, maxScore, percentage, passed, duration |
| Who's Nailing Their First Salary? | `…:act2:a2-firstsalary` | ACTIVITY | score, maxScore, percentage, passed, duration |
| Understanding Quiz | `…:act3:a3-quiz` | QUIZ | score, maxScore, percentage, passed, duration |

## Need more / different data elements?

Everything above lives in **one file per the platform** (`frontend/src/lib/lmsBridge.js`),
so adding fields is a small, one-time change — not per-course rework. If the LMS
wants additional elements in `result`/`context`, send the list and we'll add them.
Candidates we can emit on request:

- `accuracyPct` as a distinct field (currently surfaced as `percentage`)
- Per-act sub-score and badge/tier (we compute these; can attach to act/lesson events)
- Scene/step-level progress (`PROGRESSED LESSON` with `percentage`)
- Idle vs active time
