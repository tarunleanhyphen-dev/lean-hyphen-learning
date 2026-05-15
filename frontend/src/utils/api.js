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

export function getSessionId() {
  const KEY = 'lh.sessionId';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}
