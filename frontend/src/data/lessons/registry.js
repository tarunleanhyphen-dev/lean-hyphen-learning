/**
 * Lesson registry — single source of truth for which lessons exist.
 *
 * HomePage iterates this to render the lesson grid; LessonPage looks up
 * the active Act component here. Adding a new lesson means:
 *   1. Drop the lesson data file under `data/lessons/<id>.js`
 *   2. Drop the Act components under `components/acts/<id>/Act{N}/`
 *   3. Append an entry to LESSONS below
 *
 * No edits anywhere else in the routing layer.
 */

import { lesson as clickToPay } from './clickToPay.js';
import { lesson as thinkBeforeYouSpend } from './thinkBeforeYouSpend.js';

import ClickToPayAct1 from '../../components/acts/clickToPay/Act1/Act1.jsx';
import ThinkAct1 from '../../components/acts/Act1/Act1.jsx';
import ThinkAct2 from '../../components/acts/Act2/Act2.jsx';
import ThinkAct3 from '../../components/acts/Act3/Act3.jsx';
import ThinkAct4 from '../../components/acts/Act4/Act4.jsx';

export const LESSONS = [
  {
    data: clickToPay,
    featured: true,
    acts: {
      act1: ClickToPayAct1,
    },
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
