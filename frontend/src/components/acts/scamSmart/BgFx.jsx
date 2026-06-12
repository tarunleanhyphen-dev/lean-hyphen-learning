/**
 * BgFx — the Scam Smart ambient background (animated aurora + drifting orbs
 * + faint grid). Pure CSS, GPU-cheap, always works, and can never cover
 * content (z-index:0, under the z-index:1 shell). Drop one per act inside .ss.
 */
export default function BgFx() {
  return (
    <div className="ss__bg" aria-hidden>
      <div className="ss__bg-grid" />
      <div className="ss__bg-orb" style={{ width: '26vmax', height: '26vmax', left: '58%', top: '12%' }} />
      <div className="ss__bg-orb" style={{ width: '18vmax', height: '18vmax', left: '8%', top: '58%', animationDelay: '-6s' }} />
    </div>
  );
}

/** True when the browser can create a WebGL context (so 3D can mount safely). */
export function hasWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}
