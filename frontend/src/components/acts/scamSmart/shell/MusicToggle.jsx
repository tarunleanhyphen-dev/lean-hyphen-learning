/**
 * MusicToggle — a small icon button (shown in every act's sidebar) that
 * stops/starts the soft background music. The choice persists across acts via
 * the shared music preference, so "stop" actually stays stopped.
 */
import { useState } from 'react';
import { Music, VolumeX } from 'lucide-react';
import { stopMusic, unlockAudio, setMusicMood } from '../../../../utils/sounds.js';
import { musicEnabled, setMusicEnabled } from './useSoftMusic.js';

export default function MusicToggle() {
  const [on, setOn] = useState(musicEnabled);
  const toggle = async () => {
    if (on) {
      setMusicEnabled(false);
      try { stopMusic(); } catch { /* noop */ }
      setOn(false);
    } else {
      setMusicEnabled(true);
      try { await unlockAudio(true); setMusicMood('calm'); } catch { /* noop */ }
      setOn(true);
    }
  };
  return (
    <button className="ssh__music" onClick={toggle} title={on ? 'Stop background music' : 'Play background music'} aria-label="Toggle music">
      {on ? <Music size={15} /> : <VolumeX size={15} />}
    </button>
  );
}
