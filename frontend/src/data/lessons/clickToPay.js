/**
 * Lesson data for "Click to Pay — Understanding Digital Money".
 *
 * Module: Digital Money & Everyday Usage.
 *
 * v3 — full rebuild that follows the script provided by the user:
 *   Scene 1  Meet Ritwik + Mom → mom asks for help → learner does the
 *            interactive payment task on a PhonePe-style phone.
 *   Scene 2  Payment glitch + reaction event.
 *   Scene 3  Transformation — Ritwik becomes the ₹500 Money character.
 *   Scene 4  Digital world tour — Money character travels through
 *            Payment App → UPI → Bank → Security → Receiver.
 *   Scene 5  System voice + prediction challenge.
 *
 * Every phase that should have voice carries a `speaker` field (one of
 * `narrator`, `ritwik`, `mom`, `system`). The Act drives TTS off this.
 *
 * Additional fields used by the new Stage2D + UPIFlow:
 *   stage           'home' | 'phone-task' | 'glitch' | 'transform' |
 *                   'digital' | 'flow' | 'prediction'
 *   activeNode      index into UPI_NODES for the flow tour
 *   visibleLabels   'all' or array of node ids — controls progressive reveal
 */

export const lesson = {
  id: 'click-to-pay',
  slug: 'click-to-pay-understanding-digital-money',
  module: 'Digital Money & Everyday Usage',
  title: 'Click to Pay — Understanding Digital Money',
  totalMinutes: 10,
  hero: {
    tagline:
      'Step inside a payment app and see how ₹500 actually travels from one phone to another.',
    character: {
      name: 'Ritwik',
      avatar: '🧑🏽',
      age: 13,
    },
    palette: { from: '#0EA5E9', via: '#22D3EE', to: '#A78BFA' },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — Story Hook & Transformation',
      minutes: 4,
      kind: 'cinematic-3d',
      scenes: act1Scenes(),
    },
    act2: { id: 'act2', title: 'Act 2 — Bank, UPI, Cards & Wallets', minutes: 3, kind: 'interactive-cards', status: 'coming-soon', scenes: [] },
    act3: { id: 'act3', title: 'Act 3 — Pick the Right Payment Route', minutes: 2, kind: 'scenarios', status: 'coming-soon', scenes: [] },
    act4: { id: 'act4', title: 'Act 4 — Confidence Wrap', minutes: 1, kind: 'reflection', status: 'coming-soon', scenes: [] },
  },
};

function act1Scenes() {
  return [
    /* ============================================================
     * SCENE 1 — MEET THE CHARACTERS  +  PAYMENT TASK
     * ============================================================ */
    {
      id: 'scene-1',
      title: 'Meet the Characters',
      stage: 'home',
      ambience: 'cosy',
      phases: [
        {
          id: 's1-meet',
          duration: 6000,
          status: 'Evening at home',
          speaker: 'narrator',
          narration:
            "Meet Ritwik. He's thirteen, loves gaming, and uses online payments all the time without really thinking about how they work.",
        },
        {
          id: 's1-habit',
          duration: 4500,
          status: "Ritwik's mental model of payments",
          speaker: 'narrator',
          narration: 'For him, sending money online is simple. Scan, pay, done.',
        },
        {
          id: 's1-mom-ask',
          duration: 4200,
          status: 'Mom needs help',
          speaker: 'mom',
          bubbles: [
            { speaker: 'mom', type: 'speech', text: 'Ritwik, can you help me with something quickly?' },
          ],
        },
        {
          id: 's1-ritwik-guess',
          duration: 3600,
          status: "Ritwik's first guess",
          speaker: 'ritwik',
          bubbles: [
            { speaker: 'ritwik', type: 'thought', text: 'Probably another payment...' },
          ],
        },
        {
          id: 's1-mom-amount',
          duration: 5800,
          status: 'Brother needs ₹500',
          speaker: 'mom',
          bubbles: [
            { speaker: 'mom', type: 'speech', text: 'Your brother needs five hundred rupees urgently. He sent a QR code — can you scan and send?' },
          ],
        },
        {
          id: 's1-ritwik-easy',
          duration: 2800,
          status: 'Confident response',
          speaker: 'ritwik',
          bubbles: [
            { speaker: 'ritwik', type: 'speech', text: 'Yeah, easy.' },
          ],
        },
        {
          id: 's1-task-intro',
          duration: 4500,
          status: 'You take over',
          speaker: 'narrator',
          narration: 'Your turn. Help Ritwik send the money.',
        },
        /* INTERACTIVE — full PhonePe-style task: home → PhonePe → scan → amount → PAY */
        {
          id: 's1-task',
          stage: 'phone-task',
          hold: true,
          status: 'Tap each step to send ₹500',
          task: {
            kind: 'payment-flow',
            steps: [
              { id: 'home',       label: 'Tap PhonePe on the home screen' },
              { id: 'pe-home',    label: 'Tap Scan & Pay' },
              { id: 'scanning',   label: 'Scan the QR code' },
              { id: 'amount',     label: 'Enter ₹500' },
              { id: 'processing', label: 'Tap PAY' },
            ],
          },
        },
      ],
    },

    /* ============================================================
     * SCENE 2 — THE PAYMENT GLITCH
     * ============================================================ */
    {
      id: 'scene-2',
      title: 'The Payment Glitch',
      stage: 'glitch',
      ambience: 'app-tempo',
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
          id: 's2-error',
          duration: 4800,
          status: 'The payment doesn’t go through',
          speaker: 'narrator',
          narration: 'But then something strange happens. The payment doesn’t go through. The screen freezes.',
          cue: 'freeze',
          glitch: { level: 2 },
        },
        {
          id: 's2-glitch-rising',
          duration: 3800,
          status: 'The app starts to glitch',
          speaker: 'narrator',
          narration: 'And then... the entire app begins to glitch.',
          glitch: { level: 3 },
        },
        /* INTERACTIVE — falling signals reaction event */
        {
          id: 's2-reaction',
          hold: true,
          status: 'Tap the falling signal icons to stabilise',
          reaction: { kind: 'tap-signals', count: 6, seconds: 5 },
          glitch: { level: 3 },
        },
        {
          id: 's2-fail',
          duration: 4000,
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
     * ============================================================ */
    {
      id: 'scene-3',
      title: 'The Transformation',
      stage: 'transform',
      ambience: 'hit',
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
          duration: 4800,
          status: 'Ritwik becomes a ₹500 note',
          speaker: 'narrator',
          narration:
            'His body transforms into a floating, glowing five-hundred rupee note.',
        },
        {
          id: 's3-ritwik-confused',
          duration: 3600,
          status: 'Ritwik reacts',
          speaker: 'ritwik',
          bubbles: [
            { speaker: 'ritwik', type: 'thought', text: 'Wait — what is happening?!' },
          ],
        },
        {
          id: 's3-ritwik-lighter',
          duration: 3600,
          status: 'Floating, weightless',
          speaker: 'ritwik',
          bubbles: [
            { speaker: 'ritwik', type: 'thought', text: 'Why do I feel... lighter?' },
          ],
        },
        {
          id: 's3-ritwik-inside',
          duration: 4000,
          status: 'Inside the phone?',
          speaker: 'ritwik',
          bubbles: [
            { speaker: 'ritwik', type: 'thought', text: 'Am I inside the phone right now?!' },
          ],
        },
        {
          id: 's3-alert',
          duration: 4500,
          status: 'System alert',
          speaker: 'system',
          bubbles: [
            { speaker: 'system', type: 'system', text: 'Payment interrupted. Digital currency activated.' },
          ],
          cue: 'alert',
        },
        {
          id: 's3-narration',
          duration: 4400,
          status: 'He IS the money',
          speaker: 'narrator',
          narration:
            'Before Ritwik can react, the world around him completely changes. He is no longer holding the money. He IS the money.',
        },
      ],
    },

    /* ============================================================
     * SCENE 4 — ENTER THE DIGITAL PAYMENT WORLD  + FLOW TOUR
     * ============================================================ */
    {
      id: 'scene-4',
      title: 'The Digital Payment World',
      stage: 'digital',
      ambience: 'reflective',
      phases: [
        {
          id: 's4-arrival',
          duration: 4400,
          status: 'A new world appears',
          speaker: 'narrator',
          narration:
            'A huge glowing cyber world stretches out around him. In the distance, four floating systems appear.',
        },
        {
          id: 's4-labels',
          duration: 6000,
          status: 'Four systems',
          stage: 'flow',
          activeNode: -1,
          visibleLabels: ['app', 'bank', 'security', 'network', 'receiver'],
          speaker: 'narrator',
          narration:
            'Payment App. UPI Network. Bank Server. Security Check. And finally, the Receiver.',
        },
        {
          id: 's4-ritwik-think',
          duration: 4200,
          status: 'Ritwik wonders',
          speaker: 'ritwik',
          stage: 'flow',
          activeNode: -1,
          bubbles: [
            { speaker: 'ritwik', type: 'thought', text: 'So THIS is where online payments travel?' },
          ],
        },
        {
          id: 's4-ritwik-realise',
          duration: 5200,
          status: 'Bigger than he thought',
          speaker: 'ritwik',
          stage: 'flow',
          activeNode: -1,
          bubbles: [
            { speaker: 'ritwik', type: 'thought', text: 'I thought money just disappeared from one phone and appeared in another. This is way more complicated than pressing Pay...' },
          ],
        },
        /* === Money-as-traveler tour — Money500 walks through each node === */
        {
          id: 's4-tour-app',
          duration: 5200,
          status: 'Stop 1 · Payment App',
          stage: 'flow',
          activeNode: 0,
          speaker: 'narrator',
          narration: 'First, the payment app. This is the door — the place where you tapped Pay.',
        },
        {
          id: 's4-tour-network',
          duration: 5400,
          status: 'Stop 2 · UPI Network',
          stage: 'flow',
          activeNode: 1,
          speaker: 'narrator',
          narration: 'Then the UPI network. It carries the message — but never the money itself.',
        },
        {
          id: 's4-tour-bank',
          duration: 5400,
          status: 'Stop 3 · Bank Server',
          stage: 'flow',
          activeNode: 2,
          speaker: 'narrator',
          narration: 'Then your bank. The bank is where the money actually lives. Always was, always will be.',
        },
        {
          id: 's4-tour-security',
          duration: 5400,
          status: 'Stop 4 · Security Check',
          stage: 'flow',
          activeNode: 3,
          speaker: 'narrator',
          narration: 'Before anything moves, security checks who you are and whether you really meant to send this.',
        },
        {
          id: 's4-tour-receiver',
          duration: 5200,
          status: 'Stop 5 · Receiver',
          stage: 'flow',
          activeNode: 4,
          speaker: 'narrator',
          narration: 'And finally, the receiver. Their bank gets the money — and their app just shows the update.',
        },
      ],
    },

    /* ============================================================
     * SCENE 5 — THE SYSTEM SPEAKS + PREDICTION
     * ============================================================ */
    {
      id: 'scene-5',
      title: 'The System Speaks',
      stage: 'prediction',
      ambience: 'reflective',
      phases: [
        {
          id: 's5-system-1',
          duration: 4400,
          status: 'The system speaks',
          speaker: 'system',
          bubbles: [
            { speaker: 'system', type: 'system', text: 'You are now an active digital currency.' },
          ],
        },
        {
          id: 's5-system-2',
          duration: 4800,
          status: 'Every payment has a route',
          speaker: 'system',
          bubbles: [
            { speaker: 'system', type: 'system', text: 'Every online payment follows a specific route.' },
          ],
        },
        {
          id: 's5-system-3',
          duration: 5500,
          status: 'Travel the right path',
          speaker: 'system',
          bubbles: [
            { speaker: 'system', type: 'system', text: 'To reach the receiver successfully, you must travel through the correct payment system.' },
          ],
        },
        {
          id: 's5-system-cta',
          duration: 5400,
          status: 'Make your prediction',
          speaker: 'system',
          bubbles: [
            { speaker: 'system', type: 'system', text: 'When someone taps Pay, which path do you think the money follows? Don’t overthink — make a prediction.' },
          ],
        },
        {
          id: 's5-prediction',
          hold: true,
          status: 'Pick a path',
          prediction: {
            prompt: 'Which path does ₹500 take after Ritwik presses PAY?',
            options: [
              { id: 'instant', icon: '📱', label: 'App → Receiver instantly', correct: false, hint: 'Feels true — but the app itself never holds the money.' },
              { id: 'bank',    icon: '🏦', label: 'App → Bank → Receiver',     correct: true,  hint: 'Right idea — the bank is the actual money store. Act 2 unpacks how.' },
              { id: 'cloud',   icon: '☁️', label: 'Internet cloud → Receiver',  correct: false, hint: 'The internet carries the signal, not the money itself.' },
              { id: 'qr',      icon: '🔳', label: 'QR code stores the money',   correct: false, hint: 'A QR code is just an address — like a name on an envelope.' },
            ],
          },
        },
        {
          id: 's5-outro',
          duration: 4200,
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
  mom:      { name: 'Mom',      avatar: '👩🏽',  side: 'left',  voice: 'mom' },
  narrator: { name: 'Narrator', avatar: '🎙️',  side: null,    voice: 'narrator' },
  system:   { name: 'System',   avatar: '⚡',  side: 'left',  voice: 'system' },
};
