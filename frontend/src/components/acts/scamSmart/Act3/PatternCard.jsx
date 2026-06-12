/**
 * PatternCard — a detailed, gamified, illustrated walk-through of one scam
 * pattern (Act 3). Five interactive stages, each with its own visual:
 *   1) intro   — an illustrated "scene" for the scam + voiced tagline
 *   2) how     — the mechanism as an icon flow, revealed step by step
 *   3) flags   — red flags as tap-to-reveal icon cards
 *   4) example — the real-world example shown inside a mini phone
 *   5) do this — what-to-do checklist (voiced)
 */
import { useEffect, useState } from 'react';
import {
  ScanFace, Video, Brain, MousePointerClick, IndianRupee, Smartphone, KeyRound,
  MessageCircle, Hand, Lock, Gem, UserX, Link2, Ban, UserCheck, Calendar, Timer,
  ImageOff, AlertTriangle, Download, ShieldCheck, Volume2, ArrowRight, Check, Sparkles, ChevronRight,
} from 'lucide-react';
import { speak, cancelSpeech } from '../../../../utils/sounds.js';

const STEP_ICONS = {
  deepfake: [ScanFace, Video, Brain, MousePointerClick, IndianRupee],
  otp:      [Smartphone, KeyRound, MessageCircle, Hand, Lock],
  gaming:   [Gem, UserX, Link2, KeyRound, Ban],
};
const FLAG_ICONS = {
  deepfake: [UserCheck, Calendar, KeyRound, Timer, ImageOff],
  otp:      [KeyRound, AlertTriangle, Timer, MessageCircle, UserX],
  gaming:   [Gem, UserX, AlertTriangle, KeyRound, Download],
};
const fallback = [AlertTriangle, KeyRound, Timer, UserX, Ban];

function Hero({ id }) {
  if (id === 'deepfake') {
    return (
      <div className="pcard__scene">
        <div className="pcard__node"><ScanFace size={30} /><span>Real person</span></div>
        <ChevronRight className="pcard__node-arrow" />
        <div className="pcard__node is-fake"><ScanFace size={30} /><span>AI fake</span><em>AI</em></div>
        <ChevronRight className="pcard__node-arrow" />
        <div className="pcard__node is-bad"><IndianRupee size={30} /><span>You pay</span></div>
      </div>
    );
  }
  if (id === 'otp') {
    return (
      <div className="pcard__scene">
        <div className="pcard__node"><Smartphone size={30} /><span>Your phone</span></div>
        <ChevronRight className="pcard__node-arrow" />
        <div className="pcard__node is-fake"><KeyRound size={30} /><span>847291</span><em>OTP</em></div>
        <ChevronRight className="pcard__node-arrow" />
        <div className="pcard__node is-bad"><Hand size={30} /><span>Stolen</span></div>
      </div>
    );
  }
  return (
    <div className="pcard__scene">
      <div className="pcard__node"><Gem size={30} /><span>Free reward</span></div>
      <ChevronRight className="pcard__node-arrow" />
      <div className="pcard__node is-fake"><UserX size={30} /><span>"Admin"</span><em>FAKE</em></div>
      <ChevronRight className="pcard__node-arrow" />
      <div className="pcard__node is-bad"><Lock size={30} /><span>Account gone</span></div>
    </div>
  );
}

export default function PatternCard({ card, isLast, onNext }) {
  const [step, setStep] = useState('intro');
  const [howShown, setHowShown] = useState(1);
  const [revealed, setRevealed] = useState([]);
  const howSteps = card.how.split('→').map((s) => s.trim()).filter(Boolean);
  const stepIcons = STEP_ICONS[card.id] || fallback;
  const flagIcons = FLAG_ICONS[card.id] || fallback;

  useEffect(() => {
    setStep('intro'); setHowShown(1); setRevealed([]);
    try { speak(card.tagline, { who: 'narrator' }); } catch { /* noop */ }
    return () => { try { cancelSpeech(); } catch { /* noop */ } };
  }, [card]);

  const reveal = (i) => setRevealed((r) => (r.includes(i) ? r : [...r, i]));
  const allRevealed = revealed.length >= card.redFlags.length;
  const dots = ['intro', 'how', 'flags', 'example', 'dothis'];

  return (
    <div className="pcard">
      <div className="pcard__steps">
        {dots.map((d) => <span key={d} className={`pcard__dot ${d === step ? 'is-on' : ''}`} />)}
      </div>

      {step === 'intro' && (
        <div className="pcard__face ss__fade">
          <div className="pcard__icon">{card.icon}</div>
          <h3>{card.title}</h3>
          <p className="pcard__tag">“{card.tagline}”</p>
          <Hero id={card.id} />
          <button className="ss__btn" style={{ marginTop: 18 }} onClick={() => setStep('how')}>See how it works <ArrowRight size={18} /></button>
        </div>
      )}

      {step === 'how' && (
        <div className="ss__fade">
          <h4 className="pcard__h"><Brain size={15} /> How the trick works</h4>
          <div className="pcard__flow">
            {howSteps.slice(0, howShown).map((s, i) => {
              const Icon = stepIcons[i] || fallback[i % fallback.length];
              return (
                <div key={i} className="pcard__flowstep ss__fade">
                  <div className="pcard__flowicon"><Icon size={20} /></div>
                  <div><b>Step {i + 1}</b><br />{s}</div>
                </div>
              );
            })}
          </div>
          {howShown < howSteps.length
            ? <button className="ss__btn ss__btn--full" onClick={() => setHowShown((n) => n + 1)}>Next step <ArrowRight size={18} /></button>
            : <button className="ss__btn ss__btn--full" onClick={() => setStep('flags')}>Now spot the red flags <ArrowRight size={18} /></button>}
        </div>
      )}

      {step === 'flags' && (
        <div className="ss__fade">
          <h4 className="pcard__h"><AlertTriangle size={15} /> Tap each to reveal a red flag ({revealed.length}/{card.redFlags.length})</h4>
          <div className="pcard__flags">
            {card.redFlags.map((f, i) => {
              const Icon = flagIcons[i] || fallback[i % fallback.length];
              const on = revealed.includes(i);
              return (
                <button key={i} className={`pcard__flag ${on ? 'is-on' : ''}`} onClick={() => reveal(i)}>
                  <div className="pcard__flag-icon"><Icon size={22} /></div>
                  <div className="pcard__flag-text">{on ? f : 'Tap to reveal'}</div>
                </button>
              );
            })}
          </div>
          {allRevealed && (
            <button className="ss__btn ss__btn--full ss__fade" onClick={() => setStep('example')}>See a real example <ArrowRight size={18} /></button>
          )}
        </div>
      )}

      {step === 'example' && (
        <div className="ss__fade">
          <h4 className="pcard__h"><Smartphone size={15} /> Real example — spotted in the wild</h4>
          <div className="pcard__example">
            <div className="pcard__example-bar"><span className="pcard__example-dot" /> Suspicious · just now</div>
            <div className="pcard__example-body">{card.example}</div>
            <div className="pcard__example-warn"><Ban size={14} /> This is a scam pattern.</div>
          </div>
          <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={() => { try { speak(card.doThis.join('. '), { who: 'shanaya' }); } catch { /* noop */ } setStep('dothis'); }}>
            What you should do <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 'dothis' && (
        <div className="ss__fade">
          <h4 className="pcard__h">
            <ShieldCheck size={15} /> What you do
            <button className="pcard__voice" onClick={() => { try { speak(card.doThis.join('. '), { who: 'shanaya' }); } catch { /* noop */ } }} title="Hear this"><Volume2 size={14} /></button>
          </h4>
          <div className="pcard__dolist">
            {card.doThis.map((d, i) => (
              <div key={i} className="pcard__do"><div className="pcard__do-check"><Check size={15} /></div>{d}</div>
            ))}
          </div>
          <button className="ss__btn ss__btn--full" style={{ marginTop: 16 }} onClick={onNext}>
            {isLast ? <>One thing ties it all together <Sparkles size={17} /></> : <>Next pattern <ArrowRight size={18} /></>}
          </button>
        </div>
      )}
    </div>
  );
}
