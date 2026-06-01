import { Router } from 'express';
import { hasDb, query } from '../db/index.js';

const router = Router();

/**
 * POST /api/makeover-runs
 * Body:
 *   {
 *     sessionId, lessonId, actId, vibe,
 *     cart, sortAnswers, spent, categoryTotals,
 *     needsTotal, wantsTotal, reserveStatus, reserveRemaining, savings,
 *     fixedEventChoice, randomEventId, randomEventChoice,
 *     snapshotMcq, insights
 *   }
 * Returns: { saved: { id, created_at } }
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      sessionId, lessonId, actId, vibe,
      cart = [], sortAnswers = {}, spent = 0, categoryTotals = {},
      needsTotal = 0, wantsTotal = 0,
      reserveStatus = null, reserveRemaining = 0, savings = 0,
      fixedEventChoice = null, randomEventId = null, randomEventChoice = null,
      snapshotMcq = null, insights = [],
    } = req.body || {};

    if (!sessionId || !lessonId || !actId) {
      return res.status(400).json({ error: 'sessionId, lessonId, actId required' });
    }

    if (!hasDb()) {
      // No Postgres → silently accept (file fallback would write to disk;
      // makeover runs are analytics-only so dropping is fine for local dev).
      return res.json({ saved: { id: null, created_at: new Date().toISOString() }, storage: 'noop' });
    }

    await query(
      `INSERT INTO sessions (id, user_agent) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [sessionId, req.headers['user-agent'] || null],
    );

    const { rows } = await query(
      `INSERT INTO room_makeover_runs (
         session_id, lesson_id, act_id, vibe, cart, sort_answers,
         spent, category_totals, needs_total, wants_total,
         reserve_status, reserve_remaining, savings,
         fixed_event_choice, random_event_id, random_event_choice,
         snapshot_mcq, insights
       )
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb)
       RETURNING id, created_at`,
      [
        sessionId, lessonId, actId, vibe,
        JSON.stringify(cart), JSON.stringify(sortAnswers),
        spent, JSON.stringify(categoryTotals), needsTotal, wantsTotal,
        reserveStatus, reserveRemaining, savings,
        fixedEventChoice, randomEventId, randomEventChoice,
        snapshotMcq, JSON.stringify(insights),
      ],
    );
    res.json({ saved: rows[0], storage: 'postgres' });
  } catch (err) { next(err); }
});

export default router;
