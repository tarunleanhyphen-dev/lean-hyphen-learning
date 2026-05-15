import { motion } from 'framer-motion';
import { Signal, Wifi, BatteryMedium } from 'lucide-react';

/**
 * Responsive phone mockup. Scales down on mobile, up on desktop, while keeping
 * a realistic device feel (bezel, dynamic island, side buttons).
 */
export default function PhoneFrame({ children, dim = false }) {
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative mx-auto w-[300px] max-w-full sm:w-[340px] md:w-[360px] lg:w-[380px]"
    >
      <div className="rounded-[40px] bg-gradient-to-b from-[#222] via-[#161616] to-[#0e0e0e] p-[6px] shadow-phone sm:rounded-[44px]">
        <div className="rounded-[36px] bg-[#0a0a0a] p-[2px] sm:rounded-[40px]">
          <div className="relative overflow-hidden rounded-[34px] bg-white sm:rounded-[38px]">
            {/* Status bar */}
            <div className="flex h-9 items-center justify-between bg-white px-5 pt-2 text-[11px] font-semibold text-ink-900 sm:h-10 sm:px-6">
              <span>9:41</span>
              <span className="flex items-center gap-1.5">
                <Signal className="h-3 w-3" strokeWidth={2.5} />
                <Wifi className="h-3 w-3" strokeWidth={2.5} />
                <BatteryMedium className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black sm:h-7 sm:w-28" />

            <div className="phone-scroll relative h-[560px] overflow-y-auto bg-cream-50 sm:h-[600px] lg:h-[640px]">
              {children}
            </div>

            {dim && <div className="pointer-events-none absolute inset-0 bg-ink-900/30" />}
          </div>
        </div>
      </div>

      <div className="absolute left-[-3px] top-24 h-10 w-[3px] rounded-l-md bg-[#0a0a0a]/80" />
      <div className="absolute left-[-3px] top-40 h-16 w-[3px] rounded-l-md bg-[#0a0a0a]/80" />
      <div className="absolute right-[-3px] top-32 h-20 w-[3px] rounded-r-md bg-[#0a0a0a]/80" />
    </motion.div>
  );
}
