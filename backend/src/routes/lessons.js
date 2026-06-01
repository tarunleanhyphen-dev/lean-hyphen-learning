import { Router } from 'express';
import { hasDb, query } from '../db/index.js';
import { getSupabaseAdmin, hasSupabase } from '../db/supabase.js';

const router = Router();

const SELECT_COLS =
  'id, slug, module, title, total_minutes, featured, hero, acts, extras, updated_at';

async function listViaSdk() {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('lessons')
    .select(SELECT_COLS)
    .order('featured', { ascending: false })
    .order('id');
  if (error) throw new Error(error.message);
  return data;
}

async function getViaSdk(id) {
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from('lessons')
    .select(SELECT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function listViaPg() {
  const { rows } = await query(
    `SELECT ${SELECT_COLS} FROM lessons ORDER BY featured DESC, id`
  );
  return rows;
}

async function getViaPg(id) {
  const { rows } = await query(
    `SELECT ${SELECT_COLS} FROM lessons WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * GET /api/lessons
 * Returns all lessons (featured first, then alphabetical by id).
 */
router.get('/', async (_req, res, next) => {
  try {
    if (hasSupabase()) {
      return res.json({ lessons: await listViaSdk(), source: 'sdk' });
    }
    if (hasDb()) {
      return res.json({ lessons: await listViaPg(), source: 'pg' });
    }
    res.status(503).json({ error: 'No database configured.' });
  } catch (err) { next(err); }
});

/**
 * GET /api/lessons/:id
 * Returns a single lesson by id. 404 if not found.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const lesson = hasSupabase()
      ? await getViaSdk(req.params.id)
      : hasDb()
        ? await getViaPg(req.params.id)
        : null;
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
    res.json({ lesson, source: hasSupabase() ? 'sdk' : 'pg' });
  } catch (err) { next(err); }
});

export default router;
