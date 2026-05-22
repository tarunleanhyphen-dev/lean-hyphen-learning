import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  Search, ShoppingBag, Heart, Bell, Truck, Clock, Star, MapPin,
  ChevronRight, BadgePercent, Flame, Check,
} from 'lucide-react';
import { products, freeDeliveryThreshold, SHOE_GRID } from '../../data/lessons/thinkBeforeYouSpend.js';

/* Tomorrow's date, formatted "Sat, 23 May" — used everywhere the mock
 * shopping app shows a delivery ETA so the date always reads as
 * "delivery by tomorrow" relative to the day the learner opens the app
 * (instead of a stale hardcoded "Sat, 17 May"). */
function nextDayLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
const DELIVERY_BY = nextDayLabel();
import MicroConfetti from '../shared/MicroConfetti.jsx';

const CATEGORIES = [
  { id: 'trending', label: 'Trending', emoji: '🔥', hot: true },
  { id: 'footwear', label: 'Footwear', emoji: '👟' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'beauty',   label: 'Beauty',   emoji: '💄' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'bags',     label: 'Bags',     emoji: '🎒' },
  { id: 'jewelry',  label: 'Jewelry',  emoji: '💍' },
];

// Built from freeDeliveryThreshold so the hero banner, the cart-focus
// banner, and the lesson's "she's ₹3 away" beat all reference the same
// number. Bump the threshold in thinkBeforeYouSpend.js and every surface
// updates automatically.
const HERO_SLIDES = [
  { id: 'birthday', title: 'Birthday Sale', sub: '30% OFF · ends tonight', tone: 'from-coral-500 to-saffron-500', emoji: '🎂' },
  { id: 'flash',    title: 'Flash Drop',     sub: 'New sneakers · while stocks last', tone: 'from-burgundy-500 to-coral-500', emoji: '⚡' },
  { id: 'free',     title: 'Free Delivery',  sub: `On orders above ₹${freeDeliveryThreshold.toLocaleString('en-IN')}`, tone: 'from-teal-500 to-saffron-500', emoji: '🚚' },
];

export default function MockShoppingApp({ state = {}, onAddToCart }) {
  const cartIds = state.cart || [];
  const cartTotal = cartIds.reduce((sum, id) => sum + (products[id]?.price || 0), 0);
  const reached = state.deliveryUnlocked || cartTotal >= freeDeliveryThreshold;
  const view = state.view || 'feed';

  // Dedicated screens for payment / confirmation / cart / order summary
  // take over the whole phone.
  if (view === 'payment') return <PaymentScreen total={cartTotal} ids={cartIds} tapping={state.tapTarget === 'pay'} processing={state.processing} />;
  if (view === 'confirmation') return <ConfirmationScreen total={cartTotal} ids={cartIds} />;
  if (view === 'order-summary') return <OrderSummaryScreen total={cartTotal} ids={cartIds} />;
  if (view === 'cart-focus') return <CartFocusView total={cartTotal} ids={cartIds} reached={reached} highlightPrice={state.highlightPrice} timerMinutes={state.timerMinutes} freqBought={state.freqBought} freeDeliveryBanner={state.freeDeliveryBanner} cleaningKitTap={state.tapTarget === 'rec-cleaning-kit'} showPlaceOrder={state.showPlaceOrder} placeOrderTap={state.tapTarget === 'place-order'} revealTotal={state.revealTotal} showGap={state.showGap} />;
  // Phone-startup sequence: iOS-style home grid → tap on Spree → zoom into
  // the app → settle into the feed with the search bar pre-typing.
  if (view === 'phone-home') return <PhoneStartupSequence search={state.search} />;
  // Final cart reveal — full breakdown with savings banner + budget callout.
  // Used in the closing beat of Act 1 (Scene 3).
  if (view === 'cart-reveal') return (
    <CartRevealView
      ids={cartIds}
      total={cartTotal}
      revealItems={state.revealItems}
      revealTotal={state.revealTotal}
      revealSavings={state.revealSavings}
      revealBudget={state.revealBudget}
      showGap={state.showGap}
    />
  );

  /* Auto-scroll the phone container as the scene progresses.
   * The scroller is the parent `.phone-scroll` div from <PhoneFrame>; we
   * find it via closest() after this component mounts.  Targets we scroll
   * to are identified by `#mock-<name>` IDs on key sections of the app. */
  const rootRef = useRef(null);
  useEffect(() => {
    if (!rootRef.current) return;
    const scroller = rootRef.current.closest('.phone-scroll');
    if (!scroller) return;

    // Two requestAnimationFrames so the DOM has settled after a phase change
    // before we look up the target node — sometimes the new section just
    // mounted in the same React tick and isn't measurable yet.
    let raf1, raf2, anim, delayedStart;

    const runScrollHint = () => {
      // Snap to top first so the "she scrolls" motion always reads as a
      // downward journey, regardless of where the scroller was sitting.
      scroller.scrollTop = 0;
      // Wait one frame so the new content (search-results grid) is laid
      // out and scrollHeight is final.
      delayedStart = requestAnimationFrame(() => {
        const start = scroller.scrollTop;
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const target = Math.min(maxScroll, start + Math.max(600, maxScroll * 0.9));
        const dur = 3600;
        const startTime = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - startTime) / dur);
          const eased = p < 0.5
            ? 4 * p * p * p
            : 1 - Math.pow(-2 * p + 2, 3) / 2;
          scroller.scrollTop = start + (target - start) * eased;
          if (p < 1) anim = requestAnimationFrame(tick);
        };
        anim = requestAnimationFrame(tick);
      });
    };

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        // scrollHint takes priority over the view-change reset, so when
        // narration says "she scrolls" on the results page, the phone
        // actually scrolls instead of just snapping to top.
        if (state.scrollHint) {
          runScrollHint();
          return;
        }

        // Explicit "scroll back to top" trigger — used after a scrollHint
        // animation when the next phase needs to highlight content near
        // the top of the same view.
        if (state.scrollToTop) {
          scroller.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Reset to top when a new full-screen view (results/detail/payment) loads.
        if (state.view && state.view !== 'feed') {
          scroller.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Scroll to a named section.
        if (state.scrollTo) {
          const target = scroller.querySelector(`#mock-${state.scrollTo}`);
          if (target) {
            const targetTop = target.offsetTop - 24;
            scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
          }
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (delayedStart) cancelAnimationFrame(delayedStart);
      if (anim) cancelAnimationFrame(anim);
    };
  }, [state.view, state.scrollTo, state.scrollHint, state.scrollToTop, state.recommendations?.length, state.deliveryBanner, state.highlight, state.flashDeal, state.showProduct, state.cartOpen]);

  return (
    <div ref={rootRef} className={`relative min-h-full bg-cream-50 pb-32 ${state.silent ? 'saturate-50' : ''}`}>
      <AppHeader cartCount={cartIds.length} backable={view !== 'feed'} />
      {view === 'feed' && <Greeting />}
      <SearchBar value={state.search || ''} scrollHint={state.scrollHint} />

      {view === 'feed' && <>
        <CategoryStrip tapTarget={state.tapTarget} />
        <HeroCarousel />
        {/* Big "Trending Fashion" grid lives in the feed so when narration
           says "she scrolls a little more", the auto-scroll has a real
           wall of fashion to travel through before the cross-sell nudge. */}
        <TrendingFashionStrip />
      </>}

      {view === 'results' && (
        <SearchResultsGrid query={state.search} hoverId={state.hover} />
      )}

      {view === 'detail' && state.showProduct && (
        <ProductDetail
          id={state.showProduct}
          badge={state.badge}
          tapping={state.tapTarget === 'primary-cta'}
          urgencyMinutes={state.urgencyMinutes}
          onlyXLeft={state.onlyXLeft}
          socialProofBadge={state.socialProofBadge}
          onAddToCart={onAddToCart}
        />
      )}

      {/* Flash-deal alert that slides across the top of the phone whenever
         state.flashAlert is set. Matches the script's "Pause for 2 seconds
         as 'Flash Deal — Ends Soon!' pulses/glows" beat. */}
      {state.flashAlert && (
        <FlashDealAlert
          label={state.flashAlert.label || 'Flash Deal'}
          product={state.flashAlert.product}
          mins={state.flashAlert.mins}
        />
      )}

      {/* "Complete the Look — pair your shoes with…" banner before the
         recommendations row. The user feedback called out that pairing
         suggestions had no visible nudge — this is the nudge. */}
      {state.pairNudge && (
        <PairNudgeBanner title={state.pairNudge.title} subtitle={state.pairNudge.subtitle} />
      )}

      {/* NEW OFFER UNLOCKED banner — "Add 1 more item & get Phone Case FREE".
         Pulses + glows like the flash-deal alert but with a gift/celebratory
         palette. Appears in Scene 2 Wave 3 of the new Act 1. */}
      {state.unlockOffer && (
        <UnlockOfferBanner
          headline={state.unlockOffer.headline}
          message={state.unlockOffer.message}
          emoji={state.unlockOffer.emoji}
        />
      )}

      {view === 'feed' && state.showProduct && (
        <FeaturedProduct id={state.showProduct} badge={state.badge} tapping={state.tapTarget === 'primary-cta'} />
      )}

      {state.deliveryBanner && (
        <DeliveryBanner total={cartTotal} reached={reached} />
      )}

      {state.showProduct && view !== 'results' && <CouponStrip />}

      {state.recommendations?.length > 0 && (
        <RecommendationRow
          label={state.rowLabel}
          ids={state.recommendations}
          socialProofId={state.socialProof}
          viralId={state.viralBadge}
          flashId={state.flashDeal}
          highlightId={state.highlight}
          tapTarget={state.tapTarget}
        />
      )}

      {view !== 'results' && <FlashSaleStrip />}
      {view === 'feed' && <ReviewsSnippet />}

      <FloatPlusOne id={state.floatAdd} />
      <Toast message={state.toast} />

      <AnimatePresence>
        {state.cartOpen && (
          <CartDrawer ids={cartIds} total={cartTotal} reveal={state.revealTotal} placeOrderTap={state.tapTarget === 'place-order'} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =================== Reusable product image helper =================== */

/* =================== Per-product size / parameter selector =================== */

function SizeSelector({ options, size = 'lg' }) {
  if (!options || !options.values?.length) return null;
  const big = size === 'lg';
  const defaultIdx = options.defaultIndex ?? 0;

  // Chip dimensions differ per kind — "S/M/L" stays small, "44mm GPS+Cellular"
  // and "5-piece premium" need wider chips.
  const widthClass = options.kind === 'watch' || options.kind === 'kit'
    ? 'px-2.5 min-w-[5.5rem]'
    : big ? 'w-8' : 'w-7';
  const heightClass = big ? 'h-8' : 'h-7';

  return (
    <div className="mt-3">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">{options.label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.values.map((s, idx) => (
          <span
            key={s}
            className={`grid place-items-center rounded-md ring-1 text-center text-[11px] font-bold ${heightClass} ${widthClass} ${
              idx === defaultIdx
                ? 'bg-ink-900 text-white ring-ink-900'
                : 'bg-white text-ink-700 ring-ink-300/30'
            }`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* =================== Reusable product image helper =================== */

function ProductImage({ id, className = '', size = 'cover' }) {
  const p = products[id];
  if (!p) return null;
  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-cream-100 to-cream-200 ${className}`}>
      {p.image ? (
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className={`absolute inset-0 h-full w-full ${size === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-4xl">{p.emoji}</div>
      )}
    </div>
  );
}

/* =================== Search results grid =================== */

function SearchResultsGrid({ query, hoverId }) {
  return (
    <div className="px-4 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-bold text-ink-700">
          Results for <span className="text-coral-500">“{query || 'shoes'}”</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-500">
          <span className="rounded-full bg-cream-100 px-2 py-0.5">Filter</span>
          <span className="rounded-full bg-cream-100 px-2 py-0.5">Sort</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SHOE_GRID.map((p, i) => {
          const highlighted = hoverId === p.key || (hoverId === 'shoes' && p.key === 'shoes');
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 14 }}
              animate={highlighted
                ? { opacity: 1, y: 0, boxShadow: ['0 0 0 0 rgba(255,159,28,0)', '0 0 0 6px rgba(255,159,28,0.30)', '0 0 0 0 rgba(255,159,28,0)'] }
                : { opacity: 1, y: 0 }}
              transition={highlighted
                ? { duration: 1.3, repeat: Infinity }
                : { duration: 0.35, delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-xl bg-white p-2 ring-1 ${highlighted ? 'ring-saffron-500' : 'ring-ink-300/10'}`}
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-cream-100">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
                  <Heart className="h-3 w-3" />
                </span>
                {i === 1 && <span className="absolute left-1.5 top-1.5 z-10 chip bg-coral-500 text-white">⚡ 30% off</span>}
              </div>
              <div className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-ink-900">{p.name}</div>
              <div className="flex items-center gap-1 text-[10px] text-ink-500">
                <Star className="h-2.5 w-2.5 fill-saffron-500 text-saffron-500" /> {p.rating} · {p.tagline}
              </div>
              <div className="mt-1 text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* =================== Product detail view =================== */

function ProductDetail({ id, badge, tapping, urgencyMinutes, onlyXLeft, socialProofBadge, onAddToCart }) {
  const p = products[id];
  if (!p) return null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-3 pt-2"
    >
      {/* Urgency banner above the product card — only renders when the
         lesson data sets `urgencyMinutes` on this phase (used on the hoodie
         product detail per script: "Only 7 minutes left!"). */}
      {urgencyMinutes && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0, scale: [1, 1.04, 1] }}
          transition={{ duration: 0.5, scale: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' } }}
          className="relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-r from-burgundy-500 via-coral-500 to-saffron-500 px-4 py-3 text-white shadow-lg ring-2 ring-coral-500"
        >
          {/* Glowing shimmer sweep */}
          <motion.span
            aria-hidden
            initial={{ x: '-100%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute inset-y-0 -inset-x-2 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest">
            <span className="text-base leading-none">⚡</span> Flash Deal · ends soon
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <Clock className="h-5 w-5" />
            <span className="text-[22px] font-extrabold leading-none tabular-nums">
              <CountdownText minutes={urgencyMinutes} />
            </span>
          </div>
        </motion.div>
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow ring-1 ring-ink-300/10">
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <ProductImage id={id} />
          </motion.div>
          <div className="absolute left-3 top-3 chip bg-coral-500 text-white">
            <Star className="h-3 w-3 fill-current" /> Trending
          </div>
          {socialProofBadge && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute right-3 bottom-3 z-10 chip bg-black/75 text-white shadow"
            >
              🔥 {socialProofBadge}
            </motion.div>
          )}
          {onlyXLeft && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute left-3 bottom-3 z-10 chip bg-burgundy-500 text-white shadow"
            >
              ⚡ Only {onlyXLeft} left
            </motion.div>
          )}
          <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
            <Heart className="h-4 w-4" />
          </div>
          {/* Premium badge on the PDP — replaces the misleading multi-image
             dots that suggested 4 gallery photos when only one renders. */}
          <div className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-900 shadow ring-1 ring-ink-300/15">
            ★ Premium pick
          </div>
        </div>

        <div className="p-3">
          <div className="text-[14px] font-bold text-ink-900">{p.name}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
            <Star className="h-3 w-3 fill-saffron-500 text-saffron-500" />
            {p.rating} · 1,283 reviews · {id === 'smartwatch' ? '12K bought this week' : '46k sold this month'}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</span>
            {p.originalPrice && p.originalPrice > p.price && (
              <>
                <span className="text-[11px] text-ink-500 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-coral-500">{Math.round((1 - p.price / p.originalPrice) * 100)}% off</span>
              </>
            )}
          </div>

          {/* Colour dots (visual variety per product kind) */}
          {p.sizeOptions?.kind !== 'kit' && p.sizeOptions?.kind !== 'watch' && (
            <div className="mt-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-500">Colour</div>
              <div className="flex gap-2">
                <span className="h-6 w-6 rounded-full bg-white ring-2 ring-ink-900" />
                <span className="h-6 w-6 rounded-full bg-ink-900 ring-1 ring-ink-300/40" />
                <span className="h-6 w-6 rounded-full bg-coral-500 ring-1 ring-ink-300/40" />
                <span className="h-6 w-6 rounded-full bg-teal-500 ring-1 ring-ink-300/40" />
              </div>
            </div>
          )}

          {/* Size / parameter selector — product-aware */}
          <SizeSelector options={p.sizeOptions} size="lg" />

          {/* Delivery */}
          <div className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-[11px] text-ink-700 ring-1 ring-ink-300/15">
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-teal-500" />
              FREE delivery by <strong>{DELIVERY_BY}</strong>
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-ink-500">
              <MapPin className="h-3 w-3" /> Deliver to 110001 · Delhi
            </div>
          </div>

          <div className="relative">
            {/* Floating "Tap here" callout — sits flush above the Add-to-
               Cart button with a small downward caret pointing to it, so
               it reads as a callout anchored to that exact button instead
               of floating in the middle of the FREE-delivery info. */}
            {tapping && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                transition={{ opacity: { duration: 0.3 }, y: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } }}
                className="pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap"
              >
                <span className="relative inline-flex items-center gap-1 rounded-full bg-saffron-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-ink-900 shadow-lg">
                  👉 Tap here
                  {/* Down-pointing triangle anchoring the chip to the button */}
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-saffron-500"
                  />
                </span>
              </motion.div>
            )}
            <motion.button
              type="button"
              onClick={onAddToCart}
              disabled={!onAddToCart}
              animate={tapping ? {
                scale: [1, 1.04, 1],
                boxShadow: [
                  '0 0 0 0 rgba(255, 90, 74, 0.55)',
                  '0 0 0 14px rgba(255, 90, 74, 0)',
                  '0 0 0 0 rgba(255, 90, 74, 0)',
                ],
              } : { scale: 1 }}
              transition={tapping ? { duration: 1.3, repeat: Infinity, ease: 'easeOut' } : {}}
              className={`mt-3 w-full rounded-xl bg-coral-500 py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:cursor-default disabled:opacity-95 ${tapping ? 'ring-2 ring-saffron-500 ring-offset-2 ring-offset-white' : ''}`}
            >
              Add to Cart · ₹{p.price.toLocaleString('en-IN')}
            </motion.button>
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
      </div>
    </motion.div>
  );
}

/* =================== Toast =================== */

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-[12px] font-bold text-white shadow-2xl ring-1 ring-white/10"
        >
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-teal-400 align-middle" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =================== Top chrome =================== */

function AppHeader({ cartCount, backable = false }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur ring-1 ring-ink-300/10">
      <div className="flex items-center gap-2">
        {backable && (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-cream-100 text-ink-700">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </span>
        )}
        <SpreeLogo size="sm" />
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

/* Reusable Spree brand mark — gradient ShoppingBag in a rounded square +
 * "Spree" wordmark. Used across the AppHeader, the home-screen icon, the
 * app-launch zoom and the in-app header during the startup sequence so
 * the brand reads identically everywhere it appears. */
function SpreeLogo({ size = 'sm' }) {
  const SIZES = {
    xs: { box: 'h-5 w-5 rounded-[6px]', icon: 'h-3 w-3',   text: 'text-[12px]', stroke: 2.6 },
    sm: { box: 'h-7 w-7 rounded-[8px]', icon: 'h-4 w-4',   text: 'text-[15px]', stroke: 2.5 },
    md: { box: 'h-10 w-10 rounded-[12px]', icon: 'h-6 w-6', text: 'text-[18px]', stroke: 2.5 },
    lg: { box: 'h-14 w-14 rounded-[16px]', icon: 'h-8 w-8', text: 'text-[22px]', stroke: 2.5 },
  };
  const cfg = SIZES[size] || SIZES.sm;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`grid place-items-center bg-gradient-to-br from-coral-500 to-burgundy-500 text-white shadow-sm ${cfg.box}`}>
        <ShoppingBag className={cfg.icon} strokeWidth={cfg.stroke} />
      </span>
      <span className={`font-extrabold tracking-tight text-ink-900 ${cfg.text}`}>
        Spree<span className="text-coral-500">.</span>
      </span>
    </span>
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

function CategoryStrip({ tapTarget }) {
  return (
    <div className="bg-white px-4 pb-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => {
          const isTapped = tapTarget === `cat-${c.id}`;
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.95 }}
              animate={isTapped ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={isTapped ? { duration: 0.6, repeat: Infinity } : {}}
              className="relative flex shrink-0 flex-col items-center gap-1"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl text-xl shadow-inner ring-1 ${
                  c.hot
                    ? 'bg-gradient-to-br from-coral-500 to-saffron-500 text-white ring-saffron-500/40'
                    : 'bg-cream-100 ring-ink-300/10'
                } ${isTapped ? '!ring-2 !ring-saffron-500' : ''}`}
              >
                {c.emoji}
              </span>
              <span className={`text-[10px] font-semibold ${c.hot ? 'text-coral-600' : 'text-ink-700'}`}>
                {c.label}
              </span>
              {isTapped && <TapPulse small />}
            </motion.button>
          );
        })}
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
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <ProductImage id={id} />
        </motion.div>
        <div className="absolute left-3 top-3 z-10 chip bg-coral-500 text-white">
          <Star className="h-3 w-3 fill-current" /> Trending Now
        </div>
        <div className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
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
            {p.originalPrice && p.originalPrice > p.price && (
              <div className="text-[10px] text-ink-500 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</div>
            )}
          </div>
        </div>

        <SizeSelector options={p.sizeOptions} size="sm" />

        {/* Delivery row */}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-700">
          <Truck className="h-3.5 w-3.5 text-teal-500" />
          FREE delivery by <strong>{DELIVERY_BY}</strong>
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
      className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-teal-500/50 bg-teal-500/10 px-3 py-2 text-[12px] font-semibold text-teal-600"
    >
      <Truck className="h-4 w-4" />
      <span>FREE delivery on this order · arrives by <strong className="font-extrabold">{DELIVERY_BY}</strong></span>
    </motion.div>
  );
}

function RecommendationRow({ label, ids, socialProofId, viralId, flashId, highlightId, tapTarget }) {
  return (
    <div id="mock-recommendations" className="mt-4 px-4">
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
          const isViral = viralId === id;
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
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <ProductImage id={id} />
                <span className="absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
                  <Heart className="h-3 w-3" />
                </span>
                {isFlash && <FlashCountdown />}
                {isSocial && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute bottom-1.5 left-1.5 z-10 chip bg-black/70 text-white"
                  >
                    🔥 12K bought this week
                  </motion.div>
                )}
                {isViral && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="absolute left-1.5 top-1.5 z-10 chip bg-burgundy-500/95 text-white shadow"
                    >
                      🔥 Viral on reels
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-1.5 left-1.5 z-10 chip bg-black/70 text-white"
                    >
                      📸 9K bought this week
                    </motion.div>
                  </>
                )}
              </div>
              <div className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-ink-900">{p.name}</div>
              <div className="flex items-center gap-1 text-[10px] text-ink-500">
                <Star className="h-2.5 w-2.5 fill-saffron-500 text-saffron-500" /> {p.rating} · {p.tagline}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</span>
                  {p.originalPrice && p.originalPrice > p.price && (
                    <span className="text-[10px] text-ink-500 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                  )}
                </div>
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
    <div id="mock-flash-strip" className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-burgundy-500 to-coral-500 p-3 text-white">
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
      id="mock-delivery"
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

function CartDrawer({ ids, total, reveal, placeOrderTap = false }) {
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
              <div className="h-10 w-10 overflow-hidden rounded-lg ring-1 ring-ink-300/10">
                <ProductImage id={id} />
              </div>
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
        <div className="relative">
          <button className="mt-3 w-full rounded-xl bg-coral-500 py-2.5 text-sm font-bold text-white">
            Place Order
          </button>
          {placeOrderTap && <TapPulse />}
        </div>
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

/* =================== Payment screen =================== */

function PaymentScreen({ total, ids, tapping, processing }) {
  return (
    <div className="relative flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-ink-300/10 bg-white px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-cream-100 text-ink-700">
          <ChevronRight className="h-4 w-4 rotate-180" />
        </span>
        <div className="text-[15px] font-extrabold text-ink-900">Checkout</div>
        <span className="ml-auto rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-500">Secure</span>
      </header>

      <div className="px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Deliver to</div>
        <div className="mt-1 flex items-start gap-2 rounded-xl bg-cream-50 p-2 ring-1 ring-ink-300/10">
          <MapPin className="h-4 w-4 mt-0.5 text-coral-500" />
          <div className="text-[12px] leading-snug">
            <div className="font-bold text-ink-900">Shanaya · 110001</div>
            <div className="text-ink-500">12 Park Road, New Delhi</div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Payment method</div>
        <div className="mt-1 space-y-2">
          <PaymentRow icon="📱" label="UPI · paytm@upi"        selected />
          <PaymentRow icon="💳" label="Credit / Debit card" />
          <PaymentRow icon="🪙" label="Cash on Delivery"      disabled />
        </div>
      </div>

      <div className="mt-3 mx-4 rounded-xl bg-cream-50 p-3 ring-1 ring-ink-300/10">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-500">Order summary</div>
        <div className="space-y-1 text-[11px] text-ink-700">
          <div className="flex justify-between"><span>Items ({ids.length})</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span className="font-bold text-teal-500">FREE</span></div>
          <div className="my-1 h-px bg-ink-300/20" />
          <div className="flex justify-between text-[14px] font-extrabold text-ink-900">
            <span>Pay now</span><span>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto px-4 pb-6 pt-4">
        <div className="relative">
          <button className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm ${processing ? 'bg-coral-500/70' : 'bg-coral-500'}`}>
            {processing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  className="grid h-4 w-4 place-items-center"
                >
                  <span className="block h-3 w-3 rounded-full border-2 border-white border-t-transparent" />
                </motion.span>
                Processing payment…
              </span>
            ) : (
              <>Pay ₹{total.toLocaleString('en-IN')} · UPI</>
            )}
          </button>
          {tapping && !processing && <TapPulse />}
        </div>
        <p className="mt-2 text-center text-[10px] text-ink-500">By placing this order you agree to the terms.</p>
      </div>
    </div>
  );
}

function PaymentRow({ icon, label, selected = false, disabled = false }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
      disabled ? 'border-ink-300/20 bg-cream-50 opacity-50'
      : selected ? 'border-coral-500 bg-coral-500/5'
      : 'border-ink-300/30 bg-white'
    }`}>
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-[12px] font-semibold text-ink-900">{label}</span>
      <span className={`grid h-4 w-4 place-items-center rounded-full ring-2 ${selected ? 'ring-coral-500' : 'ring-ink-300/40'}`}>
        {selected && <span className="block h-1.5 w-1.5 rounded-full bg-coral-500" />}
      </span>
    </div>
  );
}

/* =================== Order-placed confirmation =================== */

function ConfirmationScreen({ total, ids }) {
  return (
    <div className="relative flex min-h-full flex-col items-center bg-gradient-to-b from-cream-50 to-white px-6 pt-12 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 16 }}
        className="grid h-24 w-24 place-items-center rounded-full bg-teal-500 text-white shadow-2xl"
      >
        <motion.svg
          width="48" height="48" viewBox="0 0 24 24" fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
        >
          <motion.path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
        </motion.svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-2xl font-extrabold text-ink-900"
      >
        Order placed!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-1 text-[13px] text-ink-700"
      >
        ₹{total.toLocaleString('en-IN')} paid via UPI · Order #LH{Math.floor(100000 + (total % 899999))}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-5 w-full rounded-2xl bg-white p-3 text-left shadow ring-1 ring-ink-300/10"
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Arriving</div>
        <div className="mt-0.5 inline-flex items-center gap-1.5 text-[14px] font-bold text-ink-900">
          <Truck className="h-4 w-4 text-teal-500" /> By {DELIVERY_BY}
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          {ids.map((id) => (
            <div key={id} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink-300/10">
              <ProductImage id={id} />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-saffron-500/15 px-3 py-1 text-[11px] font-semibold text-saffron-600"
      >
        <span>🎉</span> Thank you for shopping with spree.
      </motion.div>
    </div>
  );
}

/* =================== Cart-focus full-screen view ===================
 * Used from Scene 3 onwards: the cart becomes the dominant phone screen so
 * narration about "look at my cart" / "₹3 from free delivery" actually has a
 * matching visual. Items, totals (with optional highlight), countdown timer,
 * free-delivery banner, and a "Frequently Bought Together" recommendation
 * are all stacked here. */
function CartFocusView({ total, ids, reached, highlightPrice, timerMinutes, freqBought, freeDeliveryBanner, cleaningKitTap, showPlaceOrder, placeOrderTap, revealTotal, showGap }) {
  return (
    <div className="relative min-h-full bg-cream-50 pb-24">
      {/* Confetti when the free-delivery threshold is reached — gives the
         "I'm not spending extra, I'm saving on delivery" beat a small
         dopamine reward instead of just a banner colour swap. */}
      <MicroConfetti active={reached} keyId={`cart-${reached ? 'unlocked' : 'idle'}`} count={32} duration={1.6} />
      <AppHeader cartCount={ids.length} backable />
      <div className="bg-white px-4 py-3 ring-1 ring-ink-300/10">
        <div className="text-[15px] font-extrabold text-ink-900">Your cart</div>
        <div className="text-[11px] text-ink-500">{ids.length} item{ids.length === 1 ? '' : 's'} · ready for checkout</div>
      </div>

      {freeDeliveryBanner && (
        <div className="px-4 pt-3">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] font-bold ring-1 ${
              reached
                ? 'bg-teal-500/10 text-teal-500 ring-teal-500/30'
                : 'bg-saffron-500/10 text-saffron-600 ring-saffron-500/30'
            }`}
          >
            <span className="text-base">🎉</span>
            {reached
              ? 'FREE delivery unlocked!'
              : `Unlock FREE Delivery on orders above ₹${freeDeliveryThreshold.toLocaleString('en-IN')}`}
          </motion.div>
        </div>
      )}

      <ul className="px-4 pt-3 space-y-2">
        {ids.map((id, i) => {
          const p = products[id];
          if (!p) return null;
          return (
            <motion.li
              key={id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.06 }}
              className="flex items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-ink-300/10"
            >
              <div className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-ink-300/10">
                <ProductImage id={id} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="line-clamp-1 text-[13px] font-bold text-ink-900">{p.name}</div>
                <div className="text-[10px] text-ink-500">Qty 1</div>
              </div>
              <div className="text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
            </motion.li>
          );
        })}
      </ul>

      {/* Subtotal block */}
      <div className="mx-4 mt-3 rounded-2xl bg-white p-3 ring-1 ring-ink-300/10">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-semibold text-ink-700">Cart total</span>
          <motion.span
            key={revealTotal ? 'revealed' : 'plain'}
            initial={revealTotal ? { scale: 0.94, opacity: 0.6 } : false}
            animate={
              revealTotal
                ? { scale: [0.94, 1.12, 1], opacity: 1 }
                : highlightPrice ? { scale: [1, 1.08, 1] } : { scale: 1 }
            }
            transition={
              revealTotal
                ? { duration: 1.1, ease: 'easeOut' }
                : { duration: 0.7, repeat: highlightPrice ? Infinity : 0, repeatDelay: 1.2 }
            }
            className={`text-xl font-extrabold ${revealTotal || highlightPrice ? 'text-burgundy-500' : 'text-ink-900'}`}
          >
            ₹{total.toLocaleString('en-IN')}
          </motion.span>
        </div>

        {/* "₹1,500 planned → ₹3,995 actual" gap chip */}
        {showGap && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 flex items-center justify-between rounded-xl bg-burgundy-500/10 px-3 py-2 text-[11px] font-bold ring-1 ring-burgundy-500/30"
          >
            <span className="text-ink-500">Plan ₹1,500</span>
            <span className="text-burgundy-500">+{Math.round((total / 1500 - 1) * 100)}% over plan</span>
          </motion.div>
        )}

        {timerMinutes && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-coral-500/10 px-2.5 py-1.5 text-[11px] font-bold text-coral-500 ring-1 ring-coral-500/30">
            <Clock className="h-3.5 w-3.5" />
            <CountdownText minutes={timerMinutes} />
            <span className="ml-auto text-[10px] uppercase tracking-widest opacity-80">offer ends</span>
          </div>
        )}
      </div>

      {/* Frequently bought together — single product nudge (the cleaning kit) */}
      {freqBought && (
        <div className="mx-4 mt-4 rounded-2xl bg-white p-3 ring-1 ring-ink-300/10">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-bold uppercase tracking-wider text-ink-700">🧴 Frequently Bought Together</div>
          </div>
          <FreqBoughtCard id={freqBought} tapping={cleaningKitTap} />
        </div>
      )}

      {/* Place Order CTA — visible from Scene 4 onwards so the cart stays
         the main view all the way to the payment screen. */}
      {showPlaceOrder && (
        <div className="mx-4 mt-4">
          <div className="relative">
            <button className="w-full rounded-xl bg-coral-500 py-3 text-sm font-bold text-white shadow-sm">
              Place Order · ₹{total.toLocaleString('en-IN')}
            </button>
            {placeOrderTap && <TapPulse />}
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== Final cart reveal view ===================
 * Used in Scene 3 of the rewritten Act 1. Lists every item Shanaya
 * added (incl. the FREE phone case), reveals the total, animates in
 * a "You Saved ₹X" banner, then surfaces the original budget gap.
 *
 * Each phase ramps a different flag: revealItems → revealTotal →
 * revealSavings → revealBudget. The component reads those flags and
 * uses AnimatePresence to slide each section in dramatically — no
 * full re-render, no view swap.  */
function CartRevealView({
  ids,
  total,
  revealItems,
  revealTotal,
  revealSavings,
  revealBudget,
  showGap,
}) {
  return (
    <div className="relative min-h-full bg-cream-50 pb-24">
      <AppHeader cartCount={ids.length} backable />
      <div className="bg-white px-4 py-3 ring-1 ring-ink-300/10">
        <div className="text-[15px] font-extrabold text-ink-900">🛒 Cart Updated</div>
        <div className="text-[11px] text-ink-500">{ids.length} item{ids.length === 1 ? '' : 's'}</div>
      </div>

      {/* Items list */}
      <AnimatePresence>
        {revealItems && (
          <motion.ul
            key="items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 px-4 pt-3"
          >
            {ids.map((id, i) => {
              const p = products[id];
              if (!p) return null;
              const isFree = p.free || p.price === 0;
              return (
                <motion.li
                  key={id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.12 }}
                  className="flex items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-ink-300/10"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-ink-300/10">
                    <ProductImage id={id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 text-[13px] font-bold text-ink-900">
                      <span className="mr-1">{p.emoji}</span>{p.name}
                    </div>
                    <div className="text-[10px] text-ink-500">Qty 1{isFree ? ' · gifted offer' : ''}</div>
                  </div>
                  {isFree ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-teal-600 ring-1 ring-teal-500/30">
                      🎀 FREE
                    </span>
                  ) : (
                    <div className="text-[13px] font-extrabold text-ink-900">
                      ₹{p.price.toLocaleString('en-IN')}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Total block */}
      <AnimatePresence>
        {revealTotal && (
          <motion.div
            key="total"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-4 mt-4 rounded-2xl bg-gradient-to-br from-ink-900 to-burgundy-500 p-4 text-white shadow-xl"
          >
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">Total</div>
            <motion.div
              initial={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: [0.85, 1.12, 1], opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-[34px] font-extrabold leading-none tracking-tight"
            >
              ₹{total.toLocaleString('en-IN')}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "You Saved ₹X" sparkle banner */}
      <AnimatePresence>
        {revealSavings && (
          <motion.div
            key="savings"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: [0.85, 1.06, 1] }}
            transition={{ duration: 0.8 }}
            className="relative mx-4 mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-saffron-400 via-coral-400 to-coral-500 px-4 py-3 text-white shadow-lg ring-1 ring-white/30"
          >
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">✨ Smart Saver ✨</div>
                <div className="mt-0.5 text-[18px] font-extrabold leading-tight">
                  You Saved ₹{revealSavings.toLocaleString('en-IN')}!
                </div>
              </div>
              <div className="text-2xl">🎉</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Original budget callout */}
      <AnimatePresence>
        {revealBudget && (
          <motion.div
            key="budget"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-4 mt-3 rounded-2xl bg-white p-3 ring-1 ring-burgundy-500/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-500">
                💰 Original Budget
              </span>
              <span className="text-[14px] font-extrabold text-ink-700">₹1,500</span>
            </div>
            {showGap && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 rounded-xl bg-burgundy-500/10 px-3 py-2 text-[11px] font-bold ring-1 ring-burgundy-500/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Spent</span>
                  <span className="text-burgundy-500">
                    ₹{total.toLocaleString('en-IN')} · +{Math.round((total / 1500 - 1) * 100)}% over plan
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FreqBoughtCard({ id, tapping }) {
  const p = products[id];
  if (!p) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream-50 p-2 ring-1 ring-ink-300/10">
      <div className="h-14 w-14 overflow-hidden rounded-lg ring-1 ring-ink-300/10">
        <ProductImage id={id} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="line-clamp-1 text-[12px] font-bold text-ink-900">{p.name}</div>
        <div className="text-[10px] text-ink-500">{p.tagline}</div>
        <div className="mt-0.5 text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
      </div>
      <div className="relative">
        <button className="rounded-md bg-coral-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
          Add
        </button>
        {tapping && <TapPulse small />}
      </div>
    </div>
  );
}

function CountdownText({ minutes }) {
  const [secs, setSecs] = useState(Math.max(1, minutes) * 60);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 1 ? s - 1 : minutes * 60)), 1000);
    return () => clearInterval(t);
  }, [minutes]);
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return <span>Offer ends in {m}:{s}</span>;
}

/* =================== Flash deal alert banner ===================
 * Slides in across the top of the phone whenever the lesson data triggers a
 * `flashAlert`. Pulses + glows to grab attention before students see the
 * product itself. If `product` contains two ₹ prices (e.g. "Birthday Hoodie
 * · ₹1,999 ₹999"), the first is rendered struck-through and the second as
 * the actual price. */
function FlashDealAlert({ label, product, mins = 5 }) {
  // Pull out two ₹-prices in order so we can render the first as a
  // strikethrough "was" price and the second as the "now" price.
  const priceMatches = product.match(/₹[\d,]+/g) || [];
  let display = product;
  if (priceMatches.length >= 2) {
    const [was, now] = priceMatches;
    const prefix = product.slice(0, product.indexOf(was)).trim();
    display = (
      <>
        {prefix}{' '}
        <span className="text-white/70 line-through">{was}</span>{' '}
        <span className="text-white font-extrabold">{now}</span>
      </>
    );
  }
  return (
    <motion.div
      key={label + product}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1, scale: [1, 1.02, 1] }}
      transition={{ duration: 0.6, scale: { duration: 1.6, repeat: Infinity, repeatType: 'mirror' } }}
      className="mx-4 mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-burgundy-500 via-coral-500 to-saffron-500 p-3 text-white shadow-lg ring-1 ring-white/20"
    >
      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest">
        <span className="text-base">⏳</span> {label}
      </div>
      <div className="mt-1 text-[14px] font-extrabold leading-tight">
        {display}
      </div>
      <div className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold">
        <span>⚡</span> Only {mins} minutes left!
      </div>
    </motion.div>
  );
}

/* =================== NEW OFFER UNLOCKED banner =================== */
/* Wave 3 bundling nudge: "⚡ Add 1 more item & get Phone Case FREE 🎀".
 * Lives near the top of the phone, pulses + shimmers to grab attention
 * the same way the FlashDealAlert does — but with a celebratory gift
 * palette (teal → saffron) so it reads as "reward" not "scarcity".  */
function UnlockOfferBanner({ headline = 'NEW OFFER UNLOCKED', message = '', emoji = '🎁' }) {
  return (
    <motion.div
      key={headline + message}
      initial={{ y: -40, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: [1, 1.025, 1] }}
      transition={{ duration: 0.55, scale: { duration: 1.6, repeat: Infinity, repeatType: 'mirror' } }}
      className="relative mx-4 mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-saffron-500 to-coral-500 p-3 text-white shadow-lg ring-1 ring-white/25"
    >
      {/* Shimmer sweep across the banner */}
      <motion.span
        aria-hidden
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      <div className="relative flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest">
        <span className="text-base leading-none">⚡</span> {headline}
      </div>
      <div className="relative mt-1 flex items-center gap-2 text-[14px] font-extrabold leading-tight">
        <span className="text-xl leading-none">{emoji}</span> {message}
      </div>
    </motion.div>
  );
}

/* =================== Pair-your-shoes / Complete the Look nudge =================== */
function PairNudgeBanner({ title = 'Complete the Look', subtitle = 'Pair your shoes with these matching socks' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: [1, 1.02, 1] }}
      transition={{ duration: 0.55, scale: { duration: 1.6, repeat: Infinity, repeatType: 'mirror' } }}
      className="relative mx-4 mt-3 overflow-hidden rounded-2xl bg-gradient-to-r from-coral-500 via-saffron-500 to-coral-400 p-3 text-white shadow-lg ring-2 ring-saffron-500"
    >
      {/* Shimmer sweep across the banner */}
      <motion.span
        aria-hidden
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      <div className="relative flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25 text-white ring-1 ring-white/40 backdrop-blur-sm">
          <Sparkle />
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-widest opacity-90">✨ {title}</div>
          <div className="mt-0.5 text-[13px] font-extrabold leading-snug">{subtitle}</div>
        </div>
      </div>
    </motion.div>
  );
}

function Sparkle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

/* =================== Order summary (post-payment standalone) ===================
 * Lives behind state.view === 'order-summary'. Shows everything one last time —
 * items, line totals, delivery, coupon, the amount paid — so the student
 * physically sees the receipt before Act 1 closes. */
function OrderSummaryScreen({ total, ids }) {
  const paid = total;
  return (
    <div className="relative min-h-full bg-cream-50 pb-12">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-ink-300/10 bg-white px-4 py-3">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-500 text-white">
          <Check className="h-4 w-4" />
        </span>
        <div className="text-[15px] font-extrabold text-ink-900">Order summary</div>
        <span className="ml-auto rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold text-teal-500">Paid</span>
      </header>

      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-white p-3 ring-1 ring-ink-300/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Items ({ids.length})</div>
          <ul className="mt-2 space-y-2">
            {ids.map((id) => {
              const p = products[id];
              if (!p) return null;
              return (
                <li key={id} className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg ring-1 ring-ink-300/10">
                    <ProductImage id={id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="line-clamp-1 text-[12px] font-bold text-ink-900">{p.name}</div>
                    <div className="text-[10px] text-ink-500">Qty 1</div>
                  </div>
                  <div className="text-[12px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-ink-300/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Bill details</div>
          <div className="mt-2 space-y-1 text-[12px]">
            <Row label="Items subtotal" value={`₹${total.toLocaleString('en-IN')}`} />
            <Row label="Delivery" value="FREE" valueClass="text-teal-500 font-bold" />
            <div className="my-1 h-px bg-ink-300/15" />
            <div className="flex items-center justify-between text-[14px] font-extrabold text-ink-900">
              <span>Total paid</span>
              <motion.span
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-burgundy-500"
              >
                ₹{paid.toLocaleString('en-IN')}
              </motion.span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-gradient-to-br from-saffron-500/15 to-coral-500/10 p-3 ring-1 ring-saffron-500/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-saffron-600">Original plan</div>
          <div className="mt-0.5 text-[13px] leading-snug text-ink-900">
            <strong>₹1,500</strong> — for one good pair of shoes.
          </div>
          <div className="mt-0.5 text-[12px] font-bold text-burgundy-500">
            Actual: ₹{paid.toLocaleString('en-IN')} · {Math.round((paid / 1500 - 1) * 100)}% over plan
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-ink-900' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-700">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

/* =================== Trending Fashion grid ===================
 * Eight fashion picks rendered as a 2-column card grid. Visuals come from
 * Microsoft's Fluent UI 3D Emoji (same source as the avatar's thought
 * clouds, so the style stays coherent). This sits in the feed view so
 * the auto-scroll on the s2-intro "she scrolls a little more" beat has
 * something substantial to scroll through before the cross-sell nudge.
 * Cards are display-only — Tap "Add" does nothing; the lesson controls
 * actual cart state from the lesson data. */
const FASHION_PICKS = [
  { id: 'dress',      label: 'Floral Dress',    price: 1499, img: 'Dress/3D/dress_3d.png',                                    badge: 'Trending' },
  { id: 'tshirt',     label: 'Crop Top',        price:  799, img: 'T-shirt/3D/t-shirt_3d.png',                                badge: '24% off'  },
  { id: 'jeans',      label: 'Skinny Jeans',    price: 1799, img: 'Jeans/3D/jeans_3d.png',                                    badge: 'Hot pick' },
  { id: 'sunnies',    label: 'Sunnies',         price:  499, img: 'Sunglasses/3D/sunglasses_3d.png',                          badge: 'Trending' },
  { id: 'bag',        label: 'Sling Bag',       price: 1299, img: 'Handbag/3D/handbag_3d.png',                                badge: 'New'      },
  { id: 'lipstick',   label: 'Velvet Lip',      price:  399, img: 'Lipstick/3D/lipstick_3d.png',                              badge: 'Loved'    },
  { id: 'sneaker',    label: 'Studio Sneaker',  price: 1999, img: 'Running%20shoe/3D/running_shoe_3d.png',                    badge: 'Trending' },
  { id: 'earrings',   label: 'Hoops Set',       price:  299, img: 'Ring/3D/ring_3d.png',                                      badge: 'Cute'     },
];
const FL_BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/';

function TrendingFashionStrip() {
  return (
    <div id="mock-fashion-strip" className="mt-4 px-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-bold uppercase tracking-wider text-ink-700">✨ Trending Fashion</div>
        <span className="inline-flex items-center text-[11px] font-semibold text-coral-500">
          See all <ChevronRight className="h-3 w-3" />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FASHION_PICKS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl bg-white p-2 ring-1 ring-ink-300/10"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-cream-100">
              <img
                src={`${FL_BASE}${p.img}`}
                alt={p.label}
                loading="lazy"
                className="absolute inset-0 m-auto h-3/4 w-3/4 select-none object-contain drop-shadow"
                draggable={false}
              />
              <span className="absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-ink-700 shadow">
                <Heart className="h-3 w-3" />
              </span>
              <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-coral-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                {p.badge}
              </span>
            </div>
            <div className="mt-1.5 line-clamp-1 text-[12px] font-semibold text-ink-900">{p.label}</div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-[13px] font-extrabold text-ink-900">₹{p.price.toLocaleString('en-IN')}</span>
              <button className="rounded-md bg-cream-100 px-2 py-1 text-[10px] font-bold text-coral-600">
                Add
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* =================== Phone startup sequence ===================
 * Plays inside the PhoneFrame when phase phone.view === 'phone-home'.
 *
 * Timeline (~5.5s — compressed in May 2026 to keep Scenes 0+1 snappy):
 *   0.0–1.2 s  iOS-style home grid; Spree icon idle
 *   1.2–1.8 s  finger taps Spree (pulse + press-in)
 *   1.8–2.6 s  Spree icon zooms to fill the screen (app launch)
 *   2.6–3.8 s  Spree feed visible, search bar gets focus + cursor blink
 *   3.8–5.5 s  "shoes" types out character-by-character into the search bar
 *
 * The parent phase (s1-search) is set to ~5500 ms so it advances right
 * after the typing finishes.
 */
function PhoneStartupSequence({ search = 'shoes' }) {
  // Stage progression — incremented by timers so the animation reads as a
  // sequence rather than 5 things happening at once.
  const [stage, setStage] = useState(0);
  // 0: home idle · 1: tap pulse · 2: zoom to app · 3: app open, search empty
  // · 4: typing in progress · 5: typed full word

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1200);
    const t2 = setTimeout(() => setStage(2), 1800);
    const t3 = setTimeout(() => setStage(3), 2600);
    const t4 = setTimeout(() => setStage(4), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Typing animation — reveal one extra char every 160 ms once stage 4 starts
  // (was 220 ms; tightened with the rest of the sequence).
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (stage < 4) return;
    let i = 0;
    const tick = () => {
      i += 1;
      setTyped(search.slice(0, i));
      if (i < search.length) timer = setTimeout(tick, 160);
    };
    let timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [stage, search]);

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-[#9D8BC9] via-[#7464A8] to-[#3E3160]">
      {/* iOS home screen — visible until zoom completes */}
      <AnimatePresence>
        {stage < 2 && (
          <motion.div
            key="home"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <HomeScreenGrid tapping={stage >= 1} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spree icon zoom-into-app — a big rounded square that scales up from
         the icon's position to fill the screen, mimicking iOS app launch. */}
      <AnimatePresence>
        {stage === 2 && (
          <motion.div
            key="zoom"
            initial={{ scale: 0.12, x: -78, y: -50, borderRadius: 18, opacity: 1 }}
            animate={{ scale: 4, x: 0, y: 0, borderRadius: 0, opacity: [1, 1, 1] }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-coral-500 to-burgundy-500"
            style={{ transformOrigin: 'center' }}
          >
            <div className="flex flex-col items-center text-white">
              <ShoppingBag className="h-10 w-10" strokeWidth={2.5} />
              <span className="mt-1 text-[11px] font-extrabold tracking-tight">
                Spree<span className="opacity-80">.</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App open — full shopping-app home page so the right column reads
         like a real store, not an empty shell. Header, search bar with
         typing animation, hero banner, category strip, and a Trending
         Now product grid. */}
      <AnimatePresence>
        {stage >= 3 && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 overflow-y-auto bg-cream-50 pb-6"
          >
            {/* App header — same SpreeLogo used in the main app */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-300/10 bg-white/95 px-4 py-3 backdrop-blur">
              <SpreeLogo size="sm" />
              <div className="flex items-center gap-3 text-ink-700">
                <Bell className="h-4 w-4" />
                <Heart className="h-4 w-4" />
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>

            {/* Search bar — focused with cursor + typing */}
            <div className="px-4 pt-3">
              <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1, boxShadow: '0 0 0 3px rgba(255, 90, 100, 0.18)' }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2 rounded-full border-2 border-coral-500 bg-white px-4 py-2.5"
              >
                <Search className="h-4 w-4 text-coral-500" />
                <span className="text-[13px] text-ink-900">
                  {typed}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    className="ml-0.5 inline-block h-3 w-[1.5px] -translate-y-0.5 bg-ink-700 align-middle"
                  />
                </span>
              </motion.div>
            </div>

            {/* Hero banner — Birthday Sale */}
            <div className="px-4 pt-3">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-coral-500 to-saffron-500 px-4 py-3 text-white shadow-md"
              >
                <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">🎂 Birthday Sale</div>
                <div className="mt-0.5 text-[15px] font-extrabold leading-tight">30% OFF · ends tonight</div>
                <div className="mt-0.5 text-[10px] opacity-90">Tap to explore deals</div>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl">🎁</span>
              </motion.div>
            </div>

            {/* Category strip */}
            <div className="mt-3 grid grid-cols-4 gap-2 px-4">
              {[
                { e: '👟', l: 'Shoes',  bg: 'from-coral-400 to-coral-500' },
                { e: '👕', l: 'Tops',   bg: 'from-teal-400 to-teal-500' },
                { e: '💄', l: 'Beauty', bg: 'from-pink-300 to-fuchsia-500' },
                { e: '🎒', l: 'Bags',   bg: 'from-saffron-400 to-saffron-500' },
              ].map((c, i) => (
                <motion.div
                  key={c.l}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${c.bg} text-lg shadow-sm`}>
                    {c.e}
                  </div>
                  <span className="text-[10px] font-semibold text-ink-700">{c.l}</span>
                </motion.div>
              ))}
            </div>

            {/* Trending Now — 2×2 product grid with real Unsplash photos.
               Intentionally different products from what Shanaya is about
               to add to her cart, so the home feed feels like a real
               store and not a preview of her purchases. */}
            <div className="px-4 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-700">🔥 Trending Now</div>
                <span className="text-[10px] font-semibold text-coral-500">See all</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { img: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=240&h=240&fit=crop&auto=format&q=70',  name: 'Smartwatch',  price: '₹2,499', tag: 'Bestseller' },
                  { img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=240&h=240&fit=crop&auto=format&q=70', name: 'Backpack',    price: '₹999',   tag: 'Limited' },
                  { img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=240&h=240&fit=crop&auto=format&q=70', name: 'Sunglasses', price: '₹899',   tag: 'Trending' },
                  { img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=240&h=240&fit=crop&auto=format&q=70', name: 'Lipstick',  price: '₹399',   tag: 'New' },
                ].map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.35 }}
                    className="overflow-hidden rounded-xl bg-white ring-1 ring-ink-300/10"
                  >
                    <div className="relative aspect-square">
                      <img src={p.img} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                        {p.tag}
                      </span>
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-ink-700">
                        <Heart className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div className="p-2">
                      <div className="line-clamp-1 text-[11px] font-bold text-ink-900">{p.name}</div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="text-[12px] font-extrabold text-ink-900">{p.price}</span>
                        <button className="rounded-md bg-cream-100 px-2 py-0.5 text-[9px] font-bold text-coral-600">Add</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* iOS-style 4×6 home grid. The Spree icon (top-left) is the target — it
 * gets a tap pulse when `tapping` is true. */
function HomeScreenGrid({ tapping }) {
  const apps = [
    { id: 'spree',    label: 'Spree',    bg: 'from-coral-500 to-burgundy-500', icon: <ShoppingBag className="h-6 w-6 text-white" strokeWidth={2.5} /> },
    { id: 'messages', label: 'Messages', bg: 'from-green-400 to-green-600',    emoji: '💬' },
    { id: 'camera',   label: 'Camera',   bg: 'from-slate-400 to-slate-700',    emoji: '📷' },
    { id: 'photos',   label: 'Photos',   bg: 'from-pink-300 to-fuchsia-500',   emoji: '🖼️' },
    { id: 'music',    label: 'Music',    bg: 'from-rose-400 to-rose-700',      emoji: '🎵' },
    { id: 'maps',     label: 'Maps',     bg: 'from-emerald-300 to-teal-600',   emoji: '🗺️' },
    { id: 'notes',    label: 'Notes',    bg: 'from-yellow-200 to-amber-500',   emoji: '📝' },
    { id: 'clock',    label: 'Clock',    bg: 'from-slate-700 to-slate-900',    emoji: '⏰' },
    { id: 'calendar', label: 'Calendar', bg: 'from-white to-slate-200',        emoji: '📅' },
    { id: 'weather',  label: 'Weather',  bg: 'from-sky-300 to-sky-600',        emoji: '🌤️' },
    { id: 'mail',     label: 'Mail',     bg: 'from-sky-400 to-blue-600',       emoji: '✉️' },
    { id: 'settings', label: 'Settings', bg: 'from-slate-300 to-slate-500',    emoji: '⚙️' },
    { id: 'games',    label: 'Games',    bg: 'from-purple-400 to-purple-700',  emoji: '🎮' },
    { id: 'browser',  label: 'Safari',   bg: 'from-sky-200 to-blue-500',       emoji: '🧭' },
    { id: 'wallet',   label: 'Wallet',   bg: 'from-slate-700 to-black',        emoji: '💳' },
    { id: 'spotify',  label: 'Spotify',  bg: 'from-green-500 to-green-800',    emoji: '🎧' },
  ];

  return (
    <div className="relative h-full w-full pt-4 pb-6">
      {/* Status bar already comes from PhoneFrame; we just add a date label */}
      <div className="px-5 text-center text-white">
        <div className="text-[11px] font-medium tracking-wide opacity-80">Tuesday, 20 May</div>
        <div className="text-[42px] font-extralight leading-none">3:24</div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-x-4 gap-y-5 px-5">
        {apps.map((a, i) => {
          const isSpree = a.id === 'spree';
          return (
            <div key={a.id} className="relative flex flex-col items-center">
              {/* Tap pulse — only on Spree */}
              {isSpree && tapping && (
                <>
                  <motion.span
                    aria-hidden
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    className="absolute top-0 h-12 w-12 rounded-2xl bg-white"
                  />
                  <motion.span
                    aria-hidden
                    initial={{ x: 8, y: 6, opacity: 0, scale: 0.7 }}
                    animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className="pointer-events-none absolute -right-3 -bottom-1 z-20 text-2xl"
                  >
                    👆
                  </motion.span>
                </>
              )}
              <motion.div
                animate={isSpree && tapping ? { scale: [1, 0.88, 1] } : { scale: 1 }}
                transition={isSpree && tapping ? { duration: 0.45, repeat: Infinity, repeatDelay: 0.4 } : {}}
                className={`relative grid h-12 w-12 place-items-center rounded-[14px] bg-gradient-to-br ${a.bg} shadow-md ${isSpree ? 'ring-2 ring-white' : ''}`}
              >
                {a.icon || <span className="text-xl leading-none">{a.emoji}</span>}
              </motion.div>
              <span className="mt-1 text-[9px] font-medium text-white drop-shadow-sm">{a.label}</span>
            </div>
          );
        })}
      </div>

      {/* Dock at the bottom */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-3xl bg-white/15 px-3 py-2 backdrop-blur-md">
        {['📞', '🟢', '🎵', '🧭'].map((e, i) => (
          <div key={i} className="grid h-10 w-10 place-items-center rounded-[12px] bg-gradient-to-br from-white/30 to-white/10 text-lg">
            {e}
          </div>
        ))}
      </div>

      {/* Home indicator bar */}
      <div className="absolute bottom-1 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/70" />
    </div>
  );
}
