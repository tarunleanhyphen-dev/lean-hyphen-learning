import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Smartphone, ShieldCheck, Network } from 'lucide-react';

/**
 * Background "cyber world" used from scene 3 onwards. Glowing grid floor,
 * scanlines, slow drifting data motes, optional floating system labels
 * (bank server, payment app, security check, network route) that appear
 * one by one in scene 4.
 *
 * Used as an absolutely-positioned backdrop inside the left stage card;
 * the avatar + bubbles sit on top of it.
 */
export default function DigitalWorldStage({ showLabels = [], variant = 'arrival' }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06091F] via-[#0B1739] to-[#1A1240]" />
      {/* Glow blobs */}
      <motion.div
        className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/35 blur-[90px]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.95, 0.7] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-violet-500/35 blur-[110px]"
        animate={{ scale: [1, 1.05, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
      />
      {/* Grid floor — perspective */}
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
      {/* Scan lines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(34,211,238,0.25) 0 1px, transparent 1px 4px)',
        }}
      />
      {/* Data motes */}
      <Motes />
      {/* Floating system labels */}
      <AnimatePresence>
        {showLabels.includes('bank') && (
          <Label key="bank" delay={0} x="14%" y="22%" icon={<Landmark className="h-4 w-4" />} text="Bank Server" tint="from-emerald-400/50 to-emerald-600/40" />
        )}
        {showLabels.includes('app') && (
          <Label key="app" delay={0.3} x="78%" y="18%" icon={<Smartphone className="h-4 w-4" />} text="Payment App" tint="from-sky-400/50 to-sky-600/40" />
        )}
        {showLabels.includes('security') && (
          <Label key="sec" delay={0.6} x="18%" y="68%" icon={<ShieldCheck className="h-4 w-4" />} text="Security Check" tint="from-amber-400/50 to-amber-600/40" />
        )}
        {showLabels.includes('network') && (
          <Label key="net" delay={0.9} x="78%" y="64%" icon={<Network className="h-4 w-4" />} text="Network Route" tint="from-fuchsia-400/50 to-fuchsia-600/40" />
        )}
      </AnimatePresence>
      {variant === 'arrival' && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}

function Label({ x, y, icon, text, tint, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      style={{ left: x, top: y }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay }}
        className={`flex items-center gap-2 rounded-full bg-gradient-to-r ${tint} px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white ring-1 ring-white/30 backdrop-blur`}
      >
        <span className="text-white/95">{icon}</span>
        {text}
      </motion.div>
    </motion.div>
  );
}

function Motes() {
  const motes = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: 4 + ((i * 37) % 92),
    delay: (i * 0.3) % 4,
    dur: 5 + (i % 4),
    size: 2 + (i % 3),
  }));
  return (
    <>
      {motes.map((m) => (
        <motion.span
          key={m.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -120, opacity: [0, 0.85, 0] }}
          transition={{ duration: m.dur, delay: m.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ left: `${m.x}%`, width: m.size, height: m.size, bottom: 8 }}
          className="absolute rounded-full bg-cyan-300/90 shadow-[0_0_8px_#22D3EE]"
        />
      ))}
    </>
  );
}
