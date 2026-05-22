import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Sparkles, RotateCcw, Clock,
  Target, Crown, Users, Cog, Smartphone,
  Moon, Heart, Leaf, Flame, Shield, Package, Scale, Tag,
} from 'lucide-react';

/**
 * Multi-select challenge with a 20-second countdown, "try again" on wrong
 * answers, and a Mindful-Choice insight reveal on correct.
 *
 * Used by Act 3's four real-life simulations. Each scenario passes the
 * same `data` shape — only the prompt, options, and insight change.
 *
 * Props (mirrors MindTrapBoard so Act3.jsx can route to it uniformly):
 *   data          — { prompt, hint, timerSeconds, requiredPicks, options[],
 *                     retryMessage }
 *   insight       — { eyebrow, title, body }
 *   badge         — string label for the unlock badge (e.g. "Mindful Choice")
 *   onCueCorrect  — sound cue for correct submit
 *   onCueWrong    — sound cue for wrong submit
 *   onCueClick    — sound cue for option tap
 *   onSpeakInsight— pipes insight title+body to TTS once after correct
 *   speakingDone  — true when no TTS is in flight (gates Continue)
 *   onComplete    — called once with { activity: 'simulation-challenge', ... }
 */
export default function SimulationChallenge({
  data,
  insight,
  badge = 'Mindful Choice',
  onCueCorrect,
  onCueWrong,
  onCueClick,
  onSpeakInsight,
  speakingDone = true,
  onComplete,
}) {
  const required = data.requiredPicks || 2;
  const initialSeconds = data.timerSeconds || 20;

  /* selected: array of option ids picked so far. attempts: how many
   * wrong submits — show a hint after the 2nd attempt so the learner
   * doesn't get stuck. status: 'idle' | 'wrong' | 'correct'. */
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState('idle');
  const [attempts, setAttempts] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [timerExpired, setTimerExpired] = useState(false);
  /* Once the learner gets it right, we lock the answer to keep state
   * stable while the insight + Continue UI displays. */
  const lockedRef = useRef(false);
  const insightSpokenRef = useRef(false);

  /* Countdown — pauses while status is 'correct' so the timer doesn't
   * keep ticking while reading the insight. Fully runs out → timerExpired
   * banner appears but the challenge stays open (no auto-fail). */
  useEffect(() => {
    if (lockedRef.current) return;
    if (secondsLeft <= 0) {
      if (!timerExpired) setTimerExpired(true);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, timerExpired]);

  /* Speak the insight once when the learner gets it right. */
  useEffect(() => {
    if (status !== 'correct') return;
    if (insightSpokenRef.current) return;
    insightSpokenRef.current = true;
    onSpeakInsight?.(insight);
  }, [status, insight, onSpeakInsight]);

  const toggle = (id) => {
    if (lockedRef.current) return;
    if (status === 'wrong') return; // wait for the shake-and-reset
    onCueClick?.();
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= required) return prev; // cap at required picks
      return [...prev, id];
    });
  };

  const submit = () => {
    if (lockedRef.current) return;
    if (selected.length !== required) return;
    // All selected must be correct=true.
    const allCorrect = selected.every((id) => {
      const opt = data.options.find((o) => o.id === id);
      return opt?.correct;
    });
    if (allCorrect) {
      onCueCorrect?.();
      setStatus('correct');
      lockedRef.current = true;
    } else {
      onCueWrong?.();
      setStatus('wrong');
      setAttempts((a) => a + 1);
      // Clear the wrong state + reset selection after the shake animation
      // so the learner can try again without seeing a stuck red ring.
      setTimeout(() => {
        setSelected([]);
        setStatus('idle');
      }, 1400);
    }
  };

  const reset = () => {
    if (lockedRef.current) return;
    setSelected([]);
    setStatus('idle');
  };

  const correctIds = data.options.filter((o) => o.correct).map((o) => o.id);
  const isCorrect = status === 'correct';

  return (
    <div className="relative flex flex-col gap-4">
      {/* Header — prompt + timer */}
      <header>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-500">
              🎮 Live challenge · pick {required}
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">
              {data.prompt}
            </h3>
            {data.hint && (
              <p className="mt-0.5 text-[12px] text-ink-500">{data.hint}</p>
            )}
          </div>
          {/* 20s pill timer — turns red below 6s, pauses on correct */}
          <TimerPill
            seconds={secondsLeft}
            total={initialSeconds}
            frozen={isCorrect}
            expired={timerExpired && !isCorrect}
          />
        </div>
      </header>

      {/* Option grid — five animated 3D trading-card style buttons */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {data.options.map((opt, i) => {
          const picked = selected.includes(opt.id);
          const showReveal = isCorrect;
          const revealCorrect = showReveal && correctIds.includes(opt.id);
          const wrongShake = status === 'wrong' && picked && !opt.correct;
          const theme = optionTheme(opt.id);
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              disabled={lockedRef.current}
              initial={{ opacity: 0, y: 8 }}
              animate={
                wrongShake
                  ? { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 3, 0] }
                  : { opacity: 1, y: 0 }
              }
              transition={
                wrongShake
                  ? { duration: 0.5 }
                  : { delay: 0.05 + i * 0.06, duration: 0.35 }
              }
              whileHover={!lockedRef.current ? { y: -2, scale: 1.01 } : {}}
              whileTap={!lockedRef.current ? { scale: 0.98 } : {}}
              className={[
                'group relative overflow-hidden rounded-2xl px-3 py-3 text-left transition-all',
                'ring-1 shadow-md',
                revealCorrect
                  ? 'bg-gradient-to-br from-teal-500/15 to-emerald-500/10 ring-2 ring-teal-500'
                  : showReveal
                    ? 'bg-white opacity-60 ring-ink-300/20'
                    : picked
                      ? 'bg-saffron-500/15 ring-2 ring-saffron-500 shadow-saffron-500/30'
                      : 'bg-white ring-ink-300/20 hover:ring-saffron-500/50',
              ].join(' ')}
            >
              {/* Faint themed corner glow — adds depth, not noise. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full opacity-30 blur-2xl"
                style={{ background: theme.shade }}
              />

              <div className="relative flex items-start gap-3">
                {/* 3D themed trading-card puck — illustration + emoji */}
                <OptionPuck theme={theme} emoji={opt.emoji} picked={picked || revealCorrect} />

                <div className="min-w-0 flex-1 pt-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: theme.shade }}>
                    {theme.tag}
                  </div>
                  <div className="mt-0.5 text-[14px] font-extrabold leading-tight text-ink-900 sm:text-[15px]">
                    {opt.label}
                  </div>
                </div>
                {/* Check / X indicator */}
                <span className="shrink-0 pt-1">
                  {revealCorrect ? (
                    <Check className="h-5 w-5 text-teal-600" strokeWidth={3} />
                  ) : showReveal && picked ? (
                    <X className="h-5 w-5 text-ink-400" strokeWidth={3} />
                  ) : picked ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-saffron-500 text-[10px] font-extrabold text-ink-900">
                      ✓
                    </span>
                  ) : (
                    <span className="block h-5 w-5 rounded-full border-2 border-ink-300/30" />
                  )}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom bar — submit button OR retry banner OR insight + continue */}
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="submit-bar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-2"
          >
            <div className="text-[12px] text-ink-500">
              {selected.length} / {required} picked
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-300/30 bg-white px-3 py-2 text-[11.5px] font-semibold text-ink-700 transition hover:bg-cream-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Clear
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={selected.length !== required}
                className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500 px-4 py-2 text-[12px] font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" /> Submit
              </button>
            </div>
          </motion.div>
        )}

        {status === 'wrong' && (
          <motion.div
            key="wrong-banner"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-2xl bg-burgundy-500/10 px-3 py-2.5 text-[12.5px] font-semibold text-burgundy-500 ring-1 ring-burgundy-500/40"
          >
            <X className="h-4 w-4" strokeWidth={3} />
            <span>{data.retryMessage || 'Try again — think about NEED vs EMOTION.'}</span>
            {attempts >= 2 && (
              <span className="ml-auto rounded-full bg-burgundy-500/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-burgundy-500">
                Hint: all three correct picks share an EMOTIONAL trigger
              </span>
            )}
          </motion.div>
        )}

        {isCorrect && (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-saffron-500/15 via-coral-500/10 to-teal-500/10 p-4 ring-1 ring-saffron-500/40"
          >
            {/* Badge unlock */}
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.8 }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-500 to-coral-500 text-lg text-white shadow-lg"
              >
                🏆
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-saffron-600">
                  {insight?.eyebrow || `${badge} unlocked`}
                </div>
                <div className="text-[14.5px] font-extrabold leading-tight text-ink-900 sm:text-[15.5px]">
                  {insight?.title}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700 sm:text-[13.5px]">
              {insight?.body}
            </p>
            <button
              type="button"
              onClick={() => speakingDone && onComplete?.({ activity: 'simulation-challenge' })}
              disabled={!speakingDone}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-saffron-500 px-4 py-2 text-[12px] font-bold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" /> Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time-up nudge — doesn't fail the challenge, just calls it out so
          slow learners don't think the page is stuck. */}
      {timerExpired && !isCorrect && status !== 'wrong' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-2xl bg-ink-300/15 px-3 py-2 text-[11.5px] font-semibold text-ink-700"
        >
          <Clock className="h-3.5 w-3.5" /> Take your time — but keep thinking about NEED vs EMOTION.
        </motion.div>
      )}
    </div>
  );
}

/* ============== Animated timer pill ============== */
function TimerPill({ seconds, total, frozen, expired }) {
  const pct = Math.max(0, Math.min(1, seconds / total));
  const danger = !frozen && seconds <= 6;
  const tone = frozen
    ? 'from-teal-500 to-emerald-600'
    : danger
      ? 'from-burgundy-500 to-coral-500'
      : 'from-saffron-500 to-coral-500';
  const display = expired ? '⏱' : String(Math.max(0, seconds)).padStart(2, '0');
  return (
    <motion.div
      animate={danger && !expired ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={danger ? { duration: 1, repeat: Infinity } : {}}
      className={`relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${tone} text-white shadow-lg ring-1 ring-white/30`}
    >
      {/* Circular fill */}
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 36 36"
        aria-hidden
      >
        <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
        <motion.circle
          cx="18"
          cy="18"
          r="16"
          stroke="white"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={Math.PI * 2 * 16}
          animate={{ strokeDashoffset: Math.PI * 2 * 16 * (1 - pct) }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <div className="relative flex flex-col items-center leading-none">
        <span className="text-[14px] font-extrabold tabular-nums">{display}</span>
        <span className="text-[8px] font-bold uppercase tracking-widest opacity-90">
          {frozen ? 'Done' : expired ? 'Time' : 'Sec'}
        </span>
      </div>
    </motion.div>
  );
}

/* ============== Themed option puck ==============
 * Each option's id is mapped to a colour palette + a small glyph that
 * sits behind the emoji at ~25% opacity, giving the puck the feel of a
 * trading-card. The visible emoji sits on top in sharp contrast.
 * ============================================================ */
const GLYPHS = {
  target: Target,
  crown: Crown,
  users: Users,
  gear: Cog,
  phone: Smartphone,
  moon: Moon,
  heart: Heart,
  leaf: Leaf,
  clock: Clock,
  flame: Flame,
  shield: Shield,
  box: Package,
  scale: Scale,
  tag: Tag,
};

function optionTheme(id) {
  const map = {
    // Scenario 1 — Better Deal Confusion
    need:     { base: '#A7F3D0', shade: '#059669', tag: 'NEED',      icon: 'target' },
    brand:    { base: '#FCE7F3', shade: '#DB2777', tag: 'BRAND',     icon: 'crown'  },
    peer:     { base: '#DDD6FE', shade: '#7C3AED', tag: 'PEER',      icon: 'users'  },
    function: { base: '#BFDBFE', shade: '#2563EB', tag: 'FUNCTION',  icon: 'gear'   },
    social:   { base: '#CFFAFE', shade: '#0891B2', tag: 'SOCIAL',    icon: 'phone'  },
    // Scenario 2 — Food Spiral
    hunger:   { base: '#A7F3D0', shade: '#059669', tag: 'HUNGER',    icon: 'target' },
    boredom:  { base: '#DDD6FE', shade: '#7C3AED', tag: 'BOREDOM',   icon: 'moon'   },
    mood:     { base: '#FCE7F3', shade: '#DB2777', tag: 'MOOD',      icon: 'heart'  },
    healthy:  { base: '#BFDBFE', shade: '#2563EB', tag: 'HEALTHY',   icon: 'leaf'   },
    fomo:     { base: '#FED7AA', shade: '#EA580C', tag: 'FOMO',      icon: 'clock'  },
    // Scenario 3 — Group Chat Pull
    fitting:  { base: '#DDD6FE', shade: '#7C3AED', tag: 'BELONGING', icon: 'users'  },
    cool:     { base: '#FCE7F3', shade: '#DB2777', tag: 'IDENTITY',  icon: 'flame'  },
    quality:  { base: '#BFDBFE', shade: '#2563EB', tag: 'QUALITY',   icon: 'shield' },
    // Scenario 4 — Flash Sale
    urgency:  { base: '#FED7AA', shade: '#EA580C', tag: 'URGENCY',   icon: 'clock'  },
    scarcity: { base: '#FCE7F3', shade: '#DB2777', tag: 'SCARCITY',  icon: 'box'    },
    fair:     { base: '#BFDBFE', shade: '#2563EB', tag: 'FAIR PRICE',icon: 'scale'  },
    anchor:   { base: '#DDD6FE', shade: '#7C3AED', tag: 'ANCHORING', icon: 'tag'    },
  };
  return map[id] || { base: '#F4ECFE', shade: '#6B7280', tag: 'OPTION', icon: 'target' };
}

function OptionPuck({ theme, emoji, picked }) {
  const Glyph = GLYPHS[theme.icon] || Target;
  return (
    <span
      className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/40"
      style={{
        background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92) 0%, ${theme.base} 42%, ${theme.shade} 100%)`,
        boxShadow: `inset -2px -3px 6px ${theme.shade}55, inset 2px 3px 4px rgba(255,255,255,0.45)`,
      }}
    >
      {/* Themed glyph behind the emoji at low opacity. */}
      <Glyph
        className="absolute inset-0 m-auto h-9 w-9 opacity-25"
        style={{ color: theme.shade }}
        strokeWidth={2.5}
      />
      {/* Emoji on top in sharp focus. */}
      <span className="relative text-2xl drop-shadow-sm">{emoji}</span>
      {/* Specular highlight — top-left bright dot. */}
      <span
        aria-hidden
        className="absolute rounded-full bg-white"
        style={{ top: 4, left: 7, width: 7, height: 7, opacity: 0.85, filter: 'blur(0.6px)' }}
      />
      {/* Pulsing inner ring when this option is currently picked. */}
      {picked && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-2xl border-2 border-white/80"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </span>
  );
}
