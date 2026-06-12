/**
 * CricketerScene3D — a stylized, AI-generated-looking cricketer for the fake
 * "giveaway" video in Act 2, Scenario 1.
 *
 * IMPORTANT: this is a GENERIC, non-photoreal figure — NOT a likeness of any
 * real person. The whole teaching point is that scam "celebrity" videos are
 * synthetic, so a deliberately stylized avatar + a robotic TTS voice is the
 * honest, safe way to show it. A low-poly batsman idles with his bat on a
 * slowly-rotating cricket ground (pitch + stadium ring + drifting clouds).
 *
 * Contained to the player area; WebGL-guarded with a CSS fallback.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Batsman() {
  const g = useRef();
  const bat = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (g.current) {
      g.current.position.y = Math.sin(t * 1.6) * 0.05;           // gentle bob
      g.current.rotation.y = Math.sin(t * 0.6) * 0.12;            // sway
    }
    if (bat.current) bat.current.rotation.z = -0.5 + Math.sin(t * 1.2) * 0.18; // bat lift
  });
  const jersey = '#1e5bb8';
  const skin = '#d9a06b';
  return (
    <group ref={g} position={[0, -0.1, 0]}>
      {/* head + cap */}
      <mesh position={[0, 1.35, 0]}><sphereGeometry args={[0.2, 24, 24]} /><meshStandardMaterial color={skin} roughness={0.6} /></mesh>
      <mesh position={[0, 1.5, 0.02]}><sphereGeometry args={[0.22, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#0b2d6b" roughness={0.5} /></mesh>
      {/* torso */}
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.6, 0.8, 0.32]} /><meshStandardMaterial color={jersey} roughness={0.5} /></mesh>
      {/* number-ish accent */}
      <mesh position={[0, 0.9, 0.17]}><boxGeometry args={[0.28, 0.32, 0.02]} /><meshStandardMaterial color="#ffd24a" emissive="#ffae00" emissiveIntensity={0.2} /></mesh>
      {/* arms */}
      <mesh position={[-0.4, 0.95, 0.05]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.09, 0.09, 0.6, 12]} /><meshStandardMaterial color={skin} /></mesh>
      <mesh position={[0.4, 0.95, 0.05]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.09, 0.09, 0.6, 12]} /><meshStandardMaterial color={skin} /></mesh>
      {/* legs / pads */}
      <mesh position={[-0.16, 0.2, 0]}><boxGeometry args={[0.22, 0.7, 0.26]} /><meshStandardMaterial color="#f3f3f0" roughness={0.7} /></mesh>
      <mesh position={[0.16, 0.2, 0]}><boxGeometry args={[0.22, 0.7, 0.26]} /><meshStandardMaterial color="#f3f3f0" roughness={0.7} /></mesh>
      {/* bat (held to one side) */}
      <group ref={bat} position={[0.5, 0.7, 0.12]}>
        <mesh position={[0, -0.35, 0]}><boxGeometry args={[0.16, 0.7, 0.06]} /><meshStandardMaterial color="#c8954c" roughness={0.6} /></mesh>
        <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.04, 0.04, 0.3, 10]} /><meshStandardMaterial color="#6b4a2b" /></mesh>
      </group>
    </group>
  );
}

function Ground() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = clock.getElapsedTime() * 0.08; // ground slowly turns
  });
  return (
    <group ref={g} position={[0, -0.6, 0]}>
      {/* field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[6, 48]} /><meshStandardMaterial color="#2e8b3d" roughness={1} /></mesh>
      {/* boundary ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[5.4, 5.6, 48]} /><meshStandardMaterial color="#eafff0" side={2} /></mesh>
      {/* pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><planeGeometry args={[0.9, 4.2]} /><meshStandardMaterial color="#cdb188" roughness={1} /></mesh>
      {/* stadium stands ring */}
      <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[6.1, 6.1, 2.4, 48, 1, true]} /><meshStandardMaterial color="#10243f" side={1} roughness={0.9} /></mesh>
    </group>
  );
}

function Clouds() {
  const g = useRef();
  useFrame(({ clock }) => {
    if (g.current) g.current.position.x = ((clock.getElapsedTime() * 0.3) % 8) - 4;
  });
  return (
    <group ref={g} position={[0, 2.4, -3]}>
      {[[0, 0, 0], [1.2, 0.2, 0.3], [-1.1, -0.2, 0.2]].map((p, i) => (
        <mesh key={i} position={p}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.85} /></mesh>
      ))}
    </group>
  );
}

export default function CricketerScene3D() {
  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0.8, 4.2], fov: 42 }} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#7ec8f2']} />
      <fog attach="fog" args={['#7ec8f2', 6, 12]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} castShadow />
      <hemisphereLight args={['#bfe3ff', '#2e8b3d', 0.6]} />
      <Ground />
      <Clouds />
      <Batsman />
    </Canvas>
  );
}
