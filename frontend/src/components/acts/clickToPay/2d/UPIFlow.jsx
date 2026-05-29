import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Landmark, ShieldCheck, Network, ArrowRight, User } from 'lucide-react';

/**
 * UPIFlow — the visualization for Scene 4. Shows the Money500 character
 * traveling along a glowing path from the Payment App, through Bank,
 * Security Check, UPI Network, finally to the Receiver. Each node
 * spotlights in turn so the narration can call attention to it.
 *
 * Props:
 *   activeNodeIndex  0..4 — which station the money is currently passing.
 *                            Drives camera-spotlight and node highlighting.
 *   visibleLabels    'all' | array of node ids to show — used so labels
 *                            appear progressively as the narration reaches them.
 *   money            React element of the Money500 character to render
 *                            travelling along the path. If null, no traveler.
 */

const NODES = [
  { id: 'app',      icon: Smartphone,  label: 'Payment App',    tone: 'from-violet-500 to-fuchsia-500', x: '10%',  y: '70%' },
  { id: 'network',  icon: Network,     label: 'UPI Network',    tone: 'from-cyan-400 to-sky-500',       x: '32%',  y: '32%' },
  { id: 'bank',     icon: Landmark,    label: 'Bank Server',    tone: 'from-emerald-400 to-emerald-600', x: '55%',  y: '68%' },
  { id: 'security', icon: ShieldCheck, label: 'Security Check', tone: 'from-amber-400 to-orange-500',   x: '78%',  y: '30%' },
  { id: 'receiver', icon: User,        label: 'Receiver',       tone: 'from-pink-400 to-rose-500',      x: '94%',  y: '70%' },
];

// Path segments connecting nodes — used to position the moving character
const PATH_POINTS = NODES.map((n) => ({ x: parseFloat(n.x), y: parseFloat(n.y) }));

export default function UPIFlow({ activeNodeIndex = -1, visibleLabels = 'all', money = null }) {
  const isVisible = (id) => visibleLabels === 'all' || visibleLabels.includes(id);

  // Position the money character — lerps between segments
  const [pos, setPos] = useState(PATH_POINTS[0]);
  useEffect(() => {
    if (activeNodeIndex < 0 || activeNodeIndex >= PATH_POINTS.length) return;
    setPos(PATH_POINTS[activeNodeIndex]);
  }, [activeNodeIndex]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cyber grid floor */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(to top, rgba(34,211,238,0.4) 1px, transparent 1px), linear-gradient(to right, rgba(34,211,238,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
          transform: 'perspective(420px) rotateX(50deg)',
          transformOrigin: 'bottom',
        }}
      />
      {/* Glow blobs */}
      <motion.div
        aria-hidden
        className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/30 blur-[100px]"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-violet-500/30 blur-[110px]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, delay: 0.5 }}
      />

      {/* Connections — SVG path lines between nodes */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="upi-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        {NODES.slice(0, -1).map((n, i) => {
          const a = PATH_POINTS[i];
          const b = PATH_POINTS[i + 1];
          const isActive = activeNodeIndex > i;
          return (
            <g key={n.id}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="#22D3EE" strokeWidth="0.35" strokeDasharray="0.8 0.8"
                opacity={isActive ? 0.8 : 0.25}
              />
              {/* Travelling dot */}
              {isActive && (
                <motion.circle
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  cx={a.x + (b.x - a.x) * 0.5}
                  cy={a.y + (b.y - a.y) * 0.5}
                  r="0.7"
                  fill="url(#upi-line)"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const Icon = node.icon;
        const isActive = activeNodeIndex === i;
        const wasActive = activeNodeIndex > i;
        if (!isVisible(node.id)) return null;
        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{ left: node.x, top: node.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={isActive ? { y: [0, -6, 0], scale: [1, 1.08, 1] } : { y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${node.tone} shadow-lg ring-2 ${
                  isActive ? 'ring-white/80' : wasActive ? 'ring-emerald-300/60' : 'ring-white/20'
                }`}
              >
                <Icon className="h-7 w-7 text-white" />
                {isActive && (
                  <motion.div
                    aria-hidden
                    className="absolute -inset-2 rounded-2xl ring-4 ring-amber-300"
                    animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {wasActive && !isActive && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-emerald-950">
                    ✓
                  </div>
                )}
              </div>
              <div
                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur ${
                  isActive ? 'bg-amber-300 text-amber-950' : wasActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-white/10 text-white/75'
                }`}
              >
                {node.label}
              </div>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Money character traveler — moves to active node */}
      {money && activeNodeIndex >= 0 && (
        <motion.div
          initial={false}
          animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-[120%] sm:h-40 sm:w-40"
        >
          {money}
        </motion.div>
      )}

      {/* Active node mini-narration card */}
      {activeNodeIndex >= 0 && NODES[activeNodeIndex] && (
        <motion.div
          key={activeNodeIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white ring-1 ring-cyan-300/30 backdrop-blur"
        >
          <ArrowRight className="mr-1.5 inline h-3 w-3 text-cyan-300" />
          {NODES[activeNodeIndex].label}
        </motion.div>
      )}
    </div>
  );
}

export const UPI_NODES = NODES;
