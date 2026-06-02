/**
 * Lesson 2 — "Where Does My Money Go?"
 * Act 1 — "Dream Bedroom Makeover" — interactive 3D budgeting simulation.
 *
 * Pure data module. Imported both by the React Act components and by the
 * backend seed script (`npm run seed:lessons`) which snapshots the whole
 * tree into Supabase as JSONB.
 *
 * Schema is the same shape used by Lesson 1 so existing helpers work, plus
 * three Act-1-specific objects exported separately:
 *
 *   sortItems      — Screen 3, 14 items with per-choice feedback.
 *   catalogue      — Screen 4, 18 items grouped by category.
 *   surpriseEvents — Screen 5, 1 fixed + 4 random events.
 *
 * Currency is rupees (₹) throughout. Prices are integers.
 */

export const lesson = {
  id: 'where-does-my-money-go',
  slug: 'where-does-my-money-go',
  module: 'Smart Spending & Money Choices',
  title: 'Where Does My Money Go?',
  totalMinutes: 12,
  hero: {
    tagline:
      'Renovate your dream bedroom on a ₹50,000 budget — and discover where your money actually goes.',
    character: {
      name: 'You',
      avatar: '🧑‍🎨',
      age: 14,
    },
    palette: {
      // Emerald + cyan + violet — money/space vibe, distinct from Lesson 1's saffron/peach.
      from: '#10B981',
      via: '#06B6D4',
      to: '#8B5CF6',
    },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — Dream Bedroom Makeover',
      minutes: 8,
      kind: 'simulation-3d',
      status: 'live',
      budget: { total: 50000, reserve: 2000, spendable: 48000 },
      scenes: [
        {
          id: 'screen-1-intro',
          title: 'The Big News',
          narration: [
            "Your parents just gave you some big news. They're renovating the house — and YOUR room is getting a complete makeover. The budget? ₹50,000. All yours. One time. No top-ups.",
            "But here's the catch — you have to plan every single rupee. Spend too much on one thing and you won't have enough for something else. And life has a few surprises waiting for you too.",
            'Ready to design your dream bedroom — on a budget?',
          ],
          cta: "Let's Go!",
          vibePrompt: 'First — what\'s your style?',
          vibes: [
            { id: 'cosy', emoji: '🛋️', label: 'Cosy & Warm', sub: 'soft lighting, comfy bed, warm tones', accent: '#F59E0B' },
            { id: 'study', emoji: '📚', label: 'Study Mode', sub: 'desk-first, organised, minimal distractions', accent: '#10B981' },
            { id: 'gamer', emoji: '🎮', label: 'Gamer Setup', sub: 'tech-forward, LED lights, gaming chair', accent: '#8B5CF6' },
            { id: 'minimal', emoji: '🌿', label: 'Minimalist', sub: 'clean, simple, only what I need', accent: '#06B6D4' },
          ],
        },
        {
          id: 'screen-2-vibe',
          title: 'Pick Your Style',
          intro: "First — what's your style?",
          confirmation: 'Nice choice! Your room will now reflect your style throughout the makeover.',
          cta: 'Continue',
          vibes: [
            {
              id: 'cosy',
              emoji: '🛋️',
              label: 'Cosy & Warm',
              tagline: 'soft lighting · warm wood · pillows you sink into',
              sub: 'A bedroom that hugs you back. Amber lamps, layered textures, gentle shadows.',
              accent: '#F59E0B',
              previewImage: 'https://media.designcafe.com/wp-content/uploads/2024/03/02141736/small-study-room-design.jpg',
            },
            {
              id: 'study',
              emoji: '📚',
              label: 'Study Mode',
              tagline: 'organised · minimal distractions · all about focus',
              sub: 'Built around the desk. Clean shelves, focused task light, books at eye level.',
              accent: '#10B981',
            },
            {
              id: 'gamer',
              emoji: '🎮',
              label: 'Gamer Setup',
              tagline: 'RGB · tech · the room glows at night',
              sub: 'Battlestation energy. Tall gaming chair, LED strips, dark walls, neon accents.',
              accent: '#8B5CF6',
            },
            {
              id: 'minimal',
              emoji: '🌿',
              label: 'Minimalist',
              tagline: 'space · light · only what you need',
              sub: 'White walls, light wood, almost monastic calm. Fewer things, more room to breathe.',
              accent: '#06B6D4',
            },
          ],
        },
        {
          id: 'screen-2-rules',
          title: 'Ground Rules',
          intro: 'Before you start spending, here are the ground rules:',
          rules: [
            { icon: '💰', text: 'You have ₹50,000 to spend' },
            { icon: '🔒', text: 'Keep ₹2,000 aside as your Emergency Reserve — don\'t touch it' },
            { icon: '🛏️', text: 'Buy at least 3 Need items before adding any Wants' },
            { icon: '⚠️', text: 'If you go over budget, you must remove items before moving forward' },
          ],
          trackerCategories: [
            { id: 'furniture', label: 'Furniture & Bed' },
            { id: 'seating',   label: 'Seating & Desk' },
            { id: 'storage',   label: 'Storage' },
            { id: 'lighting',  label: 'Lighting' },
            { id: 'decor',     label: 'Décor & Tech' },
          ],
          outro: "Watch your tracker update as you shop. It'll show you exactly where your money is going.",
          cta: "Got it, let's sort!",
        },
        {
          id: 'screen-3-sort',
          title: 'Sort It Out — Needs vs Wants',
          intro:
            "Before you spend a single rupee — let's think. Some things in your room are NEEDS. Others are WANTS. Sort each item.",
          summaryHeading: "Nice work! Here's a quick look at what you found:",
          summaryOutro:
            "You've already started seeing where money goes — most of it tends to go toward Needs. That's normal! Now let's actually start shopping.",
          cta: 'Start Shopping',
        },
        {
          id: 'screen-4-shop',
          title: 'Shop Smart',
          intro:
            "Here's your full catalogue. Build your room — but stay within ₹48,000 (₹2,000 is locked as emergency reserve).",
          tip: 'Tip: Some items have a Budget and a Premium version. Choose wisely!',
          gates: {
            minNeeds: 3,
            overBudgetMessage: "You're over budget! Remove an item to continue.",
            insufficientNeedsMessage: 'You need at least 3 essential items in your room. Add more Needs first.',
          },
          budgetBands: [
            { id: 'safe',  upTo: 38000, color: '#10B981', label: 'Plenty of room' },
            { id: 'tight', upTo: 45000, color: '#F59E0B', label: 'Getting tight' },
            { id: 'edge',  upTo: 48000, color: '#EF4444', label: 'On the edge' },
          ],
          opportunityCosts: [
            {
              when: { added: 'bed-premium', removed: 'bed-budget' },
              message: "Upgrading your bed costs ₹10,000 more — that's your desk AND chair gone. Still want to upgrade?",
            },
            {
              when: { added: 'wardrobe-premium', removed: 'wardrobe-budget' },
              message: 'Premium wardrobe costs ₹5,000 more. Worth it for the extra space and durability — but it might cost you a Want or two.',
            },
          ],
          cta: "I'm happy with my room",
        },
        {
          id: 'screen-5-events',
          title: 'Plot Twists',
          intro: "You've planned your room beautifully. But life doesn't always go to plan...",
          envelopeLine: "You've got a surprise waiting. Open it.",
          envelopeCta: 'Open Envelope',
          spinCta: 'Spin the Wheel',
        },
        {
          id: 'screen-6-snapshot',
          title: 'Spending Snapshot',
          intro:
            "Your room is ready! Before we move on — let's look at where your ₹50,000 actually went.",
          insightTemplates: [
            { id: 'furniture-heavy',  match: { categoryShareGte: { furniture: 0.5 } }, template: 'Furniture took up the biggest share of your budget — {furniturePct}%. That\'s common, since beds and wardrobes are expensive essentials.' },
            { id: 'wants-heavy',      match: { wantsShareGte: 0.3 },                 template: 'You spent {wantsPct}% on Wants. That left less room for savings. Worth thinking about next time!' },
            { id: 'reserve-intact',   match: { reserveStatus: 'intact' },            template: 'You kept your ₹2,000 reserve safe. That turned out to be useful!' },
            { id: 'reserve-used',     match: { reserveStatus: 'used' },              template: 'You needed your reserve during the surprise event. Good thing you had it!' },
          ],
          mcq: {
            question: 'Which category took the biggest chunk of your budget?',
            optionsSource: 'tracker.categories',
          },
          transitionTitle: "You just experienced what budgeting feels like in real life.",
          transitionSub: "Now let's understand the rule that makes it easier — every time.",
          cta: 'Learn the Rule',
        },
      ],
    },
    act2: { id: 'act2', title: 'Act 2 — TBD', minutes: 3, kind: 'interactive', status: 'coming-soon', scenes: [] },
    act3: { id: 'act3', title: 'Act 3 — TBD', minutes: 3, kind: 'scenarios',   status: 'coming-soon', scenes: [] },
    act4: { id: 'act4', title: 'Act 4 — TBD', minutes: 3, kind: 'reflection',  status: 'coming-soon', scenes: [] },
  },
};

/* ============================================================
 *  SCREEN 3 — Sort Items (14)
 * ============================================================ */

export const sortItems = [
  {
    id: 'bed-mattress',
    name: 'Single bed + mattress',
    price: 15000,
    correct: 'need',
    icon: '🛏️',
    feedback: {
      need: 'Correct! A bed is a basic requirement — you need somewhere to sleep.',
      want: "Think again! A bed is something most people can't function without. It's a Need.",
    },
  },
  {
    id: 'study-desk',
    name: 'Study desk',
    price: 7500,
    correct: 'need',
    icon: '🗄️',
    feedback: {
      need: 'Good call! You need a place to study and do homework.',
      want: "This one's debatable — but for a student, a study desk is generally considered a Need.",
    },
  },
  {
    id: 'gaming-chair',
    name: 'Gaming chair',
    price: 9000,
    correct: 'want',
    icon: '🪑',
    feedback: {
      want: 'Spot on! A gaming chair is comfortable, but a basic chair does the same job.',
      need: "A chair you need — but a gaming chair specifically? That's a Want. A basic chair would cover the Need.",
    },
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    price: 12000,
    correct: 'need',
    icon: '🚪',
    feedback: {
      need: 'Yes! You need somewhere to store your clothes.',
      want: 'Actually, storage for your clothes is a basic Need — a wardrobe qualifies.',
    },
  },
  {
    id: 'led-strips',
    name: 'LED strip lights',
    price: 1200,
    correct: 'want',
    icon: '✨',
    feedback: {
      want: 'Correct! LED strips look great but a basic light covers the Need.',
      need: "LED strips are decorative — they're a Want. A basic desk lamp or ceiling light is the Need here.",
    },
  },
  {
    id: 'desk-lamp',
    name: 'Desk lamp',
    price: 800,
    correct: 'need',
    icon: '💡',
    isGreyArea: true,
    feedback: {
      need: "Good question — this one's a grey area! A lamp helps you study safely without straining your eyes. We'll count it as a Need here.",
      want: 'Some would call it a Want. But for study without straining your eyes, most would call it a Need. Counting it as Need.',
    },
  },
  {
    id: 'wardrobe-budget',
    name: 'Basic wardrobe (budget version)',
    price: 7000,
    correct: 'need',
    icon: '🧺',
    feedback: {
      need: 'Yes! This is the more affordable option for the same Need.',
      want: 'Storage for your belongings is a Need — and this is the budget-friendly way to meet it.',
    },
  },
  {
    id: 'bluetooth-speaker',
    name: 'Bluetooth speaker',
    price: 2500,
    correct: 'want',
    icon: '🔊',
    feedback: {
      want: 'Right! Music is enjoyable, but not essential. Classic Want.',
      need: "A speaker is nice to have, but it's not something you need to live or study. That's a Want.",
    },
  },
  {
    id: 'curtains',
    name: 'Curtains',
    price: 1500,
    correct: 'need',
    icon: '🪟',
    isGreyArea: true,
    feedback: {
      need: "Curtains are a grey area — they provide privacy and block light. We're treating curtains as a Need for this simulation.",
      want: "Some rooms manage fine without them. But for privacy and sleep quality, we'll treat curtains as a Need here.",
    },
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    price: 3500,
    correct: 'want',
    icon: '📚',
    feedback: {
      want: 'Fair! A bookshelf is helpful but books can be stored elsewhere.',
      need: "It's useful, but not essential. Most people would classify this as a Want.",
    },
  },
  {
    id: 'mini-fridge',
    name: 'Mini fridge',
    price: 8000,
    correct: 'want',
    icon: '🧊',
    feedback: {
      want: 'Correct! Convenient but definitely not a bedroom essential.',
      need: 'A mini fridge in your bedroom is a Want — the kitchen fridge handles this Need.',
    },
  },
  {
    id: 'basic-chair',
    name: 'Basic study chair',
    price: 2500,
    correct: 'need',
    icon: '🪑',
    feedback: {
      need: 'Yes! You need a chair to sit and study. This is the Need version.',
      want: 'You do need somewhere to sit at your desk — a basic chair covers that Need.',
    },
  },
  {
    id: 'poster-set',
    name: 'Poster / wall art set',
    price: 600,
    correct: 'want',
    icon: '🖼️',
    feedback: {
      want: 'Absolutely a Want — decoration, not necessity.',
      need: "Wall art is lovely, but it's definitely a Want.",
    },
  },
  {
    id: 'table-fan',
    name: 'Table fan',
    price: 1800,
    correct: 'want',
    icon: '🌀',
    isGreyArea: true,
    feedback: {
      want: "Depends on where you live! For this simulation, we'll count it as a Want — assume the room has an AC or ceiling fan already.",
      need: "In a hot climate it could be a Need. For this simulation, we'll count it as a Want — assume the room has an AC or ceiling fan already.",
    },
  },
];

/* ============================================================
 *  SCREEN 4 — Catalogue (18 items, grouped by category)
 *  Some items are mutually exclusive ('siblings' field — picking one
 *  auto-removes the other; e.g. bed-budget vs bed-premium).
 * ============================================================ */

export const catalogue = {
  furniture: {
    label: 'Furniture & Bed',
    icon: '🛏️',
    items: [
      { id: 'bed-budget',      name: 'Single bed + mattress (budget)',  price: 12000, type: 'need', tier: 'budget',  siblings: ['bed-premium'] },
      { id: 'bed-premium',     name: 'Single bed + mattress (premium)', price: 22000, type: 'need', tier: 'premium', siblings: ['bed-budget'] },
      { id: 'wardrobe-budget', name: 'Wardrobe (budget)',               price: 7000,  type: 'need', tier: 'budget',  siblings: ['wardrobe-premium'] },
      { id: 'wardrobe-premium',name: 'Wardrobe (premium)',              price: 12000, type: 'need', tier: 'premium', siblings: ['wardrobe-budget'] },
    ],
  },
  seating: {
    label: 'Seating & Desk',
    icon: '🪑',
    items: [
      { id: 'study-desk',  name: 'Study desk',        price: 7500, type: 'need' },
      { id: 'basic-chair', name: 'Basic study chair', price: 2500, type: 'need', siblings: ['gaming-chair'] },
      { id: 'gaming-chair',name: 'Gaming chair',      price: 9000, type: 'want', siblings: ['basic-chair'] },
    ],
  },
  storage: {
    label: 'Storage',
    icon: '📦',
    items: [
      { id: 'bookshelf',     name: 'Bookshelf',                price: 3500, type: 'want' },
      { id: 'under-bed-box', name: 'Under-bed storage boxes',  price: 800,  type: 'need' },
    ],
  },
  lighting: {
    label: 'Lighting',
    icon: '💡',
    items: [
      { id: 'desk-lamp',    name: 'Desk lamp',            price: 800,  type: 'need' },
      { id: 'ceiling-light',name: 'Ceiling light (basic)', price: 1200, type: 'need' },
      { id: 'led-strips',   name: 'LED strip lights',     price: 1200, type: 'want' },
    ],
  },
  decor: {
    label: 'Décor & Tech',
    icon: '🎨',
    items: [
      { id: 'curtains',         name: 'Curtains',         price: 1500, type: 'need' },
      { id: 'table-fan',        name: 'Table fan',        price: 1800, type: 'want' },
      { id: 'posters',          name: 'Posters / wall art', price: 600, type: 'want' },
      { id: 'bluetooth-speaker',name: 'Bluetooth speaker', price: 2500, type: 'want' },
      { id: 'mini-fridge',      name: 'Mini fridge',      price: 8000, type: 'want' },
      { id: 'mirror',           name: 'Full-length mirror', price: 1400, type: 'want' },
    ],
  },
};

/* ============================================================
 *  SCREEN 5 — Surprise Events
 *  - fixedEvent runs first (always shown).
 *  - One randomEvent is sampled uniformly from the array.
 * ============================================================ */

export const surpriseEvents = {
  fixedEvent: {
    id: 'wardrobe-damaged',
    title: 'Damaged on Delivery',
    visual: 'cracked-wardrobe',
    bad: true,
    text:
      'Oh no! Your wardrobe arrived damaged. The replacement option costs ₹3,000 more than what you budgeted.',
    options: [
      {
        id: 'use-reserve',
        label: 'Use my emergency reserve to cover it',
        consequence:
          "You used ₹2,000 from your reserve and removed a small Want to cover the rest. Smart thinking — that's exactly what a reserve is for. Reserve is now ₹0.",
        effect: { reserveSpent: 2000, requireRemoveSmallWant: true },
      },
      {
        id: 'remove-want',
        label: 'Remove a Want item to free up ₹3,000',
        consequence:
          'Good budget thinking! You gave something up, but your core room is still intact and your reserve is safe.',
        effect: { requireRemoveWantValue: 3000 },
      },
      {
        id: 'upgrade-premium',
        label: 'Upgrade to a premium wardrobe instead (₹5,000 more)',
        consequence:
          "Bold move! You've covered the problem but you'll need to remove two Want items to stay within budget. Let's adjust.",
        effect: { swap: { from: 'wardrobe-budget', to: 'wardrobe-premium' }, requireRemoveWantCount: 2 },
      },
    ],
  },
  randomEvents: [
    {
      id: 'coupon',
      title: 'Discount Coupon!',
      good: true,
      visual: 'coupon',
      text: 'Great news! You found a ₹1,500 coupon code for home furnishings. It\'s been added to your budget.',
      options: [
        { id: 'spend-it', label: 'Spend it on a Want you couldn\'t afford', consequence: '₹1,500 added to your budget — pick one more Want item.', effect: { budgetBonus: 1500, allowExtraWant: true } },
        { id: 'save-it',  label: 'Keep it as extra savings',                consequence: 'You added it to savings — smart move, future-you will thank you.', effect: { savings: 1500 } },
      ],
    },
    {
      id: 'gift',
      title: "Relative's Gift",
      good: true,
      visual: 'envelope-cash',
      text: 'Your uncle heard about your room makeover and transferred ₹2,000 as a gift. What will you do with it?',
      options: [
        { id: 'add-reserve', label: 'Add it to my reserve',         consequence: 'Reserve boosted to ₹4,000 — a thicker safety net.', effect: { reserveBonus: 2000 } },
        { id: 'spend-want',  label: 'Spend it on something I wanted', consequence: 'You picked up one extra Want item. Felt good!', effect: { budgetBonus: 2000, allowExtraWant: true } },
      ],
    },
    {
      id: 'electrician',
      title: 'Electrician Needed',
      bad: true,
      visual: 'electric',
      text:
        'The electrician visited to install your new ceiling light and found the wiring needs fixing. It\'ll cost ₹1,500 extra.',
      options: [
        { id: 'use-reserve',  label: 'Use reserve if available', consequence: 'Reserve covered it. If your reserve was already empty, you removed a Want instead.', effect: { reserveSpent: 1500, fallbackRequireRemoveWant: true } },
        { id: 'remove-want',  label: 'Remove a Want item',       consequence: 'You let go of a Want to absorb the cost. Reserve is safe.', effect: { requireRemoveWantValue: 1500 } },
      ],
    },
    {
      id: 'delivery-charge',
      title: 'Delivery Charge Surprise',
      bad: true,
      visual: 'truck',
      text:
        'Surprise! The furniture store just informed you that delivery charges of ₹1,000 weren\'t included in the prices.',
      options: [
        { id: 'remove-small-want', label: 'Remove a small Want',     consequence: "Small Want removed — you stayed in control.", effect: { requireRemoveWantValue: 1000 } },
        { id: 'use-reserve',       label: 'Use reserve if available', consequence: "Reserve absorbed it (or a Want got removed if reserve was empty).", effect: { reserveSpent: 1000, fallbackRequireRemoveWant: true } },
      ],
    },
  ],
};
