/**
 * Kabir's narrator card. Shows the boy lip-syncing to the TTS, renders the
 * lines as subtitles with the active line highlighted, and offers Replay /
 * Skip. The owning screen drives narration and gates its CTA on completion.
 */
import { motion } from 'framer-motion';
import { SkipForward, RotateCcw, Volume2 } from 'lucide-react';
import { Kabir } from './Kabir.jsx';

export function NarratorCard({
  narration, lines, mood = 'happy', accent = '#A855F7',
  onReplay, onSkip, done = false, size = 124, compact = false, hideAvatar = false,
}) {
  const { speaking, amplitude, currentLine } = narration;
  const arr = Array.isArray(lines) ? lines : [lines];

  return (
    <div className={`dbm-narrator ${compact ? 'dbm-narrator--compact' : ''} ${hideAvatar ? 'dbm-narrator--textonly' : ''}`} style={{ '--accent': accent }}>
      {!hideAvatar && (
        <div className="dbm-narrator__avatar">
          <Kabir mood={speaking ? 'happy' : mood} speaking={speaking} amplitude={amplitude} size={size} accent={accent} />
          <div className="dbm-narrator__name">
            Kabir
            {speaking && (
              <span className="dbm-narrator__wave"><i /><i /><i /><i /></span>
            )}
          </div>
        </div>
      )}

      <div className="dbm-narrator__body">
        {hideAvatar && (
          <div className="dbm-narrator__name dbm-narrator__name--inline">
            Kabir {speaking && <span className="dbm-narrator__wave"><i /><i /><i /><i /></span>}
          </div>
        )}
        <div className="dbm-narrator__lines">
          {arr.map((l, i) => (
            <motion.p
              key={i}
              className={`dbm-line ${i === currentLine ? 'is-active' : ''} ${currentLine > i || (done && currentLine === -1) ? 'is-done' : ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {l}
            </motion.p>
          ))}
        </div>

        <div className="dbm-narrator__controls">
          <button className="dbm-iconbtn" onClick={onReplay} title="Replay narration">
            <RotateCcw size={14} /> Replay
          </button>
          {!done && (
            <button className="dbm-iconbtn dbm-iconbtn--skip" onClick={onSkip} title="Skip narration">
              Skip <SkipForward size={14} />
            </button>
          )}
          {speaking && <span className="dbm-narrator__speaking"><Volume2 size={13} /> reading…</span>}
        </div>
      </div>
    </div>
  );
}
