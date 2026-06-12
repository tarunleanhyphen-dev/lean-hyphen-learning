/**
 * useSoftMusic — starts the shared soft background-music loop for an act.
 * Tries immediately (works if audio was already unlocked by a prior gesture,
 * e.g. Act 1's start gate), and also arms a one-shot pointer listener so it
 * kicks in on the first interaction when an act is opened directly.
 */
import { useEffect } from 'react';
import { unlockAudio, setMusicMood } from '../../../../utils/sounds.js';

const PREF = 'lh.ss.music';
export function musicEnabled() {
  try { return localStorage.getItem(PREF) !== 'off'; } catch { return true; }
}
export function setMusicEnabled(on) {
  try { localStorage.setItem(PREF, on ? 'on' : 'off'); } catch { /* noop */ }
}

export function useSoftMusic(mood = 'calm') {
  useEffect(() => {
    if (!musicEnabled()) return undefined;
    let done = false;
    const onGesture = () => {
      if (done || !musicEnabled()) { window.removeEventListener('pointerdown', onGesture); return; }
      (async () => {
        try { await unlockAudio(true); setMusicMood(mood); done = true; } catch { /* noop */ }
      })();
      // one shot — once a real gesture fires we stop listening so it can never
      // fight the manual music toggle.
      window.removeEventListener('pointerdown', onGesture);
    };
    // try immediately (works if audio already unlocked from a prior gesture)
    (async () => { try { await unlockAudio(true); setMusicMood(mood); done = true; } catch { /* noop */ } })();
    window.addEventListener('pointerdown', onGesture);
    return () => window.removeEventListener('pointerdown', onGesture);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
