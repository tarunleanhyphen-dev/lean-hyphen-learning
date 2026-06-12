/**
 * WhatsAppMsgScreen — Act 2 scenario 4. The phone HOME screen with apps; a
 * WhatsApp notification slides in from the top with a beep ("tap to open").
 * Tapping it opens the WhatsApp chat where the learner reads the full message
 * from the unknown number pretending to be a friend.
 */
import { useEffect, useState } from 'react';
import { ChevronLeft, Video, Phone, Smile, Paperclip, Camera, Mic } from 'lucide-react';
import { sounds } from '../../../../utils/sounds.js';
import PhoneHome from './PhoneHome.jsx';

function Chat({ scenario, onBack }) {
  const who = scenario.header?.channel || 'Unknown';
  return (
    <div className="wachat">
      <div className="wachat__head">
        <button className="wachat__back" onClick={onBack}><ChevronLeft size={24} /></button>
        <span className="wachat__av">👤</span>
        <div className="wachat__who"><b>{who}</b><small>tap here for contact info</small></div>
        <div className="wachat__icons"><Video size={19} /><Phone size={18} /></div>
      </div>
      <div className="wachat__body">
        <div className="wachat__date">TODAY</div>
        <div className="wachat__sys">⚠️ This number is not saved in your contacts.</div>
        <div className="wachat__msg">{scenario.body?.caption}<span className="wachat__time">11:47 PM</span></div>
      </div>
      <div className="wachat__input">
        <Smile size={20} /><span className="wachat__ph">Message</span><Paperclip size={19} /><Camera size={19} />
        <span className="wachat__mic"><Mic size={18} /></span>
      </div>
    </div>
  );
}

export default function WhatsAppMsgScreen({ scenario }) {
  const [notif, setNotif] = useState(false);
  const [chat, setChat] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setNotif(true); try { sounds.ding(); } catch { /* noop */ } }, 800);
    return () => clearTimeout(t);
  }, []);

  if (chat) return <Chat scenario={scenario} onBack={() => setChat(false)} />;

  return (
    <div className="home-wrap">
      <PhoneHome />
      <div className="home__notifs">
        {notif && (
          <button className="home__notif home__notif--btn" onClick={() => setChat(true)}>
            <div className="home__notif-icon" style={{ background: '#25d366' }}>💬</div>
            <div className="home__notif-body">
              <div className="home__notif-top"><b>WhatsApp</b><span>now</span></div>
              <div className="home__notif-text"><b>{scenario.header?.channel}</b><br />{scenario.body?.caption}</div>
              <div className="home__notif-tap">Tap to open ›</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
