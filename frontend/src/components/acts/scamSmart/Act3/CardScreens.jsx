/**
 * CardScreens — the phone screen shown beside each Act 3 pattern card.
 * Renders the card's real-world example as a convincing on-phone notification
 * so the learner sees the scam in context while Priya explains the pattern.
 */
const APP_BY_CARD = {
  deepfake: { app: 'youtube', label: 'YouTube', icon: '▶' },
  otp:      { app: 'sms',     label: 'Messages', icon: '✉️' },
  gaming:   { app: 'instagram', label: 'Instagram', icon: '📸' },
};

export default function CardScreen({ card }) {
  const meta = APP_BY_CARD[card.id] || { app: 'sms', label: 'Alert', icon: '⚠️' };
  return (
    <div className={`appscr appscr--${meta.app}`} style={{ height: '100%' }}>
      <div className="appscr__bar">
        <span className="appscr__av">{meta.icon}</span>
        <div>
          {meta.label}
          <small>Suspicious · just now</small>
        </div>
      </div>
      <div className="appscr__body">
        <div style={{ fontSize: 40, textAlign: 'center', margin: '6px 0' }}>{card.icon}</div>
        <div className="appscr__msg" style={{ maxWidth: '100%' }}>
          <div style={{ fontWeight: 700, marginBottom: 5 }}>“{card.tagline}”</div>
          {card.example}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#fca5a5', marginTop: 'auto' }}>
          ⚠️ This is a scam pattern — spot it.
        </div>
      </div>
    </div>
  );
}
