/**
 * Style Coach — the narrator for Lesson 2.
 *
 * Replaces the procedural 3D character from v1. A clean Notion-style
 * DiceBear avatar in a glassy floating card, plus a speech bubble that
 * advances a list of narration lines with a typewriter effect. The mouth
 * micro-bobs while a line is "speaking" — gives the figure life without
 * needing actual lip sync.
 *
 * Use anywhere narration is needed:
 *   <StyleCoach lines={["Hello", "Welcome"]} onDone={...} />
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import * as notionists from '@dicebear/notionists';
import { ChevronRight, SkipForward } from 'lucide-react';

const SEED = 'lean-hyphen-style-coach-v3';

/* Pre-rendered avatar data URIs — generated once at module load. */
const AVATARS = {
  cosy:    createAvatar(notionists, { seed: SEED, backgroundColor: ['F59E0B'], backgroundType: ['solid'] }).toDataUri(),
  study:   createAvatar(notionists, { seed: SEED, backgroundColor: ['10B981'], backgroundType: ['solid'] }).toDataUri(),
  gamer:   createAvatar(notionists, { seed: SEED, backgroundColor: ['8B5CF6'], backgroundType: ['solid'] }).toDataUri(),
  minimal: createAvatar(notionists, { seed: SEED, backgroundColor: ['06B6D4'], backgroundType: ['solid'] }).toDataUri(),
  default: createAvatar(notionists, { seed: SEED, backgroundColor: ['10B981'], backgroundType: ['solid'] }).toDataUri(),
};

const CHARS_PER_TICK = 2;       // typewriter speed
const TICK_MS = 18;             // typewriter cadence
const POST_LINE_DELAY = 200;    // pause after a line finishes

export function StyleCoach({ lines, vibeId = 'default', name = 'Style Coach', onDone, autoAdvance = false, persistKey }) {
  const safeLines = useMemo(() => (lines || []).filter(Boolean), [lines]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const tickRef = useRef(null);
  const avatar = AVATARS[vibeId] || AVATARS.default;

  const current = safeLines[lineIdx] || '';
  const isTyping = charIdx < current.length;
  const isLastLine = lineIdx >= safeLines.length - 1;

  // Reset typewriter when the lines array identity changes (new screen).
  useEffect(() => {
    setLineIdx(0);
    setCharIdx(0);
  }, [safeLines]);

  // Typewriter tick
  useEffect(() => {
    if (!current) return;
    if (!isTyping) {
      if (autoAdvance && !isLastLine) {
        const t = setTimeout(() => { setLineIdx((i) => i + 1); setCharIdx(0); }, 1400);
        return () => clearTimeout(t);
      }
      return;
    }
    tickRef.current = setTimeout(() => {
      setCharIdx((c) => Math.min(current.length, c + CHARS_PER_TICK));
    }, TICK_MS);
    return () => clearTimeout(tickRef.current);
  }, [current, charIdx, isTyping, autoAdvance, isLastLine]);

  function next() {
    if (isTyping) {
      // Skip typewriter to end of current line.
      setCharIdx(current.length);
      return;
    }
    if (!isLastLine) {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
      return;
    }
    onDone?.();
  }

  function skipAll() {
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
            <span className="coach__role">your design coach</span>
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
