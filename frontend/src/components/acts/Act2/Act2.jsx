import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import TricksSpotted from '../../shared/TricksSpotted.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import DragMatchBoard from '../../shared/DragMatchBoard.jsx';
import DefinitionPuzzle from '../../shared/DefinitionPuzzle.jsx';
import FrameworkCard from '../../shared/FrameworkCard.jsx';
import { pickMood } from '../Act1/Act1.jsx';
import { lesson, act2Activities } from '../../../data/lessons/thinkBeforeYouSpend.js';
import EndOfActCelebration from '../../shared/EndOfActCelebration.jsx';
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
  const [speaker, setSpeaker] = useState(null); // 'shanaya' | 'narrator' | null
  const [wordTick, setWordTick] = useState(0);
  // Real-time speech amplitude (0–1) — drives ShanayaAvatar's mouth.
  const mouthRef = useRef(0);
  // Same tricks-spotted score the chip displays. Act 2 has fewer of these
  // (insights are inline on the activity cards), but the chip still ticks
  // up on the few that fire so the running total persists visually.
  const tricksSeenRef = useRef(new Set());
  const [tricksCount, setTricksCount] = useState(0);

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
      onStart: (who) => { setIsSpeaking(true); setSpeaker(who || 'shanaya'); },
      onEnd:   () => { setIsSpeaking(false); setSpeaker(null); mouthRef.current = 0; },
      onWord:  () => setWordTick((t) => t + 1),
      // Real-time amplitude into a ref so the 60-fps updates don't
      // re-render Act 2 every frame; the avatar reads it directly.
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
    const insight = phase.insight;
    if (insight?.label && !tricksSeenRef.current.has(insight.label)) {
      tricksSeenRef.current.add(insight.label);
      setTricksCount(tricksSeenRef.current.size);
      if (audioEnabled && sounds.aha) sounds.aha();
    }
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

  // Same celebration loop as Act 1: when the act's last phase reports
  // done, we show the recap modal instead of immediately navigating.
  // The student clicks Continue → finishAct() fires the real onComplete.
  const [showCelebration, setShowCelebration] = useState(false);
  const startTimeRef = useRef(Date.now());

  const advanceOrFinish = useCallback(() => {
    if (seq.isLast) {
      setActStatus(lesson.id, 'act2', 'completed');
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
      { label: 'Tricks named',     value: 4,           sub: 'matched all 4'        },
      { label: 'Definition built', value: 'Solved',    sub: 'impulse buying'        },
      { label: 'Pause framework',  value: '5 steps',   sub: 'Plan → Trade-off'      },
      { label: 'Time taken',       value: `${mins} min`, sub: 'self-paced'          },
    ];
  }, []);

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
          <TricksSpotted count={tricksCount} />
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
                Scene {sceneIdx + 1} of {act.scenes.length}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[11px] text-ink-500">Reflecting on the cart</div>
              </div>
            </div>

            <div className="mt-2 flex flex-col">
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="shrink-0">
                  <ShanayaAvatar
                    emotion={currentEmotion}
                    speaking={isSpeaking && speaker === 'shanaya'}
                    wordTick={wordTick}
                    amplitudeRef={mouthRef}
                    size="xl"
                  />
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
                onSpeakPrompt={(text) => audioEnabled && speak(text, { who: 'narrator' })}
                onRevealBullet={(b) => audioEnabled && speak(`${b.label}. ${b.question}`, { who: 'shanaya' })}
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

      <AnimatePresence>
        {showCelebration && (
          <EndOfActCelebration
            actLabel="Act 2"
            title="Understanding Impulse Buying"
            stats={celebrationStats}
            takeaway="The trap has a name. Plan, Need, Budget, Wait, Trade-off — five questions you can run in your head before you ever tap 'Buy'."
            continueLabel="Back to home →"
            onContinue={finishAct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Activity router =================== */

function ActivityRenderer({ kind, onCueClick, onCueCorrect, onCueWrong, onSpeakInsight, onSpeakDefinition, onSpeakPrompt, onRevealBullet, speakingDone, onComplete }) {
  if (kind === 'match') {
    return (
      <DragMatchBoard
        data={act2Activities.match}
        onCueClick={onCueClick}
        onCueCorrect={onCueCorrect}
        onCueWrong={onCueWrong}
        onSpeakInsight={onSpeakInsight}
        onSpeakPrompt={onSpeakPrompt}
        speakingDone={speakingDone}
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
        speakingDone={speakingDone}
        onComplete={() => onComplete({ activity: 'puzzle' })}
      />
    );
  }
  if (kind === 'framework') {
    return (
      <FrameworkCard
        data={act2Activities.framework}
        onReveal={onRevealBullet}
        speakingDone={speakingDone}
        onComplete={() => onComplete({ activity: 'framework' })}
      />
    );
  }
  return null;
}

/* Cart she actually paid for in Act 1 — referenced from Act 2 Scene 6's
 * "What just happened?" panel so students see exactly the five items, the
 * prices, and the gap from plan to total. */
const ACT1_CART = [
  { id: 'shoes',        name: 'White Sneakers',    emoji: '👟', price: 1499, trigger: 'On plan'                  },
  { id: 'socks',        name: 'Branded Socks',     emoji: '🧦', price: 299,  trigger: '"Completes the look"'      },
  { id: 'smartwatch',   name: 'Smartwatch X1',     emoji: '⌚', price: 799,  trigger: '12K bought this week'      },
  { id: 'hoodie',       name: 'Birthday Hoodie',   emoji: '👕', price: 999,  trigger: 'Flash deal · 5 min left'   },
  { id: 'cleaning-kit', name: 'Shoe Cleaning Kit', emoji: '🧴', price: 399,  trigger: 'Frequently bought together'},
];

function OrderSummaryCard() {
  const subtotal = ACT1_CART.reduce((s, p) => s + p.price, 0);
  const paid = Math.max(0, subtotal - 200);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col gap-3"
    >
      <header>
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-400">Scene 1 · What just happened</div>
        <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">Order summary</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-700 sm:text-[13px]">Everything Shanaya bought — and the trigger behind each pick.</p>
      </header>

      <ul className="flex flex-col gap-2">
        {ACT1_CART.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl bg-cream-50 p-2.5 ring-1 ring-ink-300/15">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-lg ring-1 ring-ink-300/15">
              {p.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-ink-900">{p.name}</div>
              <div className="text-[11px] text-ink-500">{p.trigger}</div>
            </div>
            <div className="text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-white p-3 ring-1 ring-ink-300/15">
        <div className="space-y-1 text-[12px]">
          <Row label="Items subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`} />
          <Row label="Delivery" value="FREE" valueClass="font-bold text-teal-500" />
          <Row label="Coupon (LH200)" value="− ₹200" valueClass="text-teal-500" />
          <div className="my-1 h-px bg-ink-300/15" />
          <div className="flex items-center justify-between text-[14px] font-extrabold text-ink-900">
            <span>Total paid</span>
            <span className="text-burgundy-500">₹{paid.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-saffron-500/15 to-coral-500/10 p-3 ring-1 ring-saffron-500/30">
        <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-600">Original plan vs actual</div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="text-[13px] text-ink-900">Planned <strong>₹1,500</strong></span>
          <span className="text-[14px] font-extrabold text-burgundy-500">+{Math.round((paid / 1500 - 1) * 100)}% over plan</span>
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, valueClass = 'text-ink-900' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-700">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

/* When no activity is active, show a calm summary card so the right column
 * doesn't go blank between scenes. Scene 6 uses the full Order Summary
 * card; Scenes 7 and 8 keep the lighter "what's coming next" tile. */
function PreActivityPlaceholder({ sceneIdx, isAfterActivity }) {
  if (sceneIdx === 0) {
    return <OrderSummaryCard />;
  }

  const summaries = [
    null, // Scene 1 handled above by OrderSummaryCard
    {
      eyebrow: 'Scene 2',
      title: 'Connecting the dots',
      copy: 'These tricks have one name in common. Build the definition by tapping the right tiles.',
      tag: 'Build the definition',
    },
    {
      eyebrow: 'Scene 3',
      title: 'Pause & Think',
      copy: 'Five quick questions to ask before every purchase. The pause that beats the trap.',
      tag: 'Learn the framework',
    },
  ];
  const s = summaries[sceneIdx] || summaries[1];

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
