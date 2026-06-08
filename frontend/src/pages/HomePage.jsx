import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Sparkles, Lock, CheckCircle2, Trophy, ArrowRight, BarChart3 } from 'lucide-react';
import { getFeaturedLesson, getOtherLessons } from '../data/lessons/registry.js';
import { useLesson } from '../context/LessonContext.jsx';

const ACT_ORDER = ['act1', 'act2', 'act3', 'act4'];

function computeUnlocks(progress) {
  const completed = {};
  const unlocked  = { act1: true };
  for (let i = 0; i < ACT_ORDER.length; i += 1) {
    const id = ACT_ORDER[i];
    completed[id] = progress?.[id] === 'completed';
    if (i > 0) unlocked[id] = completed[ACT_ORDER[i - 1]];
  }
  return { completed, unlocked };
}

export default function HomePage() {
  const { state } = useLesson();
  const featured = getFeaturedLesson();
  // getOtherLessons() returns [] when the deploy is pinned to one lesson
  // via VITE_FEATURED_LESSON — so the lesson-1 URL never shows lesson-2
  // tiles in "Other lessons", and vice-versa.
  const others = getOtherLessons();

  const lesson = featured.data;
  const progress = state?.[lesson.id]?.progress;
  const { completed, unlocked } = computeUnlocks(progress);
  const nextActId = ACT_ORDER.find((id) => !completed[id]) || 'act1';
  const nextActIdx = ACT_ORDER.indexOf(nextActId);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background matches Lesson 1: the clean dark-purple body gradient only.
       * FloatingBubbles removed per request (the bright blobs read as too dark/busy). */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex items-center justify-between">
          <a href="/" aria-label="Lean Hyphen home" className="inline-flex shrink-0">
            <img src="/lean-hyphen-logo.svg" alt="Lean Hyphen" className="h-10 w-auto sm:h-12 md:h-14" draggable={false} />
          </a>
          <div className="flex items-center gap-4">
            <Link
              to="/lesson2"
              className="text-xs font-semibold text-amber-300 underline-offset-4 hover:text-amber-200 hover:underline"
            >
              Where Does My Money Go? →
            </Link>
            <a
              href="https://lean-hyphen-user-web-4zrf.vercel.app/#home"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              ← back to leanhyphen.com
            </a>
          </div>
        </header>

        <main className="mt-6 flex flex-col items-start gap-6 sm:mt-8">
          <span className="chip bg-saffron-500/15 text-saffron-400">
            <Sparkles className="h-3 w-3" /> Module · {lesson.module}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
            {lesson.title}
          </h1>
          <p className="max-w-2xl text-base text-white/70 sm:text-lg">
            {lesson.hero.tagline} Spend ~{lesson.totalMinutes} minutes walking through a
            short story, then test what you noticed.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> ~{lesson.totalMinutes} minutes total
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to={`/lesson/${lesson.id}/${nextActId}`} className="btn-primary px-7 py-4 text-base">
              <Play className="h-4 w-4" />
              {nextActIdx === 0 ? 'Start Act 1' : `Continue · Act ${nextActIdx + 1}`}
            </Link>
          </div>
        </main>

        <section className="mt-20 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(lesson.acts).map((act, i) => (
            <ActCard
              key={act.id}
              lessonId={lesson.id}
              act={act}
              index={i}
              unlocked={(lesson.freeNavigation || !!unlocked[act.id]) && !!featured.acts[act.id]}
              completed={!!completed[act.id]}
              hasComponent={!!featured.acts[act.id]}
            />
          ))}
        </section>

        {/* Performance report card — always visible, deep-links to
           /lesson/:lessonId/report. Two visual states: muted before any
           act is completed (preview link), full-gradient with progress
           chip once they've finished at least one act. */}
        <ReportCard
          lessonId={lesson.id}
          hasProgress={Object.values(completed).some(Boolean)}
          completedCount={Object.values(completed).filter(Boolean).length}
          actCount={Object.values(lesson.acts).length}
        />

        {others.length > 0 && (
          <section className="mt-12">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
              Other lessons
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {others.map((entry) => (
                <Link
                  key={entry.data.id}
                  to={`/lesson/${entry.data.id}/act1`}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-saffron-500/40 hover:bg-white/[0.07]"
                >
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                      {entry.data.module}
                    </div>
                    <div className="mt-1 text-base font-semibold text-white">
                      {entry.data.title}
                    </div>
                    <div className="mt-2 text-xs text-white/55">~{entry.data.totalMinutes} min</div>
                  </div>
                  <Play className="h-4 w-4 text-white/40 transition group-hover:text-saffron-400" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-auto pt-16 text-xs text-white/40">
          © {new Date().getFullYear()} Lean Hyphen · Built for behaviour-first learning.
        </footer>
      </div>
    </div>
  );
}

function FloatingBubbles() {
  const bubbles = [
    { color: '#FF9F1C', size: 280, x0: -60,  y0: -40,  dx:  140, dy:  120, dur: 22, op: 0.14 },
    { color: '#FF6B6B', size: 320, x0:  '60%', y0: -80, dx: -160, dy:   80, dur: 26, op: 0.13 },
    { color: '#14B8A6', size: 240, x0: '20%', y0: '40%', dx:  120, dy:  -90, dur: 20, op: 0.10 },
    { color: '#9B5DE5', size: 360, x0: '70%', y0: '55%', dx: -100, dy:  110, dur: 28, op: 0.10 },
    { color: '#F15BB5', size: 200, x0: '10%', y0: '70%', dx:  130, dy:  -70, dur: 18, op: 0.11 },
    { color: '#06AED5', size: 220, x0: '85%', y0: '30%', dx: -130, dy:  100, dur: 24, op: 0.09 },
    { color: '#FFD23F', size: 180, x0: '40%', y0: '15%', dx:  -90, dy:   60, dur: 16, op: 0.10 },
    { color: '#7DDA58', size: 160, x0: '55%', y0: '80%', dx:  100, dy:  -80, dur: 14, op: 0.08 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x0, top: b.y0,
            width: b.size, height: b.size,
            backgroundColor: b.color, opacity: b.op,
            filter: 'blur(36px)', willChange: 'transform, opacity',
          }}
          animate={{
            x: [0, b.dx, -b.dx * 0.5, b.dx * 0.3, 0],
            y: [0, b.dy, b.dy * -0.4, b.dy * 0.6, 0],
            scale: [1, 1.15, 0.92, 1.08, 1],
            opacity: [b.op, b.op * 1.3, b.op * 0.85, b.op * 1.15, b.op],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}
    </div>
  );
}

const LOCK_TIP = {
  act2: 'Finish Act 1 to unlock Act 2',
  act3: 'Finish Act 2 to unlock Act 3',
  act4: 'Finish Act 3 to unlock Act 4',
};

function ActCard({ lessonId, act, index, unlocked, completed, hasComponent }) {
  const isComingSoon = act.status === 'coming-soon' || !hasComponent;
  const tip = !unlocked ? LOCK_TIP[act.id] : isComingSoon ? 'Coming soon' : null;
  const body = (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-5 transition ${
        completed
          ? 'border-teal-400/40 bg-teal-400/[0.06] group-hover:border-teal-400/60'
          : unlocked && !isComingSoon
            ? 'border-white/10 bg-white/[0.04] group-hover:border-saffron-500/40 group-hover:bg-white/[0.06]'
            : 'border-white/5 bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
          Act {index + 1}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-white/50">
          {(!unlocked || isComingSoon) && <Lock className="h-3 w-3" aria-hidden />}
          {completed && <CheckCircle2 className="h-3.5 w-3.5 text-teal-300" aria-hidden />}
          {act.minutes} min
        </span>
      </div>
      <div className={`mt-3 text-base font-semibold ${unlocked && !isComingSoon ? 'text-white' : 'text-white/55'}`}>
        {act.title.replace(/^Act \d+ — /, '')}
      </div>
      <div className="mt-auto pt-4 text-xs text-white/50">
        {completed ? 'Completed' : isComingSoon ? 'Coming soon' : unlocked ? 'Ready to play' : 'Locked'}
      </div>
      {tip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-xl ring-1 ring-saffron-500/40 transition group-hover:opacity-100"
        >
          {tip}
        </span>
      )}
    </div>
  );
  return unlocked && !isComingSoon ? (
    <Link to={`/lesson/${lessonId}/${act.id}`} className="group">{body}</Link>
  ) : (
    <div className="group cursor-not-allowed opacity-60">{body}</div>
  );
}

/* =========================================================================
 * Performance report card — sits below the act grid on the home page.
 *
 * Two visual states (auto-switches based on progress):
 *   • No progress yet: muted card explaining what they'll see once they
 *     finish at least one Act. Button still navigates (to the same page
 *     that shows the "Lesson complete!" empty state) so a curious
 *     learner can preview the layout.
 *   • Some progress: full-colour gradient card with a "View report"
 *     CTA + a tiny chip showing how many acts are done so far.
 * ======================================================================== */
function ReportCard({ lessonId, hasProgress, completedCount, actCount }) {
  return (
    <section className="mt-10">
      <Link
        to={`/lesson/${lessonId}/report`}
        className="group block"
        aria-label="View your performance report"
      >
        <div
          className={`relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-5 transition sm:flex-row sm:items-center sm:gap-6 sm:p-6 ${
            hasProgress
              ? 'border-saffron-500/40 bg-gradient-to-br from-saffron-500/15 via-coral-500/10 to-burgundy-500/15 group-hover:border-saffron-500/60'
              : 'border-white/10 bg-white/[0.04] group-hover:border-white/20 group-hover:bg-white/[0.06]'
          }`}
        >
          {/* Soft shimmer behind everything when active. Stays subtle. */}
          {hasProgress && (
            <motion.span
              aria-hidden
              initial={{ x: '-130%' }}
              animate={{ x: '130%' }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
          )}

          {/* Icon medallion */}
          <div className="relative flex shrink-0 items-center justify-center">
            <div
              className={`relative grid h-16 w-16 place-items-center rounded-3xl shadow-lg ring-1 sm:h-20 sm:w-20 ${
                hasProgress
                  ? 'bg-gradient-to-br from-saffron-500 to-coral-500 text-white ring-saffron-500/40'
                  : 'bg-white/[0.06] text-white/60 ring-white/10'
              }`}
            >
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2.2} />
              <BarChart3 className="absolute -bottom-1.5 -right-1.5 h-5 w-5 rounded-full bg-ink-900/90 p-0.5 text-white shadow-sm sm:h-6 sm:w-6" strokeWidth={2.2} />
            </div>
          </div>

          {/* Text block */}
          <div className="relative min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-saffron-400">
                Your Performance Report
              </span>
              {hasProgress && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white/85 ring-1 ring-white/15">
                  {completedCount} / {actCount} acts
                </span>
              )}
            </div>
            <h3 className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
              {hasProgress
                ? 'See your score, badges and per-act breakdown'
                : 'Track your progress as you play'}
            </h3>
            <p className="mt-1 max-w-2xl text-[13px] text-white/70 sm:text-sm">
              {hasProgress
                ? 'Total score out of 100 · learning + engagement scores · per-act time and accuracy · badges earned · improvement vs your last attempt.'
                : 'Finish even one act and your report comes alive — total score, badges, per-act timing, accuracy, and insights.'}
            </p>
          </div>

          {/* CTA */}
          <div className="relative flex shrink-0 items-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-bold transition group-hover:gap-2 sm:text-[12.5px] ${
                hasProgress
                  ? 'bg-white text-ink-900 shadow-md'
                  : 'bg-white/10 text-white/80 ring-1 ring-white/20'
              }`}
            >
              View report
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
