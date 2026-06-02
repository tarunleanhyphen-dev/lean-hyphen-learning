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
  Screen1Intro, Screen2Vibe, Screen2Rules, Screen3Sort,
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
  'screen-2-vibe':     'hero',     // background room not visible on this screen
  'screen-2-rules':    'rules',
  'screen-3-sort':     'sort',
  'screen-4-shop':     'shop',
  'screen-5-events':   'events',
  'screen-6-snapshot': 'snapshot',
};

/* Per-screen music mood. Lofi for active interactions, calm for narration. */
const MOOD_FOR_SCREEN = {
  'screen-1-intro':    'calm',
  'screen-2-vibe':     'calm',
  'screen-2-rules':    'calm',
  'screen-3-sort':     'lofi',
  'screen-4-shop':     'lofi',
  'screen-5-events':   'thinking',
  'screen-6-snapshot': 'reflective',
};

const ORBIT_ON = new Set(['screen-1-intro', 'screen-6-snapshot']);
/* Scene 1 + Scene 2 both own their own full-screen layout; the global
 * background room/status bar/HUD shouldn't be rendered behind them. */
const OWN_LAYOUT = new Set(['screen-1-intro', 'screen-2-vibe']);
const AUDIO_PREF_KEY = 'lh.makeover.audio.v3';

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

  /* Auto-unlock audio context on the very first user interaction anywhere
   * on the page. Without this, TTS + sound effects silently fail because
   * the AudioContext stays suspended. Listener self-removes after firing. */
  useEffect(() => {
    if (musicOn) return undefined;
    const unlock = async () => {
      try { await unlockAudio(true); } catch { /* noop */ }
    };
    const handler = () => {
      unlock();
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [musicOn]);

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

  /** Full audio — music + narrator voice + sound effects. */
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

  /** Voice-only — narrator + sfx (unlocks audio context) but no music. */
  const handleVoiceOnly = useCallback(async () => {
    try {
      await unlockAudio(true);
      setMusicOn(false);
      try { localStorage.setItem(AUDIO_PREF_KEY, 'voice-only'); } catch { /* noop */ }
      setPrompted(true);
    } catch (e) {
      console.warn('[audio] unlock failed:', e?.message);
      setPrompted(true);
    }
  }, []);

  /** Fully silent — no music, no voice, no sfx. */
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

  // Scene 1 (intro) and Scene 2 (vibe) own their own full-screen layout
  // and shouldn't be covered by the global background room / status bar / HUD.
  const ownsLayout = OWN_LAYOUT.has(mk.state.screen);

  return (
    <div
      className={`wmg wmg--${mk.state.vibe || 'cosy'} ${ownsLayout ? 'wmg--ownlayout' : ''} ${mk.state.screen === 'screen-1-intro' ? 'wmg--scene1' : ''}`}
      style={{ '--accent': vibe.accent }}
    >
      {!ownsLayout && (
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
      )}

      {!ownsLayout && (
        <SceneStatusBar
          screenId={mk.state.screen}
          accent={vibe.accent}
          music={musicOn}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {showHud && !ownsLayout && <TopHUD mk={mk} accent={vibe.accent} />}

      <main className={`wmg__main ${ownsLayout ? 'wmg__main--scene1' : ''}`}>
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
            {mk.state.screen === 'screen-2-vibe'     && <Screen2Vibe     mk={mk} />}
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
              <div className="audiocard__title">Hear the narrator?</div>
              <div className="audiocard__sub">Maya guides you through the makeover. Pick voice-only for narration without music, or full audio with lo-fi underneath.</div>
            </div>
            <div className="audiocard__actions">
              <button className="audiocard__btn audiocard__btn--ghost" onClick={handleSkipAudio} aria-label="Silent">
                <X size={14} /> Silent
              </button>
              <button className="audiocard__btn audiocard__btn--secondary" onClick={handleVoiceOnly} aria-label="Voice only">
                Voice only
              </button>
              <button className="audiocard__btn audiocard__btn--primary" onClick={handleEnableAudio}>
                Full audio
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
