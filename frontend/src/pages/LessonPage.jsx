import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import Act1 from '../components/acts/Act1/Act1.jsx';
import Act2 from '../components/acts/Act2/Act2.jsx';
import Act3 from '../components/acts/Act3/Act3.jsx';
import Act4 from '../components/acts/Act4/Act4.jsx';
import { lesson } from '../data/lessons/thinkBeforeYouSpend.js';

const ACTS = { act1: Act1, act2: Act2, act3: Act3, act4: Act4 };

export default function LessonPage() {
  const { lessonId, actId = 'act1' } = useParams();
  const navigate = useNavigate();

  if (lessonId !== lesson.id) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center text-white/80">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <p className="mt-2 text-white/60">No lesson with id <code>{lessonId}</code>.</p>
      </div>
    );
  }

  const ActComponent = ACTS[actId] || Act1;

  const handleComplete = useCallback(() => {
    const order = ['act1', 'act2', 'act3', 'act4'];
    const idx = order.indexOf(actId);
    const next = order[idx + 1];
    // If the next act exists AND is actually playable, go there. Otherwise
    // (no next act, or next act is coming-soon) drop back to the home page.
    // Right now Act 3 + Act 4 are coming-soon, so finishing Act 2 lands the
    // student on the home page rather than a placeholder.
    if (next && lesson.acts[next] && lesson.acts[next].status !== 'coming-soon') {
      navigate(`/lesson/${lessonId}/${next}`);
    } else {
      navigate('/');
    }
  }, [actId, lessonId, navigate]);

  return <ActComponent onComplete={handleComplete} />;
}
