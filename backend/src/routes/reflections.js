import { Router } from 'express';
import { hasDb, query } from '../db/index.js';
import { fileStore } from '../storage/fileFallback.js';

const router = Router();

/**
 * POST /api/reflections
 * Body: { lessonId, actId, prompt, response, sessionId }
 */
router.post('/', async (req, res, next) => {
  try {
    const { lessonId, actId, prompt = '', response, sessionId } = req.body || {};
    if (!lessonId || !actId || !response || !sessionId) {
      const err = new Error('lessonId, actId, response, sessionId are required');
      err.status = 400;
      throw err;
    }

    if (!hasDb()) {
      fileStore.ensureSession(sessionId, req.headers['user-agent']);
      const saved = fileStore.saveReflection({ sessionId, lessonId, actId, prompt, response });
      return res.status(201).json({ saved, storage: 'file' });
    }

    await query(
      `INSERT INTO sessions (id, user_agent)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [sessionId, req.headers['user-agent'] || null]
    );
    const { rows } = await query(
      `INSERT INTO reflections (session_id, lesson_id, act_id, prompt, response)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [sessionId, lessonId, actId, prompt, response]
    );
    res.status(201).json({ saved: rows[0], storage: 'postgres' });
  } catch (err) {
    next(err);
  }
});

export default router;
