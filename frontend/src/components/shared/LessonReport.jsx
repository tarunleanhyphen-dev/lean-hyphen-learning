import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Clock, Target, TrendingUp, Award, ArrowLeft, History, ChevronRight, RefreshCw } from 'lucide-react';
import { SCORING_CONFIG } from '../../config/scoringConfig.js';
import { flush, getReportToken } from '../../utils/analytics.js';

/**
 * End-of-lesson dashboard. Two render modes:
 *
 *   • `mode="modal"` (default): floats over the page on a dark backdrop.
 *      Used by Act 4's celebration — the act fires act_completed +
 *      lesson_completed, waits for the analytics queue to flush, then
 *      mounts us inline.
 *
 *   • `mode="page"`: fills the page (no backdrop, no fixed positioning).
 *      Used by `/lesson/:lessonId/report` so the learner can revisit
 *      the report any time from the home page, link to it from email,
 *      etc. The LMS dashboard fetches the same JSON directly.
 *
 * Falls back to a "while we're still computing" placeholder so a slow
 * network can't leave the learner staring at a blank screen, and to a
 * "lesson complete!" empty state if the backend returns no report.
 */

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';

export default function LessonReport({
  sessionId,
  lessonId,
  onContinue,
  mode = 'modal',
  ctaLabel,
}) {
  const isPage = mode === 'page';
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  // Selected attempt number. `null` = latest (default). Bumped when the
  // learner clicks a row in the "Your sessions" history strip so they
  // can review an older attempt's full report.
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  // All attempts on this lesson for this learner (latest first). Used
  // for the history strip; the strip is only rendered on the standalone
  // page (modal stays tight).
  const [sessions, setSessions] = useState([]);

  // Track the loading state independently of `report`. We need a third
  // bucket — "we tried, the backend returned null/empty" — so the modal
  // doesn't spin forever when the backend can't persist events (e.g.
  // serverless cold start losing /tmp data between the POST and the
  // GET). Without this the LessonReport hangs on "Computing your
  // score…" indefinitely.
  const [loading, setLoading] = useState(true);
  // Manual/auto refresh in-flight flag (drives the Refresh button spinner)
  // without blanking the already-rendered report.
  const [refreshing, setRefreshing] = useState(false);

  // (Re-)fetch the report. `quiet` = a background refresh (manual button or
  // window-focus) that keeps the current report on screen instead of flipping
  // to the full-page "Computing…" spinner. The score auto-updates after every
  // act because each act flushes its events and this re-reads the latest.
  const reload = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      // Push any analytics events still queued from the act the learner just
      // played, so the report reflects them (the queue flushes on a 2s
      // debounce otherwise — racing this read).
      try { await flush(); } catch { /* best-effort */ }

      const params = new URLSearchParams({ sessionId });
      if (selectedAttempt != null) params.set('attempt', String(selectedAttempt));
      const tok = getReportToken(sessionId);
      if (tok) params.set('token', tok);
      const url = `${API_BASE}/api/analytics/lesson/${encodeURIComponent(lessonId)}?${params}`;

      // Retry a few times — a just-finished act's write may still be landing.
      let rep = null;
      for (let i = 0; i < 4; i += 1) {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        rep = j.report ?? null;
        if (rep || selectedAttempt != null) break;
        await new Promise((res) => setTimeout(res, 1200));
      }
      setReport((prev) => rep ?? (quiet ? prev : null));
    } catch (err) {
      if (!quiet) setError(err.message || 'failed to load report');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [sessionId, lessonId, selectedAttempt]);

  // Initial load + reload when the selected attempt changes.
  useEffect(() => { reload(); }, [reload]);

  // Auto-refresh: when the learner returns to this tab/window (e.g. after
  // playing another act in the same tab and navigating back), silently pull
  // the latest score so they never see stale numbers.
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') reload({ quiet: true }); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [reload]);

  // Fetch the attempt list once per (sessionId, lessonId). Only used
  // on the standalone page — modal mode hides the strip to keep the
  // celebration tight.
  useEffect(() => {
    if (!isPage) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/api/analytics/sessions/${encodeURIComponent(lessonId)}?sessionId=${encodeURIComponent(sessionId)}${getReportToken(sessionId) ? `&token=${encodeURIComponent(getReportToken(sessionId))}` : ''}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => { if (!cancelled) setSessions(j.sessions || []); })
      .catch(() => { /* non-blocking; the rest of the report renders fine */ });
    return () => { cancelled = true; };
  }, [sessionId, lessonId, isPage]);

  // Outer + inner wrappers differ per mode. Same content inside.
  const OuterWrap = ({ children }) => isPage ? (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">{children}</div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/85 p-4 backdrop-blur-md"
    >
      {children}
    </motion.div>
  );
  const InnerCard = ({ children }) => isPage ? (
    <div className="rounded-3xl bg-gradient-to-br from-cream-50 to-white p-6 shadow-xl ring-1 ring-ink-300/15 sm:p-8">
      {children}
    </div>
  ) : (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-gradient-to-br from-cream-50 to-white p-6 shadow-2xl ring-1 ring-ink-300/15 sm:p-8"
    >
      {children}
    </motion.div>
  );

  return (
    <OuterWrap>
      <InnerCard>
        <header className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-saffron-500">
              {isPage ? '📊 Performance report' : '✨ Lesson complete'}
            </div>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
              Your Lesson Report
            </h2>
            <p className="mt-1 text-[13px] text-ink-700">
              {({ 'think-before-you-spend': 'Think Before You Spend', 'where-does-my-money-go': 'Where Does My Money Go?' }[lessonId] || 'Your lesson')} — Full Performance Breakdown
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Trophy className="hidden h-10 w-10 text-saffron-500 sm:block" strokeWidth={2.2} />
            <button
              type="button"
              onClick={() => reload({ quiet: true })}
              disabled={refreshing}
              title="Refresh — pull your latest score"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300/20 bg-white px-3 py-2 text-[13px] font-bold text-ink-800 transition hover:bg-cream-100 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300/20 bg-white px-3 py-2 text-[13px] font-bold text-ink-800 transition hover:bg-cream-100"
              >
                <ArrowLeft className="h-4 w-4" /> Home
              </button>
            )}
          </div>
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
            <h3 className="mt-2 text-lg font-extrabold text-ink-900">No report yet</h3>
            <p className="mt-1 text-[13px] text-ink-700">
              Play through an Act and your report appears here — score, accuracy and badges, filling
              in act by act. If you just finished an Act, give it a moment to sync, then refresh.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-saffron-600"
            >
              Refresh
            </button>
          </div>
        )}

        {report && (
          <>
            {/* Single achievement badge, awarded by total score */}
            <ScoreBadge total={report.totalScore} />

            {/* Headline score */}
            <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ScoreTile
                Icon={Trophy}
                tone="from-saffron-500 to-coral-500"
                label="Total score"
                value={`${report.totalScore} / ${SCORING_CONFIG.lessonMax}`}
                sub={`${Math.round(report.completionPct)}% Completion`}
              />
              <ScoreTile
                Icon={Target}
                tone="from-teal-500 to-emerald-600"
                label="Learning"
                value={`${report.learningScore} / 100`}
                sub="Accuracy + Scenario Quality"
              />
              <ScoreTile
                Icon={TrendingUp}
                tone="from-burgundy-500 to-coral-500"
                label="Engagement"
                value={`${report.engagementScore} / 100`}
                sub="Interaction + Completion"
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

            {/* Your sessions — chronological list of every attempt by
                this learner. Page mode only; the modal stays focused on
                the immediate-win moment. Click a row to swap the report
                above to that attempt's data. */}
            {isPage && sessions.length > 1 && (
              <section className="mt-6">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-500">
                  <History className="h-4 w-4" /> Your sessions · {sessions.length}
                </h3>
                <p className="mt-1 text-[12px] text-ink-500">
                  Each time you play the lesson is a new session. Tap a row to view that session's report.
                </p>
                <div className="mt-3 space-y-1.5">
                  {sessions.map((s) => {
                    const isActive = (selectedAttempt ?? sessions[0].attemptNo) === s.attemptNo;
                    return (
                      <button
                        key={s.attemptNo}
                        type="button"
                        onClick={() => setSelectedAttempt(s.attemptNo)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl p-3 text-left transition ${
                          isActive
                            ? 'bg-saffron-500/15 ring-1 ring-saffron-500/40'
                            : 'bg-cream-100 ring-1 ring-ink-300/15 hover:bg-cream-50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[12.5px] font-bold ${isActive ? 'text-saffron-600' : 'text-ink-900'}`}>
                              Session {s.attemptNo}
                              {s.attemptNo === sessions[0].attemptNo && (
                                <span className="ml-2 rounded-full bg-saffron-500/20 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-widest text-saffron-700">
                                  Latest
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-ink-500">
                            <span>{s.completed ? `Finished ${formatDate(s.completedAt)}` : `Started ${formatDate(s.startedAt)} · in progress`}</span>
                            {s.badgeCount > 0 && <span>{s.badgeCount} badge{s.badgeCount === 1 ? '' : 's'}</span>}
                            <span>{formatMs(s.timeMs)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-saffron-600 ring-1 ring-saffron-500/30">
                            {s.totalScore} / {SCORING_CONFIG.lessonMax}
                          </span>
                          <ChevronRight className={`h-4 w-4 ${isActive ? 'text-saffron-500' : 'text-ink-300'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-500">
                <Clock className="h-3.5 w-3.5" />
                Total time: {formatMs(report.totalTimeMs)}
              </div>
              {onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-5 py-2.5 text-[12.5px] font-bold text-white shadow-md transition hover:bg-ink-700 active:scale-[0.98]"
                >
                  {isPage ? <><ArrowLeft className="h-4 w-4" /> Back to home</> :
                    <>{ctaLabel || 'Back to home'} →</>}
                </button>
              )}
            </footer>
          </>
        )}
      </InnerCard>
    </OuterWrap>
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

// Single achievement badge, awarded purely by total score. Highest matching
// band wins; below 30 there is no badge. (Bands per product spec.)
const SCORE_TIERS = [
  { min: 100, label: 'Legend',      emoji: '👑', tone: 'from-amber-400 to-yellow-500',  note: 'Perfect score!' },
  { min: 90,  label: 'Diamond',     emoji: '💎', tone: 'from-cyan-400 to-sky-500',      note: 'Outstanding' },
  { min: 80,  label: 'Platinum',    emoji: '🏆', tone: 'from-violet-400 to-fuchsia-500', note: 'Excellent' },
  { min: 70,  label: 'Gold',        emoji: '🥇', tone: 'from-yellow-400 to-amber-500',  note: 'Great work' },
  { min: 60,  label: 'Silver',      emoji: '🥈', tone: 'from-slate-300 to-slate-500',   note: 'Well done' },
  { min: 50,  label: 'Bronze',      emoji: '🥉', tone: 'from-orange-400 to-amber-600',  note: 'Solid effort' },
  { min: 40,  label: 'Rising Star', emoji: '⭐', tone: 'from-teal-400 to-emerald-500',  note: 'Good progress' },
  { min: 30,  label: 'Starter',     emoji: '🌱', tone: 'from-lime-400 to-green-500',    note: 'You\'re on your way' },
];

export function getScoreTier(total) {
  return SCORE_TIERS.find((t) => total >= t.min) || null; // < 30 → no badge
}

function ScoreBadge({ total }) {
  const tier = getScoreTier(total);
  if (!tier) {
    return (
      <section className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-cream-100 p-4 ring-1 ring-ink-300/15">
        <span className="text-3xl opacity-60 grayscale">🔒</span>
        <p className="text-[13px] font-semibold text-ink-600">
          Score <b className="tabular-nums">{total}</b> / 100 — reach <b>30</b> to unlock your first badge. Keep going!
        </p>
      </section>
    );
  }
  return (
    <section className={`mt-5 flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r ${tier.tone} p-5 text-white shadow-lg`}>
      <span className="text-5xl leading-none drop-shadow-md" aria-hidden>{tier.emoji}</span>
      <div className="text-center sm:text-left">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.22em] opacity-90">Achievement unlocked</div>
        <div className="text-2xl font-extrabold leading-tight">{tier.label}</div>
        <div className="text-[12.5px] font-semibold opacity-90">{tier.note} · <span className="tabular-nums">{total}</span> / 100</div>
      </div>
    </section>
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
      {/* Score bar (share of this act's points earned) */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-300/20">
        <div
          className="h-full bg-gradient-to-r from-saffron-500 to-coral-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10.5px] text-ink-500">
        <span>Score {pct}%</span>
        {act.accuracyPct != null && <span>{Math.round(act.accuracyPct)}% Accuracy</span>}
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

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
}
