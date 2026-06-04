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

function RoomScene({ vibe, cart, hasLed, hasCeiling }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = Math.sin(t * 0.18) * 0.22; // gentle sway
  });

  const items = useMemo(() => cart.map((id) => ({ id, render: ART[id] })).filter((x) => x.render), [cart]);

  // Same light, dusty palette as Scene 1's room (so it reads as the same bedroom).
  const S1 = { wall: '#e7dcc6', wall2: '#ded2ba', floor: '#caa979', wood: '#8a6a45', woodD: '#6b5238' };

  return (
    <>
      <ambientLight intensity={0.95} color="#f0ead9" />
      <directionalLight position={[4, 6, 4]} intensity={1.15} color="#fff3df" />
      <pointLight position={[1.4, 2.7, -2.4]} intensity={1.2} color="#eaf4ff" distance={11} />{/* daylight from the window */}
      <pointLight position={[0, 3.4, 0]} intensity={hasCeiling ? 1.0 : 0.5} color="#fff6e0" />
      {hasLed && (
        <>
          <pointLight position={[-2.6, 1.8, 2]} intensity={1.6} color={vibe.glow} distance={9} />
          <pointLight position={[2.6, 1.8, -2]} intensity={1.6} color="#ff5fae" distance={9} />
        </>
      )}

      <group ref={groupRef}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[6, 6]} />
          <meshStandardMaterial color={S1.floor} roughness={0.95} />
        </mesh>
        {/* Back + left walls (Scene 1 dusty palette) */}
        <mesh position={[0, 2, -3]}>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial color={S1.wall} roughness={1} />
        </mesh>
        <mesh position={[-3, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial color={S1.wall2} roughness={1} />
        </mesh>

        {/* curtained window on the back wall — like Scene 1 */}
        <group position={[1.4, 2.5, -2.94]}>
          <Box args={[1.9, 1.8, 0.12]} color={S1.wood} rough={0.8} metal={0} />
          <Box args={[1.55, 1.5, 0.04]} color="#dff1ff" position={[0, 0, 0.06]} emissive="#cfe6ff" />
          <Box args={[0.08, 1.5, 0.06]} color={S1.wood} position={[0, 0, 0.1]} metal={0} />
          <Box args={[1.55, 0.08, 0.06]} color={S1.wood} position={[0, 0, 0.1]} metal={0} />
          <Box args={[0.42, 1.74, 0.1]} color="#d8c4a0" position={[-0.86, 0, 0.14]} rough={1} metal={0} />
          <Box args={[0.42, 1.74, 0.1]} color="#d8c4a0" position={[0.86, 0, 0.14]} rough={1} metal={0} />
        </group>

        {/* wooden + glass door on the left wall — like Scene 1 */}
        <group position={[-2.94, 1.35, 1.1]} rotation={[0, Math.PI / 2, 0]}>
          <Box args={[1.35, 2.6, 0.12]} color={S1.woodD} rough={0.8} metal={0} />
          <Box args={[1.05, 2.3, 0.06]} color={S1.wood} position={[0, 0, 0.06]} rough={0.7} metal={0} />
          <Box args={[0.72, 0.82, 0.02]} color="#dff1ff" position={[0, 0.58, 0.1]} emissive="#cfe6ff" />
          <mesh position={[0.38, -0.05, 0.13]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#caa84e" metalness={0.6} roughness={0.3} /></mesh>
        </group>

        {/* ceiling fan — same as Scene 1 */}
        <group position={[0.2, 3.95, 0]}><CeilingFan /></group>
        {/* LED strip glow along the wall edges */}
        {hasLed && (
          <>
            <Box args={[6, 0.08, 0.08]} color={vibe.glow} position={[0, 3.6, -2.95]} emissive={vibe.glow} />
            <Box args={[0.08, 0.08, 6]} color="#ff5fae" position={[-2.95, 3.6, 0]} emissive="#ff5fae" />
          </>
        )}
        {hasCeiling && <Box args={[0.7, 0.12, 0.7]} color="#fffbe8" position={[0, 3.7, 0]} emissive="#fff3c4" />}

        {items.map(({ id, render }) => (
          <group key={id}>{render()}</group>
        ))}

        {/* empty-room hint */}
        {items.length === 0 && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.75, 40]} />
            <meshBasicMaterial color={vibe.glow} transparent opacity={0.5} />
          </mesh>
        )}
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
          camera={{ position: [4.4, 3.6, 5.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <color attach="background" args={['#1a140d']} />
          <fog attach="fog" args={['#cdbfa6', 10, 22]} />
          <Suspense fallback={null}>
            <RoomScene vibe={vibe} cart={cart} hasLed={hasLed} hasCeiling={hasCeiling} />
          </Suspense>
        </Canvas>
      </GLErrorBoundary>
    </div>
  );
}
