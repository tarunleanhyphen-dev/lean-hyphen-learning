/**
 * PhoneStage — a glossy 3D-tilted handset that holds a crisp DOM app screen.
 * Detailed UIs (a full YouTube channel) stay pixel-sharp in the DOM while the
 * handset tilts in 3D and follows the pointer (parallax). Floats gently; on
 * touch devices it just uses the idle float. Robust everywhere (no WebGL).
 */
import { useRef } from 'react';

export default function PhoneStage({ children }) {
  const phoneRef = useRef(null);

  const onMove = (e) => {
    const el = phoneRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${-16 + px * 18}deg`);
    el.style.setProperty('--rx', `${py * -12}deg`);
  };
  const onLeave = () => {
    const el = phoneRef.current;
    if (!el) return;
    el.style.setProperty('--ry', '-16deg');
    el.style.setProperty('--rx', '0deg');
  };

  return (
    <div className="stage" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="stage__phone" ref={phoneRef}>
        <div className="stage__notch" />
        <div className="stage__screen">
          <div className="stage__scroll">{children}</div>
        </div>
      </div>
    </div>
  );
}
