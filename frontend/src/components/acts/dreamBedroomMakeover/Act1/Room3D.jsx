/**
 * Live 3D bedroom preview (pure @react-three/fiber — no drei, so it always
 * compiles). Furniture meshes appear/disappear as the cart changes, the room
 * tints to the chosen vibe, and LED strips add coloured glow.
 *
 * Robustness: wrapped in an error boundary that falls back to a 2D isometric
 * room if WebGL is unavailable (older devices / headless).
 */
import { Canvas, useFrame } from '@react-three/fiber';
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
      <Box args={[1.7, 0.35, 2.5]} color={wood} position={[0, 0.18, 0]} />
      <Box args={[1.7, 0.28, 2.5]} color={quilt} position={[0, 0.45, 0.05]} rough={0.9} />
      <Box args={[1.6, 0.45, 0.5]} color={wood} position={[0, 0.5, -1.15]} />
      <Box args={[0.7, 0.18, 0.45]} color="#fff" position={[0, 0.62, -0.85]} rough={1} />
    </group>
  );
}
function Wardrobe({ premium }) {
  const c = premium ? '#caa06a' : '#9c8a6e';
  return (
    <group position={[1.85, 0, -2.15]}>
      <Box args={[1.3, 2.4, 0.7]} color={c} position={[0, 1.2, 0]} />
      <Box args={[0.05, 1.6, 0.04]} color="#3b2f22" position={[0.18, 1.2, 0.37]} />
      <Box args={[0.05, 1.6, 0.04]} color="#3b2f22" position={[-0.18, 1.2, 0.37]} />
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
  const c = gaming ? '#e0444c' : '#4b5563';
  return (
    <group position={[-1.6, 0, 0.6]} rotation={[0, -0.5, 0]}>
      <Box args={[0.55, 0.1, 0.55]} color={c} position={[0, 0.55, 0]} />
      <Box args={[0.55, gaming ? 0.95 : 0.6, 0.1]} color={c} position={[0, gaming ? 1.05 : 0.85, -0.24]} />
      <Box args={[0.08, 0.55, 0.08]} color="#222" position={[0, 0.27, 0]} />
      {gaming && <Box args={[0.6, 0.06, 0.6]} color="#111" position={[0, 0.05, 0]} metal={0.5} />}
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
  useFrame((_, d) => { if (r.current) r.current.rotation.z += d * 6; });
  return (
    <group position={[-2.35, 1.05, 0.0]}>
      <Box args={[0.08, 0.25, 0.08]} color="#444" position={[0, -0.1, 0]} />
      <group ref={r}>
        <Box args={[0.5, 0.08, 0.12]} color="#dfe6ee" position={[0, 0.05, 0]} />
        <Box args={[0.12, 0.08, 0.5]} color="#cfd8e2" position={[0, 0.05, 0]} />
      </group>
    </group>
  );
}
function Curtains() {
  return (
    <group position={[-0.6, 0, -2.92]}>
      <Box args={[1.6, 1.4, 0.05]} color="#a7c7ff" position={[0, 1.5, 0]} rough={1} />
      <Box args={[0.3, 1.7, 0.1]} color="#c98fd6" position={[-0.7, 1.5, 0.06]} rough={1} />
      <Box args={[0.3, 1.7, 0.1]} color="#c98fd6" position={[0.7, 1.5, 0.06]} rough={1} />
    </group>
  );
}
function Poster() {
  return <Box args={[0.9, 1.1, 0.04]} color="#ffd166" position={[1.4, 1.7, -2.92]} emissive="#ff9f1c" />;
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
      <mesh position={[0, -1.0, 0]}><sphereGeometry args={[0.11, 18, 18]} /><meshStandardMaterial color="#fff6d8" emissive="#ffe9b0" emissiveIntensity={0.55} /></mesh>
    </group>
  );
}

/* EXACT same room shell as Scene 1 (DustyRoom3D): 9×9 room, same walls, floor,
 * ceiling, window (back wall), door (front wall), ceiling fan and skirting. The
 * purchased furniture is rendered inside it, scaled to fill the larger room. */
const SR = 4.5;   // half-size → 9 × 9 room (same as Scene 1)
const SH = 4.2;   // wall height (same as Scene 1)
const SWALL = '#e7dcc6', SWALL2 = '#ded2ba', SFLOOR = '#caa979', SCEIL = '#f1ece0';

function RoomScene({ vibe, cart, hasLed, hasCeiling }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.14) * 0.32; // gentle sway, shows the room
  });

  const items = useMemo(() => cart.map((id) => ({ id, render: ART[id] })).filter((x) => x.render), [cart]);

  return (
    <>
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

      <group ref={groupRef}>
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
        {hasCeiling && <Box args={[0.7, 0.12, 0.7]} color="#fffbe8" position={[0, SH - 0.12, 0]} emissive="#fff3c4" />}

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

  return (
    <div className={`dbm-room3d ${className}`}>
      <GLErrorBoundary fallback={fallback}>
        <Canvas
          shadows={false}
          dpr={[1, 1.8]}
          camera={{ position: [0, 1.9, 1.3], fov: 76 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#1a140d']} />
          <fog attach="fog" args={['#cdbfa6', 14, 34]} />
          <Suspense fallback={null}>
            <RoomScene vibe={vibe} cart={cart} hasLed={hasLed} hasCeiling={hasCeiling} />
          </Suspense>
        </Canvas>
      </GLErrorBoundary>
    </div>
  );
}
