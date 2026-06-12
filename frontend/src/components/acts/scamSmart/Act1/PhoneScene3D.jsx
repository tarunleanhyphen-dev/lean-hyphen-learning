/**
 * PhoneScene3D — a real 3D phone for Act 1's transition/teaser.
 * A floating handset slides in, its screen glows, message bars stack up and
 * a red notification badge pulses ("5 waiting"). Built on react-three-fiber
 * + drei. Background is transparent so the lesson gradient shows through.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Html } from '@react-three/drei';
import { useRef } from 'react';

function MessageBar({ y, delay, color, width = 0.92 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // staggered slide-in + gentle breathing glow
    const p = Math.min(1, Math.max(0, (t - delay) * 1.6));
    if (!ref.current) return;
    ref.current.position.x = -0.1 + (1 - p) * -1.4;
    ref.current.material.opacity = p * 0.95;
    ref.current.material.emissiveIntensity = 0.5 + Math.sin(t * 2 + delay) * 0.18;
  });
  return (
    <RoundedBox ref={ref} args={[width, 0.16, 0.02]} radius={0.07} smoothness={4} position={[-0.1, y, 0.085]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0} roughness={0.4} />
    </RoundedBox>
  );
}

function Badge() {
  const ref = useRef();
  const mat = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 4) * 0.08;
    if (ref.current) ref.current.scale.setScalar(pulse);
    if (mat.current) mat.current.emissiveIntensity = 1.1 + Math.sin(t * 4) * 0.5;
  });
  return (
    <group position={[0.52, 1.15, 0.13]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial ref={mat} color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} roughness={0.3} />
      </mesh>
      <Html center distanceFactor={6} style={{ pointerEvents: 'none', fontWeight: 800, color: '#fff', fontSize: 26 }}>5</Html>
    </group>
  );
}

function Phone() {
  const group = useRef();
  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime();
    if (!group.current) return;
    // Cinematic entrance (first ~1.3s) then a lively, continuous sway that
    // also follows the pointer — a much more dynamic motion than before.
    const intro = Math.min(1, t / 1.3);
    const ease = 1 - Math.pow(1 - intro, 3);
    group.current.rotation.y = Math.sin(t * 0.55) * 0.42 + mouse.x * 0.45 + (1 - ease) * -1.1;
    group.current.rotation.x = -0.05 + Math.sin(t * 0.8) * 0.06 + mouse.y * -0.18;
    group.current.rotation.z = Math.sin(t * 0.4) * 0.05;
    group.current.position.y = (1 - ease) * -1.6;
    group.current.scale.setScalar(0.6 + ease * 0.45);
  });
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.1}>
      <group ref={group} scale={1.05}>
        {/* body */}
        <RoundedBox args={[1.25, 2.5, 0.16]} radius={0.16} smoothness={6}>
          <meshStandardMaterial color="#11131c" metalness={0.8} roughness={0.28} />
        </RoundedBox>
        {/* screen */}
        <RoundedBox args={[1.12, 2.34, 0.04]} radius={0.1} smoothness={6} position={[0, 0, 0.08]}>
          <meshStandardMaterial color="#0b141a" emissive="#10243a" emissiveIntensity={0.7} roughness={0.5} />
        </RoundedBox>
        {/* notch */}
        <RoundedBox args={[0.34, 0.08, 0.02]} radius={0.04} smoothness={4} position={[0, 1.08, 0.1]}>
          <meshStandardMaterial color="#05070b" />
        </RoundedBox>
        {/* stacked message bars */}
        <MessageBar y={0.55} delay={0.2} color="#6366f1" />
        <MessageBar y={0.28} delay={0.5} color="#a855f7" width={0.78} />
        <MessageBar y={0.01} delay={0.8} color="#22d3ee" />
        <MessageBar y={-0.26} delay={1.1} color="#ef4444" width={0.7} />
        <MessageBar y={-0.53} delay={1.4} color="#6366f1" width={0.85} />
        <Badge />
      </group>
    </Float>
  );
}

export default function PhoneScene3D({ height = 300 }) {
  return (
    <div style={{ height, width: '100%' }} aria-hidden>
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} />
        <pointLight position={[-3, -1, 2]} intensity={40} color="#a855f7" />
        <pointLight position={[3, 2, 3]} intensity={26} color="#22d3ee" />
        <Phone />
      </Canvas>
    </div>
  );
}
