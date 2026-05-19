import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { getSessionId } from '../utils/api.js';

const LessonContext = createContext(null);

const STORAGE_KEY = 'lh.lessonState.v1';

// Keys that must NOT survive a page reload. Browsers tie permission to
// play() audio to a user gesture in the CURRENT page session; if we trust
// a stored `audioEnabled: true`, the consent banner is hidden but the
// browser still blocks audio.play() until the user clicks something — so
// the very first narration is silently rejected and the student wonders
// why nothing's reading. Stripping these on load forces the banner to
// always show on a fresh page, which guarantees a user gesture before
// any TTS request, which guarantees the audio plays.
const VOLATILE_KEYS = ['audioEnabled', 'audioDismissed'];

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    for (const k of VOLATILE_KEYS) delete parsed[k];
    return parsed;
  } catch {
    return {};
  }
}

export function LessonProvider({ children }) {
  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    try {
      // Don't write back the volatile audio flags either — keeps
      // localStorage clean.
      const toStore = { ...state };
      for (const k of VOLATILE_KEYS) delete toStore[k];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {}
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
