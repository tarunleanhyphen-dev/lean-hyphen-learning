/**
 * Lesson 2 — "Where Does My Money Go?" (scaffolded; build TBD).
 *
 * Same schema as `thinkBeforeYouSpend.js`:
 *   { id, slug, module, title, totalMinutes, hero: {tagline, character, palette}, acts }
 *
 * All four Acts are stubbed as `status: 'coming-soon'` with empty scenes.
 * Fill them in when the lesson design is locked. The HomePage / LessonPage
 * tolerate `status: 'coming-soon'` so cards render locked.
 *
 * No React components are imported here on purpose — the file is pure data
 * so the backend seed script (`npm run seed:lessons`) can `import()` it
 * from Node and snapshot it into Supabase as JSONB.
 */

export const lesson = {
  id: 'where-does-my-money-go',
  slug: 'where-does-my-money-go',
  module: 'Smart Spending & Money Choices',
  title: 'Where Does My Money Go?',
  totalMinutes: 12,
  hero: {
    tagline:
      'Track every rupee from pocket money to receipts — and discover the leaks that quietly drain your wallet each month.',
    character: {
      // TODO: pick a character + avatar style when lesson design is finalized.
      name: 'TBD',
      avatar: '🧒',
      age: 14,
    },
    palette: {
      // Emerald + cyan so this lesson visually reads distinct from Shanaya's
      // warm peach + saffron lesson (Think Before You Spend).
      from: '#10B981',
      via: '#06B6D4',
      to: '#3B82F6',
    },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — TBD',
      minutes: 3,
      kind: 'cinematic',
      status: 'coming-soon',
      scenes: [],
    },
    act2: {
      id: 'act2',
      title: 'Act 2 — TBD',
      minutes: 3,
      kind: 'interactive',
      status: 'coming-soon',
      scenes: [],
    },
    act3: {
      id: 'act3',
      title: 'Act 3 — TBD',
      minutes: 3,
      kind: 'scenarios',
      status: 'coming-soon',
      scenes: [],
    },
    act4: {
      id: 'act4',
      title: 'Act 4 — TBD',
      minutes: 3,
      kind: 'reflection',
      status: 'coming-soon',
      scenes: [],
    },
  },
};
