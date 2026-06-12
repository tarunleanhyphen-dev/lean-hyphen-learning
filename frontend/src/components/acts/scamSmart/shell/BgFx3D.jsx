/**
 * BgFx3D — a living, scam-themed backdrop. A field of alert / shield / lock /
 * phishing icons drift and rotate in 3D (CSS perspective + transforms) behind
 * all content. Pure CSS motion: no WebGL, never blanks, and sits at z-index 0
 * with low opacity so it can never hide text, buttons or icons.
 */
import {
  AlertTriangle, ShieldAlert, Lock, Bell, Link2, Ban, Eye, CreditCard,
  Siren, KeyRound, Fingerprint, Fish, MailWarning, Bug, ScanFace, WifiOff,
  Skull, Megaphone, QrCode, Smartphone, Wallet, MessageSquareWarning, Unlock, ShieldX,
} from 'lucide-react';

// {Icon, top%, left%, size, color, anim (a..e), dur s, delay s, opacity}
const ICONS = [
  { I: AlertTriangle, t: 12, l: 8,  s: 58, c: '#f59e0b', a: 'a', d: 17, dl: 0,   o: 0.20 },
  { I: ShieldAlert,   t: 26, l: 82, s: 70, c: '#6366f1', a: 'b', d: 21, dl: -3,  o: 0.20 },
  { I: Lock,          t: 64, l: 14, s: 50, c: '#22d3ee', a: 'c', d: 19, dl: -6,  o: 0.18 },
  { I: Fish,          t: 78, l: 72, s: 62, c: '#a855f7', a: 'd', d: 23, dl: -9,  o: 0.18 },
  { I: Bell,          t: 44, l: 46, s: 44, c: '#f43f5e', a: 'e', d: 16, dl: -2,  o: 0.16 },
  { I: KeyRound,      t: 16, l: 60, s: 46, c: '#34d399', a: 'c', d: 20, dl: -5,  o: 0.17 },
  { I: CreditCard,    t: 84, l: 32, s: 54, c: '#818cf8', a: 'a', d: 22, dl: -11, o: 0.17 },
  { I: Siren,         t: 8,  l: 38, s: 46, c: '#ef4444', a: 'b', d: 18, dl: -7,  o: 0.18 },
  { I: Link2,         t: 54, l: 88, s: 48, c: '#22d3ee', a: 'd', d: 24, dl: -4,  o: 0.16 },
  { I: Eye,           t: 36, l: 24, s: 46, c: '#c084fc', a: 'e', d: 19, dl: -10, o: 0.16 },
  { I: Fingerprint,   t: 70, l: 54, s: 56, c: '#fbbf24', a: 'a', d: 25, dl: -1,  o: 0.16 },
  { I: MailWarning,   t: 90, l: 84, s: 46, c: '#fb7185', a: 'c', d: 17, dl: -8,  o: 0.16 },
  { I: Ban,           t: 22, l: 18, s: 40, c: '#f87171', a: 'b', d: 20, dl: -12, o: 0.15 },
  { I: ScanFace,      t: 58, l: 66, s: 54, c: '#818cf8', a: 'd', d: 23, dl: -6,  o: 0.16 },
  { I: Bug,           t: 4,  l: 70, s: 42, c: '#34d399', a: 'e', d: 21, dl: -3,  o: 0.15 },
  { I: WifiOff,       t: 48, l: 4,  s: 44, c: '#22d3ee', a: 'b', d: 18, dl: -9,  o: 0.15 },
  { I: Skull,         t: 32, l: 92, s: 44, c: '#f43f5e', a: 'a', d: 22, dl: -5,  o: 0.15 },
  { I: Megaphone,     t: 88, l: 58, s: 46, c: '#fbbf24', a: 'd', d: 19, dl: -2,  o: 0.15 },
  { I: QrCode,        t: 6,  l: 52, s: 42, c: '#a855f7', a: 'c', d: 24, dl: -10, o: 0.15 },
  { I: Smartphone,    t: 72, l: 30, s: 44, c: '#22d3ee', a: 'e', d: 20, dl: -7,  o: 0.14 },
  { I: Wallet,        t: 40, l: 72, s: 46, c: '#34d399', a: 'a', d: 23, dl: -4,  o: 0.15 },
  { I: MessageSquareWarning, t: 18, l: 34, s: 44, c: '#f59e0b', a: 'b', d: 18, dl: -11, o: 0.15 },
  { I: Unlock,        t: 60, l: 40, s: 42, c: '#fb7185', a: 'd', d: 21, dl: -6,  o: 0.14 },
  { I: ShieldX,       t: 50, l: 22, s: 50, c: '#6366f1', a: 'c', d: 25, dl: -1,  o: 0.15 },
];

export default function BgFx3D() {
  return (
    <div className="ssh__fx" aria-hidden>
      {ICONS.map(({ I, t, l, s, c, a, d, dl, o }, i) => (
        <span
          key={i}
          className={`ssh__fx-icon ssh__fx-${a}`}
          style={{ top: `${t}%`, left: `${l}%`, color: c, opacity: o, animationDuration: `${d}s`, animationDelay: `${dl}s` }}
        >
          <I size={s} strokeWidth={1.6} />
        </span>
      ))}
    </div>
  );
}
