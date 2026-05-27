import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { getLesson } from '../data/lessons/registry.js';

const ACT_ORDER = ['act1', 'act2', 'act3', 'act4'];

export default function LessonPage() {
  const { lessonId, actId = 'act1' } = useParams();
  const navigate = useNavigate();

  const entry = getLesson(lessonId);
  if (!entry) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-white/80">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <p className="mt-2 text-white/60">No lesson with id <code>{lessonId}</code>.</p>
      </div>
    );
  }

  const { data: lesson, acts } = entry;
  const ActComponent = acts[actId];
  if (!ActComponent) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-white/80">
        <h1 className="text-2xl font-bold">Coming soon</h1>
        <p className="mt-2 text-white/60">
          {lesson.acts[actId]?.title || `Act "${actId}"`} isn’t built yet on this branch.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-xs font-bold text-cyan-950 hover:bg-cyan-300"
        >
          Back to home
        </button>
      </div>
    );
  }

  const handleComplete = useCallback(() => {
    const idx = ACT_ORDER.indexOf(actId);
    const next = ACT_ORDER[idx + 1];
    if (next && lesson.acts[next] && acts[next] && lesson.acts[next].status !== 'coming-soon') {
      navigate(`/lesson/${lessonId}/${next}`);
    } else {
      navigate('/');
    }
  }, [actId, lessonId, navigate, lesson.acts, acts]);

  const handleGoHome = useCallback(() => navigate('/'), [navigate]);

  return <ActComponent onComplete={handleComplete} onGoHome={handleGoHome} />;
}
