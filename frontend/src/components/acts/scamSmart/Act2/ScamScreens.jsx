/**
 * ScamScreens — the content shown on the phone screen for each Act 2
 * scenario. The YouTube scenario gets a full fake "Virat Kohli" channel;
 * the others render an app-styled message screen (Instagram / SMS / WhatsApp
 * / BGMI). Display-only — all interaction lives in the narrator panel.
 */
import { Suspense } from 'react';
import { CheckCircle2, Volume2 } from 'lucide-react';
import { hasWebGL } from '../BgFx.jsx';
import CricketerScene3D from './CricketerScene3D.jsx';

/* CSS-only cricket scene used when WebGL is unavailable. */
function CricketerCSS() {
  return (
    <div className="cric" aria-hidden>
      <div className="cric__cloud" /><div className="cric__cloud" />
      <div className="cric__stand" />
      <div className="cric__pitch" />
      <div className="cric__player">🏏🧍</div>
    </div>
  );
}

function YouTubeScreen({ body, onSpeak }) {
  const c = body.channel || {};
  const canUse3D = hasWebGL();
  return (
    <div className="yt">
      <div className="yt__top">
        <span className="yt__logo">▶</span> YouTube
      </div>
      <div className="yt__player">
        <div className="yt__canvas">
          {canUse3D ? <Suspense fallback={<CricketerCSS />}><CricketerScene3D /></Suspense> : <CricketerCSS />}
        </div>
        {c.live && <span className="yt__live">● LIVE</span>}
        <span className="yt__aibadge">AI-GENERATED</span>
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
  return <AppScreen s={scenario} />;
}
