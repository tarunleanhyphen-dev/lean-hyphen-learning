import { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';

/**
 * LottieAvatar — renders a designer-made Lottie character animation.
 *
 * Lottie is what Duolingo, Headspace, Notion etc. use for their
 * smooth professional 2D characters. The animations are made in
 * Adobe After Effects and exported as JSON via the Bodymovin plugin.
 *
 * Two ways to feed an animation in:
 *   1. Drop a downloaded .json file under `frontend/public/lottie/`
 *      and pass `src="/lottie/ritwik-idle.json"` — Lottie fetches it.
 *   2. Import the JSON directly: `import data from './ritwik.json'`
 *      and pass `data={data}`.
 *
 * The component supports:
 *   - Playing a specific clip via segment markers (Lottie clip names)
 *   - Switching clip on `state` prop change ('idle' / 'talk' / 'wave')
 *   - Loop control
 *
 * Source free Lottie characters at: https://lottiefiles.com
 *   - Search "indian boy talking" / "mother character" / "kid animation"
 *   - Most are free; download as .json and drop into public/lottie/
 */

export default function LottieAvatar({
  src,
  data,
  state = 'idle',        // 'idle' | 'talk' | 'wave' — for files with named segments
  speaking = false,
  loop = true,
  className = '',
  speed = 1,
}) {
  const [animationData, setAnimationData] = useState(data || null);
  const lottieRef = useRef(null);

  // Fetch JSON if `src` is supplied
  useEffect(() => {
    if (data) { setAnimationData(data); return undefined; }
    if (!src) return undefined;
    let cancelled = false;
    fetch(src)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setAnimationData(json); })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[lottie] failed to load', src, err);
      });
    return () => { cancelled = true; };
  }, [src, data]);

  // Sync playback speed (talking can be a touch faster)
  useEffect(() => {
    if (!lottieRef.current) return;
    lottieRef.current.setSpeed(speaking ? speed * 1.1 : speed);
  }, [speaking, speed]);

  // If the animation has named segments, swap to the right one.
  // RPM-style talking animations usually expose markers; if no
  // markers, the same clip just plays in a loop.
  useEffect(() => {
    if (!lottieRef.current || !animationData) return;
    const markers = animationData.markers || [];
    const match = markers.find((m) => m.cm?.toLowerCase().includes(state));
    if (match) {
      lottieRef.current.playSegments([match.tm, match.tm + match.dr], true);
    }
  }, [state, animationData]);

  if (!animationData) {
    return (
      <div className={`flex items-center justify-center text-white/40 text-xs ${className}`}>
        Loading character…
      </div>
    );
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay
      className={className}
      rendererSettings={{ preserveAspectRatio: 'xMidYMax meet' }}
    />
  );
}
