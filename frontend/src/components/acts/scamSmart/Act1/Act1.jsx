/**
 * Scam Smart · Act 1 — The Hook.
 * Netlify "Spot the Scam" layout: left act-sidebar + a content column. A
 * start gate (a real gesture, so audio unlocks) → the WhatsApp group chat
 * plays INSIDE an iPhone → a bridge line (voice-narrated) → "Move to Act 2".
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Volume2, VolumeX, Play } from 'lucide-react';
import { act1Hook } from '../../../../data/lessons/scamSmart.js';
import { useL3Analytics } from '../useL3Analytics.js';
import Sidebar from '../shell/Sidebar.jsx';
import BgFx3D from '../shell/BgFx3D.jsx';
import PhoneShell from '../shell/PhoneShell.jsx';
import WhatsAppChat from './WhatsAppChat.jsx';
import OpeningBeat from './OpeningBeat.jsx';
import { unlockAudio, setMusicMood, stopMusic, speak, cancelSpeech } from '../../../../utils/sounds.js';
import { musicEnabled } from '../shell/useSoftMusic.js';
import '../scamSmart.css';

// Birthday-wish history (instant, scrollable) + the midnight scam story (typed).
const ACT1_CHAT = { group: act1Hook.group, messages: [...act1Hook.history, ...act1Hook.messages] };
const ACT1_INSTANT = act1Hook.history.length;

export default function ScamSmartAct1({ onComplete, onGoHome }) {
  const analytics = useL3Analytics('act1', { bumpAttempt: true });
  const navigate = useNavigate();
  const location = useLocation();
  const startedAt = useRef(Date.now());
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [screen, setScreen] = useState('opening'); // opening | chat | bridge
  const [chatDone, setChatDone] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('play')) {
      setStarted(true); analytics.lessonStarted(); analytics.actStarted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => { try { cancelSpeech(); } catch { /* noop */ } }, []);

  // Deep-link via the sidebar's SHOW SCENES (?scene=0 chat · 1 hook).
  useEffect(() => {
    const sc = new URLSearchParams(location.search).get('scene');
    if (sc === null) return;
    setStarted(true);
    if (Number(sc) >= 1) { setScreen('bridge'); setChatDone(true); } else { setScreen('chat'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (!started) return undefined;
    const id = screen === 'chat' ? 'sc-chat' : screen === 'bridge' ? 'sc-teaser' : null;
    if (!id) return undefined; // 'opening' is a pre-chat cinematic — not a scored scene
    analytics.sceneEntered(id);
    return () => analytics.sceneCompleted(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, screen]);

  const handleStart = async () => {
    try { await unlockAudio(true); } catch { /* noop */ }       // unlock also starts soft music
    try { if (musicEnabled()) setMusicMood('calm'); else stopMusic(); } catch { /* noop */ }
    setStarted(true);
    analytics.lessonStarted();
    analytics.actStarted();
  };
  const toggleSound = async () => {
    if (!soundOn) { try { await unlockAudio(true); if (musicEnabled()) setMusicMood('calm'); else stopMusic(); } catch { /* noop */ } }
    setSoundOn((v) => !v);
  };

  // When the chat finishes: make sure audio is unlocked, narrate the bridge
  // line aloud, and only then enable the Continue button.
  useEffect(() => {
    if (!chatDone) return undefined;
    let cancelled = false;
    (async () => {
      try { await unlockAudio(true); setMusicMood('calm'); } catch { /* noop */ }
      if (soundOn && !cancelled) { try { speak(act1Hook.bridge[0], { who: 'narrator' }); } catch { /* noop */ } }
    })();
    const t = setTimeout(() => { if (!cancelled) setCanContinue(true); }, 1800);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatDone]);

  const replayVoice = () => { try { cancelSpeech(); speak(act1Hook.bridge[0], { who: 'narrator' }); } catch { /* noop */ } };

  const goBridge = () => {
    try { cancelSpeech(); } catch { /* noop */ }
    setScreen('bridge');
    window.scrollTo({ top: 0 });
  };
  const finish = () => {
    try { cancelSpeech(); } catch { /* noop */ }
    analytics.actCompleted({ timeMs: Date.now() - startedAt.current });
    analytics.flush?.();
    onComplete?.();
  };

  return (
    <div className="ssh">
      <BgFx3D />
      <Sidebar
        current="act1"
        onHome={() => navigate('/lesson3')}
        onNavigate={(actId) => navigate(`/lesson3/${actId}`)}
        onNavigateScene={(actId, idx) => navigate(`/lesson3/${actId}?scene=${idx}`)}
      />

      <main className="ssh__main">
        <div className="ssh__col">
          <div className="ssh__eyebrow">Act 1 — The Hook</div>
          <div className="ssh__scenetitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {screen === 'chat' ? 'Squad Goals · 11:47 PM' : 'It comes for you next'}
            {started && (
              <button className="ss__iconbtn" style={{ marginLeft: 'auto', height: 34, width: 34 }} onClick={toggleSound} title={soundOn ? 'Mute' : 'Unmute'}>
                {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            )}
          </div>

          {/* Start gate */}
          <AnimatePresence>
            {!started && (
              <motion.div key="gate" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ssh__gate">
                <Play size={40} style={{ color: '#34d399' }} />
                <h2 className="ss__h2" style={{ marginTop: 8 }}>A midnight message just landed.</h2>
                <p className="ssh__help" style={{ maxWidth: 420 }}>You're in the Squad Goals group chat. Read what happened to Rohan — best with sound on.</p>
                <button className="ss__btn" style={{ marginTop: 16 }} onClick={handleStart}><Play size={16} /> Open the chat</button>
              </motion.div>
            )}
          </AnimatePresence>

          {started && screen === 'opening' && (
            <OpeningBeat soundOn={soundOn} onDone={() => { setScreen('chat'); window.scrollTo({ top: 0 }); }} />
          )}

          {started && screen === 'chat' && (
            <>
              <PhoneShell screenClass="ssh__screen--chat">
                <WhatsAppChat chat={ACT1_CHAT} soundOn={soundOn} instantCount={ACT1_INSTANT} onDone={() => setChatDone(true)} />
              </PhoneShell>
              {chatDone && (
                <div className="ssh__gate ss__fade" style={{ marginTop: 18, textAlign: 'left', alignItems: 'stretch' }}>
                  <button className="ss__btn ss__btn--ghost" style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: 13 }} onClick={replayVoice}>
                    <Volume2 size={14} /> Play voice again
                  </button>
                  {act1Hook.bridge.map((t, i) => (
                    <p key={i} style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)', fontWeight: 500, marginTop: 10 }}>{t}</p>
                  ))}
                  <button className="ss__btn ss__btn--full" style={{ marginTop: 14 }} onClick={goBridge} disabled={!canContinue}>
                    {canContinue ? 'Continue' : 'Listen…'} <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}

          {started && screen === 'bridge' && (
            <motion.div key="bridge" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="ssh__gate">
              <div style={{ fontSize: 46 }}>🛡️</div>
              <h2 className="ss__h2" style={{ marginTop: 6 }}>{act1Hook.teaser.line}</h2>
              <button className="ss__btn" style={{ marginTop: 18, fontSize: 16, padding: '15px 30px' }} onClick={finish}>Move to Act 2 <ArrowRight size={18} /></button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
