import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * RPMAvatar — loads a Ready Player Me 3D human avatar (.glb URL).
 *
 * RPM gives every avatar a standard set of:
 *   - 52 ARKit-compatible morph targets on the face mesh (Wolf3D_Head /
 *     Wolf3D_Teeth) — we use a small subset for lip-sync + expressions.
 *   - Bone-skinned mesh — we can rotate the head bone toward whoever
 *     is speaking so the character actually looks at them.
 *
 * Wire-up flow:
 *   1. User creates avatar at https://readyplayer.me (5 min)
 *   2. They send back a .glb URL like
 *      https://models.readyplayer.me/<id>.glb
 *   3. We pass that URL as the `url` prop and the avatar drops in.
 *
 * If `url` is null/undefined we render a soft placeholder cube so the
 * stage doesn't crash before the URLs land.
 */

export default function RPMAvatar({
  url,
  speaking = false,
  amplitudeRef,
  emotion = 'neutral',
  lookAt = 'forward',   // 'left' | 'right' | 'forward'
  position = [0, -1.6, 0],
  scale = 1.6,
  className = '',
}) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.2, 2.4], fov: 32 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[2, 4, 3]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-2, 2, 2]} intensity={0.5} color="#FFD9A8" />
        <Environment preset="apartment" />
        <ContactShadows position={[0, -1.55, 0]} opacity={0.4} scale={6} blur={2.4} far={3} />

        {url ? (
          <RPMModel
            url={url}
            speaking={speaking}
            amplitudeRef={amplitudeRef}
            emotion={emotion}
            lookAt={lookAt}
            position={position}
            scale={scale}
          />
        ) : (
          <Placeholder />
        )}
      </Canvas>
    </div>
  );
}

function RPMModel({ url, speaking, amplitudeRef, emotion, lookAt, position, scale }) {
  // Stable load — drei caches per-URL, so re-renders don't re-fetch.
  const { scene, animations } = useGLTF(url);
  const group = useRef();
  const { actions } = useAnimations(animations, group);

  // Find the head mesh (Wolf3D_Head) — RPM avatars have a known mesh name.
  const headMesh = useMemo(() => {
    let found = null;
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.morphTargetDictionary && obj.name?.includes('Head')) {
        found = obj;
      }
    });
    return found;
  }, [scene]);

  const teethMesh = useMemo(() => {
    let found = null;
    scene.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.name?.includes('Teeth')) found = obj;
    });
    return found;
  }, [scene]);

  // Head bone for look-at rotation
  const headBone = useMemo(() => {
    let found = null;
    scene.traverse((obj) => {
      if (obj.isBone && (obj.name === 'Head' || obj.name === 'head' || obj.name?.endsWith('_Head'))) {
        found = obj;
      }
    });
    return found;
  }, [scene]);

  // Auto-play any idle animation that ships with the model
  useEffect(() => {
    if (!actions) return;
    const idle = actions['Idle'] || actions['idle'] || Object.values(actions)[0];
    if (idle) {
      idle.reset().fadeIn(0.4).play();
    }
  }, [actions]);

  // Lip-sync + expression + look-at — runs every frame
  const blinkT = useRef(2 + Math.random() * 3);
  const blinkValue = useRef(0);
  const smoothed = useRef(0);
  const lookYaw = useRef(0);

  useFrame((_, dt) => {
    if (!headMesh || !headMesh.morphTargetDictionary) return;
    const dict = headMesh.morphTargetDictionary;
    const inf = headMesh.morphTargetInfluences;

    // === Lip-sync: drive the jawOpen + mouthOpen morphs from amplitudeRef ===
    const raw = speaking ? (amplitudeRef?.current ?? 0) : 0;
    const target = Math.min(1, Math.max(0, (raw - 0.03) * 3.2));
    smoothed.current += (target - smoothed.current) * (target > smoothed.current ? 0.55 : 0.30);
    const a = smoothed.current;
    setMorph(inf, dict, 'jawOpen',        a * 0.55);
    setMorph(inf, dict, 'mouthOpen',      a * 0.45);
    setMorph(inf, dict, 'mouthSmile',     a * 0.15);
    setMorph(inf, dict, 'viseme_aa',      a * 0.6);
    // mirror on teeth so opening shows them
    if (teethMesh?.morphTargetInfluences && teethMesh.morphTargetDictionary) {
      setMorph(teethMesh.morphTargetInfluences, teethMesh.morphTargetDictionary, 'jawOpen', a * 0.55);
    }

    // === Emotion ===
    const e = expressionFor(emotion);
    setMorph(inf, dict, 'browInnerUp',     e.browInnerUp);
    setMorph(inf, dict, 'browOuterUpLeft', e.browOuterUp);
    setMorph(inf, dict, 'browOuterUpRight',e.browOuterUp);
    setMorph(inf, dict, 'browDownLeft',    e.browDown);
    setMorph(inf, dict, 'browDownRight',   e.browDown);
    setMorph(inf, dict, 'mouthSmileLeft',  Math.max(a * 0.15, e.smile));
    setMorph(inf, dict, 'mouthSmileRight', Math.max(a * 0.15, e.smile));
    setMorph(inf, dict, 'mouthFrownLeft',  e.frown);
    setMorph(inf, dict, 'mouthFrownRight', e.frown);

    // === Blink loop ===
    blinkT.current -= dt;
    if (blinkT.current <= 0 && blinkValue.current === 0) {
      blinkValue.current = 1;
      blinkT.current = 3 + Math.random() * 3;
      setTimeout(() => { blinkValue.current = 0; }, 130);
    }
    setMorph(inf, dict, 'eyeBlinkLeft',  blinkValue.current);
    setMorph(inf, dict, 'eyeBlinkRight', blinkValue.current);

    // === Look-at: rotate head bone toward the active speaker ===
    if (headBone) {
      const wantYaw = lookAt === 'left' ? 0.35 : lookAt === 'right' ? -0.35 : 0;
      lookYaw.current += (wantYaw - lookYaw.current) * 0.08;
      headBone.rotation.y = lookYaw.current;
    }
  });

  return (
    <primitive
      ref={group}
      object={scene}
      position={position}
      scale={scale}
    />
  );
}

/* Helper: safely set a morph target by name */
function setMorph(influences, dict, name, value) {
  const idx = dict[name];
  if (idx === undefined) return;
  influences[idx] = value;
}

/* Mapping our emotion strings → RPM ARKit morph values */
function expressionFor(emotion) {
  switch (emotion) {
    case 'shocked':   return { browInnerUp: 0.9, browOuterUp: 0.8, browDown: 0,   smile: 0,   frown: 0.2 };
    case 'realised':  return { browInnerUp: 0.6, browOuterUp: 0.6, browDown: 0,   smile: 0.1, frown: 0 };
    case 'unsettled': return { browInnerUp: 0.3, browOuterUp: 0,   browDown: 0.6, smile: 0,   frown: 0.5 };
    case 'curious':   return { browInnerUp: 0.4, browOuterUp: 0.3, browDown: 0,   smile: 0.1, frown: 0 };
    case 'happy':
    case 'confident': return { browInnerUp: 0,   browOuterUp: 0.15,browDown: 0,   smile: 0.55,frown: 0 };
    default:          return { browInnerUp: 0,   browOuterUp: 0,   browDown: 0,   smile: 0.2, frown: 0 };
  }
}

/* Placeholder rendered until the RPM URL is supplied */
function Placeholder() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.6, 6, 16]} />
        <meshStandardMaterial color="#5F259F" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#E8B98A" />
      </mesh>
    </group>
  );
}

/* Drei caches GLBs by URL — preload the moment the URL is known so
 * there's no visible pop-in when the avatar mounts. Call from Act1
 * when you wire the URLs. */
export function preloadRPMAvatar(url) {
  if (url) useGLTF.preload(url);
}
