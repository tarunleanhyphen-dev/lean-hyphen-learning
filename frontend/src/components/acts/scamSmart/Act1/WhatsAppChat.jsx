/**
 * WhatsAppChat — an authentic WhatsApp (light theme) group-chat player.
 *
 * Plays a scripted conversation the way WhatsApp feels:
 *   • header shows "<name> is typing…" while a received message is incoming
 *   • a typing-dots bubble appears, then the text reveals CHARACTER BY
 *     CHARACTER (typewriter), with a soft incoming/outgoing sound
 *   • each character shows their own avatar portrait (image, emoji fallback)
 *   • Priya is the main character → her messages are "out" (right, green,
 *     blue double-ticks); everyone else is "in" (left, with avatar + name)
 *   • a real composer bar (emoji / attach / camera / mic) sits at the bottom
 *
 * Calls onDone() once the final message finishes typing.
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Video, Phone, MoreVertical, Smile, Paperclip, Camera, Mic } from 'lucide-react';
import { sounds } from '../../../../utils/sounds.js';
import './whatsapp.css';

const TYPE_MS_PER_CHAR = 22;
const POST_MSG_PAUSE = 380;

// Per-character portrait avatars (generated, character-style). If the image
// can't load (offline), we fall back to the character's emoji.
const AVATAR = {
  Kabir: 'https://api.dicebear.com/9.x/avataaars/svg?seed=KabirIndia&backgroundColor=b6e3f4&radius=50',
  Aryan: 'https://api.dicebear.com/9.x/avataaars/svg?seed=AryanRaj&backgroundColor=c0aede&radius=50',
  Diya:  'https://api.dicebear.com/9.x/avataaars/svg?seed=DiyaSharma&backgroundColor=ffd5dc&radius=50&top=longHair,bigHair,bob',
  Priya: 'https://api.dicebear.com/9.x/avataaars/svg?seed=PriyaMentor&backgroundColor=d1f4d9&radius=50&top=longHair,straight01,bob',
};

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/* Avatar portrait with emoji fallback on image error. */
function Avatar({ name, emoji, className }) {
  const [err, setErr] = useState(false);
  const src = AVATAR[name];
  return (
    <span className={className}>
      {!err && src
        ? <img src={src} alt={name} onError={() => setErr(true)} />
        : emoji}
    </span>
  );
}

export default function WhatsAppChat({ chat, soundOn = true, onDone }) {
  const { group, messages } = chat;
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('typing'); // 'typing' | 'writing' | 'done'
  const [typed, setTyped] = useState('');
  const bodyRef = useRef(null);
  const doneRef = useRef(false);

  const cur = messages[index];

  useEffect(() => {
    if (index >= messages.length) {
      if (!doneRef.current) { doneRef.current = true; onDone?.(); }
      return undefined;
    }
    const reduced = reducedMotion();
    let timers = [];

    if (phase === 'typing') {
      const dwell = reduced ? 120 : Math.max(260, cur.typing ?? 650);
      timers.push(setTimeout(() => {
        if (soundOn) { try { cur.side === 'out' ? sounds.msgOut() : sounds.msgIn(); } catch { /* noop */ } }
        setTyped('');
        setPhase('writing');
      }, dwell));
    } else if (phase === 'writing') {
      const full = cur.text;
      if (reduced) {
        setTyped(full);
        timers.push(setTimeout(advance, 140));
      } else {
        let i = 0;
        const step = () => {
          i += 1;
          setTyped(full.slice(0, i));
          if (i < full.length) timers.push(setTimeout(step, TYPE_MS_PER_CHAR));
          else timers.push(setTimeout(advance, POST_MSG_PAUSE));
        };
        timers.push(setTimeout(step, TYPE_MS_PER_CHAR));
      }
    }

    function advance() {
      setIndex((n) => n + 1);
      setPhase('typing');
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, phase]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [typed, index, phase]);

  const finished = messages.slice(0, index);
  const typingName = phase === 'typing' && cur && cur.side === 'in' ? cur.from : null;
  const headerSub = typingName ? `${typingName} is typing…` : `${group.members.join(', ')}`;

  const renderMeta = (m, withTicks) => (
    <span className="wa__meta">
      {group.time}
      {withTicks && <span className="wa__ticks">✓✓</span>}
    </span>
  );

  const Row = ({ m, grouped, children }) => (
    <div className={`wa__row wa__row--${m.side === 'out' ? 'out' : 'in'} ${grouped ? 'is-grouped' : ''}`}>
      {m.side === 'in' && <Avatar name={m.from} emoji={m.avatar} className={`wa__avatar ${grouped ? 'is-hidden' : ''}`} />}
      <div className="wa__bubble">
        {m.side === 'in' && !grouped && (
          <span className="wa__sender" style={{ color: m.color || '#2b7de9' }}>{m.from}</span>
        )}
        {children}
      </div>
    </div>
  );

  return (
    <div className="wa">
      <header className="wa__header">
        <span className="wa__back"><ArrowLeft size={22} /></span>
        <span className="wa__gavatar">{group.emoji}</span>
        <div className="wa__htitle">
          <div className="wa__hname">{group.name}</div>
          <div className={`wa__hsub ${typingName ? 'is-typing' : ''}`}>{headerSub}</div>
        </div>
        <div className="wa__hicons"><Video /><Phone /><MoreVertical /></div>
      </header>

      <div className="wa__body" ref={bodyRef}>
        <div className="wa__system">🔒 Messages are end-to-end encrypted. No one outside this chat can read them.</div>

        {finished.map((m, i) => {
          const grouped = i > 0 && finished[i - 1].from === m.from;
          return (
            <Row key={i} m={m} grouped={grouped}>
              {m.text}
              {renderMeta(m, m.side === 'out')}
            </Row>
          );
        })}

        {cur && phase === 'typing' && (
          <div className={`wa__row wa__row--${cur.side === 'out' ? 'out' : 'in'}`}>
            {cur.side === 'in' && <Avatar name={cur.from} emoji={cur.avatar} className="wa__avatar" />}
            <div className="wa__bubble">
              <span className="wa__typing"><i /><i /><i /></span>
            </div>
          </div>
        )}
        {cur && phase === 'writing' && (() => {
          const grouped = index > 0 && messages[index - 1].from === cur.from;
          return (
            <Row m={cur} grouped={grouped}>
              {typed}
              {typed.length < cur.text.length && <span className="wa__caret" />}
              {typed.length >= cur.text.length && renderMeta(cur, cur.side === 'out')}
            </Row>
          );
        })()}
      </div>

      {/* Composer bar — decorative, mirrors the real WhatsApp layout */}
      <div className="wa__inputbar">
        <div className="wa__inputpill">
          <Smile />
          <span className="wa__ph">Message</span>
          <Paperclip />
          <Camera />
        </div>
        <div className="wa__mic"><Mic /></div>
      </div>
    </div>
  );
}
