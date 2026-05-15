import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) return null; // DB-less mode (file fallback)

  const ssl = process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false };
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  pool.on('error', (err) => console.error('[pg pool error]', err.message));
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not set');
  return p.query(text, params);
}

export function hasDb() {
  return Boolean(process.env.DATABASE_URL);
}
