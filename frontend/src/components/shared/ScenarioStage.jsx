import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, Music2, Flame, ShoppingBag, Tag, BadgeCheck, Volume2, Play } from 'lucide-react';

/**
 * Visual context "stage" for an Act 3 scenario. Routes by stageKind:
 *   - 'reel-and-products' → Scenario 1 (influencer reel + two earphones)
 *   - 'food-app'          → Scenario 2 (late-night food listing)
 *   - 'group-chat'        → Scenario 3 (squad chat pulling Shanaya in)
 *   - 'flash-sale'        → Scenario 4 (5-min flash deal countdown)
 *
 * Each stage is built CSS-only (no real video / images) so the lesson
 * ships without external asset dependencies. 3D feel comes from radial
 * gradients, inset shadows, and motion-driven drift / pulse.
 */
export default function ScenarioStage({ scenario }) {
  if (!scenario) return null;
  switch (scenario.stageKind) {
    case 'reel-and-products': return <ReelAndProductsStage data={scenario} />;
    case 'food-app':          return <FoodAppStage          data={scenario} />;
    case 'group-chat':        return <GroupChatStage        data={scenario} />;
    case 'flash-sale':        return <FlashSaleStage        data={scenario} />;
    default:                  return null;
  }
}

/* ============================================================
 * STAGE 1 — Reel + side-by-side product comparison
 * ============================================================ */
function ReelAndProductsStage({ data }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr] sm:gap-4">
      <ReelPlayer reel={data.reel} />
      <ProductsPanel products={data.products} />
    </div>
  );
}

/* ============================================================
 * ReelPlayer — cinematic "video" mock that simulates a real
 * Instagram reel without an external asset.
 *
 *   – If `reel.videoUrl` is provided, the actual HTML5 <video>
 *     plays inside the phone frame (autoplay, loop, muted).
 *     Drop a royalty-free MP4 into /public/videos and reference
 *     it from the scenario data to swap to a real video later.
 *   – Otherwise, a 3-shot animated simulation crossfades through:
 *       Shot 0  Influencer close-up + glowing earbuds
 *       Shot 1  Earbud spin + sound-wave rings + audio waveform
 *       Shot 2  "Aesthetic outfit" sparkles + matching caption
 *     A live progress bar at the top, a verified handle row, a
 *     pulsing engagement rail, a stream of floating hearts, and
 *     a live-ticking like counter sell the "real reel" feel.
 * ============================================================ */
function ReelPlayer({ reel }) {
  const SHOT_DURATION = 3500; // ms — each shot stays this long
  const SHOTS = 3;

  // Shot index + auto-cycle. Resets the top progress bar each cycle.
  const [shot, setShot] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setShot((s) => (s + 1) % SHOTS), SHOT_DURATION);
    return () => clearInterval(id);
  }, []);

  // Floating comment carousel — recycle every 2.2s, mounting in stagger.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);
  const visibleComments = reel.comments.slice(0, 4).map((c, i) => ({ ...c, k: `${tick}-${i}` }));

  // Live-ticking heart burst — emits a heart every ~700ms.
  const [hearts, setHearts] = useState([]);
  useEffect(() => {
    const id = setInterval(() => {
      const id2 = Date.now() + Math.random();
      setHearts((prev) => [...prev.slice(-5), { id: id2, x: 6 + Math.random() * 14 }]);
    }, 700);
    return () => clearInterval(id);
  }, []);

  // Live-ticking like counter — grows by a few per second.
  const [likesNum, setLikesNum] = useState(47213);
  useEffect(() => {
    const id = setInterval(() => setLikesNum((l) => l + 1 + Math.floor(Math.random() * 3)), 1300);
    return () => clearInterval(id);
  }, []);
  const formattedLikes = `${(likesNum / 1000).toFixed(1)}K`;

  // Caption shown at the bottom — cycles in time with the shots.
  const caption = reel.lines[shot % reel.lines.length];

  /* Render priority for the underlying media:
   *   1. YouTube Short via iframe  (reel.youtubeId)
   *   2. Direct MP4 fallback chain  (reel.videoUrls / reel.videoUrl)
   *   3. Animated CSS sim           (final fallback)
   * Each level falls through on error so the reel always looks alive.
   */
  const youtubeId = reel.youtubeId;
  const hasYouTube = Boolean(youtubeId);
  const videoUrls = useMemo(
    () => (reel.videoUrls && reel.videoUrls.length > 0
      ? reel.videoUrls
      : (reel.videoUrl ? [reel.videoUrl] : [])),
    [reel.videoUrls, reel.videoUrl],
  );
  const [urlIdx, setUrlIdx] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = !hasYouTube && videoUrls.length > 0 && !videoFailed;
  const currentVideoUrl = videoUrls[urlIdx];
  const handleVideoError = () => {
    if (urlIdx + 1 < videoUrls.length) {
      setUrlIdx((i) => i + 1); // try the next URL in the chain
    } else {
      setVideoFailed(true);    // exhausted — fall back to CSS sim
    }
  };

  /* YouTube embed URL — autoplay + muted + loop. `playlist=ID` is the
   * documented trick that makes loop=1 actually work for single videos.
   * controls/branding/info hidden so it reads as an in-app reel. */
  const youtubeEmbedSrc = hasYouTube
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`
    : null;

  /* Light-ducked lo-fi loop that only plays while this scene is on
   * screen. Volume is low (0.18) so it sits under the narrator. */
  const audioRef = useRef(null);
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = 0.18;
    const tryPlay = () => el.play().catch(() => { /* autoplay blocked */ });
    tryPlay();
    return () => { try { el.pause(); } catch { /* noop */ } };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[240px] sm:max-w-[260px]">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1a1a1a] via-[#0e0e0e] to-[#000] p-[4px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[24px] bg-gradient-to-br from-fuchsia-700 via-purple-700 to-pink-600">
          {hasYouTube ? (
            // YouTube Short via the official iframe player. The iframe
            // is scaled ~1.25× and centred so the player's branding
            // strip falls outside the visible frame, giving us a clean
            // edge-to-edge reel. pointer-events:none keeps clicks from
            // bouncing to youtube.com.
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <iframe
                key={`yt-${youtubeId}`}
                title="Influencer reel"
                src={youtubeEmbedSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={false}
                className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 border-0"
              />
            </div>
          ) : hasVideo ? (
            // Slow zoom-in over 14s — subtle parallax that makes the
            // clip feel "produced", not a flat embed. Keyed by URL so
            // each fallback re-mount triggers a fresh play.
            <motion.video
              key={`vid-${urlIdx}`}
              autoPlay
              loop
              muted
              playsInline
              src={currentVideoUrl}
              poster={reel.poster}
              onError={handleVideoError}
              initial={{ scale: 1.02 }}
              animate={{ scale: [1.02, 1.12, 1.02] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <ReelShots shot={shot} />
          )}
          {/* Cinematic chrome layered on top of the video (or sim). */}
          <LetterboxBars />
          <LensFlare />
          {reel.audioUrl && (
            <audio ref={audioRef} src={reel.audioUrl} loop preload="auto" crossOrigin="anonymous" />
          )}

          {/* Film-grain overlay — adds the "this is a real video" texture */}
          <FilmGrain />

          {/* Top — progress bar + status row */}
          <div className="absolute left-3 right-3 top-3 z-10">
            <div className="flex gap-1">
              {Array.from({ length: SHOTS }).map((_, i) => (
                <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/25">
                  <motion.div
                    key={`${i}-${shot}`}
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: i < shot ? '100%' : i === shot ? '100%' : '0%' }}
                    transition={{
                      duration: i === shot ? SHOT_DURATION / 1000 : 0.15,
                      ease: 'linear',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/85">
              <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 backdrop-blur-sm">
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-coral-500"
                />
                Reel
              </span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur-sm">
                {formattedLikes} likes
              </span>
            </div>
          </div>

          {/* Floating hearts rising from the like button */}
          <div className="pointer-events-none absolute bottom-16 right-3 h-32 w-10">
            <AnimatePresence>
              {hearts.map((h) => (
                <motion.span
                  key={h.id}
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -110, scale: [0.6, 1.1, 1, 0.9] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.2, ease: 'easeOut' }}
                  className="absolute bottom-0"
                  style={{ left: h.x, color: '#FF4D6D' }}
                >
                  <Heart className="h-4 w-4" fill="currentColor" />
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {/* Floating comments rising up the left side */}
          <div className="pointer-events-none absolute bottom-20 left-2 right-12 flex flex-col gap-1.5">
            <AnimatePresence>
              {visibleComments.map((c, i) => (
                <motion.div
                  key={c.k}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.18 }}
                  className="flex items-start gap-1.5 rounded-2xl bg-black/35 px-2 py-1 text-[10.5px] font-semibold text-white backdrop-blur-sm"
                >
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gradient-to-br from-coral-500 to-burgundy-500 text-[8px] font-extrabold">
                    {c.who[0].toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="opacity-80">{c.who}</span>{' '}
                    <span>{c.text}</span>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Right-rail engagement column */}
          <div className="absolute bottom-3 right-2 flex flex-col items-center gap-2.5 text-white">
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">
                <Heart className="h-4 w-4 text-coral-500" fill="currentColor" strokeWidth={2.4} />
              </span>
              <span className="mt-0.5 text-[9px] font-bold tabular-nums">{formattedLikes}</span>
            </motion.div>
            <RailIcon Icon={MessageCircle} count="3.1K" />
            <RailIcon Icon={Send} count="" />
            <RailIcon Icon={Bookmark} count="" />
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur-sm"
            >
              <Music2 className="h-4 w-4" />
            </motion.div>
          </div>

          {/* Bottom — handle (with verified badge) + auto-cycling caption */}
          <div className="absolute bottom-3 left-3 right-16 text-white">
            <div className="flex items-center gap-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-saffron-500 to-coral-500 text-[10px] font-extrabold ring-2 ring-white/40">
                {reel.handle.replace('@', '').slice(0, 1).toUpperCase()}
              </span>
              <span className="text-[11.5px] font-extrabold leading-tight">{reel.handle}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-sky-300" fill="rgba(56,189,248,0.95)" strokeWidth={2.4} />
              <button className="ml-1 rounded-full bg-white/20 px-2 py-[1px] text-[9px] font-extrabold uppercase tracking-widest backdrop-blur-sm">
                Follow
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={shot}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="mt-1 text-[10.5px] leading-snug opacity-95"
              >
                {caption}
              </motion.div>
            </AnimatePresence>
            <div className="mt-1 flex items-center gap-1 text-[9px] opacity-80">
              <Music2 className="h-3 w-3" />
              <span>original audio · {reel.handle}</span>
            </div>
          </div>

          {/* Bottom audio waveform — pulses to fake "audio playing" */}
          <Waveform />

          {/* Mute / play chrome — sits top-left, just a visual cue */}
          <div className="absolute left-3 top-12 flex items-center gap-1.5 text-white/85">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
              <Play className="h-3 w-3" fill="currentColor" />
            </span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
              <Volume2 className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* The three crossfading "shots" inside the reel — each a CSS-only scene. */
function ReelShots({ shot }) {
  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        {shot === 0 && (
          <motion.div
            key="shot-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, rgba(255,210,140,0.55), transparent 45%), linear-gradient(135deg, #6d28d9 0%, #be185d 60%, #f97316 100%)',
            }}
          >
            <InfluencerSilhouette />
            <FloatingEarbuds />
            <BrandWordmark text="boAt × aesthetic" />
          </motion.div>
        )}
        {shot === 1 && (
          <motion.div
            key="shot-1"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4), transparent 35%), linear-gradient(135deg, #0ea5e9 0%, #6d28d9 50%, #db2777 100%)',
            }}
          >
            <SoundWaveRings />
            <SpinningEarbud />
            <BrandWordmark text="insane sound" />
          </motion.div>
        )}
        {shot === 2 && (
          <motion.div
            key="shot-2"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,240,200,0.55), transparent 50%), linear-gradient(160deg, #f59e0b 0%, #db2777 55%, #7c3aed 100%)',
            }}
          >
            <OutfitSilhouette />
            <SparkleField />
            <BrandWordmark text="aesthetic fit ✨" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Shot 0 helpers */
function InfluencerSilhouette() {
  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 240 360"
      className="absolute inset-0"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="head-grad" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* Head silhouette */}
      <ellipse cx="120" cy="160" rx="58" ry="68" fill="rgba(40,20,55,0.55)" />
      {/* Shoulder/torso */}
      <path
        d="M30 360 Q60 250 120 230 Q180 250 210 360 Z"
        fill="rgba(20,10,40,0.55)"
      />
      {/* Soft hair highlight */}
      <ellipse cx="120" cy="120" rx="64" ry="38" fill="url(#head-grad)" />
    </motion.svg>
  );
}
function FloatingEarbuds() {
  return (
    <motion.div
      animate={{ y: [0, -6, 0, -3, 0], rotate: [0, -2, 2, -1, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute left-1/2 top-[58%] -translate-x-1/2"
    >
      <div className="flex items-center gap-3">
        <Earbud />
        <Earbud flipped />
      </div>
    </motion.div>
  );
}

/* Shot 1 helpers */
function SoundWaveRings() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border-2 border-white/55"
          initial={{ width: 40, height: 40, opacity: 0.7 }}
          animate={{ width: 220, height: 220, opacity: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
function SpinningEarbud() {
  return (
    <motion.div
      animate={{ rotate: [0, 14, -14, 8, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <Earbud />
    </motion.div>
  );
}

/* Shot 2 helpers */
function OutfitSilhouette() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 240 360" className="absolute inset-0">
      {/* Aesthetic outfit silhouette */}
      <path
        d="M80 360 Q70 230 120 200 Q170 230 160 360 Z"
        fill="rgba(20,10,40,0.55)"
      />
      <ellipse cx="120" cy="160" rx="32" ry="42" fill="rgba(40,20,55,0.55)" />
      {/* Earbud accent in ear */}
      <circle cx="100" cy="160" r="6" fill="rgba(255,255,255,0.85)" />
      <circle cx="140" cy="160" r="6" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}
function SparkleField() {
  // 12 scattered sparkles that pulse on their own loop.
  const positions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      top: 5 + ((i * 37) % 80),
      left: 5 + ((i * 53) % 80),
      delay: (i * 0.27) % 2,
      size: 6 + ((i * 5) % 10),
    })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {positions.map((p, i) => (
        <motion.span
          key={i}
          style={{ top: `${p.top}%`, left: `${p.left}%`, width: p.size, height: p.size }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          className="absolute rounded-full bg-white shadow-[0_0_8px_4px_rgba(255,255,255,0.7)]"
        />
      ))}
    </div>
  );
}

/* Brand wordmark animates in from the bottom each shot. */
function BrandWordmark({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="absolute left-0 right-0 top-[38%] grid place-items-center"
    >
      <span className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
        {text}
      </span>
    </motion.div>
  );
}

/* Cinematic letterbox bars — thin black gradient bars top + bottom
 * that scale slightly in and out, the same trick film trailers use to
 * sell "produced video". Pointer-events:none so they never block. */
function LetterboxBars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/85 to-transparent"
      />
      <motion.div
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/85 to-transparent"
      />
    </div>
  );
}

/* Animated lens flare — a soft warm orb that drifts diagonally across
 * the reel every ~6 s. Combined with the letterbox + film grain it
 * sells the "filmed on a phone" texture even when the underlying
 * media is the CSS sim. */
function LensFlare() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute h-12 w-12 rounded-full"
      animate={{
        top: ['12%', '38%', '72%', '20%', '12%'],
        left: ['18%', '64%', '28%', '78%', '18%'],
        opacity: [0, 0.85, 0.7, 0.85, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        background:
          'radial-gradient(circle at 35% 35%, rgba(255,240,200,0.85) 0%, rgba(255,180,120,0.45) 35%, rgba(255,180,120,0) 70%)',
        filter: 'blur(6px)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

/* Subtle film grain overlay — sells the "this is a real video" feel. */
function FilmGrain() {
  return (
    <motion.div
      aria-hidden
      animate={{ opacity: [0.12, 0.2, 0.12] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{
        backgroundImage:
          'repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.07) 0 1px, transparent 1px 3px), repeating-radial-gradient(circle at 100% 100%, rgba(0,0,0,0.06) 0 1px, transparent 1px 4px)',
      }}
    />
  );
}

/* Animated audio waveform along the bottom edge of the reel. */
function Waveform() {
  const bars = Array.from({ length: 22 });
  return (
    <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-6 items-end gap-[2px] px-3 pb-1">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          className="block flex-1 rounded-full bg-white/55"
          animate={{ height: [4, 12 + ((i * 7) % 14), 4, 8 + ((i * 5) % 10), 4] }}
          transition={{ duration: 1.1 + (i % 5) * 0.1, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.03) % 0.8 }}
          style={{ height: 4 }}
        />
      ))}
    </div>
  );
}

function RailIcon({ Icon, count, pulse }) {
  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.12, 1] } : {}}
      transition={pulse ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : {}}
      className="flex flex-col items-center"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">
        <Icon className="h-4 w-4" strokeWidth={2.4} fill={pulse ? 'white' : 'none'} />
      </span>
      {count && <span className="mt-0.5 text-[9px] font-bold">{count}</span>}
    </motion.div>
  );
}

function Earbud({ flipped = false }) {
  return (
    <motion.svg
      width="44"
      height="58"
      viewBox="0 0 44 58"
      style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}
      animate={{ filter: ['drop-shadow(0 0 6px rgba(255,255,255,0.4))', 'drop-shadow(0 0 14px rgba(255,255,255,0.7))', 'drop-shadow(0 0 6px rgba(255,255,255,0.4))'] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="bud-grad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#e6e6e6" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </radialGradient>
      </defs>
      <ellipse cx="18" cy="14" rx="13" ry="11" fill="url(#bud-grad)" />
      <rect x="14" y="22" width="9" height="28" rx="4" fill="url(#bud-grad)" />
      <circle cx="13.5" cy="9" r="2.5" fill="rgba(255,255,255,0.85)" />
    </motion.svg>
  );
}

function ProductsPanel({ products }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[10.5px] font-bold uppercase tracking-widest text-ink-500">
        🛒 Choose your earphones
      </div>
      {products.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.4 }}
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-md ring-1 ring-ink-300/20"
        >
          <div className="flex items-center gap-3">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl shadow-lg ring-1 ring-white/40"
              style={{
                background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.92) 0%, #FDE7B6 42%, #E9B656 100%)',
              }}
            >
              {p.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-extrabold leading-tight text-ink-900">
                {p.name}
              </div>
              <div className="text-[11px] text-ink-500">{p.tagline}</div>
              <div className="mt-1 text-[14px] font-extrabold text-saffron-600">
                ₹{p.price.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          {p.badges?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.badges.map((b) => (
                <span
                  key={b}
                  className={`rounded-full bg-gradient-to-r ${p.accent} px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-widest text-white shadow-sm`}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ============================================================
 * STAGE 2 — Late-night food app  (cinematic upgrade)
 *
 * Vertical phone-frame mock with a status bar, a sliding-gradient
 * "late-night cravings" hero banner, four 3D food cards (CSS-only
 * illustrated food puck + rising steam particles + pulsing deal
 * pill + live "X ordering" tick), a ticking 5-minute countdown,
 * and floating "@user just ordered" toasts rising up the column.
 * ============================================================ */
function FoodAppStage({ data }) {
  const food = data.food;

  /* Countdown — start at 46:00 and tick down (a fresh number every
   * mount of the stage so the visual feels live each visit). */
  const [seconds, setSeconds] = useState(46 * 60 + 23);
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  /* "Just ordered" toast carousel — one toast every 2.4s, recycled. */
  const TOASTS = [
    { who: 'Aanya',  text: 'just ordered Cheese Burst Pizza' },
    { who: 'Krish',  text: 'ordered Cheesy Loaded Fries 🔥' },
    { who: 'Riya',   text: '4 friends ordering near you' },
    { who: 'Meher',  text: 'tipped the rider 🙌' },
    { who: 'Noor',   text: 'ordered the Choco Shake combo' },
  ];
  const [toastIdx, setToastIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setToastIdx((i) => (i + 1) % TOASTS.length), 2400);
    return () => clearInterval(id);
  }, []);
  const toast = TOASTS[toastIdx];

  /* Live "248 ordering nearby" — drifts +/- so the number breathes. */
  const [nearby, setNearby] = useState(248);
  useEffect(() => {
    const id = setInterval(() => setNearby((n) => Math.max(120, n + Math.floor(Math.random() * 7 - 3))), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[260px] sm:max-w-[280px]">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1a1a1a] via-[#0e0e0e] to-[#000] p-[4px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
        <div className="relative aspect-[9/16] overflow-y-auto rounded-[24px] bg-gradient-to-b from-cream-50 to-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 pt-2 text-[9.5px] font-bold text-ink-700">
            <span>11:14</span>
            <span className="flex items-center gap-1 opacity-70">●●●● 5G ▮▮▮</span>
          </div>

          {/* Hero banner — shifting gradient, "late-night cravings" */}
          <motion.div
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative mx-3 mt-2 overflow-hidden rounded-2xl p-2.5 text-white shadow-lg"
            style={{
              backgroundImage: 'linear-gradient(135deg, #b91c1c 0%, #ea580c 35%, #f59e0b 70%, #ec4899 100%)',
              backgroundSize: '200% 200%',
            }}
          >
            {/* Shimmer sweep */}
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.18em]">
                  🌙 {food.header}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold opacity-95">
                  <motion.span
                    key={nearby}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="tabular-nums"
                  >
                    {nearby}
                  </motion.span>{' '}
                  ordering nearby
                </div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [1, 0.85, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-extrabold tabular-nums backdrop-blur-sm ring-1 ring-white/30"
              >
                ⏳ {mm}:{ss}
              </motion.div>
            </div>
          </motion.div>

          {/* Toast — "@user just ordered ..." */}
          <div className="relative mt-2 h-7 px-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={toast.who + toastIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-1.5 rounded-full bg-coral-500/10 px-2 py-1 text-[10.5px] font-semibold text-burgundy-500 ring-1 ring-coral-500/30"
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gradient-to-br from-coral-500 to-burgundy-500 text-[8px] font-extrabold text-white">
                  {toast.who[0]}
                </span>
                <span className="truncate"><b>{toast.who}</b> {toast.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Food card grid — 2x2 */}
          <div className="grid grid-cols-2 gap-2 px-3 pt-2">
            {food.items.map((it, i) => (
              <FoodCard key={it.name} item={it} index={i} />
            ))}
          </div>

          {/* Footer cart strip */}
          <div className="mx-3 mt-2 mb-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-burgundy-500 to-coral-500 p-2 text-white shadow-md">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
              🛵
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] font-extrabold uppercase tracking-widest">
                Order now · Free delivery
              </div>
              <div className="text-[10px] opacity-90 inline-flex items-center gap-1">
                <Flame className="h-2.5 w-2.5" /> Deals end in {mm}:{ss}
              </div>
            </div>
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full bg-white/20 px-2 py-1 text-[10.5px] font-extrabold ring-1 ring-white/30"
            >
              View cart
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Individual food card — 3D glossy food puck + rising steam particles. */
function FoodCard({ item, index }) {
  // Per-card live ordering count (each item is "X ordering"); ticks
  // up slowly so the grid always feels alive.
  const [orderingCount, setOrderingCount] = useState(12 + (index * 7) % 20);
  useEffect(() => {
    const id = setInterval(
      () => setOrderingCount((n) => n + (Math.random() < 0.55 ? 1 : 0)),
      1400 + index * 200,
    );
    return () => clearInterval(id);
  }, [index]);

  // Per-item gradient + steam colour so each card feels distinct.
  const palettes = [
    { base: '#FF9F76', shade: '#B8362C' }, // pizza — warm orange
    { base: '#FFC971', shade: '#C97E12' }, // burger — saffron
    { base: '#FDE7B6', shade: '#E9B656' }, // fries — golden
    { base: '#C8A2C8', shade: '#7C3AED' }, // shake — lilac
  ];
  const p = palettes[index % palettes.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-2xl bg-white p-2 shadow-md ring-1 ring-ink-300/15"
    >
      {/* 3D food puck */}
      <div className="relative mx-auto h-16 w-16">
        {/* Rising steam particles */}
        {[0, 1, 2].map((s) => (
          <motion.span
            key={s}
            aria-hidden
            className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-white/70"
            style={{ width: 5, height: 5, filter: 'blur(2px)' }}
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{
              opacity: [0, 0.85, 0],
              y: -30,
              x: [0, s === 1 ? 4 : -4, s === 1 ? -2 : 2],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: s * 0.7 + index * 0.2,
              ease: 'easeOut',
            }}
          />
        ))}
        <span
          className="absolute inset-0 grid place-items-center rounded-2xl text-3xl shadow-lg ring-1 ring-white/40"
          style={{
            background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, ${p.base} 42%, ${p.shade} 100%)`,
            boxShadow: `inset -2px -3px 6px ${p.shade}55, inset 2px 3px 4px rgba(255,255,255,0.45)`,
          }}
        >
          {item.emoji}
        </span>
        {/* Specular highlight */}
        <span
          aria-hidden
          className="absolute rounded-full bg-white"
          style={{
            top: 6, left: 10, width: 8, height: 8, opacity: 0.85, filter: 'blur(0.6px)',
          }}
        />
      </div>

      {/* Title + price */}
      <div className="mt-2 text-[11px] font-extrabold leading-tight text-ink-900">
        {item.name}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between">
        <span className="text-[12.5px] font-extrabold text-saffron-600">
          ₹{item.price}
        </span>
        <span className="text-[9px] font-bold text-ink-500">
          ⭐ 4.{(index + 3) % 6}
        </span>
      </div>

      {/* Deal badge */}
      {item.badge && (
        <motion.div
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-coral-500/15 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-widest text-coral-500"
        >
          <Flame className="h-2.5 w-2.5" />
          <span className="truncate">{item.badge}</span>
        </motion.div>
      )}

      {/* Live "X ordering" counter */}
      <div className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-ink-500">
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
        />
        {orderingCount} ordering
      </div>
    </motion.div>
  );
}

/* ============================================================
 * STAGE 3 — Squad group chat  (real-time feel)
 *
 * Sequenced sender pattern: typing indicator appears under the next
 * sender's avatar for ~1.4s, then their bubble pops in with a
 * timestamp + delivery ticks, then a brief pause, then the next
 * sender starts typing. Sequence loops every ~3s after the last
 * message so the column always feels alive. Header carries a green
 * online dot stack + a "3 active" pill that pulses.
 * ============================================================ */
function GroupChatStage({ data }) {
  const chat = data.chat;
  const total = chat.messages.length;

  // shownCount = number of messages currently in the feed.
  // typing      = id of the sender whose typing indicator is showing
  //               (the next message's `who`), or null between turns.
  const [shownCount, setShownCount] = useState(0);
  const [typing, setTyping] = useState(chat.messages[0]?.who || null);

  useEffect(() => {
    let t;
    if (shownCount >= total) {
      // Loop after a 2.4s pause so the conversation feels like it just
      // played out fully, then quietly resets.
      t = setTimeout(() => {
        setShownCount(0);
        setTyping(chat.messages[0]?.who || null);
      }, 2400);
      return () => clearTimeout(t);
    }
    const upcoming = chat.messages[shownCount];
    setTyping(upcoming?.who || null);
    // After 1.4s of "X is typing…", the message lands.
    t = setTimeout(() => {
      setTyping(null);
      setShownCount((c) => c + 1);
    }, 1400);
    return () => clearTimeout(t);
  }, [shownCount, total, chat.messages]);

  const shown = chat.messages.slice(0, shownCount);

  // Each sender gets a stable colour from a palette.
  const SENDER_COLORS = {
    Riya:  { bg: 'from-pink-500 to-fuchsia-500',  text: 'text-pink-600' },
    Aanya: { bg: 'from-saffron-500 to-coral-500', text: 'text-coral-500' },
    Krish: { bg: 'from-teal-500 to-emerald-600',  text: 'text-teal-600' },
    Meher: { bg: 'from-purple-500 to-indigo-500', text: 'text-purple-600' },
    Noor:  { bg: 'from-sky-500 to-cyan-500',      text: 'text-sky-600' },
  };
  const colorFor = (who) => SENDER_COLORS[who] || { bg: 'from-coral-500 to-burgundy-500', text: 'text-burgundy-500' };

  // Members shown in the header dot-stack (with online ping).
  const members = ['Riya', 'Aanya', 'Krish'];

  // Synthetic timestamp per message — count back from "now".
  const now = useMemo(() => new Date(), []);
  const stampFor = (i) => {
    const d = new Date(now.getTime() - (total - i) * 30_000);
    const h = d.getHours() % 12 || 12;
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
  };

  return (
    <div className="mx-auto w-full max-w-[300px] sm:max-w-[320px]">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1a1a1a] via-[#0e0e0e] to-[#000] p-[4px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[24px] bg-white">
          {/* Status bar (faux iOS) */}
          <div className="flex items-center justify-between px-3 pt-2 text-[9.5px] font-bold text-ink-700">
            <span>now</span>
            <span className="flex items-center gap-1 opacity-70">●●●● 5G ▮▮▮</span>
          </div>

          {/* Chat header */}
          <div className="flex items-center gap-2 border-b border-ink-300/10 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 px-3 py-2 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-base ring-1 ring-white/30">
              ✨
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-extrabold leading-tight">{chat.groupName}</div>
              <div className="flex items-center gap-1.5 text-[10px] opacity-95">
                {/* Stack of online-ping dots */}
                <span className="flex -space-x-1.5">
                  {members.map((m) => (
                    <span
                      key={m}
                      className={`grid h-3.5 w-3.5 place-items-center rounded-full bg-gradient-to-br ${colorFor(m).bg} text-[7.5px] font-extrabold ring-2 ring-white`}
                    >
                      {m[0]}
                    </span>
                  ))}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0.55, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300"
                />
                <span>3 active · {members.join(', ')}</span>
              </div>
            </div>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[12px] font-bold ring-1 ring-white/30">
              📞
            </span>
          </div>

          {/* Date divider */}
          <div className="flex justify-center bg-cream-50 px-3 pt-2">
            <span className="rounded-full bg-ink-300/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-ink-500">
              Today
            </span>
          </div>

          {/* Chat feed */}
          <div className="flex min-h-[260px] flex-col gap-2 bg-cream-50 px-3 py-2 sm:min-h-[300px]">
            <AnimatePresence initial={false}>
              {shown.map((m, i) => {
                const c = colorFor(m.who);
                return (
                  <motion.div
                    key={`${m.who}-${i}-${shownCount}`}
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="flex items-end gap-2"
                  >
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br ${c.bg} text-[10px] font-extrabold text-white shadow-md ring-2 ring-white`}>
                      {m.who[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-[10.5px] font-extrabold ${c.text}`}>{m.who}</span>
                        <span className="text-[9.5px] text-ink-500">{stampFor(i)}</span>
                      </div>
                      <div className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-900 shadow-sm ring-1 ring-ink-300/15">
                        {m.text}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[9px] text-emerald-600">
                        ✓✓ <span className="text-ink-500">Seen</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typing && shownCount < total && (
                <motion.div
                  key={`typing-${typing}-${shownCount}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-end gap-2"
                >
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br ${colorFor(typing).bg} text-[10px] font-extrabold text-white shadow-md ring-2 ring-white`}>
                    {typing[0]}
                  </span>
                  <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-2.5 py-2 ring-1 ring-ink-300/15">
                    <span className={`mr-1 text-[10px] font-bold ${colorFor(typing).text}`}>
                      {typing} is typing
                    </span>
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15, ease: 'easeInOut' }}
                        className="block h-1.5 w-1.5 rounded-full bg-ink-500/70"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Composer (faux) */}
          <div className="flex items-center gap-2 border-t border-ink-300/10 bg-white px-3 py-2">
            <span className="text-base">😊</span>
            <span className="flex-1 truncate rounded-full bg-ink-300/15 px-3 py-1 text-[11px] text-ink-500">
              Message…
            </span>
            <span className="text-base">📎</span>
            <span className="text-base">🎙️</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * STAGE 4 — 5-minute flash sale  (top-tier "you must buy NOW" pressure)
 *
 * Everything that makes a real flash-sale page feel inescapable:
 *   – Top "🔴 LIVE deal" banner with pulsing ping
 *   – Big M:SS countdown that turns red under 30s
 *   – Animated "248 viewing now" ticker (drifts each second)
 *   – Stock-left meter that ticks down 3 → 2 → 1 → "Just sold!"
 *   – Price pulse: original strikethrough + the cut price flashes
 *   – Social-proof toasts: "@aanya bought this" rising
 *   – Discount-progress bar showing % claimed
 *   – Particle confetti bursts when stock drops
 *   – Heart-rate-style ECG ticker along the bottom edge
 *   – "Buy Now" CTA pulses + a tiny "20+ in cart right now" pill
 * ============================================================ */
function FlashSaleStage({ data }) {
  const sale = data.sale;

  // Countdown
  const [seconds, setSeconds] = useState(sale.countdownSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const urgent = seconds <= 30;

  // Live viewers ticker (drifts each second)
  const [viewers, setViewers] = useState(248);
  useEffect(() => {
    const id = setInterval(() => setViewers((v) => Math.max(60, v + Math.floor(Math.random() * 9 - 4))), 1200);
    return () => clearInterval(id);
  }, []);

  // Stock counter ticking down: 3 → 2 → 1 → 0 ("Just sold!") then loops.
  const [stock, setStock] = useState(sale.product.stockLeft);
  const [justSold, setJustSold] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setStock((s) => {
        if (s <= 0) {
          // Loop: simulate "restocked" so the pressure never lets up.
          setJustSold(false);
          return sale.product.stockLeft;
        }
        if (s === 1) setJustSold(true);
        return s - 1;
      });
    }, 4500);
    return () => clearInterval(id);
  }, [sale.product.stockLeft]);

  // % claimed bar (random walk so it always feels like more people are buying)
  const [claimed, setClaimed] = useState(72);
  useEffect(() => {
    const id = setInterval(() => setClaimed((c) => Math.min(96, c + Math.floor(Math.random() * 3))), 2200);
    return () => clearInterval(id);
  }, []);

  // Social-proof rising toasts.
  const TOASTS = [
    { who: 'aanya._',   text: 'just bought this!' },
    { who: 'krish.x',   text: 'added to cart' },
    { who: 'rhea_',     text: 'snagged the deal 🎉' },
    { who: 'noor.k',    text: 'gifted one to a friend' },
    { who: 'meher.',    text: 'just bought — final 3' },
    { who: 'devansh_',  text: 'sliding in last second' },
  ];
  const [toastIdx, setToastIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setToastIdx((i) => (i + 1) % TOASTS.length), 1900);
    return () => clearInterval(id);
  }, []);
  const toast = TOASTS[toastIdx];

  const discountPct = Math.round((1 - sale.product.price / sale.product.original) * 100);

  return (
    <div className="mx-auto w-full max-w-[300px] sm:max-w-[320px]">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#1a1a1a] via-[#0e0e0e] to-[#000] p-[4px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-cream-50 to-white">
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 pt-2 text-[9.5px] font-bold text-ink-700">
            <span>9:48 PM</span>
            <span className="flex items-center gap-1 opacity-70">●●●● 5G ▮▮▮</span>
          </div>

          {/* LIVE banner — gradient + ping */}
          <motion.div
            animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative mx-3 mt-2 overflow-hidden rounded-2xl p-2.5 text-white shadow-lg"
            style={{
              backgroundImage: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 30%, #ea580c 65%, #f59e0b 100%)',
              backgroundSize: '200% 100%',
            }}
          >
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.2em]">
                <motion.span
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                  className="inline-block h-2 w-2 rounded-full bg-red-300 shadow-[0_0_8px_2px_rgba(252,165,165,0.7)]"
                />
                Live · {sale.bannerText}
              </span>
              <motion.span
                animate={urgent ? { scale: [1, 1.08, 1] } : {}}
                transition={urgent ? { duration: 0.6, repeat: Infinity } : {}}
                className={[
                  'rounded-full px-2.5 py-1 text-[13px] font-extrabold tabular-nums ring-1 ring-white/30 backdrop-blur-sm',
                  urgent ? 'bg-red-500 text-white' : 'bg-white/20 text-white',
                ].join(' ')}
              >
                ⏱ {mm}:{ss}
              </motion.span>
            </div>
            <div className="relative mt-1.5 flex items-center justify-between text-[9.5px] font-bold opacity-95">
              <span className="inline-flex items-center gap-1">
                👀
                <motion.span key={viewers} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums">
                  {viewers}
                </motion.span>{' '}
                viewing now
              </span>
              <span>{claimed}% claimed</span>
            </div>
            {/* % claimed bar */}
            <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full bg-white"
                animate={{ width: `${claimed}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Social-proof rising toast */}
          <div className="relative mx-3 mt-2 h-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={toast.who + toastIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-2 py-1 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-500/30"
              >
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[8px] font-extrabold text-white">
                  {toast.who[0].toUpperCase()}
                </span>
                <span className="truncate"><b>@{toast.who}</b> {toast.text}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Product card with price pulse */}
          <div className="mx-3 mt-2 rounded-2xl bg-white p-3 shadow-md ring-1 ring-ink-300/15">
            <div className="flex items-start gap-3">
              <motion.span
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl shadow-md ring-1 ring-white/40"
                style={{
                  background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95) 0%, #F5B43A 42%, #C97E12 100%)',
                  boxShadow: 'inset -2px -3px 6px #C97E1255, inset 2px 3px 4px rgba(255,255,255,0.45)',
                }}
              >
                {sale.product.emoji}
                <span
                  aria-hidden
                  className="absolute rounded-full bg-white"
                  style={{ top: 6, left: 10, width: 8, height: 8, opacity: 0.85, filter: 'blur(0.6px)' }}
                />
                {/* Discount sticker */}
                <span className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-burgundy-500 text-[9.5px] font-extrabold text-white shadow-md ring-2 ring-white">
                  -{discountPct}%
                </span>
              </motion.span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-extrabold leading-tight text-ink-900">
                  {sale.product.name}
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <motion.span
                    animate={urgent ? { scale: [1, 1.08, 1] } : {}}
                    transition={urgent ? { duration: 0.9, repeat: Infinity } : {}}
                    className="text-[20px] font-extrabold tabular-nums text-burgundy-500"
                  >
                    ₹{sale.product.price.toLocaleString('en-IN')}
                  </motion.span>
                  <span className="text-[11.5px] font-semibold text-ink-500 line-through">
                    ₹{sale.product.original.toLocaleString('en-IN')}
                  </span>
                  <span className="ml-auto rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9.5px] font-extrabold text-emerald-700">
                    SAVE ₹{(sale.product.original - sale.product.price).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Stock left visual */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-burgundy-500">
                    {justSold ? '🔴 Just sold!' : `Only ${stock} left`}
                  </span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: i < stock ? 1 : 0.2, scale: i < stock ? 1 : 0.85 }}
                        transition={{ duration: 0.3 }}
                        className={`h-2 w-3 rounded-sm ${i < stock ? 'bg-burgundy-500' : 'bg-ink-300/40'}`}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </div>

            {/* Cart pressure pill */}
            <motion.div
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-saffron-500/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-saffron-600"
            >
              🛒 23 added to cart this minute
            </motion.div>

            {/* CTA — pulses, even though it's non-interactive */}
            <motion.button
              disabled
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-burgundy-500 to-coral-500 px-4 py-2 text-[12.5px] font-extrabold text-white shadow-lg"
            >
              <ShoppingBag className="h-4 w-4" /> Buy now · Free delivery
            </motion.button>
          </div>

          {/* Noise pills row */}
          <div className="mx-3 mt-2 flex flex-wrap items-center gap-1.5">
            {sale.noise.map((n, i) => (
              <motion.span
                key={n}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8 + (i * 0.2), repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full bg-burgundy-500/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-burgundy-500 ring-1 ring-burgundy-500/30"
              >
                {n}
              </motion.span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1 text-[9.5px] font-bold text-ink-500">
              <Tag className="h-3 w-3" /> ENDS SOON
            </span>
          </div>

          {/* ECG-style ticker along the bottom edge */}
          <ECGTicker urgent={urgent} />
        </div>
      </div>
    </div>
  );
}

/* Heart-rate-style ticker — a sweeping line at the bottom of the
 * flash-sale phone. Sweeps faster + goes red when the countdown enters
 * the urgent zone (<30 s). */
function ECGTicker({ urgent }) {
  return (
    <div className="relative mt-2 h-7 w-full overflow-hidden bg-ink-900/95">
      <svg viewBox="0 0 320 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <motion.path
          d="M0 20 L40 20 L52 6 L62 34 L72 20 L120 20 L132 6 L142 34 L152 20 L200 20 L212 6 L222 34 L232 20 L280 20 L292 6 L302 34 L312 20 L320 20"
          stroke={urgent ? '#FCA5A5' : '#FBBF24'}
          strokeWidth="2"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: urgent ? 1.1 : 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-between px-3 text-[9.5px] font-bold uppercase tracking-widest text-white/80">
        <span>● live demand</span>
        <span>{urgent ? 'CRITICAL' : 'high'}</span>
      </div>
    </div>
  );
}
