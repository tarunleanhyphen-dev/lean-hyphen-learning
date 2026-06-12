/**
 * Scam Smart · Act 4 — the four timed mini-games + boss level.
 * Each game is self-contained: it renders, runs its own timer, grades the
 * learner, then calls onDone({ points, correct, total }). The orchestrator
 * (Act4.jsx) accumulates points and emits the analytics activity events.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { AppCard } from '../parts.jsx';
import PhoneShell from '../shell/PhoneShell.jsx';

/* Lightweight countdown. Calls onExpire() once when it hits 0. Pausable. */
function useCountdown(seconds, onExpire, deps = []) {
  const [left, setLeft] = useState(seconds);
  const expired = useRef(false);
  useEffect(() => {
    setLeft(seconds);
    expired.current = false;
    const id = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          if (!expired.current) { expired.current = true; onExpire?.(); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return left;
}

function TimerBar({ left, total }) {
  const pct = Math.max(0, (left / total) * 100);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: pct < 30 ? '#fca5a5' : 'rgba(255,255,255,.7)' }}>
        <Clock size={14} /> {left}s
      </div>
      <div className="ss__timer"><i className={pct < 30 ? 'is-low' : ''} style={{ width: `${pct}%` }} /></div>
    </>
  );
}

function Explain({ lines, single }) {
  if (single) return <div className="ss__outcome" style={{ marginTop: 12 }}><p>{single}</p></div>;
  return (
    <div className="ss__outcome" style={{ marginTop: 12 }}>
      <ul className="ss__do">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}

/* ── MG1 — Spot the fake link ─────────────────────────────── */
export function SpotLink({ data, onDone }) {
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const left = useCountdown(data.seconds, () => setDone(true), []);

  const choose = (opt) => {
    if (done) return;
    setPicked(opt.id);
    setDone(true);
  };
  const pickedReal = picked && data.options.find((o) => o.id === picked)?.real;
  const finish = () => onDone({ points: pickedReal ? data.points : 0, correct: pickedReal ? 1 : 0, total: 1 });

  return (
    <div>
      <h2 className="ss__h2">{data.title}</h2>
      <p className="ss__lead" style={{ margin: '8px 0' }}>{data.prompt}</p>
      {!done && <TimerBar left={left} total={data.seconds} />}
      <div className="ss__choices">
        {data.options.map((o) => {
          const cls = done ? (o.real ? 'is-win' : (picked === o.id ? 'is-fail' : '')) : '';
          return (
            <button key={o.id} className={`ss__choice ${cls}`} disabled={done} onClick={() => choose(o)}>
              <span className="ss__key">{o.id}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{o.url}</span>
            </button>
          );
        })}
      </div>
      {done && (
        <>
          <Explain lines={data.explain} />
          <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={finish}>
            Continue <ArrowRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

/* ── MG2 — Real or Scam? speed round ──────────────────────── */
export function SpeedRound({ data, onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [points, setPoints] = useState(0);
  const [correct, setCorrect] = useState(0);
  const resolved = useRef(false);   // guards each message against double-resolve
  const pointsRef = useRef(0);      // authoritative accumulators (no stale reads)
  const correctRef = useRef(0);
  const msg = data.messages[i];

  const advance = () => {
    if (i + 1 >= data.messages.length) {
      onDone({ points: Math.max(0, pointsRef.current), correct: correctRef.current, total: data.messages.length });
    } else {
      resolved.current = false;
      setI((n) => n + 1);
      setPicked(null);
    }
  };

  // A ref (not stale state) decides whether this message is already answered —
  // so the timer's onExpire can never double-fire after a late manual answer.
  const answer = (val) => {
    if (resolved.current) return;
    resolved.current = true;
    const right = val === msg.answer;
    setPicked(val ?? 'timeout');
    if (right) { pointsRef.current += data.correctPoints; correctRef.current += 1; }
    else if (val) { pointsRef.current += data.wrongPoints; }
    setPoints(Math.max(0, pointsRef.current));
    setCorrect(correctRef.current);
    setTimeout(advance, 1300);
  };
  const left = useCountdown(data.secondsEach, () => answer(null), [i]);

  return (
    <div>
      <h2 className="ss__h2">{data.title}</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <span className="ss__eyebrow">Message {i + 1} / {data.messages.length}</span>
        <span className="ss__points ss__points--up">★ {Math.max(0, points)}</span>
      </div>
      {!picked && <TimerBar left={left} total={data.secondsEach} />}
      <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <AppCard app="sms" header={{ channel: msg.from }}>
          <p>{msg.text}</p>
        </AppCard>
        <div className="ss__rs">
          <button className="ss__real" disabled={!!picked}
            style={picked && msg.answer === 'REAL' ? { outline: '2px solid #22c55e' } : (picked === 'REAL' ? { outline: '2px solid #ef4444' } : undefined)}
            onClick={() => answer('REAL')}>REAL</button>
          <button className="ss__scam" disabled={!!picked}
            style={picked && msg.answer === 'SCAM' ? { outline: '2px solid #22c55e' } : (picked === 'SCAM' ? { outline: '2px solid #ef4444' } : undefined)}
            onClick={() => answer('SCAM')}>SCAM</button>
        </div>
        {picked && (
          <div className={`ss__outcome ss__outcome--${picked === msg.answer ? 'win' : 'fail'}`} style={{ marginTop: 12 }}>
            <h4>{picked === msg.answer ? <><CheckCircle2 size={18} style={{ color: '#22c55e' }} /> Correct</> : <><XCircle size={18} style={{ color: '#ef4444' }} /> {msg.answer}</>}</h4>
            <p>{msg.explain}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── MG3 — What's wrong here? ─────────────────────────────── */
export function WhatsWrong({ data, onDone }) {
  const { email } = data;
  const [found, setFound] = useState([]);
  const [done, setDone] = useState(false);
  const left = useCountdown(data.seconds, () => setDone(true), []);

  const tap = (flag) => {
    if (done || found.includes(flag)) return;
    const next = [...found, flag];
    setFound(next);
    if (next.length >= data.flags.length) setDone(true);
  };
  const n = found.length;
  const points = n >= 4 ? 40 : n === 3 ? 25 : n === 2 ? 10 : 0;
  const finish = () => onDone({ points, correct: n, total: data.flags.length });

  const TapSpan = ({ flag, label, children }) => (
    <span className={`ss__tap ${found.includes(flag) ? 'is-found' : ''}`} title={done ? label : 'Tap if this looks wrong'} onClick={() => tap(flag)}>
      {children}
    </span>
  );

  return (
    <div>
      <h2 className="ss__h2">{data.title}</h2>
      <p className="ss__lead" style={{ margin: '8px 0' }}>{data.prompt} <b>({n}/{data.flags.length} found)</b></p>
      {!done && <TimerBar left={left} total={data.seconds} />}
      <div className="ss__email">
        <div className="ss__email-head">
          <div>FROM: <TapSpan flag={email.fromFlag.flag} label={email.fromFlag.label}>{email.from}</TapSpan></div>
          <div style={{ marginTop: 4, fontWeight: 700 }}>SUBJECT: {email.subject}</div>
        </div>
        <div className="ss__email-body">
          {email.lines.map((ln, idx) => (
            <p key={idx} style={{ margin: '0 0 8px' }}>
              {ln.flag ? <TapSpan flag={ln.flag} label={ln.label}>{ln.text}</TapSpan> : ln.text}
            </p>
          ))}
        </div>
      </div>
      {done && (
        <>
          <div className="ss__outcome" style={{ marginTop: 12 }}>
            <h4>You found {n} of {data.flags.length}</h4>
            <ul className="ss__redflags">
              {[email.fromFlag, ...email.lines.filter((l) => l.flag)].map((f, i) => (
                <li key={i} style={{ opacity: found.includes(f.flag) ? 1 : 0.6 }}>{f.label}</li>
              ))}
            </ul>
          </div>
          <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={finish}>Continue <ArrowRight size={18} /></button>
        </>
      )}
    </div>
  );
}

/* ── MG4 — Match the response ─────────────────────────────── */
export function MatchGame({ data, onDone }) {
  const [sel, setSel] = useState({});
  const [graded, setGraded] = useState(false);
  const allPicked = data.situations.every((s) => sel[s.id]);
  const correct = data.situations.filter((s) => sel[s.id] === data.answer[s.id]).length;
  const points = correct >= 5 ? 50 : correct === 4 ? 35 : correct === 3 ? 20 : 0;

  return (
    <div>
      <h2 className="ss__h2">{data.title}</h2>
      <p className="ss__lead" style={{ margin: '8px 0' }}>{data.prompt}</p>

      <div className="ss__match">
        {data.situations.map((s) => {
          const right = sel[s.id] === data.answer[s.id];
          const cls = graded ? (right ? 'is-win' : 'is-fail') : '';
          return (
            <div key={s.id} className={`ss__match-row ${cls}`}>
              <span>{s.text}</span>
              <select className="ss__select" value={sel[s.id] || ''} disabled={graded}
                onChange={(e) => setSel((m) => ({ ...m, [s.id]: e.target.value }))}>
                <option value="" disabled>—</option>
                {data.responses.map((r) => <option key={r.id} value={r.id}>{r.id}</option>)}
              </select>
            </div>
          );
        })}
      </div>

      <div className="ss__card" style={{ marginTop: 14, padding: 14 }}>
        <h5 className="ss__eyebrow" style={{ marginBottom: 8 }}>The responses</h5>
        {data.responses.map((r) => (
          <p key={r.id} style={{ fontSize: 13, margin: '0 0 6px' }}><b>{r.id}.</b> {r.text}</p>
        ))}
      </div>

      {!graded
        ? <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} disabled={!allPicked} onClick={() => setGraded(true)}>Check my matches <ArrowRight size={18} /></button>
        : (
          <>
            <div className="ss__outcome" style={{ marginTop: 12 }}><h4>{correct} / {data.situations.length} correct</h4></div>
            <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={() => onDone({ points, correct, total: data.situations.length })}>Continue <ArrowRight size={18} /></button>
          </>
        )}
    </div>
  );
}

/* Phone screen for the boss level — both coordinated messages stacked. */
function BossScreen({ messages }) {
  const icon = { youtube: '▶', whatsapp: '💬', instagram: '📸', sms: '✉️' };
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12, paddingTop: 26, display: 'flex', flexDirection: 'column', gap: 12, background: '#0b141a' }}>
      {messages.map((m, i) => (
        <div key={i} className={`ss__app ss__app--${m.app}`}>
          <div className="ss__app-head">
            <span>{icon[m.app] || '✉️'}</span>
            <span style={{ fontSize: 12 }}>{m.from}</span>
            {m.tag && <span className="ss__tag">{m.tag}</span>}
          </div>
          <div className="ss__app-body" style={{ fontSize: 12.5 }}>{m.text}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Boss level — split-screen phone + narrator, open text answer ── */
export function BossLevel({ data, onDone }) {
  const [text, setText] = useState('');
  const [graded, setGraded] = useState(false);

  const lc = text.toLowerCase();
  const groupsHit = data.keywords.filter((group) => group.some((k) => lc.includes(k))).length;
  const points = Math.round((groupsHit / data.keywords.length) * data.points);
  const pass = groupsHit >= data.keywords.length;

  return (
    <div>
      <h2 className="ss__h2" style={{ marginBottom: 4 }}>{data.title}</h2>
      <p className="ss__lead" style={{ marginBottom: 14 }}>{data.sub}</p>
      <p className="ssh__help" style={{ marginBottom: 14 }}>{data.setup}</p>

      <PhoneShell screenClass="ssh__screen--scam"><BossScreen messages={data.messages} /></PhoneShell>

      <div>
        <div className="ssh__thought" style={{ marginTop: 16 }}>
          <div className="ssh__thought-label">Internal thought</div>
          <div className="ssh__thought-text">{data.thought}</div>
        </div>

        {!graded ? (
            <>
              <label className="ss__eyebrow" style={{ display: 'block', marginBottom: 8 }}>{data.question}</label>
              <textarea className="ss__textarea" value={text} placeholder={data.placeholder} onChange={(e) => setText(e.target.value)} />
              <button className="ss__btn ss__btn--full" style={{ marginTop: 12 }} disabled={text.trim().length < 12} onClick={() => setGraded(true)}>Submit answer <ArrowRight size={18} /></button>
            </>
          ) : (
            <>
              <div className={`ss__outcome ss__outcome--${pass ? 'win' : 'fail'}`} style={{ marginTop: 8 }}>
                <h4>{pass ? <><CheckCircle2 size={18} style={{ color: '#22c55e' }} /> Full marks</> : <>You caught {groupsHit} of {data.keywords.length} key ideas</>}</h4>
                <p style={{ margin: '8px 0 4px' }}><b>Model answer:</b></p>
                <p>{data.model}</p>
              </div>
              <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={() => onDone({ points, correct: groupsHit, total: data.keywords.length })}>See my scoreboard <ArrowRight size={18} /></button>
            </>
          )}
      </div>
    </div>
  );
}
