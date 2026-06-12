/**
 * PhoneHome — a realistic iOS-style home screen (wallpaper, clock, app grid,
 * dock) with brand-styled app icons. Shared by the notification-style Act 2
 * scenarios. Icons are recreated with brand colours + glyphs (not logo files).
 */
import {
  MessageSquare, Phone, Gamepad2, Settings, Camera, Image, MapPin, Clock,
  Instagram, Youtube, MessageCircle, Calculator, Compass, Music,
} from 'lucide-react';

const APPS = [
  { I: MessageSquare, n: 'Messages', bg: 'linear-gradient(#5bf675,#19c84b)', c: '#fff' },
  { I: Phone,         n: 'Phone',    bg: 'linear-gradient(#5bf675,#19c84b)', c: '#fff' },
  { I: Gamepad2,      n: 'Free Fire', bg: 'linear-gradient(#ff8a3d,#e8331f)', c: '#fff' },
  { I: Settings,      n: 'Settings', bg: 'linear-gradient(#c7c7cd,#7a7a82)', c: '#fff' },
  { I: Camera,        n: 'Camera',   bg: 'linear-gradient(#3a3a3c,#1c1c1e)', c: '#fff' },
  { I: Image,         n: 'Photos',   bg: '#ffffff', c: '#ec4899' },
  { I: MapPin,        n: 'Maps',     bg: 'linear-gradient(#a7e89b,#4fb24a)', c: '#fff' },
  { I: Clock,         n: 'Clock',    bg: '#0a0a0a', c: '#fff' },
  { I: Instagram,     n: 'Instagram', bg: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)', c: '#fff' },
  { I: Youtube,       n: 'YouTube',  bg: '#ff0033', c: '#fff' },
  { I: MessageCircle, n: 'WhatsApp', bg: 'linear-gradient(#5bf675,#25d366)', c: '#fff' },
  { I: Calculator,    n: 'Calc',     bg: 'linear-gradient(#3a3a3c,#1c1c1e)', c: '#ff9f0a' },
];
const DOCK = [
  { I: Phone, bg: 'linear-gradient(#5bf675,#19c84b)' },
  { I: MessageSquare, bg: 'linear-gradient(#5bf675,#19c84b)' },
  { I: Compass, bg: 'linear-gradient(#3aa0ff,#1f6feb)' },
  { I: Music, bg: 'linear-gradient(#fb5c74,#fa2d48)' },
];

export default function PhoneHome() {
  return (
    <div className="home">
      <div className="home__clock">
        <div className="home__time">11:47</div>
        <div className="home__date">Friday, 14 June</div>
      </div>
      <div className="home__grid">
        {APPS.map((a, i) => (
          <div key={i} className="home__app">
            <div className="home__icon" style={{ background: a.bg, color: a.c }}><a.I size={26} strokeWidth={2} /></div>
            <span>{a.n}</span>
          </div>
        ))}
      </div>
      <div className="home__dock">
        {DOCK.map((d, i) => (
          <div key={i} className="home__dockicon" style={{ background: d.bg }}><d.I size={25} color="#fff" /></div>
        ))}
      </div>
    </div>
  );
}
