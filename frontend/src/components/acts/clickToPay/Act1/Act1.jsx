import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

import RitwikAvatar from '../../../shared/RitwikAvatar.jsx';
import SpeechBubble from '../../../shared/SpeechBubble.jsx';
import AudioToggle from '../../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../../shared/AudioConsentBanner.jsx';
import SceneProgress from '../../../shared/SceneProgress.jsx';
import EndOfActCelebration from '../../../shared/EndOfActCelebration.jsx';

import PaymentPhone from '../scenes/PaymentPhone.jsx';
import SignalCatcher from '../scenes/SignalCatcher.jsx';
import DigitalWorldStage from '../scenes/DigitalWorldStage.jsx';
import PredictionChallenge from '../scenes/PredictionChallenge.jsx';

import { lesson, characters } from '../../../../data/lessons/clickToPay.js';
import { useSequencer } from '../../../../hooks/useSequencer.js';
import { useLesson } from '../../../../context/LessonContext.jsx';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
} from '../../../../utils/sounds.js';

/* Map (scenePhase + emotion) to a music mood from sounds.js. Mostly
 * scene-driven for this lesson since the dramatic arc — cozy → glitch →
 * cyber transformation → reflective digital world — maps cleanly to
 * specific moods. */
function pickMood(scenePhase, emotion) {
  if (scenePhase === 'home')      return 'calm';
  if (scenePhase === 'glitch')    return emotion === 'shocked' ? 'hit' : 'thinking';
  if (scenePhase === 'transform') return 'hit';
  if (scenePhase === 'digital')   return 'reflective';
  return 'calm';
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

  /* ===== State ===== */
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
  const scenePhase = phase?.scenePhase || scene?.scenePhase || 'home';
  const emotion = useMemo(() => deriveEmotion(phase, scene), [phase, scene]);

  /* ===== Audio: cues + TTS callbacks ===== */
  useEffect(() => {
    setSpeechCallbacks({
      onStart: (who) => { setIsSpeaking(true); setSpeakerKey(who || 'narrator'); },
      onEnd:   () => { setIsSpeaking(false); setSpeakerKey(null); mouthRef.current = 0; visemeRef.current = null; },
      onAmplitude: (v) => { mouthRef.current = v; },
      onViseme: (code) => { visemeRef.current = code; },
    });
    return () => setSpeechCallbacks(null);
  }, []);

  // Play one-shot SFX once per phase
  const lastCuePhaseId = useRef(null);
  useEffect(() => {
    if (!phase) return;
    if (lastCuePhaseId.current === phase.id) return;
    lastCuePhaseId.current = phase.id;
    if (audioEnabled && phase.cue && sounds[phase.cue]) sounds[phase.cue]();
  }, [phase, audioEnabled]);

  // Speak narration / bubbles for the current phase
  const spokenForPhase = useRef(null);
  const phaseSpokeRef = useRef(false);
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    if (phase.hold && (phase.task || phase.reaction || phase.prediction)) {
      // Interactive holds shouldn't be drowned out by narration; cancel
      // anything in flight and skip speaking the hold phase itself.
      cancelSpeech();
      phaseSpokeRef.current = false;
      return;
    }
    if (spokenForPhase.current === phase.id) return;
    spokenForPhase.current = phase.id;
    let spokeNow = false;
    if (phase.narration) {
      const voice = characters[phase.speaker || 'narrator']?.voice || 'narrator';
      speak(phase.narration, { who: voice });
      spokeNow = true;
    }
    (phase.bubbles || []).forEach((b) => {
      const speakerEntry = characters[phase.speaker || 'narrator'];
      const voice = speakerEntry?.voice || 'narrator';
      speak(b.text, { who: voice });
      spokeNow = true;
    });
    phaseSpokeRef.current = spokeNow;
  }, [phase, audioEnabled]);

  // Auto-advance after speech ends — but honour phase.duration as a
  // minimum on-screen time so silent / visual-only phases breathe.
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
      const minBuffer = 450;
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
    setMusicMood(pickMood(scenePhase, emotion));
  }, [audioEnabled, scenePhase, emotion]);

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

  /* ===== Celebration / completion ===== */
  const [showCelebration, setShowCelebration] = useState(false);

  const markHoldDone = useCallback((id) => {
    setCompletedHolds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
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

  /* ===== Bubbles for current phase ===== */
  const bubbles = phase?.bubbles || [];
  const speakerEntry = phase?.speaker ? characters[phase.speaker] : null;

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

  /* ===== Render ===== */
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
          <AudioToggle />
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
          <AudioConsentBanner onEnable={enableAudio} onDismiss={dismissAudio} />
        )}
      </AnimatePresence>

      <SceneProgress current={seq.index} total={phases.length} label={scene?.title} />

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1.05fr_0.95fr] md:gap-5 lg:gap-6">
        {/* LEFT — story stage */}
        <StageCard scenePhase={scenePhase} phase={phase}>
          <div className="relative flex h-full min-h-[440px] flex-col sm:min-h-[520px] md:min-h-[580px] lg:min-h-[640px]">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/65">
                Scene {sceneIdx + 1} of {act.scenes.length}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[11px] text-white/60">{lesson.module}</div>
              </div>
            </div>

            {/* Avatar + bubbles row */}
            <div className="relative mt-2 flex flex-col">
              <div className="relative flex items-start gap-3 sm:gap-5">
                <div className="relative shrink-0">
                  {scenePhase === 'transform' ? (
                    <RitwikTokenAvatar />
                  ) : (
                    <RitwikAvatar
                      emotion={emotion}
                      speaking={isSpeaking && speakerKey === 'ritwik'}
                      amplitudeRef={mouthRef}
                      visemeRef={visemeRef}
                      mode={scenePhase === 'home' ? 'home' : 'digital'}
                      size="xl"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-2 sm:pt-4">
                  {bubbles.length > 0 && (
                    <SpeechBubble bubbles={bubbles} speaker={speakerEntry || characters.narrator} />
                  )}
                </div>
              </div>

              <div className="mt-4 text-center sm:mt-5">
                <div className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {scene?.title}
                </div>
                <div className="mt-1 text-[12px] text-white/65 sm:text-sm">
                  {lesson.hero.character.name} · age {lesson.hero.character.age}
                </div>
              </div>
            </div>

            {/* Narration card */}
            <AnimatePresence mode="wait">
              {phase?.narration && (
                <motion.p
                  key={phase.id + '-narration'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mt-5 rounded-2xl bg-white/8 px-4 py-3 text-[14px] leading-relaxed text-white/85 ring-1 ring-white/15 backdrop-blur sm:text-[15px]"
                >
                  <span className="mr-1 text-white/60">🎙️</span>{phase.narration}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Live status */}
            <div className="mt-auto pt-4 text-[11px] uppercase tracking-widest text-white/55">
              {phase?.status && <span>Now · {phase.status}</span>}
            </div>
          </div>
        </StageCard>

        {/* RIGHT — phone / interactive / glitch */}
        <div className="relative flex flex-col items-stretch gap-3">
          {scenePhase === 'home' || scenePhase === 'glitch' ? (
            <PaymentPhone
              active={phase?.id === 's1-task' && !completedHolds.has('s1-task')}
              glitch={phase?.glitch?.level ?? (scenePhase === 'glitch' ? 1 : 0)}
              onComplete={() => {
                markHoldDone('s1-task');
                advanceOrFinish();
              }}
              hint={phase?.id === 's1-task' ? 'Tap the highlighted button to continue' : ''}
            />
          ) : (
            <DigitalSidePanel scenePhase={scenePhase} phase={phase} />
          )}

          {/* Inline interactive: signal catcher (scene 2) */}
          <AnimatePresence>
            {phase?.reaction?.kind === 'tap-signals' && !completedHolds.has(phase.id) && (
              <motion.div
                key="signal"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
      </div>

      {/* Prediction challenge overlays the whole stage in scene 5 */}
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

      {/* Footer nav */}
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
            takeaway="You walked through a real online payment, then watched it break. The money never disappeared — it just took a path Ritwik didn’t know existed. Act 2 maps that path."
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

/* =================== Helpers + Subcomponents =================== */

function deriveEmotion(phase, scene) {
  if (phase?.emotion) return phase.emotion;
  const id = phase?.id || '';
  if (id.startsWith('s1-meet') || id.startsWith('s1-habit')) return 'confident';
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

function StageCard({ scenePhase, phase, children }) {
  const isCozy = scenePhase === 'home';
  return (
    <div className={`relative overflow-hidden rounded-2xl p-3 ring-1 sm:p-4 md:p-5 lg:p-6 ${
      isCozy
        ? 'bg-gradient-to-br from-[#241634] via-[#2C1B47] to-[#1A1A36] ring-white/10'
        : 'bg-[#0B1024] ring-cyan-300/20'
    }`}>
      {!isCozy && (
        <DigitalWorldStage
          showLabels={phase?.showLabels || (scenePhase === 'digital' ? ['bank', 'app', 'security', 'network'] : [])}
          variant={scenePhase === 'transform' ? 'arrival' : 'idle'}
        />
      )}
      {isCozy && <CozyBackdrop />}
      <div className="relative">{children}</div>
    </div>
  );
}

function CozyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 6, repeat: Infinity }} className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-amber-400/30 blur-[80px]" />
      <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 7, repeat: Infinity, delay: 0.6 }} className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-rose-400/25 blur-[80px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ctp-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#FFFFFF" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ctp-grid)" />
      </svg>
    </div>
  );
}

/* Ritwik's body becomes a glowing ₹500 token in scene 3. Big rotating
 * coin with the rupee mark + the figure 500. */
function RitwikTokenAvatar() {
  return (
    <div className="relative inline-flex h-40 w-40 items-center justify-center sm:h-56 sm:w-56 md:h-60 md:w-60 lg:h-72 lg:w-72">
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 -z-10 rounded-full bg-amber-400/60 blur-3xl"
      />
      <motion.div
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 shadow-[0_0_40px_#FFD23F] ring-4 ring-yellow-200 sm:h-44 sm:w-44 md:h-48 md:w-48 lg:h-56 lg:w-56"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="text-center">
          <div className="text-2xl font-extrabold text-amber-900 sm:text-3xl">₹</div>
          <div className="-mt-1 text-3xl font-extrabold text-amber-900 sm:text-5xl">500</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-amber-900/80 sm:text-[10px]">
            Digital Token
          </div>
        </div>
      </motion.div>
      {/* Floating sparks */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute text-amber-200"
          style={{ left: `${20 + i * 16}%`, top: `${10 + (i % 3) * 25}%` }}
          animate={{ y: [0, -12, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5 + (i % 3) * 0.4, repeat: Infinity, delay: i * 0.3 }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}

/* When the avatar is on the cyber stage, the right column shows a
 * thematic side panel — system console messages while the system speaks,
 * or a "you are here" map placeholder during reflection beats. */
function DigitalSidePanel({ scenePhase, phase }) {
  return (
    <div className="relative h-full min-h-[360px] overflow-hidden rounded-2xl bg-[#06091F] p-5 ring-1 ring-cyan-300/30 sm:min-h-[440px]">
      <div className="absolute inset-0 opacity-50"
           style={{
             backgroundImage:
               'linear-gradient(to right, rgba(34,211,238,0.18) 1px, transparent 1px)',
             backgroundSize: '22px 22px',
           }} />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-cyan-200">
          <span>System Console</span>
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5">Live</span>
        </div>
        <div className="mt-3 flex-1 space-y-2 font-mono text-[11px] text-cyan-100/90">
          <ConsoleLine>&gt; tracking digital currency token #500</ConsoleLine>
          <ConsoleLine delay={0.3}>&gt; checking network route...</ConsoleLine>
          {scenePhase !== 'home' && (
            <ConsoleLine delay={0.6}>&gt; payment app handshake initiated</ConsoleLine>
          )}
          {scenePhase === 'digital' && (
            <>
              <ConsoleLine delay={0.9}>&gt; bank server: online</ConsoleLine>
              <ConsoleLine delay={1.1}>&gt; security check: queued</ConsoleLine>
              <ConsoleLine delay={1.3}>&gt; awaiting learner prediction...</ConsoleLine>
            </>
          )}
        </div>
        <motion.div
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-4 inline-flex items-center gap-2 self-end rounded-full bg-cyan-500/20 px-3 py-1.5 text-[11px] font-bold text-cyan-200 ring-1 ring-cyan-300/40"
        >
          {phase?.id?.startsWith('s5-') ? 'Make your prediction' : 'Listening to system...'}
          <ArrowRight className="h-3 w-3" />
        </motion.div>
      </div>
    </div>
  );
}

function ConsoleLine({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
