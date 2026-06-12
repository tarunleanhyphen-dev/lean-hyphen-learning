/**
 * InstagramScreen — a realistic Instagram home UI (stories + one post + reels
 * tab bar) that fills the phone. The scam DM arrives as an iOS-style
 * notification banner sliding in from the top with a beep; TAPPING it opens
 * the Instagram DM conversation so the learner can read the full message.
 */
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Home, Search, Film, ShoppingBag, ChevronLeft, Phone, Info } from 'lucide-react';
import { sounds } from '../../../../utils/sounds.js';

const STORIES = [
  { name: 'Your story', me: true }, { name: 'rohan_17', e: '🧑🏽' }, { name: 'cricket.daily', e: '🏏' },
  { name: 'diya.sh', e: '👧🏽' }, { name: 'meme.lord', e: '😎' }, { name: 'aryan_x', e: '🧑🏽' },
];
const POST = { user: 'cricket.daily', av: '🏏', img: '🏟️', likes: '12,481', cap: 'match day! who is winning tonight 🔥🏏', bg: 'linear-gradient(135deg,#1e5bb8,#0e7a4f)' };

function HomeFeed() {
  return (
    <>
      <div className="ig__header">
        <span className="ig__logo">Instagram</span>
        <div className="ig__hicons"><Heart size={20} /><Send size={20} /></div>
      </div>
      <div className="ig__stories">
        {STORIES.map((s, i) => (
          <div key={i} className="ig__story">
            <div className={`ig__story-ring ${s.me ? 'is-me' : ''}`}><span>{s.me ? '＋' : s.e}</span></div>
            <span className="ig__story-name">{s.name}</span>
          </div>
        ))}
      </div>
      <div className="ig__feed">
        <div className="ig__post">
          <div className="ig__post-head"><span className="ig__post-av">{POST.av}</span><b>{POST.user}</b><span className="ig__more">⋯</span></div>
          <div className="ig__post-img" style={{ background: POST.bg }}>{POST.img}</div>
          <div className="ig__post-actions"><Heart size={22} /><MessageCircle size={22} /><Send size={22} /><Bookmark size={22} style={{ marginLeft: 'auto' }} /></div>
          <div className="ig__post-likes">{POST.likes} likes</div>
          <div className="ig__post-cap"><b>{POST.user}</b> {POST.cap}</div>
        </div>
      </div>
      <div className="ig__nav">
        <Home size={23} /><Search size={23} /><Film size={23} /><ShoppingBag size={23} /><span className="ig__nav-av">🧑🏽</span>
      </div>
    </>
  );
}

function DMView({ scenario, onBack }) {
  return (
    <div className="igdm">
      <div className="igdm__head">
        <button className="igdm__back" onClick={onBack}><ChevronLeft size={24} /></button>
        <span className="igdm__av">👤</span>
        <div className="igdm__who"><b>{scenario.header?.channel?.replace(' (Unknown)', '')}</b><small>Instagram user · not following you</small></div>
        <div className="igdm__icons"><Phone size={19} /><Info size={19} /></div>
      </div>
      <div className="igdm__body">
        <div className="igdm__warn">⚠️ This account isn’t following you and was recently created.</div>
        <div className="igdm__msg">{scenario.body?.caption}</div>
        <div className="igdm__time">Delivered · now</div>
      </div>
      <div className="igdm__input"><span>Message…</span><span className="igdm__send">➤</span></div>
    </div>
  );
}

export default function InstagramScreen({ scenario }) {
  const [notif, setNotif] = useState(false);
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setNotif(true); try { sounds.ding(); } catch { /* noop */ } }, 700);
    return () => clearTimeout(t);
  }, []);

  if (dm) return <DMView scenario={scenario} onBack={() => setDm(false)} />;

  return (
    <div className="ig">
      {notif && (
        <button className="ig__notif" onClick={() => setDm(true)}>
          <div className="ig__notif-icon">📸</div>
          <div className="ig__notif-body">
            <div className="ig__notif-top"><b>INSTAGRAM</b><span>now</span></div>
            <div className="ig__notif-title">{scenario.header?.channel} · Direct message</div>
            <div className="ig__notif-text">{scenario.body?.caption}</div>
            <div className="ig__notif-tap">Tap to open ›</div>
          </div>
        </button>
      )}
      <HomeFeed />
    </div>
  );
}
