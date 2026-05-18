import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import DragMatchBoard from '../../shared/DragMatchBoard.jsx';
import DefinitionPuzzle from '../../shared/DefinitionPuzzle.jsx';
import FrameworkCard from '../../shared/FrameworkCard.jsx';
import { pickMood } from '../Act1/Act1.jsx';
import { lesson, act2Activities } from '../../../data/lessons/thinkBeforeYouSpend.js';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { api } from '../../../utils/api.js';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, setSpeechCallbacks,
} from '../../../utils/sounds.js';

export default function Act2({ onComplete }) {
  const act = lesson.acts.act2;

  const { phases, phaseToScene } = useMemo(() => {
    const flat = [];
    const map = [];
    act.scenes.forEach((scene, sIdx) => {
      scene.phases.forEach((p) => { flat.push(p); map.push(sIdx); });
    });
    return { phases: flat, phaseToScene: map };
  }, [act.scenes]);

  const [completedHolds, setCompletedHolds] = useState(() => new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wordTick, setWordTick] = useState(0);

  const seq = useSequencer(phases, { holdWhile: isSpeaking });
  const sceneIdx = phaseToScene[seq.index] ?? 0;
  const scene = act.scenes[sceneIdx];
  const phase = seq.phase;
  const currentEmotion = phase?.emotion || scene.emotion;
  const activeBubbles = phase?.bubbles || [];

  const liveStatus = useMemo(() => {
    for (let i = seq.index; i >= 0; i -= 1) {
      if (phases[i]?.status) return phases[i].status;
    }
    return '';
  }, [seq.index, phases]);

  const { sessionId, audioEnabled, setAudioEnabled, setActStatus } = useLesson();

  /* -------- Audio: music + cues + TTS w/ mouth events -------- */

  useEffect(() => {
    setSpeechCallbacks({
      onStart: () => setIsSpeaking(true),
      onEnd:   () => setIsSpeaking(false),
      onWord:  () => setWordTick((t) => t + 1),
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
  useEffect(() => {
    if (!audioEnabled || !phase) return;
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

  useEffect(() => {
    if (!audioEnabled) return;
    if (seq.paused) { cancelSpeech(); pauseMusic(); }
    else { resumeMusic(); }
  }, [seq.paused, audioEnabled]);

  const enableAudio = useCallback(async () => {
    await unlockAudio(true);
    setAudioEnabled(true);
    startMusic();
  }, [setAudioEnabled]);

  const dismissAudio = useCallback(() => setAudioEnabled(false), [setAudioEnabled]);

  /* -------- Activity holds (chained — last activity finishes the act) -------- */

  const markHoldDone = useCallback((id) => {
    setCompletedHolds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const advanceOrFinish = useCallback((payload) => {
    if (seq.isLast) {
      setActStatus(lesson.id, 'act2', 'completed');
      onComplete?.(payload);
    } else {
      seq.advance();
    }
  }, [seq, onComplete, setActStatus]);

  const handleActivityComplete = useCallback(async (kind, payload = {}) => {
    try {
      await api.saveReflection({
        lessonId: lesson.id,
        actId: `act2:${phase.id}`,
        prompt: `activity=${kind}`,
        response: JSON.stringify(payload),
        sessionId,
      });
    } catch { /* non-blocking */ }
    markHoldDone(phase.id);
    advanceOrFinish({ kind: 'activity', phaseId: phase.id, ...payload });
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

  const onCueClick   = () => audioEnabled && sounds.click?.();
  const onCueCorrect = () => audioEnabled && sounds.add?.();
  const onCueWrong   = () => audioEnabled && sounds.alert?.();

  const activity = phase?.activity;
  const isActivityActive = !!activity && !completedHolds.has(phase.id);

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

      <SceneProgress current={seq.index} total={phases.length} label={scene.title} actLabel="Act 2" />

      {/* Stage — two columns: avatar+narration on left, activity panel on right */}
      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
        {/* LEFT — Shanaya */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F4ECFE] via-[#FBF4E6] to-[#FFE9D9] p-4 ring-1 ring-ink-300/15 sm:p-6 lg:p-7">
          <RoomBackdrop ambience={scene.ambience} />

          <div className="relative flex h-full min-h-[560px] flex-col">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
                Scene {sceneIdx + 6} of 8
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[11px] text-ink-500">Reflecting on the cart</div>
              </div>
            </div>

            <div className="mt-2 flex flex-col">
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="shrink-0">
                  <ShanayaAvatar emotion={currentEmotion} speaking={isSpeaking} wordTick={wordTick} size="xl" />
                </div>
                <div className="min-w-0 flex-1 pt-2 sm:pt-4">
                  <ThoughtBubble bubbles={activeBubbles} position="left" />
                </div>
              </div>

              <LiveStatus text={liveStatus} />

              <div className="mt-4 text-center sm:mt-5">
                <div className="text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
                  {scene.title}
                </div>
                <div className="mt-1 text-[12px] text-ink-700 sm:text-sm">
                  Understanding impulse buying · 3 quick activities
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
                  className="mt-5 rounded-2xl bg-white/85 px-4 py-3 text-[14px] leading-relaxed text-ink-700 ring-1 ring-ink-300/15 sm:text-[15px]"
                >
                  <span className="mr-1 text-ink-500">🎙️</span>{phase.narration}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — activity panel (or a calm placeholder while narrating) */}
        <div className="relative">
          <div className="rounded-2xl bg-white/95 p-4 ring-1 ring-ink-300/15 shadow-sm sm:p-5 lg:p-6">
            {isActivityActive ? (
              <ActivityRenderer
                kind={activity.kind}
                onCueClick={onCueClick}
                onCueCorrect={onCueCorrect}
                onCueWrong={onCueWrong}
                onSpeakInsight={(pair) => audioEnabled && speak(`${pair.insight.label}. ${pair.insight.detail}`, { who: 'shanaya' })}
                onSpeakDefinition={(line) => audioEnabled && speak(line, { who: 'shanaya' })}
                onRevealBullet={(b) => audioEnabled && speak(`${b.label}. ${b.question}. ${b.detail}`, { who: 'shanaya' })}
                speakingDone={!isSpeaking}
                onComplete={(payload) => handleActivityComplete(activity.kind, payload || {})}
              />
            ) : (
              <PreActivityPlaceholder
                sceneIdx={sceneIdx}
                isAfterActivity={completedHolds.has(phase?.id) || phase?.id?.endsWith('-close') || phase?.id?.endsWith('-bridge')}
              />
            )}
          </div>
        </div>
      </div>

      {!isActivityActive && seq.isLast === false && seq.paused && (
        <div className="text-center text-xs text-white/50">Paused — press Resume to continue</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={isActivityActive ? undefined : seq.advance}
          disabled={isActivityActive}
          className={[
            'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shadow-lg transition active:scale-[0.98]',
            isActivityActive
              ? 'bg-white/20 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-saffron-500 text-ink-900 shadow-saffron-500/30 hover:bg-saffron-400',
          ].join(' ')}
        >
          {seq.isLast ? 'Finish Act 2' : 'Next'} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* =================== Activity router =================== */

function ActivityRenderer({ kind, onCueClick, onCueCorrect, onCueWrong, onSpeakInsight, onSpeakDefinition, onRevealBullet, speakingDone, onComplete }) {
  if (kind === 'match') {
    return (
      <DragMatchBoard
        data={act2Activities.match}
        onCueClick={onCueClick}
        onCueCorrect={onCueCorrect}
        onCueWrong={onCueWrong}
        onSpeakInsight={onSpeakInsight}
        onComplete={() => onComplete({ activity: 'match' })}
      />
    );
  }
  if (kind === 'puzzle') {
    return (
      <DefinitionPuzzle
        data={act2Activities.puzzle}
        onCueClick={onCueClick}
        onCueCorrect={onCueCorrect}
        onCueWrong={onCueWrong}
        onSpeakDefinition={onSpeakDefinition}
        onComplete={() => onComplete({ activity: 'puzzle' })}
      />
    );
  }
  if (kind === 'framework') {
    return (
      <FrameworkCard
        data={act2Activities.framework}
        onCueClick={onCueClick}
        onReveal={onRevealBullet}
        speakingDone={speakingDone}
        onComplete={() => onComplete({ activity: 'framework' })}
      />
    );
  }
  return null;
}

/* When no activity is active, show a calm summary card so the right column
 * doesn't go blank between scenes. */
function PreActivityPlaceholder({ sceneIdx, isAfterActivity }) {
  const summaries = [
    {
      eyebrow: 'Scene 6',
      title: 'What just happened?',
      copy: 'Five items, ₹3,795. We\'ll look at each cart trigger and name the trick behind it.',
      tag: 'Match the trick',
    },
    {
      eyebrow: 'Scene 7',
      title: 'Connecting the dots',
      copy: 'These tricks have one name in common. Build the definition by tapping the right tiles.',
      tag: 'Build the definition',
    },
    {
      eyebrow: 'Scene 8',
      title: 'Pause & Think',
      copy: 'Five quick questions to ask before every purchase. The pause that beats the trap.',
      tag: 'Learn the framework',
    },
  ];
  const s = summaries[sceneIdx] || summaries[0];

  return (
    <div className="flex min-h-[440px] flex-col items-start justify-center gap-3 p-2">
      <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">{s.eyebrow}</div>
      <h3 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">{s.title}</h3>
      <p className="max-w-md text-[14px] leading-relaxed text-ink-700 sm:text-[15px]">{s.copy}</p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-saffron-500/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-saffron-500">
        <Sparkles className="h-3.5 w-3.5" />
        {isAfterActivity ? 'Activity complete · Next' : s.tag}
      </div>
    </div>
  );
}

/* =================== Backdrop (re-used from Act 1, scoped) =================== */

function RoomBackdrop({ ambience }) {
  const dim = ambience === 'silent';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div animate={{ opacity: dim ? 0.18 : 0.4 }} transition={{ duration: 1.2 }} className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-saffron-400/45 blur-[80px]" />
      <motion.div animate={{ opacity: dim ? 0.12 : 0.36 }} transition={{ duration: 1.2 }} className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-coral-400/40 blur-[80px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lh-grid-a2" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#1A1426" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lh-grid-a2)" />
      </svg>
    </div>
  );
}
