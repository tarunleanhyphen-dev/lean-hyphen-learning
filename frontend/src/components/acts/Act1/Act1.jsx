import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import PhoneFrame from '../../shared/PhoneFrame.jsx';
import SpeechBubble from '../../shared/SpeechBubble.jsx';
import CharacterSpotlight from '../../shared/CharacterSpotlight.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import ReflectionPrompt from '../../shared/ReflectionPrompt.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import InsightCallout from '../../shared/InsightCallout.jsx';
import DecisionTimeline from '../../shared/DecisionTimeline.jsx';
import MockShoppingApp from '../../phone/MockShoppingApp.jsx';
import { lesson, intendedBudget, products } from '../../../data/lessons/thinkBeforeYouSpend.js';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { api } from '../../../utils/api.js';
import { sounds, unlockAudio, startMusic, stopMusic, setMusicMood } from '../../../utils/sounds.js';

/**
 * Derive a finer-grained emotion per phase id so Shanaya keeps changing
 * expression instead of holding one face per scene.
 */
function emotionFor(phase, sceneEmotion) {
  if (!phase?.id) return sceneEmotion;
  if (phase.emotion) return phase.emotion;
  const id = phase.id;
  if (id === 's1-search') return 'curious';
  if (id === 's1-show-shoes') return 'excited';
  if (id === 's1-add-shoes' || id === 's1-validate') return 'happy';
  if (id.startsWith('s2-w1-bubble')) return 'tempted';
  if (id === 's2-w1-add' || id === 's2-w2-add' || id === 's2-w3-add') return 'excited';
  if (id.startsWith('s2-w2-bubble')) return 'tempted';
  if (id === 's2-w3-card') return 'shocked';
  if (id.startsWith('s2-w3-bubble')) return 'tempted';
  if (id === 's3-banner-in') return 'shocked';
  if (id.startsWith('s3-think') || id.startsWith('s3-fbt-bubble')) return 'tempted';
  if (id === 's3-unlock') return 'excited';
  if (id === 's4-freeze' || id === 's4-cart-open' || id === 's4-total-build') return 'shocked';
  if (id === 's4-gap') return 'unsettled';
  if (id.startsWith('s4-realisation')) return 'guilty';
  if (id === 's4-reflect') return 'realised';
  return sceneEmotion;
}

export default function Act1({ onComplete }) {
  const act = lesson.acts.act1;

  const { phases, phaseToScene } = useMemo(() => {
    const flat = [];
    const map = [];
    act.scenes.forEach((scene, sIdx) => {
      scene.phases.forEach((p) => { flat.push(p); map.push(sIdx); });
    });
    return { phases: flat, phaseToScene: map };
  }, [act.scenes]);

  const seq = useSequencer(phases);
  const sceneIdx = phaseToScene[seq.index] ?? 0;
  const scene = act.scenes[sceneIdx];
  const phase = seq.phase;
  const currentEmotion = emotionFor(phase, scene.emotion);

  const phoneState = useMemo(() => {
    for (let i = seq.index; i >= 0; i -= 1) {
      if (phases[i]?.phone) return phases[i].phone;
    }
    return {};
  }, [seq.index, phases]);
  const activeBubbles = phase?.bubbles || [];

  const timeline = useMemo(() => {
    const trail = [];
    for (let i = 0; i <= seq.index; i += 1) {
      const item = phases[i]?.addedItem;
      if (item) trail.push(item);
    }
    return trail;
  }, [seq.index, phases]);

  const [saving, setSaving] = useState(false);
  const [showAudioConsent, setShowAudioConsent] = useState(true);
  const { sessionId, audioEnabled, setAudioEnabled, setReflection, setActStatus } = useLesson();

  /* -------- Audio (music + cues only — no TTS) -------- */
  const lastCuePhaseId = useRef(null);
  useEffect(() => {
    if (!phase) return;
    if (lastCuePhaseId.current === phase.id) return;
    lastCuePhaseId.current = phase.id;
    if (audioEnabled && phase.cue && sounds[phase.cue]) sounds[phase.cue]();
  }, [phase, audioEnabled]);

  useEffect(() => {
    if (!audioEnabled) return;
    setMusicMood(
      scene.ambience === 'silent' ? 'silent'
      : scene.ambience === 'reflective' ? 'reflective'
      : 'cosy'
    );
  }, [audioEnabled, scene.ambience]);

  useEffect(() => () => stopMusic(), []);

  useEffect(() => {
    unlockAudio(audioEnabled);
    if (audioEnabled) startMusic();
    else stopMusic();
  }, [audioEnabled]);

  const enableAudio = useCallback(async () => {
    await unlockAudio(true);
    setAudioEnabled(true);
    setShowAudioConsent(false);
    startMusic();
  }, [setAudioEnabled]);

  const dismissAudio = useCallback(() => setShowAudioConsent(false), []);

  /* -------- Reflection -------- */
  const handleReflectionSubmit = useCallback(async (response) => {
    setSaving(true);
    setReflection(lesson.id, 'act1', response);
    try {
      await api.saveReflection({
        lessonId: lesson.id,
        actId: 'act1',
        prompt: phase.reflection?.prompt || '',
        response,
        sessionId,
      });
    } catch { /* non-blocking */ }
    setSaving(false);
    setActStatus(lesson.id, 'act1', 'completed');
    onComplete?.({ response });
  }, [phase, onComplete, sessionId, setReflection, setActStatus]);

  const handleSkipReflection = useCallback(() => {
    setActStatus(lesson.id, 'act1', 'completed');
    onComplete?.({ response: null, skipped: true });
  }, [onComplete, setActStatus]);

  const replayScene = () => {
    let first = 0;
    for (let i = 0; i < phaseToScene.length; i += 1) {
      if (phaseToScene[i] === sceneIdx) { first = i; break; }
    }
    seq.goTo(first);
    seq.resume();
  };

  const cartIds = phoneState.cart || [];
  const cartTotal = cartIds.reduce((s, id) => s + (products[id]?.price || 0), 0);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="rounded-full bg-saffron-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-saffron-400 sm:px-3 sm:text-[11px]">
            <Sparkles className="mr-1 inline h-3 w-3 -translate-y-px" /> Lean Hyphen
          </span>
          <h1 className="text-[13px] font-semibold text-white/85 sm:text-base">{act.title}</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AudioToggle />
          <button
            onClick={seq.paused ? seq.resume : seq.pause}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/10 sm:px-3 sm:text-xs"
            aria-label={seq.paused ? 'Resume' : 'Pause'}
          >
            {seq.paused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
            <span className="hidden sm:inline">{seq.paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={replayScene}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/10 sm:px-3 sm:text-xs"
            aria-label="Replay this scene"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Replay</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showAudioConsent && !audioEnabled && (
          <AudioConsentBanner onEnable={enableAudio} onDismiss={dismissAudio} />
        )}
      </AnimatePresence>

      {/* Progress + meta */}
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <SceneProgress current={seq.index} total={phases.length} label={scene.title} />
      </div>

      {/* Stage */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        {/* LEFT: Spotlight + room + bubbles + timeline */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FCE7C0] via-[#FBEFDC] to-[#FFE3D3] p-4 ring-1 ring-cream-200/40 sm:p-6 lg:p-7">
          <RoomBackdrop ambience={scene.ambience} />
          <div className="relative flex h-full min-h-[560px] flex-col sm:min-h-[640px]">
            {/* Spotlight + scene tag */}
            <div className="flex flex-wrap items-center gap-4">
              <CharacterSpotlight emotion={currentEmotion} />
              <div className="flex-1 min-w-[140px]">
                <div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
                  Scene {sceneIdx + 1} of {act.scenes.length}
                </div>
                <div className="text-xl font-extrabold leading-tight text-ink-900 sm:text-2xl">
                  {scene.title}
                </div>
                <div className="mt-1 text-[12px] text-ink-700 sm:text-sm">
                  Birthday {lesson.hero.character.birthday} · Plan ₹{intendedBudget.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Narration */}
            <AnimatePresence mode="wait">
              {phase?.narration && (
                <motion.p
                  key={phase.id + '-narration'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mt-5 rounded-2xl bg-white/75 px-4 py-3 text-[15px] leading-relaxed text-ink-700 ring-1 ring-ink-300/15 sm:text-base"
                >
                  {phase.narration}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Speech */}
            <div className="mt-5 min-h-[120px]">
              <SpeechBubble bubbles={activeBubbles} speaker={lesson.hero.character} />
            </div>

            <SpendTracker total={cartTotal} showGap={phoneState.showGap} />

            <div className="mt-4">
              <DecisionTimeline entries={timeline} />
            </div>
          </div>
        </div>

        {/* RIGHT: Insight + phone */}
        <div className="relative flex flex-col items-stretch py-2">
          <InsightCallout insight={phase?.insight} />
          <div className="flex justify-center">
            <PhoneFrame dim={phoneState.dim}>
              <MockShoppingApp state={phoneState} />
            </PhoneFrame>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {phase?.reflection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 grid place-items-center bg-ink-900/70 px-4 backdrop-blur-sm"
          >
            <ReflectionPrompt
              prompt={phase.reflection.prompt}
              placeholder={phase.reflection.placeholder}
              onSubmit={handleReflectionSubmit}
              onSkip={handleSkipReflection}
            />
            {saving && (
              <div className="absolute bottom-4 right-4 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                Saving…
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!phase?.reflection && seq.isLast === false && seq.paused && (
        <div className="text-center text-xs text-white/50">Paused — press Resume to continue</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={seq.advance}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-white/80"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* =================== Subcomponents =================== */

function SpendTracker({ total, showGap }) {
  const pct = Math.min(100, (total / intendedBudget) * 100);
  const over = total > intendedBudget;
  return (
    <div className="mt-4 rounded-2xl bg-white/75 px-4 py-3 ring-1 ring-ink-300/15">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-ink-500">
        <span>Spend so far</span>
        <span className={over ? 'text-burgundy-500' : 'text-ink-700'}>
          ₹{total.toLocaleString('en-IN')} / ₹{intendedBudget.toLocaleString('en-IN')} plan
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-ink-300/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full ${over ? 'bg-burgundy-500' : 'bg-teal-500'}`}
        />
      </div>
      <AnimatePresence>
        {(over || showGap) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-1.5 text-[12px] font-bold text-burgundy-500 sm:text-sm"
          >
            ↑ {Math.round((total / intendedBudget - 1) * 100)}% over the original plan
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomBackdrop({ ambience }) {
  const dim = ambience === 'silent';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div animate={{ opacity: dim ? 0.15 : 0.5 }} transition={{ duration: 1.2 }} className="absolute -right-12 -top-10 h-56 w-56 rounded-full bg-saffron-400/55 blur-3xl" />
      <motion.div animate={{ opacity: dim ? 0.1 : 0.45 }} transition={{ duration: 1.2 }} className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-coral-400/45 blur-3xl" />
      <FloatingMotes />
      <span className="absolute right-6 top-6 text-2xl opacity-60">🎂</span>
      <span className="absolute left-6 bottom-8 text-xl opacity-50">🪞</span>
      <span className="absolute right-8 bottom-32 text-xl opacity-50">🛏️</span>
      <span className="absolute left-1/3 top-1/2 text-base opacity-40">💡</span>
    </div>
  );
}

function FloatingMotes() {
  const motes = useMemo(
    () => Array.from({ length: 10 }, (_, i) => ({
      id: i, x: 8 + ((i * 47) % 84), delay: i * 0.6, dur: 8 + (i % 5), size: 3 + (i % 4),
    })),
    []
  );
  return (
    <>
      {motes.map((m) => (
        <motion.span
          key={m.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: -60, opacity: [0, 0.55, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ left: `${m.x}%`, width: m.size, height: m.size }}
          className="absolute bottom-0 rounded-full bg-saffron-400/70"
        />
      ))}
    </>
  );
}
