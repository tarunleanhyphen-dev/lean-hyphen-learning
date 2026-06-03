/**
 * Lesson 3 — "Dream Bedroom Makeover"
 * A self-contained, real-time budgeting simulation. Kabir (a 14-year-old)
 * gets ₹50,000 to redesign his bedroom and learns Needs vs Wants, trade-offs,
 * opportunity cost and emergency reserves — all through play.
 *
 * This is a brand-new lesson, independent of Lesson 2. It only reuses shared
 * infrastructure (TTS, sounds, sequencer). Currency is rupees (₹) throughout.
 *
 * Exports:
 *   lesson           — scene tree (narration, ctas, palette)
 *   sortItems        — Screen 3, 14 items with per-choice feedback
 *   catalogue        — Screen 4, 18 items grouped by 5 categories
 *   surpriseEvents   — Screen 5, 1 fixed + 4 random events
 */

export const lesson = {
  id: 'dream-bedroom-makeover',
  slug: 'dream-bedroom-makeover',
  module: 'Smart Spending & Money Choices',
  title: 'Dream Bedroom Makeover',
  totalMinutes: 12,
  hero: {
    tagline:
      'Your parents handed you ₹50,000 to redesign your room. Plan every rupee — and discover where your money really goes.',
    character: { name: 'Kabir', avatar: '🧑🏽', age: 14 },
    palette: {
      // Indigo → fuchsia → amber: playful, premium, distinct from other lessons.
      from: '#6366F1',
      via: '#A855F7',
      to: '#F59E0B',
    },
  },

  budget: { total: 50000, reserve: 2000, spendable: 48000 },

  /* Room vibe = cosmetic theme only. Changes background colours / lighting,
   * never the items or the budget. */
  vibes: [
    {
      id: 'cosy', emoji: '🛋️', label: 'Cosy & Warm',
      tagline: 'soft lighting · warm wood · pillows you sink into',
      sub: 'A room that hugs you back. Amber lamps, layered textures, gentle shadows.',
      accent: '#F59E0B',
      wall: '#3a2a3e', wall2: '#4a3142', floor: '#7c5a3a', glow: '#ffb86b',
    },
    {
      id: 'study', emoji: '📚', label: 'Study Mode',
      tagline: 'organised · minimal distractions · all about focus',
      sub: 'Built around the desk. Clean shelves, focused task light, books at eye level.',
      accent: '#10B981',
      wall: '#1f3a34', wall2: '#244a40', floor: '#6b7280', glow: '#5eead4',
    },
    {
      id: 'gamer', emoji: '🎮', label: 'Gamer Setup',
      tagline: 'RGB · tech · the room glows at night',
      sub: 'Battlestation energy. Tall gaming chair, LED strips, dark walls, neon accents.',
      accent: '#8B5CF6',
      wall: '#181a2e', wall2: '#1e2140', floor: '#2a2d4a', glow: '#a78bfa',
    },
    {
      id: 'minimal', emoji: '🌿', label: 'Minimalist',
      tagline: 'space · light · only what you need',
      sub: 'White walls, light wood, almost monastic calm. Fewer things, more room to breathe.',
      accent: '#06B6D4',
      wall: '#e8edf2', wall2: '#dde4ea', floor: '#cbb59a', glow: '#a5f3fc',
    },
  ],

  scenes: [
    {
      id: 'screen-1-intro',
      title: 'The Big News',
      narration: [
        "Hi! I'm Kabir. Big news just landed at my house — my parents are renovating, and MY room is getting a complete makeover.",
        'The budget? Fifty thousand rupees. All mine. One time only. No top-ups.',
        "But here's the catch — I have to plan every single rupee. Spend too much on one thing, and there won't be enough for something else. And life always has a few surprises waiting.",
        'Ready to design our dream bedroom — on a budget?',
      ],
      cta: "Let's Go!",
    },
    {
      id: 'screen-2-vibe',
      title: 'Pick Your Style',
      intro: "First — what's your style? Pick a vibe for the room.",
      hint: 'This just sets the mood and colours. It does not change any prices.',
      confirmation: 'Nice choice! The room will glow in this style for the rest of the makeover.',
      cta: 'Continue',
    },
    {
      id: 'screen-2-rules',
      title: 'Ground Rules',
      intro: 'Before you spend a single rupee, here are the ground rules.',
      rules: [
        { icon: '💰', title: '₹50,000 total', text: 'That is your entire budget for the room.' },
        { icon: '🔒', title: 'Keep ₹2,000 safe', text: 'An Emergency Reserve you must not touch.' },
        { icon: '🛏️', title: 'Needs before Wants', text: 'Buy at least 3 Need items before adding any Wants.' },
        { icon: '⚠️', title: 'Stay in budget', text: 'Go over and you must remove items before moving on.' },
      ],
      outro: "Watch your tracker on the right — it shows exactly where your money goes.",
      cta: "Got it, let's sort!",
    },
    {
      id: 'screen-3-sort',
      title: 'Sort It Out — Needs vs Wants',
      intro:
        "Before you spend anything, let's think. Some things are NEEDS. Others are WANTS. Drop each item in the right bucket.",
      summaryHeading: "Nice work! Here's a quick look at what you found.",
      summaryOutro:
        "You've already started seeing where money goes — most of it tends to go toward Needs. That's normal. Now let's actually go shopping.",
      cta: 'Start Shopping',
    },
    {
      id: 'screen-4-shop',
      title: 'Shop Smart',
      intro: "Here's your full catalogue. Build your room — but stay within ₹48,000.",
      sub: 'Remember: ₹2,000 is locked as your Emergency Reserve.',
      tip: 'Some items have a Budget and a Premium version. Choose wisely.',
      gates: {
        minNeeds: 3,
        overBudgetMessage: "You're over budget! Remove an item to continue.",
        insufficientNeedsMessage: 'You need at least 3 essential items in your room before moving forward.',
      },
      budgetBands: [
        { id: 'safe',  upTo: 38000, color: '#10B981', label: 'Plenty of room' },
        { id: 'tight', upTo: 45000, color: '#F59E0B', label: 'Getting tight' },
        { id: 'edge',  upTo: 48000, color: '#EF4444', label: 'On the edge' },
      ],
      opportunityCosts: [
        {
          when: { added: 'bed-premium', removed: 'bed-budget' },
          title: 'Upgrading your bed costs ₹10,000 more',
          message: "That's roughly the cost of your study desk AND a basic chair. Still want to upgrade?",
          tradeFor: ['study-desk', 'basic-chair'],
        },
        {
          when: { added: 'wardrobe-premium', removed: 'wardrobe-budget' },
          title: 'Premium wardrobe costs ₹5,000 more',
          message: "That's about two Want items — like a bookshelf and a mirror. Worth it for the space and durability?",
          tradeFor: ['bookshelf', 'mirror'],
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
      spinLine: 'One more twist — spin the wheel of fate.',
      spinCta: 'Spin the Wheel',
    },
    {
      id: 'screen-6-snapshot',
      title: 'Spending Snapshot',
      intro:
        "Your room is ready! Before we move on, let's look at where your ₹50,000 actually went.",
      insightTemplates: [
        { id: 'furniture-heavy', match: { categoryShareGte: { furniture: 0.5 } }, template: 'Furniture took the biggest share of your budget — {furniturePct}%. That\'s common, since beds and wardrobes are expensive essentials.' },
        { id: 'wants-heavy',     match: { wantsShareGte: 0.3 },                 template: 'You spent {wantsPct}% on Wants. That left less room for savings — worth thinking about next time.' },
        { id: 'reserve-intact',  match: { reserveStatus: 'intact' },            template: 'You kept your ₹2,000 reserve safe the whole way. Disciplined!' },
        { id: 'reserve-used',    match: { reserveStatus: 'used' },              template: 'You needed your reserve during a surprise. Good thing you had it set aside!' },
      ],
      mcq: { question: 'Which category took the biggest chunk of your budget?' },
      transitionTitle: 'You just experienced what budgeting feels like in real life.',
      transitionSub: "Now let's understand the rule that makes it easier — every time.",
      cta: 'Learn the Rule',
    },
  ],

  /* Act map — keeps HomePage / LessonPage routing happy. Act 1 is the full
   * simulation; later acts are scaffolded so additions never break routing. */
  acts: {
    act1: { id: 'act1', title: 'Act 1 — Dream Bedroom Makeover', minutes: 8, kind: 'simulation-3d', status: 'live' },
    act2: { id: 'act2', title: 'Act 2 — The 50/30/20 Rule', minutes: 4, kind: 'interactive', status: 'coming-soon' },
    act3: { id: 'act3', title: 'Act 3 — TBD', minutes: 3, kind: 'scenarios',  status: 'coming-soon' },
    act4: { id: 'act4', title: 'Act 4 — TBD', minutes: 3, kind: 'reflection', status: 'coming-soon' },
  },
};

/* ============================================================
 *  ACT 2 — The 50/30/20 Rule (concept teach)
 * ============================================================ */
export const act2 = {
  id: 'act2',
  title: 'Act 2 — The 50/30/20 Rule',
  scenes: [
    { id: 'c1-reveal',   title: 'The Reveal' },
    { id: 'c2-apply',    title: 'Apply It to Your Budget' },
    { id: 'c3-activity', title: "Sort Kabir's Expenses" },
    { id: 'c4-takeaway', title: 'The Takeaway' },
  ],

  reveal: {
    intro: 'You made a lot of spending decisions just now. But did you know smart budgeters use one simple rule to guide every choice?',
    prompt: 'Click each slice to unlock what it means.',
    slices: [
      { id: 'needs',   pct: 50, color: '#10B981', label: 'Needs',   text: '50% — Needs. Half your money goes to things you genuinely cannot do without. Rent, food, transport, school supplies.' },
      { id: 'wants',   pct: 30, color: '#A855F7', label: 'Wants',   text: '30% — Wants. Nearly a third can go toward things that make life enjoyable. Streaming, outings, new clothes, hobbies.' },
      { id: 'savings', pct: 20, color: '#F59E0B', label: 'Savings', text: "20% — Savings. At least one-fifth is set aside — for emergencies, future goals, or things you're working toward." },
    ],
    outro: 'This is the 50/30/20 Rule. Simple. Powerful. Used by millions of people worldwide to manage their money.',
    cta: 'Apply it to my budget',
  },

  apply: {
    intro: "Let's see what the 50/30/20 rule would have looked like with your ₹50,000 bedroom budget.",
    compareIntro: "Here's how YOUR spend compared:",
    targets: { needs: 25000, wants: 15000, savings: 10000 },
    feedback: {
      needsOver:   "You spent more than 50% on Needs — very common with bedroom budgets, since beds and wardrobes are expensive. In real life, budgets are flexible.",
      wantsOver:   "Your Wants crossed the 30% mark. That's easy to do — Wants feel important in the moment!",
      savingsGood: "You saved at least 20% — you're already following the rule without knowing it. Well done!",
    },
    outro: "The rule isn't about being perfect. It's about being aware. Now let's practise applying it.",
    cta: 'Practise the rule',
  },

  activity: {
    intro: "Meet Kabir. He's 14 and gets ₹5,000 pocket money every month. Here's everything he spent last month.",
    task: 'Your job: put each expense into the right bucket — Needs, Wants, or Savings — using the 50/30/20 rule.',
    pocket: 5000,
    buckets: [
      { id: 'needs',   label: 'Needs',   color: '#10B981', target: 2500 },
      { id: 'wants',   label: 'Wants',   color: '#A855F7', target: 1500 },
      { id: 'savings', label: 'Savings', color: '#F59E0B', target: 1000 },
    ],
    expenses: [
      { id: 'stationery', name: 'School stationery',        amount: 300, art: 'poster',   bucket: 'needs',   feedback: 'Yes! School supplies are a Need.' },
      { id: 'buspass',    name: 'Bus pass (monthly)',       amount: 400, art: 'boxes',    bucket: 'needs',   feedback: 'Correct — transport to school is essential.' },
      { id: 'streaming',  name: 'Streaming app',            amount: 149, art: 'speaker',  bucket: 'wants',   feedback: 'Right! Entertainment is a Want.' },
      { id: 'snacks',     name: 'Canteen snacks',           amount: 600, art: 'fridge',   bucket: 'wants',   grey: true, feedback: 'Snacks could be a Need (food) or a Want (treat). Since Kabir has lunch covered separately, we count snacks as a Want here.' },
      { id: 'earphones',  name: 'New earphones',            amount: 800, art: 'speaker',  bucket: 'wants',   feedback: 'A Want — the old ones still work fine.' },
      { id: 'lunch',      name: 'Lunch on school days',     amount: 900, art: 'fridge',   bucket: 'needs',   feedback: 'Definitely a Need — food is always a Need.' },
      { id: 'movie',      name: 'Movie outing with friends',amount: 350, art: 'poster',   bucket: 'wants',   feedback: 'A fun Want — social and enjoyable, not essential.' },
      { id: 'piggy',      name: 'Piggy bank deposit',       amount: 500, art: 'boxes',    bucket: 'savings', feedback: 'Great! Saving counts as the 20% bucket.' },
    ],
    leftover: 1001,
    saveQuestion: 'Kabir has ₹1,001 left unspent. The 50/30/20 rule says — save it. Do you agree?',
    saveYes: 'Smart thinking! Saving unplanned leftover money is a great habit.',
    saveNo: "Fair — it's tempting! But over time, saving those leftovers adds up to something big.",
    cta: 'See the takeaway',
  },

  takeaway: {
    title: 'One rule. Three buckets. A lifetime of clarity.',
    sub: 'Needs first. Wants next. Always save something.',
    verdicts: {
      needsHeavy: 'In your bedroom sim, you leaned toward Needs — very responsible. Next time, see if you can carve out a little more for savings.',
      balanced:   "Your bedroom spending was fairly balanced. You're already thinking like a budgeter!",
      wantsHeavy: 'You went big on Wants — nothing wrong with enjoying your room! But next time, try hitting the Needs and savings targets first.',
    },
    cta: "Ready to prove what you've learnt?",
  },
};

/* ============================================================
 *  SCREEN 3 — Sort Items (14)
 * ============================================================ */
export const sortItems = [
  { id: 'bed-mattress', name: 'Single bed + mattress', price: 15000, correct: 'need', art: 'bed',
    feedback: { need: 'Correct! A bed is a basic requirement — you need somewhere to sleep.', want: "Think again! A bed is something most people can't function without. It's a Need." } },
  { id: 'study-desk', name: 'Study desk', price: 7500, correct: 'need', art: 'desk',
    feedback: { need: 'Good call! You need a place to study and do homework.', want: "This one's debatable — but for a student, a study desk is generally a Need." } },
  { id: 'gaming-chair', name: 'Gaming chair', price: 9000, correct: 'want', art: 'gchair',
    feedback: { want: 'Spot on! A gaming chair is comfy, but a basic chair does the same job.', need: "You need a chair — but a gaming chair specifically? That's a Want. A basic chair covers the Need." } },
  { id: 'wardrobe', name: 'Wardrobe', price: 12000, correct: 'need', art: 'wardrobe',
    feedback: { need: 'Yes! You need somewhere to store your clothes.', want: 'Actually, storage for your clothes is a basic Need — a wardrobe qualifies.' } },
  { id: 'led-strips', name: 'LED strip lights', price: 1200, correct: 'want', art: 'led',
    feedback: { want: 'Correct! LED strips look great, but a basic light covers the Need.', need: "LED strips are decorative — a Want. A ceiling light or lamp is the real Need." } },
  { id: 'desk-lamp', name: 'Desk lamp', price: 800, correct: 'need', art: 'lamp', isGreyArea: true,
    feedback: { need: "Grey area! A lamp helps you study without straining your eyes. We'll count it as a Need.", want: "Some call it a Want — but for safe studying, most call it a Need. We'll count it as a Need here." } },
  { id: 'wardrobe-budget', name: 'Basic wardrobe (budget)', price: 7000, correct: 'need', art: 'wardrobe',
    feedback: { need: 'Yes! The affordable way to meet the same Need.', want: 'Storage for your belongings is a Need — and this is the budget-friendly version.' } },
  { id: 'bluetooth-speaker', name: 'Bluetooth speaker', price: 2500, correct: 'want', art: 'speaker',
    feedback: { want: 'Right! Music is enjoyable, but not essential. Classic Want.', need: "A speaker is nice, but you don't need it to live or study. That's a Want." } },
  { id: 'curtains', name: 'Curtains', price: 1500, correct: 'need', art: 'curtains', isGreyArea: true,
    feedback: { need: 'Grey area — curtains give privacy and block light. We\'ll treat them as a Need here.', want: "Some rooms manage without them. But for privacy and sleep, we'll treat curtains as a Need here." } },
  { id: 'bookshelf', name: 'Bookshelf', price: 3500, correct: 'want', art: 'shelf',
    feedback: { want: 'Fair! Helpful, but books can be stored elsewhere.', need: "Useful, but not essential. Most people would call this a Want." } },
  { id: 'mini-fridge', name: 'Mini fridge', price: 8000, correct: 'want', art: 'fridge',
    feedback: { want: 'Correct! Convenient, but definitely not a bedroom essential.', need: 'A mini fridge in the bedroom is a Want — the kitchen fridge handles this Need.' } },
  { id: 'basic-chair', name: 'Basic study chair', price: 2500, correct: 'need', art: 'chair',
    feedback: { need: 'Yes! You need a chair to study. This is the Need version.', want: 'You do need somewhere to sit at your desk — a basic chair covers that Need.' } },
  { id: 'poster-set', name: 'Poster / wall art set', price: 600, correct: 'want', art: 'poster',
    feedback: { want: 'Absolutely a Want — decoration, not necessity.', need: "Wall art is lovely, but it's definitely a Want." } },
  { id: 'table-fan', name: 'Table fan', price: 1800, correct: 'want', art: 'fan', isGreyArea: true,
    feedback: { want: "Depends where you live! For this game we'll count it a Want — assume the room already has a ceiling fan or AC.", need: "In a hot place it could be a Need. For this game we'll count it a Want — assume there's already a ceiling fan or AC." } },
];

/* ============================================================
 *  SCREEN 4 — Catalogue (18 items, 5 categories)
 *  'siblings' = mutually exclusive (picking one removes the other).
 *  'art' = which 3D prop / 2D illustration to draw.
 * ============================================================ */
export const catalogue = {
  furniture: {
    label: 'Furniture & Bed', icon: '🛏️', color: '#F59E0B',
    items: [
      { id: 'bed-budget',       name: 'Single Bed + Mattress', tierLabel: 'Budget',  price: 12000, type: 'need', tier: 'budget',  art: 'bed',     siblings: ['bed-premium'] },
      { id: 'bed-premium',      name: 'Single Bed + Mattress', tierLabel: 'Premium', price: 22000, type: 'need', tier: 'premium', art: 'bed',     siblings: ['bed-budget'] },
      { id: 'wardrobe-budget',  name: 'Wardrobe',              tierLabel: 'Budget',  price: 7000,  type: 'need', tier: 'budget',  art: 'wardrobe', siblings: ['wardrobe-premium'] },
      { id: 'wardrobe-premium', name: 'Wardrobe',              tierLabel: 'Premium', price: 12000, type: 'need', tier: 'premium', art: 'wardrobe', siblings: ['wardrobe-budget'] },
    ],
  },
  seating: {
    label: 'Seating & Desk', icon: '🪑', color: '#10B981',
    items: [
      { id: 'study-desk',  name: 'Study Desk',        price: 7500, type: 'need', art: 'desk' },
      { id: 'basic-chair', name: 'Basic Study Chair', price: 2500, type: 'need', art: 'chair',  siblings: ['gaming-chair'] },
      { id: 'gaming-chair',name: 'Gaming Chair',      price: 9000, type: 'want', art: 'gchair', siblings: ['basic-chair'] },
    ],
  },
  storage: {
    label: 'Storage', icon: '📦', color: '#3B82F6',
    items: [
      { id: 'bookshelf',     name: 'Bookshelf',              price: 3500, type: 'want', art: 'shelf' },
      { id: 'under-bed-box', name: 'Under-bed Storage Boxes', price: 800, type: 'need', art: 'boxes' },
    ],
  },
  lighting: {
    label: 'Lighting', icon: '💡', color: '#FACC15',
    items: [
      { id: 'desk-lamp',     name: 'Desk Lamp',        price: 800,  type: 'need', art: 'lamp' },
      { id: 'ceiling-light', name: 'Ceiling Light',    price: 1200, type: 'need', art: 'ceiling' },
      { id: 'led-strips',    name: 'LED Strip Lights', price: 1200, type: 'want', art: 'led' },
    ],
  },
  decor: {
    label: 'Décor & Tech', icon: '🎨', color: '#A855F7',
    items: [
      { id: 'curtains',         name: 'Curtains',          price: 1500, type: 'need', art: 'curtains' },
      { id: 'table-fan',        name: 'Table Fan',         price: 1800, type: 'want', art: 'fan' },
      { id: 'posters',          name: 'Posters / Wall Art', price: 600,  type: 'want', art: 'poster' },
      { id: 'bluetooth-speaker',name: 'Bluetooth Speaker', price: 2500, type: 'want', art: 'speaker' },
      { id: 'mini-fridge',      name: 'Mini Fridge',       price: 8000, type: 'want', art: 'fridge' },
      { id: 'mirror',           name: 'Full-Length Mirror', price: 1400, type: 'want', art: 'mirror' },
    ],
  },
};

/* ============================================================
 *  SCREEN 5 — Surprise Events (1 fixed + 4 random)
 * ============================================================ */
export const surpriseEvents = {
  fixedEvent: {
    id: 'wardrobe-damaged',
    title: 'Damaged on Delivery',
    visual: 'cracked-wardrobe',
    bad: true,
    text: 'Oh no! Your wardrobe arrived damaged. The replacement costs ₹3,000 more than you budgeted.',
    options: [
      { id: 'use-reserve', label: 'Use my emergency reserve to cover it',
        consequence: "You used ₹2,000 from your reserve and removed a small Want to cover the rest. Smart — that's exactly what a reserve is for. Reserve is now ₹0.",
        effect: { reserveSpent: 2000, requireRemoveSmallWant: true } },
      { id: 'remove-want', label: 'Remove a Want item to free up ₹3,000',
        consequence: 'Good budget thinking! You gave something up, but your core room is intact and your reserve is safe.',
        effect: { requireRemoveWantValue: 3000 } },
      { id: 'upgrade-premium', label: 'Upgrade to a premium wardrobe instead (₹5,000 more)',
        consequence: "Bold move! You've covered the problem, but you'll need to remove two Want items to stay in budget. Let's adjust.",
        effect: { swap: { from: 'wardrobe-budget', to: 'wardrobe-premium' }, requireRemoveWantCount: 2 } },
    ],
  },
  randomEvents: [
    { id: 'coupon', title: 'Discount Coupon!', good: true, visual: 'coupon',
      text: 'Great news! You found a ₹1,500 coupon for home furnishings. It\'s been added to your budget.',
      options: [
        { id: 'spend-it', label: "Spend it on a Want you couldn't afford", consequence: '₹1,500 added — go pick one more Want item you love.', effect: { budgetBonus: 1500, allowExtraWant: true } },
        { id: 'save-it',  label: 'Keep it as extra savings',                consequence: 'Added to savings. Smart move — future-you says thanks.', effect: { savings: 1500 } },
      ] },
    { id: 'gift', title: "Relative's Gift", good: true, visual: 'envelope-cash',
      text: 'Your uncle heard about the makeover and sent ₹2,000 as a gift. What will you do with it?',
      options: [
        { id: 'add-reserve', label: 'Add it to my reserve',          consequence: 'Reserve boosted to ₹4,000 — a thicker safety net.', effect: { reserveBonus: 2000 } },
        { id: 'spend-want',  label: 'Spend it on something I wanted', consequence: 'You picked up one extra Want item. Felt good!', effect: { budgetBonus: 2000, allowExtraWant: true } },
      ] },
    { id: 'electrician', title: 'Electrician Needed', bad: true, visual: 'electric',
      text: 'The electrician found the wiring for your new ceiling light needs fixing — ₹1,500 extra.',
      options: [
        { id: 'use-reserve', label: 'Use reserve if available', consequence: 'Reserve covered it. If your reserve was already empty, you removed a Want instead.', effect: { reserveSpent: 1500, fallbackRequireRemoveWant: true } },
        { id: 'remove-want', label: 'Remove a Want item',       consequence: 'You let go of a Want to absorb the cost. Reserve stays safe.', effect: { requireRemoveWantValue: 1500 } },
      ] },
    { id: 'delivery-charge', title: 'Delivery Charge Surprise', bad: true, visual: 'truck',
      text: 'Surprise! The store says delivery charges of ₹1,000 weren\'t included in the prices.',
      options: [
        { id: 'remove-small-want', label: 'Remove a small Want',      consequence: 'Small Want removed — you stayed in control.', effect: { requireRemoveWantValue: 1000 } },
        { id: 'use-reserve',       label: 'Use reserve if available', consequence: 'Reserve absorbed it (or a Want got removed if reserve was empty).', effect: { reserveSpent: 1000, fallbackRequireRemoveWant: true } },
      ] },
  ],
};
