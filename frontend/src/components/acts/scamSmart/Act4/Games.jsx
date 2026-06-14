/**
 * Scam Smart · Act 4 — the four timed mini-games + boss level, in a gamified,
 * centered, icon-rich presentation. Each game is self-contained: it renders,
 * runs its own timer, grades the learner, then calls onDone({ points, correct,
 * total }). Prompts are read aloud (voice). The orchestrator (Act4.jsx)
 * accumulates points and emits the analytics activity events.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Clock, CheckCircle2, XCircle, Volume2, Link2, Zap, ScanSearch,
  Puzzle, Crosshair, Check, X, Mail, ShieldCheck,
} from 'lucide-react';
import PhoneShell from '../shell/PhoneShell.jsx';
import { speak, cancelSpeech } from '../../../../utils/sounds.js';

/* Speak a game's prompt on mount (and stop on unmount). */
function useGameVoice(text) {
  useEffect(() => {
    const t = setTimeout(() => { try { speak(text, { who: 'priya' }); } catch { /* noop */ } }, 350);
    return () => { clearTimeout(t); try { cancelSpeech(); } catch { /* noop */ } };
  }, [text]);
}

/* Centered game container with an icon badge, title + voiced prompt, and hud. */
function GameShell({ Icon, title, prompt, hud, children }) {
  const replay = () => { try { cancelSpeech(); speak(prompt, { who: 'priya' }); } catch { /* noop */ } };
  return (
    <div className="mg">
      <div className="mg__head">
        <div className="mg__icon"><Icon size={26} /></div>
        <div className="mg__titles">
          <h2 className="mg__title">{title}</h2>
          <p className="mg__prompt">{prompt}<button className="mg__voice" onClick={replay} title="Hear this"><Volume2 size={14} /></button></p>
        </div>
      </div>
      {hud}
      {children}
    </div>
  );
}

function useCountdown(seconds, onExpire, deps = []) {
  const [left, setLeft] = useState(seconds);
  const expired = useRef(false);
  useEffect(() => {
    setLeft(seconds); expired.current = false;
    const id = setInterval(() => {
      setLeft((t) => { if (t <= 1) { clearInterval(id); if (!expired.current) { expired.current = true; onExpire?.(); } return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return left;
}

function TimerBar({ left, total }) {
  const pct = Math.max(0, (left / total) * 100);
  return (
    <div className="mg__timer-wrap">
      <div className="mg__timer-label" style={{ color: pct < 30 ? '#fca5a5' : 'rgba(255,255,255,.75)' }}><Clock size={14} /> {left}s</div>
      <div className="ss__timer"><i className={pct < 30 ? 'is-low' : ''} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

/* ── MG1 — Spot the fake link ─────────────────────────────── */
export function SpotLink({ data, onDone }) {
  useGameVoice(data.prompt);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const left = useCountdown(data.seconds, () => setDone(true), []);
  const choose = (opt) => { if (!done) { setPicked(opt.id); setDone(true); } };
  const pickedReal = picked && data.options.find((o) => o.id === picked)?.real;

  return (
    <GameShell Icon={Link2} title={data.title} prompt={data.prompt} hud={!done && <TimerBar left={left} total={data.seconds} />}>
      <div className="mg__links">
        {data.options.map((o) => {
          const cls = done ? (o.real ? 'is-real' : (picked === o.id ? 'is-fake' : '')) : '';
          return (
            <button key={o.id} className={`mg__link ${cls}`} disabled={done} onClick={() => choose(o)}>
              <span className="mg__link-icon"><Link2 size={18} /></span>
              <span className="mg__link-url">{o.url}</span>
              {done && (o.real ? <Check size={20} className="mg__link-res ok" /> : (picked === o.id ? <X size={20} className="mg__link-res no" /> : null))}
            </button>
          );
        })}
      </div>
      {done && (
        <>
          <div className={`mg__result mg__result--${pickedReal ? 'win' : 'fail'}`}>
            <h4>{pickedReal ? <><CheckCircle2 size={18} /> Nice — that's the real one</> : <><XCircle size={18} /> The real one was highlighted</>}</h4>
            <ul className="ss__do">{data.explain.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
          <button className="ss__btn ss__btn--full" onClick={() => onDone({ points: pickedReal ? data.points : 0, correct: pickedReal ? 1 : 0, total: 1 })}>Continue <ArrowRight size={18} /></button>
        </>
      )}
    </GameShell>
  );
}

/* ── MG2 — Real or Scam? speed round ──────────────────────── */
export function SpeedRound({ data, onDone }) {
  useGameVoice(data.prompt);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [points, setPoints] = useState(0);
  const [correct, setCorrect] = useState(0);
  const resolved = useRef(false);
  const pointsRef = useRef(0);
  const correctRef = useRef(0);
  const holdTimer = useRef(null);
  const msg = data.messages[i];

  // Hold the answer + explanation on screen for 10s, then move on. A "Next"
  // button lets a fast reader advance early; whichever fires first wins.
  const advance = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (!resolved.current) return; // guard against double-advance
    resolved.current = false;
    if (i + 1 >= data.messages.length) onDone({ points: Math.max(0, pointsRef.current), correct: correctRef.current, total: data.messages.length });
    else { setI((n) => n + 1); setPicked(null); }
  };
  const answer = (val) => {
    if (resolved.current) return;
    resolved.current = true;
    const right = val === msg.answer;
    setPicked(val ?? 'timeout');
    if (right) { pointsRef.current += data.correctPoints; correctRef.current += 1; }
    else if (val) { pointsRef.current += data.wrongPoints; }
    setPoints(Math.max(0, pointsRef.current)); setCorrect(correctRef.current);
    holdTimer.current = setTimeout(advance, 10000);
  };
  useEffect(() => () => { if (holdTimer.current) clearTimeout(holdTimer.current); }, []);
  const left = useCountdown(data.secondsEach, () => answer(null), [i]);

  return (
    <GameShell Icon={Zap} title={data.title} prompt={data.prompt}
      hud={(
        <div className="mg__bar">
          <div className="mg__dots">{data.messages.map((_, k) => <span key={k} className={`mg__dot ${k < i ? 'done' : ''} ${k === i ? 'now' : ''}`} />)}</div>
          <span className="ss__points ss__points--up">★ {Math.max(0, points)}</span>
        </div>
      )}>
      {!picked && <TimerBar left={left} total={data.secondsEach} />}
      <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mg__msg"><div className="mg__msg-from"><Mail size={14} /> {msg.from}</div><div className="mg__msg-text">{msg.text}</div></div>
        <div className="mg__rs">
          <button className={`mg__rs-btn mg__rs-real ${picked && msg.answer === 'REAL' ? 'is-right' : (picked === 'REAL' ? 'is-wrong' : '')}`} disabled={!!picked} onClick={() => answer('REAL')}><ShieldCheck size={20} /> REAL</button>
          <button className={`mg__rs-btn mg__rs-scam ${picked && msg.answer === 'SCAM' ? 'is-right' : (picked === 'SCAM' ? 'is-wrong' : '')}`} disabled={!!picked} onClick={() => answer('SCAM')}><XCircle size={20} /> SCAM</button>
        </div>
        {picked && (
          <div className={`mg__result mg__result--${picked === msg.answer ? 'win' : 'fail'}`}>
            <h4>{picked === msg.answer ? <><CheckCircle2 size={18} /> Correct (+{data.correctPoints})</> : <><XCircle size={18} /> It was {msg.answer}</>}</h4>
            <p>{msg.explain}</p>
            <button className="mg__next" onClick={advance}>
              {i + 1 >= data.messages.length ? 'See results' : 'Next'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </motion.div>
    </GameShell>
  );
}

/* ── MG3 — What's wrong here? ─────────────────────────────── */
export function WhatsWrong({ data, onDone }) {
  useGameVoice(data.prompt);
  const { email } = data;
  const [found, setFound] = useState([]);
  const [done, setDone] = useState(false);
  const left = useCountdown(data.seconds, () => setDone(true), []);
  const tap = (flag) => { if (done || found.includes(flag)) return; const next = [...found, flag]; setFound(next); if (next.length >= data.flags.length) setDone(true); };
  const n = found.length;
  const points = n >= 4 ? 40 : n === 3 ? 25 : n === 2 ? 10 : 0;
  const TapSpan = ({ flag, label, children }) => (
    <span className={`ss__tap ${found.includes(flag) ? 'is-found' : ''}`} title={done ? label : 'Tap if this looks wrong'} onClick={() => tap(flag)}>{children}</span>
  );

  return (
    <GameShell Icon={ScanSearch} title={data.title} prompt={`${data.prompt} (${n}/${data.flags.length} found)`} hud={!done && <TimerBar left={left} total={data.seconds} />}>
      <div className="ss__email">
        <div className="ss__email-head">
          <div>FROM: <TapSpan flag={email.fromFlag.flag} label={email.fromFlag.label}>{email.from}</TapSpan></div>
          <div style={{ marginTop: 4, fontWeight: 700 }}>SUBJECT: {email.subject}</div>
        </div>
        <div className="ss__email-body">
          {email.lines.map((ln, idx) => (
            <p key={idx} style={{ margin: '0 0 8px' }}>{ln.flag ? <TapSpan flag={ln.flag} label={ln.label}>{ln.text}</TapSpan> : ln.text}</p>
          ))}
        </div>
      </div>
      {done && (
        <>
          <div className="mg__result mg__result--win">
            <h4><ScanSearch size={18} /> You found {n} of {data.flags.length}</h4>
            <ul className="ss__redflags">{[email.fromFlag, ...email.lines.filter((l) => l.flag)].map((f, i) => <li key={i} style={{ opacity: found.includes(f.flag) ? 1 : 0.55 }}>{f.label}</li>)}</ul>
          </div>
          <button className="ss__btn ss__btn--full" onClick={() => onDone({ points, correct: n, total: data.flags.length })}>Continue <ArrowRight size={18} /></button>
        </>
      )}
    </GameShell>
  );
}

/* ── MG4 — Match the response (one situation at a time, no scroll) ── */
export function MatchGame({ data, onDone }) {
  useGameVoice(data.prompt);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const correctRef = useRef(0);
  const sit = data.situations[i];
  const rightId = data.answer[sit.id];

  const choose = (rId) => {
    if (picked) return;
    setPicked(rId);
    if (rId === rightId) correctRef.current += 1;
    setTimeout(() => {
      if (i + 1 >= data.situations.length) {
        const correct = correctRef.current;
        const points = correct >= 5 ? 50 : correct === 4 ? 35 : correct === 3 ? 20 : 0;
        onDone({ points, correct, total: data.situations.length });
      } else { setI((n) => n + 1); setPicked(null); }
    }, 1250);
  };

  return (
    <GameShell Icon={Puzzle} title={data.title} prompt={data.prompt}
      hud={(
        <div className="mg__bar">
          <div className="mg__dots">{data.situations.map((_, k) => <span key={k} className={`mg__dot ${k < i ? 'done' : ''} ${k === i ? 'now' : ''}`} />)}</div>
          <span className="ss__eyebrow">Situation {i + 1} / {data.situations.length}</span>
        </div>
      )}>
      <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mg__situation"><span className="mg__situation-q">What do you do?</span>{sit.text}</div>
        <div className="mg__responses">
          {data.responses.map((r) => {
            const isPicked = picked === r.id;
            const isRight = r.id === rightId;
            const cls = picked ? (isRight ? 'is-right' : (isPicked ? 'is-wrong' : 'is-dim')) : '';
            return (
              <button key={r.id} className={`mg__response ${cls}`} disabled={!!picked} onClick={() => choose(r.id)}>
                <span className="mg__response-key">{r.id}</span>
                <span className="mg__response-text">{r.text}</span>
                {picked && isRight && <Check size={20} className="mg__link-res ok" />}
                {picked && isPicked && !isRight && <X size={20} className="mg__link-res no" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </GameShell>
  );
}

/* Phone screen for the boss level — both coordinated messages stacked. */
function BossScreen({ messages }) {
  const icon = { youtube: '▶', whatsapp: '💬', instagram: '📸', sms: '✉️' };
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12, paddingTop: 26, display: 'flex', flexDirection: 'column', gap: 12, background: '#0b141a' }}>
      {messages.map((m, i) => (
        <div key={i} className={`ss__app ss__app--${m.app}`}>
          <div className="ss__app-head"><span>{icon[m.app] || '✉️'}</span><span style={{ fontSize: 12 }}>{m.from}</span>{m.tag && <span className="ss__tag">{m.tag}</span>}</div>
          <div className="ss__app-body" style={{ fontSize: 12.5 }}>{m.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Boss level — phone + voiced setup + open text answer ── */
export function BossLevel({ data, onDone }) {
  useGameVoice(`${data.sub}. ${data.setup}`);
  const [text, setText] = useState('');
  const [graded, setGraded] = useState(false);
  const lc = text.toLowerCase();
  const groupsHit = data.keywords.filter((group) => group.some((k) => lc.includes(k))).length;
  const points = Math.round((groupsHit / data.keywords.length) * data.points);
  const pass = groupsHit >= data.keywords.length;

  return (
    <GameShell Icon={Crosshair} title={data.title} prompt={data.setup}>
      <PhoneShell screenClass="ssh__screen--scam"><BossScreen messages={data.messages} /></PhoneShell>
      <div className="ssh__thought" style={{ marginTop: 16 }}>
        <div className="ssh__thought-label">Internal thought</div>
        <div className="ssh__thought-text">{data.thought}</div>
      </div>
      {!graded ? (
        <>
          <div className="mg__task">
            <span className="mg__task-tag">🎯 Your task</span>
            {data.question}
          </div>
          <textarea className="ss__textarea" value={text} placeholder={data.placeholder} onChange={(e) => setText(e.target.value)} />
          <div className="mg__hint">Tip: name the <b>red flags</b> you see, and say <b>what you'd do</b> (don't click · verify the real channel · report).</div>
          <button className="ss__btn ss__btn--full" style={{ marginTop: 12 }} disabled={text.trim().length < 12} onClick={() => setGraded(true)}>Submit answer <ArrowRight size={18} /></button>
        </>
      ) : (
        <>
          <div className={`mg__result mg__result--${pass ? 'win' : 'fail'}`} style={{ marginTop: 14 }}>
            <h4>{pass ? <><CheckCircle2 size={18} /> Full marks — you nailed it</> : <>You caught {groupsHit} of {data.keywords.length} key ideas</>}</h4>
            <div className="mg__keys">
              {data.keywords.map((g, k) => {
                const hit = g.some((kw) => lc.includes(kw));
                return (
                  <div key={k} className={`mg__key ${hit ? 'is-hit' : ''}`}>
                    <span className="mg__key-ic">{hit ? <Check size={14} /> : <X size={14} />}</span>
                    {(data.keyLabels || [])[k] || `Key idea ${k + 1}`}
                  </div>
                );
              })}
            </div>
            <p style={{ margin: '4px 0 4px' }}><b>Model answer:</b></p>
            <p>{data.model}</p>
          </div>
          <button className="ss__btn ss__btn--full" onClick={() => onDone({ points, correct: groupsHit, total: data.keywords.length })}>See my scoreboard <ArrowRight size={18} /></button>
        </>
      )}
    </GameShell>
  );
}
