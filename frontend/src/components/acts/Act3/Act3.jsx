import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import ScenarioStage from '../../shared/ScenarioStage.jsx';
import SimulationChallenge from '../../shared/SimulationChallenge.jsx';
import { lesson, act3Scenarios } from '../../../data/lessons/thinkBeforeYouSpend.js';
import EndOfActCelebration from '../../shared/EndOfActCelebration.jsx';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { api } from '../../../utils/api.js';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
} from '../../../utils/sounds.js';

/**
 * Act 3 — Four Real-life Simulations.
 * Each scene is one ~2-minute scenario. The phases follow the same
 * pattern: open → stage → challenge (hold) → insight → takeaway → close.
 * The right-hand panel swaps between the visual ScenarioStage (during
 * intro/stage phases) and the SimulationChallenge (during the hold).
 */
export default function Act3({ onComplete }) {
  const act = lesson.acts.act3;

  const { phases, phaseToScene } = useMemo(() => {
    const flat = [];
    const map = [];
    act.scenes.forEach((scene, sIdx) => {
      scene.phases.forEach((p) => { flat.push(p); map.push(sIdx); });
    });
    return { phases: flat, phaseToScene: map };
  }, [act.scenes]);

  const [completedHolds, setCompletedHolds] = useState(() => new Set());
  const [scoreboard, setScoreboard] = useState(() => new Set()); // scenario ids cleared
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speaker, setSpeaker] = useState(null);
  const [wordTick, setWordTick] = useState(0);
  const mouthRef = useRef(0);

  const seq = useSequencer(phases, { holdWhile: isSpeaking });
  const sceneIdx = phaseToScene[seq.index] ?? 0;
  const scene = act.scenes[sceneIdx];
  const phase = seq.phase;
  const currentEmotion = phase?.emotion || scene.emotion;
  const activeBubbles = phase?.bubbles || [];
  const scenario = act3Scenarios[`s${sceneIdx + 1}`];

  const liveStatus = useMemo(() => {
    for (let i = seq.index; i >= 0; i -= 1) {
      if (phases[i]?.status) return phases[i].status;
    }
    return '';
  }, [seq.index, phases]);

  const { sessionId, audioEnabled, setAudioEnabled, setActStatus } = useLesson();

  /* -------- Audio: lo-fi music for Act 3 (same vibe as Act 2) -------- */
  useEffect(() => {
    setSpeechCallbacks({
      onStart: (who) => { setIsSpeaking(true); setSpeaker(who || 'narrator'); },
      onEnd:   () => { setIsSpeaking(false); setSpeaker(null); mouthRef.current = 0; },
      onWord:  () => setWordTick((t) => t + 1),
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

  const spokenTexts = useRef(new Set());
  const lastSpokenPhaseIdRef = useRef(null);
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    if (lastSpokenPhaseIdRef.current !== phase.id) {
      spokenTexts.current.clear();
      lastSpokenPhaseIdRef.current = phase.id;
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
    // Act 3 lives in the same lo-fi soundscape as Act 2 — the four
    // mindful-choice moments deserve the chill Rhodes / vinyl vibe.
    if (currentEmotion === 'shocked') setMusicMood('hit');
    else setMusicMood('lofi');
  }, [audioEnabled, currentEmotion]);

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

  const dismissAudio = useCallback(() => setAudioEnabled(false), [setAudioEnabled]);

  /* -------- Holds / celebration / scoring -------- */
  const markHoldDone = useCallback((id) => {
    setCompletedHolds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const [showCelebration, setShowCelebration] = useState(false);
  const startTimeRef = useRef(Date.now());

  const advanceOrFinish = useCallback(() => {
    if (seq.isLast) {
      setActStatus(lesson.id, 'act3', 'completed');
      setShowCelebration(true);
    } else {
      seq.advance();
    }
  }, [seq, setActStatus]);

  const finishAct = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
  }, [onComplete]);

  const celebrationStats = useMemo(() => {
    const mins = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    return [
      { label: 'Scenarios cleared', value: `${scoreboard.size} / 4`, sub: 'Better Deal · Food Spiral · Group Chat · Flash Sale' },
      { label: 'Mindful choices', value: scoreboard.size,           sub: 'badges unlocked' },
      { label: 'Frameworks applied', value: 'NEED vs EMOTION',      sub: 'in 4 real-life contexts' },
      { label: 'Time taken',        value: `${mins} min`,           sub: 'self-paced'         },
    ];
  }, [scoreboard.size]);

  const handleActivityComplete = useCallback(async (kind, payload = {}) => {
    try {
      await api.saveReflection({
        lessonId: lesson.id,
        actId: `act3:${phase.id}`,
        prompt: `activity=${kind}`,
        response: JSON.stringify(payload),
        sessionId,
      });
    } catch { /* non-blocking */ }
    if (scenario) {
      setScoreboard((prev) => {
        const next = new Set(prev);
        next.add(scenario.id);
        return next;
      });
    }
    markHoldDone(phase.id);
    advanceOrFinish();
  }, [phase, sessionId, markHoldDone, advanceOrFinish, scenario]);

  const replayScene = () => {
    let first = 0;
    for (let i = 0; i < phaseToScene.length; i += 1) {
      if (phaseToScene[i] === sceneIdx) { first = i; break; }
    }
    cancelSpeech();
    spokenTexts.current.clear();
    lastSpokenPhaseIdRef.current = null;
    seq.goTo(first);
    seq.resume();
  };

  const onCueClick   = () => audioEnabled && sounds.click?.();
  const onCueCorrect = () => audioEnabled && sounds.add?.();
  const onCueWrong   = () => audioEnabled && sounds.alert?.();

  const activity = phase?.activity;
  const isActivityActive = !!activity && !completedHolds.has(phase.id);
  const isInsightPhase = phase?.id?.endsWith('-insight') || phase?.id?.endsWith('-takeaway') || phase?.id?.endsWith('-wrap');

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 xl:px-10">
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

      <AnimatePresence>
        {!audioEnabled && (
          <AudioConsentBanner onEnable={enableAudio} onDismiss={dismissAudio} />
        )}
      </AnimatePresence>

      <SceneProgress current={seq.index} total={phases.length} label={scene.title} actLabel="Act 3" />

      {/* Scoreboard pill — running tally of cleared scenarios */}
      <Scoreboard scoreboard={scoreboard} currentId={scenario?.id} />

      {/* Stage — left avatar + narration (~40%), right scenario panel (~60%) */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[2fr_3fr] md:gap-5 lg:gap-6">
        {/* LEFT — avatar + narration */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F4ECFE] via-[#FBF4E6] to-[#FFE9D9] p-3 ring-1 ring-ink-300/15 sm:p-4">
          <Backdrop ambience={scene.ambience} />
          <div className="relative flex h-full min-h-[380px] flex-col sm:min-h-[460px] md:min-h-[520px]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500 sm:text-[11px]">
                Scenario {sceneIdx + 1} of {act.scenes.length}
              </div>
              <div className="hidden text-right md:block">
                <div className="text-[11px] text-ink-500">{scenario?.contextTag}</div>
              </div>
            </div>

            <div className="mt-2 flex flex-col">
              <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                <div className="shrink-0">
                  <ShanayaAvatar
                    emotion={currentEmotion}
                    speaking={isSpeaking && speaker === 'shanaya'}
                    wordTick={wordTick}
                    amplitudeRef={mouthRef}
                    showPhone={false}
                  />
                </div>
                <div className="min-w-0 flex-1 pt-1 sm:pt-2 md:pt-3">
                  <ThoughtBubble bubbles={activeBubbles} position="right" />
                </div>
              </div>

              <LiveStatus text={liveStatus} />

              <div className="mt-3 text-center sm:mt-4">
                <div className="text-lg font-extrabold leading-tight text-ink-900 sm:text-xl md:text-2xl">
                  {scene.title}
                </div>
                <div className="mt-1 text-[11.5px] text-ink-700 sm:text-[12.5px] md:text-sm">
                  Test your impulse control · 4 mindful choices
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {phase?.narration && (
                <motion.p
                  key={phase.id + '-narration'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="mt-4 rounded-2xl bg-white/85 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700 ring-1 ring-ink-300/15 sm:px-4 sm:py-3 sm:text-[13.5px] md:text-[14px]"
                >
                  <span className="mr-1 text-ink-500">🎙️</span>{phase.narration}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — challenge / stage / insight */}
        <div className="relative">
          <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-ink-300/15 shadow-sm sm:p-4 md:p-5 lg:p-6">
            {isActivityActive ? (
              <ActivityRenderer
                kind={activity.kind}
                scenario={scenario}
                onCueClick={onCueClick}
                onCueCorrect={onCueCorrect}
                onCueWrong={onCueWrong}
                /* Insight reads visually only — TTS intentionally disabled
                   so the learner can sit with the on-screen panel without
                   the narrator over-explaining it. */
                onSpeakInsight={undefined}
                speakingDone={!isSpeaking}
                onComplete={(payload) => handleActivityComplete(activity.kind, payload || {})}
              />
            ) : isInsightPhase && scenario ? (
              <InsightPanel scenario={scenario} />
            ) : (
              // Stage view: show the scenario's animated context.
              scenario && <ScenarioStage scenario={scenario} />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={() => {
            const target = Math.max(0, seq.index - 1);
            cancelSpeech();
            spokenTexts.current.clear();
            lastSpokenPhaseIdRef.current = null;
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
          onClick={isActivityActive ? undefined : (seq.isLast ? advanceOrFinish : seq.advance)}
          disabled={isActivityActive}
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold shadow-lg transition active:scale-[0.98] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs',
            isActivityActive
              ? 'bg-white/20 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-saffron-500 text-ink-900 shadow-saffron-500/30 hover:bg-saffron-400',
          ].join(' ')}
        >
          {seq.isLast ? 'Move to next act' : 'Next'} <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <EndOfActCelebration
            actLabel="Act 3"
            title="Four Mindful Choices"
            stats={celebrationStats}
            takeaway="Same pause, four very different traps — branding, mood, peer pressure, urgency. You can spot the trick before it spots you."
            continueLabel="Back to home →"
            onContinue={finishAct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Activity router =================== */
function ActivityRenderer({ kind, scenario, onCueClick, onCueCorrect, onCueWrong, onSpeakInsight, speakingDone, onComplete }) {
  if (kind === 'simulation-challenge') {
    return (
      <SimulationChallenge
        data={scenario.challenge}
        insight={scenario.insight}
        badge={scenario.badge}
        onCueClick={onCueClick}
        onCueCorrect={onCueCorrect}
        onCueWrong={onCueWrong}
        onSpeakInsight={onSpeakInsight}
        speakingDone={speakingDone}
        onComplete={() => onComplete({ activity: 'simulation-challenge', scenarioId: scenario.id })}
      />
    );
  }
  return null;
}

/* =================== Insight panel (post-challenge) =================== */
function InsightPanel({ scenario }) {
  return (
    <div className="flex min-h-[260px] flex-col gap-3 sm:min-h-[340px] md:min-h-[440px]">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-saffron-500 sm:text-[11px]">
        {scenario.insight.eyebrow}
      </div>
      <h3 className="text-xl font-extrabold text-ink-900 sm:text-2xl md:text-3xl">
        {scenario.insight.title}
      </h3>
      <p className="text-[13px] leading-relaxed text-ink-700 sm:text-[14px] md:text-[15px]">
        {scenario.insight.body}
      </p>
      <div className="mt-1 rounded-2xl bg-gradient-to-br from-saffron-500/15 to-coral-500/10 p-3 ring-1 ring-saffron-500/30">
        <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
          🎯 Micro-challenge
        </div>
        <div className="mt-1 text-[13px] font-semibold text-ink-900">
          {scenario.microChallenge}
        </div>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-teal-500/15 to-emerald-500/10 p-3 ring-1 ring-teal-500/30">
        <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-teal-600">
          💡 Takeaway
        </div>
        <div className="mt-1 text-[13px] font-semibold text-ink-900">
          {scenario.takeaway}
        </div>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-purple-500/15 to-fuchsia-500/10 p-3 ring-1 ring-purple-500/30">
        <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-purple-600">
          🪞 Identity
        </div>
        <div className="mt-1 text-[13px] font-semibold text-ink-900">
          {scenario.identity}
        </div>
      </div>
    </div>
  );
}

/* =================== Scoreboard pill row =================== */
function Scoreboard({ scoreboard, currentId }) {
  const ids = ['better-deal', 'food-spiral', 'group-chat-pull', 'flash-sale'];
  const labels = ['1', '2', '3', '4'];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
      <Trophy className="h-3.5 w-3.5 opacity-70" />
      <span className="opacity-70">Mindful choices:</span>
      {ids.map((id, i) => {
        const cleared = scoreboard.has(id);
        const active = id === currentId;
        return (
          <motion.span
            key={id}
            animate={active ? { scale: [1, 1.06, 1] } : {}}
            transition={active ? { duration: 1.6, repeat: Infinity } : {}}
            className={[
              'grid h-6 w-6 place-items-center rounded-full ring-1 transition-colors',
              cleared
                ? 'bg-gradient-to-br from-saffron-500 to-coral-500 text-ink-900 ring-saffron-500/60 shadow-md'
                : active
                  ? 'bg-white/15 text-white ring-white/40'
                  : 'bg-white/5 text-white/40 ring-white/15',
            ].join(' ')}
          >
            {cleared ? '✓' : labels[i]}
          </motion.span>
        );
      })}
      <span className="ml-1 opacity-70">{scoreboard.size}/4</span>
    </div>
  );
}

/* =================== Backdrop (same look as Act 2) =================== */
function Backdrop({ ambience }) {
  const dim = ambience === 'silent';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div animate={{ opacity: dim ? 0.18 : 0.4 }} transition={{ duration: 1.2 }} className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-saffron-400/45 blur-[80px]" />
      <motion.div animate={{ opacity: dim ? 0.12 : 0.36 }} transition={{ duration: 1.2 }} className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-coral-400/40 blur-[80px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lh-grid-a3" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#1A1426" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lh-grid-a3)" />
      </svg>
    </div>
  );
}
