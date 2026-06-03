import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PauseCircle, PlayCircle, RotateCcw, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import ShanayaAvatar from '../../shared/ShanayaAvatar.jsx';
import ThoughtBubble from '../../shared/ThoughtBubble.jsx';
import LiveStatus from '../../shared/LiveStatus.jsx';
import SceneProgress from '../../shared/SceneProgress.jsx';
import AudioToggle from '../../shared/AudioToggle.jsx';
import AudioConsentBanner from '../../shared/AudioConsentBanner.jsx';
import MindTrapBoard from '../../shared/MindTrapBoard.jsx';
import FlashCardDeck from '../../shared/FlashCardDeck.jsx';
import { lesson, act2Activities } from '../../../data/lessons/thinkBeforeYouSpend.js';
import EndOfActCelebration from '../../shared/EndOfActCelebration.jsx';
import { useSequencer } from '../../../hooks/useSequencer.js';
import { useLesson } from '../../../context/LessonContext.jsx';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { api } from '../../../utils/api.js';
import {
  sounds, unlockAudio, startMusic, stopMusic, pauseMusic, resumeMusic, setMusicMood,
  speak, cancelSpeech, pauseSpeech, resumeSpeech, setSpeechCallbacks,
} from '../../../utils/sounds.js';

export default function Act2({ onComplete, onGoHome }) {
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

  // Analytics — fires structured events into /api/analytics/events for
  // scoring + reporting. Fire-and-forget; the underlying client batches
  // and retries so call sites can stay clean.
  const analytics = useAnalytics({
    sessionId,
    lessonId: lesson.id,
    actId: 'act2',
  });

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

  // Analytics lifecycle — act_started once on mount; scene_entered /
  // scene_completed as the learner crosses scene boundaries.
  useEffect(() => {
    analytics.actStarted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneEnterRef = useRef({ sceneId: null, enteredAt: 0 });
  useEffect(() => {
    const sceneId = scene?.id;
    if (!sceneId) return undefined;
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
  }, [phase, audioEnabled]);

  const spokenTexts = useRef(new Set());
  const lastSpokenPhaseIdRef = useRef(null);
  useEffect(() => {
    if (!audioEnabled || !phase) return;
    // Reset the dedup set whenever the phase changes — without this,
    // stepping back to a phase wouldn't re-play its narration because
    // the text is still in `spokenTexts`. Mirror's Act 1's pattern.
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
    // Act 2 lives in lo-fi / chill-pop territory — Rhodes pad, jazz 9th
    // chords, half-time hat, vinyl crackle. Only the "shocked" stinger
    // mood is allowed to override it (kept for impact swells if the
    // emotion arc ever needs one).
    if (currentEmotion === 'shocked') {
      setMusicMood('hit');
    } else if (scene.ambience === 'silent') {
      setMusicMood('silent');
    } else {
      setMusicMood('lofi');
    }
  }, [audioEnabled, currentEmotion, scene.ambience]);

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
      analytics.actCompleted({ timeMs: Date.now() - startTimeRef.current });
      setShowCelebration(true);
    } else {
      seq.advance();
    }
  }, [seq, setActStatus, analytics]);

  const finishAct = useCallback(() => {
    setShowCelebration(false);
    onComplete?.();
  }, [onComplete]);

  const celebrationStats = useMemo(() => {
    const mins = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    return [
      { label: 'Thoughts sorted',  value: 12,          sub: 'across 4 mind traps'  },
      { label: 'Mind traps named', value: 4,           sub: 'FOMO · Suggestions · Emotional · Save-spend' },
      { label: 'Flash cards read', value: 3,           sub: 'FOMO · Triggers · Small spends'              },
      { label: 'Time taken',       value: `${mins} min`, sub: 'self-paced'         },
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
    // Analytics — map the in-component "kind" to the canonical
    // activity_id the scoring config knows about. The drag game emits
    // `{ correct, total }` (12/12 on success); flashcards emit
    // `{ seen, total }` (3/3 once every card has been tapped).
    if (kind === 'mind-trap') {
      analytics.activityCompleted('thought-spiral', {
        sceneId: scene?.id,
        payload: {
          kind: 'drag-drop',
          detail: {
            correct: payload?.correct ?? 12,
            total: payload?.total ?? 12,
          },
        },
      });
    } else if (kind === 'flash-cards') {
      analytics.activityCompleted('impulse-cards', {
        sceneId: scene?.id,
        payload: {
          kind: 'flash-cards',
          detail: { seen: payload?.seen ?? 3, total: 3 },
        },
      });
    }
    markHoldDone(phase.id);
    advanceOrFinish({ kind: 'activity', phaseId: phase.id, ...payload });
  }, [phase, scene?.id, sessionId, markHoldDone, advanceOrFinish, analytics]);

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

      <AnimatePresence>
        {!audioEnabled && (
          <AudioConsentBanner onEnable={enableAudio} onDismiss={dismissAudio} />
        )}
      </AnimatePresence>

      <SceneProgress current={seq.index} total={phases.length} label={scene.title} actLabel="Act 2" />

      {/* Stage — two columns: avatar+narration on the left (~40%),
         the activity panel on the right (~60%). On mobile and small
         tablets the columns stack; from md+ they sit side-by-side. */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[2fr_3fr] md:gap-5 lg:gap-6">
        {/* LEFT — Shanaya (narrower column, ~33% of stage width) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#F4ECFE] via-[#FBF4E6] to-[#FFE9D9] p-3 ring-1 ring-ink-300/15 sm:p-4">
          <RoomBackdrop ambience={scene.ambience} />
          {/* Scene 3 only — colourful bubbles drift across the left
             panel to mirror the bubble-sorting game happening on the
             right. Pointer-events:none so it never blocks the avatar. */}
          {phase?.id === 's6-activity' && <FloatingBubblesBackdrop />}

          <div className="relative flex h-full min-h-[380px] flex-col sm:min-h-[460px] md:min-h-[520px]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500 sm:text-[11px]">
                Scene {sceneIdx + 1} of {act.scenes.length}
              </div>
              <div className="hidden text-right md:block">
                <div className="text-[11px] text-ink-500">Reflecting on the cart</div>
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
                  className="mt-4 rounded-2xl bg-white/85 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-700 ring-1 ring-ink-300/15 sm:px-4 sm:py-3 sm:text-[13.5px] md:text-[14px]"
                >
                  <span className="mr-1 text-ink-500">🎙️</span>{phase.narration}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT — activity panel (or a calm placeholder while narrating) */}
        <div className="relative">
          <div className="rounded-2xl bg-white/95 p-3 ring-1 ring-ink-300/15 shadow-sm sm:p-4 md:p-5 lg:p-6">
            {isActivityActive ? (
              <ActivityRenderer
                kind={activity.kind}
                onCueClick={onCueClick}
                onCueCorrect={onCueCorrect}
                onCueWrong={onCueWrong}
                onSpeakPrompt={(text) => audioEnabled && speak(text, { who: 'narrator' })}
                onRevealCard={(c) => {
                  if (!audioEnabled) return;
                  // Re-case known initialisms so the narrator says
                  // "Fomo" / "free" instead of letter-spelling them.
                  const sayable = (s) => s
                    .replace(/\bFOMO\b/g, 'Fomo')
                    .replace(/\bFREE\b/g, 'free');
                  const title = sayable(c.title);
                  const subtitle = c.subtitle ? sayable(c.subtitle) : '';
                  const body = sayable(c.body);
                  // Two separate speak() calls — the speech queue plays
                  // them back-to-back, but each is its own MP3 fetch so
                  // a chunking failure on the long body can't swallow
                  // the short heading. Previously we sent one big string
                  // and the title sometimes didn't land. Splitting fixes
                  // that and also gives a natural micro-pause between
                  // the heading and the explanation.
                  const heading = subtitle ? `${title}. ${subtitle}.` : `${title}.`;
                  speak(heading, { who: 'narrator' });
                  speak(body, { who: 'narrator' });
                }}
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

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={() => {
            const target = Math.max(0, seq.index - 1);
            // Cancel the in-flight TTS queue so the new phase's
            // narration starts cleanly instead of after the current one.
            cancelSpeech();
            spokenTexts.current.clear();
            lastSpokenPhaseIdRef.current = null;
            // Clear completed-hold flags from the target phase onward so
            // the bubble game / flash-cards re-arm when stepping back.
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
            // Cancel any TTS still playing from the current phase so
            // the next phase's narration starts cleanly without bleed.
            cancelSpeech();
            spokenTexts.current.clear();
            seq.advance();
          }}
          disabled={isActivityActive}
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold shadow-lg transition active:scale-[0.98] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs',
            isActivityActive
              ? 'bg-white/20 text-white/40 cursor-not-allowed shadow-none'
              : 'bg-saffron-500 text-ink-900 shadow-saffron-500/30 hover:bg-saffron-400',
          ].join(' ')}
        >
          {seq.isLast ? 'Finish Act 2' : 'Next'} <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <EndOfActCelebration
            actLabel="Act 2"
            title="Understanding Impulse Buying"
            stats={celebrationStats}
            takeaway="The trap has a name — IMPULSE BUYING. FOMO, suggestions, emotion, and 'saving' tricks slowly change what we buy. Now that you can name them, you can pause before you tap 'Buy'."
            continueLabel="Move to Act 3 →"
            onContinue={finishAct}
            secondaryLabel="Go to home"
            onSecondary={onGoHome}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Activity router =================== */

function ActivityRenderer({ kind, onCueClick, onCueCorrect, onCueWrong, onSpeakPrompt, onRevealCard, speakingDone, onComplete }) {
  if (kind === 'mind-trap') {
    return (
      <MindTrapBoard
        data={act2Activities.mindTrap}
        onCueClick={onCueClick}
        onCueCorrect={onCueCorrect}
        onCueWrong={onCueWrong}
        onSpeakPrompt={onSpeakPrompt}
        speakingDone={speakingDone}
        onComplete={() => onComplete({ activity: 'mind-trap' })}
      />
    );
  }
  if (kind === 'flash-cards') {
    return (
      <FlashCardDeck
        data={act2Activities.flashCards}
        onReveal={onRevealCard}
        speakingDone={speakingDone}
        onComplete={() => onComplete({ activity: 'flash-cards' })}
      />
    );
  }
  return null;
}

/* When no activity is active, show a calm summary card so the right
 * column doesn't go blank between scenes. Scene 1 sets up the
 * thought-spiral game; Scene 2 holds the IMPULSE BUYING definition;
 * Scene 3 introduces the flash-card deck. */
function PreActivityPlaceholder({ sceneIdx, isAfterActivity }) {
  /* Per-scene "what's coming" panel. Each summary leads with a real
   * consumer-research stat (the visual hook), then a short complement
   * to the left-side narration — NEVER a repeat of it. The stat
   * numbers are from widely-cited retail UX studies on impulse and
   * unplanned in-app purchases. */
  const summaries = [
    {
      eyebrow: 'Scene 1 · The game',
      stat: { number: '84%', label: 'of shoppers leave with more than they planned' },
      title: 'Why did her cart grow?',
      copy: 'Same brain, four mental shortcuts. Spot which trick drove each of Shanaya\'s twelve thoughts and where each one belongs.',
      tag: 'Drag 12 thoughts → 4 traps',
    },
    {
      eyebrow: 'Scene 2 · The pattern',
      stat: { number: '7 in 10', label: 'small in-app purchases are unplanned' },
      title: 'It already has a name',
      copy: 'Marketers built entire funnels around this one behaviour. You just mapped four flavours of it — now the trap finally gets named.',
      tag: 'Name the trick',
    },
    {
      eyebrow: 'Scene 3 · Up close',
      stat: { number: '3', label: 'patterns to spot before you tap "Buy"' },
      title: 'Tap. Flip. Learn.',
      copy: 'Three flash cards: FOMO, trigger design, and small-spend creep. The vocab you need to spot the trick before it spots you.',
      tag: 'Tap a card to reveal',
    },
  ];
  const s = summaries[sceneIdx] || summaries[0];

  return (
    <div className="flex min-h-[260px] flex-col items-start justify-center gap-3 p-2 sm:min-h-[340px] md:min-h-[440px]">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-saffron-500 sm:text-[11px]">{s.eyebrow}</div>

      {/* Big stat hook — the visual anchor that makes the panel feel
         distinct from the narration on the left card. */}
      {s.stat && (
        <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500/15 via-coral-500/10 to-burgundy-500/10 p-3 ring-1 ring-saffron-500/30 sm:p-4">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold leading-none text-saffron-600 sm:text-4xl md:text-5xl">
              {s.stat.number}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
              Source · retail UX research
            </div>
          </div>
          <div className="mt-1 text-[12.5px] font-semibold leading-snug text-ink-700 sm:text-[13.5px]">
            {s.stat.label}
          </div>
        </div>
      )}

      <h3 className="text-lg font-extrabold text-ink-900 sm:text-xl md:text-2xl">{s.title}</h3>
      <p className="max-w-md text-[13px] leading-relaxed text-ink-700 sm:text-[14px] md:text-[14.5px]">{s.copy}</p>

      <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-saffron-500/15 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-widest text-saffron-500 sm:text-[11px]">
        <Sparkles className="h-3.5 w-3.5" />
        {isAfterActivity ? 'Activity complete · Next' : s.tag}
      </div>
    </div>
  );
}

/* =================== Backdrop (re-used from Act 1, scoped) =================== */

/* Animated 3D bubbles — used only on Scene 3 (the mind-trap game) to
 * give the left panel the same playful energy as the floating thoughts
 * on the right. Each bubble is a glossy 3D sphere with a radial
 * highlight (top-left), an inner shadow, and a small specular dot to
 * sell the "blown-glass marble" look. Bubbles drift on unique
 * x/y/scale loops; the scale-with-opacity sells depth without 3D
 * transforms (which would conflict with the parent's overflow:hidden). */
function FloatingBubblesBackdrop() {
  // Six brand palettes — base colour + a darker shade for the gradient.
  const PALETTES = [
    { base: '#F5B43A', shade: '#C97E12' }, // saffron
    { base: '#FF6F61', shade: '#B8362C' }, // coral
    { base: '#A02C4B', shade: '#5C1224' }, // burgundy
    { base: '#34D1B8', shade: '#0E806E' }, // teal
    { base: '#EC4899', shade: '#9D174D' }, // pink/fuchsia
    { base: '#8B5CF6', shade: '#4C1D95' }, // purple/indigo
  ];
  // 18 hand-tuned bubbles spread across the panel — mixed sizes give
  // a sense of foreground/background depth.
  const bubbles = Array.from({ length: 18 }, (_, i) => {
    const palette = PALETTES[i % PALETTES.length];
    const size = 16 + ((i * 13) % 34);             // 16–48 px
    return {
      palette,
      size,
      top:   3 + ((i * 23 + 7) % 92),               // 3–94 %
      left:  3 + ((i * 41 + 5) % 92),               // 3–94 %
      dur:   7 + ((i * 5) % 7),                     // 7–13 s
      delay: (i * 0.43) % 5,
      dx:    16 + ((i + 1) % 4) * 8,                // 16–40 px sway
      dy:    20 + ((i + 2) % 4) * 10,               // 20–50 px sway
      // Closer (bigger) bubbles drift more and are slightly less opaque
      // so the smaller "background" bubbles read as distant.
      baseOpacity: size > 32 ? 0.55 : 0.78,
      peakOpacity: size > 32 ? 0.9  : 1,
    };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [b.baseOpacity, b.peakOpacity, b.baseOpacity],
            y: [0, -b.dy, b.dy / 2, -b.dy / 3, 0],
            x: [0, b.dx, -b.dx / 2, b.dx / 3, 0],
            scale: [1, 1.15, 0.96, 1.08, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
          style={{
            top: `${b.top}%`,
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            // Radial gradient → 3D glossy sphere effect.
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.85) 0%, ${b.palette.base} 38%, ${b.palette.shade} 100%)`,
            // Outer halo + inner darkening for depth.
            boxShadow: `0 6px 14px -2px ${b.palette.shade}55, inset -2px -3px 6px ${b.palette.shade}80, inset 2px 3px 4px rgba(255,255,255,0.35)`,
          }}
          className="absolute rounded-full"
        >
          {/* Specular dot — a small bright highlight on the top-left
              that sells the "polished marble" 3D feel. */}
          <span
            aria-hidden
            className="absolute rounded-full bg-white"
            style={{
              top:    `${Math.max(2, b.size * 0.12)}px`,
              left:   `${Math.max(2, b.size * 0.18)}px`,
              width:  `${Math.max(3, b.size * 0.18)}px`,
              height: `${Math.max(3, b.size * 0.18)}px`,
              opacity: 0.85,
              filter: 'blur(0.5px)',
            }}
          />
        </motion.span>
      ))}
    </div>
  );
}

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
