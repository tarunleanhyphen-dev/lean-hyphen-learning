import { Suspense, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import Character3D from './Character3D.jsx';

/**
 * Wraps a <Canvas> with stage lighting + characters + a 3D camera that
 * gently dollies toward whoever is speaking. Speech bubbles render as
 * HTML overlays anchored to each character's head position, with a CSS
 * tail that points DOWN at the speaker.
 *
 * Props:
 *   scenePhase   'home' | 'glitch' | 'transform' | 'digital'
 *   speaker      'ritwik' | 'mom' | 'system' | 'narrator' | null
 *   speaking     bool — drives mouth animation
 *   amplitudeRef ref → 0..1 amplitude from sounds.js
 *   bubbles      [{ speaker, text }] — currently visible thought/speech bubbles
 *   emotion      string — passed to active speaker's character
 */

// Character world positions per scenePhase. Y=0 = ground plane.
const LAYOUTS = {
  home: {
    ritwik:   { position: [-1.1, 0, 0], facing:  0.18 },
    mom:      { position: [ 1.2, 0, 0], facing: -0.22 },
  },
  glitch: {
    ritwik:   { position: [-0.8, 0, 0], facing:  0.2 },
  },
  transform: {
    ritwik:   { position: [ 0,   0, 0], facing: 0, scale: 1.1 },
  },
  digital: {
    ritwik:   { position: [-1.1, 0, 0], facing:  0.2 },
    system:   { position: [ 1.4, 0, -0.3], facing: -0.3, scale: 1.2 },
  },
};

const PHASE_BG = {
  home:      { from: '#3B2D4B', to: '#1A1A36', envIntensity: 0.4 },
  glitch:    { from: '#2D1B47', to: '#1A0F3A', envIntensity: 0.5 },
  transform: { from: '#1A1240', to: '#0B1739', envIntensity: 0.9 },
  digital:   { from: '#06091F', to: '#1A1240', envIntensity: 1.1 },
};

export default function Scene3D({
  scenePhase = 'home',
  speaker,
  speaking,
  amplitudeRef,
  emotion = 'neutral',
  bubbles = [],
}) {
  const layout = LAYOUTS[scenePhase] || LAYOUTS.home;
  const bg = PHASE_BG[scenePhase] || PHASE_BG.home;
  const characters = Object.keys(layout);

  // Each character's head world position is mirrored here so the HTML
  // bubble system knows where to anchor.
  const heads = useMemo(() => {
    const map = {};
    characters.forEach((c) => { map[c] = { current: null }; });
    return map;
  }, [scenePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${bg.from}, ${bg.to})` }}
      />
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 4.2], fov: 38 }}
        className="!h-full !w-full"
      >
        <color attach="background" args={[bg.from]} />
        <fog attach="fog" args={[bg.to, 6, 14]} />

        <Suspense fallback={null}>
          <Stage scenePhase={scenePhase} />

          {/* Soft ambient + key + fill lights */}
          <ambientLight intensity={bg.envIntensity} />
          <directionalLight
            position={[2.5, 4, 3]}
            intensity={1.1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.1}
            shadow-camera-far={20}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
          />
          <pointLight position={[-3, 2, 2]} intensity={0.6} color={scenePhase === 'digital' || scenePhase === 'transform' ? '#22D3EE' : '#FFE4B5'} />
          <pointLight position={[3, 1.5, -2]} intensity={0.5} color={scenePhase === 'digital' ? '#A78BFA' : '#F472B6'} />

          {/* Ground shadow */}
          <ContactShadows position={[0, -0.001, 0]} opacity={0.35} scale={8} blur={2.4} far={4} />

          {/* Characters — each one's pupils look at the active speaker
             (unless they ARE the speaker, in which case they look at
             whoever else is in the scene). */}
          {characters.map((who) => {
            const isSpeaker = speaker === who;
            // Find a different character to look at
            const others = characters.filter((c) => c !== who);
            const lookTarget = isSpeaker
              ? (others[0] ? layout[others[0]].position : null)
              : (speaker && layout[speaker] ? layout[speaker].position : null);
            return (
              <Float
                key={who}
                speed={1.2}
                rotationIntensity={0.04}
                floatIntensity={who === 'system' ? 0.6 : 0.12}
              >
                <Character3D
                  who={who}
                  position={layout[who].position}
                  facing={layout[who].facing}
                  scale={layout[who].scale ?? 1}
                  speaking={speaking && isSpeaker}
                  amplitudeRef={amplitudeRef}
                  emotion={isSpeaker ? emotion : 'neutral'}
                  headRef={heads[who]}
                  lookAt={lookTarget}
                />
              </Float>
            );
          })}

          {/* Camera dolly toward the speaker */}
          <CameraDolly speaker={speaker} layout={layout} />

          {/* Bubbles anchored to character heads */}
          {bubbles.map((b, i) => {
            const target = heads[b.speaker];
            if (!target) return null;
            return (
              <HeadAnchor key={`${b.speaker}-${b.text}-${i}`} headRef={target}>
                <PointerBubble text={b.text} variant={b.speaker === 'system' ? 'system' : b.type === 'thought' ? 'thought' : 'speech'} />
              </HeadAnchor>
            );
          })}
        </Suspense>
      </Canvas>

      {/* Scanlines / overlay treatments per scene */}
      {scenePhase === 'glitch' && <GlitchOverlay />}
      {(scenePhase === 'digital' || scenePhase === 'transform') && <CyberOverlay />}
    </div>
  );
}

/* Per-scene environment props (floor pattern, cyber grid, etc.) */
function Stage({ scenePhase }) {
  if (scenePhase === 'home') {
    return (
      <>
        {/* Wooden-toned floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#6A4830" roughness={0.85} />
        </mesh>
        {/* Sofa hint behind characters */}
        <mesh position={[-1.2, 0.4, -1.5]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.8, 0.8]} />
          <meshStandardMaterial color="#4A6B82" roughness={0.6} />
        </mesh>
        <mesh position={[-1.2, 0.85, -1.85]} castShadow>
          <boxGeometry args={[2.4, 0.5, 0.18]} />
          <meshStandardMaterial color="#3A5366" roughness={0.6} />
        </mesh>
        {/* Lamp */}
        <mesh position={[2.5, 1.5, -1.2]} castShadow>
          <coneGeometry args={[0.28, 0.42, 16]} />
          <meshStandardMaterial color="#E8B96A" emissive="#FFE08A" emissiveIntensity={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[2.5, 0.8, -1.2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
          <meshStandardMaterial color="#8B6B43" />
        </mesh>
      </>
    );
  }
  if (scenePhase === 'glitch') {
    return (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#2A1A40" roughness={0.7} emissive="#1A0F3A" emissiveIntensity={0.2} />
        </mesh>
      </>
    );
  }
  // digital / transform — cyber grid floor
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0B1024" roughness={0.4} metalness={0.5} emissive="#001020" emissiveIntensity={0.4} />
      </mesh>
      {/* Glowing grid */}
      <gridHelper args={[20, 20, '#22D3EE', '#1E3A8A']} position={[0, 0.001, 0]} />
    </>
  );
}

/* Camera dolly — interpolates camera target/position toward the active
 * speaker. Subtle (offsets of ~0.4 units) so it never disorients. */
function CameraDolly({ speaker, layout }) {
  const { camera } = useThree();
  const targetVec = useRef(new THREE.Vector3(0, 0.9, 0));
  const desiredPos = useRef(new THREE.Vector3(0, 1.2, 4.2));

  useFrame(() => {
    if (speaker && layout[speaker]) {
      const [x] = layout[speaker].position;
      targetVec.current.set(x, 0.95, 0);
      desiredPos.current.set(x * 0.35, 1.2, 4.0);
    } else {
      targetVec.current.set(0, 0.95, 0);
      desiredPos.current.set(0, 1.2, 4.2);
    }
    camera.position.lerp(desiredPos.current, 0.045);
    camera.lookAt(targetVec.current);
  });

  return null;
}

/* HeadAnchor — places its HTML child at the world-space head position. */
function HeadAnchor({ headRef, children }) {
  const [pos, setPos] = useState(() => new THREE.Vector3(0, 1.5, 0));
  useFrame(() => {
    if (headRef.current) setPos(new THREE.Vector3().copy(headRef.current));
  });
  return (
    <Html position={[pos.x, pos.y + 0.95, pos.z]} center distanceFactor={5.2} zIndexRange={[60, 0]}>
      {children}
    </Html>
  );
}

/* PointerBubble — rendered inside <Html>. Has a CSS triangle pointing
 * DOWN at the character below. */
function PointerBubble({ text, variant = 'speech' }) {
  const palette = variant === 'system'
    ? { bg: 'bg-cyan-300 text-cyan-950 ring-cyan-400/50', tail: 'border-t-cyan-300', icon: '⚡' }
    : variant === 'thought'
      ? { bg: 'bg-white text-ink-900 ring-ink-300/30', tail: 'border-t-white', icon: '💭' }
      : { bg: 'bg-amber-300 text-amber-950 ring-amber-400/40', tail: 'border-t-amber-300', icon: '💬' };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pointer-events-none relative"
      style={{ width: 'max-content' }}
    >
      <div
        className={`relative max-w-[16rem] rounded-2xl px-4 py-2.5 text-[13px] font-semibold leading-snug ring-1 shadow-xl sm:max-w-[20rem] sm:text-sm ${palette.bg}`}
      >
        <span className="mr-1 opacity-70">{palette.icon}</span>
        {text}
      </div>
      {/* downward tail */}
      <div
        className={`absolute left-1/2 -bottom-2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent ${palette.tail}`}
      />
    </motion.div>
  );
}

/* Subtle overlays */
function GlitchOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-0 opacity-30"
           style={{
             backgroundImage:
               'repeating-linear-gradient(0deg, rgba(244,114,182,0.15) 0 2px, transparent 2px 6px)',
           }} />
      <motion.div
        className="absolute inset-0 bg-fuchsia-500/10 mix-blend-screen"
        animate={{ x: [-3, 3, -3] }}
        transition={{ duration: 0.18, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 bg-cyan-400/10 mix-blend-screen"
        animate={{ x: [3, -3, 3] }}
        transition={{ duration: 0.18, repeat: Infinity }}
      />
    </div>
  );
}

function CyberOverlay() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-0"
           style={{
             backgroundImage:
               'radial-gradient(circle at 50% 30%, rgba(34,211,238,0.18) 0%, transparent 60%)',
           }} />
      <div className="absolute inset-0 opacity-20"
           style={{
             backgroundImage:
               'repeating-linear-gradient(0deg, rgba(34,211,238,0.25) 0 1px, transparent 1px 4px)',
           }} />
    </div>
  );
}

/* Helper exports — used by parent to wire empty bubbles to characters */
export const SCENE_LAYOUTS = LAYOUTS;
