/**
 * BgmiScreen — Act 2 scenario 5. A BGMI in-game HUD (minimap, alive count,
 * zone timer, squad health, crosshair, fire/movement controls — you're
 * mid-match). After a beat a central in-game "security" warning pops up with
 * an alert sound: the fake Krafton ban threat.
 */
import { useEffect, useState } from 'react';
import { sounds } from '../../../../utils/sounds.js';

const SQUAD = [
  { n: 'You', hp: 100, alive: true },
  { n: 'Kabir', hp: 72, alive: true },
  { n: 'Aryan', hp: 0, alive: false },
  { n: 'Diya', hp: 88, alive: true },
];

export default function BgmiScreen({ scenario }) {
  const [warn, setWarn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setWarn(true); try { sounds.alert(); } catch { /* noop */ } }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bgmi">
      <div className="bgmi__top">
        <div className="bgmi__map">
          <div className="bgmi__blip" style={{ top: '30%', left: '38%' }} />
          <div className="bgmi__blip" style={{ top: '52%', left: '55%' }} />
          <div className="bgmi__blip bgmi__blip--enemy" style={{ top: '64%', left: '72%' }} />
        </div>
        <div className="bgmi__center">
          <div className="bgmi__alive">👥 41 <span>alive</span></div>
          <div className="bgmi__zone">🔵 Zone 3 · 01:42</div>
        </div>
        <div className="bgmi__kills">💀 3</div>
      </div>

      <div className="bgmi__squad">
        {SQUAD.map((s, i) => (
          <div key={i} className={`bgmi__mate ${s.alive ? '' : 'is-down'}`}>
            <span>{s.n} {s.alive ? '' : '· knocked'}</span>
            <div className="bgmi__hp"><i style={{ width: `${s.hp}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="bgmi__cross">✛</div>

      <div className="bgmi__bottom">
        <div className="bgmi__joy"><div className="bgmi__joy-stick" /></div>
        <div className="bgmi__actions">
          <div className="bgmi__btn bgmi__btn--sm">🦘</div>
          <div className="bgmi__btn">🔫</div>
          <div className="bgmi__btn bgmi__btn--sm">⬇</div>
        </div>
      </div>

      {warn && (
        <div className="bgmi__overlay">
          <button className="bgmi__warn">
            <div className="bgmi__warn-head">🎮 BGMI_SECURITY_OFFICIAL <span>URGENT</span></div>
            <div className="bgmi__warn-body">{scenario.body?.caption}</div>
            <div className="bgmi__warn-cta">⚠️ Verify identity now</div>
          </button>
        </div>
      )}
    </div>
  );
}
