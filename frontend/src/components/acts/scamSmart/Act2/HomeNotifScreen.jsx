/**
 * HomeNotifScreen — a realistic iOS-style phone HOME screen (wallpaper, clock,
 * app grid, dock) over which notification banners slide down from the top one
 * after another, each with a beep. Used for the Act 2 OTP "accidental code"
 * scenario: first the Garena code arrives, then the stranger asking for it.
 */
import { useEffect, useState } from 'react';
import { sounds } from '../../../../utils/sounds.js';
import PhoneHome from './PhoneHome.jsx';

export default function HomeNotifScreen({ notifs = [] }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = [];
    notifs.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setShown(i + 1);
        try { sounds.ding(); } catch { /* noop */ }
      }, 700 + i * 2400));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="home-wrap">
      <PhoneHome />
      <div className="home__notifs">
        {notifs.slice(0, shown).map((nf, i) => (
          <div key={i} className="home__notif">
            <div className="home__notif-icon" style={{ background: nf.bg }}>{nf.icon}</div>
            <div className="home__notif-body">
              <div className="home__notif-top"><b>{nf.app}</b><span>now</span></div>
              <div className="home__notif-text">{nf.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
