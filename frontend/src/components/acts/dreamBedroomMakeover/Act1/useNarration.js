/**
 * Narration controller for the Dream Bedroom Makeover.
 *
 * One instance lives at the Act level and is passed to every screen. It owns
 * the global TTS callbacks so there is never more than one writer.
 *
 *   narrate(lines, onDone)  speak each line in order; call onDone once the last
 *                           line finishes (or, in silent mode, after an
 *                           estimated reading time). `currentLine` tracks which
 *                           line is being read so the UI can highlight it.
 *   skip()                  stop speaking and resolve immediately (advance now).
 *   replay(lines)           re-read without advancing.
 *   stop()                  hard stop (used on unmount / screen change).
 *
 * speaking + amplitude drive Kabir's mouth + a soundwave indicator.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { speak, cancelSpeech, setSpeechCallbacks, isAudioEnabled } from '../../../../utils/sounds.js';

function readMs(line) {
  const words = String(line).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1600, Math.round(words * 360)); // ~150 wpm
}

export function useNarration() {
  const [speaking, setSpeaking]     = useState(false);
  const [amplitude, setAmplitude]   = useState(0);
  const [currentLine, setCurrentLine] = useState(-1);

  const doneRef   = useRef(null);   // fires once when the current run completes
  const lineRef   = useRef(-1);     // running index for voice mode
  const timersRef  = useRef([]);    // pending fallback timers
  const safetyRef  = useRef(null);  // backstop timer in voice mode
  const lastRef    = useRef(null);  // {lines, onDone} of the most recent narrate()
  const dedupeRef  = useRef({ key: '', t: 0 }); // guards StrictMode double-narrate

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (safetyRef.current) { clearTimeout(safetyRef.current); safetyRef.current = null; }
  };

  const finish = useCallback(() => {
    const d = doneRef.current;
    doneRef.current = null;
    clearTimers();
    setSpeaking(false);
    setCurrentLine(-1);
    lineRef.current = -1;
    d?.();
  }, []);

  // Own the global speech callbacks for this component's lifetime.
  useEffect(() => {
    setSpeechCallbacks({
      onStart: () => { lineRef.current += 1; setCurrentLine(lineRef.current); setSpeaking(true); },
      onEnd:   () => { if (doneRef.current) finish(); else { setSpeaking(false); setCurrentLine(-1); } },
      onAmplitude: (v) => setAmplitude(v),
    });
    return () => { setSpeechCallbacks(null); cancelSpeech(); clearTimers(); };
  }, [finish]);

  const narrate = useCallback((lines, onDone) => {
    const arr = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    // Dedupe: ignore an identical narrate() fired within 1.5s (e.g. React
    // StrictMode mounting the screen effect twice) so the voice plays once.
    const key = arr.join('|');
    const now = Date.now();
    if (key && dedupeRef.current.key === key && now - dedupeRef.current.t < 1500) {
      if (onDone) onDone();
      return;
    }
    dedupeRef.current = { key, t: now };
    lastRef.current = { lines: arr, onDone };
    // Reset any in-flight run WITHOUT triggering its onDone.
    doneRef.current = null;
    clearTimers();
    cancelSpeech();
    lineRef.current = -1;
    setCurrentLine(-1);
    doneRef.current = onDone || null;

    if (!arr.length) { finish(); return; }

    const voice = isAudioEnabled();
    if (voice) {
      setSpeaking(true);
      arr.forEach((l) => speak(l, { who: 'kabir', voice: 'kabir' }));
      // Backstop: if onEnd never arrives (network error), resolve anyway.
      const total = arr.reduce((s, l) => s + readMs(l), 0) + 8000;
      safetyRef.current = setTimeout(() => finish(), total);
    } else {
      // Silent mode — step the highlight through each line, then resolve.
      setSpeaking(true);
      let acc = 0;
      arr.forEach((l, i) => {
        timersRef.current.push(setTimeout(() => setCurrentLine(i), acc));
        acc += readMs(l);
      });
      timersRef.current.push(setTimeout(() => finish(), acc + 300));
    }
  }, [finish]);

  const replay = useCallback((lines) => {
    const arr = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    doneRef.current = null;
    clearTimers();
    cancelSpeech();
    lineRef.current = -1;
    setCurrentLine(-1);
    if (!arr.length) return;
    if (isAudioEnabled()) {
      setSpeaking(true);
      arr.forEach((l) => speak(l, { who: 'kabir', voice: 'kabir' }));
    } else {
      setSpeaking(true);
      let acc = 0;
      arr.forEach((l, i) => { timersRef.current.push(setTimeout(() => setCurrentLine(i), acc)); acc += readMs(l); });
      timersRef.current.push(setTimeout(() => { setSpeaking(false); setCurrentLine(-1); }, acc + 300));
    }
  }, []);

  /** Re-run the most recent narrate() (same lines + gating). Used when audio
   *  is unlocked after a scene already mounted in silent mode, so the current
   *  scene actually reads aloud. */
  const restart = useCallback(() => {
    const last = lastRef.current;
    if (last) narrate(last.lines, last.onDone);
  }, [narrate]);

  const skip = useCallback(() => { cancelSpeech(); finish(); }, [finish]);
  const stop = useCallback(() => { doneRef.current = null; cancelSpeech(); clearTimers(); setSpeaking(false); setCurrentLine(-1); }, []);

  /** One-off line (feedback, toasts) that doesn't gate progression. */
  const say = useCallback((line) => { if (line && isAudioEnabled()) speak(line, { who: 'kabir', voice: 'kabir' }); }, []);

  return { speaking, amplitude, currentLine, narrate, replay, restart, skip, stop, say };
}
