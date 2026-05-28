import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

import AudioToggle from '../../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../../shared/AudioConsentBanner.jsx';
import SceneProgress from '../../../shared/SceneProgress.jsx';
import EndOfActCelebration from '../../../shared/EndOfActCelebration.jsx';

import Scene3D from '../3d/Scene3D.jsx';
import PaymentPhone from '../scenes/PaymentPhone.jsx';
import SignalCatcher from '../scenes/SignalCatcher.jsx';
import PredictionChallenge from '../scenes/PredictionChallenge.jsx';

import { lesson, characters } from '../../../../data/lessons/clickToPay.js';
import { useSequencer } from '../../../../hooks/useSequencer.js';
import { useLesson } from '../../../../context/LessonContext.jsx';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
} from '../../../../utils/sounds.js';

/* Music mood per scenePhase — uses the Lesson 2 moods added to sounds.js
 * (`cyber-pulse`, `glitch-tense`, `wonder`) so the soundtrack is
 * audibly different from Lesson 1's lofi/calm palette. */
function pickMood(scenePhase, emotion) {
  if (scenePhase === 'home')      return 'lofi';
  if (scenePhase === 'glitch')    return 'glitch-tense';
  if (scenePhase === 'transform') return 'wonder';
  if (scenePhase === 'digital')   return 'cyber-pulse';
  if (emotion === 'shocked')      return 'hit';
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

  /* ===== Cues + narration ===== */
  const lastCuePhaseId = useRef(null);
  useEffect(() => {
    if (!phase) return;
    if (lastCuePhaseId.current === phase.id) return;
    lastCuePhaseId.current = phase.id;
    if (audioEnabled && phase.cue && sounds[phase.cue]) sounds[phase.cue]();
  }, [phase, audioEnabled]);

  const spokenForPhase = useRef(null);
  const phaseSpokeRef = useRef(false);
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    if (phase.hold && (phase.task || phase.reaction || phase.prediction)) {
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
      const voice = characters[b.speaker || phase.speaker || 'narrator']?.voice || 'narrator';
      speak(b.text, { who: voice });
      spokeNow = true;
    });
    phaseSpokeRef.current = spokeNow;
  }, [phase, audioEnabled]);

  /* ===== Auto-advance ===== */
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
      const minBuffer = 350;
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

  /* ===== Bubbles for the 3D scene =====
   *
   * Scene3D anchors each bubble above its `speaker` character's head.
   * We carry `speaker` through from the phase data (added in lesson v2). */
  const bubblesForScene = (phase?.bubbles || [])
    .filter((b) => b.speaker && b.speaker !== 'narrator')
    .map((b) => ({ speaker: b.speaker, text: b.text, type: b.type }));

  /* ===== Layout — different phases need different right-column content ===== */
  const showPaymentPhone = scenePhase === 'home' && (phase?.id === 's1-task' || phase?.id === 's1-task-intro');
  const showSignals = phase?.reaction?.kind === 'tap-signals' && !completedHolds.has(phase.id);
  const stageOnly = !showPaymentPhone && !showSignals && !phase?.prediction;

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

      {/* MAIN STAGE — full-width 3D for non-interactive phases, split for interactive */}
      <div
        className={`grid items-stretch gap-4 ${
          stageOnly ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-[1.05fr_0.95fr] md:gap-5 lg:gap-6'
        }`}
      >
        {/* 3D STAGE */}
        <div className="relative h-[440px] sm:h-[520px] md:h-[580px] lg:h-[640px]">
          <Scene3D
            scenePhase={scenePhase}
            speaker={isSpeaking ? speakerKey : null}
            speaking={isSpeaking}
            amplitudeRef={mouthRef}
            emotion={emotion}
            bubbles={bubblesForScene}
          />
          {/* Scene tag */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/85 backdrop-blur">
            Scene {sceneIdx + 1} · {scene?.title}
          </div>
          {/* Status pill */}
          {phase?.status && (
            <motion.div
              key={phase.id + '-status'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-cyan-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-100 ring-1 ring-cyan-300/40 backdrop-blur"
            >
              {phase.status}
            </motion.div>
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
                className="absolute inset-x-3 bottom-3 z-20 rounded-2xl bg-black/55 px-4 py-3 text-[13px] leading-snug text-white/95 ring-1 ring-white/10 backdrop-blur sm:text-[14px]"
              >
                <span className="mr-1 text-cyan-300">🎙️</span>{phase.narration}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Floating labels for Scene 4 (anchored to stage, not 3D — easier to read) */}
          {phase?.showLabels && (
            <FloatingLabels labels={phase.showLabels} />
          )}
        </div>

        {/* RIGHT COLUMN — payment phone / signal catcher (only when interactive) */}
        {!stageOnly && (
          <div className="relative flex flex-col items-stretch gap-3">
            {showPaymentPhone && (
              <PaymentPhone
                active={phase?.id === 's1-task' && !completedHolds.has('s1-task')}
                glitch={0}
                onComplete={() => {
                  markHoldDone('s1-task');
                  advanceOrFinish();
                }}
                hint={phase?.id === 's1-task' ? 'Tap the highlighted button to continue' : 'Watch what Ritwik is about to do…'}
              />
            )}
            <AnimatePresence>
              {showSignals && (
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

/* =================== helpers =================== */

function deriveEmotion(phase, scene) {
  if (phase?.emotion) return phase.emotion;
  const id = phase?.id || '';
  if (id.startsWith('s1-ritwik')) return 'confident';
  if (id.startsWith('s1-task')) return 'curious';
  if (id.startsWith('s2-')) return 'unsettled';
  if (id.startsWith('s3-ritwik-confused')) return 'shocked';
  if (id.startsWith('s3-')) return 'shocked';
  if (id.startsWith('s4-')) return 'curious';
  if (id.startsWith('s5-')) return 'curious';
  return scene?.emotion || 'neutral';
}

/* Floating system labels (bank / app / security / network) overlaid on
 * the 3D stage in scene 4. Kept as 2D for legibility — labels in 3D
 * always end up either too small or always-facing-camera billboards. */
function FloatingLabels({ labels = [] }) {
  const items = [
    { id: 'bank',     emoji: '🏦', text: 'Bank Server',    x: '12%', y: '22%' },
    { id: 'app',      emoji: '📱', text: 'Payment App',    x: '80%', y: '18%' },
    { id: 'security', emoji: '🛡️', text: 'Security Check', x: '14%', y: '64%' },
    { id: 'network',  emoji: '🌐', text: 'Network Route',  x: '80%', y: '64%' },
  ].filter((l) => labels.includes(l.id));
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {items.map((l, i) => (
        <motion.div
          key={l.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
          transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
          style={{ left: l.x, top: l.y }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white ring-1 ring-cyan-300/40 backdrop-blur"
        >
          <span className="mr-1">{l.emoji}</span>{l.text}
        </motion.div>
      ))}
    </div>
  );
}
