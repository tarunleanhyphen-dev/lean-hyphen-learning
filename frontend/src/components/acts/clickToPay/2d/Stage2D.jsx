import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Ritwik from './Ritwik.jsx';
import Mom from './Mom.jsx';
import SystemAvatar from './SystemAvatar.jsx';

/**
 * Stage2D — the new (2D, polished) replacement for the 3D scene. Renders
 * a cinematic per-scenePhase background, places the right characters on
 * stage, and floats speech bubbles with pointer tails above the speaker.
 *
 * Props:
 *   scenePhase   'home' | 'glitch' | 'transform' | 'digital'
 *   speaker      currently-speaking character key ('ritwik' | 'mom' | 'system' | null)
 *   speaking     bool
 *   amplitudeRef ref → 0..1 amplitude
 *   emotion      drives facial expression for the active speaker
 *   bubbles      [{ speaker, text, type }] anchored above each speaker's head
 */

const LAYOUTS = {
  home: {
    ritwik: { x: '28%', y: 'bottom-0', size: 'h-[80%]' },
    mom:    { x: '70%', y: 'bottom-0', size: 'h-[80%]' },
  },
  glitch: {
    ritwik: { x: '50%', y: 'bottom-0', size: 'h-[80%]' },
  },
  transform: {
    ritwik: { x: '50%', y: 'bottom-0', size: 'h-[78%]' },
  },
  digital: {
    ritwik: { x: '30%', y: 'bottom-0', size: 'h-[78%]' },
    system: { x: '70%', y: 'center', size: 'h-[70%]' },
  },
};

const BUBBLE_POS = {
  ritwik: { left: '28%', top: '8%' },
  mom:    { left: '70%', top: '8%' },
  system: { left: '70%', top: '12%' },
};

export default function Stage2D({
  scenePhase = 'home',
  speaker,
  speaking,
  amplitudeRef,
  emotion = 'neutral',
  bubbles = [],
}) {
  const layout = LAYOUTS[scenePhase] || LAYOUTS.home;
  const cast = Object.keys(layout);

  // Determine who's looking at whom — characters who aren't speaking look
  // toward the speaker; the speaker looks at the other character.
  const lookFor = (who) => {
    if (cast.length < 2) return 'forward';
    if (speaker && speaker !== who) {
      const speakerIdx = cast.indexOf(speaker);
      const myIdx = cast.indexOf(who);
      return speakerIdx > myIdx ? 'right' : 'left';
    }
    if (speaker === who) {
      const other = cast.find((c) => c !== who);
      if (!other) return 'forward';
      const myIdx = cast.indexOf(who);
      const otherIdx = cast.indexOf(other);
      return otherIdx > myIdx ? 'right' : 'left';
    }
    return 'forward';
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
      {/* Background per scenePhase */}
      {scenePhase === 'home'      && <HomeBackground />}
      {scenePhase === 'glitch'    && <GlitchBackground />}
      {scenePhase === 'transform' && <TransformBackground />}
      {scenePhase === 'digital'   && <DigitalBackground />}

      {/* Characters */}
      {cast.map((who) => {
        const slot = layout[who];
        const isSpeaking = speaker === who && speaking;
        const charProps = {
          speaking: isSpeaking,
          amplitudeRef,
          emotion: speaker === who ? emotion : 'neutral',
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
            {who === 'ritwik' && <Ritwik {...charProps} />}
            {who === 'mom'    && <Mom {...charProps} />}
            {who === 'system' && <SystemAvatar {...charProps} />}
          </div>
        );
      })}

      {/* Pointer speech bubbles — anchored above each character */}
      <div className="pointer-events-none absolute inset-0 z-30">
        <AnimatePresence>
          {bubbles.map((b, i) => {
            const pos = BUBBLE_POS[b.speaker];
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
      <div className={`relative max-w-[16rem] rounded-2xl px-4 py-2.5 text-[13px] font-semibold leading-snug ring-1 shadow-xl sm:max-w-[18rem] sm:text-sm ${palette.bg}`}>
        <span className="mr-1 opacity-70">{palette.icon}</span>
        {text}
      </div>
      <div className={`absolute left-1/2 -bottom-2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent ${palette.tail}`} />
    </motion.div>
  );
}

/* ===== Backgrounds ===== */

function HomeBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2A1B3D] via-[#1F1430] to-[#0F0820]" />
      {/* Window with evening sky */}
      <div className="absolute left-[5%] top-[8%] h-[34%] w-[22%] overflow-hidden rounded-md border-4 border-[#3E2818] bg-gradient-to-b from-[#FB923C] via-[#A78BFA] to-[#312E81]">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0">
          <div className="border-r-2 border-b-2 border-[#3E2818]" />
          <div className="border-b-2 border-[#3E2818]" />
          <div className="border-r-2 border-[#3E2818]" />
          <div />
        </div>
        <motion.div
          className="absolute right-3 top-2 h-3 w-3 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.8)]"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
      {/* Wall art */}
      <div className="absolute right-[10%] top-[10%] h-[18%] w-[20%] rounded-md border-4 border-[#3E2818] bg-gradient-to-br from-pink-300 to-purple-400" />
      {/* Floor lamp */}
      <div className="absolute left-[2%] bottom-[8%] h-[55%] w-[3%]">
        <div className="absolute inset-x-0 top-0 h-12 rounded-t-full bg-amber-200 shadow-[0_0_40px_rgba(254,215,170,0.7)]" />
        <div className="absolute inset-x-[40%] top-12 bottom-0 bg-[#7A5A3E]" />
      </div>
      {/* Sofa hint behind characters */}
      <div className="absolute left-0 right-0 bottom-0 h-[28%] bg-gradient-to-t from-[#1A0F2A] to-transparent" />
      <div className="absolute left-[14%] right-[14%] bottom-[8%] h-[14%] rounded-2xl bg-[#4A6B82] opacity-70" />
      {/* Floor tile */}
      <div className="absolute inset-x-0 bottom-0 h-[14%] bg-gradient-to-t from-[#5A4030] to-transparent" />
      {/* Subtle dust motes */}
      <Motes color="#FFE08A" count={8} />
    </div>
  );
}

function GlitchBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B47] to-[#0F0820]" />
      {/* Glitch bars */}
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
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(244,114,182,0.2) 0 2px, transparent 2px 5px)',
        }}
      />
      {/* RGB split overlay */}
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
      {/* Radial energy burst */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(168,139,250,0.3) 40%, transparent 70%)',
        }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      {/* Particles streaming upward */}
      <Motes color="#FDE047" count={16} fast />
      <Motes color="#22D3EE" count={12} fast />
    </div>
  );
}

function DigitalBackground() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[#06091F] via-[#0B1739] to-[#1A1240]" />
      {/* Cyber grid floor — perspective */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to top, rgba(34,211,238,0.45) 1px, transparent 1px), linear-gradient(to right, rgba(34,211,238,0.45) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
          transform: 'perspective(420px) rotateX(50deg)',
          transformOrigin: 'bottom',
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(34,211,238,0.25) 0 1px, transparent 1px 4px)',
        }}
      />
      {/* Floating data points */}
      <Motes color="#22D3EE" count={14} />
      {/* Glow blobs */}
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
          animate={{ y: -200, opacity: [0, 0.85, 0] }}
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
