/**
 * CricketerScene3D — a stylized, AI-generated-looking cricketer for the fake
 * "giveaway" video in Act 2, Scenario 1.
 *
 * IMPORTANT: this is a GENERIC, non-photoreal figure — NOT a likeness of any
 * real person. The whole teaching point is that scam "celebrity" videos are
 * synthetic, so a deliberately stylized avatar + a robotic TTS voice is the
 * honest, safe way to show it. A low-poly batsman in an India-blue kit stands
 * in a batting stance on a slowly-rotating cricket ground (pitch, boundary
 * rope, stands, floodlights, sightscreen, drifting clouds).
 *
 * Contained to the player area; WebGL-guarded with a CSS fallback.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

const JERSEY = '#1565d8';
const JERSEY_DK = '#0c3f93';
const SKIN = '#d9a06b';
const PAD = '#f4f4ef';

function Batsman() {
  const g = useRef();
  const bat = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (g.current) {
      g.current.position.y = -0.1 + Math.sin(t * 1.6) * 0.03;   // subtle ready bob
      g.current.rotation.y = -0.35 + Math.sin(t * 0.7) * 0.06;  // angled batting stance, slight sway
    }
    if (bat.current) bat.current.rotation.x = 0.2 + Math.sin(t * 1.1) * 0.12; // bat tap
  });
  return (
    <group ref={g} position={[0, -0.1, 0]} rotation={[0, -0.35, 0]}>
      {/* head + helmet + grille */}
      <mesh position={[0, 1.42, 0]}><sphereGeometry args={[0.19, 24, 24]} /><meshStandardMaterial color={SKIN} roughness={0.6} /></mesh>
      <mesh position={[0, 1.5, 0]}><sphereGeometry args={[0.215, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} /><meshStandardMaterial color={JERSEY_DK} roughness={0.45} /></mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.12, 1.4 - i * 0.06, 0.05]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.22, 8]} /><meshStandardMaterial color="#cfd6dd" metalness={0.4} /></mesh>
      ))}
      {/* torso (slight forward lean) */}
      <group rotation={[0.18, 0, 0]}>
        <mesh position={[0, 0.92, 0]}><boxGeometry args={[0.56, 0.78, 0.3]} /><meshStandardMaterial color={JERSEY} roughness={0.5} /></mesh>
        <mesh position={[0, 0.92, 0.16]}><boxGeometry args={[0.1, 0.78, 0.02]} /><meshStandardMaterial color="#ff9e1b" /></mesh>{/* accent stripe */}
        <mesh position={[0, 1.15, 0.16]}><boxGeometry args={[0.24, 0.16, 0.02]} /><meshStandardMaterial color="#ffd24a" emissive="#ffae00" emissiveIntensity={0.15} /></mesh>{/* badge */}
      </group>
      {/* arms forward to the bat + white gloves */}
      <mesh position={[-0.26, 0.95, 0.28]} rotation={[1.1, 0, 0.3]}><cylinderGeometry args={[0.08, 0.08, 0.55, 12]} /><meshStandardMaterial color={JERSEY} /></mesh>
      <mesh position={[0.26, 0.95, 0.28]} rotation={[1.1, 0, -0.3]}><cylinderGeometry args={[0.08, 0.08, 0.55, 12]} /><meshStandardMaterial color={JERSEY} /></mesh>
      <mesh position={[0, 0.74, 0.5]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={PAD} roughness={0.7} /></mesh>{/* gloves */}
      {/* legs apart + batting pads */}
      <mesh position={[-0.18, 0.18, 0.04]} rotation={[0, 0, 0.08]}><boxGeometry args={[0.2, 0.72, 0.24]} /><meshStandardMaterial color={PAD} roughness={0.8} /></mesh>
      <mesh position={[0.2, 0.18, -0.06]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.2, 0.72, 0.24]} /><meshStandardMaterial color={PAD} roughness={0.8} /></mesh>
      <mesh position={[-0.18, -0.18, 0.12]}><boxGeometry args={[0.22, 0.12, 0.32]} /><meshStandardMaterial color="#101418" /></mesh>{/* shoes */}
      <mesh position={[0.2, -0.18, 0.0]}><boxGeometry args={[0.22, 0.12, 0.32]} /><meshStandardMaterial color="#101418" /></mesh>
      {/* bat held in front, ready */}
      <group ref={bat} position={[0, 0.7, 0.52]} rotation={[0.2, 0, 0]}>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.04, 0.04, 0.34, 10]} /><meshStandardMaterial color="#6b4a2b" /></mesh>
        <mesh position={[0, -0.32, 0.02]}><boxGeometry args={[0.16, 0.66, 0.07]} /><meshStandardMaterial color="#caa15a" roughness={0.6} /></mesh>
      </group>
    </group>
  );
}

function Floodlight({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.05, 0.07, 3.2, 8]} /><meshStandardMaterial color="#9aa6b2" /></mesh>
      <mesh position={[0, 3.3, 0]}><boxGeometry args={[0.7, 0.4, 0.12]} /><meshStandardMaterial color="#fffbe6" emissive="#fff2b0" emissiveIntensity={1.4} /></mesh>
    </group>
  );
}

function Ground() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = clock.getElapsedTime() * 0.06; // ground slowly turns
  });
  return (
    <group ref={g} position={[0, -0.6, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[6.5, 56]} /><meshStandardMaterial color="#2f9140" roughness={1} /></mesh>
      {/* mow stripes */}
      {[-3, -1.5, 1.5, 3].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, 0]}><planeGeometry args={[1.4, 11]} /><meshStandardMaterial color="#36a049" transparent opacity={0.5} /></mesh>
      ))}
      {/* boundary rope */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[5.7, 5.85, 56]} /><meshStandardMaterial color="#f4f7fb" side={2} /></mesh>
      {/* pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[0.95, 4.4]} /><meshStandardMaterial color="#cdb188" roughness={1} /></mesh>
      {/* stands */}
      <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[6.6, 6.6, 2.8, 56, 1, true]} /><meshStandardMaterial color="#13294a" side={1} roughness={0.9} /></mesh>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[6.45, 6.45, 1.1, 56, 1, true]} /><meshStandardMaterial color="#1f4a7a" side={1} roughness={0.9} /></mesh>
      {/* sightscreen */}
      <mesh position={[0, 0.6, -5.4]}><boxGeometry args={[3, 2, 0.2]} /><meshStandardMaterial color="#f4f7fb" /></mesh>
      <Floodlight x={-5} z={-2.5} /><Floodlight x={5} z={-2.5} />
    </group>
  );
}

function Clouds() {
  const g = useRef();
  useFrame(({ clock }) => { if (g.current) g.current.position.x = ((clock.getElapsedTime() * 0.3) % 9) - 4.5; });
  return (
    <group ref={g} position={[0, 2.7, -3]}>
      {[[0, 0, 0], [1.3, 0.2, 0.3], [-1.1, -0.2, 0.2]].map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.5, 14, 14]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.85} /></mesh>
      ))}
    </group>
  );
}

export default function CricketerScene3D() {
  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0.9, 4], fov: 42 }} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#7ec8f2']} />
      <fog attach="fog" args={['#7ec8f2', 7, 13]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      <hemisphereLight args={['#bfe3ff', '#2f9140', 0.6]} />
      <Ground />
      <Clouds />
      <Batsman />
    </Canvas>
  );
}
