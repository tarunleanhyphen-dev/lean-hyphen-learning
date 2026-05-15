/**
 * Lesson data for "Think Before You Spend".
 *
 * Acts 2/3/4 will append to the `acts` map without modifying Act 1.
 * Content is decoupled from animation logic: edits here don't touch components.
 *
 * Phase fields:
 *   id          unique within Act
 *   duration    ms before auto-advance (omit if `hold` is true)
 *   hold        true → wait for external resume/submit
 *   narration   text shown on the room side
 *   bubbles     [{ side, text, type }] thought/speech bubbles
 *   phone       shopping-app state for this phase
 *   cue         audio effect to play once: 'add' | 'ding' | 'freeze' | 'reveal' | 'tap' | 'alert'
 *   insight     { label, detail, type } — small floating annotation near the phone
 *   reflection  { prompt, placeholder } — when set, renders the modal
 */

export const lesson = {
  id: 'think-before-you-spend',
  module: 'Smart Spending & Money Choices',
  title: 'Think Before You Spend',
  totalMinutes: 18,
  hero: {
    tagline: 'A short story-driven simulation about impulse buying.',
    character: {
      name: 'Shanaya',
      avatar: '👩🏽',
      birthday: 'in 2 days',
      budget: 1500,
    },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — Temptation',
      minutes: 3,
      kind: 'cinematic',
      scenes: act1Scenes(),
    },
    act2: { id: 'act2', title: 'Act 2 — Understanding Impulse Buying', minutes: 5, kind: 'interactive-cards', status: 'coming-soon' },
    act3: { id: 'act3', title: 'Act 3 — Four Real-life Simulations', minutes: 9, kind: 'scenarios', status: 'coming-soon' },
    act4: { id: 'act4', title: 'Act 4 — Reflect & Realise', minutes: 3, kind: 'impulse-meter', status: 'coming-soon' },
  },
};

function act1Scenes() {
  return [
    /* ============================================================
     * SCENE 1 — THE PLAN  (~30s)
     * Goal: make Shanaya feel responsible and relatable. The student
     * should be nodding "yeah, this is a sensible plan".
     * ============================================================ */
    {
      id: 'scene-1',
      title: 'The Plan',
      ambience: 'cosy',
      emotion: 'neutral',
      phases: [
        {
          id: 's1-open',
          duration: 4200,
          narration: 'It is a quiet afternoon. Shanaya is in her room. Her birthday is in two days, and she opens her favourite shopping app with a clear plan.',
        },
        {
          id: 's1-intent-1',
          duration: 5000,
          bubbles: [
            { side: 'right', type: 'thought', text: 'Birthday outfits matter. Everyone notices what you wear that day.' },
          ],
        },
        {
          id: 's1-intent-2',
          duration: 5200,
          bubbles: [
            { side: 'right', type: 'thought', text: 'Birthday outfits matter. Everyone notices what you wear that day.' },
            { side: 'right', type: 'thought', text: 'I want this birthday to feel special. One pair of shoes. ₹1,500. That is the whole budget.' },
          ],
        },
        {
          id: 's1-search',
          duration: 3600,
          narration: 'She taps the search bar and types one word.',
          phone: { search: 'shoes' },
          cue: 'click',
        },
        {
          id: 's1-show-shoes',
          duration: 4400,
          phone: { search: 'shoes', showProduct: 'shoes' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'These look perfect. Good price, nice style.' },
          ],
        },
        {
          id: 's1-tap',
          duration: 1800,
          phone: { search: 'shoes', showProduct: 'shoes', tapTarget: 'primary-cta' },
          cue: 'tap',
        },
        {
          id: 's1-add-shoes',
          duration: 3800,
          phone: { search: 'shoes', showProduct: 'shoes', cart: ['shoes'], floatAdd: 'shoes' },
          cue: 'add',
          addedItem: { id: 'shoes', trigger: 'plan' },
        },
        {
          id: 's1-validate',
          duration: 5200,
          phone: { search: 'shoes', showProduct: 'shoes', cart: ['shoes'], badge: 'Smart budget pick ✓' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Okay, done. That was easy. ₹1,499 out of ₹1,500 — I am right on plan.' },
          ],
          insight: { label: 'Micro-validation', detail: 'Apps reward you the moment you act — to lower your guard.', type: 'fact' },
        },
      ],
    },

    /* ============================================================
     * SCENE 2 — THE SUGGESTIONS BEGIN  (~75s)
     * The dark-patterns showcase. Three waves of manipulation.
     * Every wave: card appears → thought beats → tap → add.
     * ============================================================ */
    {
      id: 'scene-2',
      title: 'The Suggestions Begin',
      ambience: 'app-tempo',
      emotion: 'curious',
      phases: [
        {
          id: 's2-intro',
          duration: 4500,
          narration: 'But she does not log off. She scrolls a little more — and the app starts working on her.',
          phone: { cart: ['shoes'], scrollHint: true },
        },

        /* --- Wave 1: Cross-sell / "complete the look" --- */
        {
          id: 's2-w1-card',
          duration: 4000,
          phone: { cart: ['shoes'], recommendations: ['socks'], rowLabel: 'Complete the Look' },
          insight: { label: 'Cross-sell', detail: 'Pairing suggestions feel like completing one decision, not making a new one.' },
        },
        {
          id: 's2-w1-bubble1',
          duration: 4800,
          phone: { cart: ['shoes'], recommendations: ['socks'], rowLabel: 'Complete the Look' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Hmm… socks would actually go well with these shoes.' },
          ],
        },
        {
          id: 's2-w1-bubble2',
          duration: 5000,
          phone: { cart: ['shoes'], recommendations: ['socks'], rowLabel: 'Complete the Look' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'It is not really extra. It just… completes the look.' },
          ],
        },
        {
          id: 's2-w1-tap',
          duration: 1600,
          phone: { cart: ['shoes'], recommendations: ['socks'], rowLabel: 'Complete the Look', tapTarget: 'rec-socks' },
          cue: 'tap',
        },
        {
          id: 's2-w1-add',
          duration: 3200,
          phone: { cart: ['shoes', 'socks'], recommendations: ['socks'], rowLabel: 'Complete the Look', floatAdd: 'socks' },
          cue: 'add',
          addedItem: { id: 'socks', trigger: 'cross-sell' },
        },

        /* --- Wave 2: Social proof --- */
        {
          id: 's2-w2-card',
          duration: 4200,
          phone: {
            cart: ['shoes', 'socks'],
            recommendations: ['socks', 'smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
          },
          insight: { label: 'Social proof', detail: '“10,000+ bought today” borrows other people’s decision so you skip making your own.' },
        },
        {
          id: 's2-w2-bubble1',
          duration: 4800,
          phone: {
            cart: ['shoes', 'socks'],
            recommendations: ['socks', 'smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Whoa. This smartwatch looks really cool.' },
          ],
        },
        {
          id: 's2-w2-bubble2',
          duration: 5200,
          phone: {
            cart: ['shoes', 'socks'],
            recommendations: ['socks', 'smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'If 10,000+ people bought it today, maybe it is actually worth it?' },
          ],
        },
        {
          id: 's2-w2-tap',
          duration: 1600,
          phone: {
            cart: ['shoes', 'socks'],
            recommendations: ['socks', 'smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
            tapTarget: 'rec-smartwatch',
          },
          cue: 'tap',
        },
        {
          id: 's2-w2-add',
          duration: 3200,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch'],
            recommendations: ['socks', 'smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
            floatAdd: 'smartwatch',
          },
          cue: 'add',
          addedItem: { id: 'smartwatch', trigger: 'social-proof' },
        },

        /* --- Wave 3: Urgency + scarcity --- */
        {
          id: 's2-w3-card',
          duration: 4400,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
          },
          insight: { label: 'Urgency design', detail: 'Countdown timers and “only 2 left” shrink decision time on purpose.' },
          cue: 'alert',
        },
        {
          id: 's2-w3-bubble1',
          duration: 4400,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Only 2 left… and the timer is already ticking.' },
          ],
        },
        {
          id: 's2-w3-bubble2',
          duration: 4800,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This hoodie would actually look great in birthday photos.' },
          ],
        },
        {
          id: 's2-w3-bubble3',
          duration: 5000,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'I did not plan this… but it fits the whole vibe.' },
          ],
        },
        {
          id: 's2-w3-tap',
          duration: 1600,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            tapTarget: 'rec-hoodie',
          },
          cue: 'tap',
        },
        {
          id: 's2-w3-add',
          duration: 3200,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            floatAdd: 'hoodie',
          },
          cue: 'add',
          addedItem: { id: 'hoodie', trigger: 'urgency' },
        },
      ],
    },

    /* ============================================================
     * SCENE 3 — THE PUSH  (~35s)
     * The most powerful manipulation: the free-delivery threshold.
     * ============================================================ */
    {
      id: 'scene-3',
      title: 'The Push',
      ambience: 'app-tempo',
      emotion: 'excited',
      phases: [
        {
          id: 's3-banner-in',
          duration: 4000,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            deliveryBanner: true,
          },
          narration: 'A new banner slides in across the screen.',
          cue: 'ding',
          insight: { label: 'Threshold trap', detail: 'Free-delivery thresholds make you add more to “save” — net result is you spend more.' },
        },
        {
          id: 's3-think-1',
          duration: 4800,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            deliveryBanner: true,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wait — I am already at ₹3,000… almost there.' },
          ],
        },
        {
          id: 's3-think-2',
          duration: 5200,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            deliveryBanner: true,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'If I just add one more thing, I will not have to pay for delivery. I am basically saving money.' },
          ],
        },
        {
          id: 's3-fbt-card',
          duration: 4200,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            rowLabel: 'Frequently Bought Together',
            flashDeal: 'hoodie',
            deliveryBanner: true,
            highlight: 'cleaning-kit',
          },
          insight: { label: 'Useful + nudged', detail: 'The most dangerous add-on is the one that is actually useful — that is what kills the doubt.' },
        },
        {
          id: 's3-fbt-bubble1',
          duration: 4800,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            rowLabel: 'Frequently Bought Together',
            flashDeal: 'hoodie',
            deliveryBanner: true,
            highlight: 'cleaning-kit',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'New shoes need cleaning anyway. This is honestly useful.' },
          ],
        },
        {
          id: 's3-fbt-bubble2',
          duration: 4800,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            rowLabel: 'Frequently Bought Together',
            flashDeal: 'hoodie',
            deliveryBanner: true,
            highlight: 'cleaning-kit',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Better to buy it now than to come back for it later, right?' },
          ],
        },
        {
          id: 's3-fbt-tap',
          duration: 1600,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            recommendations: ['socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            rowLabel: 'Frequently Bought Together',
            flashDeal: 'hoodie',
            deliveryBanner: true,
            highlight: 'cleaning-kit',
            tapTarget: 'rec-cleaning-kit',
          },
          cue: 'tap',
        },
        {
          id: 's3-unlock',
          duration: 5200,
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            recommendations: ['socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            rowLabel: 'Frequently Bought Together',
            flashDeal: 'hoodie',
            deliveryBanner: true,
            deliveryUnlocked: true,
            floatAdd: 'cleaning-kit',
          },
          cue: 'ding',
          addedItem: { id: 'cleaning-kit', trigger: 'threshold' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'I am not spending extra. I am saving on delivery.' },
          ],
        },
      ],
    },

    /* ============================================================
     * SCENE 4 — REALITY CHECK  (~30s + reflection)
     * The freeze. Music drops. Cart opens. Total lands.
     * ============================================================ */
    {
      id: 'scene-4',
      title: 'Reality Check',
      ambience: 'silent',
      emotion: 'unsettled',
      phases: [
        {
          id: 's4-freeze',
          duration: 2800,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], silent: true },
          narration: '',
          cue: 'freeze',
        },
        {
          id: 's4-cart-open',
          duration: 4200,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], cartOpen: true },
          narration: 'The cart screen takes over the phone.',
        },
        {
          id: 's4-total-build',
          duration: 4400,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], cartOpen: true, revealTotal: true },
          cue: 'reveal',
        },
        {
          id: 's4-gap',
          duration: 5800,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], cartOpen: true, revealTotal: true, showGap: true },
          insight: { label: '₹1,500 → ₹3,240', detail: 'More than double the original plan. None of it felt like a "big" decision.', type: 'fact' },
        },
        {
          id: 's4-realisation-1',
          duration: 5800,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], cartOpen: true, revealTotal: true, showGap: true },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This didn’t feel like a bad decision while I was making it.' },
          ],
        },
        {
          id: 's4-realisation-2',
          duration: 6200,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], cartOpen: true, revealTotal: true, showGap: true },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This didn’t feel like a bad decision while I was making it.' },
            { side: 'right', type: 'thought', text: 'Each step seemed perfectly reasonable. So why does it feel like I went overboard?' },
          ],
        },
        {
          id: 's4-reflect',
          hold: true,
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], cartOpen: true, revealTotal: true, dim: true },
          reflection: {
            prompt: 'What did you notice about Shanaya’s choices?',
            placeholder: 'Write whatever first comes to mind — one word is enough.',
          },
        },
      ],
    },
  ];
}

/* Product catalogue used by the mock shopping app */
export const products = {
  shoes:        { id: 'shoes',        emoji: '👟', name: 'White Sneakers',    tagline: 'Trending pick', price: 1499, rating: 4.5 },
  socks:        { id: 'socks',        emoji: '🧦', name: 'Branded Socks',     tagline: 'Goes with sneakers', price: 299,  rating: 4.3 },
  smartwatch:   { id: 'smartwatch',   emoji: '⌚', name: 'Smartwatch X1',     tagline: '10,000+ bought today', price: 799,  rating: 4.4 },
  hoodie:       { id: 'hoodie',       emoji: '👕', name: 'Birthday Hoodie',   tagline: 'Only 2 left',  price: 999,  rating: 4.6 },
  'cleaning-kit': { id: 'cleaning-kit', emoji: '🧴', name: 'Shoe Cleaning Kit', tagline: 'Frequently bought together', price: 399, rating: 4.2 },
};

export const freeDeliveryThreshold = 2999;
export const intendedBudget = 1500;
