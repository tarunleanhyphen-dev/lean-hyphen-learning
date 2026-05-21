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
        {
          id: 's1-add-shoes',
          duration: 2000,
          status: 'Sneakers added',
          phone: { search: 'shoes', view: 'detail', showProduct: 'shoes', cart: ['shoes'], floatAdd: 'shoes', toast: 'Sneakers added · ₹1,499' },
          cue: 'add',
          addedItem: { id: 'shoes', trigger: 'plan' },
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
        /* Combined "scroll → Complete-the-Look banner → tap socks" beat —
         * scrolls smoothly to the recommendations row, slides the banner
         * in, highlights the socks card and plays a tap pulse on it
         * before auto-advancing to the socks PDP. Banner copy and socks
         * tagline now lean more emotional / aspirational. */
        {
          id: 's2-intro',
          duration: 9500,
          status: '"Complete the Look" → tap the socks',
          narration: 'After adding the sneakers, Shanaya keeps scrolling. The app suggests pairing them with matching socks.',
          phone: after(['shoes'], {
            recommendations: ['socks'],
            rowLabel: 'Complete the Look',
            pairNudge: { title: 'Complete the Look', subtitle: 'These socks will look amazing with your new sneakers ✨' },
            highlight: 'socks',
            scrollTo: 'recommendations',
            tapTarget: 'rec-socks',
          }),
          cue: 'ding',
        },
        {
          id: 's2-w1-detail',
          duration: 6500,
          status: 'Reading socks details',
          phone: { cart: ['shoes'], view: 'detail', showProduct: 'socks' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Hmm… socks would actually go well with the shoes.' },
          ],
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
        {
          /* 2-second "freeze frame" as the Flash Deal alert pulses/glows
           * at the top of the phone. No voiceover during the freeze — the
           * script is explicit that the screen does the talking here. */
          id: 's2-w2-flash',
          duration: 4500,
          status: 'Flash Deal flashes in',
          phone: after(['shoes', 'socks'], {
            recommendations: ['hoodie', 'hoodie-2', 'hoodie-3'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            flashAlert: { label: 'Flash Deal — Ends Soon!', product: 'Birthday Hoodie · ₹999 → ₹799', mins: 7 },
            scrollTo: 'recommendations',
          }),
          cue: 'alert',
        },
        {
          id: 's2-w2-tap-rec',
          duration: 2200,
          status: 'Tapping the hoodie',
          phone: after(['shoes', 'socks'], {
            recommendations: ['hoodie', 'hoodie-2', 'hoodie-3'],
            rowLabel: 'Trending Now',
            flashDeal: 'hoodie',
            flashAlert: { label: 'Flash Deal — Ends Soon!', product: 'Birthday Hoodie · ₹999 → ₹799', mins: 7 },
            tapTarget: 'rec-hoodie',
          }),
          cue: 'tap',
        },
        {
          id: 's2-w2-detail',
          duration: 6000,
          status: 'Reading hoodie details',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 7 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This hoodie is so trendy and that’s a great discount.' },
          ],
        },
        {
          id: 's2-w2-bubble2',
          duration: 6500,
          status: 'Reading hoodie details',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 7 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This hoodie is so trendy and that’s a great discount.' },
            { side: 'right', type: 'thought', text: 'It would actually look great for my birthday photos.' },
          ],
        },
        {
          id: 's2-w2-bubble3',
          duration: 7000,
          status: 'Justifying the add-on',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 7 },
          bubbles: [
            { side: 'right', type: 'thought', text: 'This hoodie is so trendy and that’s a great discount.' },
            { side: 'right', type: 'thought', text: 'It would actually look great for my birthday photos.' },
            { side: 'right', type: 'thought', text: 'I didn’t plan this… but it kind of fits the whole vibe.' },
          ],
        },
        {
          id: 's2-w2-scroll',
          duration: 2000,
          status: 'Scrolling to Add to Cart',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 7, scrollHint: true },
        },
        /* ---- INTERACTIVE: learner taps Add to Cart for the hoodie ---- */
        {
          id: 's2-w2-add-prompt',
          hold: true,
          status: 'Your turn',
          phone: { cart: ['shoes', 'socks'], view: 'detail', showProduct: 'hoodie', urgencyMinutes: 7, tapTarget: 'primary-cta', scrollHint: true },
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
        /* Brief "she scrolls more" beat between adding the hoodie and the
         * unlock banner — so the suggestion feels like it surfaces
         * organically during browsing, not as a hard cut. */
        {
          id: 's2-post-hoodie-browse',
          duration: 5500,
          status: 'Scrolling a little more',
          narration: 'Shanaya scrolls a little more on the home page.',
          phone: after(['shoes', 'socks', 'hoodie'], { scrollHint: true }),
        },
        {
          /* Suddenly — a NEW OFFER UNLOCKED banner slides in over the
           * feed. Pulses to grab attention, no narration. */
          id: 's2-w3-unlock',
          duration: 4800,
          status: 'NEW OFFER UNLOCKED',
          phone: after(['shoes', 'socks', 'hoodie'], {
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
          id: 's2-w3-bubble1',
          duration: 5500,
          status: 'Curious about the free gift',
          phone: after(['shoes', 'socks', 'hoodie'], {
            unlockOffer: {
              headline: 'NEW OFFER UNLOCKED',
              message: 'Add 1 more item and get a Phone Case FREE',
              gift: 'phone-case',
              emoji: '🎀',
            },
          }),
          bubbles: [
            { side: 'right', type: 'thought', text: 'Ooooo wait…' },
            { side: 'right', type: 'thought', text: 'I was anyway going to buy the phone case — mine looks old.' },
          ],
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
            { side: 'right', type: 'thought', text: 'Ooooo wait…' },
            { side: 'right', type: 'thought', text: 'I was anyway going to buy the phone case — mine looks old.' },
            { side: 'right', type: 'thought', text: 'And it’s FREE if I add one more thing?' },
            { side: 'right', type: 'thought', text: 'Okay let me just see what counts.' },
          ],
        },
        {
          /* Selfie Glow Clip Light recommendation card slides in. Viral
           * badge + "9K bought this week" lights up the social-proof
           * pressure. No narration — the screen does the work. */
          id: 's2-w3-rec',
          duration: 5500,
          status: 'Selfie Glow Clip Light appears',
          phone: after(['shoes', 'socks', 'hoodie'], {
            recommendations: ['selfie-light'],
            rowLabel: 'Recommended Add-On',
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
            recommendations: ['selfie-light'],
            rowLabel: 'Recommended Add-On',
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
          id: 's2-w3-detail',
          duration: 6000,
          status: 'Reading Selfie Light details',
          phone: { cart: ['shoes', 'socks', 'hoodie'], view: 'detail', showProduct: 'selfie-light', viralBadge: 'selfie-light' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wow! This would make my birthday pictures look SO much better.' },
          ],
        },
        {
          id: 's2-w3-bubble3',
          duration: 6500,
          status: 'Stacking the justifications',
          phone: { cart: ['shoes', 'socks', 'hoodie'], view: 'detail', showProduct: 'selfie-light', viralBadge: 'selfie-light' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wow! This would make my birthday pictures look SO much better.' },
            { side: 'right', type: 'thought', text: 'And then I get the phone case free too.' },
          ],
        },
        {
          id: 's2-w3-bubble4',
          duration: 7000,
          status: '"Such a smart deal"',
          phone: { cart: ['shoes', 'socks', 'hoodie'], view: 'detail', showProduct: 'selfie-light', viralBadge: 'selfie-light' },
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wow! This would make my birthday pictures look SO much better.' },
            { side: 'right', type: 'thought', text: 'And then I get the phone case free too.' },
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
      ambience: 'silent',
      emotion: 'unsettled',
      phases: [
        {
          /* Music slows dramatically (the script is explicit: nothing is
           * spoken here). The cart-reveal view shows the full breakdown
           * with the 5 items + total + savings banner. */
          id: 's3-cart-reveal',
          duration: 7500,
          status: 'Cart updated',
          phone: {
            cart: FULL_CART,
            view: 'cart-reveal',
            revealItems: true,
          },
          cue: 'freeze',
        },
        {
          id: 's3-cart-total',
          duration: 5000,
          status: 'TOTAL · ₹2,796',
          phone: {
            cart: FULL_CART,
            view: 'cart-reveal',
            revealItems: true,
            revealTotal: true,
          },
        },
        {
          /* "You Saved ₹1,400" — the manipulative savings line that
           * makes the over-budget spend feel like a win. */
          id: 's3-saved-banner',
          duration: 5500,
          status: 'You Saved ₹1,400 ✨',
          phone: {
            cart: FULL_CART,
            view: 'cart-reveal',
            revealItems: true,
            revealTotal: true,
            revealSavings: 1400,
          },
          cue: 'sparkle',
        },
        {
          /* Quiet contrast — the original ₹1,500 budget reappears next
           * to the ₹2,796 total. The visual gap is the lesson. */
          id: 's3-budget-flash',
          duration: 6500,
          status: 'Original Budget · ₹1,500',
          phone: {
            cart: FULL_CART,
            view: 'cart-reveal',
            revealItems: true,
            revealTotal: true,
            revealSavings: 1400,
            revealBudget: true,
            showGap: true,
          },
        },
        {
          /* Slow zoom into Shanaya's face — handled by the avatar pulse +
           * the phone dim. No narration. */
          id: 's3-zoom-shanaya',
          duration: 5000,
          status: 'The room goes quiet',
          emotion: 'realised',
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
        },
        {
          id: 's3-final-thought-1',
          duration: 5500,
          status: 'Shanaya catches herself',
          emotion: 'realised',
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
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wait…' },
          ],
        },
        {
          id: 's3-final-thought-2',
          duration: 11000,
          status: 'Shanaya catches herself',
          emotion: 'realised',
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
          duration: 11500,
          status: 'Looking back at the cart',
          emotion: 'realised',
          narration: 'Five items. ₹3,795. None of it was on the plan. So what actually made each one slip in?',
        },
        {
          id: 's6-setup',
          duration: 10000,
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
          duration: 10000,
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
          duration: 10000,
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
          duration: 10500,
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
          duration: 10000,
          status: 'Learning the framework',
          emotion: 'curious',
          narration: 'Knowing the trick is half the answer. Here is a five-question pause that beats it.',
        },
        {
          /* This is the LAST phase of Act 2. Clicking "Finish Act 2" on
           * the FrameworkCard completes the activity, the sequencer sees
           * it as the last phase, and onComplete navigates straight back
           * to the home page (Act 3 is still coming-soon). No bridge beat
           * after — the user closes the act on their own click. */
          id: 's8-framework',
          hold: true,
          status: 'Five questions to pause',
          emotion: 'happy',
          activity: { kind: 'framework', id: 'pause-and-think' },
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
  socks:          { id: 'socks',        emoji: '🧦', image: UN('1604671801908-6f0c6a092c05'), name: 'Branded Socks',           tagline: 'Looks amazing with sneakers',   price: 299,  rating: 4.3, sizeOptions: SIZE_PRESETS.apparel },
  /* Hoodie pricing flipped: 20% OFF means MRP ₹999 → sale ₹799 (was 50% off). */
  hoodie:         { id: 'hoodie',       emoji: '👕', image: UN('1620799140188-3b2a02fd9a77'), name: 'Birthday Hoodie',         tagline: '20% OFF · only 7 min left',     price: 799,  originalPrice: 999, discountPct: 20, rating: 4.6, sizeOptions: SIZE_PRESETS.apparel },
  'hoodie-2':     { id: 'hoodie-2',     emoji: '👕', image: UN('1556821840-3a63f95609a7'),    name: 'Classic Pullover',        tagline: 'Best seller',                   price: 1299, rating: 4.4, sizeOptions: SIZE_PRESETS.apparel },
  'hoodie-3':     { id: 'hoodie-3',     emoji: '👕', image: UN('1542406775-ade58c52d2e4'),    name: 'Cosy Hoodie',             tagline: 'New drop',                      price: 1599, rating: 4.5, sizeOptions: SIZE_PRESETS.apparel },
  /* Selfie Glow Clip Light — viral / social-proof add-on for the birthday photos beat. */
  'selfie-light': { id: 'selfie-light', emoji: '💡', image: UN('1505740420928-5e560c06d30e'), name: 'Selfie Glow Clip Light',  tagline: 'Viral on reels · 9K bought',    price: 199,  rating: 4.7, sizeOptions: SIZE_PRESETS.light },
  /* Phone Case — bundled FREE when one more item is added. price: 0 keeps
   * the cart math honest while the UI shows a "FREE" pill instead of ₹0. */
  'phone-case':   { id: 'phone-case',   emoji: '🎀', image: UN('1601593346740-925612772716'), name: 'Phone Case',              tagline: 'FREE with offer',               price: 0,    originalPrice: 599, rating: 4.4, sizeOptions: SIZE_PRESETS.phoneCase, free: true },
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
