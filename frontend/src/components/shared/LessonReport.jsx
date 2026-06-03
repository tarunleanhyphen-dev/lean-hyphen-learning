import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Clock, Target, TrendingUp, Award } from 'lucide-react';
import { BADGES, SCORING_CONFIG } from '../../config/scoringConfig.js';

/**
 * End-of-lesson dashboard. Rendered after Act 4 completes — the act
 * fires `act_completed` + `lesson_completed`, waits for the analytics
 * queue to flush, then mounts us. We fetch the live report from
 * `/api/analytics/lesson/:lessonId` so the numbers reflect the events
 * the backend just persisted.
 *
 * Falls back to a "while we're still computing" placeholder so a slow
 * network can't leave the learner staring at a blank screen.
 */

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';

export default function LessonReport({ sessionId, lessonId, onContinue }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Track the loading state independently of `report`. We need a third
  // bucket — "we tried, the backend returned null/empty" — so the modal
  // doesn't spin forever when the backend can't persist events (e.g.
  // serverless cold start losing /tmp data between the POST and the
  // GET). Without this the LessonReport hangs on "Computing your
  // score…" indefinitely.
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(
          `${API_BASE}/api/analytics/lesson/${encodeURIComponent(lessonId)}?sessionId=${encodeURIComponent(sessionId)}`,
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        if (!cancelled) setReport(j.report ?? null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'failed to load report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId, lessonId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-gradient-to-br from-cream-50 to-white p-6 shadow-2xl ring-1 ring-ink-300/15 sm:p-8"
      >
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-saffron-500">
              ✨ Lesson complete
            </div>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
              Your Lesson Report
            </h2>
            <p className="mt-1 text-[13px] text-ink-700">
              Think Before You Spend — full performance breakdown
            </p>
          </div>
          <Trophy className="h-10 w-10 text-saffron-500" strokeWidth={2.2} />
        </header>

        {loading && !report && !error && (
          <div className="mt-8 grid place-items-center py-12 text-ink-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="h-10 w-10 rounded-full border-4 border-saffron-500/30 border-t-saffron-500"
            />
            <p className="mt-3 text-[12.5px] uppercase tracking-widest">Computing your score…</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-coral-500/10 p-4 text-[13px] text-coral-700 ring-1 ring-coral-500/20">
            We couldn't load your report ({error}). Your progress is saved — try again later.
          </div>
        )}

        {/* Fetch finished, no error, but the backend returned an empty
            report. This happens when the analytics events landed on a
            different serverless instance than the one serving this read
            (the in-memory + /tmp store is per-instance). Better than
            spinning forever: tell the learner the lesson is done and
            give them the way home. */}
        {!loading && !report && !error && (
          <div className="mt-6 rounded-2xl bg-cream-100 p-5 text-center ring-1 ring-ink-300/15">
            <Sparkles className="mx-auto h-8 w-8 text-saffron-500" />
            <h3 className="mt-2 text-lg font-extrabold text-ink-900">Lesson complete!</h3>
            <p className="mt-1 text-[13px] text-ink-700">
              You walked through all four Acts. Your score sync is still catching up — refresh the
              home page in a moment to see the full report.
            </p>
          </div>
        )}

        {report && (
          <>
            {/* Headline score */}
            <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ScoreTile
                Icon={Trophy}
                tone="from-saffron-500 to-coral-500"
                label="Total score"
                value={`${report.totalScore} / ${SCORING_CONFIG.lessonMax}`}
                sub={`${Math.round(report.completionPct)}% completion`}
              />
              <ScoreTile
                Icon={Target}
                tone="from-teal-500 to-emerald-600"
                label="Learning"
                value={`${report.learningScore} / 100`}
                sub="Accuracy + scenario quality"
              />
              <ScoreTile
                Icon={TrendingUp}
                tone="from-burgundy-500 to-coral-500"
                label="Engagement"
                value={`${report.engagementScore} / 100`}
                sub="Time + interaction density"
              />
            </section>

            {/* Per-act breakdown */}
            <section className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-500">
                Act-by-act breakdown
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {report.acts.map((act) => (
                  <ActRow key={act.actId} act={act} />
                ))}
              </div>
            </section>

            {/* Badges */}
            {report.badges?.length > 0 && (
              <section className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-500">
                  Badges earned · {report.badges.length}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.badges.map((b) => {
                    const meta = BADGES[b.badgeId] || { title: b.badgeId, emoji: '🏅' };
                    return (
                      <span
                        key={b.badgeId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-saffron-500/15 to-coral-500/10 px-3 py-1.5 text-[12px] font-extrabold text-ink-900 ring-1 ring-saffron-500/30"
                      >
                        <span className="text-base leading-none">{meta.emoji}</span>
                        {meta.title}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Insights */}
            {report.insights?.length > 0 && (
              <section className="mt-6 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-500">
                  What stood out
                </h3>
                {report.insights.map((ins, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-2xl bg-cream-100 p-3 text-[13px] text-ink-700 ring-1 ring-ink-300/15"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-saffron-500" />
                    <span>{ins.message}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Improvement-vs-previous-attempt */}
            {report.improvement && (
              <section className="mt-6 rounded-2xl bg-gradient-to-br from-teal-400/15 to-emerald-500/10 p-4 ring-1 ring-teal-400/30">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-700">
                  <Award className="h-4 w-4" /> Improvement vs previous attempt
                </div>
                <div className="mt-1 text-[14px] font-semibold text-ink-900">
                  {report.improvement.previousScore} → {report.improvement.currentScore}
                  <span className="ml-2 text-teal-600">
                    ({report.improvement.deltaScore >= 0 ? '+' : ''}{report.improvement.deltaScore} pts)
                  </span>
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-500">
                <Clock className="h-3.5 w-3.5" />
                Total time: {formatMs(report.totalTimeMs)}
              </div>
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2.5 text-[12.5px] font-bold text-white shadow-md transition hover:bg-ink-700 active:scale-[0.98]"
              >
                Back to home →
              </button>
            </footer>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function ScoreTile({ Icon, tone, label, value, sub }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tone} p-4 text-white shadow-md`}>
      <Icon className="absolute right-3 top-3 h-6 w-6 opacity-30" />
      <div className="text-[10.5px] font-extrabold uppercase tracking-widest opacity-90">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[10.5px] opacity-90">{sub}</div>
    </div>
  );
}

function ActRow({ act }) {
  const pct = act.pointsMax > 0 ? Math.round((act.pointsEarned / act.pointsMax) * 100) : 0;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-cream-100 p-3 ring-1 ring-ink-300/15">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-ink-900">{act.title}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-saffron-600 ring-1 ring-saffron-500/30">
          {act.pointsEarned} / {act.pointsMax}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-300/20">
        <div
          className="h-full bg-gradient-to-r from-saffron-500 to-coral-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10.5px] text-ink-500">
        <span>{Math.round(act.completionPct ?? 0)}% complete</span>
        {act.accuracyPct != null && <span>{Math.round(act.accuracyPct)}% accuracy</span>}
        <span>{formatMs(act.timeMs)}</span>
      </div>
    </div>
  );
}

function formatMs(ms) {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}
