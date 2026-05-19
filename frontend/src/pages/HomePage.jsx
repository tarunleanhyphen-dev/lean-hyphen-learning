import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, Clock, Sparkles, ShieldCheck, ArrowRight, RotateCcw,
  Eye, Brain, ShoppingBag, Lock, Check,
} from 'lucide-react';
import { lesson } from '../data/lessons/thinkBeforeYouSpend.js';
import { useLesson } from '../context/LessonContext.jsx';

/**
 * Home / landing page for the "Think Before You Spend" module.
 *
 * Designed in the shape of a real product-grade ed-tech landing page:
 *   1. Ambient backdrop      — floating orbs + faint dot grid for depth
 *   2. Hero                  — module chip + title + tagline + smart CTA
 *                              (pulls from localStorage to render "Resume"
 *                              when there's existing progress, otherwise
 *                              "Start Act 1")
 *   3. What you'll learn     — three benefit cards w/ icons
 *   4. Your journey          — all four acts on a stepped path UI; each
 *                              card shows status (Done / Ready / Coming
 *                              soon) with the right affordance
 *   5. Trust signals         — four mini stats (Self-paced, Grade 7-9,
 *                              No login, India-built)
 *   6. Footer
 */
export default function HomePage() {
  const { state } = useLesson();
  const progress = state?.[lesson.id]?.progress || {};

  const act1Done = progress.act1 === 'completed';
  const act2Done = progress.act2 === 'completed';

  // Smart resume target. If act1 done but act2 not, jump to act2; if both
  // done, replay from act1; otherwise start at act1.
  const { resumeHref, resumeLabel, resumeIcon: ResumeIcon, isReturning } = useMemo(() => {
    if (act1Done && !act2Done) {
      return { resumeHref: `/lesson/${lesson.id}/act2`, resumeLabel: 'Continue from Act 2', resumeIcon: ArrowRight, isReturning: true };
    }
    if (act1Done && act2Done) {
      return { resumeHref: `/lesson/${lesson.id}/act1`, resumeLabel: 'Replay from Act 1', resumeIcon: RotateCcw, isReturning: true };
    }
    return { resumeHref: `/lesson/${lesson.id}/act1`, resumeLabel: 'Start Act 1', resumeIcon: Play, isReturning: false };
  }, [act1Done, act2Done]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-900 text-white">
      <AmbientBackdrop />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <a href="/" aria-label="Lean Hyphen home" className="inline-flex shrink-0">
            <img src="/lean-hyphen-logo.svg" alt="Lean Hyphen" className="h-9 w-auto sm:h-10" draggable={false} />
          </a>
          <a
            href="https://lean-hyphen-user-web-4zrf.vercel.app/#home"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            ← back to leanhyphen.com
          </a>
        </header>

        {/* Hero */}
        <main className="mt-12 grid grid-cols-1 items-center gap-10 lg:mt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-start gap-6"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-saffron-400">
              <Sparkles className="h-3 w-3" /> Module · {lesson.module}
            </span>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[58px]">
              {lesson.title.split(' ').slice(0, -2).join(' ')}
              <br />
              <span className="bg-gradient-to-r from-saffron-400 via-coral-400 to-saffron-300 bg-clip-text text-transparent">
                {lesson.title.split(' ').slice(-2).join(' ')}.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-white/75">
              A story-driven simulation about impulse buying. Walk through Shanaya's
              birthday-shopping afternoon and catch the manipulation patterns shopping
              apps actually use on you.
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55">
              <Meta icon={Clock}      text={`${lesson.totalMinutes} min total`} />
              <Sep />
              <Meta icon={ShieldCheck} text="No login. No ads." />
              <Sep />
              <Meta icon={Sparkles}    text="Grade 7–9 · self-paced" />
            </div>

            {/* CTAs */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Link
                to={resumeHref}
                className="group inline-flex items-center gap-2 rounded-full bg-saffron-500 px-7 py-4 text-base font-extrabold text-ink-900 shadow-lg shadow-saffron-500/30 transition hover:bg-saffron-400 active:scale-[0.98]"
              >
                <ResumeIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                {resumeLabel}
              </Link>
              {!isReturning && (
                <Link
                  to={`/lesson/${lesson.id}/act2`}
                  className="inline-flex items-center gap-2 rounded-full border border-saffron-500/40 bg-saffron-500/10 px-6 py-4 text-base font-semibold text-saffron-300 transition hover:bg-saffron-500/20 hover:text-saffron-200"
                >
                  <Play className="h-4 w-4" />
                  Jump to Act 2
                </Link>
              )}
              {isReturning && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-300">
                  <Check className="h-3.5 w-3.5" /> Welcome back · your progress is saved
                </span>
              )}
            </div>
          </motion.div>

          {/* Right-side preview card — Shanaya's "afternoon" framed like a phone */}
          <HeroPreview />
        </main>

        {/* What you'll learn */}
        <section className="mt-24 sm:mt-28">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-400">What you'll learn</div>
              <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                Three skills you'll walk away with
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LearnCard
              Icon={Eye}
              tint="from-saffron-500/15 to-saffron-500/0"
              ring="ring-saffron-500/30"
              title="Spot the tricks"
              body="Cross-sell, social proof, urgency timers, free-delivery thresholds — see them coming."
            />
            <LearnCard
              Icon={Brain}
              tint="from-teal-500/15 to-teal-500/0"
              ring="ring-teal-500/30"
              title="Build a pause framework"
              body="Five questions you can run in your head before you ever tap 'Buy': Plan, Need, Budget, Wait, Trade-off."
            />
            <LearnCard
              Icon={ShoppingBag}
              tint="from-coral-500/15 to-coral-500/0"
              ring="ring-coral-500/30"
              title="Real shopping scenes"
              body="Interactive mock-app scenarios, not slides. The same nudges Indian shopping apps actually use."
            />
          </div>
        </section>

        {/* Your journey — 4 acts on a stepped path */}
        <section className="mt-20 sm:mt-24">
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-saffron-400">Your journey</div>
            <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              Four acts. Eighteen minutes. One eye-opener.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(lesson.acts).map((act, i) => {
              const status = progress[act.id];
              const playable = act.status !== 'coming-soon';
              return (
                <ActPathCard
                  key={act.id}
                  act={act}
                  index={i}
                  status={status}
                  playable={playable}
                />
              );
            })}
          </div>
        </section>

        {/* Trust signals */}
        <section className="mt-20 grid grid-cols-2 gap-3 sm:mt-24 sm:grid-cols-4">
          <TrustChip label="Self-paced" sub="Pause / replay any moment" />
          <TrustChip label="Grade 7–9" sub="Designed for class 7-9 students" />
          <TrustChip label="No login" sub="Open the link and play" />
          <TrustChip label="Made in India" sub="₹ scenarios, Indian voices" />
        </section>

        <footer className="mt-auto flex flex-col items-start justify-between gap-3 pt-16 sm:flex-row sm:items-center">
          <div className="text-xs text-white/40">
            © {new Date().getFullYear()} Lean Hyphen · Built for behaviour-first learning.
          </div>
          <a
            href="https://lean-hyphen-user-web-4zrf.vercel.app/#home"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-white/40 underline-offset-4 hover:text-white/80 hover:underline"
          >
            leanhyphen.com
          </a>
        </footer>
      </div>
    </div>
  );
}

/* =========================== Pieces =========================== */

function Meta({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4" /> {text}
    </span>
  );
}

function Sep() { return <span aria-hidden className="h-1 w-1 rounded-full bg-white/25" />; }

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-md"
    >
      {/* Glow */}
      <div aria-hidden className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-saffron-500/30 via-coral-500/20 to-teal-500/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-[#FFE0E9] via-[#FFD0C0] to-[#FFE5B4] p-6 ring-4 ring-white/85 shadow-2xl sm:p-7">
        {/* Stylised flat illustration of Shanaya in her room. Same palette
           as the avatar's RoomScene so the preview feels like a window into
           Act 1, not a stock asset. */}
        <svg viewBox="0 0 320 240" className="h-auto w-full">
          <defs>
            <linearGradient id="hp-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#FFE0E9" />
              <stop offset="100%" stopColor="#FFD0C0" />
            </linearGradient>
            <linearGradient id="hp-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#E8B98A" />
              <stop offset="100%" stopColor="#C99B6D" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#hp-wall)" />
          <rect y="180" width="320" height="60" fill="url(#hp-floor)" />
          <rect y="177" width="320" height="5" fill="#B8855F" />

          {/* Window */}
          <rect x="22" y="22" width="80" height="62" fill="#A07050" rx="4" />
          <rect x="26" y="26" width="72" height="54" fill="#A8D8E8" rx="2" />
          <circle cx="80" cy="40" r="6" fill="#FFF7C8" />
          <rect x="26" y="50" width="72" height="3" fill="#A07050" />
          <rect x="58" y="26" width="3" height="54" fill="#A07050" />
          <path d="M12 22 Q15 78 10 92 Q18 86 22 92 L22 22 Z" fill="#FF8FAB" />
          <path d="M112 22 Q108 78 113 92 Q105 86 100 92 L100 22 Z" fill="#FF8FAB" />

          {/* Heart picture */}
          <rect x="220" y="32" width="68" height="54" fill="#FFFFFF" stroke="#A07050" strokeWidth="2.5" rx="3" />
          <path d="M254 76 C247 70 235 60 235 49 C235 43 240 39 247 39 C251 39 254 41 254 41 C254 41 257 39 261 39 C268 39 273 43 273 49 C273 60 261 70 254 76 Z" fill="#FF6B6B" />

          {/* Shanaya silhouette (simplified) — circular face + body */}
          <g transform="translate(160 130)">
            <ellipse cx="0" cy="-30" rx="34" ry="38" fill="#EDB98A" />
            {/* Hair */}
            <path d="M-34 -45 Q-40 -75 0 -70 Q40 -75 34 -45 L34 -22 Q24 -50 0 -50 Q-24 -50 -34 -22 Z" fill="#2C1B18" />
            <path d="M-34 -28 L-38 30 L-30 36 L-26 -10 Z" fill="#2C1B18" />
            <path d="M34 -28 L38 30 L30 36 L26 -10 Z" fill="#2C1B18" />
            {/* Eyes */}
            <ellipse cx="-11" cy="-28" rx="3" ry="3.5" fill="#1A1426" />
            <ellipse cx="11"  cy="-28" rx="3" ry="3.5" fill="#1A1426" />
            {/* Smile */}
            <path d="M-9 -12 Q0 -5 9 -12" stroke="#7A2A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Body / coral top */}
            <path d="M-44 14 Q-30 4 0 4 Q30 4 44 14 L52 70 L-52 70 Z" fill="#FF5A4A" />
          </g>

          {/* Floating thought icons */}
          <g>
            <circle cx="60" cy="130" r="14" fill="#FFFFFF" stroke="#FFB088" strokeWidth="2" />
            <text x="60" y="136" textAnchor="middle" fontSize="14">👟</text>
          </g>
          <g>
            <circle cx="270" cy="148" r="14" fill="#FFFFFF" stroke="#FFB088" strokeWidth="2" />
            <text x="270" y="154" textAnchor="middle" fontSize="14">🎂</text>
          </g>
          <g>
            <circle cx="90" cy="180" r="12" fill="#FFFFFF" stroke="#FFB088" strokeWidth="2" />
            <text x="90" y="186" textAnchor="middle" fontSize="12">☕</text>
          </g>
        </svg>

        {/* Caption */}
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-white/85 p-3 ring-1 ring-ink-300/20">
          <span className="text-base leading-none">💭</span>
          <p className="text-[13px] leading-snug text-ink-800">
            "I just need one good pair of shoes for my birthday. I'll stay within ₹1,500…"
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function LearnCard({ Icon, title, body, tint, ring }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tint} p-5 ring-1 ${ring} backdrop-blur`}
    >
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-base font-extrabold text-white">{title}</div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">{body}</p>
    </motion.div>
  );
}

function ActPathCard({ act, index, status, playable }) {
  const isDone   = status === 'completed';
  const isLocked = !playable;
  const accent =
    isDone   ? 'border-teal-500/40 ring-teal-500/20' :
    isLocked ? 'border-white/10  ring-white/5'      :
               'border-saffron-500/40 ring-saffron-500/15';
  const label =
    isDone   ? 'Completed' :
    isLocked ? 'Coming soon' :
               'Ready to play';
  const labelClass =
    isDone   ? 'text-teal-300' :
    isLocked ? 'text-white/40' :
               'text-saffron-300';

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={`group relative flex h-full flex-col rounded-2xl border bg-white/[0.04] p-5 transition ${accent} ${playable ? 'hover:bg-white/[0.07]' : 'opacity-70'}`}
    >
      {/* Step number ribbon */}
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white/10 px-2 text-[11px] font-extrabold text-white/85 ring-1 ring-white/15">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {act.minutes} min
        </span>
      </div>

      <div className="text-[15px] font-extrabold leading-tight text-white">
        {act.title.replace(/^Act \d+ — /, '')}
      </div>

      <div className={`mt-auto pt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${labelClass}`}>
        {isDone   && <Check    className="h-3.5 w-3.5" />}
        {isLocked && <Lock     className="h-3.5 w-3.5" />}
        {!isDone && !isLocked && <Play className="h-3.5 w-3.5" />}
        {label}
      </div>
    </motion.div>
  );

  return playable ? (
    <Link to={`/lesson/${lesson.id}/${act.id}`}>{body}</Link>
  ) : (
    <div>{body}</div>
  );
}

function TrustChip({ label, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="text-[13px] font-extrabold text-white">{label}</div>
      <div className="mt-0.5 text-[11px] text-white/55">{sub}</div>
    </motion.div>
  );
}

/* =========================== Ambient backdrop =========================== */

function AmbientBackdrop() {
  // Three big soft blobs + a faint dotted grid. Pure CSS / SVG so no
  // network fetch, no perf cost. Pointer events off; pure decoration.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-saffron-500/15 blur-[120px]" />
      <div className="absolute top-40 -right-16 h-[460px] w-[460px] rounded-full bg-coral-500/15 blur-[120px]" />
      <div className="absolute bottom-20 left-1/3 h-[380px] w-[380px] rounded-full bg-teal-500/10 blur-[120px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lh-home-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lh-home-grid)" />
      </svg>
    </div>
  );
}
