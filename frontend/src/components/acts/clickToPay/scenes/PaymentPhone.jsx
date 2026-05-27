import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, IndianRupee, Check, Wifi } from 'lucide-react';

/**
 * Interactive payment-app simulation. Drives the 5-step flow from
 * scene 1: open → scan-cta → scanning → amount → pay → done.
 *
 * onComplete fires once after the final PAY step's processing window so
 * the parent Act can advance the sequencer to scene 2.
 *
 * `glitch` (0–4) is also rendered here — once we hit scene 2, the
 * parent passes glitch>0 to make the phone shake, distort, freeze.
 *
 * Self-contained phone shell (not shared/PhoneFrame) so the status bar
 * matches this lesson's dark cyber theme.
 */
export default function PaymentPhone({
  active = true,
  glitch = 0,
  onStep,
  onComplete,
  hint = 'Tap the highlighted button to continue',
}) {
  const [step, setStep] = useState('open');
  const [amount, setAmount] = useState('');
  const completedRef = useRef(false);

  const advance = (next) => {
    setStep(next);
    onStep?.(next);
    if (next === 'done' && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  // Auto-advance scanning -> amount after the scan animation
  useEffect(() => {
    if (step !== 'scanning') return;
    const id = setTimeout(() => advance('amount'), 1600);
    return () => clearTimeout(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill ₹500 after entering the amount step so kids don't have to type
  useEffect(() => {
    if (step !== 'amount') return;
    setAmount('');
    const taps = [200, 350, 500, 650, 800];
    const digits = ['5', '0', '0'];
    const ids = digits.map((d, i) =>
      setTimeout(() => setAmount((prev) => prev + d), taps[i])
    );
    return () => ids.forEach(clearTimeout);
  }, [step]);

  // PAY processing — short hold before "done"
  useEffect(() => {
    if (step !== 'pay') return;
    const id = setTimeout(() => advance('done'), 1400);
    return () => clearTimeout(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const shake = glitch >= 2 ? { x: [-2, 2, -3, 3, 0], y: [1, -1, 2, -2, 0] } : { x: 0, y: 0 };

  return (
    <div className="relative mx-auto flex flex-col items-center gap-3">
      <motion.div
        animate={shake}
        transition={{ duration: 0.18, repeat: glitch >= 2 ? Infinity : 0 }}
        className="relative mx-auto w-[280px] max-w-full sm:w-[320px] md:w-[340px]"
      >
        <div className="rounded-[40px] bg-gradient-to-b from-[#222] via-[#161616] to-[#0e0e0e] p-[6px] shadow-2xl sm:rounded-[44px]">
          <div className="rounded-[36px] bg-[#0a0a0a] p-[2px] sm:rounded-[40px]">
            <div className="relative overflow-hidden rounded-[34px] sm:rounded-[38px]">
              <div className="relative h-[520px] w-full overflow-hidden bg-gradient-to-b from-[#0B1739] to-[#1A1240] text-white sm:h-[560px]">
                {/* Dynamic island */}
                <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black sm:h-7 sm:w-28" />
                {step === 'open' && <HomeScreen onOpen={() => advance('scan-cta')} active={active} />}
                {step === 'scan-cta' && <AppScreen onScan={() => advance('scanning')} active={active} />}
                {step === 'scanning' && <ScanScreen />}
                {step === 'amount' && (
                  <AmountScreen
                    amount={amount}
                    onPay={() => advance('pay')}
                    ready={amount === '500'}
                    active={active}
                  />
                )}
                {step === 'pay' && <PayingScreen glitch={glitch} />}
                {step === 'done' && <DoneScreen glitch={glitch} />}
                {glitch >= 1 && <GlitchOverlay level={glitch} />}
              </div>
            </div>
          </div>
        </div>
        {/* Side buttons */}
        <div className="absolute left-[-3px] top-24 h-10 w-[3px] rounded-l-md bg-[#0a0a0a]/80" />
        <div className="absolute left-[-3px] top-40 h-16 w-[3px] rounded-l-md bg-[#0a0a0a]/80" />
        <div className="absolute right-[-3px] top-32 h-20 w-[3px] rounded-r-md bg-[#0a0a0a]/80" />
      </motion.div>
      {active && step !== 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/75 ring-1 ring-white/15"
        >
          {hint}
        </motion.div>
      )}
    </div>
  );
}

function HomeScreen({ onOpen, active }) {
  const apps = [
    { id: 'pay',  label: 'Pay',     bg: 'bg-emerald-500', icon: <IndianRupee className="h-6 w-6" /> },
    { id: 'chat', label: 'Chat',    bg: 'bg-blue-500',    icon: '💬' },
    { id: 'reel', label: 'Reels',   bg: 'bg-pink-500',    icon: '🎬' },
    { id: 'game', label: 'Game',    bg: 'bg-orange-500',  icon: '🎮' },
    { id: 'mus',  label: 'Music',   bg: 'bg-purple-500',  icon: '🎵' },
    { id: 'cam',  label: 'Camera',  bg: 'bg-slate-500',   icon: '📷' },
  ];
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex-1 px-4 py-3">
        <div className="grid grid-cols-3 gap-3">
          {apps.map((a, i) => (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={a.id === 'pay' && active ? onOpen : undefined}
              className={`relative flex flex-col items-center gap-1 ${a.id === 'pay' && active ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow ${a.bg}`}>
                {a.icon}
              </div>
              <div className="text-[10px] text-white/70">{a.label}</div>
              {a.id === 'pay' && active && (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-2xl ring-2 ring-amber-300"
                  animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
      <Dock />
    </div>
  );
}

function AppScreen({ onScan, active }) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold">PayQuick</div>
        <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
          Balance hidden
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-3">
        <motion.button
          onClick={active ? onScan : undefined}
          whileTap={active ? { scale: 0.96 } : undefined}
          className={`relative col-span-2 flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold shadow ${active ? 'cursor-pointer bg-emerald-500 text-white' : 'cursor-default bg-emerald-500/50 text-white/80'}`}
        >
          <ScanLine className="h-5 w-5" /> Scan &amp; Pay
          {active && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-2xl ring-2 ring-amber-300"
              animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.03, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
        </motion.button>
        <div className="rounded-xl bg-white/10 px-3 py-3 text-center text-xs">To bank a/c</div>
        <div className="rounded-xl bg-white/10 px-3 py-3 text-center text-xs">To contact</div>
        <div className="rounded-xl bg-white/10 px-3 py-3 text-center text-xs">Recharge</div>
        <div className="rounded-xl bg-white/10 px-3 py-3 text-center text-xs">Bills</div>
      </div>
      <div className="mt-auto px-4 pb-3 text-[10px] text-white/40">
        Last payment · ₹120 · Yesterday
      </div>
    </div>
  );
}

function ScanScreen() {
  return (
    <div className="flex h-full flex-col">
      <StatusBar dark />
      <div className="relative flex flex-1 items-center justify-center bg-black">
        {/* Fake camera viewfinder */}
        <div className="relative h-44 w-44 rounded-2xl border-2 border-white/40">
          {/* corners */}
          {[
            'top-0 left-0 border-l-4 border-t-4',
            'top-0 right-0 border-r-4 border-t-4',
            'bottom-0 left-0 border-l-4 border-b-4',
            'bottom-0 right-0 border-r-4 border-b-4',
          ].map((c, i) => (
            <span key={i} className={`absolute h-6 w-6 border-emerald-400 ${c} rounded`} />
          ))}
          {/* QR code grid */}
          <div className="absolute inset-3 grid grid-cols-9 grid-rows-9 gap-[2px] bg-white p-2">
            {Array.from({ length: 81 }).map((_, i) => (
              <div
                key={i}
                className={`${pseudoRandom(i) ? 'bg-black' : 'bg-white'}`}
              />
            ))}
            {/* finder squares */}
            <div className="absolute left-2 top-2 h-7 w-7 border-[3px] border-black" />
            <div className="absolute right-2 top-2 h-7 w-7 border-[3px] border-black" />
            <div className="absolute bottom-2 left-2 h-7 w-7 border-[3px] border-black" />
          </div>
          {/* scan line */}
          <motion.div
            aria-hidden
            className="absolute left-3 right-3 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34D399]"
            initial={{ top: 8 }}
            animate={{ top: [8, 168, 8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
      <div className="px-4 py-3 text-center text-xs text-white/70">Scanning QR…</div>
    </div>
  );
}

function AmountScreen({ amount, onPay, ready, active }) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="px-4 pt-3 text-xs text-white/60">Pay to</div>
      <div className="flex items-center gap-2 px-4 pt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-amber-900">
          B
        </div>
        <div className="text-sm font-semibold">Brother · ICICI ••• 4823</div>
      </div>
      <div className="mt-5 flex flex-1 flex-col items-center justify-center px-4">
        <div className="text-xs uppercase tracking-widest text-white/40">Amount</div>
        <div className="mt-1 flex items-end justify-center text-5xl font-extrabold">
          <span className="text-3xl text-white/60">₹</span>
          <span>{amount || '0'}</span>
          <motion.span
            aria-hidden
            className="ml-0.5 inline-block h-9 w-[3px] bg-white/70"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
        <div className="mt-2 text-xs text-white/50">Auto-filling for you</div>
      </div>
      <div className="px-4 pb-4">
        <motion.button
          onClick={ready && active ? onPay : undefined}
          whileTap={ready && active ? { scale: 0.97 } : undefined}
          className={`relative flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold shadow ${
            ready && active ? 'bg-emerald-500 text-white' : 'bg-white/15 text-white/50'
          }`}
        >
          PAY ₹500
          {ready && active && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-2xl ring-2 ring-amber-300"
              animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.03, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>
    </div>
  );
}

function PayingScreen({ glitch }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="h-16 w-16 rounded-full border-4 border-emerald-400 border-t-transparent"
      />
      <div className="text-base font-semibold">Processing…</div>
      <div className="text-xs text-white/60">
        {glitch >= 2 ? 'Connecting to bank — unstable network' : 'Reaching the bank server'}
      </div>
    </div>
  );
}

function DoneScreen({ glitch }) {
  const failed = glitch >= 2;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      {failed ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-300">
            <Wifi className="h-8 w-8" />
          </div>
          <div className="text-base font-semibold text-rose-200">Payment stuck</div>
          <div className="text-xs text-white/60">The signal is unstable. Try again.</div>
        </>
      ) : (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-200">
            <Check className="h-8 w-8" />
          </div>
          <div className="text-base font-semibold">₹500 sent — almost!</div>
          <div className="text-xs text-white/60">Waiting on bank confirmation…</div>
        </>
      )}
    </div>
  );
}

function GlitchOverlay({ level }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* scan lines */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(34,211,238,0.18) 0 2px, transparent 2px 5px)',
        }}
      />
      {/* magenta + cyan colour split */}
      {level >= 2 && (
        <>
          <motion.div
            className="absolute inset-0 bg-fuchsia-500/15 mix-blend-screen"
            animate={{ x: [-2, 2, -2] }}
            transition={{ duration: 0.18, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 bg-cyan-400/15 mix-blend-screen"
            animate={{ x: [2, -2, 2] }}
            transition={{ duration: 0.18, repeat: Infinity }}
          />
        </>
      )}
      {/* heavy distortion bars */}
      {level >= 3 && (
        <motion.div
          className="absolute inset-x-0 h-10 bg-white/10 mix-blend-overlay"
          initial={{ top: '-10%' }}
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {level >= 4 && (
        <div className="absolute inset-0 bg-black/40" />
      )}
    </div>
  );
}

function StatusBar({ dark = false }) {
  return (
    <div className={`flex items-center justify-between px-4 py-2 text-[10px] ${dark ? 'text-white/70' : 'text-white/60'}`}>
      <span>9:42</span>
      <div className="flex items-center gap-1">
        <span>5G</span>
        <span>📶</span>
        <span>🔋</span>
      </div>
    </div>
  );
}

function Dock() {
  return (
    <div className="mx-3 mb-3 mt-auto rounded-2xl bg-white/10 p-3">
      <div className="flex justify-around text-xl">
        <span>📞</span>
        <span>💬</span>
        <span>🌐</span>
        <span>🎵</span>
      </div>
    </div>
  );
}

function pseudoRandom(n) {
  // Stable "looks like a QR" pattern without importing a real generator.
  const x = Math.sin(n * 12.345 + 7.89) * 10000;
  return (x - Math.floor(x)) > 0.55;
}
