import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLesson } from '../context/LessonContext.jsx';
import LessonReport from '../components/shared/LessonReport.jsx';

/**
 * Standalone page wrapper around <LessonReport mode="page">.
 *
 * Route: /lesson/:lessonId/report
 *
 * Lets the learner revisit their report at any time from the home page
 * (or directly via URL) instead of seeing it only as a one-shot modal
 * at the end of Act 4. Same data, same component — just different
 * chrome around it.
 */
export default function LessonReportPage() {
  const { lessonId } = useParams();
  const { sessionId } = useLesson();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingBubbles />
      <div className="relative">
        <LessonReport
          mode="page"
          sessionId={sessionId}
          lessonId={lessonId}
          onContinue={() => navigate('/')}
        />
      </div>
    </div>
  );
}

/* Floating colour bubbles — reused from HomePage for the same warm
 * brand backdrop. Kept self-contained here so this page can be linked
 * directly without depending on the home page's component tree. */
function FloatingBubbles() {
  const bubbles = [
    { color: '#FF9F1C', size: 280, x0: -60,  y0: -40,  dx:  140, dy:  120, dur: 22, op: 0.14 },
    { color: '#FF6B6B', size: 320, x0: '60%', y0: -80, dx: -160, dy:   80, dur: 26, op: 0.13 },
    { color: '#14B8A6', size: 240, x0: '20%', y0: '40%', dx:  120, dy:  -90, dur: 20, op: 0.10 },
    { color: '#9B5DE5', size: 360, x0: '70%', y0: '55%', dx: -100, dy:  110, dur: 28, op: 0.10 },
    { color: '#06AED5', size: 220, x0: '85%', y0: '30%', dx: -130, dy:  100, dur: 24, op: 0.09 },
    { color: '#FFD23F', size: 180, x0: '40%', y0: '15%', dx:  -90, dy:   60, dur: 16, op: 0.10 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x0, top: b.y0, width: b.size, height: b.size,
            backgroundColor: b.color, opacity: b.op,
            filter: 'blur(36px)', willChange: 'transform, opacity',
          }}
          animate={{
            x: [0, b.dx, -b.dx * 0.5, b.dx * 0.3, 0],
            y: [0, b.dy, b.dy * -0.4, b.dy * 0.6, 0],
            scale: [1, 1.15, 0.92, 1.08, 1],
            opacity: [b.op, b.op * 1.3, b.op * 0.85, b.op * 1.15, b.op],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
        />
      ))}
    </div>
  );
}
