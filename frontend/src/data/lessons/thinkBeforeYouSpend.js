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
    act3: {
      id: 'act3',
      title: 'Act 3 — Real-life Simulation',
      minutes: 4,
      kind: 'scenarios',
      /* scenes are assigned below after act3Scenarios (which act3Scenes
       * needs) is initialised — assigning inline here would hit the
       * `const` temporal dead zone. */
      scenes: [],
    },
    act4: {
      id: 'act4',
      title: 'Act 4 — Reflect & Realise',
      minutes: 3,
      kind: 'impulse-meter',
      /* scenes are assigned below after act4Activities is initialised
       * — same late-bind trick as act3 to dodge the const TDZ. */
      scenes: [],
    },
  },
};
function act1Scenes() {
  /* helper: spread a long phone-state block without retyping */
  const after = (cart, extra = {}) => ({ cart, view: 'feed', ...extra });

  /* Locked-in cart progression — used to flag scene 4 (cart reveal) totals.
   *   Sneakers ₹1499 + Socks ₹299 + Hoodie ₹799 + Selfie Light ₹199 + Free Case
   *   = ₹2,796 actual paid. Phone case carries originalPrice ₹599 so the
   *   "You Saved ₹1,400" banner adds up: 200 (hoodie 20% off) + 599 (free case)
   *   + 601 (rounded "smart-saver" marketing pad) = ₹1,400.  */
  const FULL_CART = ['shoes', 'socks', 'hoodie', 'selfie-light', 'phone-case'];

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
      title: "Shanaya's Birthday",
      ambience: 'cosy',
      emotion: 'happy',
      phases: [
        {
          id: 's0-intro',
          duration: 3000,
          status: 'Meet Shanaya',
          emotion: 'happy',
          // Spelling out "thirteen" so the hi-IN Swara/Madhur voices read
          // the age cleanly in English instead of dropping into Hindi number
          // prosody on a bare "13".
          narration: 'Shanaya is thirteen, super social, and always excited about making memories with her friends.',
          phone: { view: 'feed' },
          vignette: 'meet-shanaya',
        },
        {
          id: 's0-birthday',
          duration: 6000,
          status: 'Birthday is two days away',
          emotion: 'excited',
          narration: 'Her birthday is just two days away — her group is planning to celebrate at a cute café nearby.',
          phone: { view: 'feed' },
          vignette: 'birthday',
        },
        {
          /* The narrator's beat above is the heaviest line in the act;
           * giving Shanaya a personal thought here grounds it in HER voice
           * (and gives the right column something to read while the cafe
           * imagery floats in). */
          id: 's0-group-chat',
          duration: 4000,
          status: 'Group chat is going wild',
          emotion: 'tempted',
          /* hideBubbles: true keeps the lines flowing through TTS (the
           * bubbles array drives the speech queue) but hides the visual
           * ThoughtBubble component below the vignette — the SpeechLabel
           * overlays inside the GroupChat vignette handle the visual. */
          hideBubbles: true,
          bubbles: [
            { side: 'right', type: 'thought', text: 'Birthday fit check!' },
            { side: 'right', type: 'thought', text: 'We need pics!' },
            { side: 'right', type: 'thought', text: 'Dress extra cool!' },
          ],
          phone: { view: 'feed' },
          vignette: 'group-chat',
        },
        {
          id: 's0-vision',
          duration: 8000,
          status: 'Imagining the day',
          emotion: 'happy',
          bubbles: [
            { side: 'right', type: 'thought', text: 'I already know the vibe — confident outfit, great photos, perfect day.' },
          ],
          narration: 'Shanaya already knows the kind of birthday she wants — fun photos, matching vibes, good food, and an outfit that makes her feel confident.',
          phone: { view: 'feed' },
          vignette: 'vision',
        },
        {
          id: 's0-app-open',
          duration: 7500,
          status: 'Reaching for the shopping app',
          emotion: 'curious',
          narration: 'Shanaya is scrolling through a shopping app, planning to quickly buy one new pair of shoes to complete her birthday look and log off.',
          phone: { view: 'feed' },
          vignette: 'app-open',
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
          duration: 6000,
          status: 'Browsing on the app',
          narration: 'It is a quiet afternoon. Shanaya is in her room. She has a clear plan.',
          phone: { view: 'feed' },
          /* Re-use the meet-shanaya vignette so phase 6's right column
           * isn't empty — the same bedroom + Shanaya + friends imagery
           * matches the "she is in her room" narration. */
          vignette: 'meet-shanaya',
        },
        /* Combined intent beat — both lines now live inside a SINGLE
         * bubble (per user request) so they read as one continuous
         * thought instead of two staggered bubbles. +3s on duration to
         * accommodate the longer single line. */
        {
          id: 's1-intent',
          duration: 14000,
          status: 'Planning the budget',
          bubbles: [
            { side: 'right', type: 'thought', text: 'I just need one good pair of shoes for my birthday. I will stay within ₹1,500 and that is it. No extra spending this time.' },
          ],
          phone: { view: 'feed' },
        },
        /* Scene 8 expanded into three connected beats so the learner
         * actually sees: phone home → tap Spree → app opens + types
         * "shoes" → results grid appears → she scrolls through → she
         * spots the white pair. Replaces the previous single combined
         * phase that just showed the Spree home with trending tiles. */
        {
          id: 's1-search',
          duration: 6500,
          status: 'Opening Spree and searching',
          narration: 'Shanaya opens the shopping app and types one word.',
          phone: { view: 'phone-home', search: 'shoes' },
          cue: 'click',
        },
        {
          id: 's1-results',
          duration: 7000,
          status: 'Browsing results',
          narration: 'A grid of shoes appears. She scrolls — there are dozens.',
          phone: { search: 'shoes', view: 'results', scrollHint: true },
        },
        {
          id: 's1-results-scan',
          duration: 7000,
          status: 'Spotting the white sneakers',
          phone: { search: 'shoes', view: 'results', hover: 'shoes', scrollToTop: true },
          bubbles: [
            { side: 'right', type: 'thought', text: 'White sneakers. ₹1,499 — that is on budget.' },
          ],
        },
        /* PDP "read details" beat — stays scrolled at the top of the
         * product detail page so the hero image, title and price are in
         * frame while she reacts. The scroll-down to the Add-to-Cart
         * button is handled by the next phase (s1-add-prompt). */
        {
          id: 's1-shoes-pdp',
          duration: 4000,
          status: 'Reading the product details',
          phone: {
            search: 'shoes',
            view: 'detail',
            showProduct: 'shoes',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'They’d look so good in pictures.' },
          ],
        },
        /* ---- INTERACTIVE: learner taps "Add to Cart" for the shoes.
         *      scrollHint: true matches the previous phase so the page
         *      stays scrolled to the Add-to-Cart button instead of
         *      snapping back to the top when this phase activates. ---- */
        {
          id: 's1-add-prompt',
          hold: true,
          status: 'Your turn',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes', tapTarget: 'primary-cta', scrollHint: true },
          prompt: {
            kind: 'add-to-cart',
            label: 'Help Shanaya shop',
            cta: 'Add to Cart',
            productId: 'shoes',
          },
        },
      ],
    },

    /* ============================================================
     * SCENE 2 — THE SUGGESTIONS BEGIN
     * Three waves of nudges, each one ending in an interactive
     * [ADD TO CART] tap from the learner. New script (May 2026):
     *   Wave 1 — "Complete the Look" cross-sell → Branded Socks
     *   Wave 2 — Flash Deal urgency → Birthday Hoodie 20% OFF
     *   Wave 3 — Bundling unlock → Selfie Glow Clip Light + FREE Phone Case
     * ============================================================ */
    {
      id: 'scene-2',
      title: 'The Suggestions Begin',
      ambience: 'app-tempo',
      emotion: 'curious',
      phases: [
        /* Scene 13 split into two beats so the suggestion feels earned:
         *   13a — Shanaya scrolls the home feed (no banner / socks yet).
         *   13b — Complete-the-Look banner + socks rec card slide in,
         *         tap pulse on the socks card, auto-advance to PDP. */
        {
          id: 's2-scroll',
          duration: 4000,
          status: 'Scrolling more on the home page',
          narration: 'After adding the sneakers, Shanaya keeps scrolling.',
          phone: after(['shoes'], { scrollHint: true }),
        },
        {
          id: 's2-intro',
          duration: 8500,
          status: '"Complete the Look" → tap the socks',
          narration: 'These socks perfectly match with the shoes — and she proceeds to buy.',
          phone: after(['shoes'], {
            recommendations: ['socks'],
            rowLabel: 'Complete the Look',
            pairNudge: { title: 'Complete the Look', subtitle: 'Pair your shoes with these matching socks' },
            highlight: 'socks',
            scrollTo: 'recommendations',
            tapTarget: 'rec-socks',
          }),
          cue: 'ding',
        },
        {
          id: 's2-w1-bubble2',
          duration: 6500,
          status: 'Justifying the add-on',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Hmm… socks would actually go well with the shoes.' },
            { side: 'right', type: 'thought', text: 'It’s not really extra… it completes the look.' },
          ],
        },
        {
          id: 's2-w1-scroll',
          duration: 2000,
          status: 'Scrolling to Add to Cart',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks', scrollHint: true },
        },
        /* ---- INTERACTIVE: learner taps Add to Cart for the socks ---- */
        {
          id: 's2-w1-add-prompt',
          hold: true,
          status: 'Your turn',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks', tapTarget: 'primary-cta', scrollHint: true },
          prompt: {
            kind: 'add-to-cart',
            label: 'Help Shanaya shop',
            cta: 'Add to Cart',
            productId: 'socks',
          },
        },
        {
          id: 's2-w1-add',
          duration: 3500,
          status: 'Socks added',
          phone: after(['shoes', 'socks'], { recommendations: ['socks'], rowLabel: 'Complete the Look', floatAdd: 'socks', toast: 'Branded Socks · ₹299' }),
          cue: 'add',
          addedItem: { id: 'socks', trigger: 'cross-sell' },
        },

        /* --- WAVE 2 — Urgency Flash Deal: Birthday Hoodie 20% OFF --- */
        /* Brief "she scrolls a little more" beat before the flash deal
         * lands, so the urgency banner feels like it surfaces organically
         * during browsing instead of as a hard cut. Matches the same
         * scroll-then-suggestion rhythm used after the hoodie. */
        {
          id: 's2-post-socks-browse',
          duration: 4500,
          status: 'Tapping Trending',
          narration: 'Shanaya taps on Trending up top.',
          phone: after(['shoes', 'socks'], {
            scrollToTop: true,
            tapTarget: 'cat-trending',
          }),
          cue: 'tap',
        },
        {
          /* Trending page opens — a varied mix of products on the feed
           * (hoodie with flash-deal timer, smartwatch, hoodie variants,
           * cleaning kit), not just three hoodies. The flash deal alert
           * pulses at the top of the screen. */
          id: 's2-w2-flash',
          duration: 4500,
          status: 'Trending page · Flash Deal alert',
          phone: after(['shoes', 'socks'], {
            recommendations: ['hoodie', 'iphone-17', 'smartwatch', 'hoodie-2', 'hoodie-3'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            flashAlert: { label: 'Flash Deal — Ends Soon!', product: 'Birthday Hoodie · ₹999 → ₹799', mins: 5},
            scrollTo: 'recommendations',
          }),
          cue: 'alert',
        },
        {
          id: 's2-w2-tap-rec',
          duration: 2200,
          status: 'Tapping the hoodie',
          phone: after(['shoes', 'socks'], {
            recommendations: ['hoodie', 'iphone-17', 'smartwatch', 'hoodie-2', 'hoodie-3'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            flashAlert: { label: 'Flash Deal — Ends Soon!', product: 'Birthday Hoodie · ₹999 → ₹799', mins: 5},
            tapTarget: 'rec-hoodie',
          }),
          cue: 'tap',
        },
        {
          id: 's2-w2-bubble3',
          duration: 7000,
          status: 'Justifying the add-on',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This hoodie is so trendy and that’s a great discount.' },
            { side: 'right', type: 'thought', text: 'I didn’t plan this… but it kind of fits the whole vibe.' },
          ],
        },
        {
          id: 's2-w2-scroll',
          duration: 2000,
          status: 'Scrolling to Add to Cart',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5, scrollHint: true },
        },
        /* ---- INTERACTIVE: learner taps Add to Cart for the hoodie ---- */
        {
          id: 's2-w2-add-prompt',
          hold: true,
          status: 'Your turn',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 5, tapTarget: 'primary-cta', scrollHint: true },
          prompt: {
            kind: 'add-to-cart',
            label: 'Help Shanaya shop',
            cta: 'Add to Cart',
            productId: 'hoodie',
          },
        },
        {
          id: 's2-w2-add',
          duration: 3800,
          status: 'Hoodie added',
          phone: after(['shoes', 'socks', 'hoodie'], {
            recommendations: ['hoodie'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            floatAdd: 'hoodie',
            toast: 'Birthday Hoodie · ₹799',
          }),
          cue: 'add',
          addedItem: { id: 'hoodie', trigger: 'urgency' },
        },

        /* --- WAVE 3 — Bundling unlock: Add 1 more → Free Phone Case
         *     Recommended add-on: Selfie Glow Clip Light (₹199, viral on reels) */
        /* Brief "she scrolls more + the NEW OFFER UNLOCKED banner slides
         * in" beat. The banner is now visible mid-scroll instead of
         * waiting for the next phase, so the learner sees it surface
         * organically while Shanaya is still browsing. */
        {
          id: 's2-post-hoodie-browse',
          duration: 5500,
          status: 'Scrolling — New Offer Unlocked',
          narration: 'Shanaya scrolls a little more — and a new offer slides in.',
          phone: after(['shoes', 'socks', 'hoodie'], {
            scrollHint: true,
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
          }),
          cue: 'alert',
        },
        {
          id: 's2-w3-bubble2',
          duration: 6500,
          status: 'Connecting the dots',
          phone: after(['shoes', 'socks', 'hoodie'], {
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
          }),
          bubbles: [
            { side: 'right', type: 'thought', text: 'Ohh wait… I was anyway going to buy the phone case — mine looks old.' },
            { side: 'right', type: 'thought', text: 'And it’s FREE if I add one more thing? Okay let me just see what counts.' },
          ],
        },
        /* Bridge beats — she scrolls more on the feed, then taps the
         * Electronics category at the top so the next page lands on a
         * shelf of electronics-y items (Selfie Light hightlighted). */
        {
          id: 's2-w3-browse',
          duration: 4000,
          status: 'Scrolling a little more',
          narration: 'Shanaya scrolls a little more.',
          phone: after(['shoes', 'socks', 'hoodie'], {
            scrollHint: true,
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
          }),
        },
        {
          id: 's2-w3-tap-electronics',
          duration: 4000,
          status: 'Tapping Electronics',
          narration: 'And taps on Electronics.',
          phone: after(['shoes', 'socks', 'hoodie'], {
            scrollToTop: true,
            tapTarget: 'cat-electronics',
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
          }),
          cue: 'tap',
        },
        {
          /* Electronics page opens — a shelf of multiple products. The
           * Selfie Glow Clip Light carries the saffron highlight ring +
           * "🔥 Viral on reels / 9K bought" badges so the eye lands on
           * it even with several other tiles in the row. */
          id: 's2-w3-rec',
          duration: 6000,
          status: 'Electronics · Selfie Light highlighted',
          phone: after(['shoes', 'socks', 'hoodie'], {
            recommendations: ['selfie-light', 'iphone-17', 'smartwatch', 'phone-case'],
            rowLabel: 'Top in Electronics',
            viralBadge: 'selfie-light',
            highlight: 'selfie-light',
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
            scrollTo: 'recommendations',
          }),
        },
        {
          id: 's2-w3-tap-rec',
          duration: 2200,
          status: 'Tapping the Selfie Light',
          phone: after(['shoes', 'socks', 'hoodie'], {
            recommendations: ['selfie-light', 'iphone-17', 'smartwatch', 'phone-case'],
            rowLabel: 'Top in Electronics',
            viralBadge: 'selfie-light',
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
            tapTarget: 'rec-selfie-light',
          }),
          cue: 'tap',
        },
        {
          id: 's2-w3-bubble4',
          duration: 7000,
          status: '"Such a smart deal"',
          phone: { cart: ['shoes', 'socks', 'hoodie'], view: 'detail', showProduct: 'selfie-light', viralBadge: 'selfie-light' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wow! This would make my birthday pictures look so much better.' },
            { side: 'right', type: 'thought', text: 'That’s actually such a smart deal.' },
          ],
        },
        {
          id: 's2-w3-scroll',
          duration: 2000,
          status: 'Scrolling to Add to Cart',
          phone: { cart: ['shoes', 'socks', 'hoodie'], view: 'detail', showProduct: 'selfie-light', viralBadge: 'selfie-light', scrollHint: true },
        },
        /* ---- INTERACTIVE: learner taps Add to Cart — selfie light +
         *     free phone case land in the cart together. ---- */
        {
          id: 's2-w3-add-prompt',
          hold: true,
          status: 'Your turn',
          phone: { cart: ['shoes', 'socks', 'hoodie'], view: 'detail', showProduct: 'selfie-light', viralBadge: 'selfie-light', tapTarget: 'primary-cta', scrollHint: true },
          prompt: {
            kind: 'add-to-cart',
            label: 'Help Shanaya shop',
            cta: 'Add to Cart',
            productId: 'selfie-light',
          },
        },
        {
          id: 's2-w3-add',
          duration: 4200,
          status: 'Selfie Light added · Phone Case FREE',
          phone: after(['shoes', 'socks', 'hoodie', 'selfie-light', 'phone-case'], {
            recommendations: ['selfie-light'],
            rowLabel: 'Recommended Add-On',
            floatAdd: 'selfie-light',
            toast: 'Selfie Light · ₹199  +  Phone Case FREE 🎀',
            freebieAdded: 'phone-case',
          }),
          cue: 'add',
          addedItem: { id: 'selfie-light', trigger: 'bundling' },
        },
      ],
    },

    /* ============================================================
     * SCENE 3 — FINAL CART REVEAL & REFLECTION
     * The music slows dramatically. The cart updates with the full 5
     * items (4 paid + 1 free phone case). "You Saved ₹1,400!" banner
     * sparkles in. Original Budget ₹1,500 reappears as a quiet contrast.
     * The phone slowly zooms into Shanaya's face. She realises what
     * just happened. Then we hand control to the learner for the single
     * free-text reflection that ends Act 1.
     * ============================================================ */
    {
      id: 'scene-3',
      title: 'Final Cart Reveal',
      ambience: 'reflective',
      emotion: 'unsettled',
      phases: [
        {
          /* Music slows dramatically (the script is explicit: nothing is
           * spoken here). The cart-reveal view shows the full breakdown
           * with the 5 items + total + savings banner. */
          id: 's3-cart-reveal',
          duration: 4500,
          status: 'Cart updated',
          // Override the scene-level 'unsettled' emotion — at this beat
          // Shanaya is just looking at her cart, not realising anything
          // yet, so a normal/calm face reads better than the sad-concerned
          // brows the unsettled emotion inherits.
          emotion: 'neutral',
          narration: 'Shanaya is now proceeding to checkout.',
          phone: {
            cart: FULL_CART,
            view: 'cart-reveal',
            revealItems: true,
          },
          cue: 'freeze',
        },
        /* ---- CHECKOUT → PAYMENT → SUCCESS → REGRET  ----
         * Per the refreshed script, Shanaya proceeds straight from the
         * cart reveal into checkout without the in-cart "wait…" pause.
         * The phone walks through cart view → place-order tap → payment
         * screen → pay tap → processing → confirmation. ONLY AFTER the
         * order lands does the realisation hit — the regret bubble
         * (s3-final-thought-2) now lives after s3-success so the
         * student sees ₹2,796 actually paid before Shanaya wakes up. */
        {
          id: 's3-checkout-tap',
          duration: 4000,
          status: 'Tapping Place Order',
          // Override scene-level 'unsettled' — Shanaya is just going
          // through checkout motions here, not having a realisation
          // moment yet. Neutral face per QA: "make her normal not tense".
          emotion: 'neutral',
          phone: {
            cart: FULL_CART,
            view: 'cart-focus',
            freeDeliveryBanner: false,
            revealTotal: true,
            showPlaceOrder: true,
            tapTarget: 'place-order',
          },
          cue: 'tap',
        },
        {
          id: 's3-payment',
          duration: 5000,
          status: 'Choosing payment method',
          emotion: 'neutral',
          phone: {
            cart: FULL_CART,
            view: 'payment',
          },
          narration: 'She moves to checkout — ₹2,796 to pay.',
        },
        {
          id: 's3-payment-tap',
          duration: 3500,
          status: 'Tapping Pay',
          emotion: 'neutral',
          phone: {
            cart: FULL_CART,
            view: 'payment',
            tapTarget: 'pay',
          },
          cue: 'tap',
        },
        {
          id: 's3-payment-processing',
          duration: 3500,
          status: 'Processing payment',
          emotion: 'neutral',
          phone: {
            cart: FULL_CART,
            view: 'payment',
            processing: true,
          },
        },
        {
          id: 's3-success',
          duration: 5500,
          status: 'Order placed',
          // Neutral face on the confirmation screen — the realisation
          // doesn't hit until s3-final-thought-2 right after this.
          emotion: 'neutral',
          phone: {
            cart: FULL_CART,
            view: 'confirmation',
          },
          cue: 'ding',
          narration: 'Done. ₹2,796 gone — almost twice what she planned.',
        },
        /* The regret hits AFTER the order goes through, not before.
         * Two thought bubbles: a short "Wait…" pause, then the full
         * "I only came here to buy shoes…" realisation. */
        {
          id: 's3-final-thought-2',
          duration: 9500,
          status: 'Shanaya catches herself',
          emotion: 'realised',
          phone: {
            cart: FULL_CART,
            view: 'confirmation',
          },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wait…' },
            { side: 'right', type: 'thought', text: 'I only came here to buy shoes. How did I end up spending so much?!' },
          ],
        },

        /* ---- REFLECTION — the single free-text question that ends Act 1 ---- */
        {
          id: 's3-reflect',
          hold: true,
          status: 'Your reflection',
          phone: {
            cart: FULL_CART,
            view: 'cart-reveal',
            revealItems: true,
            revealTotal: true,
            revealSavings: 1400,
            revealBudget: true,
            showGap: true,
            dim: true,
          },
          reflection: {
            prompt: 'At which moment do you think Shanaya lost track of her original plan?',
            placeholder: 'One sentence is enough.',
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
  /* GAME: Rebuild Shanaya's Thought Spiral. The learner drags 12
   * floating thought bubbles into 4 colour-coded Mind Trap Zones.
   * Each zone takes exactly 3 thoughts. */
  mindTrap: {
    title: "Rebuild Shanaya's Thought Spiral",
    instruction: 'Drag each thought into the zone you think influenced Shanaya the most.',
    hint: '⚠️ Some thoughts feel tricky — choose the strongest match.',
    zones: [
      { id: 'fomo',        emoji: '⚡', label: 'Fear of Missing Out',           shortLabel: 'FOMO',           accent: 'from-coral-500 to-burgundy-500', ring: 'ring-coral-500',   tone: 'text-coral-600',   bg: 'bg-coral-500/10'  },
      { id: 'suggestions', emoji: '✨', label: 'Suggestions & Recommendations', shortLabel: 'Suggestions',    accent: 'from-saffron-500 to-coral-400',  ring: 'ring-saffron-500', tone: 'text-saffron-600', bg: 'bg-saffron-500/10'},
      { id: 'emotional',   emoji: '💖', label: 'Emotional Justification',       shortLabel: 'Emotional',      accent: 'from-pink-400 to-fuchsia-500',   ring: 'ring-pink-500',    tone: 'text-pink-600',    bg: 'bg-pink-500/10'   },
      { id: 'save',        emoji: '💸', label: 'Spending More to "Save"',       shortLabel: 'Save-spend',     accent: 'from-teal-500 to-emerald-600',   ring: 'ring-teal-500',    tone: 'text-teal-600',    bg: 'bg-teal-500/10'   },
    ],
    thoughts: [
      { id: 'fomo-1', text: 'What if the sale disappears later?',                     zone: 'fomo' },
      { id: 'fomo-2', text: "I should grab this before it's gone.",                    zone: 'fomo' },
      { id: 'fomo-3', text: "Everyone's buying this right now.",                       zone: 'fomo' },
      { id: 'sug-1',  text: 'This popped up right after I bought the shoes.',         zone: 'suggestions' },
      { id: 'sug-2',  text: 'The app says it matches my birthday vibe.',              zone: 'suggestions' },
      { id: 'sug-3',  text: 'People who bought sneakers also bought this.',           zone: 'suggestions' },
      { id: 'emo-1',  text: 'This would make my birthday pictures look so much better.', zone: 'emotional' },
      { id: 'emo-2',  text: "It'll make the day feel more special.",                   zone: 'emotional' },
      { id: 'emo-3',  text: 'I deserve something fun for my birthday.',               zone: 'emotional' },
      { id: 'sav-1',  text: 'If I buy this, I get the phone case free.',              zone: 'save' },
      { id: 'sav-2',  text: "I'm basically saving money.",                             zone: 'save' },
      { id: 'sav-3',  text: 'The discount is too good to miss.',                      zone: 'save' },
    ],
  },

  /* 3 click-through flash cards that explain how impulse buying works. */
  flashCards: {
    title: 'How impulse buying works',
    intro: 'Click through the cards to learn the patterns.',
    cards: [
      {
        id: 'fomo',
        emoji: '⚡',
        title: 'FOMO',
        subtitle: 'Fear of Missing Out',
        visual: 'countdown',
        body: 'People may rush to buy something because they are worried the deal or opportunity will disappear later.',
      },
      {
        id: 'triggers',
        emoji: '✨',
        title: 'Shopping triggers',
        subtitle: 'Designed to keep you spending',
        visual: 'triggers',
        body: 'Shopping apps use recommendations, flash sales, and rewards to keep people interested and encourage more spending. These triggers can slowly influence what people notice, want, and buy.',
      },
      {
        id: 'small-spends',
        emoji: '💸',
        title: 'Small spends add up',
        subtitle: 'Little buys, big total',
        visual: 'addition',
        body: 'Impulse buying is often made up of many small purchases that seem harmless in the moment. Even small amounts can quickly add up when people keep spending without noticing.',
      },
    ],
    closer: 'You now know the tricks. Knowing them is the first step to pausing before you tap "Buy".',
  },
};

/* =========================================================================
 * ACT 4 ACTIVITIES — Reflect & Realise
 *
 * Two short interactions stitched into one ~3-minute reflective close:
 *   1. ImpulseMeter — student places themselves on a 5-zone slider
 *      ("I go with the moment" → "I pause and choose"). No right
 *      answer — the act is a self-snapshot, not a quiz.
 *   2. KeyTakeawaysGrid — 5 tap-to-reveal cards distilling the
 *      lesson into a portable rule set. After all 5 are revealed the
 *      identity statement "I can pause and choose before I spend"
 *      lands as the final beat.
 * ======================================================================== */
export const act4Activities = {
  meter: {
    title: 'Place yourself on the Impulse Meter',
    instruction: 'Where do you usually land right before you tap "Buy"? No right answer — just an honest snapshot.',
    zones: [
      {
        id: 'go',
        emoji: '🎢',
        icon: 'Zap',              // complementary lucide icon — fast/charged
        label: 'I go with the moment',
        short: 'Go with the moment',
        gradient: 'from-rose-500 to-red-600',
        ring:     'ring-rose-500',
        accent:   'text-rose-600',
        bg:       'bg-rose-500/10',
        vibe:     'Spontaneous · You move fast and feel later. The pause is a muscle you can build.',
      },
      {
        id: 'react',
        emoji: '😬',
        icon: 'Flame',
        label: 'I react quickly',
        short: 'React quickly',
        gradient: 'from-orange-500 to-rose-500',
        ring:     'ring-orange-500',
        accent:   'text-orange-600',
        bg:       'bg-orange-500/10',
        vibe:     'Reactive · You sometimes wish you had waited. Awareness already started.',
      },
      {
        id: 'think',
        emoji: '🤔',
        icon: 'Lightbulb',
        label: 'I think sometimes',
        short: 'Think sometimes',
        gradient: 'from-amber-400 to-orange-500',
        ring:     'ring-amber-500',
        accent:   'text-amber-600',
        bg:       'bg-amber-500/10',
        vibe:     'In-between · You catch yourself half the time. That\'s progress, not a problem.',
      },
      {
        id: 'careful',
        emoji: '👍',
        icon: 'Shield',
        label: 'I try to be careful',
        short: 'Try to be careful',
        gradient: 'from-lime-400 to-emerald-500',
        ring:     'ring-emerald-500',
        accent:   'text-emerald-600',
        bg:       'bg-emerald-500/10',
        vibe:     'Mindful · You ask before you tap. The next step is keeping it consistent.',
      },
      {
        id: 'pause',
        emoji: '🎯',
        icon: 'Target',
        label: 'I pause and choose',
        short: 'Pause and choose',
        gradient: 'from-teal-400 to-cyan-600',
        ring:     'ring-teal-500',
        accent:   'text-teal-600',
        bg:       'bg-teal-500/10',
        vibe:     'Intentional · You decide on purpose. The work now is keeping the muscle warm.',
      },
    ],
    affirmation: 'And that\'s okay. The point isn\'t to be at one end — it\'s to know where you are. Awareness is what changes the next tap.',
  },
  takeaways: {
    title: 'Five rules · take them with you',
    instruction: 'Tap each card to unlock — one at a time. They build on each other.',
    /* Each card carries its own visual identity: a lucide icon name
     * (resolved in the component), a colour family for the gradient
     * card background + dimmed accent ring, and the rule itself. */
    cards: [
      {
        id: 'pause',
        icon: 'Pause',
        title: 'Pause before you decide',
        body: 'Quick decisions often lead to extra spending.',
        gradient: 'from-sky-500 to-blue-700',
        accent:   'text-sky-600',
        ring:     'ring-sky-500',
        bg:       'bg-sky-500/10',
      },
      {
        id: 'small-spends',
        icon: 'Coins',
        title: 'Think beyond "small amounts"',
        body: 'Small spends can quietly add up.',
        gradient: 'from-amber-400 to-orange-600',
        accent:   'text-amber-600',
        ring:     'ring-amber-500',
        bg:       'bg-amber-500/10',
      },
      {
        id: 'triggers',
        icon: 'AlertTriangle',
        title: 'Notice the triggers',
        body: 'Offers, timers, and excitement influence choices.',
        gradient: 'from-rose-500 to-red-600',
        accent:   'text-rose-600',
        ring:     'ring-rose-500',
        bg:       'bg-rose-500/10',
      },
      {
        id: 'time',
        icon: 'Clock',
        title: 'Give yourself time',
        body: 'Pausing helps you think clearly.',
        gradient: 'from-emerald-400 to-teal-600',
        accent:   'text-emerald-600',
        ring:     'ring-emerald-500',
        bg:       'bg-emerald-500/10',
      },
      {
        id: 'purpose',
        icon: 'Target',
        title: 'Choose with purpose',
        body: 'Decide based on what you need, not the situation.',
        gradient: 'from-purple-500 to-fuchsia-600',
        accent:   'text-purple-600',
        ring:     'ring-purple-500',
        bg:       'bg-purple-500/10',
      },
    ],
    /* Identity statement shown once all five rules unlocked. */
    identity: 'I can pause and choose before I spend.',
  },
};

/* Scene assembly for Act 4 — one continuous reflective scene. */
function act4Scenes() {
  return [{
    id: 'scene-act4',
    title: 'Reflect & Realise',
    ambience: 'reflective',
    emotion: 'realised',
    phases: [
      {
        id: 's9-meter-intro',
        duration: 9500,
        status: 'A moment of reflection',
        emotion: 'realised',
        // Two-line recap of Acts 1-3 → pivot inward to the meter.
        narration: "You watched Shanaya overspend, named the four mind traps behind her cart, and spotted the influencer pull. Same brain, same traps — they show up in your day too.",
      },
      {
        id: 's9-meter',
        hold: true,
        status: 'Your honest snapshot',
        emotion: 'curious',
        activity: { kind: 'impulse-meter', id: 'meter' },
      },
      {
        id: 's9-takeaways-intro',
        duration: 10500,
        status: 'The flow of awareness',
        emotion: 'realised',
        narration: 'Understanding impulse buying helps us notice when emotions, pressure, or quick excitement are influencing our decisions — so we can make more thoughtful choices.',
      },
      {
        /* LAST phase. The KeyTakeawaysGrid's own "Finish Act 4" button
         * fires onComplete → handleActivityComplete → advanceOrFinish,
         * which (since this is now the last phase) opens the
         * end-of-act celebration. From there the learner clicks
         * "Back to home →" to exit. The identity statement still
         * lands on this scene — it's the big animated card that
         * slides in inside the takeaways activity once all 5 cards
         * are revealed, so we don't need an extra narrator-only
         * phase to repeat it. */
        id: 's9-takeaways',
        hold: true,
        status: 'Five takeaways',
        emotion: 'curious',
        activity: { kind: 'takeaways-grid', id: 'takeaways' },
      },
    ],
  }];
}

/* =========================================================================
 * ACT 3 ACTIVITIES
 *
 * Four 2-minute "real-life simulations" — each a different impulse context
 * with a multi-select challenge, retry feedback, and a Mindful-Choice unlock.
 * Each scenario carries its own ContextStage (the visual + audio context
 * Shanaya is in) and a challenge block (prompt + 5 options + correct ids).
 * ======================================================================== */
export const act3Scenarios = {
  /* SCENARIO 1 — The "Better Deal" Confusion (online shopping + influencer) */
  s1: {
    id: 'better-deal',
    number: 1,
    title: 'The "Better Deal" Confusion',
    contextTag: 'Online shopping · Influencer reel',
    badge: 'Mindful Choice',
    stageKind: 'reel-and-products',
    reel: {
      handle: '@trendingvibes',
      caption: 'These boAt earphones >>> everyone needs these 🎧✨',
      lines: [
        'These new boAt earphones are literally AMAZING.',
        'The sound quality is insane.',
        'And they make every outfit look aesthetic.',
      ],
      comments: [
        { who: 'aanya._', text: '🔥 Need these NOW' },
        { who: 'krishstyle', text: '😍 Ordered already' },
        { who: 'noor.x', text: '🎧 boAt >>>' },
        { who: 'meher.k', text: '✨ Vibe check passed' },
        { who: 'rhea_', text: '🛒 link in bio?' },
      ],
      likes: '47.2K',
      /* Primary source — YouTube Short embedded via the official iframe
       * player. ReelPlayer renders this as an <iframe> with autoplay,
       * mute, loop, and the player chrome stripped (controls=0,
       * modestbranding=1). pointer-events on the iframe are disabled so
       * the YouTube watermark click doesn't fight with our reel chrome.
       *   Source: https://www.youtube.com/shorts/AVx_e-yDy90  */
      youtubeId: 'AVx_e-yDy90',
      /* Secondary fallback chain — direct MP4s. If the YouTube embed
       * is blocked (e.g. corporate firewall), ReelPlayer tries each of
       * these in order, then finally drops to the animated CSS sim.
       *
       * To swap in your own clip, drop an MP4 into /public/videos/ and
       * make the first entry  '/videos/your-file.mp4'  */
      videoUrls: [
        // Mixkit — vertical fashion/lifestyle, free for any use.
        'https://assets.mixkit.co/videos/preview/mixkit-young-woman-listening-to-music-on-headphones-43020-large.mp4',
        // Pexels — vertical lifestyle clip, free hotlinking.
        'https://videos.pexels.com/video-files/8035975/8035975-uhd_1440_2560_30fps.mp4',
        // Pexels — backup vertical fashion shoot.
        'https://videos.pexels.com/video-files/4434242/4434242-hd_1080_1920_30fps.mp4',
        // Pexels — alternative aesthetic vertical.
        'https://videos.pexels.com/video-files/3209828/3209828-hd_1080_1920_25fps.mp4',
      ],
      /* Looping lo-fi track that plays only while the reel scene is on
       * screen — gives the reel its own audio identity, distinct from
       * the act's lo-fi background music. Volume is heavily ducked so
       * it sits under the narration without competing. Pixabay free
       * CDN; falls back silently if the URL fails. */
      audioUrl: 'https://cdn.pixabay.com/audio/2022/10/30/audio_347111d654.mp3',
    },
    products: [
      {
        id: 'generic',
        emoji: '🎧',
        name: 'Generic Earphones',
        price: 700,
        tagline: 'Works fine, basic look',
        accent: 'from-ink-300 to-ink-500',
        badge: null,
      },
      {
        id: 'boat',
        emoji: '🎧',
        name: 'boAt Earphones',
        price: 2000,
        tagline: 'Featured in the reel',
        accent: 'from-coral-500 to-burgundy-500',
        badges: ['🔥 Trending', '🎧 Influencer Pick'],
      },
    ],
    narration: "Shanaya only wanted earphones for music and videos. But after watching the influencer's reel, the branded earphones suddenly started feeling cooler, more exciting, and more valuable.",
    challenge: {
      prompt: "What is MOST influencing Shanaya's thinking?",
      hint: 'Pick THREE that fit.',
      timerSeconds: 20,
      requiredPicks: 3,
      retryMessage: 'Try again — think about NEED vs EMOTION.',
      options: [
        { id: 'need',     emoji: '🎯', label: 'Need',              correct: false },
        { id: 'brand',    emoji: '✨', label: 'Brand Name',        correct: true  },
        { id: 'peer',     emoji: '👥', label: 'Peer Pressure',     correct: true  },
        { id: 'function', emoji: '⚙️', label: 'Product Function',  correct: false },
        { id: 'social',   emoji: '📱', label: 'Social Image',      correct: true  },
      ],
    },
    insight: {
      eyebrow: '🧠 Mindful Choice unlocked',
      title: 'Both products solve the same problem.',
      body: 'The expensive one feels more valuable because of branding, popularity, and social image — not because it actually works better.',
    },
    microChallenge: 'Next time you almost buy from a reel, ask one question: would I still want this if the influencer wasn\'t holding it?',
    takeaway: 'Branding plus popularity does not equal a better product.',
    realWorldConnect: 'Think about the last thing you almost bought right after watching a reel. Was it the product you wanted — or the version of you the reel was selling?',
    identity: 'You\'re someone who can spot what the brand is selling — and what the product is actually doing.',
  },
};

function act3Scenes() {
  /* Act 3 now ships ONE deep scenario (The "Better Deal" Confusion)
   * instead of four shallow ones. Per the original script the beat
   * order is: context → choice → outcome → retry → insight →
   * micro-challenge → takeaway → real-world connect → identity close.
   * Each beat is its own phase so the avatar's emotion + the right-
   * panel narration can shift independently. */
  const sc = act3Scenarios.s1;
  return [{
    id: `scene-${sc.id}`,
    title: sc.title,
    ambience: 'reflective',
    emotion: 'curious',
    scenarioId: sc.id,
    phases: [
      {
        id: `${sc.id}-unlock`,
        duration: 6000,
        status: 'New challenge unlocked',
        emotion: 'excited',
        narration: 'New challenge unlocked — test your impulse control. Shopping apps are not the only places where impulse decisions happen. Let\'s see what happens when you face a different everyday situation.',
      },
      {
        id: `${sc.id}-context`,
        duration: 5500,
        status: 'Setting the scene',
        emotion: 'curious',
        narration: 'Shanaya is scrolling through reels after school. An influencer\'s unboxing video suddenly appears.',
      },
      {
        id: `${sc.id}-stage`,
        duration: 9500,
        status: 'Watching the reel',
        emotion: sc.stageEmotion || 'tempted',
        narration: sc.narration,
      },
      {
        id: `${sc.id}-challenge`,
        hold: true,
        status: 'Your move',
        emotion: 'curious',
        activity: { kind: 'simulation-challenge', scenarioId: sc.id },
      },
      {
        /* Per QA: the previous post-challenge sequence (insight →
         * micro → real-world → close) was four separate phases. Same
         * text, but it dragged. Now consolidated into ONE phase. The
         * InsightPanel on the right still renders the full set of
         * cards (insight, micro-challenge, takeaway, real-world
         * connect, identity), so the learner sees every beat in
         * writing — but the narrator delivers it as one cohesive
         * reflection instead of four stop-and-start beats. */
        id: `${sc.id}-insight`,
        duration: 12000,
        status: 'Mindful Choice unlocked',
        emotion: 'realised',
        // Voice-over keeps only the two punchlines — insight + identity
        // — so the moment lands tight. The micro-challenge and real-
        // world connect still appear as cards in the InsightPanel on
        // the right, so the learner SEES the same text — they just
        // don't hear it read out separately.
        narration: `${sc.insight.title} ${sc.insight.body} ${sc.identity}`,
      },
    ],
  }];
}

function act2Scenes() {
  return [
    /* ============================================================
     * SCENE 6 — INSIDE SHANAYA'S MIND  (Drag thought-spiral game)
     * 12 thought bubbles → 4 mind-trap zones.
     * ============================================================ */
    {
      id: 'scene-6',
      title: "Inside Shanaya's Mind",
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's6-open',
          duration: 2000,
          status: 'Mission briefing',
          emotion: 'realised',
          narration: "Shanaya didn't suddenly decide to overspend. Small thoughts slowly changed her decisions while shopping.",
        },
        {
          id: 's6-mission',
          duration: 5500,
          status: 'Your mission',
          emotion: 'curious',
          narration: "Your mission: enter Shanaya's mind and trace what influenced her choices.",
        },
        {
          id: 's6-activity',
          hold: true,
          status: 'Rebuild the thought spiral',
          emotion: 'curious',
          activity: { kind: 'mind-trap', id: 'thought-spiral' },
        },
      ],
    },

    /* ============================================================
     * SCENE 7 — DEFINITION
     *
     * Previously three phases (s6-close → s7-open → s7-name) all
     * covered the same beat: "four tricks recap" + "name the pattern".
     * Per QA: collapsed into ONE tight phase — narrator names the
     * trick set + the trap name in a single sentence, Shanaya reacts
     * once. ~7s total instead of the prior ~25s of repetition.
     * ============================================================ */
    {
      id: 'scene-7',
      title: 'What is Impulse Buying',
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's7-name',
          duration: 7500,
          status: 'It has a name',
          emotion: 'realised',
          narration: "Four tricks — discounts, FREE offers, emotion, and 'savings'. There's one name for all of them: IMPULSE BUYING.",
        },
      ],
    },

    /* ============================================================
     * SCENE 8 — FLASH CARDS  (3 click-through cards)
     * ============================================================ */
    {
      id: 'scene-8',
      title: 'How impulse buying works',
      ambience: 'reflective',
      emotion: 'happy',
      phases: [
        {
          id: 's8-open',
          duration: 2500,
          status: 'Three flash cards',
          emotion: 'curious',
          narration: 'Click through the flash cards one by one to learn the patterns.',
        },
        {
          /* LAST phase of Act 2. Clicking "Finish Act 2" on the
           * FlashCardDeck completes the activity, the sequencer sees
           * it as the last phase, and onComplete navigates home. */
          id: 's8-cards',
          hold: true,
          status: 'Flash cards',
          emotion: 'happy',
          activity: { kind: 'flash-cards', id: 'impulse-cards' },
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
  light:    { kind: 'light',    label: 'Colour',            values: ['Warm', 'Daylight', 'RGB'],                                   defaultIndex: 1 },
  phoneCase:{ kind: 'phoneCase', label: 'Fit',              values: ['iPhone', 'Samsung', 'Other'],                                defaultIndex: 0 },
};

/* Optional `originalPrice` is shown struck-through next to the real price
 * (e.g. ₹1,999 strike → ₹999). The two hoodie filler variants exist purely
 * so the "Trending Now" row has three hoodies — only the main `hoodie` carries
 * the flash-deal timer + the social-proof beat. */
export const products = {
  shoes:          { id: 'shoes',        emoji: '👟', image: UN('1622760806364-5ccac8096b59'), name: 'White Sneakers',          tagline: 'Trending Now',                  price: 1499, rating: 4.5, sizeOptions: SIZE_PRESETS.shoeUK },
  socks:          { id: 'socks',        emoji: '🧦', image: 'https://ik.imagekit.io/vyka3olhl/uk/product-81/grey-white/original_match_socks_MORMf1-p7.png?tr=w-420,h-420,fo-center', name: 'Branded Socks',           tagline: 'Perfect for your new sneakers', price: 299,  rating: 4.3, sizeOptions: SIZE_PRESETS.apparel },
  /* Hoodie pricing flipped: 20% OFF means MRP ₹999 → sale ₹799 (was 50% off). */
  hoodie:         { id: 'hoodie',       emoji: '👕', image: UN('1620799140188-3b2a02fd9a77'), name: 'Birthday Hoodie',         tagline: '20% OFF · only 5 min left',     price: 799,  originalPrice: 999, discountPct: 20, rating: 4.6, sizeOptions: SIZE_PRESETS.apparel },
  'hoodie-2':     { id: 'hoodie-2',     emoji: '👕', image: UN('1556821840-3a63f95609a7'),    name: 'Classic Pullover',        tagline: 'Best seller',                   price: 1299, rating: 4.4, sizeOptions: SIZE_PRESETS.apparel },
  'hoodie-3':     { id: 'hoodie-3',     emoji: '👕', image: UN('1542406775-ade58c52d2e4'),    name: 'Cosy Hoodie',             tagline: 'New drop',                      price: 1599, rating: 4.5, sizeOptions: SIZE_PRESETS.apparel },
  /* Selfie Glow Clip Light — viral / social-proof add-on for the
   * birthday photos beat. Image is hosted on IndiaMART's free CDN; it's
   * the actual product photo (rechargeable clip-on LED selfie/video
   * light) from a real Surat seller — much more accurate than the
   * Unsplash stock photo we used before. */
  'selfie-light': { id: 'selfie-light', emoji: '💡', image: 'https://5.imimg.com/data5/SELLER/Default/2025/7/531095482/XS/OB/KK/95601433/61lhudmgyol-sl1500-500x500.jpg', name: 'Selfie Glow Clip Light',  tagline: 'Viral on reels · 9K bought',    price: 199,  rating: 4.7, sizeOptions: SIZE_PRESETS.light },
  /* Phone Case — bundled FREE when one more item is added. price: 0 keeps
   * the cart math honest while the UI shows a "FREE" pill instead of ₹0. */
  'phone-case':   { id: 'phone-case',   emoji: '🎀', image: UN('1601593346740-925612772716'), name: 'Phone Case',              tagline: 'FREE with offer',               price: 0,    originalPrice: 599, rating: 4.4, sizeOptions: SIZE_PRESETS.phoneCase, free: true },
  /* iPhone 17 (orange) — shows up in the Trending Now strip as a "wow,
   * everyone's getting one" foil, not in Shanaya's cart. */
  'iphone-17':    { id: 'iphone-17',    emoji: '📱', image: UN('1632661674596-df8be070a5c5'), name: 'iPhone 17 · Orange',      tagline: 'Latest drop · sold out twice',   price: 89999, rating: 4.9, sizeOptions: SIZE_PRESETS.watch },
  /* Legacy products — referenced by Act 2 match-board examples, kept for
   * backwards compat even though the new Act 1 script no longer adds them. */
  smartwatch:     { id: 'smartwatch',   emoji: '⌚', image: UN('1546868871-7041f2a55e12'),    name: 'Smartwatch X1',           tagline: '12K bought this week',          price: 799,  rating: 4.8, sizeOptions: SIZE_PRESETS.watch },
  'cleaning-kit': { id: 'cleaning-kit', emoji: '🧴', image: UN('1636262899511-dc5865c774dc'), name: 'Shoe Cleaning Kit',       tagline: 'Frequently bought together',    price: 399,  rating: 4.2, sizeOptions: SIZE_PRESETS.kit },
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
  { key: 'shoe-chunky',    image: UN('1542291026-7eec264c27ff'), name: 'Chunky Walker',      tagline: 'Bold pick',    price: 2099, rating: 4.5 },
  { key: 'shoe-runner',    image: UN('1595950653106-6c9ebd614d3a'), name: 'Air Runner',         tagline: 'Cushioned',    price: 1899, rating: 4.6 },
  { key: 'shoe-school',    image: UN('1525966222134-fcfa99b8ae77'), name: 'Daily School',       tagline: 'Comfort',      price: 999,  rating: 4.1 },
  { key: 'shoe-festive',   image: UN('1543163521-1bf539c55dd2'),    name: 'Festive Slip-On',    tagline: 'Stylish',      price: 1599, rating: 4.3 },
  { key: 'shoe-retro',     image: UN('1551107696-a4b0c5a0d9a2'),    name: 'Retro Court',        tagline: 'Throwback',    price: 1699, rating: 4.5 },
  { key: 'shoe-mesh',      image: UN('1608231387042-66d1773070a5'), name: 'Mesh Lite',          tagline: 'Breathable',   price: 1199, rating: 4.2 },
];

export const freeDeliveryThreshold = 3599;
export const intendedBudget = 1500;

/* Final wiring — act3Scenes() needs act3Scenarios (defined above) so we
 * compute the scenes after both const blocks have initialised. Keeps
 * the lesson const free of the const-temporal-dead-zone trap. */
lesson.acts.act3.scenes = act3Scenes();
lesson.acts.act4.scenes = act4Scenes();
