import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Send, Smartphone, IndianRupee, Wifi, Bluetooth, Battery, Signal,
  Search, Bell, ChevronRight, Check, X, AlertTriangle, Camera, History, Wallet,
} from 'lucide-react';

/**
 * PaymentPhone — fully redesigned. Stages:
 *
 *   home       → realistic phone home screen with 16 app icons,
 *                wallpaper, dock, status bar. The PhonePe icon glows
 *                so the learner knows what to tap.
 *   pe-home    → PhonePe-style app dashboard: purple gradient header,
 *                balance card, action grid, recent contacts row, money
 *                management list, bottom nav. The Scan QR action glows.
 *   scanning   → camera viewfinder with brother's QR code, scan line,
 *                "Detecting QR" overlay.
 *   amount     → PhonePe payment screen: contact card, amount input
 *                with auto-filled ₹500, note field, big PAY button.
 *   processing → PhonePe-style spinner with progress messages
 *   done       → success (or failed if glitch >= 2)
 *
 * Props match the previous PaymentPhone so the parent Act doesn't need
 * to change anything about how it mounts this.
 */

const PHONEPE = {
  purple: '#5F259F',
  purpleDark: '#4A1D7F',
  purpleLight: '#7C3AED',
  bgGray: '#F3F4F6',
};

export default function PaymentPhone({
  active = true,
  glitch = 0,
  onStep,
  onComplete,
  hint = 'Tap the highlighted button to continue',
}) {
  const [step, setStep] = useState('home');
  const [amount, setAmount] = useState('');
  const completedRef = useRef(false);

  const advance = (next) => {
    setStep(next);
    onStep?.(next);
    if (next === 'done' && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => onComplete?.(), 1400);
    }
  };

  // Auto-advance scanning → amount after scan animation
  useEffect(() => {
    if (step !== 'scanning') return;
    const id = setTimeout(() => advance('amount'), 2200);
    return () => clearTimeout(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-type 500 in amount step
  useEffect(() => {
    if (step !== 'amount') return;
    setAmount('');
    const digits = ['5', '0', '0'];
    const ids = digits.map((d, i) =>
      setTimeout(() => setAmount((prev) => prev + d), 350 + i * 250)
    );
    return () => ids.forEach(clearTimeout);
  }, [step]);

  // Processing → done
  useEffect(() => {
    if (step !== 'processing') return;
    const id = setTimeout(() => advance('done'), 1800);
    return () => clearTimeout(id);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const shake = glitch >= 2 ? { x: [-2, 2, -3, 3, 0], y: [1, -1, 2, -2, 0] } : { x: 0, y: 0 };

  return (
    <div className="relative mx-auto flex flex-col items-center gap-3">
      <motion.div
        animate={shake}
        transition={{ duration: 0.18, repeat: glitch >= 2 ? Infinity : 0 }}
        className="relative mx-auto w-[290px] sm:w-[320px] md:w-[340px]"
      >
        {/* iPhone-like outer shell */}
        <div className="rounded-[44px] bg-gradient-to-b from-[#2A2A2E] via-[#1A1A1F] to-[#0E0E12] p-[6px] shadow-2xl">
          <div className="rounded-[40px] bg-black p-[2px]">
            <div className="relative overflow-hidden rounded-[38px]">
              <div className="relative h-[560px] w-full overflow-hidden sm:h-[600px]">
                {/* Dynamic island */}
                <div className="pointer-events-none absolute left-1/2 top-2 z-50 h-6 w-24 -translate-x-1/2 rounded-full bg-black sm:h-7 sm:w-28" />
                {step === 'home'       && <HomeScreen onOpen={() => advance('pe-home')} active={active} />}
                {step === 'pe-home'    && <PhonePeHome onScan={() => advance('scanning')} active={active} />}
                {step === 'scanning'   && <ScanScreen />}
                {step === 'amount'     && (
                  <AmountScreen
                    amount={amount}
                    onPay={() => advance('processing')}
                    ready={amount === '500'}
                    active={active}
                  />
                )}
                {step === 'processing' && <ProcessingScreen glitch={glitch} />}
                {step === 'done'       && <DoneScreen glitch={glitch} />}
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
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/15 backdrop-blur"
        >
          {hint}
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================
 * iOS-style HOME SCREEN — 4×4 app grid + dock, real wallpaper feel
 * ============================================================ */
function HomeScreen({ onOpen, active }) {
  const apps = [
    { id: 'phonepe', label: 'PhonePe',   bg: 'bg-gradient-to-br from-[#5F259F] to-[#7C3AED]', icon: <PhonePeIcon /> },
    { id: 'wa',      label: 'WhatsApp',  bg: 'bg-gradient-to-br from-emerald-500 to-emerald-700', icon: '💬' },
    { id: 'ig',      label: 'Instagram', bg: 'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400', icon: '📷' },
    { id: 'yt',      label: 'YouTube',   bg: 'bg-red-600', icon: '▶' },
    { id: 'maps',    label: 'Maps',      bg: 'bg-blue-500', icon: '🗺️' },
    { id: 'gpay',    label: 'GPay',      bg: 'bg-white border border-gray-200', icon: <GPayIcon /> },
    { id: 'gmail',   label: 'Gmail',     bg: 'bg-white border border-gray-200', icon: '✉️' },
    { id: 'chrome',  label: 'Chrome',    bg: 'bg-white border border-gray-200', icon: '🌐' },
    { id: 'photos',  label: 'Photos',    bg: 'bg-gradient-to-br from-purple-400 to-fuchsia-500', icon: '🖼️' },
    { id: 'spot',    label: 'Spotify',   bg: 'bg-green-500', icon: '🎵' },
    { id: 'cam',     label: 'Camera',    bg: 'bg-slate-700', icon: '📸' },
    { id: 'set',     label: 'Settings',  bg: 'bg-gradient-to-br from-gray-300 to-gray-500', icon: '⚙️' },
    { id: 'play',    label: 'Play',      bg: 'bg-white border border-gray-200', icon: '▶️' },
    { id: 'calc',    label: 'Calc',      bg: 'bg-orange-500', icon: '🧮' },
    { id: 'note',    label: 'Notes',     bg: 'bg-yellow-300', icon: '📝' },
    { id: 'clock',   label: 'Clock',     bg: 'bg-black', icon: '⏰' },
  ];
  const dock = [
    { id: 'phone',   bg: 'bg-emerald-500', icon: '📞' },
    { id: 'message', bg: 'bg-green-500',   icon: '💭' },
    { id: 'safari',  bg: 'bg-sky-500',     icon: '🧭' },
    { id: 'music',   bg: 'bg-pink-500',    icon: '🎶' },
  ];
  return (
    <div
      className="flex h-full flex-col text-white"
      style={{
        background:
          'linear-gradient(180deg, #1E3A8A 0%, #5F259F 40%, #B91C1C 100%)',
      }}
    >
      {/* Status bar */}
      <PhoneStatusBar light />
      {/* Date + time card */}
      <div className="px-6 pt-2 text-center">
        <div className="text-[11px] font-medium tracking-wide text-white/85">Wed, 28 May</div>
        <div className="text-[44px] font-light leading-none">9:42</div>
      </div>
      {/* App grid */}
      <div className="mt-4 grid grid-cols-4 gap-3 px-4">
        {apps.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
            onClick={a.id === 'phonepe' && active ? onOpen : undefined}
            className={`relative flex flex-col items-center gap-1 ${a.id === 'phonepe' && active ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!(a.id === 'phonepe' && active)}
          >
            <div className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-[12px] text-lg shadow-md ${a.bg}`}>
              {typeof a.icon === 'string' ? <span>{a.icon}</span> : a.icon}
            </div>
            <div className="text-[9.5px] leading-tight text-white">{a.label}</div>
            {a.id === 'phonepe' && active && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-[14px] ring-2 ring-amber-300"
                animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
            {a.id === 'phonepe' && active && (
              <motion.div
                className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 shadow"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                Tap me
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      {/* Spacer */}
      <div className="flex-1" />
      {/* Dock */}
      <div className="mx-3 mb-2 rounded-[22px] bg-white/15 p-2 backdrop-blur-xl">
        <div className="flex justify-around">
          {dock.map((d) => (
            <div key={d.id} className={`flex h-12 w-12 items-center justify-center rounded-[12px] text-xl ${d.bg} shadow`}>
              <span>{d.icon}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Home indicator */}
      <div className="flex justify-center pb-1.5">
        <div className="h-[5px] w-32 rounded-full bg-white/85" />
      </div>
    </div>
  );
}

/* ============================================================
 * PhonePe-style HOME / DASHBOARD inside the app
 * ============================================================ */
function PhonePeHome({ onScan, active }) {
  const contacts = [
    { id: '1', name: 'Brother', avatar: 'B', bg: 'bg-amber-400' },
    { id: '2', name: 'Riya',    avatar: 'R', bg: 'bg-pink-400' },
    { id: '3', name: 'Papa',    avatar: 'P', bg: 'bg-sky-400' },
    { id: '4', name: 'Mom',     avatar: 'M', bg: 'bg-emerald-400' },
    { id: '5', name: 'Ravi',    avatar: 'R', bg: 'bg-violet-400' },
  ];
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <PhoneStatusBar light />
      {/* Purple header */}
      <div
        className="px-4 pt-2 pb-5 text-white"
        style={{ background: `linear-gradient(180deg, ${PHONEPE.purple}, ${PHONEPE.purpleDark})` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#5F259F] font-bold text-[12px]">
              R
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/65">Welcome</div>
              <div className="text-sm font-bold">Hi, Ritwik</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-white/85" />
            <Bell className="h-4 w-4 text-white/85" />
          </div>
        </div>
        {/* Big Scan button */}
        <motion.button
          onClick={active ? onScan : undefined}
          whileTap={active ? { scale: 0.97 } : undefined}
          className={`relative mt-4 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-[#5F259F] shadow ${active ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4ECFF]">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Scan &amp; Pay</div>
              <div className="text-[10px] text-gray-500">Scan any QR to pay anyone</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {active && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-2xl ring-2 ring-amber-300"
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.02, 1] }}
              transition={{ duration: 1.3, repeat: Infinity }}
            />
          )}
        </motion.button>
      </div>

      {/* Action grid */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-3 shadow-sm">
          <ActionTile icon={<Smartphone className="h-4 w-4" />} label="To Mobile" tint="bg-[#F4ECFF] text-[#5F259F]" />
          <ActionTile icon={<Send       className="h-4 w-4" />} label="To Bank/UPI" tint="bg-[#E0F2FE] text-sky-700" />
          <ActionTile icon={<Wallet     className="h-4 w-4" />} label="To Self" tint="bg-[#FEF3C7] text-amber-700" />
          <ActionTile icon={<History    className="h-4 w-4" />} label="History" tint="bg-[#FCE7F3] text-pink-700" />
        </div>
      </div>

      {/* Recent contacts row */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-gray-700">People</div>
          <div className="text-[10px] text-[#5F259F]">View all</div>
        </div>
        <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
          {contacts.map((c) => (
            <div key={c.id} className="flex shrink-0 flex-col items-center gap-1">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${c.bg}`}>
                {c.avatar}
              </div>
              <div className="text-[10px] text-gray-600">{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Money mgmt rows */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-3 shadow-sm">
        <div className="text-xs font-bold text-gray-700">Money management</div>
        <div className="mt-2 divide-y divide-gray-100">
          {[
            { icon: '💳', label: 'Check Balance', sub: 'Free of cost' },
            { icon: '📊', label: 'Track expenses', sub: 'Monthly insights' },
            { icon: '🎁', label: 'Earn rewards',  sub: '5 cashbacks waiting' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4ECFF] text-base">{r.icon}</div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-gray-800">{r.label}</div>
                <div className="text-[10px] text-gray-500">{r.sub}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="mt-auto border-t border-gray-200 bg-white py-2">
        <div className="grid grid-cols-4 text-[10px]">
          <BottomNav icon="🏠" label="Home" active />
          <BottomNav icon="📱" label="Mobile" />
          <BottomNav icon="🎫" label="Tickets" />
          <BottomNav icon="🛒" label="Stores" />
        </div>
      </div>
    </div>
  );
}

function ActionTile({ icon, label, tint }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
      <div className="text-[10px] text-gray-700 text-center leading-tight">{label}</div>
    </div>
  );
}

function BottomNav({ icon, label, active = false }) {
  return (
    <div className={`flex flex-col items-center ${active ? 'text-[#5F259F]' : 'text-gray-400'}`}>
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

/* ============================================================
 * QR SCAN screen — camera viewfinder + animated scan line
 * ============================================================ */
function ScanScreen() {
  return (
    <div className="flex h-full flex-col">
      <PhoneStatusBar dark />
      <div className="relative flex flex-1 items-center justify-center bg-black">
        {/* Camera "viewfinder" overlay */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-white">
          <Camera className="h-5 w-5" />
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">Scan QR</span>
          <X className="h-4 w-4" />
        </div>
        {/* QR viewfinder box */}
        <div className="relative h-52 w-52 rounded-2xl border-2 border-white/40">
          {[
            'top-0 left-0 border-l-4 border-t-4 rounded-tl-xl',
            'top-0 right-0 border-r-4 border-t-4 rounded-tr-xl',
            'bottom-0 left-0 border-l-4 border-b-4 rounded-bl-xl',
            'bottom-0 right-0 border-r-4 border-b-4 rounded-br-xl',
          ].map((c, i) => (
            <span key={i} className={`absolute h-8 w-8 border-emerald-400 ${c}`} />
          ))}
          {/* Fake QR pattern */}
          <div className="absolute inset-4 grid grid-cols-12 grid-rows-12 gap-[1px] bg-white p-2">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className={pseudoRandom(i) ? 'bg-black' : 'bg-white'} />
            ))}
            {/* finder corners */}
            <div className="absolute left-2 top-2 h-7 w-7 border-[3px] border-black" />
            <div className="absolute right-2 top-2 h-7 w-7 border-[3px] border-black" />
            <div className="absolute bottom-2 left-2 h-7 w-7 border-[3px] border-black" />
          </div>
          {/* Scan line */}
          <motion.div
            aria-hidden
            className="absolute left-3 right-3 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34D399]"
            initial={{ top: 8 }}
            animate={{ top: [8, 200, 8] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 text-white">
          <div className="rounded-full bg-white/15 px-3 py-1.5 text-[11px]">
            Detecting QR…
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Amount entry screen — PhonePe style
 * ============================================================ */
function AmountScreen({ amount, onPay, ready, active }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <PhoneStatusBar dark />
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{ background: `linear-gradient(180deg, ${PHONEPE.purple}, ${PHONEPE.purpleDark})` }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-amber-900 text-sm font-bold">
          B
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">Brother</div>
          <div className="text-[10px] text-white/75">UPI · brother@ybl · ICICI ••4823</div>
        </div>
        <span className="rounded-full bg-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
          Verified
        </span>
      </div>

      {/* Amount display */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="text-[10px] uppercase tracking-widest text-gray-400">Enter Amount</div>
        <div className="mt-2 flex items-end justify-center text-5xl font-extrabold text-gray-900">
          <span className="text-3xl text-gray-400">₹</span>
          <span>{amount || '0'}</span>
          <motion.span
            aria-hidden
            className="ml-0.5 inline-block h-9 w-[3px] bg-gray-700"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
        <div className="mt-2 text-[10px] text-gray-500">Auto-filling for you</div>
        <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-[11px] text-gray-600">
          📝 Note: For brother — urgent
        </div>
      </div>

      {/* Pay button */}
      <div className="px-4 pb-4">
        <div className="mb-2 text-center text-[10px] text-gray-500">
          UPI: paying via ICICI ••4823
        </div>
        <motion.button
          onClick={ready && active ? onPay : undefined}
          whileTap={ready && active ? { scale: 0.97 } : undefined}
          className={`relative flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold shadow ${
            ready && active
              ? 'bg-gradient-to-r from-[#5F259F] to-[#7C3AED] text-white'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          <IndianRupee className="h-4 w-4" />
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

/* ============================================================
 * Processing — PhonePe-style loader with status flips
 * ============================================================ */
function ProcessingScreen({ glitch }) {
  const [msg, setMsg] = useState(0);
  const messages = glitch >= 2
    ? ['Connecting to bank…', 'Checking balance…', 'Network unstable…']
    : ['Connecting to bank…', 'Verifying VPA…', 'Almost there…'];
  useEffect(() => {
    const id = setInterval(() => setMsg((m) => (m + 1) % messages.length), 600);
    return () => clearInterval(id);
  }, [messages.length]);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="h-16 w-16 rounded-full border-4 border-[#5F259F] border-t-transparent"
      />
      <div>
        <div className="text-base font-bold text-gray-900">Paying ₹500</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={msg}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mt-1 text-[11px] text-gray-500"
          >
            {messages[msg]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Secured by UPI · 2-factor authentication
      </div>
    </div>
  );
}

/* ============================================================
 * Done — success card or failed card depending on glitch level
 * ============================================================ */
function DoneScreen({ glitch }) {
  const failed = glitch >= 2;
  return (
    <div className="flex h-full flex-col bg-white">
      <PhoneStatusBar dark />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        {failed ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100"
            >
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </motion.div>
            <div className="text-lg font-bold text-rose-700">Payment failed</div>
            <div className="text-xs text-gray-500">
              Network unstable. The money stayed in your account.
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
            >
              <Check className="h-10 w-10 text-emerald-600" />
            </motion.div>
            <div className="text-lg font-bold text-emerald-700">₹500 sent!</div>
            <div className="text-xs text-gray-500">To Brother · UPI Ref 432819</div>
            <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 ring-1 ring-emerald-200">
              Bank confirmation received
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Glitch overlay
 * ============================================================ */
function GlitchOverlay({ level }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40">
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(34,211,238,0.18) 0 2px, transparent 2px 5px)',
        }}
      />
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
      {level >= 3 && (
        <motion.div
          className="absolute inset-x-0 h-10 bg-white/10 mix-blend-overlay"
          initial={{ top: '-10%' }}
          animate={{ top: ['-10%', '110%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {level >= 4 && <div className="absolute inset-0 bg-black/40" />}
    </div>
  );
}

/* ============================================================
 * Shared phone status bar — switches between light/dark text
 * ============================================================ */
function PhoneStatusBar({ light = false, dark = false }) {
  const cls = light ? 'text-white' : dark ? 'text-gray-900' : 'text-gray-900';
  return (
    <div className={`flex h-9 items-center justify-between px-5 pt-2 text-[10px] font-semibold ${cls}`}>
      <span>9:42</span>
      <span className="flex items-center gap-1">
        <Signal className="h-3 w-3" strokeWidth={2.5} />
        <Wifi className="h-3 w-3" strokeWidth={2.5} />
        <Bluetooth className="h-2.5 w-2.5" strokeWidth={2.5} />
        <Battery className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    </div>
  );
}

/* PhonePe icon — simplified violet square with the "Pe" mark */
function PhonePeIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7">
      <rect width="48" height="48" rx="11" fill="#5F259F" />
      <path d="M16 18 H30 V21 H24 V32 H21 V21 H16 Z" fill="#FFFFFF" />
      <circle cx="32" cy="30" r="3" fill="#FFFFFF" />
    </svg>
  );
}

/* GPay icon — colourful G */
function GPayIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7">
      <rect width="48" height="48" rx="11" fill="#FFFFFF" />
      <path d="M34 24c0-1-.1-2-.2-2.9H24v5.5h5.6c-.2 1.4-1 2.6-2.1 3.4v2.8h3.4c2-1.8 3.1-4.5 3.1-8.8z" fill="#4285F4" />
      <path d="M24 35c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4h-3.5v2.5C16.7 32.8 20.1 35 24 35z" fill="#34A853" />
      <path d="M18.6 26.9c-.4-1.4-.4-2.9 0-4.3v-2.5h-3.5C13.6 22.7 13.6 25.3 15 28l3.6-1.1z" fill="#FBBC04" />
      <path d="M24 17c1.5 0 2.8.5 3.9 1.5l2.9-2.9C29 14 26.7 13 24 13c-3.9 0-7.3 2.2-9 5.5l3.5 2.7c.7-2.3 2.9-4.2 5.5-4.2z" fill="#EA4335" />
    </svg>
  );
}

function pseudoRandom(n) {
  const x = Math.sin(n * 12.345 + 7.89) * 10000;
  return (x - Math.floor(x)) > 0.55;
}
