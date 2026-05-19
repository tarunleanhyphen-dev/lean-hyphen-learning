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
    act2: {
      id: 'act2',
      title: 'Act 2 — Understanding Impulse Buying',
      minutes: 5,
      kind: 'interactive-cards',
      scenes: act2Scenes(),
    },
    act3: { id: 'act3', title: 'Act 3 — Four Real-life Simulations', minutes: 9, kind: 'scenarios', status: 'coming-soon' },
    act4: { id: 'act4', title: 'Act 4 — Reflect & Realise', minutes: 3, kind: 'impulse-meter', status: 'coming-soon' },
  },
};
function act1Scenes() {
  /* helper: spread a long phone-state block without retyping */
  const after = (cart, extra = {}) => ({ cart, view: 'feed', ...extra });

  return [
    /* ============================================================
     * SCENE 0 — OPENING CONTEXT
     * Fast emotional setup before the simulation starts: who is Shanaya,
     * why does her birthday matter, what is she imagining. The phone shows
     * the shopping app's home feed throughout (it's the constant the
     * student is about to spend the next 18 minutes inside), while the
     * left side carries the narrative montage in narration + thought
     * bubbles. Slightly upbeat cosy ambience.
     * ============================================================ */
    {
      id: 'scene-0',
      title: 'Opening Context',
      ambience: 'cosy',
      emotion: 'happy',
      phases: [
        {
          id: 's0-intro',
          duration: 12000,
          status: 'Meet Shanaya',
          emotion: 'happy',
          narration: 'Shanaya is 13, super social, and always excited about making memories with her friends.',
          phone: { view: 'feed' },
          imagery: [
            { id: 'friends-1', emoji: '👯‍♀️', caption: 'her crew',     pos: 'tr', delay: 0.1 },
            { id: 'selfie',    emoji: '🤳',  caption: 'selfies',     pos: 'br', delay: 0.4 },
          ],
        },
        {
          id: 's0-birthday',
          duration: 12000,
          status: 'Birthday is two days away',
          emotion: 'excited',
          narration: 'Her birthday is just two days away — her group is planning to celebrate at a cute café nearby.',
          phone: { view: 'feed' },
          imagery: [
            { id: 'cake',  emoji: '🎂',  caption: 'in 2 days',   pos: 'tr', delay: 0.1 },
            { id: 'cafe',  emoji: '☕️', caption: 'cute café',   pos: 'br', delay: 0.45 },
          ],
        },
        {
          id: 's0-group-chat',
          duration: 11000,
          status: 'Group chat is going wild',
          emotion: 'tempted',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Birthday fit checkkk 👀' },
            { side: 'right', type: 'thought', text: 'We need pics!! Dress extra cool 😎' },
          ],
          phone: { view: 'feed' },
          imagery: [
            { id: 'chat',  emoji: '💬', caption: 'group chat',  pos: 'tr', delay: 0.1 },
            { id: 'phone', emoji: '📱', caption: 'pinging',     pos: 'br', delay: 0.4 },
          ],
        },
        {
          id: 's0-vision',
          duration: 13000,
          status: 'Imagining the day',
          emotion: 'happy',
          narration: 'She already knows the kind of birthday she wants — fun photos, matching vibes, good food, and an outfit that makes her feel confident.',
          phone: { view: 'feed' },
          imagery: [
            { id: 'fit',     emoji: '👗', caption: 'the outfit', pos: 'tr', delay: 0.1 },
            { id: 'camera',  emoji: '📸', caption: 'fun photos', pos: 'br', delay: 0.4 },
            { id: 'sparkle', emoji: '✨', caption: 'confidence', pos: 'tl', delay: 0.7 },
          ],
        },
        {
          id: 's0-app-open',
          duration: 11000,
          status: 'Opening the shopping app',
          emotion: 'curious',
          narration: 'So she opens her favourite shopping app, planning to quickly buy one pair of shoes to complete her birthday look and log off.',
          phone: { view: 'feed' },
          imagery: [
            { id: 'shoes',   emoji: '👟', caption: 'just shoes', pos: 'tr', delay: 0.1 },
            { id: 'plan',    emoji: '📝', caption: 'one item',   pos: 'br', delay: 0.4 },
          ],
        },
      ],
    },

    /* ============================================================
     * SCENE 1 — THE PLAN  +  PREDICTION MCQ
     * ============================================================ */
    {
      id: 'scene-1',
      title: 'The Plan',
      ambience: 'cosy',
      emotion: 'neutral',
      phases: [
        {
          id: 's1-open',
          duration: 9000,
          status: 'Browsing on the app',
          narration: 'It is a quiet afternoon. Shanaya is in her room. She has a clear plan.',
          phone: { view: 'feed' },
        },
        {
          id: 's1-intent-1',
          duration: 6500,
          status: 'Planning the budget',
          bubbles: [
            { side: 'right', type: 'thought', text: 'I just need one good pair of shoes for my birthday.' },
          ],
          phone: { view: 'feed' },
        },
        {
          id: 's1-intent-2',
          duration: 7000,
          status: 'Planning the budget',
          bubbles: [
            { side: 'right', type: 'thought', text: 'I just need one good pair of shoes for my birthday.' },
            { side: 'right', type: 'thought', text: 'I will stay within ₹1,500 and that is it. No extra spending this time.' },
          ],
          phone: { view: 'feed' },
        },
        {
          id: 's1-search',
          duration: 3600,
          status: 'Searching for shoes',
          narration: 'She taps the search bar and types one word.',
          phone: { search: 'shoes', view: 'feed' },
          cue: 'click',
        },
        {
          /* When narration says "she scrolls", the phone should actually
           * scroll. scrollHint triggers the 3.6 s scroll-down animation;
           * duration is padded so the animation finishes well before the
           * phase auto-advances. */
          id: 's1-results',
          duration: 7500,
          status: 'Browsing results',
          phone: { search: 'shoes', view: 'results', scrollHint: true },
          narration: 'A grid of options appears. She scrolls — there are dozens.',
        },
        {
          /* After the scroll, she "spots" the white sneakers — which are
           * the first card in the grid. scrollToTop snaps the view back to
           * the top so the highlighted card is in frame, and the hover
           * effect pulses around it. */
          id: 's1-results-scan',
          duration: 5500,
          status: 'Spotting the white sneakers',
          phone: { search: 'shoes', view: 'results', hover: 'shoes', scrollToTop: true },
          bubbles: [
            { side: 'right', type: 'thought', text: 'White sneakers. ₹1,499 — that is on budget.' },
          ],
        },
        {
          id: 's1-show-shoes',
          duration: 5800,
          status: 'Reading the product details',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'These look perfect. Good price, nice style.' },
          ],
        },
        {
          id: 's1-tap',
          duration: 1800,
          status: 'Tapping Add to Cart',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes', tapTarget: 'primary-cta' },
          cue: 'tap',
        },
        {
          id: 's1-add-shoes',
          duration: 3800,
          status: 'Sneakers added',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes', cart: ['shoes'], floatAdd: 'shoes', toast: 'Sneakers added · ₹1,499' },
          cue: 'add',
          addedItem: { id: 'shoes', trigger: 'plan' },
        },
        {
          id: 's1-validate',
          duration: 4800,
          status: 'On plan: ₹1,499 of ₹1,500',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes', cart: ['shoes'], badge: 'Smart budget pick ✓' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'These look perfect.' },
            { side: 'right', type: 'thought', text: 'Good price, nice style… this is exactly what I needed. Okay, done. That was easy.' },
          ],
        },

        /* ---- ENGAGEMENT POP-UP #1 — PREDICTION ---- */
        {
          id: 's1-predict',
          hold: true,
          status: 'Your prediction',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes', cart: ['shoes'], dim: true },
          mcq: {
            kind: 'prediction',
            prompt: 'She got what she planned. What do you think happens next?',
            options: [
              { id: 'a', label: 'She checks out immediately',          correct: null },
              { id: 'b', label: 'She keeps browsing "just for fun"',    correct: null },
              { id: 'c', label: 'She removes the shoes',                correct: null },
              { id: 'd', label: 'She compares prices on another app',   correct: null },
            ],
            // No explanation: the user wants the next scene to be the answer,
            // not an interstitial insight. Continue button leads straight on.
            continueLabel: 'See what happens next',
          },
        },
      ],
    },

    /* ============================================================
     * SCENE 2 — THE SUGGESTIONS BEGIN  +  SPOT-THE-TRICK MCQ
     * Three waves: cross-sell socks, social proof watch, urgency hoodie
     * Each wave: recommendation card → tap → product detail → thoughts → add
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
          status: 'Scrolling for more',
          narration: 'But she does not log off. She scrolls a little more — and the app starts responding to her choices.',
          phone: after(['shoes'], { scrollHint: true, scrollTo: 'flash-strip' }),
        },

        /* --- Wave 1: Cross-sell — socks.
         * Split into two beats so the student can register what the nudge
         * is saying BEFORE the product card slides in:
         *   1) Banner alone — "Pair your shoes with a beautiful pair of
         *      matching socks" — pauses for ~4 s so the line lands.
         *   2) App auto-scrolls and the "Complete the Look" recommendation
         *      pops into view below the banner. */
        {
          id: 's2-w1-nudge',
          duration: 5500,
          status: 'Pairing nudge slides in',
          phone: after(['shoes'], {
            pairNudge: { title: 'Complete the Look', subtitle: 'Pair your shoes with a beautiful pair of matching socks' },
          }),
          narration: 'Pair your shoes with a beautiful pair of matching socks.',
          cue: 'ding',
          insight: { label: 'Cross-sell', detail: 'Pairing suggestions feel like completing one decision, not making a new one.' },
        },
        {
          id: 's2-w1-card',
          duration: 4500,
          status: '"Complete the Look" → Branded Socks ₹299',
          phone: after(['shoes'], {
            recommendations: ['socks'],
            rowLabel: 'Complete the Look',
            scrollTo: 'recommendations',
            pairNudge: { title: 'Complete the Look', subtitle: 'Pair your shoes with a beautiful pair of matching socks' },
            highlight: 'socks',
          }),
        },
        {
          id: 's2-w1-tap-rec',
          duration: 1600,
          status: 'Tapping the socks',
          phone: after(['shoes'], {
            recommendations: ['socks'],
            rowLabel: 'Complete the Look',
            pairNudge: { title: 'Complete the Look', subtitle: 'Pair your shoes with a beautiful pair of matching socks' },
            tapTarget: 'rec-socks',
          }),
          cue: 'tap',
        },
        {
          id: 's2-w1-detail',
          duration: 5200,
          status: 'Reading socks details',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Hmm… socks would actually go well with these shoes.' },
          ],
        },
        {
          id: 's2-w1-bubble2',
          duration: 4400,
          status: 'Reading socks details',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'It is not really extra. It just… completes the look.' },
          ],
        },
        {
          id: 's2-w1-tap-add',
          duration: 1600,
          status: 'Tapping Add to Cart',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks', tapTarget: 'primary-cta' },
          cue: 'tap',
        },
        {
          id: 's2-w1-add',
          duration: 3200,
          status: 'Socks added',
          phone: after(['shoes', 'socks'], { recommendations: ['socks'], rowLabel: 'Complete the Look', floatAdd: 'socks', toast: 'Branded Socks · ₹299' }),
          cue: 'add',
          addedItem: { id: 'socks', trigger: 'cross-sell' },
        },

        /* --- Wave 2: Social proof — smartwatch.
         * Socks is already in the cart so we DON'T re-list it in the
         * recommendations row — only the new pick (smartwatch) shows. */
        {
          id: 's2-w2-card',
          duration: 4500,
          status: '"Customers Also Bought"',
          phone: after(['shoes', 'socks'], {
            recommendations: ['smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
            scrollTo: 'recommendations',
          }),
          insight: { label: 'Social proof', detail: '“12K bought this week” borrows other people’s decision so you skip making your own.' },
        },
        {
          id: 's2-w2-tap-rec',
          duration: 1600,
          status: 'Tapping the smartwatch',
          phone: after(['shoes', 'socks'], {
            recommendations: ['smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
            tapTarget: 'rec-smartwatch',
          }),
          cue: 'tap',
        },
        {
          id: 's2-w2-detail',
          duration: 5400,
          status: 'Reading smartwatch details',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'smartwatch', socialProofBadge: '12K bought this week' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Whoa. This smartwatch looks really cool.' },
          ],
        },
        {
          id: 's2-w2-bubble2',
          duration: 4600,
          status: 'Reading smartwatch details',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'smartwatch', socialProofBadge: '12K bought this week' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'And if 12K people are buying it this week… maybe it is actually worth it?' },
          ],
        },
        {
          id: 's2-w2-tap-add',
          duration: 1600,
          status: 'Tapping Add to Cart',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'smartwatch', socialProofBadge: '12K bought this week', tapTarget: 'primary-cta' },
          cue: 'tap',
        },
        {
          id: 's2-w2-add',
          duration: 3200,
          status: 'Smartwatch added',
          phone: after(['shoes', 'socks', 'smartwatch'], {
            recommendations: ['socks', 'smartwatch'],
            rowLabel: 'Customers Also Bought',
            socialProof: 'smartwatch',
            floatAdd: 'smartwatch',
            toast: 'Smartwatch X1 · ₹799',
          }),
          cue: 'add',
          addedItem: { id: 'smartwatch', trigger: 'social-proof' },
        },

        /* --- Wave 3: Urgency / scarcity — hoodie.
         * "Trending Now" row carries three hoodies, but only the main
         * Birthday Hoodie has the flash-deal timer and "Only 2 left" chip.
         * Top of the phone shows a pulsing FlashDealAlert; PDP layers more
         * urgency (5-minute countdown + "Only 2 left" badge + the ₹1,999 →
         * ₹999 strikethrough price). */
        {
          id: 's2-w3-card',
          duration: 6000,
          status: 'Flash Deal flashes in',
          phone: after(['shoes', 'socks', 'smartwatch'], {
            recommendations: ['hoodie', 'hoodie-2', 'hoodie-3'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            flashAlert: { label: 'Flash Deal — Ends Soon!', product: 'Trending Now → Birthday Hoodie · ₹1,999 ₹999', mins: 5 },
            scrollTo: 'recommendations',
          }),
          insight: { label: 'Urgency design', detail: 'Countdown timers and "only X left" shrink decision time on purpose.' },
          cue: 'alert',
        },
        {
          id: 's2-w3-tap-rec',
          duration: 1600,
          status: 'Tapping the hoodie',
          phone: after(['shoes', 'socks', 'smartwatch'], {
            recommendations: ['hoodie', 'hoodie-2', 'hoodie-3'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            flashAlert: { label: 'Flash Deal — Ends Soon!', product: 'Trending Now → Birthday Hoodie · ₹1,999 ₹999', mins: 5 },
            tapTarget: 'rec-hoodie',
          }),
          cue: 'tap',
        },
        {
          id: 's2-w3-detail',
          duration: 5400,
          status: 'Reading hoodie details',
          phone: { cart: ['shoes', 'socks', 'smartwatch'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5, onlyXLeft: 2 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This hoodie is so nice…' },
          ],
        },
        {
          id: 's2-w3-bubble2',
          duration: 4800,
          status: 'Reading hoodie details',
          phone: { cart: ['shoes', 'socks', 'smartwatch'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5, onlyXLeft: 2 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'It would actually look great in my birthday photos.' },
          ],
        },
        {
          id: 's2-w3-bubble3',
          duration: 4800,
          status: 'Reading hoodie details',
          phone: { cart: ['shoes', 'socks', 'smartwatch'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5, onlyXLeft: 2 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'I did not plan this… but it kind of fits the whole vibe.' },
          ],
        },
        {
          id: 's2-w3-tap-add',
          duration: 1600,
          status: 'Tapping Add to Cart',
          phone: { cart: ['shoes', 'socks', 'smartwatch'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5, onlyXLeft: 2, tapTarget: 'primary-cta' },
          cue: 'tap',
        },
        {
          id: 's2-w3-add',
          duration: 3200,
          status: 'Hoodie added',
          phone: after(['shoes', 'socks', 'smartwatch', 'hoodie'], {
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            floatAdd: 'hoodie',
            toast: 'Birthday Hoodie · ₹999',
          }),
          cue: 'add',
          addedItem: { id: 'hoodie', trigger: 'urgency' },
        },

        /* ---- ENGAGEMENT POP-UP #2 — SPOT THE TRICK ---- */
        {
          id: 's2-spot',
          hold: true,
          status: 'Spot the trick',
          phone: after(['shoes', 'socks', 'smartwatch', 'hoodie'], {
            recommendations: ['socks', 'smartwatch', 'hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            dim: true,
          }),
          mcq: {
            kind: 'multi-spot',
            prompt: 'Which features were most influencing Shanaya in this scene?',
            options: [
              { id: 'a', label: '⏳ Flash Deal countdown',                correct: true  },
              { id: 'b', label: '⭐ "Trending" / "12K bought" labels',     correct: true  },
              { id: 'c', label: '✨ "Complete the Look" suggestions',     correct: true  },
              { id: 'd', label: '📦 Free Delivery offers',                correct: false },
            ],
            explanation: 'Cross-sell, social proof and urgency are all in play here — and none of it is accidental. Free delivery is a different trick that we will see next. Shopping apps are carefully designed to influence decisions, often without us noticing.',
            continueLabel: 'Continue the story',
          },
        },
      ],
    },

    /* ============================================================
     * SCENE 3 — THE PUSH  (free delivery + cleaning kit)
     * ============================================================ */
    {
      id: 'scene-3',
      title: 'The Push',
      ambience: 'app-tempo',
      emotion: 'excited',
      phases: [
        /* Scene 3 lives in `cart-focus`: from here on the phone shows the
         * full cart (items + total + timer + free-delivery banner + the FBT
         * cleaning-kit nudge), so every line of narration has a matching
         * visual. The user feedback called out repeated narration↔screen
         * mismatches in this scene — this view is the fix. */
        {
          id: 's3-banner-in',
          duration: 5500,
          status: 'Free-delivery banner appears',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            highlightPrice: true,
            timerMinutes: 5,
          },
          narration: 'A new banner slides in across the screen.',
          cue: 'ding',
          insight: { label: 'Threshold trap', detail: 'Free-delivery thresholds make you add more to "save" — net result is you spend more.' },
        },
        {
          id: 's3-think-1',
          duration: 5000,
          status: '₹3 from free delivery',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            highlightPrice: true,
            timerMinutes: 5,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wait — my cart is already ₹3,596. I am just ₹3 away from free delivery.' },
          ],
        },
        {
          id: 's3-think-2',
          duration: 5400,
          status: 'Tempted to add one more',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            timerMinutes: 5,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'If I just add one more thing, I will not have to pay for delivery. I am basically saving money.' },
          ],
        },
        {
          id: 's3-fbt-card',
          duration: 5000,
          status: '"Frequently Bought Together" appears',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            freqBought: 'cleaning-kit',
            timerMinutes: 5,
          },
          insight: { label: 'Useful + nudged', detail: 'The most dangerous add-on is the one that is actually useful — that is what kills the doubt.' },
        },
        {
          id: 's3-fbt-bubble1',
          duration: 4800,
          status: 'Eyeing the cleaning kit',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            freqBought: 'cleaning-kit',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'New shoes need cleaning anyway. This is honestly useful.' },
          ],
        },
        {
          id: 's3-fbt-bubble2',
          duration: 4800,
          status: 'Justifying the add-on',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            freqBought: 'cleaning-kit',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Better to buy it now than to come back for it later, right?' },
          ],
        },
        {
          id: 's3-fbt-tap-add',
          duration: 1800,
          status: 'Tapping Add on the cleaning kit',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            freqBought: 'cleaning-kit',
            tapTarget: 'rec-cleaning-kit',
          },
          cue: 'tap',
        },
        {
          id: 's3-unlock',
          duration: 5400,
          status: '🎉 Free delivery unlocked',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            deliveryUnlocked: true,
            floatAdd: 'cleaning-kit',
            toast: 'Shoe Cleaning Kit · ₹399',
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
     * SCENE 4 — REALITY CHECK + TWO REFLECTIONS
     * ============================================================ */
    {
      id: 'scene-4',
      title: 'Reality Check',
      ambience: 'silent',
      emotion: 'unsettled',
      phases: [
        /* Cart-focus stays the dominant view for all of Scene 4 — the
         * student already saw the cart fill up in Scene 3, so the reality-
         * check beats keep that same screen as the camera. Each phase
         * layers in revealTotal / showGap / showPlaceOrder / tap targets
         * so the screen reacts to narration without ever switching back
         * to the feed view. */
        {
          id: 's4-freeze',
          duration: 2800,
          status: 'Pause',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            silent: true,
          },
          cue: 'freeze',
        },
        {
          id: 's4-cart-open',
          duration: 4200,
          status: 'Opening the cart',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
          },
          narration: 'Her cart updates again. The total is bigger than she expected.',
        },
        {
          id: 's4-total-build',
          duration: 5000,
          status: 'Total counting up',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            revealTotal: true,
          },
          cue: 'reveal',
        },
        {
          id: 's4-gap',
          duration: 5600,
          status: '₹1,500 plan → ₹3,995 actual',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            revealTotal: true,
            showGap: true,
          },
          insight: { label: '₹1,500 → ₹3,995', detail: 'Almost 2.7× the original plan. None of it felt like a "big" decision.', type: 'fact' },
          narration: 'What started as "just one thing" became almost three times her original budget.',
        },
        {
          id: 's4-realisation-1',
          duration: 5400,
          status: 'Shanaya reflects',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            revealTotal: true,
            showGap: true,
            showPlaceOrder: true,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This didn’t feel like a bad decision while I was making it.' },
          ],
        },
        {
          id: 's4-realisation-2',
          duration: 6200,
          status: 'Shanaya reflects',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            revealTotal: true,
            showGap: true,
            showPlaceOrder: true,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This didn’t feel like a bad decision while I was making it.' },
            { side: 'right', type: 'thought', text: 'Each step seemed perfectly reasonable. So why does it feel like I went overboard?' },
          ],
        },

        /* ---- SHE GOES THROUGH WITH IT: PLACE ORDER → PAY → CONFIRMATION ---- */
        {
          id: 's4-tap-place-order',
          duration: 2400,
          status: 'Tapping Place Order',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'cart-focus',
            freeDeliveryBanner: true,
            revealTotal: true,
            showGap: true,
            showPlaceOrder: true,
            tapTarget: 'place-order',
          },
          cue: 'tap',
        },
        {
          id: 's4-payment',
          duration: 5500,
          status: 'Choosing payment method',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'payment',
          },
          narration: 'She moves to checkout. ₹200 off with the coupon — final amount to pay is ₹3,795.',
        },
        {
          id: 's4-pay-tap',
          duration: 1800,
          status: 'Tapping Pay',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'payment', tapTarget: 'pay',
          },
          cue: 'tap',
        },
        {
          id: 's4-pay-processing',
          duration: 3000,
          status: 'Processing payment',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'payment', processing: true,
          },
        },
        {
          id: 's4-confirmation',
          duration: 5500,
          status: 'Order placed',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'confirmation',
          },
          cue: 'ding',
          insight: { label: 'Done — she actually paid', detail: 'The trap closes when "I will think about it" becomes "I already bought it". The ₹3,795 is gone.', type: 'fact' },
        },
        /* Beat with the receipt visible on screen — gives the student a
         * moment to see exactly what was bought + what was paid before the
         * reflection prompt steals their attention. */
        {
          id: 's4-order-summary',
          duration: 8500,
          status: 'Reading the receipt',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'order-summary',
          },
          narration: 'Five items. ₹3,795 paid. Almost three times what she planned.',
        },

        /* ---- BRIDGE INTO ACT 2 ----
         * The "sitting with the receipt" thought bubbles. These play
         * BEFORE the reflections so the MCQ's "Move to Act 2" button is the
         * actual last phase — clicking it navigates straight to Act 2 with
         * no extra beat after. */
        {
          id: 's4-bridge',
          duration: 14000,
          status: 'Sitting with the receipt',
          emotion: 'realised',
          phone: {
            cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'],
            view: 'order-summary',
            dim: true,
          },
          bubbles: [
            { side: 'right', type: 'thought', text: "This didn't feel like a bad decision while I was making it — each step seemed perfectly reasonable. So why does it now feel like I've gone overboard? What does this say about my spending habits?" },
            { side: 'right', type: 'thought', text: "Let's figure it out." },
          ],
        },

        /* ---- REFLECTION 1 — FREE TEXT ---- */
        {
          id: 's4-reflect-1',
          hold: true,
          status: 'Your reflection',
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], view: 'cart-focus', freeDeliveryBanner: true, revealTotal: true, showGap: true, dim: true },
          reflection: {
            prompt: 'At which moment do you think Shanaya lost track of her original plan?',
            placeholder: 'One sentence is enough.',
          },
        },

        /* ---- REFLECTION 2 — OPINION MCQ with per-option tips ----
         * Each option has its own takeaway. The component reads `tip` and
         * shows / speaks the selected option's takeaway instead of a single
         * generic explanation. */
        {
          id: 's4-reflect-2',
          hold: true,
          status: 'One more',
          phone: { cart: ['shoes', 'socks', 'smartwatch', 'hoodie', 'cleaning-kit'], view: 'cart-focus', freeDeliveryBanner: true, revealTotal: true, showGap: true, dim: true },
          mcq: {
            kind: 'opinion-multi',
            prompt: 'Which purchase felt MOST justified to you?',
            options: [
              {
                id: 'socks',
                label: '🧦 Branded Socks — "completes the look"',
                correct: null,
                tip: 'The socks felt reasonable because they matched the shoes. When something "completes the look", it can feel more necessary than it really is.',
              },
              {
                id: 'watch',
                label: '⌚ Smartwatch — "everyone is buying it"',
                correct: null,
                tip: 'The smartwatch felt valuable because it was popular and exciting. Sometimes we confuse "everyone wants it" with "I need it".',
              },
              {
                id: 'hoodie',
                label: '👕 Birthday Hoodie — "flash deal"',
                correct: null,
                tip: 'The hoodie connected to emotions and imagination — birthday photos, confidence, looking good. Emotional purchases often feel the most convincing in the moment.',
              },
              {
                id: 'kit',
                label: '🧴 Cleaning Kit — "useful + free delivery"',
                correct: null,
                tip: 'The cleaning kit felt practical and responsible. Impulse buying is not always about fun things — even "useful" items can become unnecessary add-ons.',
              },
            ],
            continueLabel: 'Move to Act 2 →',
          },
        },
      ],
    },
  ];
}

/* ============================================================================
 * Act 2 — Understanding Impulse Buying
 * Three short scenes that decode what just happened in Act 1.
 *   Scene 6 — "What Just Happened?"   ↔ DragMatchBoard
 *   Scene 7 — "Connecting the Dots"   ↔ DefinitionPuzzle
 *   Scene 8 — "Pause & Think"          ↔ FrameworkCard
 * Activities are gated with `hold: true` and an `activity` descriptor that
 * Act2.jsx renders. When the activity fires onComplete it advances the seq.
 * ========================================================================== */

export const act2Activities = {
  match: {
    title: 'Match each cart trigger to the right reason',
    instruction: 'Tap a trigger, then tap the reason that explains it. Correct matches glow green.',
    pairs: [
      {
        id: 'urgency',
        trigger: '"Only a few minutes left!"',
        category: 'FOMO',
        insight: {
          label: 'Fear of Missing Out',
          detail: 'Time pressure replaces thinking. You act fast so you don\'t "lose" the deal — even when you never planned to buy it.',
        },
      },
      {
        id: 'social',
        trigger: '"People also bought this…"',
        category: 'Suggestions & Recommendations',
        insight: {
          label: 'Suggestion bias',
          detail: 'The app makes the choice for you. Borrowing the crowd\'s decision feels easier than making your own.',
        },
      },
      {
        id: 'pairing',
        trigger: '"This would go perfectly with my shoes."',
        category: 'Emotional Justification',
        insight: {
          label: 'Emotional logic',
          detail: 'Feelings dressed up as reasons. "It just goes with…" lets you spend without admitting it was unplanned.',
        },
      },
      {
        id: 'free-delivery',
        trigger: '"You\'re close to free delivery!"',
        category: 'Spending More to "Save"',
        insight: {
          label: 'The save-by-spending trap',
          detail: 'You spend ₹400 extra to "save" ₹40 of delivery. The cost of saving was more than the saving itself.',
        },
      },
    ],
  },
  puzzle: {
    title: 'Build the definition',
    instruction: 'Tap tiles to fill the sentence in order. Two tiles are decoys — leave them out.',
    leadIn: 'Impulse buying is',
    slots: 4,
    tiles: [
      { id: 't1', label: 'buying something',         correctIndex: 0 },
      { id: 't2', label: 'carefully planned',         correctIndex: null },
      { id: 't3', label: 'you didn\'t plan to buy',   correctIndex: 1 },
      { id: 't4', label: 'after comparing everything', correctIndex: null },
      { id: 't5', label: 'because it feels right',    correctIndex: 2 },
      { id: 't6', label: 'in the moment',             correctIndex: 3 },
    ],
    finalLine: 'Impulse buying is buying something you didn\'t plan to buy because it feels right in the moment.',
  },
  framework: {
    title: 'The Pause & Think framework',
    intro: 'Five quick questions to ask before you tap "Buy".',
    bullets: [
      { id: 'plan',     emoji: '📋', label: 'Plan',      question: 'Did I plan to buy this?',                  detail: 'If it wasn\'t on your list five minutes ago, that\'s a sign.' },
      { id: 'need',     emoji: '🎯', label: 'Need',      question: 'Do I need it — or just want it right now?', detail: 'Wants fade in 24 hours. Needs don\'t.' },
      { id: 'budget',   emoji: '₹',  label: 'Budget',    question: 'Is this within the money I set aside?',    detail: 'Numbers don\'t care about feelings.' },
      { id: 'wait',     emoji: '⏳', label: 'Wait',      question: 'Can it wait until tomorrow?',              detail: 'Most "limited" offers come back. Most cravings don\'t.' },
      { id: 'tradeoff', emoji: '⚖️', label: 'Trade-off', question: 'What else could I do with this money?',    detail: 'Every ₹ spent here is a ₹ not spent on something else.' },
    ],
    closer: 'Next, you\'ll face four real-life money choices. Use the framework — see how it feels.',
  },
};

function act2Scenes() {
  return [
    /* ============================================================
     * SCENE 6 — WHAT JUST HAPPENED?
     * ============================================================ */
    {
      id: 'scene-6',
      title: 'What Just Happened?',
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's6-open',
          duration: 9500,
          status: 'Looking back at the cart',
          emotion: 'realised',
          narration: 'Five items. ₹3,795. None of it was on the plan. So what actually made each one slip in?',
        },
        {
          id: 's6-setup',
          duration: 8000,
          status: 'Four triggers from the cart',
          emotion: 'curious',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Each item came with a different reason. Let\'s name them.' },
          ],
        },
        {
          id: 's6-activity',
          hold: true,
          status: 'Matching triggers to reasons',
          emotion: 'curious',
          activity: { kind: 'match', id: 'match-triggers' },
        },
        {
          id: 's6-close',
          duration: 8000,
          status: 'All four named',
          emotion: 'realised',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Same brain, four different tricks. No wonder it felt normal.' },
          ],
        },
      ],
    },

    /* ============================================================
     * SCENE 7 — CONNECTING THE DOTS
     * ============================================================ */
    {
      id: 'scene-7',
      title: 'Connecting the Dots',
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's7-open',
          duration: 8000,
          status: 'Naming what just happened',
          emotion: 'curious',
          narration: 'These tricks have a name. Build the definition — two tiles are decoys, leave them out.',
        },
        {
          id: 's7-activity',
          hold: true,
          status: 'Building the definition',
          emotion: 'curious',
          activity: { kind: 'puzzle', id: 'definition-puzzle' },
        },
        {
          id: 's7-close',
          duration: 8500,
          status: 'Definition unlocked',
          emotion: 'realised',
          bubbles: [
            { side: 'right', type: 'thought', text: 'So that\'s what I did. Five times in one afternoon.' },
          ],
        },
      ],
    },

    /* ============================================================
     * SCENE 8 — PAUSE & THINK FRAMEWORK
     * ============================================================ */
    {
      id: 'scene-8',
      title: 'Pause & Think',
      ambience: 'reflective',
      emotion: 'happy',
      phases: [
        {
          id: 's8-open',
          duration: 8000,
          status: 'Learning the framework',
          emotion: 'curious',
          narration: 'Knowing the trick is half the answer. Here is a five-question pause that beats it.',
        },
        {
          id: 's8-framework',
          hold: true,
          status: 'Five questions to pause',
          emotion: 'happy',
          activity: { kind: 'framework', id: 'pause-and-think' },
        },
        {
          id: 's8-bridge',
          duration: 9500,
          status: 'Ready for the real world',
          emotion: 'excited',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Plan. Need. Budget. Wait. Trade-off. I can remember that.' },
          ],
          narration: 'Next, four real-life money moments. Use the pause — and see how it feels in practice.',
        },
      ],
    },
  ];
}

/* Product catalogue used by the mock shopping app.
 * Each product carries an emoji (fallback) + a real Unsplash photo (free for
 * commercial use, no attribution required). Vite will serve them via the
 * Unsplash CDN — no asset bundling needed. */
const UN = (id) => `https://images.unsplash.com/photo-${id}?w=420&h=420&fit=crop&auto=format&q=70`;

/**
 * Size / variant options. Each product type has different parameters that
 * matter to the buyer — shoes use UK sizing, apparel uses S/M/L, watches use
 * case + connectivity, cleaning kits use pack size.
 */
const SIZE_PRESETS = {
  shoeUK:   { kind: 'shoe-uk',  label: 'Size · UK',         values: ['6', '7', '8', '9', '10'],                                    defaultIndex: 1 },
  apparel:  { kind: 'apparel',  label: 'Size',              values: ['XS', 'S', 'M', 'L', 'XL'],                                   defaultIndex: 2 },
  watch:    { kind: 'watch',    label: 'Model',             values: ['40 mm · GPS', '44 mm · GPS', '44 mm · GPS + Cellular'],      defaultIndex: 1 },
  kit:      { kind: 'kit',      label: 'Pack',              values: ['3-piece basic', '5-piece premium', '7-piece pro'],           defaultIndex: 1 },
};

/* Optional `originalPrice` is shown struck-through next to the real price
 * (e.g. ₹1,999 strike → ₹999). The two hoodie filler variants exist purely
 * so the "Trending Now" row has three hoodies — only the main `hoodie` carries
 * the flash-deal timer + the social-proof beat. */
export const products = {
  shoes:          { id: 'shoes',        emoji: '👟', image: UN('1622760806364-5ccac8096b59'), name: 'White Sneakers',    tagline: 'Trending pick',              price: 1499, rating: 4.5, sizeOptions: SIZE_PRESETS.shoeUK },
  socks:          { id: 'socks',        emoji: '🧦', image: UN('1615486364462-ef6363adbc18'), name: 'Branded Socks',     tagline: 'Goes with sneakers',         price: 299,  rating: 4.3, sizeOptions: SIZE_PRESETS.apparel },
  smartwatch:     { id: 'smartwatch',   emoji: '⌚', image: UN('1546868871-7041f2a55e12'), name: 'Smartwatch X1',     tagline: '12K bought this week',       price: 799,  rating: 4.8, sizeOptions: SIZE_PRESETS.watch },
  hoodie:         { id: 'hoodie',       emoji: '👕', image: UN('1620799140188-3b2a02fd9a77'), name: 'Birthday Hoodie',     tagline: 'Only 2 left',           price: 999,  originalPrice: 1999, rating: 4.6, sizeOptions: SIZE_PRESETS.apparel },
  'hoodie-2':     { id: 'hoodie-2',     emoji: '👕', image: UN('1556821840-3a63f95609a7'),    name: 'Classic Pullover',     tagline: 'Best seller',           price: 1299, rating: 4.4, sizeOptions: SIZE_PRESETS.apparel },
  'hoodie-3':     { id: 'hoodie-3',     emoji: '👕', image: UN('1542406775-ade58c52d2e4'),    name: 'Cosy Hoodie',          tagline: 'New drop',              price: 1599, rating: 4.5, sizeOptions: SIZE_PRESETS.apparel },
  'cleaning-kit': { id: 'cleaning-kit', emoji: '🧴', image: UN('1636262899511-dc5865c774dc'), name: 'Shoe Cleaning Kit', tagline: 'Frequently bought together', price: 399,  rating: 4.2, sizeOptions: SIZE_PRESETS.kit },
};

/* Distinct shoe images for the search-results grid (so they don't all look
 * the same as the main product). All free-for-commercial Unsplash photos. */
/* Distinct shoe images for the results page. 12 cards = enough vertical
 * content for the scroll-hint animation to traverse a real distance — when
 * narration says "she scrolls", students see the grid scroll meaningfully. */
export const SHOE_GRID = [
  { key: 'shoes',          image: UN('1622760806364-5ccac8096b59'), name: 'White Sneakers',     tagline: 'Trending',     price: 1499, rating: 4.5 },
  { key: 'shoe-black',     image: UN('1596565206601-eb1c83627d49'), name: 'Black Runner Pro',   tagline: 'Sporty pick',  price: 1799, rating: 4.4 },
  { key: 'shoe-court',     image: UN('1650320079970-b4ee8f0dae33'), name: 'Court Low',          tagline: 'Best seller',  price: 1299, rating: 4.3 },
  { key: 'shoe-studio',    image: UN('1560769629-975ec94e6a86'),    name: 'Studio Lite',        tagline: 'Limited drop', price: 1999, rating: 4.6 },
  { key: 'shoe-canvas',    image: UN('1689357642277-65228ee23680'), name: 'Canvas Classic',     tagline: 'Everyday',     price: 1099, rating: 4.2 },
  { key: 'shoe-pastel',    image: UN('1542291026-7eec264c27ff'),    name: 'Pastel Glide',       tagline: 'New colour',   price: 1399, rating: 4.4 },
  { key: 'shoe-chunky',    image: UN('1600185365778-d2a4dc6bd1c5'), name: 'Chunky Walker',      tagline: 'Bold pick',    price: 2099, rating: 4.5 },
  { key: 'shoe-runner',    image: UN('1595950653106-6c9ebd614d3a'), name: 'Air Runner',         tagline: 'Cushioned',    price: 1899, rating: 4.6 },
  { key: 'shoe-school',    image: UN('1525966222134-fcfa99b8ae77'), name: 'Daily School',       tagline: 'Comfort',      price: 999,  rating: 4.1 },
  { key: 'shoe-festive',   image: UN('1543163521-1bf539c55dd2'),    name: 'Festive Slip-On',    tagline: 'Stylish',      price: 1599, rating: 4.3 },
  { key: 'shoe-retro',     image: UN('1551107696-a4b0c5a0d9a2'),    name: 'Retro Court',        tagline: 'Throwback',    price: 1699, rating: 4.5 },
  { key: 'shoe-mesh',      image: UN('1608231387042-66d1773070a5'), name: 'Mesh Lite',          tagline: 'Breathable',   price: 1199, rating: 4.2 },
];

export const freeDeliveryThreshold = 3599;
export const intendedBudget = 1500;
