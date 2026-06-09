/**
 * LMS debug overlay.
 *
 * A small, fixed-position panel that lists the events the course is sending to
 * the Banyanpro LMS, in real time. Renders ONLY when `?lmsdebug=1` is present.
 *
 * Purpose: during a test inside the LMS iframe, a tester can see at a glance
 *   • whether the course is actually embedded (so postMessage can reach the LMS),
 *   • each event as it fires, with verb / object / score,
 *   • a ✅/⛔ marker showing whether that event was actually sent.
 * If events show here but not in BanyanPro → the LMS isn't receiving/handling
 * them. If nothing shows here → we're not emitting (or not embedded).
 */
import { useEffect, useState } from 'react';
import { lmsDebugEnabled, subscribeLmsDebug, clearLmsDebug } from '../../lib/lmsDebug.js';
import tracker from '../../lib/banyanproTracker.js';

export default function LmsDebugOverlay() {
  const [enabled] = useState(lmsDebugEnabled);
  const [log, setLog] = useState([]);
  const [open, setOpen] = useState(true);
  const embedded = typeof tracker.isEmbedded === 'function' && tracker.isEmbedded();

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeLmsDebug(setLog);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: 'fixed', right: 12, bottom: 12, zIndex: 99999,
        width: open ? 360 : 'auto', maxWidth: 'calc(100vw - 24px)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11,
        color: '#e5e7eb', background: 'rgba(17,24,39,0.96)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.45)', overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.06)',
          borderBottom: open ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ letterSpacing: 0.3 }}>LMS Debug</strong>
          <span
            title={embedded ? 'Running inside an iframe — postMessage will reach the LMS' : 'NOT embedded — events will not be sent. Test inside the LMS.'}
            style={{
              padding: '1px 7px', borderRadius: 999, fontWeight: 700, fontSize: 10,
              background: embedded ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
              color: embedded ? '#86efac' : '#fca5a5',
              border: `1px solid ${embedded ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}
          >
            {embedded ? 'EMBEDDED' : 'NOT EMBEDDED'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={clearLmsDebug} style={btn}>clear</button>
          <button onClick={() => setOpen((o) => !o)} style={btn}>{open ? 'hide' : 'show'}</button>
        </div>
      </div>

      {open && (
        <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {!embedded && (
            <div style={{ padding: '8px 10px', color: '#fca5a5', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              ⚠️ Not inside an LMS iframe — events are logged here but <b>not sent</b>. Open the course from within BanyanPro to send for real.
            </div>
          )}
          {log.length === 0 && (
            <div style={{ padding: '12px 10px', opacity: 0.7 }}>No events yet — play through an act to see them fire.</div>
          )}
          {log.map((e) => (
            <div key={e.eventId} style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span title={e.sent ? 'sent to LMS' : 'not sent (not embedded)'}>{e.sent ? '✅' : '⛔'}</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{e.verb}</span>
                <span style={{ color: '#93c5fd' }}>{e.objectType}</span>
                {e.result?.percentage != null && (
                  <span style={{ marginLeft: 'auto', color: '#86efac' }}>
                    {e.result.score != null ? `${e.result.score}/${e.result.maxScore} · ` : ''}{e.result.percentage}%
                  </span>
                )}
              </div>
              <div style={{ opacity: 0.85, marginTop: 2 }}>{e.objectName}</div>
              <div style={{ opacity: 0.5, fontSize: 10, marginTop: 1 }}>{e.objectId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const btn = {
  cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 7,
  background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', fontSize: 10,
  padding: '2px 7px', fontFamily: 'inherit',
};
