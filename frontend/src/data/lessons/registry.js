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

export const LESSONS = [
  {
    data: whereDoesMyMoneyGo,
    featured: true,
    acts: { act1: DreamBedroomAct1, act2: DreamBedroomAct2 },
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

export function getFeaturedLesson() {
  return LESSONS.find((l) => l.featured) || LESSONS[0];
}
