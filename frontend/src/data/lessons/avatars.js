/**
 * Avatar registry for Lesson 2 characters. Three quality tiers in
 * priority order — Stage2D mounts the highest one that's configured.
 *
 *   1. LOTTIE  (Duolingo-style 2D)
 *      ─ Designer-made character animations from After Effects.
 *      ─ Source: https://lottiefiles.com (search "indian boy" /
 *        "mother character"). Most are free.
 *      ─ Download the .json, drop it into frontend/public/lottie/,
 *        then set the path below (e.g. '/lottie/ritwik.json').
 *
 *   2. RPM     (Ready Player Me real 3D)
 *      ─ Real 3D human avatars with ARKit morph-target lip-sync.
 *      ─ Source: https://readyplayer.me (5 min, no signup). Create
 *        the avatar in their browser, copy the .glb URL.
 *      ─ Paste the URL below.
 *
 *   3. SVG     (hand-coded fallback)
 *      ─ The 2D SVG characters Stage2D already renders. Used when
 *        neither LOTTIE nor RPM is configured for that character.
 *
 * Until you paste anything, Stage2D falls back to the SVG characters
 * so nothing breaks. Once any path is configured, the lesson auto-
 * deploys via the existing branch deploy pipeline.
 */

export const AVATARS = {
  ritwik: {
    // Tier 1: drop a Lottie JSON path in here (highest quality)
    lottie: '',          // e.g. '/lottie/ritwik.json'
    // Tier 2: drop an RPM .glb URL here
    rpm:    '',          // e.g. 'https://models.readyplayer.me/abc.glb'
    // Tier 3: always-on SVG fallback (no config needed)
  },
  mom: {
    lottie: '',
    rpm:    '',
  },
};

/** Picks the highest-tier source configured for a character. */
export function pickAvatarSource(who) {
  const a = AVATARS[who];
  if (!a) return { tier: 'svg' };
  if (a.lottie) return { tier: 'lottie', src: a.lottie };
  if (a.rpm)    return { tier: 'rpm',    src: a.rpm    };
  return { tier: 'svg' };
}

/* === Back-compat alias ===
 * The earlier RPM-only registry used `RPM_AVATARS.{ritwik,mom}`.
 * Keep it as a derived view so any older imports continue to work. */
export const RPM_AVATARS = new Proxy({}, {
  get: (_, key) => AVATARS[key]?.rpm || '',
});
