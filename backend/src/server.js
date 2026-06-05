import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { hasDb } from './db/index.js';
import { hasSupabase } from './db/supabase.js';
import reflectionsRouter from './routes/reflections.js';
import progressRouter from './routes/progress.js';
import lessonsRouter from './routes/lessons.js';
import makeoverRunsRouter from './routes/makeoverRuns.js';
import ttsRouter from './routes/tts.js';
import musicRouter from './routes/music.js';
import analyticsRouter from './routes/analytics.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

const allowed = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowed.length ? allowed : true,
  credentials: false,
}));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    storage: hasDb() ? 'postgres' : 'file',
    supabaseSdk: hasSupabase(),
    version: '0.1.0',
    time: new Date().toISOString(),
  });
});

app.use('/api/reflections', reflectionsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/makeover-runs', makeoverRunsRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/music', musicRouter);
app.use('/api/analytics', analyticsRouter);

app.use(notFound);
app.use(errorHandler);

// Only bind a port when running as a long-lived server (local dev / Render / etc).
// Vercel imports `app` as a serverless handler and never wants .listen().
const isServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
if (!isServerless) {
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`[lean-hyphen api] listening on http://localhost:${port}`);
    console.log(`[lean-hyphen api] storage: ${hasDb() ? 'postgres' : 'file (data/fallback.json)'}`);
  });
}

export default app;
