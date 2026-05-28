import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Low-poly 3D character built from primitives — sphere head + capsule body +
 * basic facial features. Designed to feel "Memoji-like" without needing a
 * GLB model. Each character has a palette that distinguishes Ritwik (teen,
 * blue hoodie) from Mom (warm orange kurta) from System (cyan glowing orb).
 *
 * Drives:
 *   - Idle: gentle bob + slow breath scale
 *   - Speaking: mouth opens/closes from amplitudeRef.current
 *   - Emotion: brow + eye shape swap by `emotion` prop
 *   - Lookat: head + body softly turn to the active speaker
 *   - shocked / realised: stronger pose change
 *
 * Anchored at y=0; head world position is exposed via `headRef` so the
 * Scene wrapper can place a pointer speech-bubble above the right character.
 */

const PALETTES = {
  ritwik: {
    skin: '#E8B98A',
    hair: '#2A1810',
    top: '#2563EB',         // blue hoodie
    accent: '#1E3A8A',      // hoodie shadow
    mouth: '#7B2933',
    eye: '#1A1426',
    name: 'Ritwik',
  },
  mom: {
    skin: '#E0A878',
    hair: '#1F1109',
    top: '#E76F51',         // warm orange kurta
    accent: '#B0492F',
    mouth: '#7B2933',
    eye: '#1A1426',
    name: 'Mom',
  },
  system: {
    skin: '#22D3EE',
    hair: 'transparent',
    top: '#0EA5E9',
    accent: '#1E3A8A',
    mouth: '#FDE047',
    eye: '#FDE047',
    name: 'System',
  },
};

export default function Character3D({
  who = 'ritwik',
  position = [0, 0, 0],
  facing = 0,                    // radians around y
  speaking = false,
  amplitudeRef,
  emotion = 'neutral',
  scale = 1,
  headRef,
}) {
  const palette = PALETTES[who] || PALETTES.ritwik;

  const group = useRef();
  const head = useRef();
  const body = useRef();
  const mouth = useRef();
  const leftBrow = useRef();
  const rightBrow = useRef();
  const leftEye = useRef();
  const rightEye = useRef();

  // For mom's bob / cooking gesture — track over time
  const tRef = useRef(0);
  // Stable per-character phase so multiple characters don't bob in sync
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((_, dt) => {
    tRef.current += dt;
    const t = tRef.current;

    // Breath + bob
    if (body.current) {
      body.current.scale.y = 1 + Math.sin(t * 1.4 + phase) * 0.012;
    }
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 1.2 + phase) * 0.015;
      // Soft head turn to facing target
      const wantY = facing;
      group.current.rotation.y += (wantY - group.current.rotation.y) * 0.08;
    }
    if (head.current) {
      // Slight head sway while talking
      const sway = speaking ? Math.sin(t * 3) * 0.025 : 0;
      head.current.rotation.z = sway;
      head.current.position.y = 0.78 + Math.sin(t * 1.8 + phase) * 0.008;
    }

    // Mouth amplitude (open / close)
    if (mouth.current) {
      const a = speaking ? Math.min(0.9, Math.max(0, (amplitudeRef?.current ?? 0) * 2.5)) : 0;
      const open = 0.04 + a * 0.10;
      // mouth is a small box; animate its y-scale to suggest open lips
      mouth.current.scale.y = 1 + a * 4.2;
      mouth.current.scale.x = 1 - a * 0.18;
      mouth.current.position.y = 0.62 - open * 0.4;
    }

    // Emotion brow/eye morph
    const brow = browFor(emotion);
    if (leftBrow.current && rightBrow.current) {
      leftBrow.current.position.y  = 0.85 + brow.y;
      rightBrow.current.position.y = 0.85 + brow.y;
      leftBrow.current.rotation.z  = brow.rotL;
      rightBrow.current.rotation.z = brow.rotR;
    }
    if (leftEye.current && rightEye.current) {
      const ey = eyeFor(emotion);
      leftEye.current.scale.y  = ey.scaleY;
      rightEye.current.scale.y = ey.scaleY;
    }

    // Expose head world position to parent so it can place the speech bubble.
    if (headRef && head.current) {
      head.current.getWorldPosition(headRef.current = headRef.current || new THREE.Vector3());
    }
  });

  // Hair shape per character — skip for `system` (glowing orb instead)
  const hair = useMemo(() => {
    if (who === 'system') return null;
    if (who === 'mom') {
      // Long hair bun
      return (
        <>
          <mesh position={[0, 0.93, 0]} castShadow>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshStandardMaterial color={palette.hair} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.18, -0.12]} castShadow>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color={palette.hair} roughness={0.65} />
          </mesh>
        </>
      );
    }
    // ritwik — short messy hair cap
    return (
      <mesh position={[0, 0.94, 0.02]} castShadow>
        <sphereGeometry args={[0.34, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
    );
  }, [who, palette.hair]);

  // SYSTEM character — render as a glowing cyan orb floating above the ground
  if (who === 'system') {
    return (
      <group ref={group} position={position} scale={scale}>
        <mesh ref={head} position={[0, 1.05, 0]} castShadow>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial color={palette.skin} emissive={palette.skin} emissiveIntensity={1.2} roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh ref={body} position={[0, 0.45, 0]} castShadow>
          <torusKnotGeometry args={[0.22, 0.07, 96, 16]} />
          <meshStandardMaterial color={palette.top} emissive={palette.top} emissiveIntensity={0.8} roughness={0.25} metalness={0.6} />
        </mesh>
        <mesh ref={mouth} position={[0, 0.55, 0.38]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.18, 0.03, 0.02]} />
          <meshStandardMaterial color={palette.mouth} emissive={palette.mouth} emissiveIntensity={1.5} />
        </mesh>
        {/* Glowing ring */}
        <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.018, 8, 64]} />
          <meshStandardMaterial color="#7DD3FC" emissive="#22D3EE" emissiveIntensity={1.5} transparent opacity={0.7} />
        </mesh>
      </group>
    );
  }

  // Human characters (ritwik, mom)
  return (
    <group ref={group} position={position} scale={scale}>
      {/* Body — slightly tapered cylinder */}
      <mesh ref={body} position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.85, 16]} />
        <meshStandardMaterial color={palette.top} roughness={0.7} />
      </mesh>
      {/* Body shadow accent (collar / hoodie pocket) */}
      <mesh position={[0, 0.18, 0.42]} castShadow>
        <boxGeometry args={[0.55, 0.18, 0.04]} />
        <meshStandardMaterial color={palette.accent} roughness={0.7} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.5, 0.4, 0]} rotation={[0, 0, 0.18]} castShadow>
        <cylinderGeometry args={[0.09, 0.10, 0.72, 12]} />
        <meshStandardMaterial color={palette.top} roughness={0.7} />
      </mesh>
      <mesh position={[0.5, 0.4, 0]} rotation={[0, 0, -0.18]} castShadow>
        <cylinderGeometry args={[0.09, 0.10, 0.72, 12]} />
        <meshStandardMaterial color={palette.top} roughness={0.7} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.6, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>
      <mesh position={[0.6, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.14, 12]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>
      {/* Head */}
      <mesh ref={head} position={[0, 0.92, 0]} castShadow>
        <sphereGeometry args={[0.36, 24, 24]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>
      {hair}
      {/* Eyes */}
      <mesh ref={leftEye} position={[-0.13, 0.95, 0.32]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color={palette.eye} />
      </mesh>
      <mesh ref={rightEye} position={[0.13, 0.95, 0.32]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color={palette.eye} />
      </mesh>
      {/* Brows */}
      <mesh ref={leftBrow} position={[-0.13, 1.05, 0.34]}>
        <boxGeometry args={[0.10, 0.024, 0.02]} />
        <meshStandardMaterial color={palette.hair} />
      </mesh>
      <mesh ref={rightBrow} position={[0.13, 1.05, 0.34]}>
        <boxGeometry args={[0.10, 0.024, 0.02]} />
        <meshStandardMaterial color={palette.hair} />
      </mesh>
      {/* Mouth */}
      <mesh ref={mouth} position={[0, 0.82, 0.34]}>
        <boxGeometry args={[0.16, 0.022, 0.018]} />
        <meshStandardMaterial color={palette.mouth} />
      </mesh>
      {/* Phone in Ritwik's hand */}
      {who === 'ritwik' && (
        <mesh position={[0.6, 0.08, 0.18]} rotation={[0.4, 0, -0.1]} castShadow>
          <boxGeometry args={[0.12, 0.22, 0.02]} />
          <meshStandardMaterial color="#1F1F24" roughness={0.3} metalness={0.6} />
        </mesh>
      )}
    </group>
  );
}

function browFor(emotion) {
  switch (emotion) {
    case 'shocked':   return { y: 0.04, rotL:  0.12, rotR: -0.12 };
    case 'realised':  return { y: 0.03, rotL:  0.05, rotR: -0.05 };
    case 'unsettled': return { y: -0.02, rotL: -0.10, rotR:  0.10 };
    case 'curious':   return { y: 0.02, rotL: -0.05, rotR:  0.05 };
    case 'happy':
    case 'confident': return { y: 0.0,  rotL: -0.03, rotR:  0.03 };
    default:          return { y: 0.0,  rotL: 0,     rotR: 0 };
  }
}

function eyeFor(emotion) {
  switch (emotion) {
    case 'shocked':  return { scaleY: 1.4 };
    case 'realised': return { scaleY: 1.25 };
    case 'happy':
    case 'confident':return { scaleY: 0.55 };
    default:         return { scaleY: 1 };
  }
}

/* Optional helper: blink loop — toggle eye scaleY between 1 and 0.05
 * for a few frames every 4-8s. Bound to the parent's hook so it survives
 * unmount/remount. */
export function useBlink(eyeRefs, on = true) {
  useEffect(() => {
    if (!on) return undefined;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const dt = 4000 + Math.random() * 4000;
      setTimeout(() => {
        if (!alive) return;
        eyeRefs.forEach((r) => { if (r.current) r.current.scale.y = 0.05; });
        setTimeout(() => {
          eyeRefs.forEach((r) => { if (r.current) r.current.scale.y = 1; });
          tick();
        }, 100);
      }, dt);
    };
    tick();
    return () => { alive = false; };
  }, [eyeRefs, on]);
}
