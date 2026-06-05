/**
 * Small spinning 3D preview of a catalogue item — reuses the SAME 3D models the
 * room is built from (Room3D's ART), re-centred and auto-rotating. Mounted only
 * while a shop card is hovered, so only one WebGL context is alive at a time.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, Component } from 'react';
import { ART, ITEM_POS } from './Room3D.jsx';

/* per-item scale so small items (lamp, fan, speaker) fill the frame like big ones */
const PREVIEW_SCALE = {
  'bed-budget': 0.8, 'bed-premium': 0.8, 'wardrobe-budget': 0.78, 'wardrobe-premium': 0.7,
  'study-desk': 0.85, 'basic-chair': 1.05, 'gaming-chair': 0.95, 'bookshelf': 0.82, 'under-bed-box': 1.7,
  'desk-lamp': 2.2, 'curtains': 0.8, 'table-fan': 2.5, 'posters': 1.4, 'bluetooth-speaker': 2.7,
  'mini-fridge': 1.25, 'mirror': 1.2,
};

function Spinner({ children }) {
  const ref = useRef();
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 1.1; });
  return <group ref={ref}>{children}</group>;
}

class GLB extends Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function ItemPreview3D({ itemId }) {
  const render = ART[itemId];
  if (!render) return null;
  const p = ITEM_POS[itemId] || [0, 0, 0];
  const s = PREVIEW_SCALE[itemId] || 1;
  return (
    <GLB>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [2.7, 2.0, 3.1], fov: 38 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.7, 0)}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <ambientLight intensity={0.95} color="#ffffff" />
        <directionalLight position={[3, 5, 4]} intensity={1.15} />
        <directionalLight position={[-3, 2, -2]} intensity={0.5} color="#cfe0ff" />
        <Suspense fallback={null}>
          <Spinner>
            <group scale={s}>
              <group position={[-p[0], -p[1], -p[2]]}>{render()}</group>
            </group>
          </Spinner>
        </Suspense>
      </Canvas>
    </GLB>
  );
}
