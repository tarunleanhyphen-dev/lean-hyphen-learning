import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Detailed cartoon 3D characters built from layered primitives. Three
 * character variants:
 *
 *   ritwik  — 13yo boy. Short messy hair with fringe, blue hoodie with
 *             drawstring + pouch, jeans, sneakers. Holding a phone.
 *   mom     — adult woman. Long flowing hair parted in the middle,
 *             orange kurta with neckline trim, bindi, defined lips.
 *   system  — glowing cyan orb + halo + torus-knot body. (cyber).
 *
 * Each face has:
 *   - White-sclera eyes with a black pupil that subtly tracks the
 *     "other speaker" so characters look at each other while talking.
 *   - A nose (small cone) + ears.
 *   - A mouth that morphs between four shapes based on `emotion` AND
 *     the speech amplitudeRef:
 *       neutral / serious  → thin horizontal line
 *       happy / confident  → smile curve (torus arc)
 *       shocked / surprised → open oval (sphere widens)
 *       unsettled / sad    → flat frown (torus arc rotated)
 *   - Brows that tilt + raise per emotion.
 *
 * The `headRef` prop (THREE.Vector3) is updated each frame with the head
 * world position so the Scene wrapper can anchor an HTML speech bubble
 * above this character.
 */

const PALETTES = {
  ritwik: {
    skin: '#E8B98A',
    skinShade: '#C99B6D',
    hair: '#2A1810',
    hairHi: '#3E2818',
    top: '#2563EB',          // blue hoodie
    topShade: '#1E3A8A',
    pant: '#1F2937',         // dark jeans
    shoe: '#0F172A',
    lip: '#9B5252',
    iris: '#3B2A1A',
    name: 'Ritwik',
  },
  mom: {
    skin: '#E0A878',
    skinShade: '#B58656',
    hair: '#1A0E08',
    hairHi: '#2B1A10',
    top: '#E76F51',          // warm orange kurta
    topShade: '#B0492F',
    trim: '#FDE047',         // gold neckline
    pant: '#3E2818',
    shoe: '#4A3520',
    lip: '#A53E45',
    iris: '#2C1A0F',
    bindi: '#DC2626',
    name: 'Mom',
  },
  system: {
    skin: '#22D3EE',
    top: '#0EA5E9',
    mouth: '#FDE047',
    eye: '#FDE047',
    name: 'System',
  },
};

export default function Character3D({
  who = 'ritwik',
  position = [0, 0, 0],
  facing = 0,
  speaking = false,
  amplitudeRef,
  emotion = 'neutral',
  scale = 1,
  headRef,
  lookAt,                          // [x,y,z] — where the eyes should look
}) {
  const palette = PALETTES[who] || PALETTES.ritwik;

  const group = useRef();
  const head = useRef();
  const body = useRef();
  const mouth = useRef();
  const mouthSmile = useRef();
  const mouthOpen = useRef();
  const leftBrow = useRef();
  const rightBrow = useRef();
  const leftPupil = useRef();
  const rightPupil = useRef();

  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const tRef = useRef(0);
  const blinkRef = useRef({ next: 3 + Math.random() * 4, closing: 0 });
  const lookV = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    tRef.current += dt;
    const t = tRef.current;

    /* ---- Body breath + bob ---- */
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.4 + phase) * 0.012;
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(t * 1.1 + phase) * 0.012;
      group.current.rotation.y += (facing - group.current.rotation.y) * 0.08;
    }
    if (head.current) {
      const sway = speaking ? Math.sin(t * 3) * 0.025 : Math.sin(t * 0.8 + phase) * 0.008;
      head.current.rotation.z = sway;
      // Emotion-driven head tilt
      const tilt = emotion === 'shocked' ? 0.06 : emotion === 'unsettled' ? -0.04 : 0;
      head.current.rotation.x = tilt;
    }

    /* ---- Mouth: morph based on emotion + speech amplitude ---- */
    if (mouth.current && mouthSmile.current && mouthOpen.current) {
      const amp = speaking ? Math.min(1, Math.max(0, (amplitudeRef?.current ?? 0) * 2.4)) : 0;
      const eShape = mouthShape(emotion);
      // Neutral lip — visible when not smiling / not open
      mouth.current.scale.y = 1 + amp * 3.2;
      mouth.current.scale.x = 1 - amp * 0.15;
      mouth.current.visible = eShape.line && amp < 0.55;
      // Smile arc visible for happy / confident emotions
      mouthSmile.current.visible = eShape.smile;
      mouthSmile.current.rotation.z = eShape.smileFrown; // flip arc for frown
      // Open oval visible when shocked or strongly speaking
      const openScale = Math.max(eShape.openBase, amp * 1.3);
      mouthOpen.current.visible = openScale > 0.25;
      mouthOpen.current.scale.set(openScale * 0.9, openScale * 1.1, 1);
    }

    /* ---- Brows ---- */
    if (leftBrow.current && rightBrow.current) {
      const brow = browFor(emotion);
      leftBrow.current.position.y  = brow.baseY + brow.dy;
      rightBrow.current.position.y = brow.baseY + brow.dy;
      leftBrow.current.rotation.z  = brow.rotL;
      rightBrow.current.rotation.z = brow.rotR;
    }

    /* ---- Pupils — look toward `lookAt`, with idle micro-movement ---- */
    if (leftPupil.current && rightPupil.current) {
      // Idle: subtle micro-saccades
      const idleX = Math.sin(t * 0.6 + phase) * 0.01;
      const idleY = Math.cos(t * 0.4 + phase) * 0.006;
      let lx = idleX, ly = idleY;
      if (lookAt && group.current) {
        // Convert world look target to head-local offset
        const worldHead = head.current ? head.current.getWorldPosition(lookV.clone()) : new THREE.Vector3();
        const dirX = (lookAt[0] - worldHead.x) * 0.05;
        const dirY = (lookAt[1] - worldHead.y) * 0.04;
        lx = Math.max(-0.025, Math.min(0.025, dirX));
        ly = Math.max(-0.015, Math.min(0.015, dirY));
      }
      leftPupil.current.position.x  = -0.045 + lx;
      leftPupil.current.position.y  = 0     + ly;
      rightPupil.current.position.x =  0.045 + lx;
      rightPupil.current.position.y =  0     + ly;
    }

    /* ---- Blink ---- */
    const b = blinkRef.current;
    b.next -= dt;
    if (b.next <= 0 && b.closing <= 0) {
      b.closing = 0.14;
      b.next = 3 + Math.random() * 4;
    }
    if (b.closing > 0) {
      b.closing -= dt;
      const k = Math.max(0, b.closing / 0.14);
      const scl = k > 0.5 ? 1 - (1 - k) * 2 : k * 2;
      if (leftPupil.current && rightPupil.current) {
        leftPupil.current.scale.y  = scl;
        rightPupil.current.scale.y = scl;
      }
    }

    /* ---- Expose head world position ---- */
    if (headRef && head.current) {
      head.current.getWorldPosition(headRef.current = headRef.current || new THREE.Vector3());
    }
  });

  /* System orb — fully custom */
  if (who === 'system') {
    return (
      <group ref={group} position={position} scale={scale}>
        <mesh ref={head} position={[0, 1.0, 0]} castShadow>
          <icosahedronGeometry args={[0.42, 1]} />
          <meshStandardMaterial color={palette.skin} emissive={palette.skin} emissiveIntensity={1.3} roughness={0.2} metalness={0.45} />
        </mesh>
        {/* Inner core */}
        <mesh position={[0, 1.0, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={2} />
        </mesh>
        {/* Halo ring */}
        <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.65, 0.022, 8, 80]} />
          <meshStandardMaterial color="#7DD3FC" emissive="#22D3EE" emissiveIntensity={1.5} transparent opacity={0.85} />
        </mesh>
        {/* Body — torus knot floating */}
        <mesh ref={body} position={[0, 0.4, 0]} castShadow>
          <torusKnotGeometry args={[0.22, 0.07, 96, 16]} />
          <meshStandardMaterial color={palette.top} emissive={palette.top} emissiveIntensity={0.9} roughness={0.25} metalness={0.6} />
        </mesh>
        {/* Mouth — energy bar that pulses with amplitude */}
        <mesh ref={mouth} position={[0, 0.92, 0.42]}>
          <boxGeometry args={[0.22, 0.05, 0.025]} />
          <meshStandardMaterial color={palette.mouth} emissive={palette.mouth} emissiveIntensity={2} />
        </mesh>
        {/* hidden refs that the frame loop expects */}
        <mesh ref={mouthSmile} visible={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial /></mesh>
        <mesh ref={mouthOpen} visible={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial /></mesh>
        <mesh ref={leftBrow} visible={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial /></mesh>
        <mesh ref={rightBrow} visible={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial /></mesh>
        <mesh ref={leftPupil} visible={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial /></mesh>
        <mesh ref={rightPupil} visible={false}><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial /></mesh>
      </group>
    );
  }

  const isRitwik = who === 'ritwik';
  const headRadius = isRitwik ? 0.38 : 0.40;

  return (
    <group ref={group} position={position} scale={scale}>
      {/* ===== Legs + Feet ===== */}
      <Leg x={-0.18} pant={palette.pant} />
      <Leg x={ 0.18} pant={palette.pant} />
      <mesh position={[-0.18, -0.78, 0.08]} castShadow>
        <boxGeometry args={[0.16, 0.07, 0.32]} />
        <meshStandardMaterial color={palette.shoe} roughness={0.7} />
      </mesh>
      <mesh position={[ 0.18, -0.78, 0.08]} castShadow>
        <boxGeometry args={[0.16, 0.07, 0.32]} />
        <meshStandardMaterial color={palette.shoe} roughness={0.7} />
      </mesh>

      {/* ===== Torso ===== */}
      <mesh ref={body} position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.45, 0.75, 18]} />
        <meshStandardMaterial color={palette.top} roughness={0.7} />
      </mesh>
      {/* hoodie pocket / kurta neckline */}
      {isRitwik ? (
        <mesh position={[0, -0.05, 0.4]} castShadow>
          <boxGeometry args={[0.5, 0.18, 0.04]} />
          <meshStandardMaterial color={palette.topShade} roughness={0.7} />
        </mesh>
      ) : (
        <>
          <mesh position={[0, 0.32, 0.42]} castShadow>
            <torusGeometry args={[0.12, 0.025, 8, 24, Math.PI]} />
            <meshStandardMaterial color={palette.trim} emissive={palette.trim} emissiveIntensity={0.4} roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Kurta flare */}
          <mesh position={[0, -0.32, 0]} castShadow>
            <coneGeometry args={[0.52, 0.32, 18, 1, true]} />
            <meshStandardMaterial color={palette.top} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      {/* Drawstrings for ritwik's hoodie */}
      {isRitwik && (
        <>
          <mesh position={[-0.07, 0.4, 0.36]} rotation={[0, 0, -0.05]}>
            <cylinderGeometry args={[0.012, 0.012, 0.15, 6]} />
            <meshStandardMaterial color="#F1F5F9" />
          </mesh>
          <mesh position={[ 0.07, 0.4, 0.36]} rotation={[0, 0,  0.05]}>
            <cylinderGeometry args={[0.012, 0.012, 0.15, 6]} />
            <meshStandardMaterial color="#F1F5F9" />
          </mesh>
        </>
      )}

      {/* ===== Arms + Hands ===== */}
      <mesh position={[-0.48, 0.18, 0]} rotation={[0, 0, 0.20]} castShadow>
        <cylinderGeometry args={[0.10, 0.11, 0.7, 12]} />
        <meshStandardMaterial color={palette.top} roughness={0.7} />
      </mesh>
      <mesh position={[ 0.48, 0.18, 0]} rotation={[0, 0, -0.20]} castShadow>
        <cylinderGeometry args={[0.10, 0.11, 0.7, 12]} />
        <meshStandardMaterial color={palette.top} roughness={0.7} />
      </mesh>
      <mesh position={[-0.6, -0.18, 0]} castShadow>
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>
      <mesh position={[ 0.6, -0.18, 0]} castShadow>
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>
      {/* Phone in ritwik's right hand */}
      {isRitwik && (
        <mesh position={[0.62, -0.22, 0.18]} rotation={[0.4, 0.2, -0.1]} castShadow>
          <boxGeometry args={[0.14, 0.24, 0.022]} />
          <meshStandardMaterial color="#1F1F24" roughness={0.3} metalness={0.6} />
        </mesh>
      )}

      {/* ===== Neck ===== */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.14, 14]} />
        <meshStandardMaterial color={palette.skin} roughness={0.55} />
      </mesh>

      {/* ===== Head + Face ===== */}
      <group ref={head} position={[0, 0.78, 0]}>
        {/* Skull */}
        <mesh castShadow>
          <sphereGeometry args={[headRadius, 28, 28]} />
          <meshStandardMaterial color={palette.skin} roughness={0.55} />
        </mesh>
        {/* Ears */}
        <mesh position={[-headRadius * 0.97, -0.02, 0]} rotation={[0, 0, 0.2]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={palette.skinShade} roughness={0.55} />
        </mesh>
        <mesh position={[ headRadius * 0.97, -0.02, 0]} rotation={[0, 0, -0.2]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={palette.skinShade} roughness={0.55} />
        </mesh>
        {/* Hair */}
        {isRitwik ? <RitwikHair palette={palette} /> : <MomHair palette={palette} />}

        {/* Bindi for Mom */}
        {!isRitwik && (
          <mesh position={[0, 0.18, headRadius * 0.78]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshStandardMaterial color={palette.bindi} emissive={palette.bindi} emissiveIntensity={0.4} />
          </mesh>
        )}

        {/* Eye sockets — face-relative coords */}
        <group position={[0, 0.04, headRadius * 0.88]}>
          {/* Left eye */}
          <mesh position={[-0.13, 0, 0]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          {/* Right eye */}
          <mesh position={[0.13, 0, 0]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
          {/* Pupils — driven by lookAt */}
          <mesh ref={leftPupil} position={[-0.045, 0, 0.06]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color={palette.iris} />
          </mesh>
          <mesh ref={rightPupil} position={[0.045, 0, 0.06]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color={palette.iris} />
          </mesh>
        </group>

        {/* Eyelashes for Mom — thin band above the eyes */}
        {!isRitwik && (
          <>
            <mesh position={[-0.13, 0.10, headRadius * 0.85]} rotation={[0, 0, 0.1]}>
              <boxGeometry args={[0.17, 0.012, 0.02]} />
              <meshStandardMaterial color={palette.hair} />
            </mesh>
            <mesh position={[ 0.13, 0.10, headRadius * 0.85]} rotation={[0, 0, -0.1]}>
              <boxGeometry args={[0.17, 0.012, 0.02]} />
              <meshStandardMaterial color={palette.hair} />
            </mesh>
          </>
        )}

        {/* Brows */}
        <mesh ref={leftBrow} position={[-0.13, 0.155, headRadius * 0.85]}>
          <boxGeometry args={[0.13, 0.028, 0.022]} />
          <meshStandardMaterial color={palette.hair} />
        </mesh>
        <mesh ref={rightBrow} position={[0.13, 0.155, headRadius * 0.85]}>
          <boxGeometry args={[0.13, 0.028, 0.022]} />
          <meshStandardMaterial color={palette.hair} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.04, headRadius * 1.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.045, 0.12, 12]} />
          <meshStandardMaterial color={palette.skin} roughness={0.55} />
        </mesh>

        {/* Mouth — 3 shapes, switched by frame loop */}
        <group position={[0, -0.16, headRadius * 0.92]}>
          {/* Neutral line lips */}
          <mesh ref={mouth}>
            <boxGeometry args={[0.18, 0.025, 0.025]} />
            <meshStandardMaterial color={palette.lip} />
          </mesh>
          {/* Smile arc — torus segment, hidden by default */}
          <mesh ref={mouthSmile} position={[0, -0.01, 0]} rotation={[0, 0, 0]} visible={false}>
            <torusGeometry args={[0.10, 0.018, 6, 24, Math.PI]} />
            <meshStandardMaterial color={palette.lip} />
          </mesh>
          {/* Open mouth — small sphere */}
          <mesh ref={mouthOpen} position={[0, 0, 0.01]} visible={false}>
            <sphereGeometry args={[0.06, 16, 12]} />
            <meshStandardMaterial color="#3B0A18" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* Name tag floating below feet */}
      <mesh position={[0, -0.86, 0]}>
        <ringGeometry args={[0.38, 0.40, 32]} />
        <meshBasicMaterial color={isRitwik ? '#22D3EE' : '#FB923C'} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* ====== Hair geometries ====== */
function RitwikHair({ palette }) {
  return (
    <>
      {/* Main cap */}
      <mesh position={[0, 0.09, -0.02]} castShadow>
        <sphereGeometry args={[0.42, 22, 22, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      {/* Fringe over forehead */}
      <mesh position={[-0.13, 0.22, 0.30]} rotation={[0.5, -0.15, 0]} castShadow>
        <coneGeometry args={[0.10, 0.16, 10]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      <mesh position={[0.03, 0.24, 0.32]} rotation={[0.6, 0.05, 0]} castShadow>
        <coneGeometry args={[0.12, 0.18, 10]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      <mesh position={[0.18, 0.20, 0.28]} rotation={[0.45, 0.18, 0]} castShadow>
        <coneGeometry args={[0.09, 0.14, 10]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      {/* Highlight tuft */}
      <mesh position={[0.05, 0.32, 0.18]}>
        <sphereGeometry args={[0.10, 12, 12]} />
        <meshStandardMaterial color={palette.hairHi} roughness={0.5} />
      </mesh>
    </>
  );
}

function MomHair({ palette }) {
  return (
    <>
      {/* Main scalp cap with middle parting */}
      <mesh position={[0, 0.10, -0.03]} castShadow>
        <sphereGeometry args={[0.43, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      {/* Parting line — thin skin-coloured strip */}
      <mesh position={[0, 0.32, -0.02]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.025, 0.30, 0.05]} />
        <meshStandardMaterial color={palette.skin} />
      </mesh>
      {/* Side strand left */}
      <mesh position={[-0.32, -0.05, 0.08]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.07, 0.10, 0.55, 12]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      {/* Side strand right */}
      <mesh position={[ 0.32, -0.05, 0.08]} rotation={[0, 0, -0.2]} castShadow>
        <cylinderGeometry args={[0.07, 0.10, 0.55, 12]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      {/* Long back panel */}
      <mesh position={[0, -0.15, -0.22]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.72, 0.78, 0.10]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      {/* Hair tips */}
      <mesh position={[-0.18, -0.55, -0.20]} rotation={[0.3, 0, 0.2]}>
        <coneGeometry args={[0.10, 0.22, 10]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
      <mesh position={[ 0.18, -0.55, -0.20]} rotation={[0.3, 0, -0.2]}>
        <coneGeometry args={[0.10, 0.22, 10]} />
        <meshStandardMaterial color={palette.hair} roughness={0.7} />
      </mesh>
    </>
  );
}

/* ====== Leg piece ====== */
function Leg({ x, pant }) {
  return (
    <mesh position={[x, -0.45, 0]} castShadow>
      <cylinderGeometry args={[0.10, 0.11, 0.6, 12]} />
      <meshStandardMaterial color={pant} roughness={0.8} />
    </mesh>
  );
}

/* ====== Expression maps ====== */
function browFor(emotion) {
  const baseY = 0.155;
  switch (emotion) {
    case 'shocked':   return { baseY, dy:  0.045, rotL:  0.18, rotR: -0.18 };
    case 'realised':  return { baseY, dy:  0.035, rotL:  0.10, rotR: -0.10 };
    case 'unsettled': return { baseY, dy: -0.025, rotL: -0.18, rotR:  0.18 };
    case 'curious':   return { baseY, dy:  0.020, rotL: -0.10, rotR:  0.05 };
    case 'confident':
    case 'happy':     return { baseY, dy:  0.005, rotL: -0.04, rotR:  0.04 };
    default:          return { baseY, dy:  0,     rotL:  0,    rotR:  0 };
  }
}

function mouthShape(emotion) {
  switch (emotion) {
    case 'happy':
    case 'confident':
      // Smile arc up
      return { line: false, smile: true, smileFrown: 0, openBase: 0 };
    case 'unsettled':
    case 'guilty':
      // Frown arc down (rotate the same arc 180°)
      return { line: false, smile: true, smileFrown: Math.PI, openBase: 0 };
    case 'shocked':
      return { line: false, smile: false, smileFrown: 0, openBase: 0.55 };
    case 'realised':
      return { line: false, smile: false, smileFrown: 0, openBase: 0.35 };
    case 'curious':
      return { line: true, smile: false, smileFrown: 0, openBase: 0.15 };
    default:
      return { line: true, smile: false, smileFrown: 0, openBase: 0 };
  }
}
