import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { getPool, hasDb } from './index.js';
import 'dotenv/config';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function run() {
  if (!hasDb()) {
    console.error('DATABASE_URL is not set. Add it to backend/.env first.');
    process.exit(1);
  }
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const pool = getPool();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log(`→ Running ${f}`);
    await pool.query(sql);
  }
  console.log(`Done. Applied ${files.length} migration(s).`);
  await pool.end();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
