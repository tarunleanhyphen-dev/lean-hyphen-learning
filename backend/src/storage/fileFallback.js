/**
 * File-based fallback when DATABASE_URL is not set.
 * Lets devs run the backend instantly without provisioning Postgres.
 * Drop-in replaceable by the pg-backed implementations.
 */
import fs from 'node:fs';
import path from 'node:path';

// Vercel's runtime filesystem is read-only except `/tmp` (ephemeral per invocation).
// Locally we use `./data/` so dev writes are persistent.
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_SERVERLESS
  ? '/tmp/leanhyphen-data'
  : path.resolve(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'fallback.json');

function load() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(FILE)) return { reflections: [], progress: [], sessions: {} };
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { reflections: [], progress: [], sessions: {} };
  }
}

function save(state) {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

export const fileStore = {
  ensureSession(id, userAgent) {
    const s = load();
    if (!s.sessions[id]) {
      s.sessions[id] = { id, createdAt: new Date().toISOString(), userAgent };
      save(s);
    }
  },
  saveReflection(row) {
    const s = load();
    const entry = { id: s.reflections.length + 1, ...row, createdAt: new Date().toISOString() };
    s.reflections.push(entry);
    save(s);
    return entry;
  },
  upsertProgress(row) {
    const s = load();
    const key = `${row.sessionId}|${row.lessonId}|${row.actId}`;
    const idx = s.progress.findIndex((p) => `${p.sessionId}|${p.lessonId}|${p.actId}` === key);
    const next = { ...row, updatedAt: new Date().toISOString() };
    if (idx >= 0) s.progress[idx] = next;
    else s.progress.push(next);
    save(s);
    return next;
  },
};
