/**
 * Scam Smart · Act 1 — Opening orientation beat (15–20s, before the chat).
 *
 * Black screen. Lines fade in one at a time (with narrator voice), a beat of
 * uncomfortable silence, then the phone slides up from the bottom in 3D with a
 * WhatsApp group header (🔥 Squad Goals + members) and a notification sound —
 * handing off to the real chat via onDone().
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speak, cancelSpeech, sounds } from '../../../../utils/sounds.js';

const GROUP = '🔥 Squad Goals';
const MEMBERS = ['Aryan', 'Diya', 'Priya', 'Kabir', 'Meera', 'You'];

// Cue timeline (ms). g: a/b = text groups · beat = black pause · phone/ding/done.
const CUES = [
  { t: 400,   g: 'a', line: '11:47 PM.' },
  { t: 3000,  g: 'a', line: 'Five friends. One group chat.' },
  { t: 5800,  g: 'a', line: 'Tonight, one of them is about to send a message that changes everything.' },
  { t: 9600,  g: 'beat' },
  { t: 11000, g: 'b', line: "You're in this chat too." },
  { t: 13600, g: 'b', line: 'Watch what happens next — because it could just as easily happen to you.' },
  { t: 17000, g: 'phone' },
  { t: 17900, g: 'ding' },
  { t: 19400, g: 'done' },
];

export default function OpeningBeat({ soundOn = true, onDone }) {
  const [lines, setLines] = useState([]);
  const [phase, setPhase] = useState('a'); // a | beat | b | phone
  const doneRef = useRef(false);
  const timers = useRef([]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    timers.current.forEach(clearTimeout);
    try { cancelSpeech(); } catch { /* noop */ }
    onDone?.();
  };

  useEffect(() => {
    CUES.forEach((c) => {
      const id = setTimeout(() => {
        if (c.g === 'a' || c.g === 'b') {
          setPhase(c.g);
          setLines((prev) => prev.concat({ key: c.t, text: c.line }));
          if (soundOn) { try { cancelSpeech(); speak(c.line, { who: 'narrator' }); } catch { /* noop */ } }
        } else if (c.g === 'beat') {
          setPhase('beat'); setLines([]);
        } else if (c.g === 'phone') {
          setPhase('phone');
        } else if (c.g === 'ding') {
          if (soundOn) { try { sounds.msgIn(); } catch { /* noop */ } }
        } else if (c.g === 'done') {
          finish();
        }
      }, c.t);
      timers.current.push(id);
    });
    return () => { timers.current.forEach(clearTimeout); try { cancelSpeech(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ob">
      {/* drifting glow specks for a touch of depth */}
      <div aria-hidden className="ob__glow ob__glow--1" />
      <div aria-hidden className="ob__glow ob__glow--2" />

      <button className="ob__skip" onClick={finish}>Skip ▸</button>

      <div className="ob__stage">
        <AnimatePresence mode="popLayout">
          {phase !== 'phone' && lines.map((l) => (
            <motion.p
              key={l.key}
              className="ob__line"
              initial={{ opacity: 0, y: 18, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(8px)', transition: { duration: 0.6 } }}
              transition={{ duration: 1.15, ease: 'easeOut' }}
            >
              {l.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {phase === 'phone' && (
          <motion.div
            className="ob__phone"
            initial={{ y: '90%', rotateX: 32, opacity: 0 }}
            animate={{ y: '0%', rotateX: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 58, damping: 15 }}
          >
            <div className="ob__phone-frame">
              <div className="ob__wa-head">
                <div className="ob__wa-grp">{GROUP}</div>
                <div className="ob__wa-mem">{MEMBERS.join('  ·  ')}</div>
              </div>
              <div className="ob__wa-body">
                <motion.div
                  className="ob__wa-ping"
                  initial={{ scale: 0.5, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 13 }}
                >
                  ● New message
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
