/**
 * Style Coach — the narrator for Lesson 2 (Aarav, a friendly schoolboy guide).
 *
 * A clean Notion-style DiceBear avatar (boy with round glasses) in a glassy
 * floating card, plus a speech bubble that advances a list of narration lines
 * with a typewriter effect. Crucially, each line is also spoken aloud via the
 * cloud TTS narrator voice, and — when `autoAdvance` is set — the card only
 * moves to the next line once the current line has finished being read. When
 * audio is unavailable (silent mode) it falls back to a typewriter timer so
 * the flow never stalls.
 *
 * Use anywhere narration is needed:
 *   <StyleCoach lines={["Hello", "Welcome"]} onDone={...} autoAdvance />
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import * as notionists from '@dicebear/notionists';
import { ChevronRight, SkipForward } from 'lucide-react';
import { speak, cancelSpeech, isAudioReady, setSpeechCallbacks } from '../../../../utils/sounds.js';

const SEED = 'aarav-lean-hyphen-v1';

/* Pre-rendered avatar data URIs — generated once at module load.
 * glassesProbability 100 → Nobita-style round specs on a cheerful boy. */
function boy(bg) {
  return createAvatar(notionists, {
    seed: SEED,
    backgroundColor: [bg],
    backgroundType: ['solid'],
    glassesProbability: 100,
  }).toDataUri();
}
const AVATARS = {
  cosy:    boy('F59E0B'),
  study:   boy('10B981'),
  gamer:   boy('8B5CF6'),
  minimal: boy('06B6D4'),
  default: boy('10B981'),
};

const CHARS_PER_TICK = 2;       // typewriter speed
const TICK_MS = 18;             // typewriter cadence
const FALLBACK_ADVANCE_MS = 2600; // silent-mode pause after a line finishes

export function StyleCoach({ lines, vibeId = 'default', name = 'Aarav', onDone, autoAdvance = false }) {
  const safeLines = useMemo(() => (lines || []).filter(Boolean), [lines]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const tickRef = useRef(null);
  const advanceRef = useRef(null);
  const avatar = AVATARS[vibeId] || AVATARS.default;

  const current = safeLines[lineIdx] || '';
  const isTyping = charIdx < current.length;
  const isLastLine = lineIdx >= safeLines.length - 1;

  // Reset when the lines array identity changes (new screen / new narration).
  useEffect(() => {
    setLineIdx(0);
    setCharIdx(0);
  }, [safeLines]);

  // Advance to the next line, or finish.
  function goNext() {
    if (isLastLine) { onDone?.(); return; }
    setLineIdx((i) => i + 1);
    setCharIdx(0);
  }

  /* Speech master: speak each line as it becomes current. When audio is
   * ready, advancement is driven by the speech `onEnd` callback so we never
   * cut a line short. When audio is unavailable, a timer (below) takes over. */
  useEffect(() => {
    if (!current) return undefined;
    if (!isAudioReady()) return undefined;
    cancelSpeech();
    setSpeechCallbacks({
      onEnd: () => {
        if (autoAdvance) {
          // small breath, then advance / finish
          advanceRef.current = setTimeout(() => goNext(), 450);
        }
      },
    });
    try { speak(current, { voice: 'narrator', who: 'narrator' }); } catch { /* noop */ }
    return () => {
      clearTimeout(advanceRef.current);
      setSpeechCallbacks(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIdx, safeLines]);

  // Stop any speech when the coach unmounts.
  useEffect(() => () => { cancelSpeech(); setSpeechCallbacks(null); }, []);

  // Typewriter tick (visual). Falls back to driving advancement in silent mode.
  useEffect(() => {
    if (!current) return undefined;
    if (!isTyping) {
      if (autoAdvance && !isAudioReady()) {
        const t = setTimeout(goNext, FALLBACK_ADVANCE_MS);
        return () => clearTimeout(t);
      }
      return undefined;
    }
    tickRef.current = setTimeout(() => {
      setCharIdx((c) => Math.min(current.length, c + CHARS_PER_TICK));
    }, TICK_MS);
    return () => clearTimeout(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, charIdx, isTyping, autoAdvance, isLastLine]);

  function next() {
    if (isTyping) { setCharIdx(current.length); return; } // skip typewriter
    clearTimeout(advanceRef.current);
    cancelSpeech();
    goNext();
  }

  function skipAll() {
    clearTimeout(advanceRef.current);
    cancelSpeech();
    setLineIdx(safeLines.length - 1);
    setCharIdx((safeLines[safeLines.length - 1] || '').length);
    setTimeout(() => onDone?.(), 200);
  }

  if (!safeLines.length) return null;

  return (
    <motion.div
      className="coach"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      <motion.div
        className="coach__avatar"
        animate={isTyping
          ? { y: [0, -1.4, 0], transition: { duration: 0.24, repeat: Infinity } }
          : { y: 0 }}
      >
        <img src={avatar} alt={`${name} avatar`} draggable={false} />
        {isTyping && <span className="coach__pulse" />}
      </motion.div>

      <div className="coach__card">
        <div className="coach__head">
          <div>
            <span className="coach__name">{name}</span>
            <span className="coach__role">your design buddy</span>
          </div>
          <div className="coach__dots">
            {safeLines.map((_, i) => (
              <span key={i} className={`coach__dot ${i === lineIdx ? 'is-active' : ''} ${i < lineIdx ? 'is-done' : ''}`} />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIdx}
            className="coach__line"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {current.slice(0, charIdx)}
            {isTyping && <span className="coach__caret">|</span>}
          </motion.p>
        </AnimatePresence>
        <div className="coach__actions">
          {safeLines.length > 1 && !isLastLine && (
            <button className="coach__btn coach__btn--ghost" onClick={skipAll} aria-label="Skip narration">
              <SkipForward size={13} /> Skip
            </button>
          )}
          <button className="coach__btn coach__btn--primary" onClick={next} aria-label="Continue">
            {isTyping ? 'Show me' : isLastLine ? 'Continue' : 'Next'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
