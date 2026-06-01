/**
 * Seed the `lessons` table by importing the live frontend lesson files
 * and upserting them as JSONB rows. Re-runnable — safe to call after edits.
 *
 *   npm run seed:lessons
 */
import path from 'node:path';
import url from 'node:url';
import { getPool, hasDb } from './index.js';
import 'dotenv/config';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FRONTEND_LESSONS = path.resolve(__dirname, '../../../frontend/src/data/lessons');

async function loadLessonModule(file) {
  const full = path.join(FRONTEND_LESSONS, file);
  return import(url.pathToFileURL(full).href);
}

/**
 * Each entry: { file, featured, extrasKeys }.
 * `extrasKeys` are the OTHER named exports we want to snapshot alongside `lesson`.
 */
const LESSONS = [
  {
    file: 'thinkBeforeYouSpend.js',
    featured: true,
    extrasKeys: ['act2Activities', 'act3Scenarios', 'act4Activities', 'products'],
  },
  {
    file: 'whereDoesMyMoneyGo.js',
    featured: false,
    extrasKeys: [],
  },
];

async function run() {
  if (!hasDb()) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  const pool = getPool();

  for (const cfg of LESSONS) {
    const mod = await loadLessonModule(cfg.file);
    const lesson = mod.lesson;
    if (!lesson?.id) {
      console.error(`Skipping ${cfg.file}: no \`lesson\` export with an id.`);
      continue;
    }
    const extras = {};
    for (const k of cfg.extrasKeys) if (mod[k] !== undefined) extras[k] = mod[k];

    const { rows } = await pool.query(
      `INSERT INTO lessons (id, slug, module, title, total_minutes, featured, hero, acts, extras, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
         slug          = EXCLUDED.slug,
         module        = EXCLUDED.module,
         title         = EXCLUDED.title,
         total_minutes = EXCLUDED.total_minutes,
         featured      = EXCLUDED.featured,
         hero          = EXCLUDED.hero,
         acts          = EXCLUDED.acts,
         extras        = EXCLUDED.extras,
         updated_at    = NOW()
       RETURNING id, slug, updated_at`,
      [
        lesson.id,
        lesson.slug ?? lesson.id,
        lesson.module,
        lesson.title,
        lesson.totalMinutes ?? null,
        cfg.featured,
        lesson.hero ?? null,
        lesson.acts,
        Object.keys(extras).length ? extras : null,
      ]
    );
    console.log(`✓ Upserted ${cfg.file} → id=${rows[0].id} (slug=${rows[0].slug})`);
  }

  await pool.end();
  console.log(`Done. Seeded ${LESSONS.length} lesson(s).`);
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
