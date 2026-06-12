/* Lesson 3 — "Scam Smart" — its own home page + act routing, fully separate
 * from Lessons 1 & 2.
 *
 *   /lesson3          → Scam Smart home (hero + act cards)
 *   /lesson3/act1     → The Hook
 *   /lesson3/act2     → The Scenarios
 *   /lesson3/act3     → The Patterns
 *   /lesson3/act4     → The Challenge
 *
 * Each act is self-contained (manages its own state + analytics); we just
 * hand it onGoHome / onComplete navigation callbacks. */
import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, ShieldCheck, ArrowRight, BarChart3 } from 'lucide-react';
import SpafaLogo from '../components/shared/SpafaLogo.jsx';
import { stopMusic, cancelSpeech } from '../utils/sounds.js';
import { lesson } from '../data/lessons/scamSmart.js';
import ScamSmartAct1 from '../components/acts/scamSmart/Act1/Act1.jsx';
import ScamSmartAct2 from '../components/acts/scamSmart/Act2/Act2.jsx';
import ScamSmartAct3 from '../components/acts/scamSmart/Act3/Act3.jsx';
import ScamSmartAct4 from '../components/acts/scamSmart/Act4/Act4.jsx';

const ACT_COMPONENTS = { act1: ScamSmartAct1, act2: ScamSmartAct2, act3: ScamSmartAct3, act4: ScamSmartAct4 };

const ACT_BLURBS = {
  act1: 'A midnight group chat. Rohan just lost ₹12,000 to a scam. Walk into the story that starts it all.',
  act2: 'Five real messages. Some are fine. Some take everything. Make the call — earn a shield for every right one.',
  act3: 'Priya breaks down the 3 patterns under every scam — deepfakes, OTP theft, gaming traps — and the one feeling that gives them away.',
  act4: 'Spot fake links, sort real-or-scam under a timer, find what\'s wrong, beat the boss level — and earn your Scam Proof badge.',
};

export default function Lesson3Page() {
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
            <Link to="/lesson3" className="btn-primary mt-6 inline-flex px-6 py-3">Back to lesson</Link>
          </div>
        </div>
      );
    }
    const order = Object.keys(lesson.acts);
    const i = order.indexOf(actId);
    const next = order[i + 1];
    const goNext = next && ACT_COMPONENTS[next] ? `/lesson3/${next}` : '/lesson3';
    return <Comp onGoHome={() => navigate('/lesson3')} onComplete={() => navigate(goNext)} />;
  }

  return <Lesson3Home navigate={navigate} />;
}

function Lesson3Home() {
  const acts = Object.values(lesson.acts);
  const { from, via, to } = lesson.hero.palette;
  // Music plays inside the acts only — silence it on the home page.
  useEffect(() => { try { stopMusic(); cancelSpeech(); } catch { /* noop */ } }, []);
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#07060f' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-[110px]" style={{ background: from, opacity: 0.26 }} />
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full blur-[120px]" style={{ background: via, opacity: 0.18 }} />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full blur-[120px]" style={{ background: to, opacity: 0.18 }} />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="flex items-center justify-between">
          <a href="/" aria-label="SPAFA home" className="inline-flex shrink-0">
            <SpafaLogo size="md" />
          </a>
        </header>

        <main className="mt-6 flex flex-col items-start gap-3">
          <span className="chip" style={{ background: 'rgba(168,85,247,.18)', color: '#d8b4fe' }}>
            <ShieldCheck className="h-3 w-3" /> Module · {lesson.module}
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-5xl">{lesson.title}</h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-white/75 sm:text-base">{lesson.hero.tagline}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/lesson3/act1"
              className="btn-primary px-6 py-3 text-base"
              style={{ background: `linear-gradient(135deg, ${to}, ${via})`, color: '#0a0a14', boxShadow: `0 16px 38px -14px ${via}` }}
            >
              <Play className="h-4 w-4" /> Start Act 1
            </Link>
            <span className="inline-flex items-center gap-1.5 text-sm text-white/60"><Clock className="h-4 w-4" /> ~{lesson.totalMinutes} min · 4 acts</span>
          </div>
        </main>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {acts.map((act, i) => {
            const live = act.status === 'live';
            return (
              <Link key={act.id} to={live ? `/lesson3/${act.id}` : '#'} className="h-full">
                <motion.div
                  whileHover={live ? { y: -4 } : {}}
                  className={`relative flex h-full flex-col gap-2 rounded-2xl border p-5 ${live ? 'border-white/15 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02] opacity-60'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/50">Act {i + 1}</span>
                    <ArrowRight className="h-4 w-4 text-white/50" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{act.title.replace(/^Act \d+ — /, '')}</h3>
                  <p className="text-[13px] leading-snug text-white/60">{ACT_BLURBS[act.id]}</p>
                  <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-white/50">
                    <Clock className="h-3.5 w-3.5" /> ~{act.minutes} min
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </section>

        <Link
          to="/lesson3/report"
          className="mt-4 inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-violet-400/50 hover:bg-white/[0.07]"
        >
          <BarChart3 className="h-4 w-4" /> View my performance report <ArrowRight className="h-4 w-4" />
        </Link>

        <footer className="mt-auto pt-16 text-xs text-white/40">© Lean Hyphen · {lesson.title}</footer>
      </div>
    </div>
  );
}
