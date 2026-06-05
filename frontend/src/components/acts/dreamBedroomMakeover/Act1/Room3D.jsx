/**
 * Live 3D bedroom preview (pure @react-three/fiber — no drei, so it always
 * compiles). Furniture meshes appear/disappear as the cart changes, the room
 * tints to the chosen vibe, and LED strips add coloured glow.
 *
 * Robustness: wrapped in an error boundary that falls back to a 2D isometric
 * room if WebGL is unavailable (older devices / headless).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useMemo, useRef, Component } from 'react';
import { IsoRoom2D } from './IsoRoom2D.jsx';

/* ---- small furniture primitives (boxes) ---- */
function Box({ args, color, position, rotation, emissive, metal = 0.1, rough = 0.7 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} emissive={emissive || '#000'} emissiveIntensity={emissive ? 0.9 : 0} metalness={metal} roughness={rough} />
    </mesh>
  );
}

function Bed({ premium }) {
  const wood = premium ? '#8b5e34' : '#6b4a2f';
  const quilt = premium ? '#ef6aa0' : '#7aa2e8';
  return (
    <group position={[-1.35, 0, -1.5]}>
      {/* frame + mattress */}
      <Box args={[1.7, 0.35, 2.5]} color={wood} position={[0, 0.18, 0]} />
      <Box args={[1.7, 0.28, 2.5]} color={quilt} position={[0, 0.45, 0.05]} rough={0.9} />
      {/* headboard — tall for premium */}
      {premium ? (
        <>
          <Box args={[1.8, 1.5, 0.16]} color={wood} position={[0, 0.85, -1.28]} />
          <Box args={[1.5, 1.15, 0.07]} color="#a9794b" position={[0, 0.92, -1.2]} rough={0.55} />
          <Box args={[1.5, 0.06, 0.07]} color="#7d5733" position={[0, 1.35, -1.19]} />
          <Box args={[0.06, 1.0, 0.07]} color="#7d5733" position={[-0.5, 0.92, -1.19]} />
          <Box args={[0.06, 1.0, 0.07]} color="#7d5733" position={[0.5, 0.92, -1.19]} />
        </>
      ) : (
        <Box args={[1.6, 0.5, 0.16]} color={wood} position={[0, 0.45, -1.2]} />
      )}
      {/* pillows */}
      <Box args={[0.66, 0.18, 0.42]} color="#fff" position={[-0.4, 0.62, -0.85]} rough={1} />
      <Box args={[0.66, 0.18, 0.42]} color={premium ? '#ffd9e6' : '#eef3fb'} position={[0.4, 0.62, -0.85]} rough={1} />
      {/* folded blanket */}
      <Box args={[1.6, 0.1, 0.7]} color={premium ? '#d8567f' : '#5f86c8'} position={[0, 0.52, 0.7]} rough={1} />
    </group>
  );
}
function Wardrobe({ premium }) {
  const c = premium ? '#caa06a' : '#9c8a6e';
  // right corner, against the front (door) wall, doors facing into the room
  return (
    <group position={[2.5, 0, 2.3]} rotation={[0, Math.PI, 0]}>
      <Box args={[1.3, 2.4, 0.7]} color={c} position={[0, 1.2, 0]} />
      {premium ? (
        <>
          {/* sliding-door panels */}
          <Box args={[0.62, 2.2, 0.05]} color="#e6cda4" position={[-0.32, 1.2, 0.37]} />
          <Box args={[0.62, 2.2, 0.05]} color="#d9bd91" position={[0.32, 1.2, 0.36]} />
          <Box args={[0.04, 0.4, 0.04]} color="#7a5733" position={[0.02, 1.2, 0.4]} />
        </>
      ) : (
        <>
          {/* two hinged doors + knobs */}
          <Box args={[0.6, 2.2, 0.04]} color="#8a755a" position={[-0.32, 1.2, 0.37]} />
          <Box args={[0.6, 2.2, 0.04]} color="#80694e" position={[0.32, 1.2, 0.37]} />
          <Box args={[0.05, 0.18, 0.05]} color="#3b2f22" position={[-0.06, 1.2, 0.4]} />
          <Box args={[0.05, 0.18, 0.05]} color="#3b2f22" position={[0.06, 1.2, 0.4]} />
        </>
      )}
      {premium && <Box args={[1.32, 0.12, 0.72]} color="#f5d18a" position={[0, 2.46, 0]} emissive="#caa06a" />}
    </group>
  );
}
function Desk() {
  return (
    <group position={[-2.35, 0, 0.6]}>
      <Box args={[0.7, 0.08, 1.5]} color="#b5895a" position={[0, 1.0, 0]} />
      <Box args={[0.08, 1.0, 0.08]} color="#7a5a39" position={[0.28, 0.5, 0.65]} />
      <Box args={[0.08, 1.0, 0.08]} color="#7a5a39" position={[0.28, 0.5, -0.65]} />
      <Box args={[0.08, 1.0, 0.08]} color="#7a5a39" position={[-0.28, 0.5, 0.65]} />
      <Box args={[0.08, 1.0, 0.08]} color="#7a5a39" position={[-0.28, 0.5, -0.65]} />
    </group>
  );
}
function Chair({ gaming }) {
  if (gaming) {
    return (
      <group position={[-1.6, 0, 0.6]} rotation={[0, -0.5, 0]}>
        <Box args={[0.58, 0.12, 0.58]} color="#e0444c" position={[0, 0.55, 0]} />
        <Box args={[0.58, 1.0, 0.1]} color="#2a2e38" position={[0, 1.1, -0.26]} />
        <Box args={[0.22, 0.62, 0.08]} color="#e0444c" position={[0, 1.1, -0.24]} />
        {/* headrest */}
        <Box args={[0.36, 0.16, 0.1]} color="#15171f" position={[0, 1.7, -0.24]} />
        {/* armrests */}
        <Box args={[0.06, 0.1, 0.34]} color="#15171f" position={[-0.3, 0.78, 0]} />
        <Box args={[0.06, 0.1, 0.34]} color="#15171f" position={[0.3, 0.78, 0]} />
        {/* gas lift + 5-star base */}
        <Box args={[0.09, 0.42, 0.09]} color="#222" position={[0, 0.3, 0]} />
        <Box args={[0.62, 0.06, 0.12]} color="#111" position={[0, 0.06, 0]} metal={0.5} />
        <Box args={[0.12, 0.06, 0.62]} color="#111" position={[0, 0.06, 0]} metal={0.5} />
      </group>
    );
  }
  // basic wooden chair — 4 wooden legs
  return (
    <group position={[-1.6, 0, 0.6]} rotation={[0, -0.5, 0]}>
      <Box args={[0.5, 0.08, 0.5]} color="#a07a4e" position={[0, 0.5, 0]} />
      <Box args={[0.5, 0.55, 0.08]} color="#a07a4e" position={[0, 0.78, -0.21]} />
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
        <Box key={i} args={[0.06, 0.5, 0.06]} color="#7a5a39" position={[x, 0.25, z]} />
      ))}
    </group>
  );
}
function Shelf() {
  return (
    <group position={[0.4, 0, -2.55]}>
      <Box args={[1.2, 1.4, 0.3]} color="#9b7b53" position={[0, 0.9, 0]} />
      <Box args={[1.1, 0.4, 0.25]} color="#d65b5b" position={[-0.2, 0.6, 0.03]} rough={1} />
      <Box args={[1.1, 0.4, 0.25]} color="#5b8fd6" position={[0.2, 1.1, 0.03]} rough={1} />
    </group>
  );
}
function Fridge() {
  return (
    <group position={[2.4, 0, 1.3]}>
      <Box args={[0.8, 1.0, 0.8]} color="#e8eef2" position={[0, 0.5, 0]} metal={0.4} rough={0.3} />
      <Box args={[0.06, 0.35, 0.04]} color="#9aa3ad" position={[0.34, 0.6, 0.4]} />
    </group>
  );
}
function Boxes() {
  return (
    <group position={[-1.35, 0, -0.2]}>
      <Box args={[0.5, 0.3, 0.4]} color="#c98b5a" position={[0, 0.15, 0]} rough={1} />
      <Box args={[0.5, 0.3, 0.4]} color="#b97c4d" position={[0.55, 0.15, 0]} rough={1} />
    </group>
  );
}
function Mirror() {
  return (
    <group position={[-2.92, 0, -1.0]} rotation={[0, 0.4, 0]}>
      <Box args={[0.08, 1.8, 0.7]} color="#7a5a39" position={[0, 0.95, 0]} />
      <Box args={[0.04, 1.6, 0.55]} color="#bfe3ff" position={[0.05, 0.95, 0]} metal={0.9} rough={0.05} emissive="#bfe3ff" />
    </group>
  );
}
function Fan() {
  const r = useRef();
  useFrame((_, d) => { if (r.current) r.current.rotation.z -= d * 9; }); // clockwise
  return (
    <group position={[-2.4, 0, 0.7]}>
      {/* base + stem */}
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.26, 0.3, 0.08, 20]} /><meshStandardMaterial color="#3a3f48" /></mesh>
      <Box args={[0.09, 1.0, 0.09]} color="#5a626e" position={[0, 0.55, 0]} />
      {/* head, facing into the room (+z) */}
      <group position={[0, 1.05, 0.14]}>
        <mesh><torusGeometry args={[0.36, 0.028, 8, 30]} /><meshStandardMaterial color="#c3ccd6" metalness={0.3} /></mesh>
        <group ref={r}>
          {[0, 1, 2].map((i) => {
            const a = (i * 2 * Math.PI) / 3;
            return <Box key={i} args={[0.14, 0.42, 0.02]} color={i % 2 ? '#cfd8e2' : '#eef2f6'} position={[0.18 * Math.sin(a), 0.18 * Math.cos(a), 0]} rotation={[0, 0, -a]} />;
          })}
        </group>
        <mesh position={[0, 0, 0.03]}><cylinderGeometry args={[0.06, 0.06, 0.06, 14]} /><meshStandardMaterial color="#5a626e" /></mesh>
      </group>
    </group>
  );
}
function Curtains() {
  // centred on the back-wall window (window is at world x≈0)
  return (
    <group position={[0, 1.7, -2.9]}>
      {/* rod */}
      <Box args={[2.5, 0.09, 0.1]} color="#3a2c20" position={[0, 1.05, 0.05]} />
      {/* valance */}
      <Box args={[2.5, 0.4, 0.12]} color="#4a1c36" position={[0, 0.86, 0.07]} rough={1} />
      {/* dark cloth panels framing the window */}
      <Box args={[0.55, 2.0, 0.14]} color="#5a2342" position={[-0.96, -0.1, 0.06]} rough={1} />
      <Box args={[0.55, 2.0, 0.14]} color="#5a2342" position={[0.96, -0.1, 0.06]} rough={1} />
      {/* soft fold highlights */}
      <Box args={[0.06, 1.9, 0.15]} color="#7a3a5e" position={[-0.96, -0.1, 0.07]} rough={1} />
      <Box args={[0.06, 1.9, 0.15]} color="#7a3a5e" position={[0.96, -0.1, 0.07]} rough={1} />
    </group>
  );
}
function Poster() {
  // front (door) wall, to the LEFT of the door; faces into the room
  return (
    <group position={[-1.7, 1.7, 2.92]} rotation={[0, Math.PI, 0]}>
      <Box args={[0.98, 1.18, 0.05]} color="#6b4f33" />
      <Box args={[0.82, 1.02, 0.02]} color="#bfe0f5" position={[0, 0, 0.03]} />
      <Box args={[0.82, 0.34, 0.02]} color="#ffd9a0" position={[0, 0.34, 0.035]} />
      <mesh position={[0.22, 0.4, 0.05]}><circleGeometry args={[0.1, 20]} /><meshStandardMaterial color="#fff3bf" emissive="#fff3bf" emissiveIntensity={0.6} /></mesh>
      <Box args={[0.82, 0.18, 0.02]} color="#cdd9e6" position={[0, 0.05, 0.04]} />
      <Box args={[0.82, 0.18, 0.02]} color="#3a7d4a" position={[0, -0.18, 0.04]} />
      <Box args={[0.82, 0.16, 0.02]} color="#6fb0d2" position={[0, -0.4, 0.04]} />
    </group>
  );
}
function Speaker() {
  return (
    <group position={[-2.35, 1.06, 0.45]}>
      <Box args={[0.22, 0.32, 0.22]} color="#222" position={[0, 0.16, 0]} metal={0.3} />
      <Box args={[0.22, 0.02, 0.22]} color="#7c3aed" position={[0, 0.33, 0]} emissive="#7c3aed" />
    </group>
  );
}
function Lamp() {
  return (
    <group position={[-2.05, 1.04, 0.9]}>
      <Box args={[0.06, 0.35, 0.06]} color="#555" position={[0, 0.18, 0]} />
      <Box args={[0.22, 0.16, 0.22]} color="#ffd98a" position={[0, 0.4, 0]} emissive="#ffcf6b" />
    </group>
  );
}

const ART = {
  'bed-budget': () => <Bed />, 'bed-premium': () => <Bed premium />,
  'wardrobe-budget': () => <Wardrobe />, 'wardrobe-premium': () => <Wardrobe premium />,
  'study-desk': () => <Desk />, 'basic-chair': () => <Chair />, 'gaming-chair': () => <Chair gaming />,
  'bookshelf': () => <Shelf />, 'under-bed-box': () => <Boxes />,
  'desk-lamp': () => <Lamp />, 'ceiling-light': null, 'led-strips': null,
  'curtains': () => <Curtains />, 'table-fan': () => <Fan />, 'posters': () => <Poster />,
  'bluetooth-speaker': () => <Speaker />, 'mini-fridge': () => <Fridge />, 'mirror': () => <Mirror />,
};

/* Ceiling fan — same build as Scene 1's room (hangs DOWN from its mount). */
function CeilingFan() {
  const blades = useRef();
  useFrame((_, d) => { if (blades.current) blades.current.rotation.y += d * 1.5; });
  return (
    <group>
      <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.12, 0.14, 0.08, 16]} /><meshStandardMaterial color="#4a4034" /></mesh>
      <mesh position={[0, -0.42, 0]}><cylinderGeometry args={[0.025, 0.025, 0.72, 10]} /><meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.5} /></mesh>
      <mesh position={[0, -0.84, 0]}><cylinderGeometry args={[0.16, 0.19, 0.18, 20]} /><meshStandardMaterial color="#6a4a32" metalness={0.35} roughness={0.45} /></mesh>
      <group ref={blades} position={[0, -0.86, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2;
          return (
            <group key={i} rotation={[0, -a, 0]}>
              <mesh position={[0.3, 0.02, 0]}><boxGeometry args={[0.32, 0.03, 0.06]} /><meshStandardMaterial color="#5a4632" metalness={0.4} /></mesh>
              <mesh position={[0.78, -0.02, 0]} rotation={[0, 0, 0.07]}><boxGeometry args={[0.85, 0.02, 0.26]} /><meshStandardMaterial color="#8a6a44" roughness={0.6} /></mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* EXACT same room shell as Scene 1 (DustyRoom3D): 9×9 room, same walls, floor,
 * ceiling, window (back wall), door (front wall), ceiling fan and skirting. The
 * purchased furniture is rendered inside it, scaled to fill the larger room. */
const SR = 4.5;   // half-size → 9 × 9 room (same as Scene 1)
const SH = 4.2;   // wall height (same as Scene 1)
const SWALL = '#e7dcc6', SWALL2 = '#ded2ba', SFLOOR = '#caa979', SCEIL = '#f1ece0';

/* Orbit camera around the room — drag to rotate/inspect every corner, slow
 * auto-rotate when idle. Camera stays OUTSIDE the room so the near walls
 * back-face-cull and you see the full interior (dollhouse view). */
function OrbitRig({ ctrl }) {
  const { camera } = useThree();
  useFrame((_, d) => {
    const c = ctrl.current;
    if (!c.dragging) c.yaw += d * 0.1; // gentle idle spin
    const radius = 10.5;
    const cp = Math.cos(c.pitch);
    camera.position.set(Math.sin(c.yaw) * cp * radius, 2.0 + Math.sin(c.pitch) * radius, Math.cos(c.yaw) * cp * radius);
    camera.lookAt(0, 1.7, 0);
  });
  return null;
}

function RoomScene({ vibe, cart, hasLed, hasCeiling, ctrl }) {
  const items = useMemo(() => cart.map((id) => ({ id, render: ART[id] })).filter((x) => x.render), [cart]);

  return (
    <>
      <OrbitRig ctrl={ctrl} />
      {/* bright daytime light pouring through the window — same as Scene 1 */}
      <ambientLight intensity={1.05} color="#eaf1ff" />
      <pointLight position={[0.4, 2.6, -4.2]} intensity={2.6} color="#fff6e6" distance={18} decay={1.0} />
      <directionalLight position={[0.4, 3.2, -2]} intensity={0.95} color="#ffffff" />
      <pointLight position={[0.2, 3.6, 0]} intensity={hasCeiling ? 0.7 : 0.4} color="#fffaf0" distance={11} />
      {hasLed && (
        <>
          <pointLight position={[-3.6, 2.6, 3]} intensity={1.6} color={vibe.glow} distance={12} />
          <pointLight position={[3.6, 2.6, -3]} intensity={1.6} color="#ff5fae" distance={12} />
        </>
      )}

      <group>
        {/* floor + ceiling */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[2 * SR, 2 * SR]} /><meshStandardMaterial color={SFLOOR} roughness={1} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, SH, 0]}><planeGeometry args={[2 * SR, 2 * SR]} /><meshStandardMaterial color={SCEIL} roughness={1} /></mesh>
        {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => (<Box key={x} args={[0.02, 0.012, 2 * SR]} color="#332618" position={[x, 0.012, 0]} />))}

        {/* BACK wall — wooden window with crystal glass onto a bright day */}
        <mesh position={[0, SH / 2, -SR]}><planeGeometry args={[2 * SR, SH]} /><meshStandardMaterial color={SWALL} roughness={1} /></mesh>
        <group position={[0, 2.3, -SR + 0.08]}>
          <mesh position={[0, 0.48, -0.05]}><boxGeometry args={[2.32, 0.96, 0.02]} /><meshStandardMaterial color="#bfe6ff" emissive="#a9ddff" emissiveIntensity={1.4} toneMapped={false} /></mesh>
          <mesh position={[0, -0.44, -0.05]}><boxGeometry args={[2.32, 0.92, 0.02]} /><meshStandardMaterial color="#e8f5ff" emissive="#ddf1ff" emissiveIntensity={1.55} toneMapped={false} /></mesh>
          <mesh position={[0.55, 0.4, -0.04]}><circleGeometry args={[0.5, 36]} /><meshBasicMaterial color="#fff6cf" transparent opacity={0.5} /></mesh>
          <mesh position={[0.55, 0.4, -0.038]}><circleGeometry args={[0.26, 36]} /><meshBasicMaterial color="#fffbe8" /></mesh>
          <mesh position={[-0.5, 0.48, -0.03]} scale={[1.7, 0.55, 1]}><circleGeometry args={[0.2, 22]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.9} /></mesh>
          <mesh position={[0.15, -0.22, -0.03]} scale={[1.5, 0.5, 1]}><circleGeometry args={[0.18, 22]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.7} /></mesh>
          <mesh position={[0, 0, 0.02]}><boxGeometry args={[2.3, 1.9, 0.02]} /><meshStandardMaterial color="#d4ecff" transparent opacity={0.2} roughness={0.04} metalness={0.15} /></mesh>
          <mesh position={[-0.45, 0, 0.035]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.16, 2.6, 0.01]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.18} /></mesh>
          <mesh position={[-0.06, 0, 0.035]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.07, 2.6, 0.01]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.13} /></mesh>
          <Box args={[2.78, 0.24, 0.24]} color="#7a5836" position={[0, 1.08, 0.04]} rough={0.7} />
          <Box args={[2.78, 0.34, 0.36]} color="#6a4a2c" position={[0, -1.14, 0.07]} rough={0.7} />
          <Box args={[0.24, 2.46, 0.24]} color="#7a5836" position={[-1.3, 0, 0.04]} rough={0.7} />
          <Box args={[0.24, 2.46, 0.24]} color="#7a5836" position={[1.3, 0, 0.04]} rough={0.7} />
          <Box args={[0.12, 1.94, 0.2]} color="#6f5030" position={[0, 0, 0.06]} rough={0.7} />
          <Box args={[2.4, 0.12, 0.2]} color="#6f5030" position={[0, 0, 0.06]} rough={0.7} />
          <mesh position={[1.12, -0.06, 0.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.04, 16]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
          <mesh position={[1.12, -0.24, 0.15]}><boxGeometry args={[0.05, 0.28, 0.05]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
          <mesh position={[1.12, -0.4, 0.15]}><sphereGeometry args={[0.05, 14, 14]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
        </group>

        {/* FRONT wall — door */}
        <mesh position={[0, SH / 2, SR]} rotation={[0, Math.PI, 0]}><planeGeometry args={[2 * SR, SH]} /><meshStandardMaterial color={SWALL} roughness={1} /></mesh>
        <group position={[-0.5, 1.45, SR - 0.08]}>
          <Box args={[1.62, 3.0, 0.1]} color="#5a4126" position={[0, 0, 0.06]} />
          <Box args={[1.5, 2.9, 0.16]} color="#6a4a2c" rough={0.7} />
          <Box args={[1.32, 2.72, 0.03]} color="#7a5836" position={[0, 0, -0.09]} rough={0.7} />
          <Box args={[0.48, 0.98, 0.02]} color="#5a4126" position={[-0.33, 0.62, -0.11]} />
          <Box args={[0.48, 0.98, 0.02]} color="#5a4126" position={[0.33, 0.62, -0.11]} />
          <Box args={[0.48, 0.92, 0.02]} color="#5a4126" position={[-0.33, -0.58, -0.11]} />
          <Box args={[0.48, 0.92, 0.02]} color="#5a4126" position={[0.33, -0.58, -0.11]} />
          <mesh position={[0.56, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.03, 18]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
          <mesh position={[0.49, -0.02, -0.17]}><boxGeometry args={[0.22, 0.05, 0.05]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
          <mesh position={[-0.73, 0.95, -0.05]}><boxGeometry args={[0.05, 0.26, 0.13]} /><meshStandardMaterial color="#9a9a9a" metalness={0.55} roughness={0.4} /></mesh>
          <mesh position={[-0.73, -0.95, -0.05]}><boxGeometry args={[0.05, 0.26, 0.13]} /><meshStandardMaterial color="#9a9a9a" metalness={0.55} roughness={0.4} /></mesh>
          <Box args={[1.3, 0.26, 0.02]} color="#cfcfcf" position={[0, -1.28, -0.1]} metal={0.5} rough={0.4} />
        </group>

        {/* LEFT + RIGHT plain walls */}
        <mesh position={[-SR, SH / 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2 * SR, SH]} /><meshStandardMaterial color={SWALL2} roughness={1} /></mesh>
        <mesh position={[SR, SH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[2 * SR, SH]} /><meshStandardMaterial color={SWALL2} roughness={1} /></mesh>

        {/* skirting all round */}
        <Box args={[2 * SR, 0.16, 0.04]} color="#2e2517" position={[0, 0.08, -SR + 0.03]} />
        <Box args={[2 * SR, 0.16, 0.04]} color="#2e2517" position={[0, 0.08, SR - 0.03]} />
        <Box args={[0.04, 0.16, 2 * SR]} color="#2e2517" position={[-SR + 0.03, 0.08, 0]} />
        <Box args={[0.04, 0.16, 2 * SR]} color="#2e2517" position={[SR - 0.03, 0.08, 0]} />

        {/* ceiling fan — same as Scene 1 */}
        <group position={[0.2, SH, 0]}><CeilingFan /></group>

        {/* LED + ceiling-light add-ons (scaled to the 9×9 room) */}
        {hasLed && (
          <>
            <Box args={[2 * SR, 0.08, 0.08]} color={vibe.glow} position={[0, SH - 0.2, -SR + 0.05]} emissive={vibe.glow} />
            <Box args={[0.08, 0.08, 2 * SR]} color="#ff5fae" position={[-SR + 0.05, SH - 0.2, 0]} emissive="#ff5fae" />
          </>
        )}
        {hasCeiling && (
          <>
            {/* ceiling light centred over the bed, glowing warm yellow */}
            <mesh position={[-1.95, SH - 0.16, -2.1]}><cylinderGeometry args={[0.42, 0.42, 0.12, 24]} /><meshStandardMaterial color="#fff3b0" emissive="#ffe066" emissiveIntensity={1.4} toneMapped={false} /></mesh>
            <mesh position={[-1.95, SH - 0.05, -2.1]}><cylinderGeometry args={[0.46, 0.46, 0.06, 24]} /><meshStandardMaterial color="#cfd6df" metalness={0.4} /></mesh>
            <pointLight position={[-1.95, SH - 0.6, -2.1]} intensity={1.8} color="#ffe066" distance={9} />
          </>
        )}

        {/* purchased furniture — authored for a 6×6 layout, scaled to fill 9×9 */}
        <group scale={[1.45, 1.35, 1.45]}>
          {items.map(({ id, render }) => (
            <group key={id}>{render()}</group>
          ))}
        </group>
      </group>
    </>
  );
}

class GLErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function Room3D({ vibe, cart = [], className = '' }) {
  const hasLed = cart.includes('led-strips');
  const hasCeiling = cart.includes('ceiling-light');
  const fallback = <IsoRoom2D vibe={vibe} cart={cart} className={className} />;
  // Start at a corner angle that frames the whole room; drag to look around.
  const ctrl = useRef({ yaw: 0.7, pitch: 0.42, dragging: false, lx: 0, ly: 0 });

  const onDown = (e) => { const c = ctrl.current; c.dragging = true; c.lx = e.clientX; c.ly = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    const c = ctrl.current; if (!c.dragging) return;
    c.yaw -= (e.clientX - c.lx) * 0.006;
    c.pitch = Math.max(0.08, Math.min(1.25, c.pitch + (e.clientY - c.ly) * 0.005));
    c.lx = e.clientX; c.ly = e.clientY;
  };
  const onUp = (e) => { ctrl.current.dragging = false; e.currentTarget.releasePointerCapture?.(e.pointerId); };

  return (
    <div
      className={`dbm-room3d ${className}`}
      style={{ cursor: 'grab', touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <GLErrorBoundary fallback={fallback}>
        <Canvas
          shadows={false}
          dpr={[1, 1.8]}
          camera={{ position: [7, 4.5, 8], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#1a140d']} />
          <fog attach="fog" args={['#cdbfa6', 16, 40]} />
          <Suspense fallback={null}>
            <RoomScene vibe={vibe} cart={cart} hasLed={hasLed} hasCeiling={hasCeiling} ctrl={ctrl} />
          </Suspense>
        </Canvas>
      </GLErrorBoundary>
      <div className="dbm-room3d__hint">🖱️ Drag to look around</div>
    </div>
  );
}
