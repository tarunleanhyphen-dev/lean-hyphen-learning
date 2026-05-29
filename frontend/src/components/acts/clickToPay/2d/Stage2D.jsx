import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ritwik from './Ritwik.jsx';
import Mom from './Mom.jsx';
import SystemAvatar from './SystemAvatar.jsx';
import Money500 from './Money500.jsx';
import UPIFlow from './UPIFlow.jsx';
import RPMAvatar from '../3d/RPMAvatar.jsx';
import { RPM_AVATARS } from '../../../../data/lessons/avatars.js';

/**
 * Stage2D — full-bleed cinematic stage. Renders the right background +
 * the right cast based on `stage`:
 *
 *   home        cosy living-room with Ritwik on the sofa + Mom standing
 *   phone-task  same living-room — the phone interactive is rendered by
 *               the parent (Act1) overlaid on top of this stage
 *   glitch      dark glitch backdrop (scene 2)
 *   transform   particle/energy explosion as Ritwik becomes Money500
 *   digital     cyber world with floating system labels (scene 4 intro)
 *   flow        UPIFlow visualization with Money500 travelling
 *   prediction  cyber world background (scene 5)
 *
 * Pointer speech bubbles render above each speaker character with a
 * downward arrow pointing at their head.
 */

const STAGE_LAYOUTS = {
  home: {
    cast: ['ritwik', 'mom'],
    positions: {
      ritwik: { x: '32%', y: 'bottom-0', size: 'h-[78%]' },
      mom:    { x: '68%', y: 'bottom-0', size: 'h-[82%]' },
    },
  },
  'phone-task': {
    cast: ['ritwik'],
    positions: {
      ritwik: { x: '22%', y: 'bottom-0', size: 'h-[70%]' },
    },
  },
  glitch: {
    cast: ['ritwik'],
    positions: { ritwik: { x: '50%', y: 'bottom-0', size: 'h-[68%]' } },
  },
  transform: {
    cast: ['money'],
    positions: { money: { x: '50%', y: 'center', size: 'h-[78%]' } },
  },
  digital: {
    cast: ['money', 'system'],
    positions: {
      money:  { x: '32%', y: 'center', size: 'h-[64%]' },
      system: { x: '72%', y: 'center', size: 'h-[60%]' },
    },
  },
  flow: {
    cast: [],
    positions: {},
  },
  prediction: {
    cast: ['system'],
    positions: { system: { x: '50%', y: 'center', size: 'h-[64%]' } },
  },
};

const BUBBLE_POSITIONS = {
  home: {
    ritwik: { left: '32%', top: '8%' },
    mom:    { left: '68%', top: '6%' },
  },
  'phone-task': {
    ritwik: { left: '22%', top: '12%' },
  },
  glitch: {
    ritwik: { left: '50%', top: '8%' },
  },
  transform: {
    ritwik: { left: '50%', top: '6%' },
    money:  { left: '50%', top: '6%' },
  },
  digital: {
    money:  { left: '32%', top: '8%' },
    system: { left: '72%', top: '6%' },
    ritwik: { left: '32%', top: '8%' },
  },
  prediction: {
    system: { left: '50%', top: '6%' },
  },
};

export default function Stage2D({
  stage = 'home',
  speaker,
  speaking,
  amplitudeRef,
  emotion = 'neutral',
  bubbles = [],
  activeNode = -1,
  visibleLabels = 'all',
}) {
  const layout = STAGE_LAYOUTS[stage] || STAGE_LAYOUTS.home;
  const bubblePos = BUBBLE_POSITIONS[stage] || {};
  const cast = layout.cast;

  const lookFor = (who) => {
    if (cast.length < 2) return 'forward';
    if (speaker && speaker !== who) {
      const myIdx = cast.indexOf(who);
      const speakerIdx = cast.indexOf(speaker);
      return speakerIdx > myIdx ? 'right' : 'left';
    }
    return 'forward';
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
      {/* Per-stage backgrounds */}
      {stage === 'home'        && <HomeBackground />}
      {stage === 'phone-task'  && <HomeBackground />}
      {stage === 'glitch'      && <GlitchBackground />}
      {stage === 'transform'   && <TransformBackground />}
      {(stage === 'digital' || stage === 'prediction') && <DigitalBackground />}
      {stage === 'flow'        && <FlowBackground />}

      {/* UPI flow — only on flow stage */}
      {stage === 'flow' && (
        <UPIFlow
          activeNodeIndex={activeNode}
          visibleLabels={visibleLabels}
          money={<Money500 pose={activeNode >= 0 ? 'walk' : 'wave'} speaking={speaking && speaker === 'money'} amplitudeRef={amplitudeRef} className="h-full w-full" />}
        />
      )}

      {/* Characters */}
      {cast.map((who) => {
        const slot = layout.positions[who];
        if (!slot) return null;
        const isSpeaking = (speaker === who || (who === 'money' && speaker === 'ritwik')) && speaking;
        const charProps = {
          speaking: isSpeaking,
          amplitudeRef,
          emotion,
          lookAt: lookFor(who),
          className: slot.size,
        };
        const yClass = slot.y === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-0';
        return (
          <div
            key={who}
            className={`absolute -translate-x-1/2 ${yClass}`}
            style={{ left: slot.x }}
          >
            {who === 'ritwik' && (
              RPM_AVATARS.ritwik
                ? <RPMAvatar url={RPM_AVATARS.ritwik} {...charProps} className={slot.size} />
                : <Ritwik {...charProps} />
            )}
            {who === 'mom' && (
              RPM_AVATARS.mom
                ? <RPMAvatar url={RPM_AVATARS.mom} {...charProps} className={slot.size} />
                : <Mom {...charProps} />
            )}
            {who === 'system' && <SystemAvatar speaking={charProps.speaking} amplitudeRef={amplitudeRef} className={slot.size} />}
            {who === 'money'  && <Money500 pose="wave" speaking={isSpeaking} amplitudeRef={amplitudeRef} className={slot.size} />}
          </div>
        );
      })}

      {/* Pointer speech bubbles */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <AnimatePresence>
          {bubbles.map((b, i) => {
            const pos = bubblePos[b.speaker];
            if (!pos) return null;
            return (
              <PointerBubble
                key={`${b.speaker}-${b.text}-${i}`}
                text={b.text}
                variant={b.speaker === 'system' ? 'system' : b.type === 'thought' ? 'thought' : 'speech'}
                style={pos}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PointerBubble({ text, variant = 'speech', style }) {
  const palette = variant === 'system'
    ? { bg: 'bg-cyan-300 text-cyan-950 ring-cyan-400/50', tail: 'border-t-cyan-300', icon: '⚡' }
    : variant === 'thought'
      ? { bg: 'bg-white text-ink-900 ring-ink-300/30', tail: 'border-t-white', icon: '💭' }
      : { bg: 'bg-amber-300 text-amber-950 ring-amber-400/50', tail: 'border-t-amber-300', icon: '💬' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute -translate-x-1/2"
      style={style}
    >
      <div className={`relative max-w-[16rem] rounded-2xl px-4 py-2.5 text-[13px] font-semibold leading-snug ring-1 shadow-xl sm:max-w-[20rem] sm:text-sm ${palette.bg}`}>
        <span className="mr-1 opacity-70">{palette.icon}</span>
        {text}
      </div>
      <div className={`absolute left-1/2 -bottom-2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent ${palette.tail}`} />
    </motion.div>
  );
}

/* ============================================================
 * Backgrounds
 * ============================================================ */

function HomeBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      {/* Wall with subtle vertical wallpaper stripes */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3A2348] via-[#2A1B3D] to-[#1A0F2A]" />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 22px)',
        }}
      />

      {/* Window — top left — with evening city skyline silhouette */}
      <div className="absolute left-[4%] top-[6%] h-[36%] w-[22%] overflow-hidden rounded-md border-4 border-[#3E2818] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FB923C] via-[#A78BFA] to-[#312E81]" />
        {/* Skyline silhouette */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M 0 30 L 0 22 L 10 22 L 12 14 L 18 14 L 20 22 L 28 22 L 30 8 L 36 8 L 38 16 L 46 16 L 48 10 L 56 10 L 58 18 L 66 18 L 68 6 L 76 6 L 78 14 L 86 14 L 88 20 L 96 20 L 100 18 L 100 30 Z" fill="#0F0820" opacity="0.85" />
        </svg>
        {/* Window cross divider */}
        <div className="absolute inset-x-0 top-1/2 h-[2px] bg-[#3E2818]" />
        <div className="absolute inset-y-0 left-1/2 w-[2px] bg-[#3E2818]" />
        {/* Moon */}
        <motion.div
          className="absolute right-3 top-2 h-3 w-3 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.85)]"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* === THREE NATURE WALL PAINTINGS — replace the empty frames === */}
      {/* Frame 1 — mountain landscape */}
      <div className="absolute left-[32%] top-[8%] h-[20%] w-[12%] overflow-hidden rounded-md border-[4px] border-[#3E2818] shadow-xl">
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
          <rect width="100" height="80" fill="url(#mt-sky)" />
          {/* Sun */}
          <circle cx="72" cy="22" r="8" fill="#FCD34D" />
          {/* Back mountains */}
          <polygon points="0,55 20,30 40,50 60,28 80,48 100,32 100,80 0,80" fill="#8B5A6B" />
          {/* Front mountains */}
          <polygon points="0,68 18,46 35,62 50,42 70,60 90,46 100,58 100,80 0,80" fill="#4A3548" />
          {/* Snow caps */}
          <polygon points="46,46 50,42 54,48" fill="#FFFFFF" />
          <polygon points="86,50 90,46 94,52" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Frame 2 — beach sunset (centre) */}
      <div className="absolute left-[45%] top-[8%] h-[20%] w-[12%] overflow-hidden rounded-md border-[4px] border-[#3E2818] shadow-xl">
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="bch-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#FCA5A5" />
              <stop offset="50%"  stopColor="#F97316" />
              <stop offset="100%" stopColor="#FDE047" />
            </linearGradient>
            <linearGradient id="bch-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
          <rect width="100" height="50" fill="url(#bch-sky)" />
          <rect y="50" width="100" height="22" fill="url(#bch-sea)" />
          <rect y="72" width="100" height="8" fill="#FDE68A" />
          {/* Sun on horizon */}
          <circle cx="50" cy="50" r="12" fill="#FEF3C7" />
          {/* Sun reflection on water */}
          <rect x="44" y="52" width="12" height="20" fill="#FCD34D" opacity="0.55" />
          {/* Palm tree silhouette */}
          <path d="M 78 72 L 80 50" stroke="#1F2937" strokeWidth="1.5" fill="none" />
          <path d="M 80 50 Q 70 42 64 48 M 80 50 Q 90 42 96 48 M 80 50 Q 78 38 74 36 M 80 50 Q 84 38 88 36" stroke="#065F46" strokeWidth="1.5" fill="none" />
        </svg>
      </div>

      {/* Frame 3 — tropical valley */}
      <div className="absolute left-[58%] top-[8%] h-[20%] w-[12%] overflow-hidden rounded-md border-[4px] border-[#3E2818] shadow-xl">
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="vl-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#A5F3FC" />
              <stop offset="100%" stopColor="#67E8F9" />
            </linearGradient>
          </defs>
          <rect width="100" height="40" fill="url(#vl-sky)" />
          {/* Far hills */}
          <ellipse cx="20" cy="50" rx="32" ry="14" fill="#10B981" />
          <ellipse cx="60" cy="48" rx="38" ry="16" fill="#059669" />
          <ellipse cx="92" cy="52" rx="22" ry="12" fill="#10B981" />
          {/* Foreground meadow */}
          <rect y="60" width="100" height="20" fill="#34D399" />
          {/* River winding through */}
          <path d="M 30 80 Q 40 72 35 64 Q 30 56 45 50 Q 60 44 55 36" stroke="#3B82F6" strokeWidth="3" fill="none" />
          {/* Clouds */}
          <ellipse cx="20" cy="15" rx="9" ry="3" fill="#FFFFFF" opacity="0.85" />
          <ellipse cx="72" cy="20" rx="11" ry="4" fill="#FFFFFF" opacity="0.85" />
        </svg>
      </div>

      {/* Wall art on the right — Krishna-inspired peacock motif */}
      <div className="absolute right-[6%] top-[10%] h-[20%] w-[18%] overflow-hidden rounded-md border-[4px] border-[#3E2818] shadow-xl">
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="pk-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#F472B6" />
              <stop offset="100%" stopColor="#A78BFA" />
            </linearGradient>
          </defs>
          <rect width="100" height="80" fill="url(#pk-bg)" />
          {/* Sun behind */}
          <circle cx="80" cy="20" r="10" fill="#FCD34D" opacity="0.7" />
          {/* Peacock body */}
          <ellipse cx="40" cy="55" rx="10" ry="14" fill="#0E7490" />
          {/* Peacock feathers fanning out */}
          {[-50, -30, -10, 10, 30, 50].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 40 55)`}>
              <ellipse cx="40" cy="22" rx="3" ry="14" fill="#0891B2" opacity="0.85" />
              <circle cx="40" cy="14" r="3" fill="#FDE047" />
              <circle cx="40" cy="14" r="1.2" fill="#065F46" />
            </g>
          ))}
          {/* Peacock head */}
          <circle cx="42" cy="40" r="4" fill="#0E7490" />
          <circle cx="44" cy="38" r="1" fill="#FDE047" />
        </svg>
      </div>

      {/* === FLOOR — proper wooden plank floor === */}
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-t from-[#5A4030] via-[#6B4923] to-[#3E2818]" />
      {/* Floor planks */}
      <div className="absolute inset-x-0 bottom-0 h-[16%] opacity-40"
           style={{
             backgroundImage:
               'repeating-linear-gradient(90deg, transparent 0 60px, rgba(0,0,0,0.25) 60px 62px)',
           }} />

      {/* === FLOOR LAMP === */}
      <div className="absolute left-[2%] bottom-[16%] h-[42%] w-[3%]">
        <div className="absolute inset-x-0 top-0 h-12 rounded-t-full bg-amber-200 shadow-[0_0_50px_rgba(254,215,170,0.85)]" />
        <div className="absolute inset-x-[40%] top-12 bottom-0 bg-[#7A5A3E]" />
        <div className="absolute inset-x-[-20%] bottom-0 h-2 rounded-md bg-[#7A5A3E]" />
      </div>

      {/* === INDIAN-STYLE SOFA === */}
      <IndianSofa />

      {/* Coffee table in front of sofa */}
      <div className="absolute left-[42%] right-[42%] bottom-[15%] h-[3%] rounded-md bg-[#7A5A3E] shadow-xl" />
      <div className="absolute left-[42%] right-[42%] bottom-[10%] h-[5%]">
        <div className="absolute left-0 bottom-0 h-full w-[6%] bg-[#5A4030]" />
        <div className="absolute right-0 bottom-0 h-full w-[6%] bg-[#5A4030]" />
      </div>
      {/* Cup on the table */}
      <div className="absolute left-[48%] bottom-[18.5%] h-[2.5%] w-[3%] rounded-b bg-white shadow" />
      <div className="absolute left-[48%] bottom-[20.5%] h-[1%] w-[3%] rounded-t bg-[#F3F4F6]" />

      {/* === POTTED PLANT in corner === */}
      <div className="absolute right-[3%] bottom-[16%] h-[26%] w-[7%]">
        <div className="absolute inset-x-0 bottom-0 h-[35%] rounded-b-lg bg-[#A85F3A] shadow-lg" />
        <div className="absolute inset-x-0 bottom-[31%] h-[3%] rounded-sm bg-[#8B4F2E]" />
        {/* Plant leaves — layered */}
        <div className="absolute bottom-[34%] left-[10%] right-[10%] h-[60%] rounded-full bg-[#10B981]" />
        <div className="absolute bottom-[42%] left-[-10%] right-[60%] h-[40%] rounded-full bg-[#059669] -rotate-12" />
        <div className="absolute bottom-[42%] left-[60%] right-[-10%] h-[40%] rounded-full bg-[#34D399] rotate-12" />
        <div className="absolute bottom-[60%] left-[20%] right-[20%] h-[35%] rounded-full bg-[#10B981]" />
      </div>

      {/* Dust motes (warm evening light) */}
      <Motes color="#FFE08A" count={5} />
    </div>
  );
}

/* Proper Indian-style sofa — wooden carved arms + plush teal cushions
 * + embroidered throw pillows. Sits behind the characters. */
function IndianSofa() {
  return (
    <div className="absolute left-[16%] right-[16%] bottom-[14%] h-[26%]">
      {/* Wooden frame back */}
      <div className="absolute inset-x-0 top-0 h-[60%] rounded-t-3xl bg-gradient-to-b from-[#5A3818] to-[#3E2818] shadow-xl" />
      {/* Cushioned backrest (3 sections) */}
      <div className="absolute inset-x-[4%] top-[8%] h-[50%] rounded-2xl bg-gradient-to-b from-[#5DA9C8] to-[#2A6A86] shadow-inner" />
      <div className="absolute left-[6%] top-[10%] h-[44%] w-[30%] rounded-xl bg-[#6BB3D1] shadow-md" />
      <div className="absolute left-[37%] top-[10%] h-[44%] w-[26%] rounded-xl bg-[#6BB3D1] shadow-md" />
      <div className="absolute right-[6%] top-[10%] h-[44%] w-[30%] rounded-xl bg-[#6BB3D1] shadow-md" />
      {/* Embroidery accent line */}
      <div className="absolute inset-x-[6%] top-[50%] h-[3px] bg-amber-300/60" />

      {/* Seat cushion */}
      <div className="absolute inset-x-0 top-[55%] h-[35%] rounded-b-2xl bg-gradient-to-b from-[#4A8FA9] to-[#1E5070] shadow-xl" />
      <div className="absolute inset-x-[3%] top-[58%] h-[28%] rounded-xl bg-[#5DA9C8]" />

      {/* Wooden arms (curved Indian style) */}
      <div className="absolute left-[-2%] top-[10%] h-[85%] w-[6%]">
        <div className="h-full rounded-l-3xl bg-gradient-to-r from-[#5A3818] to-[#7A5A3E] shadow-lg" />
        {/* Carved accent */}
        <div className="absolute top-[15%] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-300/60" />
      </div>
      <div className="absolute right-[-2%] top-[10%] h-[85%] w-[6%]">
        <div className="h-full rounded-r-3xl bg-gradient-to-l from-[#5A3818] to-[#7A5A3E] shadow-lg" />
        <div className="absolute top-[15%] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-300/60" />
      </div>

      {/* Throw pillow with embroidery pattern */}
      <div className="absolute left-[7%] top-[20%] h-[28%] w-[16%] rotate-[-8deg] rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#B45309] shadow-lg ring-2 ring-amber-200/40">
        <div className="absolute inset-1 grid grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={i % 2 ? 'rounded-sm bg-amber-200/60' : 'rounded-sm bg-amber-700/40'} />
          ))}
        </div>
      </div>
      <div className="absolute right-[7%] top-[20%] h-[28%] w-[16%] rotate-[8deg] rounded-lg bg-gradient-to-br from-rose-500 to-rose-800 shadow-lg ring-2 ring-rose-200/40">
        <div className="absolute inset-1 flex items-center justify-center">
          <div className="text-2xl">✿</div>
        </div>
      </div>
    </div>
  );
}

function GlitchBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B47] to-[#0F0820]" />
      <motion.div
        className="absolute inset-x-0 h-12 bg-fuchsia-500/30 mix-blend-screen"
        initial={{ top: '-10%' }}
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-x-0 h-8 bg-cyan-400/30 mix-blend-screen"
        initial={{ top: '40%' }}
        animate={{ top: ['40%', '-20%', '120%', '40%'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(244,114,182,0.2) 0 2px, transparent 2px 5px)',
        }}
      />
      <motion.div
        className="absolute inset-0 bg-cyan-500/10 mix-blend-screen"
        animate={{ x: [-3, 3, -3] }}
        transition={{ duration: 0.18, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 bg-fuchsia-500/10 mix-blend-screen"
        animate={{ x: [3, -3, 3] }}
        transition={{ duration: 0.18, repeat: Infinity }}
      />
    </div>
  );
}

function TransformBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1240] via-[#0B1739] to-[#06091F]" />
      {/* Big radial energy burst */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(253,224,71,0.55) 0%, rgba(168,139,250,0.35) 30%, transparent 65%)',
        }}
        animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Particles streaming */}
      <Motes color="#FDE047" count={18} fast />
      <Motes color="#22D3EE" count={12} fast />
      <Motes color="#F472B6" count={10} fast />
      {/* Energy rings expanding outward */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border-2 border-yellow-300/40"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: [0, 600], height: [0, 600], opacity: [0.8, 0], x: ['-50%', '-50%'], y: ['-50%', '-50%'] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
        />
      ))}
    </div>
  );
}

function DigitalBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      {/* Deep cyber gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040618] via-[#0B1739] to-[#1A1240]" />
      {/* Perspective grid floor (3D-feel) */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to top, rgba(34,211,238,0.55) 1px, transparent 1px), linear-gradient(to right, rgba(34,211,238,0.55) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
          transform: 'perspective(420px) rotateX(50deg)',
          transformOrigin: 'bottom',
        }}
      />
      {/* Ceiling grid (mirrors floor for full immersion) */}
      <div
        className="absolute inset-x-0 top-0 h-1/3 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(167,139,250,0.45) 1px, transparent 1px), linear-gradient(to right, rgba(167,139,250,0.45) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, transparent 100%)',
          transform: 'perspective(420px) rotateX(-50deg)',
          transformOrigin: 'top',
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(34,211,238,0.25) 0 1px, transparent 1px 4px)',
        }}
      />
      {/* Holographic concentric circles in the centre — gives a "hub" feel */}
      <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25" width="600" height="600" viewBox="0 0 600 600">
        <defs>
          <linearGradient id="dg-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        {[80, 140, 200, 260, 320].map((r, i) => (
          <motion.circle
            key={r}
            cx="300" cy="300" r={r}
            fill="none" stroke="url(#dg-ring)" strokeWidth="0.8"
            strokeDasharray="6 6"
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 30 + i * 10, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '300px 300px' }}
          />
        ))}
      </svg>

      {/* Floating currency symbols + binary code drifting */}
      <FloatingDigitalSymbols />

      {/* Data streams flowing diagonally */}
      <DataStreams />

      <Motes color="#22D3EE" count={14} />
      <motion.div
        className="absolute right-[-15%] top-[-10%] h-72 w-72 rounded-full bg-cyan-400/30 blur-[100px]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-[-15%] bottom-[-10%] h-80 w-80 rounded-full bg-violet-500/30 blur-[110px]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
      />
    </div>
  );
}

function FlowBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#040618] via-[#0B1739] to-[#1A1240]" />
      <FloatingDigitalSymbols sparse />
      <DataStreams subtle />
    </div>
  );
}

/* Floating ₹ / $ / € / # / binary digits drifting upward through the
 * scene — sells the "you're inside a digital currency simulation" feel. */
function FloatingDigitalSymbols({ sparse = false }) {
  const symbols = ['₹', '₹', '$', '€', '0', '1', '0', '1', '₹', '#', '0', '1'];
  const items = useRef(
    Array.from({ length: sparse ? 8 : 14 }, (_, i) => ({
      id: i,
      x: 4 + (i * 41) % 92,
      delay: (i * 0.4) % 5,
      dur: 8 + (i % 5),
      size: 14 + (i % 3) * 6,
      sym: symbols[i % symbols.length],
      color: ['#22D3EE', '#A78BFA', '#FDE047', '#F472B6'][i % 4],
    }))
  ).current;
  return (
    <>
      {items.map((it) => (
        <motion.span
          key={it.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -480, opacity: [0, 0.7, 0] }}
          transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            left: `${it.x}%`,
            fontSize: it.size,
            color: it.color,
            bottom: 0,
            textShadow: `0 0 8px ${it.color}`,
          }}
          className="pointer-events-none absolute font-mono font-bold"
        >
          {it.sym}
        </motion.span>
      ))}
    </>
  );
}

/* Data streams — diagonal glowing lines that "stream" across the
 * stage every few seconds. Bezier-ish trails. */
function DataStreams({ subtle = false }) {
  const streams = useRef(
    Array.from({ length: subtle ? 3 : 5 }, (_, i) => ({
      id: i,
      y: 15 + i * 18,
      delay: i * 0.8,
      dur: 3 + (i % 2),
      color: ['#22D3EE', '#A78BFA', '#F472B6'][i % 3],
    }))
  ).current;
  return (
    <>
      {streams.map((s) => (
        <motion.div
          key={s.id}
          aria-hidden
          className="pointer-events-none absolute h-[1px] w-32"
          style={{
            top: `${s.y}%`,
            background: `linear-gradient(to right, transparent, ${s.color}, transparent)`,
            boxShadow: `0 0 10px ${s.color}`,
          }}
          initial={{ left: '-15%', opacity: 0 }}
          animate={{ left: ['-15%', '115%'], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: s.dur,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}

function Motes({ color = '#FFE08A', count = 10, fast = false }) {
  const motes = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 4 + (i * 41) % 92,
      delay: (i * 0.3) % 4,
      dur: fast ? 2.5 + (i % 3) : 5 + (i % 4),
      size: 2 + (i % 3),
    }))
  ).current;
  return (
    <>
      {motes.map((m) => (
        <motion.span
          key={m.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -240, opacity: [0, 0.85, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            left: `${m.x}%`,
            width: m.size,
            height: m.size,
            bottom: 8,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
          className="pointer-events-none absolute rounded-full"
        />
      ))}
    </>
  );
}
