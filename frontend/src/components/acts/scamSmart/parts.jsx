/**
 * Scam Smart — shared presentational parts used across the four acts.
 * Pure UI; all analytics/state live in the act components.
 */
import { useEffect, useRef, useState } from 'react';
import { Home, ArrowLeft } from 'lucide-react';

/* Top bar: home button + eyebrow + step pips. */
export function TopBar({ onGoHome, eyebrow, step = 0, total = 0 }) {
  return (
    <div className="ss__topbar">
      <button className="ss__iconbtn" onClick={onGoHome} title="Home" aria-label="Home">
        <Home size={17} />
      </button>
      <span className="ss__eyebrow">{eyebrow}</span>
      {total > 0 && (
        <div className="ss__progress" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`ss__pip ${i <= step ? 'is-on' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/* Shields counter (Act 2 / scoreboard). */
export function Shields({ count = 0, max = 5, label = 'Shields' }) {
  return (
    <div className="ss__shields">
      <span>🛡️ {label}: <b>{count} / {max}</b></span>
      <span className="ss__shieldrow">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={i < count ? 'is-on' : ''}>🛡️</span>
        ))}
      </span>
    </div>
  );
}

export function TypingDots() {
  return (
    <span className="ss__typing" aria-label="typing">
      <i /><i /><i />
    </span>
  );
}

/* A single chat message bubble. */
export function Bubble({ avatar, who, text, side = 'left', showWho = true }) {
  return (
    <div className={`ss__msg ss__msg--${side} ss__fade`}>
      <span className="ss__av">{avatar}</span>
      <div className="ss__bubble">
        {showWho && who && <span className="ss__who">{who}</span>}
        {text}
      </div>
    </div>
  );
}

/**
 * Plays a scripted chat: reveals each message after its typing delay.
 * Calls onDone() once the last message lands. Fully self-paced; honours
 * prefers-reduced-motion by collapsing the delays.
 */
export function ChatStream({ messages, onDone, autoScroll = true }) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(messages.length > 0);
  const endRef = useRef(null);
  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (shown >= messages.length) { setTyping(false); onDone?.(); return undefined; }
    const m = messages[shown];
    const delay = reduced ? 120 : Math.max(280, m.typing ?? 700);
    setTyping(true);
    const t = setTimeout(() => {
      setShown((n) => n + 1);
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, messages]);

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [shown, typing, autoScroll]);

  const last = messages[shown];
  return (
    <>
      {messages.slice(0, shown).map((m, i) => (
        <Bubble key={i} avatar={m.avatar} who={m.from} text={m.text} side={m.side || 'left'} />
      ))}
      {typing && shown < messages.length && (
        <div className={`ss__msg ss__msg--${last?.side || 'left'}`}>
          <span className="ss__av">{last?.avatar}</span>
          <div className="ss__bubble"><TypingDots /></div>
        </div>
      )}
      <div ref={endRef} />
    </>
  );
}

const APP_META = {
  youtube:   { icon: '▶️', name: 'YouTube' },
  instagram: { icon: '📸', name: 'Instagram' },
  whatsapp:  { icon: '💬', name: 'WhatsApp' },
  sms:       { icon: '✉️', name: 'Messages' },
  bgmi:      { icon: '🎮', name: 'BGMI' },
};

/* App-flavoured message card used by scenarios + boss level. */
export function AppCard({ app = 'sms', header, children }) {
  const meta = APP_META[app] || APP_META.sms;
  return (
    <div className={`ss__app ss__app--${app} ss__fade`}>
      <div className="ss__app-head">
        <span>{meta.icon}</span>
        <span>{header?.channel || meta.name}</span>
        {header?.tag && <span className="ss__tag">{header.tag}</span>}
      </div>
      <div className="ss__app-body">{children}</div>
    </div>
  );
}

/* Back / continue footer button row. */
export function FooterNav({ onBack, backLabel = 'Back' }) {
  if (!onBack) return null;
  return (
    <button className="ss__btn ss__btn--ghost" style={{ marginTop: 18 }} onClick={onBack}>
      <ArrowLeft size={16} /> {backLabel}
    </button>
  );
}
