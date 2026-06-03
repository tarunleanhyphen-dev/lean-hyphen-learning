const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  saveReflection: ({ lessonId, actId, prompt, response, sessionId }) =>
    request('/api/reflections', {
      method: 'POST',
      body: JSON.stringify({ lessonId, actId, prompt, response, sessionId }),
    }),
  saveProgress: ({ lessonId, actId, status, sessionId, payload }) =>
    request('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ lessonId, actId, status, sessionId, payload }),
    }),
  health: () => request('/api/health'),
};

/**
 * Resolve the session id used for analytics + progress.
 *
 *   1. If the page was launched from an LMS with `?learnerId=…`,
 *      use that as the session id. The LMS owns the identifier; we
 *      persist it in localStorage so refreshes / route changes keep
 *      the same learner attached. The LMS-supplied id is also kept
 *      in `lh.lmsLearnerId` so it survives if the user later clears
 *      the canonical key but not the LMS one (useful in iframes).
 *   2. Otherwise fall back to a self-generated UUID — the existing
 *      anonymous-friendly behaviour.
 *
 * Format expectation for LMS-supplied ids (recommended, not enforced):
 *   `lms-<tenant>-<student-id>` e.g. `lms-canvas-stu-42`.
 * Any string is accepted today; the prefix convention lets us cleanly
 * separate LMS-owned sessions from anonymous ones server-side when we
 * wire per-tenant auth.
 */
export function getSessionId() {
  const KEY = 'lh.sessionId';
  const LMS_KEY = 'lh.lmsLearnerId';

  // Query-string override — only honoured on first read so the LMS
  // can't accidentally remap the learner mid-session by changing the
  // iframe src.
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const fromLms = params.get('learnerId');
    if (fromLms) {
      const stored = localStorage.getItem(LMS_KEY);
      if (stored !== fromLms) {
        localStorage.setItem(LMS_KEY, fromLms);
        localStorage.setItem(KEY, fromLms);
      }
      return fromLms;
    }
  }

  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
