/**
 * PhoneCSS — a CSS-3D phone used when WebGL is unavailable (and as the
 * Suspense fallback while the real 3D scene loads). Tilted handset with a
 * glowing screen, message bars sliding in, and a pulsing "5" badge.
 */
const BARS = [
  { w: '85%', c: '#6366f1', d: 0.1 },
  { w: '62%', c: '#a855f7', d: 0.3 },
  { w: '78%', c: '#22d3ee', d: 0.5 },
  { w: '54%', c: '#ef4444', d: 0.7 },
  { w: '70%', c: '#6366f1', d: 0.9 },
];

export default function PhoneCSS() {
  return (
    <div className="pcss" aria-hidden>
      <div className="pcss__phone">
        <div className="pcss__notch" />
        <div className="pcss__screen">
          {BARS.map((b, i) => (
            <div key={i} className="pcss__bar" style={{ width: b.w, background: `linear-gradient(90deg, ${b.c}, transparent)`, animationDelay: `${b.d}s` }} />
          ))}
        </div>
        <div className="pcss__badge">5</div>
      </div>
    </div>
  );
}
