/**
 * SortItem3D — tiny 3D models for each of the 14 sort-game items.
 *
 * One Canvas per visible card (only one item visible at a time, so just
 * one WebGL context). Each item maps to a small primitive composition
 * with consistent lighting and a slowly-orbiting view. Lightweight on
 * purpose — these need to render at 60fps alongside the rest of the UI.
 */
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox, Float, PerspectiveCamera, ContactShadows } from '@react-three/drei';

/* ---- Reusable stage that auto-rotates + lights every model ---- */
function Stage({ children }) {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.45; });
  return (
    <>
      <PerspectiveCamera makeDefault position={[2.2, 1.6, 2.6]} fov={36} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 3]} intensity={1.0} castShadow />
      <Environment preset="apartment" />
      <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={4} blur={2} far={2} />
      <group ref={ref}>
        <Float speed={1.2} floatIntensity={0.15} rotationIntensity={0.05}>
          {children}
        </Float>
      </group>
    </>
  );
}

/* ============================================================
 * 14 ITEM MODELS — kept tiny, recognizable, consistent scale
 * ============================================================ */

function BedModel() {
  return (
    <group position={[-0.05, -0.1, 0]}>
      <RoundedBox args={[1.6, 0.20, 0.95]} radius={0.04} position={[0, 0.10, 0]} castShadow>
        <meshStandardMaterial color="#7A5A3A" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.50, 0.18, 0.85]} radius={0.05} position={[0, 0.30, 0]} castShadow>
        <meshStandardMaterial color="#FAFAFA" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.50, 0.04, 0.85]} radius={0.04} position={[0, 0.41, -0.04]}>
        <meshStandardMaterial color="#94A3B8" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.10, 0.26]} radius={0.05} position={[0, 0.48, -0.28]}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.6, 0.55, 0.06]} radius={0.04} position={[0, 0.5, -0.45]}>
        <meshStandardMaterial color="#7A5A3A" roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

function DeskModel() {
  return (
    <group position={[0, -0.1, 0]}>
      <RoundedBox args={[1.6, 0.06, 0.7]} radius={0.02} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial color="#D5B891" roughness={0.55} />
      </RoundedBox>
      {[[-0.75, 0.39, -0.30], [0.75, 0.39, -0.30], [-0.75, 0.39, 0.30], [0.75, 0.39, 0.30]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.06, 0.78, 0.06]} />
          <meshStandardMaterial color="#3F2A1B" roughness={0.7} />
        </mesh>
      ))}
      <RoundedBox args={[0.55, 0.18, 0.55]} radius={0.02} position={[0.45, 0.65, 0]} castShadow>
        <meshStandardMaterial color="#B89366" roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

function GamingChairModel() {
  return (
    <group position={[0, -0.1, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 24]} />
        <meshStandardMaterial color="#0F0F12" />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
        <meshStandardMaterial color="#222" metalness={0.7} />
      </mesh>
      <RoundedBox args={[0.65, 0.12, 0.6]} radius={0.05} position={[0, 0.66, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </RoundedBox>
      <RoundedBox args={[0.65, 1.0, 0.12]} radius={0.06} position={[0, 1.20, -0.24]} castShadow>
        <meshStandardMaterial color="#111" />
      </RoundedBox>
      {/* RGB strips */}
      <mesh position={[-0.24, 1.20, -0.17]}>
        <boxGeometry args={[0.04, 0.95, 0.02]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0.24, 1.20, -0.17]}>
        <boxGeometry args={[0.04, 0.95, 0.02]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* armrests */}
      <RoundedBox args={[0.07, 0.30, 0.30]} radius={0.02} position={[-0.34, 0.88, 0]}>
        <meshStandardMaterial color="#111" />
      </RoundedBox>
      <RoundedBox args={[0.07, 0.30, 0.30]} radius={0.02} position={[0.34, 0.88, 0]}>
        <meshStandardMaterial color="#111" />
      </RoundedBox>
    </group>
  );
}

function WardrobeModel({ premium = false }) {
  const body = premium ? '#3B2A1F' : '#8B6B4A';
  const door = premium ? '#231911' : '#6F5037';
  return (
    <group position={[0, -0.5, 0]}>
      <RoundedBox args={[1.0, 1.6, 0.55]} radius={0.04} position={[0, 0.8, 0]} castShadow>
        <meshStandardMaterial color={body} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[0.46, 1.50, 0.04]} radius={0.03} position={[-0.24, 0.8, 0.30]} castShadow>
        <meshStandardMaterial color={door} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.46, 1.50, 0.04]} radius={0.03} position={[0.24, 0.8, 0.30]} castShadow>
        <meshStandardMaterial color={door} roughness={0.4} />
      </RoundedBox>
      <mesh position={[-0.05, 0.8, 0.34]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.05, 0.8, 0.34]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#FACC15" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function LedStripsModel() {
  return (
    <group position={[0, 0, 0]}>
      {/* coiled strip on a spool */}
      <mesh>
        <torusGeometry args={[0.45, 0.06, 16, 64]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.45, 0.06, 16, 64]} />
        <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.06, 16, 64]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={0.8} distance={2.5} color="#8B5CF6" />
    </group>
  );
}

function DeskLampModel() {
  return (
    <group position={[0, -0.4, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.8, 12]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0.20, 0.90, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <coneGeometry args={[0.18, 0.25, 24]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <pointLight position={[0.20, 0.78, 0]} intensity={1.4} distance={2.6} color="#FFE2B5" />
    </group>
  );
}

function SpeakerModel() {
  return (
    <group position={[0, -0.1, 0]}>
      <RoundedBox args={[0.45, 0.30, 0.30]} radius={0.06} castShadow>
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.155]}>
        <circleGeometry args={[0.10, 32]} />
        <meshStandardMaterial color="#0a0c14" />
      </mesh>
      <mesh position={[0, 0, 0.158]}>
        <circleGeometry args={[0.06, 32]} />
        <meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.10, 0.158]}>
        <circleGeometry args={[0.018, 16]} />
        <meshStandardMaterial color="#FACC15" emissive="#FACC15" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CurtainsModel() {
  return (
    <group position={[0, -0.8, 0]}>
      {/* Rod */}
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 1.8, 12]} />
        <meshStandardMaterial color="#3F2A1B" />
      </mesh>
      {/* Left panel */}
      <mesh position={[-0.45, 0.75, 0]} castShadow>
        <boxGeometry args={[0.78, 1.55, 0.06]} />
        <meshStandardMaterial color="#10B981" roughness={0.95} />
      </mesh>
      {/* Right panel */}
      <mesh position={[0.45, 0.75, 0]} castShadow>
        <boxGeometry args={[0.78, 1.55, 0.06]} />
        <meshStandardMaterial color="#10B981" roughness={0.95} />
      </mesh>
      {/* Window pane behind */}
      <mesh position={[0, 0.75, -0.05]}>
        <planeGeometry args={[1.4, 1.5]} />
        <meshStandardMaterial color="#BFDBFE" emissive="#DBEAFE" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

function BookshelfModel() {
  return (
    <group position={[0, -0.5, 0]}>
      <RoundedBox args={[0.95, 1.4, 0.32]} radius={0.02} position={[0, 0.7, 0]} castShadow>
        <meshStandardMaterial color="#7A5A3A" roughness={0.7} />
      </RoundedBox>
      {[0.30, 0.72, 1.14].map((y, i) => (
        <mesh key={i} position={[0, y, 0.08]}>
          <boxGeometry args={[0.85, 0.025, 0.30]} />
          <meshStandardMaterial color="#5E4427" />
        </mesh>
      ))}
      {[-0.30, -0.15, 0.05, 0.20, 0.30].map((x, i) => (
        <mesh key={`b1-${i}`} position={[x, 0.48, 0.08]}>
          <boxGeometry args={[0.06, 0.18, 0.20]} />
          <meshStandardMaterial color={['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 5]} />
        </mesh>
      ))}
      {[-0.25, -0.10, 0.10, 0.28].map((x, i) => (
        <mesh key={`b2-${i}`} position={[x, 0.92, 0.08]}>
          <boxGeometry args={[0.06, 0.18, 0.20]} />
          <meshStandardMaterial color={['#06B6D4', '#EC4899', '#F59E0B', '#10B981'][i % 4]} />
        </mesh>
      ))}
    </group>
  );
}

function MiniFridgeModel() {
  return (
    <group position={[0, -0.4, 0]}>
      <RoundedBox args={[0.65, 0.95, 0.55]} radius={0.04} position={[0, 0.48, 0]} castShadow>
        <meshStandardMaterial color="#F3F4F6" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.65, 0.276]}>
        <boxGeometry args={[0.6, 0.01, 0.005]} />
        <meshStandardMaterial color="#9CA3AF" />
      </mesh>
      <mesh position={[-0.27, 0.48, 0.28]}>
        <boxGeometry args={[0.02, 0.20, 0.04]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.6} />
      </mesh>
      {/* logo */}
      <mesh position={[0, 0.32, 0.28]}>
        <planeGeometry args={[0.10, 0.04]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
    </group>
  );
}

function BasicChairModel() {
  return (
    <group position={[0, -0.1, 0]}>
      <RoundedBox args={[0.55, 0.06, 0.50]} radius={0.03} position={[0, 0.54, 0]} castShadow>
        <meshStandardMaterial color="#B89A77" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.55, 0.65, 0.05]} radius={0.03} position={[0, 0.90, -0.22]} castShadow>
        <meshStandardMaterial color="#B89A77" roughness={0.7} />
      </RoundedBox>
      {[[-0.22, 0.27, -0.20], [0.22, 0.27, -0.20], [-0.22, 0.27, 0.20], [0.22, 0.27, 0.20]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.54, 8]} />
          <meshStandardMaterial color="#3F2A1B" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function PostersModel() {
  return (
    <group position={[0, 0, 0]}>
      {/* Frame 1 (left) */}
      <mesh position={[-0.40, 0.05, 0]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[-0.40, 0.05, 0.022]} rotation={[0, 0.1, 0]}>
        <planeGeometry args={[0.40, 0.60]} />
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.2} />
      </mesh>
      {/* Frame 2 (right) */}
      <mesh position={[0.30, 0.15, 0]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.45, 0.55, 0.04]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[0.30, 0.15, 0.022]} rotation={[0, -0.1, 0]}>
        <planeGeometry args={[0.36, 0.45]} />
        <meshStandardMaterial color="#FACC15" emissive="#FACC15" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function TableFanModel() {
  const ref = useRef();
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = clock.elapsedTime * 12; });
  return (
    <group position={[0, -0.4, 0]}>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.20, 0.06, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.70, 12]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <torusGeometry args={[0.30, 0.020, 8, 32]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.6} />
      </mesh>
      <group position={[0, 0.85, 0]} ref={ref}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 4]} position={[0.15, 0, 0]}>
            <boxGeometry args={[0.28, 0.07, 0.02]} />
            <meshStandardMaterial color="#E5E7EB" />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>
    </group>
  );
}

/* ---- itemId → model mapping ---- */
const ITEM_MODELS = {
  'bed-mattress':       BedModel,
  'study-desk':         DeskModel,
  'gaming-chair':       GamingChairModel,
  'wardrobe':           () => <WardrobeModel premium />,
  'led-strips':         LedStripsModel,
  'desk-lamp':          DeskLampModel,
  'wardrobe-budget':    () => <WardrobeModel premium={false} />,
  'bluetooth-speaker':  SpeakerModel,
  'curtains':           CurtainsModel,
  'bookshelf':          BookshelfModel,
  'mini-fridge':        MiniFridgeModel,
  'basic-chair':        BasicChairModel,
  'poster-set':         PostersModel,
  'table-fan':          TableFanModel,
};

export function SortItem3D({ itemId }) {
  const Model = ITEM_MODELS[itemId] || BedModel;
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Stage>
        <Model />
      </Stage>
    </Canvas>
  );
}
