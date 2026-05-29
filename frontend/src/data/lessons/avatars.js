/**
 * Ready Player Me avatar URLs for Lesson 2 characters.
 *
 * HOW TO GET A URL:
 *   1. Visit https://readyplayer.me  (no signup needed)
 *   2. Click "Create Avatar"
 *   3. Pick a body template that matches the character, then tweak:
 *        Ritwik  → 15-yo Indian teen boy, brown skin, dark messy hair,
 *                  navy/teal hoodie, jeans, sneakers, slim build
 *        Mom     → Indian woman late 30s, brown skin, shoulder-length
 *                  black hair, orange / magenta top
 *   4. Click "Next" → "Use Avatar" → copy the .glb URL shown.
 *      It looks like:  https://models.readyplayer.me/abc123.glb
 *   5. Paste it below in place of the empty string, save the file,
 *      and the lesson auto-deploys.
 *
 * Until URLs are pasted, the Stage falls back to the existing SVG
 * characters so nothing breaks.
 */

export const RPM_AVATARS = {
  // Paste Ritwik's .glb URL here:
  ritwik: '',

  // Paste Mom's .glb URL here:
  mom:    '',
};

/** Returns true once at least one RPM URL is configured. */
export function hasAnyRPMAvatar() {
  return Object.values(RPM_AVATARS).some((u) => typeof u === 'string' && u.startsWith('http'));
}
