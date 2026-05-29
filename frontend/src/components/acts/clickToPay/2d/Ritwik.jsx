import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Ritwik v4 — 15-16 year old Indian teen boy.
 *
 * Per user feedback (2026-05-29): full proper hair covering the whole
 * head (no more "half-cut" cap), stylish modern hoodie with colour
 * panel + graphic, thicker legs (not stick figures), bigger phone in
 * hand, more responsive lip-sync that visibly opens/closes with audio
 * amplitude, and stronger pupil-tracking so he actually looks at Mom
 * while she speaks.
 */
export default function Ritwik({
  speaking = false,
  amplitudeRef,
  emotion = 'neutral',
  lookAt = 'forward',
  className = '',
}) {
  const [mouthLevel, setMouthLevel] = useState(0);
  const [blink, setBlink] = useState(false);

  /* Lip-sync — faster response, no hysteresis lag. Re-evaluates every
   * frame and switches mouth shape as soon as amplitude crosses a
   * level boundary (min 60 ms hold so it doesn't chatter). This is
   * what gives speaking faces a visibly "moving" mouth. */
  useEffect(() => {
    if (!speaking) { setMouthLevel(0); return undefined; }
    let raf = 0;
    let smoothed = 0;
    let lastSwitch = 0;
    let lastLevel = -1;
    const tick = (now) => {
      const raw = amplitudeRef?.current ?? 0;
      const boosted = Math.min(1, Math.max(0, (raw - 0.03) * 3.0));
      // Asymmetric smoothing: open fast, close a little slower
      const alpha = boosted > smoothed ? 0.65 : 0.30;
      smoothed = smoothed * (1 - alpha) + boosted * alpha;
      const desired = smoothed > 0.55 ? 3 : smoothed > 0.28 ? 2 : smoothed > 0.10 ? 1 : 0;
      if (desired !== lastLevel && now - lastSwitch > 60) {
        lastSwitch = now;
        lastLevel = desired;
        setMouthLevel(desired);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, amplitudeRef]);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 4500 + Math.random() * 3000);
    return () => clearInterval(id);
  }, []);

  // Stronger eye gaze — visible turn toward whoever's speaking.
  const eyeOffset = lookAt === 'left' ? -4 : lookAt === 'right' ? 4 : 0;
  // Head also turns slightly toward the speaker
  const headTilt = lookAt === 'left' ? -3 : lookAt === 'right' ? 3 : 0;
  const brow = browFor(emotion);
  const mouthDef = mouthShape(emotion, mouthLevel);

  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative ${className}`}
    >
      <svg viewBox="0 0 240 440" className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="rk4-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#EFC097" />
            <stop offset="100%" stopColor="#D49E72" />
          </linearGradient>
          {/* Stylish modern hoodie — teal/cyan body with darker side panels */}
          <linearGradient id="rk4-hoodie" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="rk4-hoodie-panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#0F1F33" />
          </linearGradient>
          {/* Dark thick hair */}
          <linearGradient id="rk4-hair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2A1810" />
            <stop offset="60%"  stopColor="#1A0E08" />
            <stop offset="100%" stopColor="#0A0604" />
          </linearGradient>
          <linearGradient id="rk4-hair-hi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#4A2818" />
            <stop offset="100%" stopColor="#2A1810" />
          </linearGradient>
          <linearGradient id="rk4-jeans" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2A3950" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <radialGradient id="rk4-cheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#E88B6C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E88B6C" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* SHADOW under feet */}
        <ellipse cx="120" cy="424" rx="58" ry="7" fill="#000" opacity="0.25" />

        {/* === LEGS — thicker, properly shaped jeans === */}
        <path d="M 92 290 L 86 410 Q 86 416 92 416 L 116 416 Q 122 416 122 410 L 124 290 Z" fill="url(#rk4-jeans)" />
        <path d="M 116 290 L 118 410 Q 118 416 124 416 L 148 416 Q 154 416 154 410 L 148 290 Z" fill="url(#rk4-jeans)" />
        {/* Knee fold accent */}
        <path d="M 88 340 Q 100 344 122 340" stroke="#0F172A" strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M 122 340 Q 134 344 152 340" stroke="#0F172A" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Jeans seam */}
        <line x1="120" y1="290" x2="120" y2="410" stroke="#0F172A" strokeWidth="0.6" opacity="0.5" />

        {/* === SHOES — modern white sneakers with cyan accent === */}
        <path d="M 82 410 L 124 410 L 126 420 Q 126 424 122 424 L 84 424 Q 80 424 80 420 Z" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.2" />
        <path d="M 80 418 L 126 418 L 126 423 L 80 423 Z" fill="#0EA5E9" />
        <path d="M 100 410 L 104 410 L 104 418 L 100 418 Z" fill="#E5E7EB" />
        {/* Right shoe */}
        <path d="M 116 410 L 158 410 L 160 420 Q 160 424 156 424 L 118 424 Q 114 424 114 420 Z" fill="#FFFFFF" stroke="#1A1426" strokeWidth="1.2" />
        <path d="M 114 418 L 160 418 L 160 423 L 114 423 Z" fill="#0EA5E9" />
        <path d="M 134 410 L 138 410 L 138 418 L 134 418 Z" fill="#E5E7EB" />

        {/* === TORSO — stylish hoodie with side colour panels === */}
        {/* Main body */}
        <path d="M 76 170 Q 76 154 96 148 L 144 148 Q 164 154 164 170 L 172 295 L 68 295 Z"
              fill="url(#rk4-hoodie)" stroke="#075985" strokeWidth="1.8" />
        {/* Side colour panels — dark teal */}
        <path d="M 76 180 L 80 290 L 100 290 L 96 180 Z" fill="url(#rk4-hoodie-panel)" opacity="0.95" />
        <path d="M 164 180 L 160 290 L 140 290 L 144 180 Z" fill="url(#rk4-hoodie-panel)" opacity="0.95" />
        {/* Hoodie kangaroo pocket */}
        <path d="M 92 220 Q 120 232 148 220 L 146 254 Q 120 264 94 254 Z"
              fill="url(#rk4-hoodie-panel)" opacity="0.9" />
        <line x1="120" y1="226" x2="120" y2="260" stroke="#0F1F33" strokeWidth="0.8" opacity="0.6" />
        {/* Graphic on chest — abstract circuit / brand mark */}
        <g transform="translate(105 190)">
          <rect width="30" height="20" rx="3" fill="#FDE047" opacity="0.9" />
          <text x="15" y="14" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1E3A5F">RW.</text>
        </g>
        {/* Hood collar/opening */}
        <path d="M 92 156 Q 120 170 148 156 L 152 148 L 88 148 Z"
              fill="#0F1F33" opacity="0.85" />
        {/* Back of hood peeking up */}
        <path d="M 88 148 Q 100 134 120 134 Q 140 134 152 148 Q 144 140 120 140 Q 96 140 88 148 Z"
              fill="#0369A1" opacity="0.95" />
        {/* DRAWSTRINGS */}
        <line x1="110" y1="168" x2="106" y2="206" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="130" y1="168" x2="134" y2="206" stroke="#F1F5F9" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="106" cy="208" r="3" fill="#F1F5F9" />
        <circle cx="134" cy="208" r="3" fill="#F1F5F9" />

        {/* === ARMS === */}
        <path d="M 76 170 Q 58 220 52 268 Q 52 276 58 278 L 70 280 L 76 220 Z" fill="url(#rk4-hoodie)" stroke="#075985" strokeWidth="1.5" />
        <path d="M 164 170 Q 182 220 188 268 Q 188 276 182 278 L 170 280 L 164 220 Z" fill="url(#rk4-hoodie)" stroke="#075985" strokeWidth="1.5" />
        {/* Sleeve cuffs */}
        <rect x="56" y="270" width="14" height="6" rx="2" fill="url(#rk4-hoodie-panel)" />
        <rect x="170" y="270" width="14" height="6" rx="2" fill="url(#rk4-hoodie-panel)" />
        {/* HANDS */}
        <circle cx="63" cy="280" r="10" fill="url(#rk4-skin)" stroke="#A06B40" strokeWidth="1.2" />
        <circle cx="177" cy="280" r="10" fill="url(#rk4-skin)" stroke="#A06B40" strokeWidth="1.2" />
        {/* === BIGGER PHONE in right hand === */}
        <g transform="rotate(-10 188 285)">
          <rect x="172" y="270" width="22" height="36" rx="4" fill="#0F172A" stroke="#374151" strokeWidth="1.2" />
          <rect x="174" y="276" width="18" height="26" rx="2" fill="#0EA5E9" />
          {/* Phone screen content — fake app grid */}
          <rect x="176" y="278" width="14" height="22" fill="#5F259F" opacity="0.7" />
          <circle cx="183" cy="289" r="3" fill="#FDE047" />
          {/* Camera dot */}
          <circle cx="183" cy="273" r="0.8" fill="#374151" />
        </g>

        {/* === NECK === */}
        <rect x="108" y="138" width="24" height="14" fill="url(#rk4-skin)" />
        <path d="M 108 142 Q 120 150 132 142" stroke="#A06B40" strokeWidth="0.8" fill="none" />

        {/* === HEAD + face — with subtle gaze-direction tilt === */}
        <g style={{ transformOrigin: '120px 100px' }} transform={`rotate(${headTilt})`}>
          {/* Head oval */}
          <path d="M 82 90 Q 78 48 120 44 Q 162 48 158 90 L 156 118 Q 152 142 120 144 Q 88 142 84 118 Z"
                fill="url(#rk4-skin)" stroke="#A06B40" strokeWidth="1.2" />
          {/* Jawline shadow */}
          <path d="M 86 118 Q 120 140 154 118" stroke="#A06B40" strokeWidth="0.8" fill="none" opacity="0.5" />
          <ellipse cx="120" cy="136" rx="6" ry="3" fill="#F2C9A0" opacity="0.6" />

          {/* Ears */}
          <ellipse cx="82" cy="100" rx="5" ry="10" fill="url(#rk4-skin)" stroke="#A06B40" strokeWidth="0.8" />
          <ellipse cx="158" cy="100" rx="5" ry="10" fill="url(#rk4-skin)" stroke="#A06B40" strokeWidth="0.8" />
          <path d="M 81 98 Q 83 104 81 110" stroke="#A06B40" strokeWidth="0.6" fill="none" />
          <path d="M 159 98 Q 157 104 159 110" stroke="#A06B40" strokeWidth="0.6" fill="none" />

          {/* === FULL HAIR — covers the ENTIRE top of the head. Layered
             for volume + a textured modern teen cut. Side-swept with
             multiple visible strands. === */}
          {/* Back layer — fills the whole skull cap */}
          <path d="M 78 90 Q 70 36 110 28 Q 120 25 130 28 Q 170 36 162 90
                   L 162 60 Q 158 38 120 36 Q 82 38 78 60 Z"
                fill="url(#rk4-hair)" />
          {/* Top mass — full volume above the head */}
          <path d="M 80 70 Q 78 30 120 26 Q 162 30 160 70
                   Q 160 50 152 42 Q 138 32 120 32 Q 102 32 88 42 Q 80 50 80 70 Z"
                fill="url(#rk4-hair-hi)" />
          {/* Right-to-left side-swept fringe — bigger, covers forehead in a stylish sweep */}
          <path d="M 82 62 Q 90 76 100 64 Q 105 78 116 60 Q 122 76 134 58
                   Q 142 74 154 58 Q 158 70 160 64
                   L 160 90 Q 122 96 80 90 Z"
                fill="url(#rk4-hair)" />
          {/* Long swept strand crossing the forehead — the "modern teen" signature */}
          <path d="M 142 42 Q 122 64 100 80 Q 96 84 98 88" stroke="url(#rk4-hair)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 142 42 Q 122 64 100 80" stroke="#3E2818" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* Spiky tufts at the top for texture */}
          <path d="M 100 30 L 96 22 L 105 28 Z" fill="url(#rk4-hair)" />
          <path d="M 118 26 L 114 18 L 124 26 Z" fill="url(#rk4-hair)" />
          <path d="M 134 28 L 138 20 L 144 30 Z" fill="url(#rk4-hair)" />
          {/* Hair shine highlights */}
          <path d="M 96 42 Q 110 36 124 38" stroke="#5A3A28" strokeWidth="1.5" fill="none" opacity="0.7" />
          <path d="M 130 44 Q 142 40 152 46" stroke="#5A3A28" strokeWidth="1.2" fill="none" opacity="0.6" />
          {/* Side hair coming down past ears */}
          <path d="M 78 80 Q 76 100 80 115" stroke="url(#rk4-hair)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 162 80 Q 164 100 160 115" stroke="url(#rk4-hair)" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* CHEEKS */}
          <circle cx="100" cy="108" r="6" fill="url(#rk4-cheek)" />
          <circle cx="140" cy="108" r="6" fill="url(#rk4-cheek)" />

          {/* === EYEBROWS === */}
          <motion.path
            animate={{
              d: `M ${94 - brow.tiltL} ${88 + brow.lift} Q 104 ${85 + brow.lift + brow.tiltL} 114 ${89 + brow.lift}`,
            }}
            transition={{ duration: 0.25 }}
            stroke="#1A0E08" strokeWidth="3.5" strokeLinecap="round" fill="none"
          />
          <motion.path
            animate={{
              d: `M ${126 + brow.tiltR} ${89 + brow.lift} Q 136 ${85 + brow.lift + brow.tiltR} 146 ${88 + brow.lift}`,
            }}
            transition={{ duration: 0.25 }}
            stroke="#1A0E08" strokeWidth="3.5" strokeLinecap="round" fill="none"
          />

          {/* === EYES — bigger so they read on stage === */}
          <g>
            <motion.ellipse
              cx="104" cy="100" rx="8.5"
              animate={{ ry: blink ? 0.4 : 6.5 }}
              transition={{ duration: 0.08 }}
              fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
            />
            {!blink && (
              <>
                <ellipse cx={104 + eyeOffset} cy="100" rx="5" ry="5.5" fill="#3B2A1A" />
                <circle cx={104 + eyeOffset} cy="100" r="2.8" fill="#0A0604" />
                <circle cx={105 + eyeOffset} cy="98" r="1.3" fill="#FFFFFF" />
              </>
            )}
            <motion.ellipse
              cx="136" cy="100" rx="8.5"
              animate={{ ry: blink ? 0.4 : 6.5 }}
              transition={{ duration: 0.08 }}
              fill="#FFFFFF" stroke="#1A0E08" strokeWidth="1.3"
            />
            {!blink && (
              <>
                <ellipse cx={136 + eyeOffset} cy="100" rx="5" ry="5.5" fill="#3B2A1A" />
                <circle cx={136 + eyeOffset} cy="100" r="2.8" fill="#0A0604" />
                <circle cx={137 + eyeOffset} cy="98" r="1.3" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* === NOSE === */}
          <path d="M 117 104 Q 118 117 116 122" stroke="#A06B40" strokeWidth="1" fill="none" />
          <path d="M 123 104 Q 122 117 124 122" stroke="#A06B40" strokeWidth="1" fill="none" />
          <ellipse cx="117" cy="123" rx="1.1" ry="0.7" fill="#7A4F2C" opacity="0.6" />
          <ellipse cx="123" cy="123" rx="1.1" ry="0.7" fill="#7A4F2C" opacity="0.6" />

          {/* === MOUTH — bigger, with much more visible lip-sync === */}
          <motion.path
            animate={{ d: mouthDef.d }}
            transition={{ duration: 0.10 }}
            fill={mouthDef.fill}
            stroke="#7B2933"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {mouthDef.teeth && (
            <rect x="112" y="131" width="16" height="3" rx="0.5" fill="#FFFFFF" opacity="0.95" />
          )}
        </g>
      </svg>
    </motion.div>
  );
}

function browFor(emotion) {
  switch (emotion) {
    case 'shocked':   return { lift: -5, tiltL:  3, tiltR: -3 };
    case 'realised':  return { lift: -3, tiltL:  2, tiltR: -2 };
    case 'unsettled': return { lift:  2, tiltL: -3, tiltR:  3 };
    case 'curious':   return { lift: -2, tiltL: -3, tiltR:  2 };
    case 'happy':
    case 'confident': return { lift:  0, tiltL: -1, tiltR:  1 };
    default:          return { lift:  0, tiltL:  0, tiltR:  0 };
  }
}

/* Bigger, more visibly-different mouth shapes per level — the user
 * wanted lip-sync that's actually visible like Shanaya in Lesson 1.
 * Level 3 opens to a clear wide O; level 2 a medium oval; level 1 a
 * parted-lip slit. */
function mouthShape(emotion, level) {
  if (emotion === 'shocked' || level >= 3) {
    return { d: 'M 106 128 Q 120 152 134 128 Q 120 146 106 128 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 2) {
    return { d: 'M 108 129 Q 120 144 132 129 Q 120 140 108 129 Z', fill: '#3B0A18', teeth: true };
  }
  if (level === 1) {
    return { d: 'M 110 131 Q 120 138 130 131 Q 120 136 110 131 Z', fill: '#7B2933', teeth: false };
  }
  if (emotion === 'happy' || emotion === 'confident') {
    return { d: 'M 106 128 Q 120 142 134 128', fill: 'transparent', teeth: false };
  }
  if (emotion === 'unsettled' || emotion === 'guilty') {
    return { d: 'M 106 134 Q 120 124 134 134', fill: 'transparent', teeth: false };
  }
  return { d: 'M 110 132 Q 120 135 130 132', fill: 'transparent', teeth: false };
}
