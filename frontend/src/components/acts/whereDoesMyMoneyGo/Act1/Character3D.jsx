/**
 * Maya — the in-room 3D character (a "tiny architect" with a clipboard).
 *
 * Pure-primitive build but tuned for personality:
 *   - chibi-ish 1:5 head-to-body so she reads as cute, not weird
 *   - layered hair (cap + bangs + bob curls) for silhouette
 *   - clipboard + pencil — she's literally designing your room
 *   - eyes blink, mouth opens slightly when "speaking"
 *   - scene-aware poses: idle / point / cheer / surprise
 *   - subtle breathing, head bob, weight shift, clipboard tap
 *
 * Pose mapping (set via `pose` prop):
 *   intro     — relaxed idle, looks around the room
 *   rules     — looks at clipboard, taps pencil
 *   sort      — points at items as they appear
 *   shop      — looks at the room, hands behind back
 *   events    — surprise (hands up briefly)
 *   snapshot  — cheer (both hands up)
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

const SKIN  = '#E8B89B';
const HAIR  = '#2C1810';
const SHIRT_DEFAULT = '#FFFFFF';
const PANTS = '#1F2937';
const SHOE  = '#0F172A';

export function Character3D({ position = [0, 0, 0], pose = 'intro', vibe, speaking = false }) {
  const root = useRef();
  const head = useRef();
  const lArm = useRef();
  const rArm = useRef();
  const clipboard = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const mouth = useRef();

  const accent = vibe?.accent || '#10B981';

  // Pose targets: rotations and offsets
  const targets = {
    intro:    { lArmRotX: 0.10, rArmRotX: 0.10, headY: 0.0,  bodyTilt: 0.0,  clipBoardY: -0.10 },
    rules:    { lArmRotX: 1.1,  rArmRotX: 0.30, headY: 0.30, bodyTilt: 0.0,  clipBoardY:  0.10 },
    sort:     { lArmRotX: 0.10, rArmRotX:-0.9,  headY: -0.5, bodyTilt: 0.0,  clipBoardY: -0.10 },
    shop:     { lArmRotX: 0.05, rArmRotX: 0.05, headY: 0.0,  bodyTilt: 0.0,  clipBoardY: -0.05 },
    events:   { lArmRotX:-0.8,  rArmRotX:-0.8,  headY: 0.0,  bodyTilt: 0.1,  clipBoardY: -0.10 },
    snapshot: { lArmRotX:-1.4,  rArmRotX:-1.4,  headY: 0.1,  bodyTilt: 0.0,  clipBoardY: -0.10 },
  };
  const t = targets[pose] || targets.intro;

  const spring = useSpring({
    lArmRotX:   t.lArmRotX,
    rArmRotX:   t.rArmRotX,
    headY:      t.headY,
    bodyTilt:   t.bodyTilt,
    clipBoardY: t.clipBoardY,
    config: { tension: 120, friction: 16 },
  });

  // Per-frame organic motion
  useFrame(({ clock }) => {
    const tt = clock.elapsedTime;
    // Breathing — subtle Y bob and chest scale
    if (root.current) {
      root.current.position.y = position[1] + Math.sin(tt * 1.4) * 0.014;
      // Weight shift — gentle rotation
      root.current.rotation.y = Math.sin(tt * 0.3) * 0.04;
    }
    // Head idle — slight look-around
    if (head.current) {
      head.current.rotation.x = Math.sin(tt * 0.6) * 0.06;
      head.current.rotation.z = Math.sin(tt * 0.5) * 0.03;
    }
    // Eye blink — squash Y briefly every ~3s
    const blink = ((tt % 3.6) > 3.45) ? 0.06 : 1;
    if (eyeL.current) eyeL.current.scale.y = blink;
    if (eyeR.current) eyeR.current.scale.y = blink;
    // Mouth — slight open while speaking
    if (mouth.current) {
      const open = speaking ? 0.55 + Math.sin(tt * 18) * 0.45 : 0.2;
      mouth.current.scale.y = Math.max(0.1, open);
    }
    // Clipboard pencil-tap when in "rules" pose
    if (clipboard.current && pose === 'rules') {
      clipboard.current.rotation.z = Math.sin(tt * 4) * 0.04;
    } else if (clipboard.current) {
      clipboard.current.rotation.z = 0;
    }
  });

  return (
    <animated.group
      ref={root}
      position={position}
      rotation-z={spring.bodyTilt}
    >
      {/* Shoes */}
      <RoundedBox args={[0.22, 0.10, 0.30]} radius={0.05} position={[-0.10, 0.05, 0.05]} castShadow>
        <meshStandardMaterial color={SHOE} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.10, 0.30]} radius={0.05} position={[0.10, 0.05, 0.05]} castShadow>
        <meshStandardMaterial color={SHOE} roughness={0.5} />
      </RoundedBox>

      {/* Legs (jeans) */}
      <RoundedBox args={[0.18, 0.78, 0.20]} radius={0.05} position={[-0.10, 0.50, 0]} castShadow>
        <meshStandardMaterial color={PANTS} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.78, 0.20]} radius={0.05} position={[0.10, 0.50, 0]} castShadow>
        <meshStandardMaterial color={PANTS} roughness={0.7} />
      </RoundedBox>

      {/* Hip / belt */}
      <RoundedBox args={[0.45, 0.10, 0.30]} radius={0.04} position={[0, 0.94, 0]} castShadow>
        <meshStandardMaterial color="#0F172A" roughness={0.55} />
      </RoundedBox>

      {/* Torso — shirt (vibe accent) */}
      <RoundedBox args={[0.52, 0.62, 0.32]} radius={0.12} smoothness={4} position={[0, 1.30, 0]} castShadow>
        <meshStandardMaterial color={accent} roughness={0.85} />
      </RoundedBox>
      {/* Shirt placket / button line */}
      <mesh position={[0, 1.30, 0.165]}>
        <boxGeometry args={[0.02, 0.50, 0.005]} />
        <meshStandardMaterial color={SHIRT_DEFAULT} />
      </mesh>
      {[1.50, 1.36, 1.22, 1.08].map((y, i) => (
        <mesh key={i} position={[0, y, 0.17]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color={SHIRT_DEFAULT} />
        </mesh>
      ))}

      {/* Apron straps (subtle hint of "designer" attire) */}
      <mesh position={[-0.13, 1.45, 0.155]}>
        <boxGeometry args={[0.05, 0.30, 0.01]} />
        <meshStandardMaterial color="#5C3A1B" />
      </mesh>
      <mesh position={[0.13, 1.45, 0.155]}>
        <boxGeometry args={[0.05, 0.30, 0.01]} />
        <meshStandardMaterial color="#5C3A1B" />
      </mesh>

      {/* Left arm */}
      <animated.group position={[-0.30, 1.52, 0]} rotation-x={spring.lArmRotX}>
        <RoundedBox args={[0.13, 0.50, 0.13]} radius={0.06} position={[0, -0.28, 0]} castShadow>
          <meshStandardMaterial color={accent} roughness={0.85} />
        </RoundedBox>
        {/* Forearm (skin) */}
        <RoundedBox args={[0.11, 0.32, 0.11]} radius={0.05} position={[0, -0.68, 0.04]} castShadow>
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </RoundedBox>
        {/* Hand */}
        <mesh position={[0, -0.88, 0.08]} castShadow>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
      </animated.group>

      {/* Right arm + clipboard */}
      <animated.group ref={rArm} position={[0.30, 1.52, 0]} rotation-x={spring.rArmRotX}>
        <RoundedBox args={[0.13, 0.50, 0.13]} radius={0.06} position={[0, -0.28, 0]} castShadow>
          <meshStandardMaterial color={accent} roughness={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.11, 0.32, 0.11]} radius={0.05} position={[0, -0.68, 0.04]} castShadow>
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, -0.88, 0.08]} castShadow>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>

        {/* Clipboard (held in right hand) */}
        <animated.group ref={clipboard} position-y={spring.clipBoardY}>
          <RoundedBox args={[0.28, 0.38, 0.02]} radius={0.02} position={[-0.05, -0.55, 0.18]} castShadow>
            <meshStandardMaterial color="#A0764A" roughness={0.7} />
          </RoundedBox>
          {/* Paper on clipboard */}
          <mesh position={[-0.05, -0.55, 0.193]}>
            <planeGeometry args={[0.22, 0.32]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.1} />
          </mesh>
          {/* "Sketch" lines on paper */}
          {[0.10, 0.04, -0.02, -0.08].map((y, i) => (
            <mesh key={i} position={[-0.05, -0.55 + y, 0.195]}>
              <boxGeometry args={[0.14, 0.005, 0.001]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
            </mesh>
          ))}
          {/* Clip at top */}
          <mesh position={[-0.05, -0.36, 0.20]}>
            <boxGeometry args={[0.08, 0.04, 0.02]} />
            <meshStandardMaterial color="#9CA3AF" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Pencil */}
          <mesh position={[0.10, -0.40, 0.20]} rotation={[0, 0, Math.PI / 5]}>
            <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
            <meshStandardMaterial color="#F59E0B" />
          </mesh>
        </animated.group>
      </animated.group>

      {/* Neck */}
      <mesh position={[0, 1.66, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.10, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.85} />
      </mesh>

      {/* Head */}
      <animated.group ref={head} position={[0, 1.88, 0]} rotation-y={spring.headY}>
        {/* Face base */}
        <mesh castShadow>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
        {/* Hair — back cap */}
        <mesh position={[0, 0.05, -0.04]} castShadow>
          <sphereGeometry args={[0.255, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color={HAIR} roughness={0.6} />
        </mesh>
        {/* Hair — bangs sweep */}
        <mesh position={[-0.04, 0.06, 0.20]} rotation={[-0.1, 0.3, 0]}>
          <boxGeometry args={[0.34, 0.10, 0.08]} />
          <meshStandardMaterial color={HAIR} roughness={0.6} />
        </mesh>
        {/* Hair — side tuft right */}
        <mesh position={[0.18, -0.04, 0.10]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.10, 0.20, 0.16]} />
          <meshStandardMaterial color={HAIR} roughness={0.6} />
        </mesh>
        {/* Hair — side tuft left */}
        <mesh position={[-0.18, -0.04, 0.10]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.10, 0.20, 0.16]} />
          <meshStandardMaterial color={HAIR} roughness={0.6} />
        </mesh>

        {/* Eyes — bigger ovals (chibi) */}
        <mesh ref={eyeL} position={[-0.085, -0.02, 0.215]}>
          <sphereGeometry args={[0.030, 16, 16]} />
          <meshStandardMaterial color="#0B1220" />
        </mesh>
        <mesh ref={eyeR} position={[0.085, -0.02, 0.215]}>
          <sphereGeometry args={[0.030, 16, 16]} />
          <meshStandardMaterial color="#0B1220" />
        </mesh>
        {/* Eye highlights */}
        <mesh position={[-0.08, 0.005, 0.245]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.09, 0.005, 0.245]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Cheeks (warm) */}
        <mesh position={[-0.14, -0.07, 0.20]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#FCA5A5" emissive="#FCA5A5" emissiveIntensity={0.18} />
        </mesh>
        <mesh position={[0.14, -0.07, 0.20]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#FCA5A5" emissive="#FCA5A5" emissiveIntensity={0.18} />
        </mesh>

        {/* Mouth — small smile, opens when speaking */}
        <mesh ref={mouth} position={[0, -0.09, 0.225]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#7C2D12" />
        </mesh>
      </animated.group>
    </animated.group>
  );
}
