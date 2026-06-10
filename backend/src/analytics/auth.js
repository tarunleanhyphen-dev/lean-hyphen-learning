/**
 * Analytics read authorization.
 *
 * Defense-in-depth for the report read endpoints. Without this, anyone who
 * guesses/knows a learnerId can GET that learner's report. We mint a per-session
 * capability token — HMAC(secret, sessionId) — and return it from the events
 * ingest response. The browser that actually played the lesson holds the token
 * and passes it on reads; a random caller hitting GET ...?sessionId=<guess> does
 * not, and is rejected.
 *
 * The secret lives ONLY on the backend (never shipped to the browser). A master
 * ANALYTICS_API_KEY bypasses the per-session token for server-to-server / admin
 * use.
 *
 * Backward-compatible: if REPORT_TOKEN_SECRET is unset, auth is disabled and the
 * endpoints stay open (so deploying this code changes nothing until the secret
 * is configured).
 *
 * Residual risk (documented): event ingest is necessarily open (the browser
 * posts without a secret), so a caller who already KNOWS a valid learnerId could
 * POST a throwaway event to obtain its token. This raises the bar against GET
 * enumeration/scraping; closing it fully needs real auth (Supabase Auth or an
 * LMS-signed identity).
 */
import crypto from 'node:crypto';

const SECRET = process.env.REPORT_TOKEN_SECRET || '';
const API_KEY = process.env.ANALYTICS_API_KEY || '';

export function authEnabled() {
  return Boolean(SECRET);
}

/** Deterministic per-session token. Stable for a given sessionId. */
export function reportTokenFor(sessionId) {
  if (!SECRET || !sessionId) return null;
  return crypto.createHmac('sha256', SECRET).update(String(sessionId)).digest('base64url').slice(0, 24);
}

function safeEq(a, b) {
  if (a == null || b == null) return false;
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Express middleware guarding the analytics READ endpoints. Allows the request
 * when: auth is disabled, OR a valid master API key is present, OR the supplied
 * token matches the requested sessionId. Otherwise 401.
 */
export function requireReportAuth(req, res, next) {
  if (!SECRET) return next(); // not configured → open (backward compat)

  if (API_KEY && safeEq(req.get('x-api-key'), API_KEY)) return next();

  const sessionId = req.query.sessionId;
  const token = req.query.token || req.get('x-report-token');
  if (sessionId && token && safeEq(token, reportTokenFor(sessionId))) return next();

  const err = new Error('unauthorized: a valid report token (or API key) is required to read analytics');
  err.status = 401;
  return next(err);
}
