import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import PhoneFrame from '../../shared/PhoneFrame.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import ThoughtImagery from '../../shared/ThoughtImagery.jsx';
import SceneVignette from '../../shared/SceneVignette.jsx';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import ReflectionPrompt from '../../shared/ReflectionPrompt.jsx';
import MultipleChoice from '../../shared/MultipleChoice.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import InsightCallout from '../../shared/InsightCallout.jsx';
import EndOfActCelebration from '../../shared/EndOfActCelebration.jsx';
import DecisionTimeline from '../../shared/DecisionTimeline.jsx';
import InteractivePrompt from '../../shared/InteractivePrompt.jsx';
import MockShoppingApp from '../../phone/MockShoppingApp.jsx';
import { lesson, intendedBudget, products } from '../../../data/lessons/thinkBeforeYouSpend.js';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { api } from '../../../utils/api.js';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
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
  // Scene 1 — shopping for shoes
  if (id === 's1-search' || id.includes('results')) return 'curious';
  if (id === 's1-show-shoes' || id === 's1-show-shoes-2') return 'excited';
  if (id === 's1-add-shoes' || id === 's1-add-prompt') return 'happy';
  // Scene 2 — wave 1 (socks cross-sell)
  if (id.startsWith('s2-w1-bubble') || id === 's2-w1-detail') return 'tempted';
  if (id === 's2-w1-add' || id === 's2-w2-add' || id === 's2-w3-add') return 'excited';
  // Scene 2 — wave 2 (hoodie flash deal)
  if (id === 's2-w2-flash') return 'shocked';
  if (id.startsWith('s2-w2-bubble') || id === 's2-w2-detail') return 'tempted';
  // Scene 2 — wave 3 (free phone case + selfie light)
  if (id === 's2-w3-unlock') return 'shocked';
  if (id.startsWith('s2-w3-bubble') || id === 's2-w3-detail' || id === 's2-w3-rec') return 'tempted';
  // Scene 3 — final cart reveal + reflection
  if (id === 's3-cart-reveal' || id === 's3-cart-total' || id === 's3-saved-banner') return 'shocked';
  if (id === 's3-budget-flash' || id === 's3-zoom-shanaya') return 'unsettled';
  if (id.startsWith('s3-final-thought') || id === 's3-reflect') return 'realised';
  return sceneEmotion;
}

export default function Act1({ onComplete, onGoHome }) {
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
  // Distinct insight labels surfaced so far. Still tracked because the
  // end-of-act celebration uses tricksCount as a stat; we just no longer
  // display the live counter chip in the header.
  const tricksSeenRef = useRef(new Set());
  const [tricksCount, setTricksCount] = useState(0);

  const { sessionId, audioEnabled, setAudioEnabled, setAudioDismissed, setReflection, setActStatus, state: lessonState } = useLesson();

  // Analytics — fires structured events to /api/analytics/events for the
  // backend's scoring/reporting pipeline. Fire-and-forget; the underlying
  // client batches + retries so caller code stays clean.
  const analytics = useAnalytics({
    sessionId,
    lessonId: lesson.id,
    actId: 'act1',
  });
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

  // Fire `act_started` exactly once on mount. (Re-entries that pass
  // through the home page will create a new lesson session attempt
  // server-side; see the analytics readme for the attempt model.)
  useEffect(() => {
    analytics.actStarted();
    // The act-mount effect intentionally runs once. analytics is a
    // freshly-built object every render but each method just calls
    // the module-level track() so identity doesn't matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scene-enter / scene-complete tracking — fires on every scene boundary
  // so the backend can compute dwell time and completion-rate per scene.
  const sceneEnterRef = useRef({ sceneId: null, enteredAt: 0 });
  useEffect(() => {
    const sceneId = scene?.id;
    if (!sceneId) return undefined;
    // Close out the previous scene before opening the new one.
    const prev = sceneEnterRef.current;
    if (prev.sceneId && prev.sceneId !== sceneId) {
      analytics.sceneCompleted(prev.sceneId, {
        payload: { timeMs: Date.now() - prev.enteredAt },
      });
    }
    sceneEnterRef.current = { sceneId, enteredAt: Date.now() };
    analytics.sceneEntered(sceneId);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  const lastCuePhaseId = useRef(null);
  useEffect(() => {
    if (!phase) return;
    if (lastCuePhaseId.current === phase.id) return;
    lastCuePhaseId.current = phase.id;
    if (audioEnabled && phase.cue && sounds[phase.cue]) sounds[phase.cue]();
    // First time we see a given insight label, count it as a "trick spotted"
    // and play a small bell so the moment earns an audible win.
    const insight = phase.insight;
    if (insight?.label && !tricksSeenRef.current.has(insight.label)) {
      tricksSeenRef.current.add(insight.label);
      setTricksCount(tricksSeenRef.current.size);
      if (audioEnabled && sounds.aha) sounds.aha();
    }
  }, [phase, audioEnabled]);

  // Speak new bubbles + narration. Dedup is per-phase (not global) so when
  // bubble lists cumulate across consecutive phases — e.g. Phase A has
  // [X], Phase B has [X, Y] — Phase B still reads X *and* Y instead of
  // silently skipping X because it was spoken in Phase A. User feedback
  // ("why skipping first bubbles at many places??") traced back to this.
  const spokenTexts = useRef(new Set());
  const lastSpokenPhaseIdRef = useRef(null);
  // Track whether the current phase actually queued anything to be spoken.
  // The auto-advance-on-speech-end logic below only fires when this is true,
  // so silent visual phases (no narration, no new bubbles) still run their
  // full `duration`.
  const phaseSpokeRef = useRef(false);
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    if (phase.mcq || phase.reflection) {
      cancelSpeech();
      return;
    }
    // Reset the dedup set whenever the phase changes so every phase
    // reads its full bubble list.
    if (lastSpokenPhaseIdRef.current !== phase.id) {
      spokenTexts.current.clear();
      lastSpokenPhaseIdRef.current = phase.id;
    }
    let spokeNow = false;
    (phase.bubbles || []).forEach((b) => {
      if (!b?.text || spokenTexts.current.has(b.text)) return;
      spokenTexts.current.add(b.text);
      speak(b.text, { who: 'shanaya' });
      spokeNow = true;
    });
    if (phase.narration && !spokenTexts.current.has(phase.narration)) {
      spokenTexts.current.add(phase.narration);
      speak(phase.narration, { who: 'narrator' });
      spokeNow = true;
    }
    phaseSpokeRef.current = spokeNow;
  }, [phase, audioEnabled]);

  // Auto-advance on speech end — but honour `phase.duration` as a
  // MINIMUM total time on screen. Earlier this used a flat 450 ms buffer
  // after TTS ended, which made every per-phase duration increase
  // invisible (the user reported "I can't see the +2 s on scene 3"). Now
  // we wait until BOTH speech is done AND the phase has been on screen
  // for at least `phase.duration` ms before advancing.
  const prevSpeakingRef = useRef(false);
  const phaseStartedAtRef = useRef(Date.now());
  useEffect(() => {
    phaseStartedAtRef.current = Date.now();
  }, [phase?.id]);
  useEffect(() => {
    const wasSpeaking = prevSpeakingRef.current;
    prevSpeakingRef.current = isSpeaking;
    if (!audioEnabled || !phase) return;
    if (phase.hold) return;
    if (seq.paused) return;
    if (!phaseSpokeRef.current) return;
    if (wasSpeaking && !isSpeaking) {
      const minBufferMs = 450;
      const minDuration = Math.max(0, phase.duration || 0);
      const elapsed = Date.now() - phaseStartedAtRef.current;
      // Wait either: the speech-end breath buffer, OR however long is
      // left until the phase has been on screen for `duration` ms —
      // whichever is bigger. So a phase with duration 18000 stays on
      // screen for at least 18 s even if TTS finishes after 8 s.
      const remainingForDuration = Math.max(0, minDuration - elapsed);
      const wait = Math.max(minBufferMs, remainingForDuration);
      const t = setTimeout(() => {
        phaseSpokeRef.current = false;
        seq.advance();
      }, wait);
      return () => clearTimeout(t);
    }
  }, [isSpeaking, audioEnabled, phase, seq]);

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

  // When the user pauses, pause the music bus AND the in-flight speech.
  // pauseSpeech keeps the current audio element + queue intact so resume
  // picks up exactly where it left off (was cancelSpeech before, which
  // silently dropped whatever line was playing — the user reported the
  // speech not coming back after pause + resume).
  useEffect(() => {
    if (!audioEnabled) return;
    if (seq.paused) {
      pauseSpeech();
      pauseMusic();
    } else {
      resumeSpeech();
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

  // Show the celebration modal between "act finished" and the actual
  // navigation. Once the student clicks Continue, the navigation fires.
  const [showCelebration, setShowCelebration] = useState(false);
  const startTimeRef = useRef(Date.now());

  const advanceOrFinish = useCallback(() => {
    if (seq.isLast) {
      setActStatus(lesson.id, 'act1', 'completed');
      // Analytics: act completed. payload carries the wall-clock dwell
      // time so the backend doesn't need to derive it from event deltas.
      analytics.actCompleted({
        timeMs: Date.now() - startTimeRef.current,
      });
      setShowCelebration(true);
    } else {
      seq.advance();
    }
  }, [seq, setActStatus, analytics]);

  const finishAct = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
  }, [onComplete]);

  // Stats handed to the celebration modal. (Built below, after cartIds /
  // cartTotal are defined — those are const so we can't reference them
  // here without hitting the temporal-dead-zone.)

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

  const handlePromptClick = useCallback(() => {
    if (!phase?.prompt) return;
    if (sounds.tap) sounds.tap();
    // Analytics: each Add-to-Cart prompt is an "activity_completed" of
    // kind 'add-to-cart'. The activity id maps to the product so the
    // scoring engine can attribute points to the right cart step.
    const productId = phase.prompt.productId;
    if (productId) {
      analytics.activityCompleted(`add-${productId}`, {
        sceneId: scene?.id,
        payload: { kind: 'add-to-cart', detail: { productId } },
      });
    }
    markHoldDone(phase.id);
    advanceOrFinish({ kind: 'prompt', phaseId: phase.id, productId: phase.prompt.productId });
  }, [phase, scene?.id, markHoldDone, advanceOrFinish, analytics]);

  const replayScene = () => {
    // "Replay" restarts the whole act from phase 0 (scene 1) — used to
    // be "first phase of current scene only" but the user expects
    // Replay to mean a full restart.
    spokenTexts.current.clear();
    setCompletedHolds(new Set());
    cancelSpeech();
    seq.goTo(0);
    seq.resume();
  };

  const cartIds = phoneState.cart || [];
  const cartTotal = cartIds.reduce((s, id) => s + (products[id]?.price || 0), 0);

  // Phases 1–7 are pure storytelling (s0-intro / birthday / group-chat /
  // vision / app-open + s1-open / s1-intent). The phone column appears
  // from phase 8 (seq.index >= 7 → s1-search) — that's where Shanaya
  // opens the shopping app, the PhoneStartupSequence runs (iOS home →
  // tap Spree → app launch → typed search), and the results / PDP /
  // add-to-cart simulation takes over. Threshold updated after the
  // earlier s1-intent-1 + s1-intent-2 combine shifted phases up.
  const showPhone = seq.index >= 7;

  // Stats handed to the celebration modal. Computed lazily off cart, the
  // tricks-spotted count, and the wall-clock duration since mount. Lives
  // here (after cartIds / cartTotal) to avoid the TDZ.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const celebrationStats = useMemo(() => {
    const items = cartIds.length;
    const spent = `₹${cartTotal.toLocaleString('en-IN')}`;
    const overPct = Math.max(0, Math.round((cartTotal / intendedBudget - 1) * 100));
    const mins = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    return [
      { label: 'Tricks spotted', value: tricksCount, sub: 'out of 4' },
      { label: 'Items in cart',  value: items,       sub: 'vs 1 planned' },
      { label: 'Money spent',    value: spent,       sub: `+${overPct}% over plan` },
      { label: 'Time taken',     value: `${mins} min`, sub: 'self-paced' },
    ];
  }, [cartIds.length, cartTotal, tricksCount, showCelebration]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 xl:px-10">
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
      <div className={`grid grid-cols-1 items-stretch gap-4 ${showPhone ? 'md:grid-cols-[1.05fr_0.95fr] md:gap-5 lg:gap-6' : 'mx-auto w-full max-w-3xl'}`}>
        {/* LEFT */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F8EFE0] via-[#FBF4E6] to-[#FFE9D9] p-3 ring-1 ring-ink-300/15 sm:p-4 md:p-5 lg:p-6">
          <RoomBackdrop ambience={scene.ambience} />

          <div className="relative flex h-full min-h-[440px] flex-col sm:min-h-[520px] md:min-h-[580px] lg:min-h-[640px]">
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
                  {/* Static imagination clouds — only render when the
                     current phase supplies imagery AND no richer vignette
                     is in play. Scene 0 now uses SceneVignette below. */}
                  {!phase?.vignette && <ThoughtImagery items={phase?.imagery || []} />}
                </div>
                <div className="min-w-0 flex-1 pt-2 sm:pt-4">
                  {phase?.vignette ? (
                    <div className="flex flex-col gap-3">
                      <SceneVignette kind={phase.vignette} />
                      {/* phase.hideBubbles silences the visual ThoughtBubble
                         while keeping the bubbles array in play (TTS still
                         speaks them). Used for scenes whose vignette already
                         shows the dialogue on top of the avatars. */}
                      {activeBubbles.length > 0 && !phase?.hideBubbles && (
                        <ThoughtBubble bubbles={activeBubbles} position="right" />
                      )}
                    </div>
                  ) : (
                    !phase?.hideBubbles && <ThoughtBubble bubbles={activeBubbles} position="right" />
                  )}
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

            {/* Spend tracker + Decision trail — only visible once the
               phone column appears (scene 8 onward = seq.index >= 7).
               Scenes 1–7 are pure storytelling so the empty "₹0 / ₹1,500
               plan" and "0 items" blocks were just visual clutter. */}
            {showPhone && (
              <>
                <SpendTracker total={cartTotal} showGap={phoneState.showGap} />
                <div className="mt-4">
                  <DecisionTimeline entries={timeline} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT — top-aligned with the scene tag row on the left column.
           Negative top margin pulls the phone column up so the phone's top
           edge sits flush with the left card's top, not the bottom of the
           InsightCallout (which only renders when there's an insight).
           Hidden during scenes 1–7 (pure storytelling); appears from scene 8
           when Shanaya actually opens the shopping app. */}
        {showPhone && (
          <div className="relative flex flex-col items-stretch -mt-1 sm:-mt-2">
            <InsightCallout insight={phase?.insight} />
            <div className="flex justify-center">
              <PhoneFrame dim={phoneState.dim}>
                <MockShoppingApp
                  state={phoneState}
                  onAddToCart={
                    phase?.prompt?.kind === 'add-to-cart' && !completedHolds.has(phase.id)
                      ? handlePromptClick
                      : undefined
                  }
                />
              </PhoneFrame>
            </div>
            {/* Interactive [Add to Cart] prompt — appears during hold phases
               that have `prompt: { kind: 'add-to-cart', ... }`. Tapping the
               button marks the hold done and advances the sequence. */}
            <AnimatePresence>
              {phase?.prompt && !completedHolds.has(phase.id) && (
                <InteractivePrompt
                  label={phase.prompt.label}
                  cta={phase.prompt.cta}
                  onClick={handlePromptClick}
                />
              )}
            </AnimatePresence>
          </div>
        )}
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

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={() => {
            const target = Math.max(0, seq.index - 1);
            // Stop the current scene's TTS so it doesn't keep speaking
            // over the previous scene's narration.
            cancelSpeech();
            spokenTexts.current.clear();
            setCompletedHolds((prev) => {
              const next = new Set(prev);
              for (let i = target; i < phases.length; i += 1) next.delete(phases[i]?.id);
              return next;
            });
            seq.goTo(target);
            seq.resume();
          }}
          disabled={seq.index === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back
        </button>
        <button
          onClick={() => {
            // Stop the current scene's TTS so the NEW scene's voice
            // starts cleanly without bleed-through from the old one.
            cancelSpeech();
            spokenTexts.current.clear();
            seq.advance();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500 px-4 py-2 text-[11px] font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs"
        >
          Next <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <EndOfActCelebration
            actLabel="Act 1"
            title="Temptation"
            stats={celebrationStats}
            takeaway="Every purchase felt justified in the moment. The trap doesn't ambush you — it works by making each next step feel reasonable. That's why pausing before you tap 'Buy' matters."
            continueLabel="Move to Act 2 →"
            onContinue={finishAct}
            secondaryLabel="Go to home"
            onSecondary={onGoHome}
          />
        )}
      </AnimatePresence>
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
