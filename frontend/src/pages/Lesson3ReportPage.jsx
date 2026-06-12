/**
 * Lesson 3 — "Scam Smart" performance report.
 *
 * Route: /lesson3/report
 *
 * Reuses the shared <LessonReport> (same component Lessons 1 & 2 use) so the
 * three lessons stay consistent. The report is built server-side from the
 * learner's analytics events, keyed by ?learnerId= (LMS) or an anonymous
 * session id. It fills in act-by-act as the learner completes each act.
 */
import { useNavigate } from 'react-router-dom';
import LessonReport from '../components/shared/LessonReport.jsx';
import { getSessionId } from '../utils/api.js';

export default function Lesson3ReportPage() {
  const navigate = useNavigate();
  const sessionId = getSessionId();

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#07060f' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-[110px]" style={{ background: '#6366F1', opacity: 0.2 }} />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full blur-[120px]" style={{ background: '#A855F7', opacity: 0.18 }} />
      </div>
      <div className="relative">
        <LessonReport
          mode="page"
          sessionId={sessionId}
          lessonId="scam-smart"
          onContinue={() => navigate('/lesson3')}
        />
      </div>
    </div>
  );
}
