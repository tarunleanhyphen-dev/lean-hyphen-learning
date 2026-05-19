import { Link } from 'react-router-dom';
import { Play, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import { lesson } from '../data/lessons/thinkBeforeYouSpend.js';

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
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
          <span>·</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> No login needed
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to={`/lesson/${lesson.id}/act1`} className="btn-primary px-7 py-4 text-base">
            <Play className="h-4 w-4" />
            Start Act 1
          </Link>
          <Link
            to={`/lesson/${lesson.id}/act2`}
            className="inline-flex items-center gap-2 rounded-full border border-saffron-500/50 bg-saffron-500/10 px-6 py-4 text-base font-semibold text-saffron-400 transition hover:bg-saffron-500/20 hover:text-saffron-300"
          >
            <Play className="h-4 w-4" />
            Start Act 2
          </Link>
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
  );
}

function ActCard({ act, index }) {
  const isPlayable = act.id === 'act1' || act.id === 'act2';
  const body = (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition group-hover:border-saffron-500/40 group-hover:bg-white/[0.06]">
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
    </div>
  );
  return isPlayable ? (
    <Link to={`/lesson/${lesson.id}/${act.id}`} className="group">{body}</Link>
  ) : (
    <div className="group opacity-70">{body}</div>
  );
}
