import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  Search, ShoppingBag, Heart, Bell, Truck, Clock, Star, MapPin,
  ChevronRight, BadgePercent, Flame,
} from 'lucide-react';
import { products, freeDeliveryThreshold } from '../../data/lessons/thinkBeforeYouSpend.js';

const CATEGORIES = [
  { id: 'footwear', label: 'Footwear', emoji: '👟' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'beauty',   label: 'Beauty',   emoji: '💄' },
  { id: 'tech',     label: 'Tech',     emoji: '⌚' },
  { id: 'bags',     label: 'Bags',     emoji: '🎒' },
  { id: 'jewelry',  label: 'Jewelry',  emoji: '💍' },
];

const HERO_SLIDES = [
  { id: 'birthday', title: 'Birthday Sale', sub: '30% OFF · ends tonight', tone: 'from-coral-500 to-saffron-500', emoji: '🎂' },
  { id: 'flash',    title: 'Flash Drop',     sub: 'New sneakers · while stocks last', tone: 'from-burgundy-500 to-coral-500', emoji: '⚡' },
  { id: 'free',     title: 'Free Delivery',  sub: 'On orders above ₹2,999',           tone: 'from-teal-500 to-saffron-500', emoji: '🚚' },
];

export default function MockShoppingApp({ state = {} }) {
  const cartIds = state.cart || [];
  const cartTotal = cartIds.reduce((sum, id) => sum + (products[id]?.price || 0), 0);
  const reached = state.deliveryUnlocked || cartTotal >= freeDeliveryThreshold;

  return (
    <div className={`relative min-h-full bg-cream-50 pb-32 ${state.silent ? 'saturate-50' : ''}`}>
      <AppHeader cartCount={cartIds.length} />
      <Greeting />
      <SearchBar value={state.search || ''} scrollHint={state.scrollHint} />
      <CategoryStrip />
      <HeroCarousel />

      {state.showProduct && (
        <FeaturedProduct id={state.showProduct} badge={state.badge} tapping={state.tapTarget === 'primary-cta'} />
      )}

      {state.deliveryBanner && (
        <DeliveryBanner total={cartTotal} reached={reached} />
      )}

      {state.showProduct && <CouponStrip />}

      {state.recommendations?.length > 0 && (
        <RecommendationRow
          label={state.rowLabel}
          ids={state.recommendations}
          socialProofId={state.socialProof}
          flashId={state.flashDeal}
          highlightId={state.highlight}
          tapTarget={state.tapTarget}
        />
      )}

      {/* Always-on filler so the screen never feels empty */}
      <FlashSaleStrip />
      <ReviewsSnippet />

      <FloatPlusOne id={state.floatAdd} />

      <AnimatePresence>
        {state.cartOpen && (
          <CartDrawer ids={cartIds} total={cartTotal} reveal={state.revealTotal} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Top chrome =================== */

function AppHeader({ cartCount }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur ring-1 ring-ink-300/10">
      <div className="flex items-center gap-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-coral-500 text-[10px] font-extrabold text-white">S</span>
        <span className="text-[15px] font-extrabold tracking-tight text-coral-500">
          spree<span className="text-ink-900">.</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-ink-700">
        <span className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-coral-500" />
        </span>
        <Heart className="h-4 w-4" />
        <CartBadge count={cartCount} />
      </div>
    </header>
  );
}

function Greeting() {
  return (
    <div className="bg-white px-4 pt-3 pb-2">
      <div className="text-[15px] font-extrabold text-ink-900">Hi Shanaya 👋</div>
      <div className="text-[11px] text-ink-500">Your birthday is in 2 days · pick something special</div>
    </div>
  );
}

function CartBadge({ count }) {
  return (
    <div className="relative">
      <motion.div
        key={count}
        initial={{ scale: count > 0 ? 1.35 : 1 }}
        animate={{ scale: 1, rotate: count > 0 ? [0, -10, 8, 0] : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 14 }}
      >
        <ShoppingBag className="h-5 w-5" />
      </motion.div>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-bold text-white shadow"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchBar({ value, scrollHint }) {
  return (
    <div className="relative bg-white px-4 pb-3 pt-1">
      <div className="flex items-center gap-2 rounded-full border border-ink-300/30 bg-cream-50 px-3 py-2 text-sm text-ink-700">
        <Search className="h-4 w-4 text-ink-500" />
        <span className="font-medium">
          {value || <span className="text-ink-300">Search for shoes, hoodies…</span>}
        </span>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {['Trending', 'Birthday', 'Sneakers', 'Drop', 'Sale'].map((t) => (
          <span key={t} className="rounded-full bg-cream-100 px-3 py-1">{t}</span>
        ))}
      </div>
      {scrollHint && <ScrollHint />}
    </div>
  );
}

function ScrollHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 4 }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'mirror' }}
      className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-900/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow"
    >
      ↓ scrolling…
    </motion.div>
  );
}

/* =================== Categories + Hero =================== */

function CategoryStrip() {
  return (
    <div className="bg-white px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.95 }}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-xl shadow-inner ring-1 ring-ink-300/10">
              {c.emoji}
            </span>
            <span className="text-[10px] font-semibold text-ink-700">{c.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % HERO_SLIDES.length), 3500);
    return () => clearInterval(t);
  }, []);
  const slide = HERO_SLIDES[i];
  return (
    <div className="px-4 pt-1">
      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.45 }}
            className={`flex items-center justify-between bg-gradient-to-r ${slide.tone} px-4 py-3 text-white`}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Today</div>
              <div className="text-[15px] font-extrabold leading-tight">{slide.title}</div>
              <div className="text-[11px] opacity-90">{slide.sub}</div>
            </div>
            <span className="text-3xl drop-shadow">{slide.emoji}</span>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
          {HERO_SLIDES.map((s, idx) => (
            <span key={s.id} className={`h-1 rounded-full transition-all ${idx === i ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* =================== Featured product =================== */

function FeaturedProduct({ id, badge, tapping }) {
  const p = products[id];
  if (!p) return null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-4 mt-3 overflow-hidden rounded-2xl bg-white shadow ring-1 ring-ink-300/10"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-cream-100 to-cream-200">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 grid place-items-center text-[72px]"
        >
          {p.emoji}
        </motion.div>
        <div className="absolute left-3 top-3 chip bg-coral-500 text-white">
          <Star className="h-3 w-3 fill-current" /> Trending Now
        </div>
        <div className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
          <Heart className="h-3.5 w-3.5" />
        </div>
        <div className="absolute bottom-2 left-3 flex gap-1">
          <span className="h-3 w-3 rounded-full bg-white ring-1 ring-ink-300/40" />
          <span className="h-3 w-3 rounded-full bg-ink-900 ring-1 ring-ink-300/40" />
          <span className="h-3 w-3 rounded-full bg-coral-500 ring-1 ring-ink-300/40" />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-ink-900">{p.name}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
              <Star className="h-3 w-3 fill-saffron-500 text-saffron-500" />
              {p.rating} · 1,283 reviews
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-ink-500 line-through">₹2,199</div>
          </div>
        </div>

        {/* Size selector */}
        <div className="mt-2">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">Select size · UK</div>
          <div className="flex gap-1.5">
            {['6', '7', '8', '9', '10'].map((s, idx) => (
              <span
                key={s}
                className={`grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold ring-1 ${
                  idx === 1
                    ? 'bg-ink-900 text-white ring-ink-900'
                    : 'bg-white text-ink-700 ring-ink-300/30'
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Delivery row */}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-700">
          <Truck className="h-3.5 w-3.5 text-teal-500" />
          FREE delivery by <strong>Sat, 17 May</strong>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-500">
            <MapPin className="h-3 w-3" /> 110001
          </span>
        </div>

        <div className="relative">
          <button className="mt-3 w-full rounded-xl bg-coral-500 py-2.5 text-sm font-bold text-white shadow-sm">
            Add to Cart
          </button>
          {tapping && <TapPulse />}
        </div>
        <AnimatePresence>
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-2 rounded-lg bg-teal-500/10 px-3 py-1.5 text-[11px] font-semibold text-teal-500"
            >
              {badge}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* =================== Coupon + Recommendations + Filler =================== */

function CouponStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-saffron-500/50 bg-saffron-500/10 px-3 py-2 text-[12px] font-semibold text-saffron-600"
    >
      <BadgePercent className="h-4 w-4" />
      <span>Apply <strong className="font-extrabold">LH200</strong> at checkout · ₹200 off</span>
      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-saffron-600/80">Tap to copy</span>
    </motion.div>
  );
}

function RecommendationRow({ label, ids, socialProofId, flashId, highlightId, tapTarget }) {
  return (
    <div className="mt-4 px-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-bold uppercase tracking-wider text-ink-700">✨ {label}</div>
        <span className="inline-flex items-center text-[11px] font-semibold text-coral-500">
          See all <ChevronRight className="h-3 w-3" />
        </span>
      </div>
      <div className="-mx-1 flex flex-wrap gap-2">
        {ids.map((id) => {
          const p = products[id];
          if (!p) return null;
          const isFlash = flashId === id;
          const isSocial = socialProofId === id;
          const isHighlighted = highlightId === id;
          const isTapped = tapTarget === `rec-${id}`;
          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={isHighlighted
                ? { opacity: 1, y: 0, boxShadow: ['0 0 0 0 rgba(255,159,28,0.0)', '0 0 0 6px rgba(255,159,28,0.30)', '0 0 0 0 rgba(255,159,28,0.0)'] }
                : { opacity: 1, y: 0 }}
              transition={isHighlighted
                ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.45, ease: 'easeOut' }}
              className={`relative w-[calc(50%-4px)] overflow-hidden rounded-xl bg-white p-2 ring-1 transition ${
                isHighlighted ? 'ring-saffron-500' : 'ring-ink-300/10'
              }`}
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-cream-100 to-cream-200">
                <div className="absolute inset-0 grid place-items-center text-4xl">{p.emoji}</div>
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
                  <Heart className="h-3 w-3" />
                </span>
                {isFlash && <FlashCountdown />}
                {isSocial && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-1.5 left-1.5 chip bg-black/70 text-white"
                  >
                    🔥 10k+ bought
                  </motion.div>
                )}
              </div>
              <div className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-ink-900">{p.name}</div>
              <div className="flex items-center gap-1 text-[10px] text-ink-500">
                <Star className="h-2.5 w-2.5 fill-saffron-500 text-saffron-500" /> {p.rating} · {p.tagline}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</span>
                <div className="relative">
                  <button className="rounded-md bg-cream-100 px-2 py-1 text-[10px] font-bold text-coral-600">
                    Add
                  </button>
                  {isTapped && <TapPulse small />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function FlashCountdown() {
  const [secs, setSecs] = useState(298);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 1 ? s - 1 : 298)), 900);
    return () => clearInterval(t);
  }, []);
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return (
    <motion.div
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 1.2, repeat: Infinity }}
      className="absolute left-1.5 top-1.5 chip bg-coral-500 text-white shadow"
    >
      <Clock className="h-3 w-3" /> {m}:{s}
    </motion.div>
  );
}

function TapPulse({ small = false }) {
  return (
    <motion.span
      initial={{ opacity: 0.6, scale: 0.4 }}
      animate={{ opacity: 0, scale: small ? 1.9 : 2.4 }}
      transition={{ duration: 0.8, ease: 'easeOut', repeat: Infinity }}
      className="pointer-events-none absolute inset-0 m-auto block rounded-full bg-white/80 ring-2 ring-coral-400"
      style={small ? { width: 18, height: 18 } : { width: 40, height: 40 }}
    />
  );
}

function FloatPlusOne({ id }) {
  if (!id) return null;
  const p = products[id];
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -200, scale: 1 }}
      transition={{ duration: 1.4, times: [0, 0.15, 0.8, 1], ease: 'easeOut' }}
      className="pointer-events-none absolute bottom-44 right-6 z-30 flex items-center gap-1 rounded-full bg-saffron-500 px-2.5 py-1 text-[11px] font-extrabold text-ink-900 shadow-lg"
    >
      <span>{p?.emoji}</span><span>+1 added</span>
    </motion.div>
  );
}

function FlashSaleStrip() {
  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-burgundy-500 to-coral-500 p-3 text-white">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4" />
        <div className="text-[12px] font-extrabold uppercase tracking-wider">Flash sale · live now</div>
        <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">02:14:38 left</span>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {['🧢', '👟', '🕶️', '👜', '👚', '🩴'].map((e, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center rounded-xl bg-white/15 p-2">
            <span className="text-2xl">{e}</span>
            <span className="mt-1 text-[10px] font-bold">₹{(199 + i * 100).toLocaleString('en-IN')}</span>
            <span className="text-[9px] opacity-80">{50 + i * 5}% off</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsSnippet() {
  return (
    <div className="mx-4 mt-4 rounded-2xl bg-white p-3 ring-1 ring-ink-300/10">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold uppercase tracking-wider text-ink-700">Recent reviews</div>
        <span className="inline-flex items-center text-[11px] font-semibold text-coral-500">
          See all <ChevronRight className="h-3 w-3" />
        </span>
      </div>
      <div className="mt-2 space-y-2">
        <ReviewLine name="Aanya · Delhi" stars={5} text="Perfect fit for my birthday outfit, love these!" />
        <ReviewLine name="Rohan · Mumbai" stars={4} text="Great look. Slightly tight at first." />
      </div>
    </div>
  );
}

function ReviewLine({ name, stars, text }) {
  return (
    <div className="rounded-xl bg-cream-50 p-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold text-ink-700">{name}</div>
        <div className="flex">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-saffron-500 text-saffron-500" />
          ))}
        </div>
      </div>
      <div className="mt-0.5 text-[11px] text-ink-700">{text}</div>
    </div>
  );
}

/* =================== Delivery + Cart =================== */

function DeliveryBanner({ total, reached }) {
  const remaining = Math.max(0, freeDeliveryThreshold - total);
  const pct = Math.min(100, (total / freeDeliveryThreshold) * 100);
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative mx-4 mt-3 flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-[12px] font-semibold ring-1 ${
        reached
          ? 'bg-teal-500/10 text-teal-500 ring-teal-500/20'
          : 'bg-saffron-500/10 text-saffron-600 ring-saffron-500/30'
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)', backgroundSize: '200% 100%' }}
      />
      <Truck className="h-4 w-4 shrink-0" />
      {reached ? (
        <span>🎉 FREE delivery unlocked!</span>
      ) : (
        <span>
          Add <strong>₹{remaining.toLocaleString('en-IN')}</strong> more to unlock FREE delivery
        </span>
      )}
      <div className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-white/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${reached ? 'bg-teal-500' : 'bg-saffron-500'}`}
        />
      </div>
    </motion.div>
  );
}

function CartDrawer({ ids, total, reveal }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-white shadow-2xl ring-1 ring-ink-300/10"
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-ink-300/40" />
      <div className="flex items-center justify-between px-5 pt-3">
        <div className="text-sm font-bold text-ink-900">Your cart</div>
        <div className="text-[11px] font-semibold text-ink-500">{ids.length} item{ids.length === 1 ? '' : 's'}</div>
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto px-5 pt-3">
        {ids.map((id, i) => {
          const p = products[id];
          if (!p) return null;
          return (
            <motion.li
              key={id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-cream-50 p-2"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-2xl ring-1 ring-ink-300/10">{p.emoji}</div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-ink-900">{p.name}</div>
                <div className="text-[10px] text-ink-500">Qty 1 · ₹{p.price.toLocaleString('en-IN')}</div>
              </div>
              <div className="text-[12px] font-bold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
            </motion.li>
          );
        })}
      </ul>

      <div className="border-t border-ink-300/15 px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-700">Total</span>
          <CountUpTotal target={total} reveal={reveal} />
        </div>
        <button className="mt-3 w-full rounded-xl bg-coral-500 py-2.5 text-sm font-bold text-white">
          Place Order
        </button>
      </div>
    </motion.div>
  );
}

function CountUpTotal({ target, reveal }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!reveal) { setVal(target); return; }
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reveal, target]);
  return (
    <motion.span
      animate={reveal ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, delay: 1.3 }}
      className={`text-2xl font-extrabold ${reveal ? 'text-burgundy-500' : 'text-ink-900'}`}
    >
      ₹{val.toLocaleString('en-IN')}
    </motion.span>
  );
}
