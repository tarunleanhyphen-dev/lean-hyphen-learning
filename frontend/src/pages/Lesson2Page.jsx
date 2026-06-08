/* Lesson 2 — "Where Does My Money Go?" — has its OWN home page and act
 * routing, fully separate from Lesson 1's home page (`/`).
 *
 *   /lesson2          → Lesson 2 home (hero + act cards)
 *   /lesson2/act1     → Dream Bedroom Makeover (3D simulation)
 *   /lesson2/act2     → The 50/30/20 Rule
 *
 * Each act component is self-contained (it manages its own state, narration
 * and 3D canvas); we just hand it onGoHome / onComplete navigation callbacks. */
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { lesson } from '../data/lessons/whereDoesMyMoneyGo.js';
import SpafaLogo from '../components/shared/SpafaLogo.jsx';
import { stopMusic, cancelSpeech } from '../utils/sounds.js';
import DreamBedroomAct1 from '../components/acts/dreamBedroomMakeover/Act1/Act1.jsx';
import DreamBedroomAct2 from '../components/acts/dreamBedroomMakeover/Act2/Act2.jsx';
import DreamBedroomAct3, { markActDone } from '../components/acts/dreamBedroomMakeover/Act3/Act3.jsx';

const ACT_COMPONENTS = { act1: DreamBedroomAct1, act2: DreamBedroomAct2, act3: DreamBedroomAct3 };

export default function Lesson2Page() {
  const { actId } = useParams();
  const navigate = useNavigate();

  if (actId) {
    const Comp = ACT_COMPONENTS[actId];
    if (!Comp) {
      return (
        <div className="grid min-h-screen place-items-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Coming soon</h1>
            <p className="mt-2 text-white/60">This act isn’t ready yet.</p>
            <Link to="/lesson2" className="btn-primary mt-6 inline-flex px-6 py-3">Back to lesson</Link>
          </div>
        </div>
      );
    }
    const order = Object.keys(lesson.acts);
    const i = order.indexOf(actId);
    const next = order[i + 1];
    const goNext = next && ACT_COMPONENTS[next] ? `/lesson2/${next}` : '/lesson2';
    return <Comp onGoHome={() => navigate('/lesson2')} onComplete={() => { markActDone(actId); navigate(goNext); }} />;
  }

  return <Lesson2Home />;
}

function Lesson2Home() {
  const acts = Object.values(lesson.acts);
  // Returning to the home page from any act stops the background music + voice.
  useEffect(() => { try { stopMusic(); cancelSpeech(); } catch { /* noop */ } }, []);
  const { from, to } = lesson.hero.palette;
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-[110px]" style={{ background: from, opacity: 0.22 }} />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full blur-[120px]" style={{ background: to, opacity: 0.2 }} />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/lesson2" aria-label="Where Does My Money Go? home" className="inline-flex shrink-0">
            <SpafaLogo size="md" />
          </Link>
        </header>

        <main className="mt-6 flex flex-col items-start gap-6 sm:mt-8">
          <span className="chip" style={{ background: 'rgba(245,180,11,.16)', color: '#ffd24a' }}>
            <Sparkles className="h-3 w-3" /> Module · {lesson.module}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">{lesson.title}</h1>
          <p className="max-w-2xl text-base text-white/75 sm:text-lg">
            {lesson.hero.tagline} Across <b className="text-white">3 acts</b> you'll go from impulse spender to deliberate budgeter — by actually doing it, not just reading about it.
          </p>
          <ul className="max-w-2xl space-y-2 text-sm text-white/65 sm:text-[15px]">
            <li>
              <span className="font-semibold text-emerald-300">Act 1 · Dream Bedroom Makeover</span> — design your room on a ₹50,000 budget: sort Needs vs Wants, shop a real 3D catalogue, survive a surprise expense, and see exactly where every rupee went.
            </li>
            <li>
              <span className="font-semibold text-violet-300">Act 2 · The 50/30/20 Rule</span> — learn the one rule smart budgeters live by, then figure out who's nailing their first salary across Arjun, Priya &amp; Sneha.
            </li>
            <li>
              <span className="font-semibold text-amber-300">Act 3 · Test Your Understanding</span> — a timed 6-question quiz to lock it all in and earn your badge.
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> ~{lesson.totalMinutes} minutes total</span>
          </div>
          <div className="mt-4">
            <Link
              to="/lesson2/act1"
              className="btn-primary px-7 py-4 text-base"
              style={{ background: 'linear-gradient(135deg, #ffce3a, #f0a90a)', color: '#3a2a00', boxShadow: '0 16px 38px -14px rgba(240,169,10,.8)' }}
            >
              <Play className="h-4 w-4" /> Start Act 1
            </Link>
          </div>
        </main>

        <section className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {acts.map((act, i) => {
            const live = act.status === 'live';
            const inner = (
              <motion.div
                whileHover={live ? { y: -4 } : {}}
                className={`relative flex h-full flex-col gap-3 rounded-2xl border p-5 ${live ? 'border-white/15 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02] opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Act {i + 1}</span>
                  {live ? <ArrowRight className="h-4 w-4 text-white/50" /> : <Lock className="h-4 w-4 text-white/40" />}
                </div>
                <h3 className="text-lg font-bold text-white">{act.title.replace(/^Act \d+ — /, '')}</h3>
                <div className="mt-auto flex items-center gap-2 text-xs text-white/50">
                  <Clock className="h-3.5 w-3.5" /> ~{act.minutes} min
                  {!live && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5">Coming soon</span>}
                </div>
              </motion.div>
            );
            return live
              ? <Link key={act.id} to={`/lesson2/${act.id}`} className="h-full">{inner}</Link>
              : <div key={act.id} className="h-full">{inner}</div>;
          })}
        </section>

        <Link
          to="/lesson2/report"
          className="mt-4 inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/50 hover:bg-white/[0.07]"
        >
          📊 View my performance report <ArrowRight className="h-4 w-4" />
        </Link>

        <footer className="mt-auto pt-16 text-xs text-white/40">© Lean Hyphen · {lesson.title}</footer>
      </div>
    </div>
  );
}
