/**
 * Lesson 2 — "Where Does My Money Go?" performance report.
 *
 * Route: /lesson2/report
 *
 * Reuses the shared <LessonReport> (same component Lesson 1 uses) so the
 * two lessons stay consistent. The report is built server-side from the
 * learner's analytics events, keyed by ?learnerId= (LMS) or an anonymous
 * session id. It fills in act-by-act: complete only Act 1 and the report
 * shows Act 1; complete Act 1 + 2 and it shows both; etc. Replaying the
 * lesson starts a new attempt and updates the latest report.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LessonReport from '../components/shared/LessonReport.jsx';
import { getSessionId } from '../utils/api.js';
import { stopMusic, cancelSpeech } from '../utils/sounds.js';

export default function Lesson2ReportPage() {
  const navigate = useNavigate();
  const sessionId = getSessionId();
  // This is a home-like page — kill any background music/voice left by an act.
  useEffect(() => { try { stopMusic(); cancelSpeech(); } catch { /* noop */ } }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1b39]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-[110px]" style={{ background: '#10B981', opacity: 0.18 }} />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full blur-[120px]" style={{ background: '#8B5CF6', opacity: 0.16 }} />
      </div>
      <div className="relative">
        <LessonReport
          mode="page"
          sessionId={sessionId}
          lessonId="where-does-my-money-go"
          onContinue={() => navigate('/lesson2')}
        />
      </div>
    </div>
  );
}
