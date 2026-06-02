/**
 * Cinematic 3D bedroom — the always-on canvas for Lesson 2 Act 1.
 *
 * Highlights vs v1:
 *   - Cinematic CameraRig springs the camera between named "shots" per
 *     screen (wide reveal, over-the-shoulder for shopping, dolly-back for
 *     the final snapshot).
 *   - HDRI environment + soft directional sun + warm rim light. Materials
 *     pick up real reflections.
 *   - SelectiveBloom on emissive accents (LED strips, screens, neon trims).
 *   - Items drop in from above with a satisfying bounce + small particle
 *     poof (via @react-spring).
 *   - No procedural character — we lean fully into the room. The narrator
 *     lives in 2D in the [[StyleCoach]] component.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment, ContactShadows, AccumulativeShadows, RandomizedLight,
  RoundedBox, Float, SoftShadows,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { useSpring, animated } from '@react-spring/three';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Character3D } from './Character3D.jsx';

/* Walls and floor are pulled slightly warmer + more desaturated so the
 * room reads as "lived in" / a little dusty rather than freshly painted. */
const VIBES = {
  cosy:    { wall: '#ECD2B2', floor: '#90694B', accent: '#F59E0B', sky: 'apartment', bg: '#F4D9B0' },
  study:   { wall: '#D8DDD2', floor: '#A07F5C', accent: '#10B981', sky: 'studio',    bg: '#DDE9DC' },
  gamer:   { wall: '#13162A', floor: '#080B19', accent: '#8B5CF6', sky: 'night',     bg: '#050710' },
  minimal: { wall: '#EEF1F5', floor: '#C7BDB2', accent: '#06B6D4', sky: 'dawn',      bg: '#E5EBEF' },
};

/* ============================================================
 * CAMERA RIG
 * Named shots → smoothly interpolated camera position + target.
 * ============================================================ */
/* Cinematic shots — wider, more grand, with intentional staging of Maya
 * (who lives near [-2.5, 0, 1.6]). Every shot keeps her at least partly
 * in frame so the room never feels empty. */
const SHOTS = {
  hero:     { pos: [4.8, 3.0, 6.4], tgt: [-0.4, 1.0, 0.3] }, // wide reveal of room + Maya
  rules:    { pos: [3.6, 2.4, 5.4], tgt: [-0.6, 1.0, 0.4] }, // closer on Maya holding her clipboard
  sort:     { pos: [4.0, 2.2, 5.4], tgt: [ 0.0, 1.0, 0.0] }, // mid — looking past Maya
  shop:     { pos: [3.4, 1.8, 5.0], tgt: [ 0.2, 0.7, 0.0] }, // over-the-shoulder shopping
  events:   { pos: [4.4, 2.4, 5.6], tgt: [-0.2, 1.0, 0.2] }, // suspenseful slight angle
  snapshot: { pos: [5.5, 3.4, 6.8], tgt: [ 0.0, 1.0, 0.0] }, // dolly back to admire room
};

function CameraRig({ shot = 'hero', orbit = false }) {
  const { camera } = useThree();
  const t = useRef(0);
  const lookTarget = useRef(new THREE.Vector3(...SHOTS[shot].tgt));

  useFrame((_, dt) => {
    t.current += dt;
    const goal = SHOTS[shot] || SHOTS.hero;
    // Slow orbit when requested
    const orbitOffset = orbit ? Math.sin(t.current * 0.18) * 0.6 : 0;
    const goalPos = new THREE.Vector3(goal.pos[0] + orbitOffset, goal.pos[1], goal.pos[2]);
    camera.position.lerp(goalPos, 0.04);
    lookTarget.current.lerp(new THREE.Vector3(...goal.tgt), 0.06);
    camera.lookAt(lookTarget.current);
  });
  return null;
}

/* ============================================================
 * DUST MOTES — drifting particles for ambient room motion
 * ============================================================ */
function DustMotes({ count = 80, vibe }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3]     = (Math.random() - 0.5) * 8;
      arr[i * 3 + 1] = Math.random() * 3 + 0.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
    }
    return arr;
  }, [count]);
  const velocities = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3]     = (Math.random() - 0.5) * 0.06;
      arr[i * 3 + 1] = 0.04 + Math.random() * 0.06;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      positions[i * 3]     += velocities[i * 3]     * dt;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;
      // Re-spawn when too high
      if (positions[i * 3 + 1] > 3.4) {
        positions[i * 3]     = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = 0.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 0.5;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={vibe.accent}
        transparent
        opacity={0.45}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/* ============================================================
 * AMBIENT WINDOW LIGHT — gently breathing intensity
 * ============================================================ */
function BreathingLight() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.intensity = 0.55 + Math.sin(t * 0.45) * 0.15;
    }
  });
  return <pointLight ref={ref} position={[1.0, 2.0, -1.4]} distance={5} color="#FFE2B5" />;
}

/* ============================================================
 * FURNITURE PRIMITIVES — refined
 * ============================================================ */

function Bed({ position, tier = 'budget', vibe }) {
  const sheet = tier === 'premium' ? vibe.accent : '#F4F6F8';
  const frame = tier === 'premium' ? '#3F2A1B' : '#7A5A3A';
  return (
    <group position={position}>
      <RoundedBox args={[2.0, 0.30, 1.1]} radius={0.04} smoothness={4} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={frame} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.86, 0.28, 0.96]} radius={0.08} smoothness={4} position={[0, 0.43, 0]} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.86, 0.05, 0.96]} radius={0.06} smoothness={4} position={[0, 0.58, -0.06]} castShadow>
        <meshStandardMaterial color={sheet} roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.12, 0.34]} radius={0.06} smoothness={4} position={[0, 0.65, -0.30]} castShadow>
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[2.0, 0.7, 0.08]} radius={0.05} smoothness={4} position={[0, 0.55, -0.50]} castShadow>
        <meshStandardMaterial color={frame} roughness={0.6} />
      </RoundedBox>
      {tier === 'premium' && (
        <mesh position={[0, 0.92, -0.45]}>
          <boxGeometry args={[1.6, 0.02, 0.02]} />
          <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Wardrobe({ position, tier = 'budget', vibe }) {
  const body = tier === 'premium' ? '#2F1F14' : '#8B6B4A';
  const door = tier === 'premium' ? '#1A110A' : '#6F5037';
  return (
    <group position={position}>
      <RoundedBox args={[1.2, 1.8, 0.55]} radius={0.04} smoothness={4} position={[0, 0.9, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={body} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.55, 1.65, 0.04]} radius={0.03} position={[-0.30, 0.9, 0.30]} castShadow>
        <meshStandardMaterial color={door} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.55, 1.65, 0.04]} radius={0.03} position={[0.30, 0.9, 0.30]} castShadow>
        <meshStandardMaterial color={door} roughness={0.4} />
      </RoundedBox>
      <mesh position={[-0.05, 0.9, 0.34]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color={vibe.accent} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.05, 0.9, 0.34]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color={vibe.accent} metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Desk({ position, vibe }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.4, 0.06, 0.65]} radius={0.02} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#D5B891" roughness={0.55} />
      </RoundedBox>
      {[[-0.65, 0.38, -0.28], [0.65, 0.38, -0.28], [-0.65, 0.38, 0.28], [0.65, 0.38, 0.28]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.05, 0.75, 0.05]} />
          <meshStandardMaterial color="#3F2A1B" roughness={0.7} />
        </mesh>
      ))}
      <RoundedBox args={[0.55, 0.18, 0.5]} radius={0.02} position={[0.4, 0.62, 0]} castShadow>
        <meshStandardMaterial color="#B89366" roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

function BasicChair({ position }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.45, 0.06, 0.42]} radius={0.03} position={[0, 0.46, 0]} castShadow>
        <meshStandardMaterial color="#B89A77" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.45, 0.55, 0.05]} radius={0.03} position={[0, 0.75, -0.18]} castShadow>
        <meshStandardMaterial color="#B89A77" roughness={0.7} />
      </RoundedBox>
      {[[-0.18, 0.23, -0.16], [0.18, 0.23, -0.16], [-0.18, 0.23, 0.16], [0.18, 0.23, 0.16]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.46, 8]} />
          <meshStandardMaterial color="#3F2A1B" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function GamingChair({ position, vibe }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.30, 0.30, 0.08, 24]} />
        <meshStandardMaterial color="#0F0F12" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 16]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.55, 0.10, 0.50]} radius={0.04} position={[0, 0.66, 0]} castShadow>
        <meshStandardMaterial color="#111" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.55, 1.0, 0.10]} radius={0.05} position={[0, 1.15, -0.20]} castShadow>
        <meshStandardMaterial color="#111" roughness={0.5} />
      </RoundedBox>
      <mesh position={[-0.21, 1.15, -0.146]}>
        <boxGeometry args={[0.04, 0.95, 0.02]} />
        <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh position={[0.21, 1.15, -0.146]}>
        <boxGeometry args={[0.04, 0.95, 0.02]} />
        <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <RoundedBox args={[0.06, 0.30, 0.30]} radius={0.02} position={[-0.30, 0.85, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </RoundedBox>
      <RoundedBox args={[0.06, 0.30, 0.30]} radius={0.02} position={[0.30, 0.85, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </RoundedBox>
    </group>
  );
}

function Bookshelf({ position }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.95, 1.3, 0.30]} radius={0.02} position={[0, 0.65, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#7A5A3A" roughness={0.7} />
      </RoundedBox>
      {[0.30, 0.70, 1.10].map((y, i) => (
        <mesh key={i} position={[0, y, 0.08]} castShadow>
          <boxGeometry args={[0.85, 0.025, 0.28]} />
          <meshStandardMaterial color="#5E4427" />
        </mesh>
      ))}
      {[-0.30, -0.15, 0.05, 0.20, 0.30].map((x, i) => (
        <mesh key={`b1-${i}`} position={[x, 0.45, 0.08]}>
          <boxGeometry args={[0.06, 0.18, 0.18]} />
          <meshStandardMaterial color={['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 5]} />
        </mesh>
      ))}
      {[-0.25, -0.10, 0.10, 0.28].map((x, i) => (
        <mesh key={`b2-${i}`} position={[x, 0.85, 0.08]}>
          <boxGeometry args={[0.06, 0.18, 0.18]} />
          <meshStandardMaterial color={['#06B6D4', '#EC4899', '#F59E0B', '#10B981'][i % 4]} />
        </mesh>
      ))}
    </group>
  );
}

function UnderBedBox({ position }) {
  return (
    <RoundedBox args={[0.55, 0.20, 0.40]} radius={0.03} position={position} castShadow>
      <meshStandardMaterial color="#8B6B4A" roughness={0.85} />
    </RoundedBox>
  );
}

function DeskLamp({ position, vibe }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.10, 0.04, 24]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 0.20, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.30, 12]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0.08, 0.36, 0]} castShadow>
        <coneGeometry args={[0.10, 0.14, 16]} />
        <meshStandardMaterial color="#3a3a3a" emissive={vibe.accent} emissiveIntensity={0.6} />
      </mesh>
      <pointLight position={[0.08, 0.30, 0]} intensity={0.85} distance={2.4} color={vibe.accent} />
    </group>
  );
}

function CeilingLight({ position }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 24]} />
        <meshStandardMaterial color="#F8FAFC" emissive="#FFE8C5" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.10, 0]} intensity={1.1} distance={7} color="#FFE8C5" />
    </group>
  );
}

function LedStrips({ position, vibe }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[5.0, 0.04, 0.04]} />
        <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={4} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.30, 0.3]} intensity={0.6} distance={6} color={vibe.accent} />
    </group>
  );
}

function Curtains({ position, vibe }) {
  return (
    <group position={position}>
      <mesh position={[-0.40, -0.65, 0]} castShadow>
        <boxGeometry args={[0.70, 1.30, 0.04]} />
        <meshStandardMaterial color={vibe.accent} roughness={0.95} />
      </mesh>
      <mesh position={[0.40, -0.65, 0]} castShadow>
        <boxGeometry args={[0.70, 1.30, 0.04]} />
        <meshStandardMaterial color={vibe.accent} roughness={0.95} />
      </mesh>
    </group>
  );
}

function TableFan({ position }) {
  const ref = useRef();
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = clock.elapsedTime * 8; });
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.10, 0.10, 0.05, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.36, 12]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <group position={[0, 0.43, 0]} ref={ref}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0.10, 0, 0]}>
            <boxGeometry args={[0.20, 0.04, 0.02]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Posters({ position, vibe }) {
  return (
    <group position={position}>
      <mesh position={[-0.35, 0, 0]}>
        <boxGeometry args={[0.40, 0.55, 0.02]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0.18, 0.10, 0]}>
        <boxGeometry args={[0.35, 0.45, 0.02]} />
        <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function BluetoothSpeaker({ position, vibe }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.28, 0.16, 0.16]} radius={0.06} castShadow>
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.085]}>
        <circleGeometry args={[0.055, 32]} />
        <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

function MiniFridge({ position }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.55, 0.85, 0.55]} radius={0.04} position={[0, 0.43, 0]} castShadow>
        <meshStandardMaterial color="#F3F4F6" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      <mesh position={[-0.22, 0.43, 0.28]}>
        <boxGeometry args={[0.02, 0.20, 0.04]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.6} />
      </mesh>
    </group>
  );
}

function Mirror({ position, vibe }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.40, 1.50, 0.04]} radius={0.02} position={[0, 0.75, 0]} castShadow>
        <meshStandardMaterial color={vibe.accent} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.75, 0.022]}>
        <planeGeometry args={[0.33, 1.40]} />
        <meshStandardMaterial color="#E0F2FE" metalness={0.95} roughness={0.05} />
      </mesh>
    </group>
  );
}

const FURNITURE_MAP = {
  'bed-budget':       { Comp: Bed,           pos: [-1.10, 0,    0.20], props: { tier: 'budget' } },
  'bed-premium':      { Comp: Bed,           pos: [-1.10, 0,    0.20], props: { tier: 'premium' } },
  'wardrobe-budget':  { Comp: Wardrobe,      pos: [ 1.90, 0,   -0.95], props: { tier: 'budget' } },
  'wardrobe-premium': { Comp: Wardrobe,      pos: [ 1.90, 0,   -0.95], props: { tier: 'premium' } },
  'study-desk':       { Comp: Desk,          pos: [ 1.20, 0,    1.40], props: {} },
  'basic-chair':      { Comp: BasicChair,    pos: [ 1.20, 0,    0.90], props: {} },
  'gaming-chair':     { Comp: GamingChair,   pos: [ 1.20, 0,    0.90], props: {} },
  'bookshelf':        { Comp: Bookshelf,     pos: [-2.20, 0,   -0.50], props: {} },
  'under-bed-box':    { Comp: UnderBedBox,   pos: [-1.10, 0.10, 0.80], props: {} },
  'desk-lamp':        { Comp: DeskLamp,      pos: [ 1.55, 0.78, 1.25], props: {} },
  'ceiling-light':    { Comp: CeilingLight,  pos: [ 0,    2.55, 0   ], props: {} },
  'led-strips':       { Comp: LedStrips,     pos: [ 0,    2.45,-1.95], props: {} },
  'curtains':         { Comp: Curtains,      pos: [ 0,    2.20,-1.99], props: {} },
  'table-fan':        { Comp: TableFan,      pos: [-0.50, 0.78, 1.40], props: {} },
  'posters':          { Comp: Posters,       pos: [-0.50, 1.85,-1.99], props: {} },
  'bluetooth-speaker':{ Comp: BluetoothSpeaker, pos: [ 0.70, 0.84, 1.40], props: {} },
  'mini-fridge':      { Comp: MiniFridge,    pos: [-2.20, 0,    1.30], props: {} },
  'mirror':           { Comp: Mirror,        pos: [ 2.85, 0,    0.50], props: {} },
};

function FurnitureSpawn({ itemId, vibe }) {
  const cfg = FURNITURE_MAP[itemId];
  const { scale, yOff } = useSpring({
    from: { scale: 0.001, yOff: 1.5 },
    to:   { scale: 1, yOff: 0 },
    config: { tension: 220, friction: 16 },
  });
  if (!cfg) return null;
  const Comp = cfg.Comp;
  return (
    <animated.group scale={scale} position-y={yOff}>
      <Comp position={cfg.pos} vibe={vibe} {...cfg.props} />
    </animated.group>
  );
}

/* ============================================================
 * ROOM SHELL — floor with subtle grain, walls, baseboards, window
 * ============================================================ */
function RoomShell({ vibe }) {
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: vibe.wall, roughness: 0.98 }), [vibe.wall]);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: vibe.floor, roughness: 0.85, metalness: 0.0 }), [vibe.floor]);
  /* Random dust/scuff splotches on the floor — lazily generated once. */
  const scuffs = useMemo(() => {
    // deterministic-ish layout so they don't change on re-render
    const pts = [
      [-2.6, 1.4], [-1.8, -0.7], [0.5, -1.2], [1.9, 0.6], [2.4, -1.5], [-3.1, -0.3],
      [-0.8, 1.8], [0.2, 0.4], [1.2, -0.5], [-2.0, 0.9], [3.0, 0.0], [-1.2, -1.6],
    ];
    return pts.map(([x, z]) => ({ x, z, size: 0.18 + Math.abs(Math.sin(x * z)) * 0.32 }));
  }, []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      {/* Dust + scuff splotches — soft dark blobs at floor level */}
      {scuffs.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[s.x, 0.005, s.z]}>
          <circleGeometry args={[s.size, 24]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.10} depthWrite={false} />
        </mesh>
      ))}
      {/* Faint wall patina/stains — two large soft blobs on the back wall */}
      <mesh position={[-1.8, 1.4, -1.99]}>
        <planeGeometry args={[1.6, 1.2]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <mesh position={[2.2, 0.8, -1.99]}>
        <planeGeometry args={[1.2, 1.6]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 1.6, -2]} receiveShadow>
        <planeGeometry args={[8, 3.2]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {/* Right wall */}
      <mesh position={[4, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3.2]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      {/* Baseboard — slightly off-white so it reads as old paint */}
      <mesh position={[0, 0.08, -1.98]}>
        <boxGeometry args={[8, 0.16, 0.04]} />
        <meshStandardMaterial color="#F5EDD8" />
      </mesh>
      {/* Window pane (glows softly to suggest daylight) */}
      <mesh position={[1.0, 1.7, -1.985]}>
        <planeGeometry args={[1.4, 1.0]} />
        <meshStandardMaterial color="#DEEFFF" emissive="#FFFFFF" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* Window frame cross */}
      <mesh position={[1.0, 1.7, -1.98]}>
        <boxGeometry args={[0.04, 1.0, 0.02]} />
        <meshStandardMaterial color="#F5EDD8" />
      </mesh>
      <mesh position={[1.0, 1.7, -1.98]}>
        <boxGeometry args={[1.4, 0.04, 0.02]} />
        <meshStandardMaterial color="#F5EDD8" />
      </mesh>
      {/* Crack hint on the wall — single thin dark line */}
      <mesh position={[-2.4, 2.2, -1.99]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.012, 0.55, 0.001]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/* ============================================================
 * PUBLIC — <Room3D />
 * ============================================================ */
/* Map screen-id-derived `shot` value to a character pose. */
const POSE_FOR_SHOT = {
  hero: 'intro', rules: 'rules', sort: 'sort', shop: 'shop', events: 'events', snapshot: 'snapshot',
};

export function Room3D({
  vibeId = 'cosy', purchasedIds = [], shot = 'hero', orbit = false,
  showCharacter = true, speaking = false,
}) {
  const vibe = VIBES[vibeId] || VIBES.cosy;
  const pose = POSE_FOR_SHOT[shot] || 'intro';
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: SHOTS.hero.pos, fov: 42 }}
      gl={{ antialias: true, toneMappingExposure: 1.2 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[vibe.bg]} />
      <SoftShadows samples={8} size={32} focus={0} />

      {/* Lights */}
      <ambientLight intensity={0.40} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0008}
      />
      {/* Warm window light — gently breathes */}
      <BreathingLight />
      {/* Cool fill bouncing off opposite wall */}
      <pointLight position={[-3, 2.4, 3]} intensity={0.25} distance={8} color="#BFDBFE" />

      <Environment preset={vibe.sky} />

      {/* Room */}
      <RoomShell vibe={vibe} />
      <AccumulativeShadows position={[0, 0.005, 0]} scale={9} opacity={0.55} temporal frames={32} alphaTest={0.9}>
        <RandomizedLight amount={6} position={[5, 5, -5]} radius={4} ambient={0.45} intensity={1.0} />
      </AccumulativeShadows>
      <ContactShadows position={[0, 0.015, 0]} opacity={0.35} scale={12} blur={2.8} far={4} />

      {/* Drifting dust motes — ambient room motion */}
      <DustMotes count={140} vibe={vibe} />

      {/* In-room character — Maya the architect, scaled up + accent spotlight */}
      {showCharacter && (
        <>
          <group position={[-2.4, 0, 1.6]} scale={1.0}>
            <Character3D position={[0, 0, 0]} pose={pose} vibe={vibe} speaking={speaking} />
          </group>
          {/* Soft accent spotlight pinned on Maya — anchors the eye */}
          <spotLight
            position={[-2.4, 4.2, 2.8]}
            target-position={[-2.4, 1.0, 1.6]}
            angle={0.45}
            penumbra={0.7}
            intensity={1.4}
            distance={6}
            decay={1.4}
            color={vibe.accent}
            castShadow={false}
          />
          {/* Subtle floor halo under her */}
          <mesh position={[-2.4, 0.025, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.62, 48]} />
            <meshStandardMaterial
              color={vibe.accent}
              emissive={vibe.accent}
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {/* Purchased items */}
      {purchasedIds.map((id) => (
        <FurnitureSpawn key={id} itemId={id} vibe={vibe} />
      ))}

      {/* Floating accent ring on the floor — subtle visual anchor */}
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.1}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.4, 2.42, 64]} />
          <meshStandardMaterial color={vibe.accent} emissive={vibe.accent} emissiveIntensity={0.6} transparent opacity={0.4} toneMapped={false} />
        </mesh>
      </Float>

      <CameraRig shot={shot} orbit={orbit} />

      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom intensity={0.85} luminanceThreshold={0.65} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.5} />
        <ToneMapping />
      </EffectComposer>
    </Canvas>
  );
}

export { VIBES };
