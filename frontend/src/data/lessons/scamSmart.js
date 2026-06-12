/**
 * Lesson 3 — "Scam Smart"
 * A phone/chat-based scam-awareness game for Indian teenagers.
 *
 * Pure data module. Imported by the React Act components (and safe for the
 * backend seed script to snapshot into Supabase as JSONB). Schema mirrors
 * Lessons 1 & 2: a top-level `lesson` meta object with hero + acts, plus
 * act-specific content exported separately.
 *
 *   act1Hook   — Act 1 group-chat script + phone teaser.
 *   scenarios  — Act 2, 5 branching decision scenarios (each graded).
 *   act3       — Act 3, Priya's 3 scam-pattern cards + the urgency lesson.
 *   act4       — Act 4, 4 timed mini-games + boss level + scoreboard.
 *
 * IDs (lessonId / actId / sceneId / activityId) are wired to the backend
 * scoring config in backend/src/analytics/scoring.js — keep them in sync.
 */

export const lesson = {
  id: 'scam-smart',
  slug: 'scam-smart',
  module: 'Digital Safety & Online Smarts',
  title: 'Scam Smart',
  totalMinutes: 14,
  freeNavigation: true,
  hero: {
    tagline:
      'Deepfakes, OTP traps, fake friends, in-game threats — walk through the exact scams built to catch teenagers, and learn to spot them in real time.',
    character: {
      name: 'Priya',
      avatar: '🛡️',
      age: 16,
    },
    palette: {
      // Cyber-defence vibe — indigo → violet → cyan, distinct from L1 saffron + L2 emerald.
      from: '#6366F1',
      via: '#A855F7',
      to: '#22D3EE',
    },
  },
  acts: {
    act1: {
      id: 'act1',
      title: 'Act 1 — The Hook',
      minutes: 2,
      kind: 'cinematic',
      status: 'live',
    },
    act2: {
      id: 'act2',
      title: 'Act 2 — The Scenarios',
      minutes: 5,
      kind: 'scenarios',
      status: 'live',
    },
    act3: {
      id: 'act3',
      title: 'Act 3 — The Patterns',
      minutes: 3,
      kind: 'concept',
      status: 'live',
    },
    act4: {
      id: 'act4',
      title: 'Act 4 — The Challenge',
      minutes: 4,
      kind: 'challenge',
      status: 'live',
    },
  },
};

/* ============================================================
 *  ACT 1 — THE HOOK
 *  A late-night WhatsApp group chat. Messages reveal one by one
 *  (typing dots → bubble), then a phone-teaser hands off to Act 2.
 * ============================================================ */

export const act1Hook = {
  group: {
    name: 'Squad Goals',
    emoji: '🔥',
    members: ['Aryan', 'Diya', 'Priya', 'Kabir', 'Meera'],
    time: '11:47 PM',
  },
  // Earlier today the group wished Priya a happy birthday — shown INSTANTLY as
  // scroll-up history, so the chat feels like a real ongoing group, not one
  // that started with the scam. (Times are earlier than the 11:47 PM story.)
  history: [
    { from: 'Kabir', avatar: '🧒', side: 'in', color: '#2b7de9', time: '9:30 PM', text: 'HAPPY BIRTHDAY PRIYAAA 🎉🎂🎈' },
    { from: 'Diya',  avatar: '👧', side: 'in', color: '#c2389a', time: '9:31 PM', text: 'happiest bday priya 🥳❤️ have the best year' },
    { from: 'Aryan', avatar: '🧑', side: 'in', color: '#0a8754', time: '9:33 PM', text: 'HBD priya, need party this time 🥳🎉😜🍕' },
    { from: 'Meera', avatar: '🧑', side: 'in', color: '#d97706', time: '9:35 PM', text: 'Happy birthday Priya! 🎊🎉' },
    { from: 'Priya', avatar: '👩', side: 'out', time: '9:42 PM', text: "awww thank you so much you guys 🥹❤️ best squad ever" },
    { from: 'Priya', avatar: '👩', side: 'out', time: '9:43 PM', text: "party this weekend, i'll plan it 🎉" },
  ],
  // `typing` = ms the typing indicator shows before the bubble lands.
  // Priya is the MAIN CHARACTER → her messages are 'out' (right/green, like
  // your own sent messages in WhatsApp). Everyone else is 'in' (left, with
  // avatar + coloured group-sender name).
  messages: [
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 900,  text: 'guys wake up' },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 500,  text: 'WAKE UP RIGHT NOW' },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 700,  text: 'something happened' },
    { from: 'Aryan',  avatar: '🧑', side: 'in',  color: '#0a8754', typing: 1100, text: "bro it's midnight what" },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 1400, text: "my cousin Rohan. he's 16. he saved up 8 months of birthday money — ₹12,000 — to buy a used laptop for his board exam prep" },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 800,  text: "it's gone" },
    { from: 'Diya',   avatar: '👧', side: 'in',  color: '#c2389a', typing: 1200, text: '...what do you mean gone' },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 1500, text: 'he got a message yesterday. said he won a cashback on PhonePe. ₹3,000. looked completely real — the logo, everything.' },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 1400, text: "he clicked the link. typed his details. that's it. they emptied the whole account in 4 minutes." },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 1300, text: "he didn't even tell his parents until today. he thought it was his fault." },
    { from: 'Priya',  avatar: '👩', side: 'out',                  typing: 1400, text: "it wasn't his fault. they're designed to fool people. even adults fall for this." },
    { from: 'Aryan',  avatar: '🧑', side: 'in',  color: '#0a8754', typing: 1000, text: "ok but how? he's not dumb" },
    { from: 'Priya',  avatar: '👩', side: 'out',                  typing: 1500, text: "that's exactly the point. being smart has nothing to do with it. these tricks are built to bypass your brain. they use time pressure. they use fear. they use trust." },
    { from: 'Priya',  avatar: '👩', side: 'out',                  typing: 1400, text: "I can show you exactly how it works. right now. so when it comes for you — and it will — you're ready." },
    { from: 'Kabir',  avatar: '🧒', side: 'in',  color: '#2b7de9', typing: 900,  text: 'do it. i want to understand what happened to him.' },
    { from: 'Diya',   avatar: '👧', side: 'in',  color: '#c2389a', typing: 700,  text: 'same' },
    { from: 'Aryan',  avatar: '🧑', side: 'in',  color: '#0a8754', typing: 700,  text: "let's go" },
  ],
  bridge: [
    'What happened to Rohan happens to thousands of students every week. Now you\'re going to walk through it yourself — and learn to spot it in real time.',
  ],
  teaser: {
    badge: 5,
    line: '5 messages are waiting for you. Some are fine. Some will try to take everything. Can you tell the difference?',
    cta: 'Find out',
  },
};

/* ============================================================
 *  ACT 2 — THE SCENARIOS (5 branching decisions)
 *  Each correct first call earns a Shield (0/5). Wrong choices show
 *  the consequence and allow a retry. `correct:true` on exactly one
 *  choice per scenario.
 * ============================================================ */

export const scenarios = [
  {
    id: 's1',
    sceneId: 'sc-s1',
    activityId: 'a2-s1',
    n: 1,
    title: 'The Famous Face',
    narrate: "Watch this one closely. It looks like Virat Kohli is giving away ₹10,000 — live, right now. The face, the voice, everything feels real. So… what do you do?",
    app: 'youtube',
    header: { channel: 'Virat Kohli Official', tag: '🔴 LIVE', meta: '87 spots left' },
    body: {
      // Channel chrome — looks real at a glance, but the subscriber/age numbers
      // are the quiet tell for anyone who actually checks.
      channel: {
        name: 'Virat Kohli Official',
        handle: '@virat.official.live',
        subs: '200 subscribers',
        videos: '3 videos',
        created: 'Created 4 days ago',
        verifiedLook: true,
        live: true,
        viewers: '24,817 watching',
      },
      headline: 'Giving away ₹10,000 to 100 fans RIGHT NOW — limited time only!',
      thumb: '🏏',
      caption:
        "To celebrate 100M subscribers, I'm giving back to my fans. Click the link, register with your UPI ID, and receive ₹10,000 directly. First 100 fans only.",
      link: 'virat-kohli-giveaway.in/claim',
    },
    thought:
      "That's actually him. The voice. The face. Everything. But... Virat Kohli doing a UPI giveaway on a random link? And why does the channel only have 3 videos?",
    choices: [
      {
        key: 'A',
        label: 'Click the link — 87 spots left, I need to be fast',
        verdict: 'fail',
        feedback:
          "That video was AI-generated. Virat Kohli never made it. Scammers used deepfake technology — AI that can copy anyone's face and voice from existing videos. The channel was created 4 days ago. Real celebrities don't do giveaways through random links. Your UPI PIN was the only thing they needed.",
        loss: '₹4,500 debited from your account.',
      },
      {
        key: 'B',
        label: 'Check the channel details before doing anything',
        verdict: 'win',
        feedback:
          "Channel created 4 days ago. 3 videos. 200 subscribers. Virat Kohli's real channel has been active for years with tens of millions of subscribers. This was a deepfake — an AI-generated video designed to look and sound exactly like a real person. One check. Entire scam exposed.",
        redFlags: [
          'New channel with very few videos',
          'Asking for UPI ID or PIN through an external link',
          'Urgency — "only X spots left"',
          'Real celebrities never do giveaways through random links',
        ],
      },
      {
        key: 'C',
        label: 'Share with friends so they can claim too',
        verdict: 'fail',
        feedback:
          "You just sent a deepfake scam to everyone you know. Two of your friends clicked it. Scammers build fake urgency — 'only 87 spots' — specifically so you share it before thinking.",
      },
    ],
  },
  {
    id: 's2',
    sceneId: 'sc-s2',
    activityId: 'a2-s2',
    n: 2,
    title: 'The Threat',
    narrate: "A threat just landed in your DMs. It's meant to scare you into acting fast — that's exactly the trick. Read it carefully, then decide your move.",
    app: 'instagram',
    header: { channel: '@user_2847361', tag: 'Unknown', meta: 'DM · Evening' },
    body: {
      caption:
        "we have something of yours. photos and a video. we used AI to make them look very bad. if you don't send ₹2,000 to this UPI in 2 hours we send it to your school principal and all your classmates. don't tell anyone or it gets worse.",
    },
    thought:
      'I haven\'t done anything. But what if people believe it? What if the school sees it? They said don\'t tell anyone.',
    choices: [
      {
        key: 'A',
        label: 'Pay the ₹2,000 — make it go away',
        verdict: 'fail',
        feedback:
          "This is exactly what always happens. Paying tells them it's working. They don't stop — they ask for more. The content they threatened you with? Almost certainly AI-generated and fake. They send the same message to hundreds of students. Paying never ends it.",
        loss: 'One hour later: "good. now send ₹5,000 more or the video goes out anyway."',
      },
      {
        key: 'B',
        label: 'Tell a parent or trusted adult immediately',
        verdict: 'win',
        feedback:
          'You show it to a parent. They help you report the account and block it. The "evidence" never appears — because it didn\'t exist. This scam is called sextortion. It targets teenagers specifically. Telling a trusted adult is not weakness — it\'s the exact right move. You have done nothing wrong. The shame belongs entirely to them.',
        redFlags: [
          'The photos/videos they claim to have are almost always AI-generated fakes',
          'They send this same threat to hundreds of people — it\'s a template',
          'Paying never makes it stop — it makes it worse',
          'You cannot handle this alone — and you shouldn\'t have to',
        ],
      },
      {
        key: 'C',
        label: 'Reply and ask them to stop',
        verdict: 'fail',
        feedback:
          "Don't engage. Every reply tells them the account is active and the person is scared. They use that to push harder. Silence and reporting is stronger than any reply.",
      },
    ],
  },
  {
    id: 's3',
    sceneId: 'sc-s3',
    activityId: 'a2-s3',
    n: 3,
    title: 'The Accidental Code',
    narrate: "Two messages, back to back. A verification code came to your phone, and a friendly stranger says it was a mistake — could you just send it over? Think before you tap.",
    app: 'sms',
    header: { channel: 'Two messages', tag: 'arrived', meta: 'back to back' },
    body: {
      otp: 'Garena (Automated) — Your Free Fire verification code is: 847291. Do not share this code with anyone.',
      caption:
        "+91 87654 32109 (Unknown): Hi sorry to bother you! I think I accidentally entered your number when signing up for Free Fire. The OTP came to you by mistake. Could you please send it? I'll be forever grateful 🙏 It's urgent I finish setup",
    },
    thought:
      '847291... that code came to MY phone though. Why would their account send to me? They seem nice. But. Wait.',
    choices: [
      {
        key: 'A',
        label: 'Send the code — they seem genuine, it was their mistake',
        verdict: 'fail',
        feedback:
          "They went to Free Fire's login page and typed YOUR username. Free Fire sent a verification code — to YOU, the real owner. They pretended it was a mistake. That code was the key to YOUR account. There is no 'accidental number'. That story doesn't exist.",
        loss: 'New login to your Free Fire account from an unknown device. All items transferred.',
      },
      {
        key: 'B',
        label: 'Ignore both messages',
        verdict: 'win',
        feedback:
          'Nothing happens. Account untouched. The unknown number goes silent. OTPs only go to the account owner\'s registered number. If the code came to you — the account is yours. This is the most used trick to steal gaming accounts. You just blocked it completely.',
        redFlags: [
          'An OTP came to YOU — so the account is YOURS',
          '"I entered your number by mistake" is a scripted lie',
          'Nobody legitimate ever needs your OTP',
        ],
      },
      {
        key: 'C',
        label: 'Ask them to just sign up again with their own number',
        verdict: 'fail',
        feedback:
          'Engaging keeps the door open — they\'ll keep inventing reasons. The only safe move is to ignore. The OTP is yours; there\'s nothing to discuss.',
      },
    ],
  },
  {
    id: 's4',
    sceneId: 'sc-s4',
    activityId: 'a2-s4',
    n: 4,
    title: 'Your "Friend" Needs Help',
    narrate: "It says it's Kabir — your friend — texting from a number you don't recognise. He's panicking, mid-ranked-match, and needs an OTP right now. Feel that urge to help?",
    app: 'whatsapp',
    header: { channel: '+91 90000 11234', tag: 'Not saved', meta: 'WhatsApp' },
    body: {
      caption:
        "hey it's kabir!! borrowing my neighbour's phone mine died. i was logging into garena on my laptop and the otp came to your number somehow?? idk why. send it quick i'm in a ranked match with my team please bro we need you 🙏🙏",
    },
    thought:
      "Kabir. Ranked match. He'd be panicking. But this isn't his number. And why would his OTP come to me? Wait — didn't I just see this same setup?",
    choices: [
      {
        key: 'A',
        label: 'Send it — Kabir is my friend, I trust him',
        verdict: 'fail',
        feedback:
          "Someone found out your friend's name and used it. That's all it took. They knew you'd trust Kabir. So they became Kabir. The name was real. The number wasn't.",
        loss: 'You call Kabir\'s real number — he\'s home watching cricket. His phone never left his side.',
      },
      {
        key: 'B',
        label: 'Call Kabir on his real saved number first',
        verdict: 'win',
        feedback:
          'You call his saved number. He picks up in two rings: "Hello? Bro what are you on about? I\'m home." You block the unknown number. One phone call. That\'s the entire defence. When a "friend" contacts you from an unknown number asking for something urgently — call the real number first. Always.',
        redFlags: [
          'A "friend" messaging from an unknown / not-saved number',
          'Their OTP "came to your number" — impossible',
          'Urgency + emotion ("ranked match", "please bro")',
          'One call to their real number ends it',
        ],
      },
      {
        key: 'C',
        label: 'Send it, but ask for proof it\'s him',
        verdict: 'fail',
        feedback:
          "They'll just say 'I told you, it's Kabir, just send it.' Asking for proof in a panic rarely works — they'll have an answer. The only real verification is calling his actual number.",
      },
    ],
  },
  {
    id: 's5',
    sceneId: 'sc-s5',
    activityId: 'a2-s5',
    n: 5,
    title: 'The In-Game Threat',
    narrate: "You're mid-match. An 'official security team' says your account will be permanently banned in 15 minutes unless you verify with your password. Two years of progress on the line. Breathe — and choose.",
    app: 'bgmi',
    header: { channel: 'BGMI_SECURITY_OFFICIAL', tag: 'In-game inbox', meta: 'Mid-match' },
    body: {
      caption:
        'Urgent: Our system has detected third-party software linked to your UID. As per policy, your account will be permanently banned in 15 minutes unless you verify your identity. Reply with your email and password to the security team immediately. — Krafton Verification Team',
    },
    thought:
      "Banned. 15 minutes. I've spent two years on this account. I haven't done anything. But what if they made a mistake? Wait. Would real Krafton staff ever...?",
    choices: [
      {
        key: 'A',
        label: 'Send email and password — I don\'t want to lose my account',
        verdict: 'fail',
        feedback:
          'There was no investigation. No software detected. No ban. The threat was fiction. The urgency was the weapon. Krafton has full access to their own servers. They will NEVER need your password. No real company ever will.',
        loss: 'New login from Jakarta. UC balance: 0. All skins removed. Account email changed. Locked out.',
      },
      {
        key: 'B',
        label: 'Send just the email — not the password',
        verdict: 'fail',
        feedback:
          "They now know your email. They'll try it on 10 other sites. Partial information is still information. Half a key can still open a lock.",
      },
      {
        key: 'C',
        label: 'Close this, report the account, keep playing',
        verdict: 'win',
        feedback:
          "Match continues. Account untouched. This is the hardest one — the stakes feel real. But Krafton would never ban you through an in-game message and demand your password. If you were genuinely flagged, they'd act from their systems — silently. The moment someone asks for your password, the answer is always no.",
        redFlags: [
          'Official "team" asking for your password',
          '"Permanent ban in 15 minutes" — manufactured urgency',
          'Real companies act from their own systems, silently',
        ],
      },
    ],
  },
];

/* ============================================================
 *  ACT 3 — PRIYA EXPLAINS THE PATTERNS
 *  3 scam cards reveal one by one, then the "urgency" throughline.
 * ============================================================ */

export const act3 = {
  intro: [
    { from: 'Priya', avatar: '👩', text: 'ok. you just walked through 5 scenarios. real ones. messages that get sent to thousands of students every single day.' },
    { from: 'Priya', avatar: '👩', text: "some of you got all of them. some didn't. both are fine. that's what this is for — so it happens here first." },
    { from: 'Priya', avatar: '👩', text: "now let me show you the patterns underneath all of it. once you see them, you'll never unsee them." },
  ],
  cards: [
    {
      id: 'deepfake',
      icon: '🤖',
      title: 'Deepfakes & AI Scams',
      tagline: 'If you can see it and hear it — it still might not be real.',
      how: 'AI copies a real person\'s face and voice → creates a convincing video or audio clip → you trust it because it looks genuine → you click a link or send money → they take everything.',
      redFlags: [
        'Famous person doing a giveaway through an external link',
        'Channel or account is very new with very few posts',
        'Asking for UPI PIN or password to "receive" money',
        'Urgency — "only X spots left," "expires in 10 minutes"',
        'Threatening messages claiming to have photos or videos of you',
      ],
      example: 'Fake Arjun Nair video on YouTube: "Invest ₹500, I\'ll send ₹2,000 back. Tap the link below." Channel created 6 days ago. 2 videos.',
      doThis: [
        'Check the channel or account age before trusting any video',
        'Real celebrities never do giveaways through random links or ask for your PIN',
        'If someone threatens you with AI content — tell a trusted adult. Do not pay.',
      ],
    },
    {
      id: 'otp',
      icon: '🔢',
      title: 'OTP Scams',
      tagline: 'One code. One mistake. Everything gone.',
      how: 'Scammer tries to log into YOUR account → your phone gets the OTP → they contact you pretending to be someone else → you hand them the key → they walk straight in.',
      redFlags: [
        'Anyone asking you to share an OTP — for any reason',
        '"I sent it to you by mistake"',
        '"Account will be locked in 5 minutes"',
        '"Support team" on WhatsApp or Telegram asking for OTP',
        '"Friend" messaging from an unknown number',
      ],
      example: 'Garena Support (Unknown Number): "Unusual login on your account. Reply with OTP to verify it\'s you." The real Garena sent that code to protect you. They will NEVER ask you to send it back.',
      doThis: [
        'NEVER share your OTP with anyone',
        'Not a stranger. Not a "friend." Not "support." Not a "bank official."',
        'No company. No game. No human. Ever.',
      ],
    },
    {
      id: 'gaming',
      icon: '🎮',
      title: 'Gaming & Social Media Scams',
      tagline: 'They know what you love. They use it against you.',
      how: 'Free currency or followers offered → fake "official" account or admin → asks for login "to deliver the gift" OR sends a threat about your account being banned.',
      redFlags: [
        'Free V-Bucks, Robux, Diamonds, followers — anything that costs real money',
        '"Admin" messaging you in-game or on Instagram',
        '"Your account has been reported — verify in 24 hours"',
        'Asking for username AND password "to gift you"',
        '"Download this mod for unlimited coins"',
      ],
      example: 'Instagram DM from @insta_verify_team_official: "Your account has been flagged. Verify here in 24 hours or it will be deleted." Instagram\'s real warnings appear inside the app — never through a DM with an external link.',
      doThis: [
        'Free currency generators don\'t exist. Never have.',
        'Real platforms send warnings inside the app — not through unknown DMs',
        'If someone needs your login to "give" you something — they\'re taking, not giving',
      ],
    },
  ],
  urgency: {
    lines: [
      'one thing is underneath all of this. every single scenario.',
      'urgency.',
      '"5 minutes." "87 spots left." "Permanent ban." "Quick bro." "2 hours or we send it."',
      'that feeling of rush — the slight panic in your chest — that is not a reason to act faster. that is the warning. that feeling IS the trick.',
      'whenever something feels urgent and you didn\'t start it — stop completely. that pause is your defence.',
    ],
    outro: [
      { from: 'Kabir', avatar: '🧒', text: "i'm sending this to Rohan" },
      { from: 'Priya', avatar: '👩', text: 'yeah. send it.' },
    ],
    cta: 'Test yourself',
  },
};

/* ============================================================
 *  ACT 4 — THE CHALLENGE ROUND
 *  4 timed mini-games + a boss level + the scoreboard/badge.
 * ============================================================ */

export const act4 = {
  intro: {
    title: 'Scam Detective — Level Unlocked',
    sub: 'You learned the patterns. Now use them under pressure.',
    meta: 'Grade: Hard · Score enough points — earn the Scam Proof Badge.',
    host: "Alright — this is where it counts. Four timed challenges, then a boss level with no hints. Trust what you've learned. Spot the fakes, and you'll walk away Scam Proof.",
    cta: 'Start the challenge',
  },

  // ── Mini-game 1 — Spot the fake link ──────────────────────
  mg1: {
    id: 'mg1',
    sceneId: 'sc-mg1',
    activityId: 'a4-mg1',
    title: 'Spot the Fake Link',
    prompt: '3 links are on screen. 1 is real. 2 are fake. Tap the real one.',
    seconds: 15,
    points: 20,
    options: [
      { id: 'A', url: 'phonepe.com/cashback/offer22', real: true },
      { id: 'B', url: 'ph0nepe-rewards.in/claim', real: false },
      { id: 'C', url: 'phonepe-support-helpline.net/verify', real: false },
    ],
    explain: [
      'A uses the real domain: phonepe.com',
      "B has a zero instead of 'o' — classic phishing",
      'C adds extra words to a fake domain — another phishing trick',
    ],
  },

  // ── Mini-game 2 — Real or Scam? (speed round) ─────────────
  mg2: {
    id: 'mg2',
    sceneId: 'sc-mg2',
    activityId: 'a4-mg2',
    title: 'Real or Scam? — Speed Round',
    prompt: '7 messages flash by one at a time. Tap REAL or SCAM.',
    secondsEach: 8,
    correctPoints: 15,
    wrongPoints: -10,
    messages: [
      { id: 'm1', from: 'SBI (Automated)', text: 'Your account statement for April is ready. Log in at onlinesbi.sbi to view.', answer: 'REAL', explain: 'onlinesbi.sbi is SBI\'s actual domain. No link to click, no urgency.' },
      { id: 'm2', from: 'amazon-orders@amaz0n-india.co', text: 'Your package is delayed. Confirm address: amazon-delivery-verify.net', answer: 'SCAM', explain: 'Zero in "amaz0n", fake domain, "confirm address" is a phishing hook.' },
      { id: 'm3', from: '+91 73829 10234 (Unknown)', text: 'Hi, I sent an OTP to your number by mistake. Could you forward it? 6 digits, just arrived.', answer: 'SCAM', explain: 'Classic OTP theft. OTPs only go to the real account owner.' },
      { id: 'm4', from: 'Swiggy (Automated)', text: 'Your order #4821 is out for delivery. Track at swiggy.com/track', answer: 'REAL', explain: 'Real domain, no login requested, no urgency.' },
      { id: 'm5', from: 'FREE_FIRE_ADMIN_2024', text: 'Your account has been selected for 10,000 Diamond reward. Login to claim: ff-diamonds-real.com', answer: 'SCAM', explain: 'Fake admin name, external link, free diamonds don\'t exist.' },
      { id: 'm6', from: 'HDFC Bank (Automated)', text: 'OTP for your transaction: 294817. Valid for 10 minutes. Do NOT share with anyone.', answer: 'REAL', explain: 'Automated OTP to the account owner. No link. No request. This is what a real OTP looks like.' },
      { id: 'm7', from: '@cricket_virat_official_gifts', text: 'Birthday gift! ₹5,000 to 500 fans! Claim here → virat-bday-gift.in/claim ⏰ Only 43 spots left!', answer: 'SCAM', explain: 'Deepfake giveaway. New account, external link, fake urgency, asks for UPI details.' },
    ],
  },

  // ── Mini-game 3 — What's wrong here? ──────────────────────
  mg3: {
    id: 'mg3',
    sceneId: 'sc-mg3',
    activityId: 'a4-mg3',
    title: "What's Wrong Here?",
    prompt: 'This email is fake. Find the 4 things wrong with it. Tap each one.',
    seconds: 30,
    points: 40,
    email: {
      from: 'sbi-securityteam@sbi-custservice.org',
      subject: '⚠️ Urgent: Your account has been frozen',
      // `flag` marks a tappable wrong-thing; `id` ties to the explanation.
      lines: [
        { text: 'Dear Customer,' },
        { text: 'We have detected suspicious activty in your account. Your account has been temporarly frozen.', flag: 'spelling', label: 'Spelling mistakes — "activty", "temporarly"' },
        { text: 'Click here to unfreeze: sbi-account-unfreeze-now.com/verify', flag: 'link', label: 'Fake phishing link — not SBI\'s real domain' },
        { text: 'You must act within 1 hour or your account will be permanently closed.', flag: 'urgency', label: 'Manufactured urgency — "1 hour or permanent closure"' },
        { text: '— SBI Customer Security Team' },
      ],
      // The from-address is its own tappable zone.
      fromFlag: { flag: 'domain', label: 'Sender domain — sbi-custservice.org is not SBI\'s real domain (onlinesbi.sbi)' },
    },
    flags: ['domain', 'spelling', 'link', 'urgency'],
  },

  // ── Mini-game 4 — What do you do now? (match) ─────────────
  mg4: {
    id: 'mg4',
    sceneId: 'sc-mg4',
    activityId: 'a4-mg4',
    title: 'What Do You Do Now?',
    prompt: 'Match each situation to the correct response.',
    points: 50,
    situations: [
      { id: '1', text: 'You got an OTP you didn\'t request' },
      { id: '2', text: 'A friend texts from an unknown number asking for help urgently' },
      { id: '3', text: 'You clicked a link and realise it was fake — you already typed your password' },
      { id: '4', text: 'You receive a "You\'ve won ₹5,000" message' },
      { id: '5', text: 'Someone threatens to share AI-generated content of you unless you pay' },
    ],
    responses: [
      { id: 'A', text: 'Ignore the message. Don\'t reply. Don\'t forward.' },
      { id: 'B', text: 'Call your friend on their real saved number before doing anything.' },
      { id: 'C', text: 'Change your password immediately on every account that uses it. Tell a parent now.' },
      { id: 'D', text: 'Delete it. You never entered a contest. It isn\'t real.' },
      { id: 'E', text: 'Tell a trusted adult immediately. Do not pay. Block and report.' },
    ],
    answer: { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' },
  },

  // ── Boss level — open text answer ─────────────────────────
  boss: {
    id: 'boss',
    sceneId: 'sc-boss',
    activityId: 'a4-boss',
    title: 'The Boss Level',
    sub: 'One full scenario. No hints. This is the real test.',
    points: 50,
    setup: 'Late evening. You\'re studying. Two messages arrive at once.',
    messages: [
      { app: 'youtube', from: 'Arjun Nair Fans Official', tag: '🔴 LIVE', text: 'Surprise! Giving ₹8,000 to 200 subscribers RIGHT NOW to celebrate retirement anniversary!' },
      { app: 'whatsapp', from: '+91 94827 10293 (Unknown)', tag: 'Not saved', text: 'Bro did you see this Arjun Nair giveaway?? I already registered and it\'s asking for a friend referral — use my link and we BOTH get extra. hurry only 12 spots → arjun-nair-gift.in/refer' },
    ],
    thought: 'Two messages at once. A "friend" I don\'t recognise pushing the same link. A countdown. Something about this feels coordinated.',
    question: 'What are the red flags here, and what do you do? (2 sentences)',
    placeholder: 'Type your answer…',
    // Award full marks when the answer touches these idea-groups.
    keywords: [
      ['deepfake', 'fake channel', 'fake', 'ai', 'not real'],
      ['don\'t click', 'dont click', 'ignore', 'not click', 'avoid the link', 'won\'t click'],
      ['verify', 'check', 'real channel', 'report', 'directly'],
    ],
    keyLabels: [
      "Recognised it's a deepfake / fake celebrity",
      "Wouldn't click the link",
      'Verify the real channel + report it',
    ],
    model:
      'This is a coordinated scam — a deepfake celebrity giveaway backed by a fake "friend" account to create extra pressure and urgency. Red flags: unknown YouTube channel, external link, unknown number pushing the same link, countdown timer, UPI registration. You ignore both messages, check the real Arjun Nair channel directly, and report both accounts.',
  },

  // ── Scoreboard tiers (by total points; mg + boss ≈ 0–200) ──
  scoreboard: [
    { min: 150, shields: 5, verdict: 'Scam Proof', sub: 'They won\'t get through you.', tier: 'platinum', badge: '🏆' },
    { min: 100, shields: 4, verdict: 'Sharp Eyes', sub: 'You caught most of it. Find the one that slipped and lock it down.', tier: 'gold', badge: '🥇' },
    { min: 60,  shields: 3, verdict: 'Getting Wired', sub: 'The patterns are starting to click. One more round and nothing gets past you.', tier: 'silver', badge: '🥈' },
    { min: 0,   shields: 1, verdict: 'Not Yet — But That\'s the Point', sub: 'This is exactly why you play here first, before it\'s real. Go again.', tier: 'bronze', badge: '🛡️' },
  ],

  rules: [
    'Links in messages → ignore. Go to the official app yourself.',
    'OTP is for your eyes only. No one — ever — has a valid reason to ask for it.',
    'No company, admin, or support team needs your password. If they ask, they\'re not real.',
    'Deepfake videos look and sound real. Check the channel age. Real celebrities don\'t do UPI giveaways.',
    'When something feels urgent and you didn\'t start it — that feeling is the warning. Stop. Think. Then decide.',
  ],

  ifItHappens: [
    'Tell a parent or trusted adult immediately — not tomorrow, now.',
    'Don\'t delete any messages — they\'re evidence.',
    'Report the number or account on the platform.',
    'If you shared a password — change it on every account that uses it, right now.',
    'If someone is threatening you — you have done nothing wrong. Tell an adult. Do not pay.',
  ],

  helpline: { phone: '1930', label: 'National Cyber Crime Helpline', site: 'cybercrime.gov.in' },

  final: [
    'Rohan lost ₹12,000. Eight months of saving. He didn\'t do anything wrong. He just didn\'t know what you know now.',
    'Scammers study teenagers. They know what you love — your game account, your Instagram, your money, your reputation. They build the exact message designed to catch you mid-thought, mid-match, mid-panic.',
    'AI has made their fakes look more real than ever. But you\'ve now been inside it. You know what fake urgency feels like. You\'ve seen how every trick is built.',
    'That knowledge doesn\'t expire. Use it.',
  ],
  closer: 'You are not just someone who knows about scams. You are someone who cannot be scammed.',
};
