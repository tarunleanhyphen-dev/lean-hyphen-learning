import { Router } from 'express';
import { hasDb, query } from '../db/index.js';
import { fileStore } from '../storage/fileFallback.js';

const router = Router();

/**
 * POST /api/progress
 * Body: { sessionId, lessonId, actId, status, payload? }
 */
router.post('/', async (req, res, next) => {
  try {
    const { sessionId, lessonId, actId, status, payload = null } = req.body || {};
    if (!sessionId || !lessonId || !actId || !status) {
      const err = new Error('sessionId, lessonId, actId, status are required');
      err.status = 400;
      throw err;
    }
    if (!['started', 'completed', 'skipped'].includes(status)) {
      const err = new Error('status must be one of started|completed|skipped');
      err.status = 400;
      throw err;
    }

    if (!hasDb()) {
      fileStore.ensureSession(sessionId, req.headers['user-agent']);
      const saved = fileStore.upsertProgress({ sessionId, lessonId, actId, status, payload });
      return res.json({ saved, storage: 'file' });
    }

    await query(
      `INSERT INTO sessions (id, user_agent)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [sessionId, req.headers['user-agent'] || null]
    );
    const { rows } = await query(
      `INSERT INTO act_progress (session_id, lesson_id, act_id, status, payload)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, lesson_id, act_id)
       DO UPDATE SET status = EXCLUDED.status, payload = EXCLUDED.payload, updated_at = NOW()
       RETURNING session_id, lesson_id, act_id, status, updated_at`,
      [sessionId, lessonId, actId, status, payload]
    );
    res.json({ saved: rows[0], storage: 'postgres' });
  } catch (err) {
    next(err);
  }
});

export default router;
