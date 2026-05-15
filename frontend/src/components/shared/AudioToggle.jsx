import { Volume2, VolumeX } from 'lucide-react';
import { useLesson } from '../../context/LessonContext.jsx';

export default function AudioToggle() {
  const { audioEnabled, setAudioEnabled } = useLesson();
  return (
    <button
      type="button"
      onClick={() => setAudioEnabled(!audioEnabled)}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
    >
      {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      {audioEnabled ? 'Audio on' : 'Text only'}
    </button>
  );
}
