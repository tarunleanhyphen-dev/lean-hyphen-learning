/**
 * Narrator — Priya guides the learner through each scenario. Her line streams
 * in character-by-character (typewriter), then onDone() fires so the choices
 * can appear. Pass a changing `streamKey` to restart the stream per scenario.
 */
import { useEffect, useRef, useState } from 'react';

const SPEED = 18; // ms per char

export default function Narrator({ name = 'Priya', role = 'Your guide', avatar = '🛡️', text, streamKey, onDone }) {
  const [shown, setShown] = useState('');
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setShown('');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setShown(text); onDone?.(); return undefined; }
    let i = 0;
    let timer;
    const step = () => {
      i += 1;
      setShown(text.slice(0, i));
      if (i < text.length) timer = setTimeout(step, SPEED);
      else if (!doneRef.current) { doneRef.current = true; onDone?.(); }
    };
    timer = setTimeout(step, SPEED);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamKey]);

  return (
    <div>
      <div className="narr__head">
        <div className="narr__avatar">{avatar}</div>
        <div>
          <div className="narr__name">{name}</div>
          <div className="narr__role">{role}</div>
        </div>
      </div>
      <div className="narr__speech">
        {shown}
        {shown.length < (text?.length ?? 0) && <span className="ss__caret" />}
      </div>
    </div>
  );
}
