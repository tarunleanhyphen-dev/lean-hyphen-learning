/**
 * Lesson data for "Click to Pay — Understanding Digital Money".
 *
 * Module: Digital Money & Everyday Usage.
 *
 * v2 — significantly tightened: shorter narration lines, lower per-phase
 * durations (typical phase dropped from 5-6s → 3-4s), redundant beats
 * cut. The 3D stage carries more of the emotional weight, so the script
 * doesn't need to over-explain.
 *
 * Same phase schema as `thinkBeforeYouSpend.js` (used by `useSequencer`).
 *
 * Bubbles now carry a `speaker` field so the 3D Scene can anchor each
 * pointer-bubble above the right character's head.
 */

export const lesson = {
  id: 'click-to-pay',
  slug: 'click-to-pay-understanding-digital-money',
  module: 'Digital Money & Everyday Usage',
  title: 'Click to Pay — Understanding Digital Money',
  totalMinutes: 9,
  hero: {
    tagline:
      'Step inside a payment app and see how ₹500 actually travels from one phone to another.',
    character: {
      name: 'Ritwik',
      avatar: '🧑🏽',
      age: 13,
    },
    palette: {
      from: '#0EA5E9',
      via: '#22D3EE',
      to: '#A78BFA',
    },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — The Glitch & The Transformation',
      minutes: 3,
      kind: 'cinematic-3d',
      scenes: act1Scenes(),
    },
    act2: {
      id: 'act2',
      title: 'Act 2 — Bank, UPI, Cards & Wallets',
      minutes: 3,
      kind: 'interactive-cards',
      status: 'coming-soon',
      scenes: [],
    },
    act3: {
      id: 'act3',
      title: 'Act 3 — Pick the Right Payment Route',
      minutes: 2,
      kind: 'scenarios',
      status: 'coming-soon',
      scenes: [],
    },
    act4: {
      id: 'act4',
      title: 'Act 4 — Confidence Wrap',
      minutes: 1,
      kind: 'reflection',
      status: 'coming-soon',
      scenes: [],
    },
  },
};

function act1Scenes() {
  return [
    /* ============================================================
     * SCENE 1 — MEET RITWIK & MOM  +  PAYMENT TASK
     * Mom is in the room; she asks for help. Ritwik agrees and the
     * learner walks through a 5-step payment.
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
          duration: 4200,
          status: 'Evening at home',
          speaker: 'narrator',
          narration: "Meet Ritwik — thirteen, loves gaming, pays online all the time.",
        },
        {
          id: 's1-mom-ask',
          duration: 3500,
          status: 'Mom needs help',
          speaker: 'mom',
          bubbles: [
            { side: 'left', speaker: 'mom', type: 'speech', text: 'Ritwik, help me with something?' },
          ],
        },
        {
          id: 's1-mom-amount',
          duration: 4400,
          status: 'Brother needs ₹500',
          speaker: 'mom',
          bubbles: [
            { side: 'left', speaker: 'mom', type: 'speech', text: 'Your brother needs five hundred rupees. He sent a QR — scan and send?' },
          ],
        },
        {
          id: 's1-ritwik-easy',
          duration: 2600,
          status: 'Confident',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', speaker: 'ritwik', type: 'speech', text: 'Yeah, easy.' },
          ],
        },
        {
          id: 's1-handover',
          duration: 3600,
          status: 'Ritwik starts the payment',
          speaker: 'narrator',
          narration: 'Ritwik opens the app and starts the payment, the way he always does.',
        },
      ],
    },

    /* ============================================================
     * SCENE 2 — THE GLITCH (compressed; reaction event central)
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
          duration: 3000,
          status: 'Processing payment',
          speaker: 'narrator',
          narration: 'Looks normal at first.',
          glitch: { level: 0 },
        },
        {
          id: 's2-error',
          duration: 3500,
          status: 'Screen freezes',
          speaker: 'narrator',
          narration: 'But the payment hangs. The screen freezes.',
          cue: 'freeze',
          glitch: { level: 2 },
        },
        {
          id: 's2-glitch-rising',
          duration: 3000,
          status: 'App glitches',
          speaker: 'narrator',
          narration: 'And the whole app begins to glitch.',
          glitch: { level: 3 },
        },
        {
          id: 's2-reaction',
          hold: true,
          status: 'Tap falling signals to stabilise',
          reaction: { kind: 'tap-signals', count: 6, seconds: 5 },
          glitch: { level: 3 },
        },
        {
          id: 's2-fail',
          duration: 2800,
          status: 'Signal unstable',
          speaker: 'narrator',
          narration: 'Signals keep falling. The phone screen expands.',
          cue: 'alert',
          glitch: { level: 4 },
        },
      ],
    },

    /* ============================================================
     * SCENE 3 — TRANSFORMATION (tight)
     * ============================================================ */
    {
      id: 'scene-3',
      title: 'Transformation',
      scenePhase: 'transform',
      ambience: 'hit',
      emotion: 'shocked',
      phases: [
        {
          id: 's3-particles',
          duration: 3600,
          status: 'Reality dissolves',
          speaker: 'narrator',
          narration: 'The room dissolves into data streams.',
          cue: 'reveal',
        },
        {
          id: 's3-token',
          duration: 3600,
          status: 'Ritwik becomes ₹500',
          speaker: 'narrator',
          narration: 'Ritwik becomes a glowing five-hundred rupee token.',
        },
        {
          id: 's3-ritwik-confused',
          duration: 3000,
          status: 'Ritwik reacts',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', speaker: 'ritwik', type: 'thought', text: 'Wait — what is happening?!' },
          ],
        },
        {
          id: 's3-alert',
          duration: 3600,
          status: 'System alert',
          speaker: 'system',
          bubbles: [
            { side: 'left', speaker: 'system', type: 'system', text: 'PAYMENT INTERRUPTED. DIGITAL CURRENCY ACTIVATED.' },
          ],
          cue: 'alert',
        },
        {
          id: 's3-narration',
          duration: 3400,
          status: 'He IS the money',
          speaker: 'narrator',
          narration: 'He is no longer holding the money. He IS the money.',
        },
      ],
    },

    /* ============================================================
     * SCENE 4 — DIGITAL WORLD (labels appear, one reflection beat)
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
          duration: 3400,
          status: 'New world appears',
          speaker: 'narrator',
          narration: 'A glowing cyber world stretches around him.',
        },
        {
          id: 's4-labels',
          duration: 4400,
          status: 'Bank, app, security, network',
          showLabels: ['bank', 'app', 'security', 'network'],
          speaker: 'narrator',
          narration: 'Four systems — bank, app, security, network.',
        },
        {
          id: 's4-ritwik-realise',
          duration: 4200,
          status: 'It’s bigger than he thought',
          speaker: 'ritwik',
          bubbles: [
            { side: 'right', speaker: 'ritwik', type: 'thought', text: 'This is way more than just pressing Pay…' },
          ],
        },
      ],
    },

    /* ============================================================
     * SCENE 5 — SYSTEM SPEAKS + PREDICTION (one combined opener)
     * ============================================================ */
    {
      id: 'scene-5',
      title: 'Your Turn',
      scenePhase: 'digital',
      ambience: 'reflective',
      emotion: 'curious',
      phases: [
        {
          id: 's5-system',
          duration: 4200,
          status: 'System speaks',
          speaker: 'system',
          bubbles: [
            { side: 'left', speaker: 'system', type: 'system', text: 'You saw what happened. Now you try it — send the same five hundred rupees.' },
          ],
        },
        /* INTERACTIVE — the actual payment task, moved out of Scene 1
         * so scenes 1-4 stay purely cinematic. The phone shows up in the
         * right column for Scene 5 only. */
        {
          id: 's5-task',
          hold: true,
          status: 'Send ₹500 on the phone',
          speaker: null,
          task: {
            kind: 'payment-flow',
            steps: [
              { id: 'open',     label: 'Open payment app' },
              { id: 'scan-cta', label: 'Tap Scan & Pay' },
              { id: 'scanning', label: 'Scan QR code' },
              { id: 'amount',   label: 'Enter ₹500' },
              { id: 'pay',      label: 'Press PAY' },
            ],
          },
        },
        {
          id: 's5-system-2',
          duration: 4000,
          status: 'Same tap, same path?',
          speaker: 'system',
          bubbles: [
            { side: 'left', speaker: 'system', type: 'system', text: 'You pressed PAY. Predict — which path does the money take now?' },
          ],
        },
        {
          id: 's5-prediction',
          hold: true,
          status: 'Pick a path',
          prediction: {
            prompt: 'Which path does ₹500 take after Ritwik presses PAY?',
            options: [
              { id: 'instant',  icon: '📱', label: 'App → Receiver instantly', correct: false, hint: 'Feels true — but the app itself never holds the money.' },
              { id: 'bank',     icon: '🏦', label: 'App → Bank → Receiver',     correct: true,  hint: 'Right idea — the bank is the actual money store. Act 2 unpacks how.' },
              { id: 'cloud',    icon: '☁️', label: 'Internet cloud → Receiver',  correct: false, hint: 'The internet carries the signal, not the money itself.' },
              { id: 'qr',       icon: '🔳', label: 'QR code stores the money',   correct: false, hint: 'A QR code is just an address — like a name on an envelope.' },
            ],
          },
        },
        {
          id: 's5-outro',
          duration: 3400,
          status: 'On to Act 2',
          speaker: 'narrator',
          narration: 'Hold that guess. Act 2 reveals the truth.',
        },
      ],
    },
  ];
}

export const characters = {
  ritwik:   { name: 'Ritwik',   avatar: '🧑🏽', side: 'right', voice: 'ritwik' },
  mom:      { name: 'Mom',      avatar: '👩🏽',  side: 'left',  voice: 'mom' },
  narrator: { name: 'Narrator', avatar: '🎙️',  side: null,    voice: 'narrator' },
  system:   { name: 'System',   avatar: '⚡',  side: 'left',  voice: 'system' },
};
