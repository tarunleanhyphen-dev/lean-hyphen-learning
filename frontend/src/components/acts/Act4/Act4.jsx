import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import ImpulseMeter from '../../shared/ImpulseMeter.jsx';
import KeyTakeawaysGrid from '../../shared/KeyTakeawaysGrid.jsx';
import { lesson, act4Activities } from '../../../data/lessons/thinkBeforeYouSpend.js';
import EndOfActCelebration from '../../shared/EndOfActCelebration.jsx';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { api } from '../../../utils/api.js';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
} from '../../../utils/sounds.js';

/**
 * Act 4 — Reflect & Realise.
 * One short reflective scene with two interactions:
 *   - ImpulseMeter (self-snapshot on a 5-zone slider)
 *   - KeyTakeawaysGrid (5 tap-to-reveal rules + identity close)
 *
 * Mirrors Act 2 / Act 3's wrapper pattern: left card for avatar +
 * narration, right card swaps between activity and reflective panel.
 */
export default function Act4({ onComplete, onGoHome }) {
  const act = lesson.acts.act4;

  const { phases, phaseToScene } = useMemo(() => {
    const flat = [];
    const map = [];
    act.scenes.forEach((scene, sIdx) => {
      scene.phases.forEach((p) => { flat.push(p); map.push(sIdx); });
    });
    return { phases: flat, phaseToScene: map };
  }, [act.scenes]);

  const [completedHolds, setCompletedHolds] = useState(() => new Set());
  const [meterPick, setMeterPick] = useState(null);
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

  const liveStatus = useMemo(() => {
    for (let i = seq.index; i >= 0; i -= 1) {
      if (phases[i]?.status) return phases[i].status;
    }
    return '';
  }, [seq.index, phases]);

  const { sessionId, audioEnabled, setAudioEnabled, setActStatus } = useLesson();

  /* -------- Audio: lo-fi mood throughout (matches Act 2 / Act 3) -------- */
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
    // Stay in the lo-fi chill mood the whole way through. Reflective tone.
    setMusicMood('lofi');
  }, [audioEnabled]);

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

  /* -------- Hold completion + celebration -------- */
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
      setActStatus(lesson.id, 'act4', 'completed');
      setShowCelebration(true);
    } else {
      seq.advance();
    }
  }, [seq, setActStatus]);

  const finishAct = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
  }, [onComplete]);

  /* Surface the picked Impulse-Meter zone in the celebration as a
   * personalised line. */
  const meterLabel = useMemo(() => {
    if (!meterPick) return null;
    const z = act4Activities.meter.zones.find((x) => x.id === meterPick);
    return z ? `${z.emoji} ${z.label}` : null;
  }, [meterPick]);

  const celebrationStats = useMemo(() => {
    const mins = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    return [
      { label: 'Your snapshot',    value: meterLabel || '—',  sub: 'Where you placed yourself' },
      { label: 'Rules unlocked',   value: '5 / 5',            sub: 'Pause · Small spends · Triggers · Time · Purpose' },
      { label: 'Identity claimed', value: '🪞',               sub: '"I can pause and choose before I spend."' },
      { label: 'Time taken',       value: `${mins} min`,      sub: 'self-paced' },
    ];
  }, [meterLabel]);

  const handleActivityComplete = useCallback(async (kind, payload = {}) => {
    try {
      await api.saveReflection({
        lessonId: lesson.id,
        actId: `act4:${phase.id}`,
        prompt: `activity=${kind}`,
        response: JSON.stringify(payload),
        sessionId,
      });
    } catch { /* non-blocking */ }
    if (kind === 'impulse-meter' && payload.zoneId) setMeterPick(payload.zoneId);
    markHoldDone(phase.id);
    advanceOrFinish();
  }, [phase, sessionId, markHoldDone, advanceOrFinish]);

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

  const onCueClick = () => audioEnabled && sounds.click?.();

  const activity = phase?.activity;
  const isActivityActive = !!activity && !completedHolds.has(phase.id);
  const isReflectPhase = phase?.id === 's9-identity';

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

      <SceneProgress current={seq.index} total={phases.length} label={scene.title} actLabel="Act 4" />

      {/* Stage — avatar+narration left (~40%), reflection panel right (~60%). */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[2fr_3fr] md:gap-5 lg:gap-6">
        {/* LEFT — avatar + narration */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F4ECFE] via-[#FBF4E6] to-[#FFE9D9] p-3 ring-1 ring-ink-300/15 sm:p-4">
          <Backdrop ambience={scene.ambience} />
          <div className="relative flex h-full min-h-[380px] flex-col sm:min-h-[460px] md:min-h-[520px]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-saffron-500 sm:text-[11px]">
                Reflect &amp; realise
              </div>
              <div className="hidden text-right md:block">
                <div className="text-[11px] text-ink-500">A small moment to land the lesson</div>
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
                  One snapshot · five rules · one choice
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

        {/* RIGHT — activity or reflection panel */}
        <div className="relative">
          <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-ink-300/15 shadow-sm sm:p-4 md:p-5 lg:p-6">
            {isActivityActive ? (
              <ActivityRenderer
                kind={activity.kind}
                onCueClick={onCueClick}
                onSpeakPrompt={(text) => audioEnabled && speak(text, { who: 'narrator' })}
                speakingDone={!isSpeaking}
                onComplete={(payload) => handleActivityComplete(activity.kind, payload || {})}
              />
            ) : isReflectPhase ? (
              <FinalIdentityPanel meterLabel={meterLabel} />
            ) : (
              <PrePhasePlaceholder phaseId={phase?.id} />
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
          onClick={isActivityActive ? undefined : () => {
            // Cancel current TTS so next phase plays cleanly.
            cancelSpeech();
            spokenTexts.current.clear();
            lastSpokenPhaseIdRef.current = null;
            if (seq.isLast) advanceOrFinish();
            else seq.advance();
          }}
          disabled={isActivityActive}
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold shadow-lg transition active:scale-[0.98] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs',
            isActivityActive
              ? 'bg-white/20 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-saffron-500 text-ink-900 shadow-saffron-500/30 hover:bg-saffron-400',
          ].join(' ')}
        >
          {seq.isLast ? 'Finish lesson' : 'Next'} <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <EndOfActCelebration
            actLabel="Act 4"
            title="Reflect & Realise"
            stats={celebrationStats}
            takeaway="You walked through the same trap Shanaya did, named the four mind traps, spotted the influencer pull, and just gave yourself five rules you can take into the next reel, the next sale, the next group-chat drop. That's the muscle."
            continueLabel="Back to home →"
            onContinue={finishAct}
            secondaryLabel={onGoHome ? 'Go to home' : undefined}
            onSecondary={onGoHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Activity router =================== */
function ActivityRenderer({ kind, onCueClick, onSpeakPrompt, speakingDone, onComplete }) {
  if (kind === 'impulse-meter') {
    return (
      <ImpulseMeter
        data={act4Activities.meter}
        onCueClick={onCueClick}
        onSpeakPrompt={onSpeakPrompt}
        speakingDone={speakingDone}
        onComplete={onComplete}
      />
    );
  }
  if (kind === 'takeaways-grid') {
    return (
      <KeyTakeawaysGrid
        data={act4Activities.takeaways}
        onCueClick={onCueClick}
        speakingDone={speakingDone}
        onComplete={onComplete}
      />
    );
  }
  return null;
}

/* =================== Pre-activity / between-beats placeholder ====
 * For narration-only phases the right panel shows a calm reflective
 * card so it doesn't sit blank. */
function PrePhasePlaceholder({ phaseId }) {
  const blocks = {
    's9-intro': {
      tag: 'Reflect',
      title: 'A small moment to land the lesson',
      body: 'No quiz here. No score. Just a snapshot of where you stand — and five rules you can take with you.',
    },
    's9-meter-intro': {
      tag: "What's coming",
      title: 'A 5-zone Impulse Meter',
      body: 'You\'ll place yourself on a slider from "I go with the moment" to "I pause and choose". No wrong answer — be honest.',
    },
    's9-takeaways-intro': {
      tag: "What's coming",
      title: 'Five rules · revealed one at a time',
      body: 'Tap each card in order. Together they form the playbook for the next reel, the next sale, the next group-chat drop.',
    },
  };
  const b = blocks[phaseId] || blocks['s9-intro'];
  return (
    <div className="flex min-h-[260px] flex-col items-start justify-center gap-3 p-2 sm:min-h-[340px] md:min-h-[440px]">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-saffron-500 sm:text-[11px]">
        {b.tag}
      </div>
      <h3 className="text-xl font-extrabold text-ink-900 sm:text-2xl md:text-3xl">{b.title}</h3>
      <p className="max-w-md text-[13px] leading-relaxed text-ink-700 sm:text-[14px] md:text-[15px]">{b.body}</p>
    </div>
  );
}

/* =================== Final identity statement panel =================== */
function FinalIdentityPanel({ meterLabel }) {
  return (
    <div className="flex min-h-[260px] flex-col items-start justify-center gap-4 p-2 sm:min-h-[340px] md:min-h-[440px]">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-saffron-500 sm:text-[11px]">
        🪞 Identity close
      </div>
      <h3 className="text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl md:text-4xl">
        "I can pause and choose before I spend."
      </h3>
      <p className="max-w-md text-[13px] leading-relaxed text-ink-700 sm:text-[14px] md:text-[15px]">
        Whatever zone you landed on today, what just changed is small but real — you now know what to look for. The next time a reel, a deal, or a notification pulls at you, that knowledge is the pause.
      </p>
      {meterLabel && (
        <div className="rounded-2xl bg-gradient-to-br from-saffron-500/12 to-coral-500/10 p-3 ring-1 ring-saffron-500/30">
          <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
            Your snapshot today
          </div>
          <div className="mt-1 text-[14px] font-semibold text-ink-900">
            {meterLabel}
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== Backdrop (same look as Act 2 / Act 3) ============== */
function Backdrop({ ambience }) {
  const dim = ambience === 'silent';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div animate={{ opacity: dim ? 0.18 : 0.4 }} transition={{ duration: 1.2 }} className="absolute -right-16 -top-12 h-64 w-64 rounded-full bg-saffron-400/45 blur-[80px]" />
      <motion.div animate={{ opacity: dim ? 0.12 : 0.36 }} transition={{ duration: 1.2 }} className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-coral-400/40 blur-[80px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lh-grid-a4" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#1A1426" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lh-grid-a4)" />
      </svg>
    </div>
  );
}
