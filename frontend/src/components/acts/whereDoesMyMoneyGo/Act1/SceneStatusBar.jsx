/**
 * Top-center "Now playing" status pill — mirrors Lesson 1's LiveStatus.
 *
 * Shows which scene is currently running with a pulsing accent dot and
 * the scene title. Updates smoothly when the screen changes.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { lesson } from '../../../../data/lessons/whereDoesMyMoneyGo.js';

const SHORT_TITLE = {
  'screen-1-intro':    'Scene 1 · The Big News',
  'screen-2-rules':    'Scene 2 · Ground Rules',
  'screen-3-sort':     'Scene 3 · Needs vs Wants',
  'screen-4-shop':     'Scene 4 · Shop Smart',
  'screen-5-events':   'Scene 5 · Plot Twists',
  'screen-6-snapshot': 'Scene 6 · Spending Snapshot',
};

export function SceneStatusBar({ screenId, accent = '#10B981', music, onToggleMusic }) {
  const title = SHORT_TITLE[screenId] || 'Loading';
  const scenes = lesson.acts.act1.scenes;
  const currentIdx = scenes.findIndex((s) => s.id === screenId);

  return (
    <motion.div
      className="statusbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      style={{ '--accent': accent }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          className="statusbar__pill"
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.24 }}
        >
          <span className="statusbar__dot">
            <span className="statusbar__dot-ping" />
            <span className="statusbar__dot-core" />
          </span>
          <span className="statusbar__nowlabel">NOW</span>
          <span className="statusbar__title">{title}</span>
        </motion.div>
      </AnimatePresence>

      <div className="statusbar__progress" aria-hidden>
        {scenes.map((s, i) => (
          <span
            key={s.id}
            className={`statusbar__step ${i === currentIdx ? 'is-active' : ''} ${i < currentIdx ? 'is-done' : ''}`}
          />
        ))}
      </div>

      {onToggleMusic && (
        <button
          className="statusbar__music"
          onClick={onToggleMusic}
          aria-label={music ? 'Mute background music' : 'Play background music'}
          title={music ? 'Music on — click to mute' : 'Music off — click to play'}
        >
          {music ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
      )}
    </motion.div>
  );
}
