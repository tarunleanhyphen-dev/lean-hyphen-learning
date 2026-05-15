import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Phase-driven scene sequencer.
 *
 * phases: [{ id, duration, hold? }, ...]
 *  - duration: ms before auto-advancing to next phase
 *  - hold: true to pause indefinitely (waits for resume())
 */
export function useSequencer(phases, { autoStart = true, onComplete } = {}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(!autoStart);
  const timer = useRef(null);

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const advance = useCallback(() => {
    clear();
    setIndex((i) => {
      const next = i + 1;
      if (next >= phases.length) {
        onComplete?.();
        return i;
      }
      return next;
    });
  }, [phases.length, onComplete]);

  const goTo = useCallback((i) => {
    clear();
    setIndex(Math.max(0, Math.min(phases.length - 1, i)));
  }, [phases.length]);

  const pause = useCallback(() => {
    clear();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  useEffect(() => {
    if (paused) return;
    const phase = phases[index];
    if (!phase) return;
    if (phase.hold) return; // waits until external resume / advance
    timer.current = setTimeout(advance, phase.duration ?? 1800);
    return clear;
  }, [index, paused, phases, advance]);

  return {
    phase: phases[index],
    index,
    total: phases.length,
    isLast: index === phases.length - 1,
    paused,
    advance,
    goTo,
    pause,
    resume,
  };
}
