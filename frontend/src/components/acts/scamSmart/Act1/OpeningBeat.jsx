/**
 * Scam Smart · Act 1 — Opening orientation beat (cinematic, before the chat).
 *
 * Flow (skippable):
 *   1. Black screen, lines fade in one at a time (narrated).
 *   2. "Meet the squad" — the five friends fan in as 3D avatar cards, named.
 *   3. "You're in this chat too" — a sixth YOU card joins them.
 *   4. The phone slides up in 3D (🔥 Squad Goals + members) with a ping,
 *      handing off to the real WhatsApp chat via onDone().
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speak, cancelSpeech, sounds } from '../../../../utils/sounds.js';

const GROUP = '🔥 Squad Goals';

// The five friends — same faces (DiceBear seeds) used in the real chat, so the
// intro and the WhatsApp UI feel like one continuous world. Priya is the guide.
const DB = 'https://api.dicebear.com/9.x/avataaars/svg';
const FRIENDS = [
  { name: 'Aryan', tag: 'The skeptic',     color: '#0a8754', av: `${DB}?seed=AryanIN&skinColor=d08b5b&top=theCaesar&hairColor=2c1b18&facialHairProbability=0&backgroundColor=c0aede` },
  { name: 'Diya',  tag: 'Feels everything', color: '#c2389a', av: `${DB}?seed=DiyaGirl7&skinColor=d08b5b&top=straight02&hairColor=2c1b18&accessoriesProbability=0&facialHairProbability=0&backgroundColor=ffd5dc` },
  { name: 'Priya', tag: 'Knows the tricks', color: '#16a34a', av: `${DB}?seed=PriyaGirl3&skinColor=d08b5b&top=longButNotTooLong&hairColor=2c1b18&accessoriesProbability=0&facialHairProbability=0&backgroundColor=d1f4d9`, guide: true },
  { name: 'Kabir', tag: 'Raised the alarm', color: '#2b7de9', av: `${DB}?seed=KabirIN&skinColor=d08b5b&top=shortFlat&hairColor=2c1b18&facialHairProbability=0&backgroundColor=b6e3f4` },
  { name: 'Meera', tag: 'Always online',    color: '#d97706', av: `${DB}?seed=MeeraGirl5&skinColor=d08b5b&top=bob&hairColor=2c1b18&accessoriesProbability=0&facialHairProbability=0&backgroundColor=ffeaa7` },
];
const YOU = { name: 'You', tag: "yes — you", color: '#a855f7', you: true };

const CUES = [
  { t: 300,   g: 'a', line: '11:47 PM.' },
  { t: 2600,  g: 'a', line: 'Five friends. One group chat.' },
  { t: 5000,  g: 'a', line: 'Tonight, one of them is about to send a message that changes everything.' },
  { t: 8800,  g: 'squad', say: 'Meet the squad. Aryan, Diya, Priya, Kabir, and Meera.' },
  { t: 14200, g: 'you',   cap: "You're in this chat too.", say: "And you're in this chat too." },
  { t: 17000, g: 'watch', cap: 'Watch what happens next — because it could just as easily happen to you.', say: 'Watch what happens next, because it could just as easily happen to you.' },
  { t: 20800, g: 'phone' },
  { t: 21700, g: 'ding' },
  { t: 23400, g: 'done' },
];

function fanStyle(i, n) {
  const offset = i - (n - 1) / 2;
  return { transform: `rotateY(${offset * 7}deg) translateZ(${-Math.abs(offset) * 26}px) translateY(${Math.abs(offset) * 7}px)` };
}

function FriendCard({ f, i, n }) {
  return (
    <motion.div
      layout
      className={`obf ${f.guide ? 'obf--guide' : ''} ${f.you ? 'obf--you' : ''}`}
      initial={{ opacity: 0, y: 40, rotateX: -30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: f.you ? 0 : i * 0.45, type: 'spring', stiffness: 110, damping: 14 }}
    >
      <div className="obf__tilt" style={fanStyle(i, n)}>
        <div className="obf__av" style={{ borderColor: f.color, boxShadow: `0 12px 30px -8px ${f.color}` }}>
          {f.you ? <span className="obf__youmark">★</span> : <img src={f.av} alt={f.name} draggable="false" />}
        </div>
        <div className="obf__name" style={{ color: f.you ? '#e9d5ff' : '#fff' }}>{f.name}</div>
        <div className="obf__tag">{f.tag}</div>
      </div>
    </motion.div>
  );
}

export default function OpeningBeat({ soundOn = true, onDone }) {
  const [lines, setLines] = useState([]);
  const [caps, setCaps] = useState([]);
  const [phase, setPhase] = useState('a'); // a | squad | you | watch | phone
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
        if (c.g === 'a') {
          setPhase('a');
          setLines((prev) => prev.concat({ key: c.t, text: c.line }));
        } else if (c.g === 'squad') {
          setPhase('squad'); setLines([]);
        } else if (c.g === 'you') {
          setPhase('you'); setCaps([c.cap]);
        } else if (c.g === 'watch') {
          setPhase('watch'); setCaps((p) => [...p, c.cap]);
        } else if (c.g === 'phone') {
          setPhase('phone');
        } else if (c.g === 'ding') {
          if (soundOn) { try { sounds.msgIn(); } catch { /* noop */ } }
        } else if (c.g === 'done') {
          finish();
        }
        if (c.say && soundOn) { try { cancelSpeech(); speak(c.say, { who: 'narrator' }); } catch { /* noop */ } }
        else if (c.g === 'a' && soundOn) { try { cancelSpeech(); speak(c.line, { who: 'narrator' }); } catch { /* noop */ } }
      }, c.t);
      timers.current.push(id);
    });
    return () => { timers.current.forEach(clearTimeout); try { cancelSpeech(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSquad = phase === 'squad' || phase === 'you' || phase === 'watch';
  const roster = phase === 'squad' ? FRIENDS : [...FRIENDS, YOU];

  return (
    <div className="ob">
      <div aria-hidden className="ob__glow ob__glow--1" />
      <div aria-hidden className="ob__glow ob__glow--2" />
      <div aria-hidden className="ob__floor" />

      <button className="ob__skip" onClick={finish}>Skip ▸</button>

      {/* text-only intro lines */}
      <div className="ob__stage">
        <AnimatePresence mode="popLayout">
          {phase === 'a' && lines.map((l) => (
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

      {/* the squad */}
      <AnimatePresence>
        {showSquad && (
          <motion.div key="squad" className="ob__squad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.45 } }}>
            <motion.div className="ob__squad-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>Meet the squad</motion.div>
            <div className="ob__cards">
              {roster.map((f, i) => <FriendCard key={f.name} f={f} i={i} n={roster.length} />)}
            </div>
            <div className="ob__caps">
              {caps.map((c, i) => (
                <motion.p key={c} className={`ob__cap ${i === 0 ? 'ob__cap--hi' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>{c}</motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* phone slides up */}
      <AnimatePresence>
        {phase === 'phone' && (
          <motion.div
            className="ob__phone"
            initial={{ y: '90%', rotateX: 32, opacity: 0 }}
            animate={{ y: '0%', rotateX: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 58, damping: 15 }}
          >
            <div className="ob__phone-frame">
              <div className="ob__statusbar"><span>11:47</span><span>●●● ▣</span></div>
              <div className="ob__wa-head">
                <div className="ob__wa-back">‹</div>
                <div className="ob__wa-grpav">🔥</div>
                <div className="ob__wa-meta">
                  <div className="ob__wa-grp">{GROUP}</div>
                  <div className="ob__wa-mem">Aryan, Diya, Priya, Kabir, Meera, You</div>
                </div>
              </div>
              <div className="ob__wa-body">
                <motion.div className="ob__wa-ping" initial={{ scale: 0.5, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 13 }}>● New message</motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
