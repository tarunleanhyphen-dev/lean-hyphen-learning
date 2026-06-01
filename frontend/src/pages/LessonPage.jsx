import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { getLesson } from '../data/lessons/registry.js';

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
  const ActComponent = acts[actId] || acts.act1;

  const handleComplete = useCallback(() => {
    const order = ['act1', 'act2', 'act3', 'act4'];
    const idx = order.indexOf(actId);
    const next = order[idx + 1];
    if (next && lesson.acts[next] && lesson.acts[next].status !== 'coming-soon' && acts[next]) {
      navigate(`/lesson/${lessonId}/${next}`);
    } else {
      navigate('/');
    }
  }, [actId, lessonId, navigate, lesson, acts]);

  const handleGoHome = useCallback(() => navigate('/'), [navigate]);

  return <ActComponent onComplete={handleComplete} onGoHome={handleGoHome} />;
}
