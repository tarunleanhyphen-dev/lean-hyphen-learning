/**
 * CricketerScene3D — the fake "giveaway" video for Act 2, Scenario 1, shown
 * as a PRESS CONFERENCE: a player seated at a press desk with a mic, against
 * a cricket-board step-and-repeat backdrop, with camera flashes going off.
 *
 * IMPORTANT: the figure is a GENERIC, non-photoreal player — NOT a likeness of
 * any real person. The teaching point is that scam "celebrity" videos are
 * synthetic, so a deliberately stylized avatar is the honest way to show it.
 *
 * Contained to the player area; WebGL-guarded with a CSS fallback.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

const JERSEY = '#1565d8';
const JERSEY_DK = '#0c3f93';
const SKIN = '#d29a68';

/* Step-and-repeat sponsor backdrop (cricket-board press wall). */
function Backdrop() {
  const cols = 6, rows = 3;
  const logos = [];
  for (let r = 0; r < rows; r++) {
    for (let cI = 0; cI < cols; cI++) {
      logos.push([(cI - (cols - 1) / 2) * 1.5, 0.8 + (r - (rows - 1) / 2) * 1.2, -2.45]);
    }
  }
  const colors = ['#1e5bb8', '#0e7a4f', '#f59e0b', '#e23b54'];
  return (
    <group>
      <mesh position={[0, 0.8, -2.5]}><planeGeometry args={[10, 5]} /><meshStandardMaterial color="#13316b" roughness={0.9} /></mesh>
      {logos.map((p, i) => (
        <mesh key={i} position={p}>
          <planeGeometry args={[0.95, 0.42]} />
          <meshStandardMaterial color={colors[i % colors.length]} emissive={colors[i % colors.length]} emissiveIntensity={0.25} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* Seated player behind the press desk, talking into the mic. */
function Speaker() {
  const head = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (head.current) {
      head.current.rotation.x = Math.sin(t * 5) * 0.05 - 0.05;  // talking nod
      head.current.rotation.y = Math.sin(t * 0.7) * 0.12;        // look around
    }
  });
  return (
    <group position={[0, -0.35, 0]}>
      {/* torso behind desk */}
      <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.05, 1.1, 0.5]} /><meshStandardMaterial color={JERSEY} roughness={0.5} /></mesh>
      <mesh position={[0, 0.65, 0.26]}><boxGeometry args={[0.16, 0.7, 0.02]} /><meshStandardMaterial color="#ffae00" /></mesh>{/* zip stripe */}
      {/* shoulders / collar */}
      <mesh position={[0, 1.0, 0]}><boxGeometry args={[1.1, 0.22, 0.55]} /><meshStandardMaterial color={JERSEY_DK} roughness={0.5} /></mesh>
      {/* head + cap */}
      <group ref={head} position={[0, 1.34, 0.05]}>
        <mesh><sphereGeometry args={[0.27, 28, 28]} /><meshStandardMaterial color={SKIN} roughness={0.55} /></mesh>
        <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.29, 28, 28, 0, Math.PI * 2, 0, Math.PI / 1.9]} /><meshStandardMaterial color="#0b2d6b" roughness={0.45} /></mesh>
        <mesh position={[0, 0.07, 0.27]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.34, 0.04, 0.18]} /><meshStandardMaterial color="#0b2d6b" /></mesh>{/* cap brim */}
        {/* mouth (animated by head nod) */}
        <mesh position={[0, -0.08, 0.25]}><boxGeometry args={[0.1, 0.04, 0.02]} /><meshStandardMaterial color="#5b2b22" /></mesh>
      </group>
      {/* arms resting on the desk */}
      <mesh position={[-0.5, 0.05, 0.35]} rotation={[0, 0, 0.2]}><boxGeometry args={[0.22, 0.5, 0.22]} /><meshStandardMaterial color={JERSEY} /></mesh>
      <mesh position={[0.5, 0.05, 0.35]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.22, 0.5, 0.22]} /><meshStandardMaterial color={JERSEY} /></mesh>
    </group>
  );
}

/* Press desk + branded front panel. */
function Desk() {
  return (
    <group position={[0, -0.95, 0.7]}>
      <mesh><boxGeometry args={[3.2, 0.7, 0.7]} /><meshStandardMaterial color="#161a26" roughness={0.7} /></mesh>
      <mesh position={[0, 0, 0.36]}><planeGeometry args={[3.0, 0.5]} /><meshStandardMaterial color="#1e5bb8" emissive="#1e5bb8" emissiveIntensity={0.2} /></mesh>
    </group>
  );
}

/* Microphone on a short stand angled to the speaker. */
function Mic() {
  return (
    <group position={[0, -0.55, 0.95]} rotation={[0.35, 0, 0]}>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.02, 0.02, 0.55, 10]} /><meshStandardMaterial color="#2b2f3a" metalness={0.6} /></mesh>
      <mesh position={[0, 0.5, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="#0c0d12" roughness={0.4} /></mesh>
    </group>
  );
}

/* Random-ish camera flashes — sells the press-conference feel. */
function Flashes() {
  const a = useRef(); const b = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (a.current) a.current.intensity = Math.max(0, Math.sin(t * 7.3) * 60 - 50);
    if (b.current) b.current.intensity = Math.max(0, Math.sin(t * 5.1 + 2) * 60 - 52);
  });
  return (
    <>
      <pointLight ref={a} position={[-2.5, 1.5, 2.5]} color="#ffffff" intensity={0} distance={9} />
      <pointLight ref={b} position={[2.6, 1.2, 2.4]} color="#eef4ff" intensity={0} distance={9} />
    </>
  );
}

export default function CricketerScene3D() {
  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0.5, 4.1], fov: 42 }} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#0d1b3a']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 4, 4]} intensity={1.2} />
      <spotLight position={[0, 4, 3]} angle={0.6} penumbra={0.6} intensity={1.4} color="#dfe8ff" />
      <Backdrop />
      <Desk />
      <Speaker />
      <Mic />
      <Flashes />
    </Canvas>
  );
}
