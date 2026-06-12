/**
 * PhoneShell — the iPhone frame the scam content renders inside, matching the
 * Netlify "Spot the Scam" look: rounded titanium frame, a status bar
 * (time · signal/WiFi), a dynamic-island notch, and a scrollable screen.
 */
export default function PhoneShell({ time = '11:47 PM', battery = '67%', children, screenClass = '' }) {
  return (
    <div className="ssh__phone">
      <div className="ssh__statusbar">
        <span>{time}</span>
        <span className="ssh__notch" />
        <span className="ssh__status-right">▲ WiFi {battery}</span>
      </div>
      <div className={`ssh__screen ${screenClass}`}>
        {children}
      </div>
    </div>
  );
}
