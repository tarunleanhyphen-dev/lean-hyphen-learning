/**
 * Interactive 3D "before" room for Scene 1 — a fully enclosed, dusty bedroom
 * you stand INSIDE and look around (4 walls: one window, one door, two plain,
 * + floor + ceiling). Drag or use the corner arrows to pan/tilt and inspect
 * every corner. Gently auto-pans when idle. Pure @react-three/fiber; falls
 * back to the 2D <DustyRoom> if WebGL is unavailable.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useRef, Component } from 'react';
import { Vector3 } from 'three';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DustyRoom } from './DustyRoom.jsx';
import { Kabir } from './Kabir.jsx';

/* Projects a fixed world point (Kabir's spot in the room) to screen pixels
 * every frame and positions the 2D Kabir overlay there — so he stays anchored
 * in the room and pans with it as the camera rotates. */
function KabirAnchor({ elRef, anchor }) {
  const { camera, size } = useThree();
  const v = useRef();
  if (!v.current) v.current = new Vector3();
  useFrame(() => {
    const el = elRef.current;
    if (!el) return;
    v.current.set(anchor[0], anchor[1], anchor[2]).project(camera);
    const behind = v.current.z > 1;
    el.style.left = `${(v.current.x * 0.5 + 0.5) * size.width}px`;
    el.style.top = `${(-v.current.y * 0.5 + 0.5) * size.height}px`;
    el.style.opacity = behind || Math.abs(v.current.x) > 2 ? '0' : '1';
  });
  return null;
}

/* light, airy palette */
const WALL = '#e7dcc6', WALL2 = '#ded2ba', FLOOR = '#caa979', CEIL = '#f1ece0';

function Box({ args, color, position, rotation, emissive, rough = 1, metal = 0, opacity }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} emissive={emissive || '#000'} emissiveIntensity={emissive ? 0.5 : 0} roughness={rough} metalness={metal} transparent={opacity != null} opacity={opacity == null ? 1 : opacity} />
    </mesh>
  );
}

function Motes() {
  const ref = useRef();
  const pts = [
    [-1.4, 1.4, -0.6], [0.8, 1.9, -1.2], [1.5, 1.1, 0.6], [-0.6, 2.3, 0.4],
    [0.3, 0.9, 1.4], [-1.6, 1.7, 1.0], [1.1, 2.1, -0.4], [-0.3, 1.5, -1.5],
    [1.8, 1.6, 1.3], [-1.9, 1.0, -1.1], [0.5, 2.4, 0.9], [-0.9, 0.8, 0.2],
  ];
  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.children.forEach((m, i) => {
      m.position.y = pts[i][1] + Math.sin(t * 0.45 + i) * 0.32;
      m.position.x = pts[i][0] + Math.cos(t * 0.28 + i) * 0.16;
    });
  });
  return (
    <group ref={ref}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#e9dcc0" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/* Ceiling fan — hangs DOWN from y=0; render it inside a group placed at the
 * ceiling, e.g. <group position={[0.2, H, 0]}><CeilingFan /></group>. */
function CeilingFan() {
  const blades = useRef();
  useFrame((_, d) => { if (blades.current) blades.current.rotation.y += d * 1.5; });
  return (
    <group>
      {/* mount cap */}
      <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.12, 0.14, 0.08, 16]} /><meshStandardMaterial color="#4a4034" /></mesh>
      {/* down rod */}
      <mesh position={[0, -0.42, 0]}><cylinderGeometry args={[0.025, 0.025, 0.72, 10]} /><meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.5} /></mesh>
      {/* motor hub */}
      <mesh position={[0, -0.84, 0]}><cylinderGeometry args={[0.16, 0.19, 0.18, 20]} /><meshStandardMaterial color="#6a4a32" metalness={0.35} roughness={0.45} /></mesh>
      {/* rotating blades + arms */}
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
      {/* light kit */}
      <mesh position={[0, -1.0, 0]}><sphereGeometry args={[0.11, 18, 18]} /><meshStandardMaterial color="#fff6d8" emissive="#ffe9b0" emissiveIntensity={0.55} /></mesh>
    </group>
  );
}

function Rig({ ctrl, cine }) {
  const prev = useRef(false);
  const cs = useRef({ active: false, t0: 0, startYaw: 0 });
  useFrame(({ camera, clock }, d) => {
    const c = ctrl.current;
    // rising edge of `cine` (Kabir's "...complete makeover" line) → full room tour
    if (cine && !prev.current && !cs.current.active) {
      cs.current = { active: true, t0: clock.elapsedTime, startYaw: c.yaw };
    }
    prev.current = cine;

    if (cs.current.active) {
      const e = clock.elapsedTime - cs.current.t0;
      const DUR = 9.5;
      if (e < DUR) {
        const p = e / DUR;
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
        c.yaw = cs.current.startYaw + ease * Math.PI * 2;     // sweep the whole room
        c.pitch = 0.06 + Math.sin(p * Math.PI) * 0.14;
      } else {
        // settle back exactly where we began (Kabir side view), no rewind spin
        cs.current.active = false;
        c.yaw = cs.current.startYaw;
        camera.rotation.y = cs.current.startYaw;
        c.pitch = 0.12;
      }
    } else {
      const idle = !c.dragging && !c.nudge.x && !c.nudge.y;
      if (idle) {
        const ty = Math.sin(clock.elapsedTime * 0.13) * 0.22;
        const tp = 0.12 + Math.sin(clock.elapsedTime * 0.1) * 0.05;
        c.yaw += (ty - c.yaw) * 0.012;
        c.pitch += (tp - c.pitch) * 0.012;
      } else {
        c.yaw += c.nudge.x * d * 0.9;
        c.pitch = Math.max(-0.7, Math.min(1.35, c.pitch + c.nudge.y * d * 1.0));
      }
    }
    camera.rotation.order = 'YXZ';
    camera.rotation.y += (c.yaw - camera.rotation.y) * 0.1;
    camera.rotation.x += (c.pitch - camera.rotation.x) * 0.1;
  });
  return null;
}

/* Room footprint: 2R × 2R, wall height H. Change R to resize the whole room. */
const R = 4.5;   // half-size → 9 × 9 room
const H = 4.2;   // wall height

function RoomScene({ ctrl, cine, kabirRef }) {
  return (
    <>
      <Rig ctrl={ctrl} cine={cine} />
      {/* Kabir is pinned to a fixed screen corner via CSS (see .dbm-room-kabir),
       * so he stays put while the room rotates during the cinematic sweep. */}
      {/* bright daytime light pouring through the window */}
      <ambientLight intensity={1.05} color="#eaf1ff" />
      <pointLight position={[0.4, 2.6, -4.2]} intensity={2.6} color="#fff6e6" distance={18} decay={1.0} />
      <directionalLight position={[0.4, 3.2, -2]} intensity={0.95} color="#ffffff" />
      <pointLight position={[0.2, 3.6, 0]} intensity={0.4} color="#fffaf0" distance={11} />

      {/* floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[2 * R, 2 * R]} /><meshStandardMaterial color={FLOOR} roughness={1} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}><planeGeometry args={[2 * R, 2 * R]} /><meshStandardMaterial color={CEIL} roughness={1} /></mesh>
      {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => (<Box key={x} args={[0.02, 0.012, 2 * R]} color="#332618" position={[x, 0.012, 0]} />))}
      {/* dark, dusty grime patches settled on the floor */}
      {[[-1.8, 1.8, 1.7], [2.4, -0.8, 1.3], [0.6, 3.4, 1.9], [-3.2, -2.6, 1.5], [3.8, 2.2, 1.2], [-0.8, -3.8, 1.4], [3.2, -3.2, 1.2], [-3.6, 3.2, 1.3], [1.2, -1.6, 1.1], [-0.4, 0.6, 1.4]].map(([x, z, s], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.014 + i * 0.0005, z]}>
          <circleGeometry args={[0.55 * s, 22]} />
          <meshBasicMaterial color={i % 2 ? '#5c4426' : '#6b5232'} transparent opacity={0.34} />
        </mesh>
      ))}

      {/* BACK wall — wooden window with crystal glass onto a bright day */}
      <mesh position={[0, H / 2, -R]}><planeGeometry args={[2 * R, H]} /><meshStandardMaterial color={WALL} roughness={1} /></mesh>
      <group position={[0, 2.3, -R + 0.08]}>
        {/* daytime sky behind the glass */}
        <mesh position={[0, 0.48, -0.05]}><boxGeometry args={[2.32, 0.96, 0.02]} /><meshStandardMaterial color="#bfe6ff" emissive="#a9ddff" emissiveIntensity={1.4} toneMapped={false} /></mesh>
        <mesh position={[0, -0.44, -0.05]}><boxGeometry args={[2.32, 0.92, 0.02]} /><meshStandardMaterial color="#e8f5ff" emissive="#ddf1ff" emissiveIntensity={1.55} toneMapped={false} /></mesh>
        {/* sun + clouds */}
        <mesh position={[0.55, 0.4, -0.04]}><circleGeometry args={[0.5, 36]} /><meshBasicMaterial color="#fff6cf" transparent opacity={0.5} /></mesh>
        <mesh position={[0.55, 0.4, -0.038]}><circleGeometry args={[0.26, 36]} /><meshBasicMaterial color="#fffbe8" /></mesh>
        <mesh position={[-0.5, 0.48, -0.03]} scale={[1.7, 0.55, 1]}><circleGeometry args={[0.2, 22]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.9} /></mesh>
        <mesh position={[0.15, -0.22, -0.03]} scale={[1.5, 0.5, 1]}><circleGeometry args={[0.18, 22]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.7} /></mesh>
        {/* crystal glass sheet (glossy, translucent) */}
        <mesh position={[0, 0, 0.02]}><boxGeometry args={[2.3, 1.9, 0.02]} /><meshStandardMaterial color="#d4ecff" transparent opacity={0.2} roughness={0.04} metalness={0.15} /></mesh>
        {/* glass sheen */}
        <mesh position={[-0.45, 0, 0.035]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.16, 2.6, 0.01]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.18} /></mesh>
        <mesh position={[-0.06, 0, 0.035]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.07, 2.6, 0.01]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.13} /></mesh>
        {/* wooden frame bars (outer) */}
        <Box args={[2.78, 0.24, 0.24]} color="#7a5836" position={[0, 1.08, 0.04]} rough={0.7} />
        <Box args={[2.78, 0.34, 0.36]} color="#6a4a2c" position={[0, -1.14, 0.07]} rough={0.7} />{/* sill */}
        <Box args={[0.24, 2.46, 0.24]} color="#7a5836" position={[-1.3, 0, 0.04]} rough={0.7} />
        <Box args={[0.24, 2.46, 0.24]} color="#7a5836" position={[1.3, 0, 0.04]} rough={0.7} />
        {/* cross mullions → 2×2 panes */}
        <Box args={[0.12, 1.94, 0.2]} color="#6f5030" position={[0, 0, 0.06]} rough={0.7} />
        <Box args={[2.4, 0.12, 0.2]} color="#6f5030" position={[0, 0, 0.06]} rough={0.7} />
        {/* brass casement handle on the right stile */}
        <mesh position={[1.12, -0.06, 0.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.04, 16]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
        <mesh position={[1.12, -0.24, 0.15]}><boxGeometry args={[0.05, 0.28, 0.05]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
        <mesh position={[1.12, -0.4, 0.15]}><sphereGeometry args={[0.05, 14, 14]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
      </group>

      {/* FRONT wall — door (behind camera initially) */}
      <mesh position={[0, H / 2, R]} rotation={[0, Math.PI, 0]}><planeGeometry args={[2 * R, H]} /><meshStandardMaterial color={WALL} roughness={1} /></mesh>
      <group position={[-0.5, 1.45, R - 0.08]}>
        {/* slab + door casing */}
        <Box args={[1.62, 3.0, 0.1]} color="#5a4126" position={[0, 0, 0.06]} />{/* casing */}
        <Box args={[1.5, 2.9, 0.16]} color="#6a4a2c" rough={0.7} />
        {/* room-facing stiles/rails inset */}
        <Box args={[1.32, 2.72, 0.03]} color="#7a5836" position={[0, 0, -0.09]} rough={0.7} />
        {/* 4 recessed panels (2×2) */}
        <Box args={[0.48, 0.98, 0.02]} color="#5a4126" position={[-0.33, 0.62, -0.11]} />
        <Box args={[0.48, 0.98, 0.02]} color="#5a4126" position={[0.33, 0.62, -0.11]} />
        <Box args={[0.48, 0.92, 0.02]} color="#5a4126" position={[-0.33, -0.58, -0.11]} />
        <Box args={[0.48, 0.92, 0.02]} color="#5a4126" position={[0.33, -0.58, -0.11]} />
        {/* lever handle + rose plate (brass) on latch side */}
        <mesh position={[0.56, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.03, 18]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
        <mesh position={[0.49, -0.02, -0.17]}><boxGeometry args={[0.22, 0.05, 0.05]} /><meshStandardMaterial color="#caa84e" metalness={0.65} roughness={0.3} /></mesh>
        {/* keyhole escutcheon */}
        <mesh position={[0.56, -0.22, -0.12]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.03, 12]} /><meshStandardMaterial color="#b8973f" metalness={0.6} roughness={0.35} /></mesh>
        {/* hinges on the left edge */}
        <mesh position={[-0.73, 0.95, -0.05]}><boxGeometry args={[0.05, 0.26, 0.13]} /><meshStandardMaterial color="#9a9a9a" metalness={0.55} roughness={0.4} /></mesh>
        <mesh position={[-0.73, -0.95, -0.05]}><boxGeometry args={[0.05, 0.26, 0.13]} /><meshStandardMaterial color="#9a9a9a" metalness={0.55} roughness={0.4} /></mesh>
        {/* metal kick plate */}
        <Box args={[1.3, 0.26, 0.02]} color="#cfcfcf" position={[0, -1.28, -0.1]} metal={0.5} rough={0.4} />
      </group>

      {/* LEFT plain wall */}
      <mesh position={[-R, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[2 * R, H]} /><meshStandardMaterial color={WALL2} roughness={1} /></mesh>

      {/* RIGHT plain wall */}
      <mesh position={[R, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[2 * R, H]} /><meshStandardMaterial color={WALL2} roughness={1} /></mesh>

      {/* skirting all round */}
      <Box args={[2 * R, 0.16, 0.04]} color="#2e2517" position={[0, 0.08, -R + 0.03]} />
      <Box args={[2 * R, 0.16, 0.04]} color="#2e2517" position={[0, 0.08, R - 0.03]} />
      <Box args={[0.04, 0.16, 2 * R]} color="#2e2517" position={[-R + 0.03, 0.08, 0]} />
      <Box args={[0.04, 0.16, 2 * R]} color="#2e2517" position={[R - 0.03, 0.08, 0]} />

      {/* sparse leftover clutter */}
      <group position={[-1.6, 0, -1.7]}>
        <Box args={[0.85, 0.65, 0.65]} color="#9a6c42" position={[0, 0.32, 0]} />
        <Box args={[0.87, 0.05, 0.67]} color="#b38350" position={[0, 0.65, 0]} />
      </group>
      <mesh position={[1.8, 0.2, -1.4]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#7e4f43" roughness={0.9} /></mesh>

      {/* ceiling fan (hangs from the ceiling) */}
      <group position={[0.2, H, 0]}><CeilingFan /></group>

      <Motes />
    </>
  );
}

class GLBoundary extends Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function DustyRoom3D({ narration }) {
  const ctrl = useRef({ yaw: 0, pitch: 0.12, dragging: false, lx: 0, ly: 0, nudge: { x: 0, y: 0 } });
  const kabirRef = useRef();

  const onDown = (e) => { const c = ctrl.current; c.dragging = true; c.lx = e.clientX; c.ly = e.clientY; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    const c = ctrl.current; if (!c.dragging) return;
    c.yaw += (e.clientX - c.lx) * 0.005;
    c.pitch = Math.max(-0.7, Math.min(1.35, c.pitch - (e.clientY - c.ly) * 0.005));
    c.lx = e.clientX; c.ly = e.clientY;
  };
  const onUp = () => { ctrl.current.dragging = false; };
  const setNudge = (x, y) => () => { ctrl.current.nudge = { x, y }; };
  const clearNudge = () => { ctrl.current.nudge = { x: 0, y: 0 }; };

  const arrow = (x, y, Icon, cls) => (
    <button
      className={`dbm-arrowpad__btn dbm-arrowpad__btn--${cls}`}
      onPointerEnter={setNudge(x, y)} onPointerLeave={clearNudge}
      onPointerDown={setNudge(x, y)} onPointerUp={clearNudge}
      aria-label={`look ${cls}`}
    ><Icon size={16} /></button>
  );

  return (
    <div className="dbm-dusty3d" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <GLBoundary fallback={<DustyRoom />}>
        <Canvas dpr={[1, 1.8]} camera={{ position: [0, 1.8, 1.0], fov: 76 }} gl={{ antialias: true, alpha: true }}>
          <color attach="background" args={['#1a140d']} />
          <fog attach="fog" args={['#cdbfa6', 12, 30]} />
          <Suspense fallback={null}>
            <RoomScene ctrl={ctrl} cine={narration?.currentLine === 0} kabirRef={kabirRef} />
          </Suspense>
        </Canvas>
      </GLBoundary>

      {/* Kabir, anchored inside the room — pans with the camera */}
      <div className="dbm-room-kabir" ref={kabirRef}>
        <Kabir mood="wave" speaking={narration?.speaking} amplitude={narration?.amplitude || 0} size={197} />
      </div>

      <div className="dbm-dusty__tag">Your room — right now 🕸️</div>

      {/* corner arrow pad — hover/press to look around */}
      <div className="dbm-arrowpad" onPointerDown={(e) => e.stopPropagation()}>
        {arrow(0, 1, ChevronUp, 'up')}
        {arrow(1, 0, ChevronLeft, 'left')}
        {arrow(-1, 0, ChevronRight, 'right')}
        {arrow(0, -1, ChevronDown, 'down')}
      </div>
    </div>
  );
}
