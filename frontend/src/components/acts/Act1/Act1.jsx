import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import PhoneFrame from '../../shared/PhoneFrame.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import ThoughtImagery from '../../shared/ThoughtImagery.jsx';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import ReflectionPrompt from '../../shared/ReflectionPrompt.jsx';
import MultipleChoice from '../../shared/MultipleChoice.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import InsightCallout from '../../shared/InsightCallout.jsx';
import DecisionTimeline from '../../shared/DecisionTimeline.jsx';
import MockShoppingApp from '../../phone/MockShoppingApp.jsx';
import { lesson, intendedBudget, products } from '../../../data/lessons/thinkBeforeYouSpend.js';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { api } from '../../../utils/api.js';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, setSpeechCallbacks,
} from '../../../utils/sounds.js';

/**
 * Map (current emotion + scene ambience) → music mood key.
 * Exported so Act 2 (and future acts) can share the same mapping.
 *
 * The bias is: emotion wins. If Shanaya is shocked/realised/guilty, the
 * music should react regardless of which scene she's in. Falling back on
 * scene.ambience handles in-between phases where emotion is "neutral".
 */
export function pickMood(emotion, ambience) {
  if (ambience === 'silent') return 'silent';
  if (emotion === 'shocked')                                  return 'hit';
  if (emotion === 'unsettled' || emotion === 'guilty')        return 'thinking';
  if (emotion === 'realised')                                 return 'reflective';
  if (emotion === 'tempted' || emotion === 'curious')         return 'app-tempo';
  if (ambience === 'reflective')                              return 'reflective';
  if (ambience === 'app-tempo')                               return 'app-tempo';
  return 'calm';
}

function emotionFor(phase, sceneEmotion) {
  if (!phase?.id) return sceneEmotion;
  if (phase.emotion) return phase.emotion;
  const id = phase.id;
  if (id === 's1-search' || id.includes('results')) return 'curious';
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
  if (id === 's4-reflect' || id === 's4-mcq') return 'realised';
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

  const [saving, setSaving] = useState(false);
  const [completedHolds, setCompletedHolds] = useState(() => new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speaker, setSpeaker] = useState(null); // 'shanaya' | 'narrator' | null
  const [wordTick, setWordTick] = useState(0);
  // Real-time speech amplitude (0–1), sampled ~60×/s from the audio
  // analyser. Drives ShanayaAvatar's mouth open/close so lip-sync actually
  // matches the audio waveform instead of pulsing on every word.
  const mouthRef = useRef(0);

  const { sessionId, audioEnabled, setAudioEnabled, setAudioDismissed, setReflection, setActStatus, state: lessonState } = useLesson();
  // Hold the very first phase until the user has decided about audio —
  // otherwise the opening narration ("It is a quiet afternoon…") can fly past
  // before they click "Enable Audio", and the line never gets read aloud.
  // After that, hold only while speech is in flight so the student hears each
  // full line before the next phase appears.
  const audioDecided = audioEnabled || lessonState?.audioDismissed;
  const seq = useSequencer(phases, {
    holdWhile: isSpeaking || !audioDecided,
  });
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

  // Live "Now: …" status — carry forward the most recent non-empty status.
  const liveStatus = useMemo(() => {
    for (let i = seq.index; i >= 0; i -= 1) {
      if (phases[i]?.status) return phases[i].status;
    }
    return '';
  }, [seq.index, phases]);

  const timeline = useMemo(() => {
    const trail = [];
    for (let i = 0; i <= seq.index; i += 1) {
      const item = phases[i]?.addedItem;
      if (item) trail.push(item);
    }
    return trail;
  }, [seq.index, phases]);

  /* -------- Audio: music + cues + TTS w/ mouth events -------- */

  useEffect(() => {
    setSpeechCallbacks({
      onStart: (who) => { setIsSpeaking(true); setSpeaker(who || 'shanaya'); },
      onEnd:   () => { setIsSpeaking(false); setSpeaker(null); mouthRef.current = 0; },
      onWord:  () => setWordTick((t) => t + 1),
      // Stash amplitude into a ref (not state) so 60-fps updates don't
      // cause Act 1 to re-render every frame. ShanayaAvatar reads from
      // the ref on its own RAF loop.
      onAmplitude: (v) => { mouthRef.current = v; },
    });
    return () => setSpeechCallbacks(null);
  }, []);

  const lastCuePhaseId = useRef(null);
  useEffect(() => {
    if (!phase) return;
    if (lastCuePhaseId.current === phase.id) return;
    lastCuePhaseId.current = phase.id;
    if (audioEnabled && phase.cue && sounds[phase.cue]) sounds[phase.cue]();
  }, [phase, audioEnabled]);

  // Speak new bubbles + narration, deduped by text.
  // Quiz / reflection phases play with ONLY background music — when one
  // opens we cancel any in-flight speech so the previous beat's narration
  // doesn't bleed across into the silent quiz moment.
  const spokenTexts = useRef(new Set());
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    if (phase.mcq || phase.reflection) {
      cancelSpeech();
      return;
    }
    (phase.bubbles || []).forEach((b) => {
      if (!b?.text || spokenTexts.current.has(b.text)) return;
      spokenTexts.current.add(b.text);
      speak(b.text, { who: 'shanaya' });
    });
    if (phase.narration && !spokenTexts.current.has(phase.narration)) {
      spokenTexts.current.add(phase.narration);
      speak(phase.narration, { who: 'narrator' });
    }
  }, [phase, audioEnabled]);

  useEffect(() => {
    if (!audioEnabled) return;
    setMusicMood(pickMood(currentEmotion, scene.ambience));
  }, [audioEnabled, currentEmotion, scene.ambience]);

  useEffect(() => () => { stopMusic(); cancelSpeech(); }, []);

  useEffect(() => {
    unlockAudio(audioEnabled);
    if (audioEnabled) startMusic();
    else { stopMusic(); cancelSpeech(); }
  }, [audioEnabled]);

  // When the user pauses, mute the music bus + kill in-flight speech.
  // When they resume, fade the music back in.
  useEffect(() => {
    if (!audioEnabled) return;
    if (seq.paused) {
      cancelSpeech();
      pauseMusic();
    } else {
      resumeMusic();
    }
  }, [seq.paused, audioEnabled]);

  const enableAudio = useCallback(async () => {
    await unlockAudio(true);
    setAudioEnabled(true);
    startMusic();
  }, [setAudioEnabled]);

  const dismissAudio = useCallback(() => {
    setAudioEnabled(false);
    setAudioDismissed(true);
  }, [setAudioEnabled, setAudioDismissed]);

  /* -------- Reflections + MCQs (chained — last phase = act complete) -------- */

  const markHoldDone = useCallback((id) => {
    setCompletedHolds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const advanceOrFinish = useCallback((payload) => {
    if (seq.isLast) {
      setActStatus(lesson.id, 'act1', 'completed');
      onComplete?.(payload);
    } else {
      seq.advance();
    }
  }, [seq, onComplete, setActStatus]);

  const handleReflectionSubmit = useCallback(async (response) => {
    setSaving(true);
    setReflection(lesson.id, 'act1', response);
    try {
      await api.saveReflection({
        lessonId: lesson.id,
        actId: `act1:${phase.id}`,
        prompt: phase.reflection?.prompt || '',
        response,
        sessionId,
      });
    } catch { /* non-blocking */ }
    setSaving(false);
    markHoldDone(phase.id);
    advanceOrFinish({ kind: 'reflection', phaseId: phase.id, response });
  }, [phase, sessionId, setReflection, markHoldDone, advanceOrFinish]);

  const handleSkipReflection = useCallback(() => {
    markHoldDone(phase.id);
    advanceOrFinish({ kind: 'reflection', phaseId: phase.id, response: null, skipped: true });
  }, [phase, markHoldDone, advanceOrFinish]);

  const handleMcqContinue = useCallback(async ({ selected, correct }) => {
    try {
      await api.saveReflection({
        lessonId: lesson.id,
        actId: `act1:${phase.id}`,
        prompt: phase.mcq?.prompt || '',
        response: `kind=${phase.mcq?.kind || 'single'} selected=${JSON.stringify(selected)} correct=${correct}`,
        sessionId,
      });
    } catch { /* non-blocking */ }
    markHoldDone(phase.id);
    advanceOrFinish({ kind: 'mcq', phaseId: phase.id, selected, correct });
  }, [phase, sessionId, markHoldDone, advanceOrFinish]);

  const replayScene = () => {
    let first = 0;
    for (let i = 0; i < phaseToScene.length; i += 1) {
      if (phaseToScene[i] === sceneIdx) { first = i; break; }
    }
    spokenTexts.current.clear();
    seq.goTo(first);
    seq.resume();
  };

  const cartIds = phoneState.cart || [];
  const cartTotal = cartIds.reduce((s, id) => s + (products[id]?.price || 0), 0);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
      {/* Top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="/" aria-label="Lean Hyphen home" className="shrink-0">
            <img
              src="/lean-hyphen-logo.svg"
              alt="Lean Hyphen"
              className="h-8 w-auto sm:h-9"
              draggable={false}
            />
          </a>
          <span aria-hidden className="h-5 w-px bg-white/15 sm:h-6" />
          <h1 className="text-[13px] font-semibold text-white/85 sm:text-base">{act.title}</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AudioToggle />
          <button
            onClick={seq.paused ? seq.resume : seq.pause}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            {seq.paused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
            <span className="hidden sm:inline">{seq.paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={replayScene}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Replay</span>
          </button>
        </div>
      </header>

      {/* Audio banner — sticks around as long as audio is OFF so the user
         always has a one-tap way to turn voice + lip-sync on. The Web
         Speech API needs that tap to satisfy the browser autoplay policy. */}
      <AnimatePresence>
        {!audioEnabled && (
          <AudioConsentBanner onEnable={enableAudio} onDismiss={dismissAudio} />
        )}
      </AnimatePresence>

      <SceneProgress current={seq.index} total={phases.length} label={scene.title} />

      {/* Stage */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        {/* LEFT */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F8EFE0] via-[#FBF4E6] to-[#FFE9D9] p-4 ring-1 ring-ink-300/15 sm:p-6 lg:p-7">
          <RoomBackdrop ambience={scene.ambience} />

          <div className="relative flex h-full min-h-[640px] flex-col">
            {/* Scene tag */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
                Scene {sceneIdx + 1} of {act.scenes.length}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[11px] text-ink-500">Plan ₹{intendedBudget.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* AVATAR (left) + thought clouds (right) — side-by-side */}
            <div className="mt-2 flex flex-col">
              <div className="relative flex items-start gap-3 sm:gap-5">
                <div className="relative shrink-0">
                  <ShanayaAvatar
                    emotion={currentEmotion}
                    speaking={isSpeaking && speaker === 'shanaya'}
                    wordTick={wordTick}
                    amplitudeRef={mouthRef}
                    size="xl"
                  />
                  {/* Imagination clouds — only render when the current phase
                     supplies imagery (used by Scene 0's "she's picturing
                     birthday at the café / friends / outfits" beats). */}
                  <ThoughtImagery items={phase?.imagery || []} />
                </div>
                <div className="min-w-0 flex-1 pt-2 sm:pt-4">
                  <ThoughtBubble bubbles={activeBubbles} position="right" />
                </div>
              </div>

              <LiveStatus text={liveStatus} />

              <div className="mt-4 text-center sm:mt-5">
                <div className="text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
                  {scene.title}
                </div>
                <div className="mt-1 text-[12px] text-ink-700 sm:text-sm">
                  Birthday {lesson.hero.character.birthday} · plan ₹{intendedBudget.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Narration card — text from the narrator, not Shanaya */}
            <AnimatePresence mode="wait">
              {phase?.narration && (
                <motion.p
                  key={phase.id + '-narration'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mt-5 rounded-2xl bg-white/80 px-4 py-3 text-[14px] leading-relaxed text-ink-700 ring-1 ring-ink-300/15 sm:text-[15px]"
                >
                  <span className="mr-1 text-ink-500">🎙️</span>{phase.narration}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Spend tracker — below the avatar block */}
            <SpendTracker total={cartTotal} showGap={phoneState.showGap} />

            {/* Decision trail */}
            <div className="mt-4">
              <DecisionTimeline entries={timeline} />
            </div>
          </div>
        </div>

        {/* RIGHT — top-aligned with the scene tag row on the left column.
           Negative top margin pulls the phone column up so the phone's top
           edge sits flush with the left card's top, not the bottom of the
           InsightCallout (which only renders when there's an insight). */}
        <div className="relative flex flex-col items-stretch -mt-1 sm:-mt-2">
          <InsightCallout insight={phase?.insight} />
          <div className="flex justify-center">
            <PhoneFrame dim={phoneState.dim}>
              <MockShoppingApp state={phoneState} />
            </PhoneFrame>
          </div>
        </div>
      </div>

      {/* Reflection (free text) */}
      <AnimatePresence>
        {phase?.reflection && !completedHolds.has(phase.id) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto grid place-items-center bg-ink-900/70 px-4 py-4 backdrop-blur-sm"
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

      {/* MCQ (after free text) */}
      <AnimatePresence>
        {phase?.mcq && !completedHolds.has(phase.id) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto grid place-items-center bg-ink-900/70 px-4 py-4 backdrop-blur-sm"
          >
            <MultipleChoice
              prompt={phase.mcq.prompt}
              options={phase.mcq.options}
              explanation={phase.mcq.explanation}
              kind={phase.mcq.kind || 'single'}
              continueLabel={phase.mcq.continueLabel || 'Continue'}
              onContinue={handleMcqContinue}
              onSpeakTip={(tip) => audioEnabled && speak(tip, { who: 'shanaya' })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!phase?.reflection && !phase?.mcq && seq.isLast === false && seq.paused && (
        <div className="text-center text-xs text-white/50">Paused — press Resume to continue</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            spokenTexts.current.clear();
            seq.goTo(Math.max(0, seq.index - 1));
            seq.resume();
          }}
          disabled={seq.index === 0}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={seq.advance}
          className="inline-flex items-center gap-2 rounded-full bg-saffron-500 px-5 py-2.5 text-xs font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98]"
        >
          Next <ChevronRight className="h-4 w-4" />
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
    <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-ink-300/15">
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
      <motion.div animate={{ opacity: dim ? 0.18 : 0.4 }} transition={{ duration: 1.2 }} className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-saffron-400/45 blur-[80px]" />
      <motion.div animate={{ opacity: dim ? 0.12 : 0.36 }} transition={{ duration: 1.2 }} className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-coral-400/40 blur-[80px]" />
      <FloatingMotes />
      {/* Subtle grid pattern for a more grown-up backdrop */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lh-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#1A1426" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lh-grid)" />
      </svg>
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
