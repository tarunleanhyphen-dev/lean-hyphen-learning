import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft, Volume2, VolumeX, Mic } from 'lucide-react';

import SceneProgress from '../../../shared/SceneProgress.jsx';
import EndOfActCelebration from '../../../shared/EndOfActCelebration.jsx';

import Stage2D from '../2d/Stage2D.jsx';
import PaymentPhone from '../2d/PaymentPhone.jsx';
import SignalCatcher from '../scenes/SignalCatcher.jsx';
import PredictionChallenge from '../scenes/PredictionChallenge.jsx';

import { lesson, characters } from '../../../../data/lessons/clickToPay.js';
import { useSequencer } from '../../../../hooks/useSequencer.js';
import { useLesson } from '../../../../context/LessonContext.jsx';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
} from '../../../../utils/sounds.js';

/* Music mood per stage. */
function pickMood(stage) {
  switch (stage) {
    case 'home':
    case 'phone-task': return 'lofi';
    case 'glitch':     return 'glitch-tense';
    case 'transform':  return 'wonder';
    case 'digital':
    case 'flow':       return 'cyber-pulse';
    case 'prediction': return 'reflective';
    default:           return 'calm';
  }
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

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakerKey, setSpeakerKey] = useState(null);
  const [completedHolds, setCompletedHolds] = useState(() => new Set());
  const mouthRef = useRef(0);
  const visemeRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const {
    audioEnabled, setAudioEnabled, setAudioDismissed, setActStatus, state: lessonState,
  } = useLesson();
  const audioDecided = audioEnabled || lessonState?.audioDismissed;

  const seq = useSequencer(phases, { holdWhile: isSpeaking || !audioDecided });
  const sceneIdx = phaseToScene[seq.index] ?? 0;
  const scene = act.scenes[sceneIdx];
  const phase = seq.phase;
  const stage = phase?.stage || scene?.stage || 'home';
  const activeNode = phase?.activeNode ?? -1;
  const visibleLabels = phase?.visibleLabels || 'all';
  const emotion = useMemo(() => deriveEmotion(phase, scene), [phase, scene]);

  /* ===== Speech callbacks ===== */
  useEffect(() => {
    setSpeechCallbacks({
      onStart: (who) => { setIsSpeaking(true); setSpeakerKey(who || 'narrator'); },
      onEnd:   () => { setIsSpeaking(false); setSpeakerKey(null); mouthRef.current = 0; visemeRef.current = null; },
      onAmplitude: (v) => { mouthRef.current = v; },
      onViseme: (code) => { visemeRef.current = code; },
    });
    return () => setSpeechCallbacks(null);
  }, []);

  /* ===== One-shot cues per phase ===== */
  const lastCuePhaseId = useRef(null);
  useEffect(() => {
    if (!phase) return;
    if (lastCuePhaseId.current === phase.id) return;
    lastCuePhaseId.current = phase.id;
    if (audioEnabled && phase.cue && sounds[phase.cue]) sounds[phase.cue]();
  }, [phase, audioEnabled]);

  /* ===== TTS — every phase with narration or bubbles gets spoken =====
   *
   * Hardened: re-runs whenever phase OR audioEnabled changes. If audio
   * gets enabled mid-phase, the current phase is re-spoken. Per-phase
   * dedup prevents double-speaking when the effect re-runs. */
  const spokenForPhase = useRef(null);
  const phaseSpokeRef = useRef(false);
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    // Holds with interactive tasks don't get voice — they'd talk over the user.
    if (phase.hold && (phase.task || phase.reaction || phase.prediction)) {
      cancelSpeech();
      phaseSpokeRef.current = false;
      return;
    }
    // Dedup per-phase — won't re-speak if audioEnabled toggles back on
    // for the same phase.
    if (spokenForPhase.current === phase.id) return;
    spokenForPhase.current = phase.id;
    let spokeNow = false;
    if (phase.narration) {
      const voice = characters[phase.speaker || 'narrator']?.voice || 'narrator';
      speak(phase.narration, { who: voice });
      spokeNow = true;
    }
    (phase.bubbles || []).forEach((b) => {
      const voice = characters[b.speaker || phase.speaker || 'narrator']?.voice || 'narrator';
      speak(b.text, { who: voice });
      spokeNow = true;
    });
    phaseSpokeRef.current = spokeNow;
  }, [phase, audioEnabled]);

  /* ===== Auto-advance on speech end (honouring phase.duration as a min) ===== */
  const prevSpeakingRef = useRef(false);
  const phaseStartedAtRef = useRef(Date.now());
  useEffect(() => { phaseStartedAtRef.current = Date.now(); }, [phase?.id]);
  useEffect(() => {
    const wasSpeaking = prevSpeakingRef.current;
    prevSpeakingRef.current = isSpeaking;
    if (!audioEnabled || !phase) return;
    if (phase.hold || seq.paused) return;
    if (!phaseSpokeRef.current) return;
    if (wasSpeaking && !isSpeaking) {
      const minBuffer = 400;
      const elapsed = Date.now() - phaseStartedAtRef.current;
      const remaining = Math.max(0, (phase.duration || 0) - elapsed);
      const wait = Math.max(minBuffer, remaining);
      const t = setTimeout(() => {
        phaseSpokeRef.current = false;
        seq.advance();
      }, wait);
      return () => clearTimeout(t);
    }
  }, [isSpeaking, audioEnabled, phase, seq]);

  /* ===== Music ===== */
  useEffect(() => {
    if (!audioEnabled) return;
    setMusicMood(pickMood(stage));
  }, [audioEnabled, stage]);
  useEffect(() => () => { stopMusic(); cancelSpeech(); }, []);
  useEffect(() => {
    unlockAudio(audioEnabled);
    if (audioEnabled) startMusic();
    else { stopMusic(); cancelSpeech(); }
  }, [audioEnabled]);
  useEffect(() => {
    if (!audioEnabled) return;
    if (seq.paused) { pauseSpeech(); pauseMusic(); }
    else { resumeSpeech(); resumeMusic(); }
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

  /* ===== Celebration + completion ===== */
  const [showCelebration, setShowCelebration] = useState(false);

  const markHoldDone = useCallback((id) => {
    setCompletedHolds((prev) => { const next = new Set(prev); next.add(id); return next; });
  }, []);

  const advanceOrFinish = useCallback(() => {
    if (seq.isLast) {
      setActStatus(lesson.id, 'act1', 'completed');
      setShowCelebration(true);
    } else {
      cancelSpeech();
      spokenForPhase.current = null;
      seq.advance();
    }
  }, [seq, setActStatus]);

  const finishAct = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
  }, [onComplete]);

  const replay = () => {
    cancelSpeech();
    spokenForPhase.current = null;
    setCompletedHolds(new Set());
    seq.goTo(0);
    seq.resume();
  };

  const celebrationStats = useMemo(() => {
    const mins = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    return [
      { label: 'Scenes', value: act.scenes.length, sub: 'experienced' },
      { label: 'Voices', value: 4, sub: 'narrator · mom · Ritwik · system' },
      { label: 'Time taken', value: `${mins} min`, sub: 'self-paced' },
      { label: 'Prediction', value: 'locked', sub: 'we’ll reveal in Act 2' },
    ];
  }, [showCelebration]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ===== Bubbles for the stage ===== */
  const bubblesForScene = (phase?.bubbles || [])
    .filter((b) => b.speaker && b.speaker !== 'narrator')
    .map((b) => ({ speaker: b.speaker, text: b.text, type: b.type }));

  /* ===== Layout selectors ===== */
  const showPaymentPhone =
    stage === 'phone-task' && phase?.task?.kind === 'payment-flow' && !completedHolds.has(phase.id);
  const showSignals = phase?.reaction?.kind === 'tap-signals' && !completedHolds.has(phase.id);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 xl:px-10">
      <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <a href="/" aria-label="Lean Hyphen home" className="shrink-0">
            <img src="/lean-hyphen-logo.svg" alt="Lean Hyphen" className="h-8 w-auto sm:h-9" draggable={false} />
          </a>
          <span aria-hidden className="h-5 w-px bg-white/15 sm:h-6" />
          <h1 className="text-[13px] font-semibold text-white/85 sm:text-base">{act.title}</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={audioEnabled ? () => setAudioEnabled(false) : enableAudio}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-[11px] font-semibold sm:px-3 sm:text-xs ${
              audioEnabled
                ? 'border-emerald-300/40 bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30'
                : 'border-white/15 bg-white/5 text-white/85 hover:bg-white/10'
            }`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{audioEnabled ? 'Voice on' : 'Voice off'}</span>
          </button>
          <button
            onClick={seq.paused ? seq.resume : seq.pause}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            {seq.paused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
            <span className="hidden sm:inline">{seq.paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-white/85 hover:bg-white/10 sm:px-3 sm:text-xs"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Replay</span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {!audioEnabled && (
          <BigAudioPrompt onEnable={enableAudio} onDismiss={dismissAudio} />
        )}
      </AnimatePresence>

      <SceneProgress current={seq.index} total={phases.length} label={scene?.title} />

      {/* MAIN STAGE — full-bleed except when payment phone or signal catcher are on */}
      <div
        className={`grid items-stretch gap-4 grid-cols-1 ${
          showPaymentPhone ? 'md:grid-cols-[3fr_2fr] md:gap-5 lg:gap-6' : ''
        }`}
      >
        <div className="relative h-[480px] sm:h-[560px] md:h-[620px] lg:h-[680px]">
          <Stage2D
            stage={stage}
            speaker={isSpeaking ? speakerKey : null}
            speaking={isSpeaking}
            amplitudeRef={mouthRef}
            emotion={emotion}
            bubbles={bubblesForScene}
            activeNode={activeNode}
            visibleLabels={visibleLabels}
          />
          {/* Scene tag */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur">
            Scene {sceneIdx + 1} · {scene?.title}
          </div>
          {/* Voice chip */}
          {audioEnabled && (
            <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200 ring-1 ring-emerald-300/50 backdrop-blur">
              <motion.span
                animate={isSpeaking ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.7 }}
                transition={{ duration: 1, repeat: isSpeaking ? Infinity : 0 }}
                className="h-1.5 w-1.5 rounded-full bg-emerald-300"
              />
              {isSpeaking ? `${characters[speakerKey]?.name || 'Speaking'}` : 'Voice on'}
            </div>
          )}
          {/* Narration ribbon */}
          <AnimatePresence mode="wait">
            {phase?.narration && (
              <motion.div
                key={phase.id + '-narr'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-x-3 bottom-3 z-20 rounded-2xl bg-black/65 px-4 py-3 text-[13px] leading-snug text-white/95 ring-1 ring-white/10 backdrop-blur sm:text-[14px]"
              >
                <span className="mr-1 text-cyan-300">🎙️</span>{phase.narration}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Status pill — only when no narration is on the ribbon */}
          {phase?.status && !phase?.narration && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 rounded-full bg-cyan-400/15 px-3 py-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-cyan-100 ring-1 ring-cyan-300/30 backdrop-blur">
              {phase.status}
            </div>
          )}
          {/* Signal catcher — overlays the stage in scene 2 */}
          <AnimatePresence>
            {showSignals && (
              <motion.div
                key="signal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-3 bottom-16 z-30"
              >
                <SignalCatcher
                  seconds={phase.reaction.seconds || 5}
                  target={phase.reaction.count || 6}
                  onDone={() => {
                    markHoldDone(phase.id);
                    advanceOrFinish();
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column — PaymentPhone only during the interactive task */}
        {showPaymentPhone && (
          <div className="relative flex flex-col items-stretch gap-3">
            <PaymentPhone
              active={!completedHolds.has(phase.id)}
              glitch={0}
              onComplete={() => {
                markHoldDone(phase.id);
                advanceOrFinish();
              }}
              hint="Follow the highlighted button on each screen"
            />
          </div>
        )}
      </div>

      {/* Prediction overlay */}
      <AnimatePresence>
        {phase?.prediction && !completedHolds.has(phase.id) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 grid place-items-center bg-[#06091F]/85 px-4 py-6 backdrop-blur"
          >
            <PredictionChallenge
              prompt={phase.prediction.prompt}
              options={phase.prediction.options}
              onDone={() => {
                markHoldDone(phase.id);
                advanceOrFinish();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={() => {
            cancelSpeech();
            spokenForPhase.current = null;
            const target = Math.max(0, seq.index - 1);
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
            cancelSpeech();
            spokenForPhase.current = null;
            advanceOrFinish();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-2 text-[11px] font-bold text-cyan-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300 active:scale-[0.98] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs"
        >
          Next <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <EndOfActCelebration
            actLabel="Act 1"
            title="The Glitch & The Transformation"
            stats={celebrationStats}
            takeaway="You walked through a real online payment, watched it break, and then traced the path the money actually takes — App → UPI → Bank → Security → Receiver. Act 2 will unpack each one in detail."
            continueLabel="Lock in & continue"
            onContinue={finishAct}
            secondaryLabel="Go to home"
            onSecondary={onGoHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== helpers =================== */

function deriveEmotion(phase, scene) {
  if (phase?.emotion) return phase.emotion;
  const id = phase?.id || '';
  if (id.startsWith('s1-ritwik-easy')) return 'confident';
  if (id.startsWith('s1-task')) return 'curious';
  if (id.startsWith('s2-')) return id === 's2-error' || id === 's2-fail' ? 'unsettled' : 'curious';
  if (id.startsWith('s3-ritwik-confused')) return 'shocked';
  if (id.startsWith('s3-ritwik-lighter')) return 'realised';
  if (id.startsWith('s3-ritwik-inside')) return 'realised';
  if (id.startsWith('s3-')) return 'shocked';
  if (id.startsWith('s4-')) return 'curious';
  if (id.startsWith('s5-')) return 'curious';
  return scene?.emotion || 'neutral';
}

/* Prominent full-width audio prompt. Has to be hard to miss because
 * the lesson is voice-first — without it, the experience collapses to text. */
function BigAudioPrompt({ onEnable, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-fuchsia-500/15 px-4 py-3 text-sm text-white ring-1 ring-cyan-300/20 sm:px-5 sm:py-4"
      role="region"
      aria-label="Enable voice prompt"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan-400/30 ring-1 ring-cyan-300/50">
        <Mic className="h-5 w-5 text-cyan-100" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold leading-tight">Turn on voice for the full experience</div>
        <div className="mt-0.5 text-xs text-white/70">
          Ritwik, Mom, the System and a narrator each speak with their own voice. Music sets the mood.
        </div>
      </div>
      <button
        onClick={onEnable}
        className="whitespace-nowrap rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-cyan-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-300 active:scale-95"
      >
        <Volume2 className="mr-1.5 inline h-4 w-4" /> Enable voice
      </button>
      <button
        onClick={onDismiss}
        className="whitespace-nowrap rounded-full border border-white/20 px-3.5 py-2 text-xs font-semibold text-white/75 hover:bg-white/10"
      >
        <VolumeX className="mr-1 inline h-3.5 w-3.5" /> Read in silence
      </button>
    </motion.div>
  );
}
