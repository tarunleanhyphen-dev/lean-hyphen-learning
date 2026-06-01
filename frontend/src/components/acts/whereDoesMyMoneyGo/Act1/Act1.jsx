/**
 * Act 1 — Dream Bedroom Makeover · v3 composition.
 *
 * Layers (bottom → top):
 *   [Room3D]         persistent 3D backdrop with Maya + dust motes + breathing light
 *   [Vignette]       soft darken at edges
 *   [TopHUD]         live budget tracker (hidden on intro)
 *   [StyleCoach]     top-left narrator card
 *   [SceneStatusBar] top-center "Now: <scene>" pill with progress + music toggle
 *   [Stage]          bottom-center interactive surface
 *   [AudioUnlock]    first-run modal asking permission for music + speech
 *
 * The 3D camera shot is keyed off the active screen so we get cinematic
 * reframes; the in-room character changes pose per screen too.
 */
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Music2, X } from 'lucide-react';
import { Room3D, VIBES } from './Room3D.jsx';
import {
  Screen1Intro, Screen2Rules, Screen3Sort,
  Screen4Shop, Screen5Events, Screen6Snapshot,
} from './Screens.jsx';
import { TopHUD } from './TopHUD.jsx';
import { SceneStatusBar } from './SceneStatusBar.jsx';
import { useMakeoverState } from './useMakeoverState.js';
import {
  unlockAudio, isAudioReady,
  startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
} from '../../../../utils/sounds.js';
import './act1.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.status === 204 ? null : res.json();
}

const SHOT_FOR_SCREEN = {
  'screen-1-intro':    'hero',
  'screen-2-rules':    'rules',
  'screen-3-sort':     'sort',
  'screen-4-shop':     'shop',
  'screen-5-events':   'events',
  'screen-6-snapshot': 'snapshot',
};

/* Per-screen music mood. Lofi for active interactions, calm for narration. */
const MOOD_FOR_SCREEN = {
  'screen-1-intro':    'calm',
  'screen-2-rules':    'calm',
  'screen-3-sort':     'lofi',
  'screen-4-shop':     'lofi',
  'screen-5-events':   'thinking',
  'screen-6-snapshot': 'reflective',
};

const ORBIT_ON = new Set(['screen-1-intro', 'screen-6-snapshot']);
const AUDIO_PREF_KEY = 'lh.makeover.audio.v2';

export default function WhereDoesMyMoneyGoAct1() {
  const mk = useMakeoverState();
  const vibe = VIBES[mk.state.vibe] || VIBES.cosy;
  const purchasedIds = mk.state.cart;
  const shot = SHOT_FOR_SCREEN[mk.state.screen] || 'hero';
  const orbit = ORBIT_ON.has(mk.state.screen);

  const [musicOn, setMusicOn]       = useState(false);
  const [audioPrompted, setPrompted] = useState(() => {
    try { return localStorage.getItem(AUDIO_PREF_KEY) !== null; } catch { return false; }
  });
  const [audioCardShown, setAudioCardShown] = useState(false);
  const showHud = mk.state.screen !== 'screen-1-intro';

  // Auto-show the audio prompt 1.2s after mount so it doesn't fight the hero title.
  useEffect(() => {
    if (audioPrompted) return undefined;
    const t = setTimeout(() => setAudioCardShown(true), 1200);
    return () => clearTimeout(t);
  }, [audioPrompted]);

  /* Track act_started once on mount */
  useEffect(() => {
    apiPost('/api/progress', {
      sessionId: mk.state.sessionId,
      lessonId: 'where-does-my-money-go',
      actId: 'act1',
      status: 'started',
    }).catch(() => { /* offline-friendly */ });
  }, [mk.state.sessionId]);

  /* Drive music mood per screen */
  useEffect(() => {
    if (musicOn && isAudioReady()) {
      setMusicMood(MOOD_FOR_SCREEN[mk.state.screen] || 'calm');
    }
  }, [mk.state.screen, musicOn]);

  /* Stop music on unmount */
  useEffect(() => () => { stopMusic(); }, []);

  const handleEnableAudio = useCallback(async () => {
    try {
      await unlockAudio(true);
      startMusic();
      setMusicMood(MOOD_FOR_SCREEN[mk.state.screen] || 'calm');
      setMusicOn(true);
      try { localStorage.setItem(AUDIO_PREF_KEY, 'enabled'); } catch { /* noop */ }
      setPrompted(true);
    } catch (e) {
      console.warn('[audio] unlock failed:', e?.message);
      setPrompted(true);
    }
  }, [mk.state.screen]);

  const handleSkipAudio = useCallback(() => {
    try { localStorage.setItem(AUDIO_PREF_KEY, 'skipped'); } catch { /* noop */ }
    setPrompted(true);
  }, []);

  const handleToggleMusic = useCallback(async () => {
    if (!isAudioReady()) {
      // First click also unlocks audio if user dismissed prompt.
      try { await unlockAudio(true); } catch { return; }
      startMusic();
      setMusicMood(MOOD_FOR_SCREEN[mk.state.screen] || 'calm');
      setMusicOn(true);
      return;
    }
    if (musicOn) { pauseMusic(); setMusicOn(false); }
    else         { resumeMusic(); setMusicOn(true); }
  }, [musicOn, mk.state.screen]);

  async function handleComplete(payload) {
    try {
      await apiPost('/api/makeover-runs', {
        sessionId: mk.state.sessionId,
        lessonId: 'where-does-my-money-go',
        actId: 'act1',
        vibe: mk.state.vibe,
        cart: mk.state.cart,
        sortAnswers: mk.state.sortAnswers,
        spent: payload.spent,
        categoryTotals: payload.categoryTotals,
        needsTotal: payload.needsTotal,
        wantsTotal: payload.wantsTotal,
        reserveStatus: payload.reserveStatus,
        reserveRemaining: mk.state.reserve,
        savings: mk.state.savings,
        fixedEventChoice: mk.state.fixedEventChoice,
        randomEventId: mk.state.randomEvent?.id,
        randomEventChoice: mk.state.randomEventChoice,
        snapshotMcq: mk.state.snapshotMcq,
        insights: payload.insights,
      });
      await apiPost('/api/progress', {
        sessionId: mk.state.sessionId,
        lessonId: 'where-does-my-money-go',
        actId: 'act1',
        status: 'completed',
      });
    } catch (err) {
      console.warn('[makeover] save failed:', err.message);
    }
    alert("You're done with Act 1! Act 2 is up next (coming soon).");
  }

  return (
    <div className={`wmg wmg--${mk.state.vibe || 'cosy'}`} style={{ '--accent': vibe.accent }}>
      <div className="wmg__bg">
        <Room3D
          vibeId={mk.state.vibe || 'cosy'}
          purchasedIds={purchasedIds}
          shot={shot}
          orbit={orbit}
          showCharacter
          speaking={false}
        />
        <div className="wmg__vignette" />
      </div>

      <SceneStatusBar
        screenId={mk.state.screen}
        accent={vibe.accent}
        music={musicOn}
        onToggleMusic={handleToggleMusic}
      />

      {showHud && <TopHUD mk={mk} accent={vibe.accent} />}

      <main className="wmg__main">
        <AnimatePresence mode="wait">
          <motion.div
            key={mk.state.screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {mk.state.screen === 'screen-1-intro'    && <Screen1Intro    mk={mk} />}
            {mk.state.screen === 'screen-2-rules'    && <Screen2Rules    mk={mk} />}
            {mk.state.screen === 'screen-3-sort'     && <Screen3Sort     mk={mk} />}
            {mk.state.screen === 'screen-4-shop'     && <Screen4Shop     mk={mk} />}
            {mk.state.screen === 'screen-5-events'   && <Screen5Events   mk={mk} />}
            {mk.state.screen === 'screen-6-snapshot' && <Screen6Snapshot mk={mk} onComplete={handleComplete} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {!audioPrompted && audioCardShown && (
          <motion.div
            className="audiocard"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <div className="audiocard__icon"><Music2 size={20} /></div>
            <div className="audiocard__body">
              <div className="audiocard__title">Calm coding lo-fi?</div>
              <div className="audiocard__sub">Soft background music makes the makeover feel right. You can toggle it any time.</div>
            </div>
            <div className="audiocard__actions">
              <button className="audiocard__btn audiocard__btn--ghost" onClick={handleSkipAudio} aria-label="Skip">
                <X size={14} /> Skip
              </button>
              <button className="audiocard__btn audiocard__btn--primary" onClick={handleEnableAudio}>
                Play music
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
