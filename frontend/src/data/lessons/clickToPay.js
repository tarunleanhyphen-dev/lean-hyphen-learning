/**
 * Lesson data for "Click to Pay — Understanding Digital Money".
 *
 * Module: Digital Money & Everyday Usage.
 * Story: 13-year-old Ritwik tries to send ₹500 → payment glitches →
 * he transforms into a ₹500 token and travels through the digital
 * payment world to learn how online money actually moves.
 *
 * Same phase schema as `thinkBeforeYouSpend.js` so the existing
 * `useSequencer` hook, audio system, and shared primitives all work
 * without modification. Additional fields used by Act 1 of this lesson:
 *
 *   speaker        'narrator' | 'ritwik' | 'mom' | 'system' — drives
 *                  which TTS voice + which bubble side renders
 *   scenePhase     'home' | 'glitch' | 'transform' | 'digital' — the
 *                  Act 1 component reads this to swap the entire visual
 *                  treatment between scenes (cozy living room → cyber
 *                  digital world). Falls back to scene index if absent.
 *   reaction       { kind: 'tap-signals', count, seconds } — Scene 2
 *                  micro-interaction. The Act gates advance on completion.
 *   paymentStep    'open' | 'scan-cta' | 'scanning' | 'amount' | 'pay'
 *                  — Scene 1 micro-interaction; the PaymentPhone reads
 *                  this to drive its own step animation.
 *   prediction     { prompt, options: [{ id, label, icon, correct }] }
 *                  — Scene 5 prediction challenge.
 *
 * Acts 2/3/4 will append to this object later without touching Act 1.
 */

export const lesson = {
  id: 'click-to-pay',
  slug: 'click-to-pay-understanding-digital-money',
  module: 'Digital Money & Everyday Usage',
  title: 'Click to Pay — Understanding Digital Money',
  totalMinutes: 14,
  hero: {
    tagline:
      'Step inside a payment app and see how ₹500 actually travels from one phone to another.',
    character: {
      name: 'Ritwik',
      avatar: '🧑🏽',
      age: 13,
    },
    palette: {
      // Cyber-teal + electric-violet so the new lesson visually reads
      // distinct from Shanaya's warm peach + saffron lesson.
      from: '#0EA5E9',
      via: '#22D3EE',
      to: '#A78BFA',
    },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — The Glitch & The Transformation',
      minutes: 4,
      kind: 'cinematic',
      scenes: act1Scenes(),
    },
    /* Acts 2/3/4 will plug in here later. The HomePage + LessonPage
     * tolerate `status: 'coming-soon'` so the cards render locked. */
    act2: {
      id: 'act2',
      title: 'Act 2 — Bank, UPI, Cards & Wallets',
      minutes: 4,
      kind: 'interactive-cards',
      status: 'coming-soon',
      scenes: [],
    },
    act3: {
      id: 'act3',
      title: 'Act 3 — Pick the Right Payment Route',
      minutes: 4,
      kind: 'scenarios',
      status: 'coming-soon',
      scenes: [],
    },
    act4: {
      id: 'act4',
      title: 'Act 4 — Confidence Wrap',
      minutes: 2,
      kind: 'reflection',
      status: 'coming-soon',
      scenes: [],
    },
  },
};

function act1Scenes() {
  return [
    /* ============================================================
     * SCENE 1 — MEET THE CHARACTERS + PAYMENT TASK
     * Cozy evening at home. Ritwik scrolling reels, mom asks for help.
     * Ends with a 5-step interactive payment task on the phone.
     * ============================================================ */
    {
      id: 'scene-1',
      title: 'Meet Ritwik',
      scenePhase: 'home',
      ambience: 'cosy',
      emotion: 'neutral',
      phases: [
        {
          id: 's1-meet',
          duration: 6500,
          status: 'Evening at home',
          speaker: 'narrator',
          narration:
            "Meet Ritwik. He's thirteen, loves gaming, and sends money online all the time without really thinking about how it works.",
        },
        {
          id: 's1-habit',
          duration: 5000,
          status: "Ritwik's mental model of payments",
          speaker: 'narrator',
          narration:
            'For him, sending money online is simple. Scan, pay, done.',
        },
        {
          id: 's1-mom-ask',
          duration: 4200,
          status: 'Mom needs help',
          speaker: 'mom',
          bubbles: [
            { side: 'left', type: 'speech', text: 'Ritwik, can you help me with something quickly?' },
          ],
        },
        {
          id: 's1-ritwik-guess',
          duration: 3800,
          status: "Ritwik's first guess",
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Probably another payment...' },
          ],
        },
        {
          id: 's1-mom-amount',
          duration: 5500,
          status: 'Brother needs ₹500',
          speaker: 'mom',
          bubbles: [
            { side: 'left', type: 'speech', text: 'Your brother needs five hundred rupees urgently. He sent a QR code — can you scan and send?' },
          ],
        },
        {
          id: 's1-ritwik-easy',
          duration: 3000,
          status: 'Confident response',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'speech', text: 'Yeah, easy.' },
          ],
        },
        {
          id: 's1-task-intro',
          duration: 4200,
          status: 'You take over',
          speaker: 'narrator',
          narration: "Your turn. Walk through the payment, the way Ritwik would.",
        },
        /* INTERACTIVE — payment task. The PaymentPhone component
         * advances this hold phase once the learner finishes the
         * 5-step flow (open → scan → QR → amount → PAY). */
        {
          id: 's1-task',
          hold: true,
          status: 'Tap each step to send the payment',
          speaker: null,
          paymentStep: 'open',
          task: {
            kind: 'payment-flow',
            steps: [
              { id: 'open',     label: 'Open the payment app' },
              { id: 'scan-cta', label: 'Tap "Scan & Pay"' },
              { id: 'scanning', label: 'Scan the QR code' },
              { id: 'amount',   label: 'Enter amount ₹500' },
              { id: 'pay',      label: 'Press PAY' },
            ],
          },
        },
      ],
    },

    /* ============================================================
     * SCENE 2 — THE PAYMENT GLITCH
     * Payment hangs → screen freezes → app glitches → quick reaction
     * mini-game where the learner taps falling signal icons to try to
     * stabilise the connection. Stabilisation fails; the glitch
     * intensifies and dissolves into Scene 3's transformation.
     * ============================================================ */
    {
      id: 'scene-2',
      title: 'The Glitch',
      scenePhase: 'glitch',
      ambience: 'app-tempo',
      emotion: 'unsettled',
      phases: [
        {
          id: 's2-processing',
          duration: 5500,
          status: 'Processing the payment',
          speaker: 'narrator',
          narration: 'Everything looks normal at first.',
          glitch: { level: 0 },
        },
        {
          id: 's2-wait',
          duration: 4200,
          status: 'Still processing...',
          glitch: { level: 1 },
        },
        {
          id: 's2-error',
          duration: 4500,
          status: 'The payment doesn’t go through',
          speaker: 'narrator',
          narration: 'But then something strange happens. The payment doesn’t go through. The screen freezes.',
          cue: 'freeze',
          glitch: { level: 2 },
        },
        {
          id: 's2-glitch-rising',
          duration: 4000,
          status: 'The app starts to glitch',
          speaker: 'narrator',
          narration: 'And then... the entire app begins to glitch.',
          glitch: { level: 3 },
        },
        /* INTERACTIVE — 5-second reaction event. Falling Wi-Fi icons,
         * tap them to "stabilise". Advances on either the timer or
         * the learner catching the target count. */
        {
          id: 's2-reaction',
          hold: true,
          status: 'Tap the falling signal icons to stabilise',
          reaction: { kind: 'tap-signals', count: 6, seconds: 5 },
          glitch: { level: 3 },
        },
        {
          id: 's2-fail',
          duration: 3800,
          status: 'Signal unstable',
          speaker: 'narrator',
          narration: 'The signals keep falling. The phone screen begins to expand outward.',
          cue: 'alert',
          glitch: { level: 4 },
        },
      ],
    },

    /* ============================================================
     * SCENE 3 — THE TRANSFORMATION
     * Ritwik dissolves into a glowing ₹500 token. Visual treatment
     * flips from the cozy home to the digital cyberworld.
     * ============================================================ */
    {
      id: 'scene-3',
      title: 'The Transformation',
      scenePhase: 'transform',
      ambience: 'hit',
      emotion: 'shocked',
      phases: [
        {
          id: 's3-particles',
          duration: 5200,
          status: 'Reality dissolves',
          speaker: 'narrator',
          narration:
            'Digital particles swirl around Ritwik. The room stretches and dissolves into glowing data streams.',
          cue: 'reveal',
        },
        {
          id: 's3-token',
          duration: 5500,
          status: 'Ritwik becomes ₹500',
          speaker: 'narrator',
          narration: 'His body transforms into a floating, glowing five-hundred rupee token.',
        },
        {
          id: 's3-ritwik-confused',
          duration: 4200,
          status: 'Ritwik reacts',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Wait — what is happening?!' },
          ],
        },
        {
          id: 's3-ritwik-lighter',
          duration: 4200,
          status: 'Floating, weightless',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Why do I feel... lighter?' },
          ],
        },
        {
          id: 's3-ritwik-inside',
          duration: 4500,
          status: 'Inside the phone?',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'thought', text: 'Am I inside the phone right now?!' },
          ],
        },
        {
          id: 's3-alert',
          duration: 5000,
          status: 'System alert',
          speaker: 'system',
          bubbles: [
            { side: 'left', type: 'system', text: 'PAYMENT INTERRUPTED. DIGITAL CURRENCY ACTIVATED.' },
          ],
          cue: 'alert',
        },
        {
          id: 's3-narration',
          duration: 4800,
          status: 'He IS the money',
          speaker: 'narrator',
          narration:
            'Before Ritwik can react, the world completely changes. He is no longer holding the money. He IS the money.',
        },
      ],
    },

    /* ============================================================
     * SCENE 4 — ENTER THE DIGITAL PAYMENT WORLD
     * Full cyber stage with floating system labels (Bank Server,
     * Payment App, Security Check, Network Route). Camera-like
     * parallax. Ritwik-as-token reflects on how payments travel.
     * ============================================================ */
    {
      id: 'scene-4',
      title: 'The Digital World',
      scenePhase: 'digital',
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's4-arrival',
          duration: 5200,
          status: 'A new world appears',
          speaker: 'narrator',
          narration:
            'A huge glowing cyber world stretches out around Ritwik. Four floating labels appear in the distance.',
        },
        {
          id: 's4-labels',
          duration: 6000,
          status: 'Bank, app, security, network',
          showLabels: ['bank', 'app', 'security', 'network'],
        },
        {
          id: 's4-ritwik-think',
          duration: 4500,
          status: 'Ritwik wonders',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'thought', text: 'So THIS is where online payments travel?' },
          ],
        },
        {
          id: 's4-ritwik-realise',
          duration: 5200,
          status: 'Bigger than he thought',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', type: 'thought', text: 'I thought money just disappeared from one phone and appeared in another. This is way more complicated than pressing Pay...' },
          ],
        },
      ],
    },

    /* ============================================================
     * SCENE 5 — THE SYSTEM SPEAKS  +  PREDICTION CHALLENGE
     * The system voice frames the rest of the lesson. The learner
     * makes a prediction about how money moves; their guess sets up
     * Act 2's reveal.
     * ============================================================ */
    {
      id: 'scene-5',
      title: 'Your First Prediction',
      scenePhase: 'digital',
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's5-system-1',
          duration: 4800,
          status: 'The system speaks',
          speaker: 'system',
          bubbles: [
            { side: 'left', type: 'system', text: 'You are now an active digital currency.' },
          ],
        },
        {
          id: 's5-system-2',
          duration: 5200,
          status: 'Every payment has a route',
          speaker: 'system',
          bubbles: [
            { side: 'left', type: 'system', text: 'Every online payment follows a specific route.' },
          ],
        },
        {
          id: 's5-system-3',
          duration: 6000,
          status: 'Travel the right path',
          speaker: 'system',
          bubbles: [
            { side: 'left', type: 'system', text: 'To reach the receiver successfully, you must travel through the correct payment system.' },
          ],
        },
        {
          id: 's5-system-cta',
          duration: 5500,
          status: 'Make your prediction',
          speaker: 'system',
          bubbles: [
            { side: 'left', type: 'system', text: 'When someone taps PAY, which path do you think the money follows? Don’t overthink — make a prediction!' },
          ],
        },
        /* INTERACTIVE — prediction challenge. Any answer advances;
         * the "correct" one earns a small affirmation but Act 2 reveals
         * the full answer regardless of pick. */
        {
          id: 's5-prediction',
          hold: true,
          status: 'Pick a path',
          prediction: {
            prompt: 'Which path does ₹500 take after Ritwik presses PAY?',
            options: [
              { id: 'instant',  icon: '📱', label: 'App → Receiver instantly', correct: false, hint: 'Feels true — but the app itself never holds the money.' },
              { id: 'bank',     icon: '🏦', label: 'App → Bank → Receiver',     correct: true,  hint: 'Right idea! The bank is the actual money store. Act 2 unpacks how.' },
              { id: 'cloud',    icon: '☁️', label: 'Internet cloud → Receiver',  correct: false, hint: 'The internet carries the signal — not the money itself.' },
              { id: 'qr',       icon: '🔳', label: 'QR code stores the money',   correct: false, hint: 'A QR code is just an address — like a name on an envelope.' },
            ],
          },
        },
        {
          id: 's5-outro',
          duration: 4800,
          status: 'On to Act 2',
          speaker: 'narrator',
          narration: 'Hold that guess. In Act 2, you’ll meet the real players — bank, UPI, cards and wallets — and see which one was right.',
        },
      ],
    },
  ];
}

export const characters = {
  ritwik:   { name: 'Ritwik',   avatar: '🧑🏽', side: 'right', voice: 'ritwik' },
  mom:      { name: 'Mom',      avatar: '👩🏽',  side: 'left',  voice: 'shanaya' },
  narrator: { name: 'Narrator', avatar: '🎙️',  side: null,    voice: 'narrator' },
  system:   { name: 'System',   avatar: '🟢',  side: 'left',  voice: 'system' },
};
