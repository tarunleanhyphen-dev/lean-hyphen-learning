/**
 * VibeMini — tiny 3D preview scenes for the 4 room vibes.
 *
 * Each scene is a small primitive composition (one Canvas, multiple views
 * via drei's <View>) so we only spin up a single WebGL context for all
 * four cards. Each preview auto-orbits slowly, lights up on hover, and
 * reflects the vibe's accent color.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, RoundedBox, Float } from '@react-three/drei';

const VIBE_THEME = {
  cosy:    { wall: '#FBE5C8', floor: '#A57B5B', accent: '#F59E0B', light: '#FFE2B5' },
  study:   { wall: '#E6EBE0', floor: '#B6926A', accent: '#10B981', light: '#FFFFFF' },
  gamer:   { wall: '#11132A', floor: '#0A0C1A', accent: '#8B5CF6', light: '#A78BFA' },
  minimal: { wall: '#F8FAFC', floor: '#D6CCC2', accent: '#06B6D4', light: '#E0F2FE' },
};

/* ----- Shared mini-room shell ----- */
function MiniRoom({ theme, hovered }) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color={theme.floor} roughness={0.7} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 0.9, -1.2]}>
        <planeGeometry args={[4, 1.8]} />
        <meshStandardMaterial color={theme.wall} roughness={0.95} />
      </mesh>
      {/* Side wall */}
      <mesh position={[1.6, 0.9, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 1.8]} />
        <meshStandardMaterial color={theme.wall} roughness={0.95} />
      </mesh>
      {/* Subtle floor halo at center */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={hovered ? 0.45 : 0.18} transparent opacity={0.18} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ----- COSY: bed + lamp + warm pillow ----- */
function CosyMini({ hovered }) {
  const t = VIBE_THEME.cosy;
  return (
    <group>
      <MiniRoom theme={t} hovered={hovered} />
      {/* Bed frame */}
      <RoundedBox args={[1.4, 0.20, 0.85]} radius={0.04} position={[-0.4, 0.10, 0.15]}>
        <meshStandardMaterial color="#7A5A3A" roughness={0.7} />
      </RoundedBox>
      {/* Mattress */}
      <RoundedBox args={[1.30, 0.18, 0.75]} radius={0.05} position={[-0.4, 0.28, 0.15]}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </RoundedBox>
      {/* Sheet */}
      <RoundedBox args={[1.30, 0.04, 0.75]} radius={0.04} position={[-0.4, 0.38, 0.10]}>
        <meshStandardMaterial color={t.accent} roughness={0.85} />
      </RoundedBox>
      {/* Pillow */}
      <RoundedBox args={[0.55, 0.10, 0.25]} radius={0.05} position={[-0.4, 0.42, -0.18]}>
        <meshStandardMaterial color="#FFE9CC" roughness={0.95} />
      </RoundedBox>
      {/* Headboard */}
      <RoundedBox args={[1.4, 0.55, 0.06]} radius={0.04} position={[-0.4, 0.45, -0.30]}>
        <meshStandardMaterial color="#7A5A3A" roughness={0.6} />
      </RoundedBox>
      {/* Nightstand */}
      <RoundedBox args={[0.32, 0.40, 0.32]} radius={0.03} position={[0.55, 0.20, 0]}>
        <meshStandardMaterial color="#8B6B4A" roughness={0.7} />
      </RoundedBox>
      {/* Warm lamp */}
      <group position={[0.55, 0.45, 0]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.16, 12]} />
          <meshStandardMaterial color="#5C3A1B" />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <coneGeometry args={[0.14, 0.16, 16]} />
          <meshStandardMaterial color={t.light} emissive={t.light} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.10, 0]} intensity={hovered ? 1.6 : 0.9} distance={2.2} color={t.light} />
      </group>
      {/* Throw rug under bed */}
      <mesh position={[-0.4, 0.005, 0.55]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[1.7, 0.65]} />
        <meshStandardMaterial color="#8B4513" roughness={0.95} />
      </mesh>
      <mesh position={[-0.4, 0.006, 0.55]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshStandardMaterial color={t.accent} roughness={0.9} />
      </mesh>
      {/* Throw blanket on bed */}
      <RoundedBox args={[1.0, 0.04, 0.30]} radius={0.04} position={[-0.4, 0.40, 0.30]}>
        <meshStandardMaterial color="#B45309" roughness={0.95} />
      </RoundedBox>
      {/* Two candles on nightstand */}
      <group position={[0.50, 0.42, -0.05]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <coneGeometry args={[0.02, 0.05, 8]} />
          <meshStandardMaterial color="#FACC15" emissive="#FACC15" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>
      <group position={[0.62, 0.42, 0.05]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.06, 8]} />
          <meshStandardMaterial color="#FEF3C7" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <coneGeometry args={[0.02, 0.05, 8]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>
      {/* Hanging plant */}
      <Float speed={0.6} floatIntensity={0.08}>
        <group position={[1.1, 1.3, -0.6]}>
          <mesh>
            <cylinderGeometry args={[0.10, 0.08, 0.10, 12]} />
            <meshStandardMaterial color="#92400E" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.10, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#10B981" roughness={0.6} />
          </mesh>
          <mesh position={[-0.05, -0.18, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color="#059669" roughness={0.6} />
          </mesh>
        </group>
      </Float>
      {/* Wall art behind bed */}
      <mesh position={[-0.4, 1.15, -1.18]}>
        <boxGeometry args={[0.45, 0.30, 0.02]} />
        <meshStandardMaterial color={t.accent} roughness={0.5} emissive={t.accent} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

/* ----- STUDY: desk + chair + lamp + bookshelf ----- */
function StudyMini({ hovered }) {
  const t = VIBE_THEME.study;
  return (
    <group>
      <MiniRoom theme={t} hovered={hovered} />
      {/* Desk top */}
      <RoundedBox args={[1.50, 0.05, 0.55]} radius={0.02} position={[-0.20, 0.78, 0]}>
        <meshStandardMaterial color="#D5B891" roughness={0.55} />
      </RoundedBox>
      {/* Desk legs */}
      {[[-0.85, 0.40, -0.22], [0.45, 0.40, -0.22], [-0.85, 0.40, 0.22], [0.45, 0.40, 0.22]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.05, 0.78, 0.05]} />
          <meshStandardMaterial color="#3F2A1B" roughness={0.7} />
        </mesh>
      ))}
      {/* Chair */}
      <RoundedBox args={[0.50, 0.06, 0.42]} radius={0.03} position={[-0.20, 0.48, 0.55]}>
        <meshStandardMaterial color="#B89A77" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.50, 0.55, 0.05]} radius={0.03} position={[-0.20, 0.78, 0.75]}>
        <meshStandardMaterial color="#B89A77" roughness={0.7} />
      </RoundedBox>
      {/* Desk lamp */}
      <group position={[0.30, 0.85, -0.10]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 12]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.30, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0.08, 0.34, 0]}>
          <coneGeometry args={[0.08, 0.12, 12]} />
          <meshStandardMaterial color="#fff" emissive={t.light} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <pointLight position={[0.08, 0.28, 0]} intensity={hovered ? 1.2 : 0.7} distance={1.5} color="#FFFFFF" />
      </group>
      {/* Bookshelf */}
      <RoundedBox args={[0.18, 1.20, 0.65]} radius={0.02} position={[1.20, 0.60, 0]}>
        <meshStandardMaterial color="#7A5A3A" roughness={0.7} />
      </RoundedBox>
      {/* Books */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[1.20, 0.42 + i * 0.36, 0.10]}>
          <boxGeometry args={[0.15, 0.18, 0.30]} />
          <meshStandardMaterial color={['#10B981', '#3B82F6', '#F59E0B'][i]} />
        </mesh>
      ))}
      {/* Plant */}
      <mesh position={[-1.10, 0.16, 0.20]}>
        <cylinderGeometry args={[0.12, 0.10, 0.16, 12]} />
        <meshStandardMaterial color="#4B5563" />
      </mesh>
      <mesh position={[-1.10, 0.36, 0.20]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={t.accent} roughness={0.7} />
      </mesh>
      {/* Coffee mug on desk */}
      <group position={[-0.55, 0.86, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.035, 0.08, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <torusGeometry args={[0.018, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
        </mesh>
        {/* Coffee top */}
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.005, 16]} />
          <meshStandardMaterial color="#4B2E1C" roughness={0.8} />
        </mesh>
      </group>
      {/* Open notebook on desk */}
      <RoundedBox args={[0.22, 0.01, 0.16]} radius={0.005} position={[0.05, 0.81, 0]}>
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </RoundedBox>
      {/* Tiny pencil */}
      <mesh position={[0.18, 0.815, 0.04]} rotation={[0, 0, Math.PI / 8]}>
        <cylinderGeometry args={[0.006, 0.006, 0.10, 8]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>
      {/* Stacked books on shelf top */}
      <mesh position={[1.20, 1.30, 0.10]}>
        <boxGeometry args={[0.15, 0.04, 0.30]} />
        <meshStandardMaterial color="#7C3AED" />
      </mesh>
      <mesh position={[1.20, 1.36, 0.10]}>
        <boxGeometry args={[0.15, 0.04, 0.28]} />
        <meshStandardMaterial color="#EC4899" />
      </mesh>
      {/* Wall clock */}
      <mesh position={[0.50, 1.40, -1.18]}>
        <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      <mesh position={[0.50, 1.40, -1.16]}>
        <cylinderGeometry args={[0.11, 0.11, 0.005, 24]} />
        <meshStandardMaterial color="#F8FAFC" />
      </mesh>
      <mesh position={[0.50, 1.46, -1.155]}>
        <boxGeometry args={[0.008, 0.05, 0.005]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[0.50, 1.40, -1.155]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.06, 0.006, 0.005]} />
        <meshStandardMaterial color={t.accent} />
      </mesh>
    </group>
  );
}

/* ----- GAMER: gaming chair + monitor + LED strips ----- */
function GamerMini({ hovered }) {
  const t = VIBE_THEME.gamer;
  return (
    <group>
      <MiniRoom theme={t} hovered={hovered} />
      {/* Desk */}
      <RoundedBox args={[1.40, 0.05, 0.55]} radius={0.02} position={[-0.10, 0.76, -0.10]}>
        <meshStandardMaterial color="#1F2937" roughness={0.6} />
      </RoundedBox>
      {/* Monitor */}
      <RoundedBox args={[0.95, 0.55, 0.04]} radius={0.03} position={[-0.10, 1.18, -0.30]}>
        <meshStandardMaterial color="#0a0c14" />
      </RoundedBox>
      {/* Screen content */}
      <mesh position={[-0.10, 1.18, -0.27]}>
        <planeGeometry args={[0.85, 0.45]} />
        <meshStandardMaterial color="#000" emissive={t.accent} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[-0.10, 0.86, -0.30]}>
        <cylinderGeometry args={[0.05, 0.07, 0.16, 12]} />
        <meshStandardMaterial color="#0a0c14" />
      </mesh>
      {/* Gaming chair */}
      <group position={[-0.10, 0, 0.55]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.06, 16]} />
          <meshStandardMaterial color="#0a0c14" />
        </mesh>
        <mesh position={[0, 0.30, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 10]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <RoundedBox args={[0.60, 0.10, 0.50]} radius={0.04} position={[0, 0.55, 0]}>
          <meshStandardMaterial color="#111" />
        </RoundedBox>
        <RoundedBox args={[0.60, 1.0, 0.10]} radius={0.05} position={[0, 1.05, 0.20]}>
          <meshStandardMaterial color="#111" />
        </RoundedBox>
        {/* RGB strips on back of chair */}
        <mesh position={[-0.25, 1.05, 0.155]}>
          <boxGeometry args={[0.04, 0.95, 0.02]} />
          <meshStandardMaterial color={t.accent} emissive={t.accent} emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <mesh position={[0.25, 1.05, 0.155]}>
          <boxGeometry args={[0.04, 0.95, 0.02]} />
          <meshStandardMaterial color={t.accent} emissive={t.accent} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </group>
      {/* LED strip on back wall */}
      <mesh position={[0, 1.55, -1.18]}>
        <boxGeometry args={[3.6, 0.05, 0.04]} />
        <meshStandardMaterial color={t.accent} emissive={t.accent} emissiveIntensity={4} toneMapped={false} />
      </mesh>
      {/* RGB keyboard on desk */}
      <RoundedBox args={[0.55, 0.04, 0.18]} radius={0.015} position={[-0.10, 0.80, 0.05]}>
        <meshStandardMaterial color="#0a0c14" roughness={0.5} />
      </RoundedBox>
      {/* Keyboard underglow */}
      <mesh position={[-0.10, 0.78, 0.05]}>
        <boxGeometry args={[0.56, 0.005, 0.19]} />
        <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={3.5} toneMapped={false} />
      </mesh>
      {/* Mouse on desk */}
      <RoundedBox args={[0.07, 0.025, 0.10]} radius={0.012} position={[0.30, 0.79, 0.05]}>
        <meshStandardMaterial color="#0a0c14" roughness={0.6} />
      </RoundedBox>
      {/* Headphones hanging on monitor */}
      <group position={[0.45, 1.40, -0.27]}>
        <mesh rotation={[0, 0, Math.PI / 6]}>
          <torusGeometry args={[0.10, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#0a0c14" roughness={0.6} />
        </mesh>
        <mesh position={[-0.08, -0.05, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.6} />
        </mesh>
        <mesh position={[0.04, -0.10, 0]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.6} />
        </mesh>
      </group>
      {/* Soda can */}
      <mesh position={[-0.70, 0.85, 0.05]}>
        <cylinderGeometry args={[0.04, 0.04, 0.13, 16]} />
        <meshStandardMaterial color="#EF4444" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Pulsing floor LED ring */}
      <mesh position={[-0.10, 0.012, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.60, 48]} />
        <meshStandardMaterial color={t.accent} emissive={t.accent} emissiveIntensity={2.2} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.1, -0.6]} intensity={hovered ? 1.6 : 0.9} distance={2.5} color={t.accent} />
      <pointLight position={[-0.10, 0.4, 0.4]} intensity={hovered ? 0.9 : 0.5} distance={1.8} color="#EC4899" />
    </group>
  );
}

/* ----- MINIMALIST: bed + single artwork ----- */
function MinimalMini({ hovered }) {
  const t = VIBE_THEME.minimal;
  return (
    <group>
      <MiniRoom theme={t} hovered={hovered} />
      {/* Low platform bed */}
      <RoundedBox args={[1.5, 0.12, 0.90]} radius={0.03} position={[-0.2, 0.06, 0.15]}>
        <meshStandardMaterial color="#D6CCC2" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.40, 0.18, 0.80]} radius={0.04} position={[-0.2, 0.20, 0.15]}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.40, 0.04, 0.80]} radius={0.04} position={[-0.2, 0.30, 0.10]}>
        <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.65, 0.10, 0.28]} radius={0.05} position={[-0.2, 0.34, -0.18]}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </RoundedBox>
      {/* Single artwork */}
      <mesh position={[-0.5, 1.25, -1.18]}>
        <boxGeometry args={[0.55, 0.4, 0.02]} />
        <meshStandardMaterial color={t.accent} roughness={0.4} />
      </mesh>
      {/* Single plant */}
      <mesh position={[0.95, 0.16, 0]}>
        <cylinderGeometry args={[0.10, 0.08, 0.15, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <Float speed={1.2} floatIntensity={0.15}>
        <mesh position={[0.95, 0.40, 0]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={t.accent} roughness={0.6} />
        </mesh>
      </Float>
      {/* Floor lamp — tall thin */}
      <group position={[-1.30, 0, 0.3]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.10, 0.10, 0.04, 16]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0.70, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.30, 8]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 1.42, 0]}>
          <cylinderGeometry args={[0.16, 0.08, 0.18, 16]} />
          <meshStandardMaterial color={t.accent} emissive={t.accent} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      </group>
      {/* Geometric sculpture on the floor */}
      <Float speed={0.5} rotationIntensity={0.4}>
        <mesh position={[0.30, 0.18, 0.70]}>
          <icosahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#E5E7EB" roughness={0.5} metalness={0.2} />
        </mesh>
      </Float>
      {/* Simple round rug */}
      <mesh position={[-0.2, 0.005, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.95} />
      </mesh>
      <pointLight position={[0.5, 1.4, 0.5]} intensity={hovered ? 0.9 : 0.6} distance={3} color="#FFFFFF" />
      <pointLight position={[-1.30, 1.42, 0.3]} intensity={hovered ? 1.2 : 0.7} distance={2.4} color={t.accent} />
    </group>
  );
}

const VIBE_COMPONENTS = {
  cosy: CosyMini,
  study: StudyMini,
  gamer: GamerMini,
  minimal: MinimalMini,
};

/* Auto-rotating wrapper that holds the camera and the chosen scene. */
export function VibeMini({ vibeId, hovered = false, selected = false }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    const speed = hovered || selected ? 0.6 : 0.25;
    ref.current.rotation.y += speed * dt;
  });
  const Comp = VIBE_COMPONENTS[vibeId] || CosyMini;
  return (
    <>
      <PerspectiveCamera makeDefault position={[2.6, 2.2, 3.0]} fov={36} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} />
      <group ref={ref}>
        <Comp hovered={hovered || selected} />
      </group>
    </>
  );
}
