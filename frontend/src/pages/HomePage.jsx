import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Sparkles } from 'lucide-react';
import { lesson } from '../data/lessons/thinkBeforeYouSpend.js';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingBubbles />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <a href="/" aria-label="Lean Hyphen home" className="inline-flex shrink-0">
          <img src="/lean-hyphen-logo.svg" alt="Lean Hyphen" className="h-12 w-auto sm:h-14" draggable={false} />
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

      <main className="mt-6 flex flex-col items-start gap-6 sm:mt-8">
        <span className="chip bg-saffron-500/15 text-saffron-400">
          <Sparkles className="h-3 w-3" /> Module · {lesson.module}
        </span>
        <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          {lesson.title}
        </h1>
        <p className="max-w-2xl text-lg text-white/70">
          {lesson.hero.tagline} Spend ~{lesson.totalMinutes} minutes walking through a
          short story, then test what you noticed.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {lesson.totalMinutes} min total
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to={`/lesson/${lesson.id}/act1`} className="btn-primary px-7 py-4 text-base">
            <Play className="h-4 w-4" />
            Start Act 1
          </Link>
          <span className="relative inline-flex group">
            <Link
              to={`/lesson/${lesson.id}/act2`}
              className="inline-flex items-center gap-2 rounded-full border border-saffron-500/50 bg-saffron-500/10 px-6 py-4 text-base font-semibold text-saffron-400 transition hover:bg-saffron-500/20 hover:text-saffron-300"
            >
              <Play className="h-4 w-4" />
              Start Act 2
            </Link>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg ring-1 ring-white/15 transition group-hover:opacity-100"
            >
              Hope you completed Act 1 — now play Act 2
              <span aria-hidden className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink-900 ring-1 ring-white/15" />
            </span>
          </span>
        </div>
      </main>

      <section className="mt-20 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.values(lesson.acts).map((act, i) => (
          <ActCard key={act.id} act={act} index={i} />
        ))}
      </section>

      <footer className="mt-auto pt-16 text-xs text-white/40">
        © {new Date().getFullYear()} Lean Hyphen · Built for behaviour-first learning.
      </footer>
      </div>
    </div>
  );
}

/* =================== Floating colour bubbles ===================
 * Eight blurred, coloured "light orbs" drift around behind the page
 * content. Each bubble:
 *   - has its own colour from the brand palette (saffron / coral /
 *     teal / magenta / sky / violet),
 *   - has its own size (160–360 px) and starting position,
 *   - drifts on a unique 14–28 s loop with subtle scale + opacity
 *     breathing so the screen always feels alive but never busy.
 *
 * 36-px blur + low opacity means the bubbles read as soft coloured
 * light, not as solid disks. Pointer-events-off so they never block
 * clicks. No library, no canvas — pure framer-motion + Tailwind.
 */
function FloatingBubbles() {
  const bubbles = [
    { color: '#FF9F1C', size: 280, x0: -60,  y0: -40,  dx:  140, dy:  120, dur: 22, op: 0.30 },
    { color: '#FF6B6B', size: 320, x0:  '60%', y0: -80, dx: -160, dy:   80, dur: 26, op: 0.28 },
    { color: '#14B8A6', size: 240, x0: '20%', y0: '40%', dx:  120, dy:  -90, dur: 20, op: 0.22 },
    { color: '#9B5DE5', size: 360, x0: '70%', y0: '55%', dx: -100, dy:  110, dur: 28, op: 0.22 },
    { color: '#F15BB5', size: 200, x0: '10%', y0: '70%', dx:  130, dy:  -70, dur: 18, op: 0.24 },
    { color: '#06AED5', size: 220, x0: '85%', y0: '30%', dx: -130, dy:  100, dur: 24, op: 0.20 },
    { color: '#FFD23F', size: 180, x0: '40%', y0: '15%', dx:  -90, dy:   60, dur: 16, op: 0.22 },
    { color: '#7DDA58', size: 160, x0: '55%', y0: '80%', dx:  100, dy:  -80, dur: 14, op: 0.18 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x0,
            top: b.y0,
            width: b.size,
            height: b.size,
            backgroundColor: b.color,
            opacity: b.op,
            filter: 'blur(60px)',
            willChange: 'transform, opacity',
          }}
          animate={{
            x: [0, b.dx, -b.dx * 0.5, b.dx * 0.3, 0],
            y: [0, b.dy, b.dy * -0.4, b.dy * 0.6, 0],
            scale: [1, 1.15, 0.92, 1.08, 1],
            opacity: [b.op, b.op * 1.3, b.op * 0.85, b.op * 1.15, b.op],
          }}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.6,
          }}
        />
      ))}
    </div>
  );
}

function ActCard({ act, index }) {
  const isPlayable = act.id === 'act1' || act.id === 'act2';
  const showAct2Tip = act.id === 'act2';
  const body = (
    <div className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition group-hover:border-saffron-500/40 group-hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
          Act {index + 1}
        </span>
        <span className="text-[11px] text-white/50">{act.minutes} min</span>
      </div>
      <div className="mt-3 text-base font-semibold text-white">{act.title.replace(/^Act \d+ — /, '')}</div>
      <div className="mt-auto pt-4 text-xs text-white/50">
        {isPlayable ? 'Ready to play' : 'Coming soon'}
      </div>
      {showAct2Tip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-xl ring-1 ring-saffron-500/40 transition group-hover:opacity-100"
        >
          Hope you completed Act 1 — now play Act 2
          <span aria-hidden className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink-900 ring-1 ring-saffron-500/40" />
        </span>
      )}
    </div>
  );
  return isPlayable ? (
    <Link to={`/lesson/${lesson.id}/${act.id}`} className="group">{body}</Link>
  ) : (
    <div className="group opacity-70">{body}</div>
  );
}
