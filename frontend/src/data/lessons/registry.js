/**
 * Lesson registry — single source of truth for which lessons exist + which
 * Act component renders for each {lessonId, actId} pair.
 *
 * Adding a new lesson:
 *   1. Drop the lesson data file under data/lessons/<id>.js
 *   2. Drop the Act components under components/acts/<id>/Act{N}/
 *   3. Append an entry to LESSONS below
 *
 * No edits anywhere else in the routing layer.
 */
import { lesson as thinkBeforeYouSpend } from './thinkBeforeYouSpend.js';
import { lesson as whereDoesMyMoneyGo }  from './whereDoesMyMoneyGo.js';

import ThinkAct1 from '../../components/acts/Act1/Act1.jsx';
import ThinkAct2 from '../../components/acts/Act2/Act2.jsx';
import ThinkAct3 from '../../components/acts/Act3/Act3.jsx';
import ThinkAct4 from '../../components/acts/Act4/Act4.jsx';

// "Where Does My Money Go?" · Act 1 = the new Dream Bedroom Makeover build.
// (The earlier whereDoesMyMoneyGo/Act1 implementation is kept on disk for
// history but is no longer wired in.)
import DreamBedroomAct1 from '../../components/acts/dreamBedroomMakeover/Act1/Act1.jsx';
import DreamBedroomAct2 from '../../components/acts/dreamBedroomMakeover/Act2/Act2.jsx';
import DreamBedroomAct3 from '../../components/acts/dreamBedroomMakeover/Act3/Act3.jsx';

export const LESSONS = [
  {
    data: whereDoesMyMoneyGo,
    featured: true,
    acts: { act1: DreamBedroomAct1, act2: DreamBedroomAct2, act3: DreamBedroomAct3 },
  },
  {
    data: thinkBeforeYouSpend,
    featured: false,
    acts: {
      act1: ThinkAct1,
      act2: ThinkAct2,
      act3: ThinkAct3,
      act4: ThinkAct4,
    },
  },
];

export function getLesson(lessonId) {
  return LESSONS.find((l) => l.data.id === lessonId) || null;
}

/**
 * Each Vercel deploy can pin its own "featured" lesson via the
 * VITE_FEATURED_LESSON env var (the lesson's `data.id`). When set, the
 * home page shows ONLY that lesson — the other lessons are filtered
 * out of the grid so a learner on the lesson-1 URL never sees lesson-2
 * tiles and vice-versa.
 *
 *   frontend (Lesson 1):           VITE_FEATURED_LESSON=think-before-you-spend
 *   where-does-my-money-go (L2):   VITE_FEATURED_LESSON=where-does-my-money-go
 *
 * When the env var is NOT set we fall back to the registry's
 * `featured: true` flag so local dev (`npm run dev`) keeps the
 * multi-lesson grid for development convenience.
 */
const PINNED_LESSON_ID = import.meta.env?.VITE_FEATURED_LESSON || null;

export function getFeaturedLesson() {
  if (PINNED_LESSON_ID) {
    const pinned = LESSONS.find((l) => l.data.id === PINNED_LESSON_ID);
    if (pinned) return pinned;
  }
  return LESSONS.find((l) => l.featured) || LESSONS[0];
}

/**
 * The "other" lessons to show below the featured one. When a deploy
 * is pinned via VITE_FEATURED_LESSON, returns []  — the deploy is
 * single-lesson on purpose.
 */
export function getOtherLessons() {
  if (PINNED_LESSON_ID) return [];
  const featured = getFeaturedLesson();
  return LESSONS.filter((l) => l !== featured);
}

/** True when this deploy is locked to a single lesson. */
export function isSingleLessonDeploy() {
  return !!PINNED_LESSON_ID;
}
