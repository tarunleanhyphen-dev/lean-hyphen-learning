/**
 * ScamScreens — the content shown on the phone screen for each Act 2
 * scenario. The YouTube scenario gets a full fake "Virat Kohli" channel;
 * the others render an app-styled message screen (Instagram / SMS / WhatsApp
 * / BGMI). Display-only — all interaction lives in the narrator panel.
 */
import { useState } from 'react';
import { CheckCircle2, Volume2 } from 'lucide-react';
import InstagramScreen from './InstagramScreen.jsx';
import HomeNotifScreen from './HomeNotifScreen.jsx';
import WhatsAppMsgScreen from './WhatsAppMsgScreen.jsx';
import BgmiScreen from './BgmiScreen.jsx';
import PressScene2D from './PressScene2D.jsx';

/**
 * The "video" inside the fake giveaway. Plays a REAL clip if one is dropped
 * at public/videos/giveaway.mp4 (drop in your own / licensed / AI-generated
 * footage — NOT a real person's deepfake); otherwise shows the animated 3D
 * cricket scene. Either way it's wrapped in YouTube-style chrome so it reads
 * as a real player.
 */
function GiveawayVideo() {
  const [noVideo, setNoVideo] = useState(false);
  return (
    <div className="yt__media">
      {!noVideo ? (
        <video
          className="yt__video"
          src="/videos/giveaway.mp4"
          autoPlay muted loop playsInline preload="auto"
          onError={() => setNoVideo(true)}
        />
      ) : (
        <div className="yt__canvas"><PressScene2D /></div>
      )}
      {/* caption + YouTube-style scrubber to sell the "real video" look */}
      <div className="yt__vcap">“Register your UPI now to claim your ₹10,000…”</div>
      <div className="yt__scrub"><i /></div>
    </div>
  );
}

function YouTubeScreen({ body, onSpeak }) {
  const c = body.channel || {};
  return (
    <div className="yt">
      <div className="yt__top">
        <span className="yt__logo">▶</span> YouTube
      </div>
      <div className="yt__player">
        <GiveawayVideo />
        {c.live && <span className="yt__live">● LIVE</span>}
        {c.viewers && <span className="yt__viewers">👁 {c.viewers}</span>}
        {onSpeak && <button className="yt__sound" onClick={onSpeak} title="Play audio"><Volume2 size={14} /></button>}
      </div>
      <div className="yt__meta">
        <div className="yt__title">{body.headline}</div>
        <div className="yt__chan">
          <span className="yt__avatar">🏏</span>
          <div>
            <div className="yt__cname">
              {c.name}
              {c.verifiedLook && <CheckCircle2 size={12} style={{ color: '#aaa' }} />}
            </div>
            <div className="yt__csub">{c.subs} · {c.videos}</div>
          </div>
          <span className="yt__sub">Subscribe</span>
        </div>
      </div>
      <div className="yt__desc">
        {body.caption}
        {body.link && <a className="yt__link">🔗 {body.link}</a>}
      </div>
      <div className="yt__cta">⚡ Claim now — 87 spots left</div>
    </div>
  );
}

function AppScreen({ s }) {
  const { app, header, body } = s;
  const icon = { instagram: '📸', sms: '✉️', whatsapp: '💬', bgmi: '🎮' }[app] || '✉️';
  return (
    <div className={`appscr appscr--${app}`}>
      <div className="appscr__bar">
        <span className="appscr__av">{icon}</span>
        <div>
          {header?.channel}
          {header?.tag && <small>{header.tag}{header.meta ? ` · ${header.meta}` : ''}</small>}
        </div>
      </div>
      <div className="appscr__body">
        {body.otp && <div className="appscr__otp">🔢 {body.otp}</div>}
        <div className="appscr__msg">
          {body.headline && <div style={{ fontWeight: 700, marginBottom: 4 }}>{body.headline}</div>}
          {body.caption}
          {body.link && <a className="appscr__link">🔗 {body.link}</a>}
        </div>
      </div>
    </div>
  );
}

export default function ScamScreen({ scenario, onSpeak }) {
  if (scenario.app === 'youtube') return <YouTubeScreen body={scenario.body} onSpeak={onSpeak} />;
  if (scenario.app === 'instagram') return <InstagramScreen scenario={scenario} />;
  if (scenario.app === 'sms') {
    return (
      <HomeNotifScreen
        notifs={[
          { app: 'Garena', icon: '🎮', bg: '#e8462e', text: scenario.body.otp },
          { app: 'Messages', icon: '💬', bg: '#34c759', text: scenario.body.caption },
        ]}
      />
    );
  }
  if (scenario.app === 'whatsapp') return <WhatsAppMsgScreen scenario={scenario} />;
  if (scenario.app === 'bgmi') return <BgmiScreen scenario={scenario} />;
  return <AppScreen s={scenario} />;
}
