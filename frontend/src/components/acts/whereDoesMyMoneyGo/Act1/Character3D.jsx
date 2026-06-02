/**
 * Aarav — the in-room character (~18-19 year old, tall, thin, modern).
 *
 * Procedural primitive build. Proportions are realistic-ish (1:7
 * head-to-body, not chibi) so he reads as a teenager. Modern haircut
 * (short sides, longer top), fitted t-shirt in the vibe accent color,
 * slim dark jeans, white sneakers, optional shoulder-strapped tote.
 *
 * Idle motion: breathing bob, head look-around, blink, mouth opens on
 * speak. Subtle weight-shift sway. Hands relaxed (no clipboard).
 *
 * Pose mapping via `pose` prop:
 *   intro     — relaxed, looking around
 *   rules     — head tilted listening
 *   sort      — points at items
 *   shop      — hands in pockets, surveying
 *   events    — hands raised in surprise
 *   snapshot  — both hands up, cheering
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';

const SKIN  = '#D4A584';
const HAIR  = '#1C1208';
const JEANS = '#1E293B';
const SHOE  = '#F5F5F5';
const SHOE_ACCENT = '#0F172A';

export function Character3D({ position = [0, 0, 0], pose = 'intro', vibe, speaking = false }) {
  const root = useRef();
  const head = useRef();
  const lArm = useRef();
  const rArm = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const mouth = useRef();

  const accent = vibe?.accent || '#10B981';

  /* Pose-driven spring targets. */
  const targets = {
    intro:    { lArmRotX:  0.08, rArmRotX:  0.10, headY:  0.00, bodyTilt: 0.00, lArmRotZ:  0.15, rArmRotZ: -0.15 },
    rules:    { lArmRotX:  0.05, rArmRotX:  0.05, headY:  0.15, bodyTilt: 0.05, lArmRotZ:  0.10, rArmRotZ: -0.10 },
    sort:     { lArmRotX:  0.10, rArmRotX: -1.00, headY: -0.30, bodyTilt: 0.00, lArmRotZ:  0.15, rArmRotZ: -0.25 },
    shop:     { lArmRotX:  0.40, rArmRotX:  0.40, headY:  0.00, bodyTilt: 0.00, lArmRotZ:  0.25, rArmRotZ: -0.25 },
    events:   { lArmRotX: -0.85, rArmRotX: -0.85, headY:  0.00, bodyTilt: 0.10, lArmRotZ:  0.05, rArmRotZ: -0.05 },
    snapshot: { lArmRotX: -1.55, rArmRotX: -1.55, headY:  0.10, bodyTilt: 0.00, lArmRotZ:  0.15, rArmRotZ: -0.15 },
  };
  const t = targets[pose] || targets.intro;
  const spring = useSpring({
    lArmRotX: t.lArmRotX, rArmRotX: t.rArmRotX,
    lArmRotZ: t.lArmRotZ, rArmRotZ: t.rArmRotZ,
    headY:    t.headY,    bodyTilt: t.bodyTilt,
    config: { tension: 120, friction: 16 },
  });

  /* Per-frame organic motion */
  useFrame(({ clock }) => {
    const tt = clock.elapsedTime;
    if (root.current) {
      root.current.position.y = position[1] + Math.sin(tt * 1.3) * 0.014;
      root.current.rotation.y = Math.sin(tt * 0.32) * 0.04;
    }
    if (head.current) {
      head.current.rotation.x = Math.sin(tt * 0.55) * 0.05;
      head.current.rotation.z = Math.sin(tt * 0.47) * 0.025;
    }
    const blink = ((tt % 3.8) > 3.65) ? 0.06 : 1;
    if (eyeL.current) eyeL.current.scale.y = blink;
    if (eyeR.current) eyeR.current.scale.y = blink;
    if (mouth.current) {
      const open = speaking ? 0.5 + Math.sin(tt * 18) * 0.45 : 0.18;
      mouth.current.scale.y = Math.max(0.10, open);
    }
  });

  return (
    <animated.group ref={root} position={position} rotation-z={spring.bodyTilt}>
      {/* === Shoes (white sneakers) === */}
      <RoundedBox args={[0.20, 0.10, 0.34]} radius={0.05} position={[-0.10, 0.05, 0.04]} castShadow>
        <meshStandardMaterial color={SHOE} roughness={0.5} />
      </RoundedBox>
      {/* Sole accent stripe */}
      <mesh position={[-0.10, 0.025, 0.04]}>
        <boxGeometry args={[0.21, 0.025, 0.345]} />
        <meshStandardMaterial color={SHOE_ACCENT} roughness={0.5} />
      </mesh>
      <RoundedBox args={[0.20, 0.10, 0.34]} radius={0.05} position={[0.10, 0.05, 0.04]} castShadow>
        <meshStandardMaterial color={SHOE} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.10, 0.025, 0.04]}>
        <boxGeometry args={[0.21, 0.025, 0.345]} />
        <meshStandardMaterial color={SHOE_ACCENT} roughness={0.5} />
      </mesh>

      {/* === Legs (slim dark jeans) === */}
      <RoundedBox args={[0.16, 0.95, 0.18]} radius={0.05} position={[-0.10, 0.58, 0]} castShadow>
        <meshStandardMaterial color={JEANS} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.95, 0.18]} radius={0.05} position={[0.10, 0.58, 0]} castShadow>
        <meshStandardMaterial color={JEANS} roughness={0.7} />
      </RoundedBox>

      {/* === Hip / belt line === */}
      <RoundedBox args={[0.42, 0.10, 0.28]} radius={0.04} position={[0, 1.10, 0]} castShadow>
        <meshStandardMaterial color={JEANS} roughness={0.55} />
      </RoundedBox>
      {/* Belt accent */}
      <mesh position={[0, 1.13, 0.14]}>
        <boxGeometry args={[0.42, 0.04, 0.005]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[0, 1.13, 0.142]}>
        <boxGeometry args={[0.06, 0.05, 0.005]} />
        <meshStandardMaterial color="#9CA3AF" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* === Torso (fitted t-shirt) === */}
      <RoundedBox args={[0.48, 0.70, 0.28]} radius={0.12} smoothness={4} position={[0, 1.52, 0]} castShadow>
        <meshStandardMaterial color={accent} roughness={0.85} />
      </RoundedBox>
      {/* T-shirt neckline */}
      <mesh position={[0, 1.85, 0.135]}>
        <torusGeometry args={[0.10, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color={accent} />
      </mesh>

      {/* === Left arm === */}
      <animated.group position={[-0.28, 1.78, 0]} rotation-x={spring.lArmRotX} rotation-z={spring.lArmRotZ}>
        <RoundedBox args={[0.10, 0.46, 0.10]} radius={0.05} position={[0, -0.26, 0]} castShadow>
          <meshStandardMaterial color={accent} roughness={0.85} />
        </RoundedBox>
        {/* Forearm (skin) */}
        <RoundedBox args={[0.085, 0.36, 0.085]} radius={0.04} position={[0, -0.68, 0.04]} castShadow>
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, -0.90, 0.08]} castShadow>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
      </animated.group>

      {/* === Right arm === */}
      <animated.group ref={rArm} position={[0.28, 1.78, 0]} rotation-x={spring.rArmRotX} rotation-z={spring.rArmRotZ}>
        <RoundedBox args={[0.10, 0.46, 0.10]} radius={0.05} position={[0, -0.26, 0]} castShadow>
          <meshStandardMaterial color={accent} roughness={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.085, 0.36, 0.085]} radius={0.04} position={[0, -0.68, 0.04]} castShadow>
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, -0.90, 0.08]} castShadow>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
      </animated.group>

      {/* === Neck === */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.065, 0.10, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.85} />
      </mesh>

      {/* === Head === */}
      <animated.group ref={head} position={[0, 2.13, 0]} rotation-y={spring.headY}>
        {/* Face — elongated sphere for a slightly oval, mature-teen shape */}
        <mesh castShadow scale={[1.0, 1.12, 1.0]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>

        {/* Jaw definition — a thin underbox tinted slightly darker */}
        <mesh position={[0, -0.10, 0.02]} scale={[0.9, 0.6, 0.9]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#C9956E" roughness={0.85} />
        </mesh>

        {/* === Modern Haircut: short undercut style ===
            Sides: very short, dark patch hugging the skull.
            Top: longer, slightly tousled forward sweep. */}
        {/* Top hair (longer, swept forward) */}
        <mesh position={[0, 0.10, -0.02]} castShadow>
          <sphereGeometry args={[0.195, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.3]} />
          <meshStandardMaterial color={HAIR} roughness={0.55} />
        </mesh>
        {/* Front sweep / fringe */}
        <mesh position={[-0.05, 0.13, 0.14]} rotation={[-0.25, 0.4, -0.15]}>
          <boxGeometry args={[0.18, 0.10, 0.10]} />
          <meshStandardMaterial color={HAIR} roughness={0.55} />
        </mesh>
        {/* Side fade (short) */}
        <mesh position={[0.165, 0.02, 0]} scale={[0.5, 1.0, 1.0]}>
          <sphereGeometry args={[0.18, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color="#0F0905" roughness={0.6} />
        </mesh>
        <mesh position={[-0.165, 0.02, 0]} scale={[0.5, 1.0, 1.0]}>
          <sphereGeometry args={[0.18, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color="#0F0905" roughness={0.6} />
        </mesh>

        {/* Eyebrows — slight upward arch */}
        <mesh position={[-0.07, 0.06, 0.17]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
          <meshStandardMaterial color="#1C1208" />
        </mesh>
        <mesh position={[0.07, 0.06, 0.17]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
          <meshStandardMaterial color="#1C1208" />
        </mesh>

        {/* Eyes — almond-shaped, mature spacing */}
        <mesh ref={eyeL} position={[-0.065, 0.005, 0.175]}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color="#1A0F08" />
        </mesh>
        <mesh ref={eyeR} position={[0.065, 0.005, 0.175]}>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial color="#1A0F08" />
        </mesh>
        {/* Eye highlights */}
        <mesh position={[-0.060, 0.020, 0.200]}>
          <sphereGeometry args={[0.009, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.070, 0.020, 0.200]}>
          <sphereGeometry args={[0.009, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Nose ridge — small box */}
        <mesh position={[0, -0.02, 0.18]}>
          <boxGeometry args={[0.025, 0.06, 0.04]} />
          <meshStandardMaterial color="#C28E66" roughness={0.85} />
        </mesh>

        {/* Mouth — small confident half-smile, opens when speaking */}
        <mesh ref={mouth} position={[0, -0.08, 0.18]}>
          <sphereGeometry args={[0.020, 12, 12]} />
          <meshStandardMaterial color="#7C2D12" />
        </mesh>

        {/* Subtle ear */}
        <mesh position={[0.183, -0.01, 0.01]} scale={[0.4, 1.0, 0.8]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
        <mesh position={[-0.183, -0.01, 0.01]} scale={[0.4, 1.0, 0.8]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.85} />
        </mesh>
      </animated.group>

      {/* Wristwatch on right arm — modern detail */}
      <mesh position={[0.28, 0.86, 0.04]}>
        <torusGeometry args={[0.085, 0.012, 8, 16]} />
        <meshStandardMaterial color="#0F172A" metalness={0.7} roughness={0.3} />
      </mesh>
    </animated.group>
  );
}
