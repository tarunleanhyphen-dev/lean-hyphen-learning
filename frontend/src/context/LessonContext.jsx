import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { getSessionId } from '../utils/api.js';

const LessonContext = createContext(null);

const STORAGE_KEY = 'lh.lessonState.v1';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function LessonProvider({ children }) {
  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const value = useMemo(() => ({
    sessionId: getSessionId(),
    state,
    setReflection: (lessonId, actId, response) => {
      setState((s) => ({
        ...s,
        [lessonId]: {
          ...(s[lessonId] || {}),
          reflections: {
            ...((s[lessonId] && s[lessonId].reflections) || {}),
            [actId]: response,
          },
        },
      }));
    },
    setActStatus: (lessonId, actId, status) => {
      setState((s) => ({
        ...s,
        [lessonId]: {
          ...(s[lessonId] || {}),
          progress: {
            ...((s[lessonId] && s[lessonId].progress) || {}),
            [actId]: status,
          },
        },
      }));
    },
    setAudioEnabled: (enabled) => setState((s) => ({ ...s, audioEnabled: enabled })),
    setAudioDismissed: (v) => setState((s) => ({ ...s, audioDismissed: v })),
    audioEnabled: state.audioEnabled ?? false,
  }), [state]);

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

export function useLesson() {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('useLesson must be used inside LessonProvider');
  return ctx;
}
