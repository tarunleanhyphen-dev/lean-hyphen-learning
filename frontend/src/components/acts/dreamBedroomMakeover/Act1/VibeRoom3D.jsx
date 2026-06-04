/**
 * VibeRoom3D — a small, detailed 3D room preview for each style card on
 * Scene 2 (cosy / study / gamer / minimal), per the lesson script. Every room
 * has a curtained window and a wooden-and-glass door. The camera sits INSIDE
 * the room (interior view, like Scene 1); the room is static and eases into a
 * slow-motion spin while the card is hovered (read via a ref so hovering never
 * re-renders the canvas).
 *
 * Pure @react-three/fiber; a flat gradient is shown if WebGL is unavailable.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useMemo, Component } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

/* ---- framed wall posters, drawn onto a 2D canvas and used as a texture ---- */
function makePosterTexture(draw) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 672;
  draw(c.getContext('2d'), c.width, c.height);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* a game cover (gamer room) */
function drawGame(ctx, w, h) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1b0b3c'); bg.addColorStop(1, '#0a0518');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) ctx.fillRect((i * 137) % w, (i * 71) % (h * 0.62), 2, 2);
  ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(w * 0.7, h * 0.26, w * 0.16, 0, 7); ctx.fill();
  ctx.fillStyle = '#7c3fd0'; ctx.beginPath(); ctx.arc(w * 0.66, h * 0.23, w * 0.16, 0, 7); ctx.fill();
  ctx.fillStyle = '#22d3ee'; ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.5); ctx.lineTo(w * 0.39, h * 0.7); ctx.lineTo(w * 0.61, h * 0.7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff5fae'; ctx.fillRect(w * 0.45, h * 0.7, w * 0.1, h * 0.07);
  ctx.fillStyle = '#22ff88'; ctx.textAlign = 'center';
  ctx.font = `bold ${Math.floor(h * 0.11)}px Arial, sans-serif`;
  ctx.fillText('GAME ON', w * 0.5, h * 0.93);
}

/* a motivational quote (study room) */
function drawQuote(ctx, w, h) {
  ctx.fillStyle = '#f4efe1'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#caa84e'; ctx.lineWidth = 10; ctx.strokeRect(22, 22, w - 44, h - 44);
  ctx.fillStyle = '#2f3a2e'; ctx.textAlign = 'center';
  ctx.font = `bold ${Math.floor(h * 0.12)}px Georgia, serif`;
  ctx.fillText('STAY', w * 0.5, h * 0.36);
  ctx.fillText('FOCUSED', w * 0.5, h * 0.5);
  ctx.fillStyle = '#5a6650';
  ctx.font = `italic ${Math.floor(h * 0.052)}px Georgia, serif`;
  ctx.fillText('small steps,', w * 0.5, h * 0.66);
  ctx.fillText('every single day', w * 0.5, h * 0.73);
}

/* a sunset lake view (cosy room) */
function drawLake(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.56);
  sky.addColorStop(0, '#ffd591'); sky.addColorStop(0.55, '#ff9e74'); sky.addColorStop(1, '#ff8088');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.56);
  ctx.fillStyle = '#fff2c4'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.32, w * 0.13, 0, 7); ctx.fill();
  ctx.fillStyle = '#7d6b8a';
  ctx.beginPath(); ctx.moveTo(0, h * 0.56); ctx.lineTo(w * 0.32, h * 0.3); ctx.lineTo(w * 0.56, h * 0.56); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#695879';
  ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.56); ctx.lineTo(w * 0.72, h * 0.28); ctx.lineTo(w, h * 0.56); ctx.closePath(); ctx.fill();
  const lake = ctx.createLinearGradient(0, h * 0.56, 0, h);
  lake.addColorStop(0, '#6fb0d2'); lake.addColorStop(1, '#2d5d80');
  ctx.fillStyle = lake; ctx.fillRect(0, h * 0.56, w, h * 0.44);
  ctx.fillStyle = 'rgba(255,242,196,0.45)'; ctx.fillRect(w * 0.43, h * 0.56, w * 0.14, h * 0.42);
}

/* clean boho/minimalist line-art — calm, "fewer things" (minimal room) */
function drawMinimal(ctx, w, h) {
  ctx.fillStyle = '#ece4d6'; ctx.fillRect(0, 0, w, h);
  // sage hill (lower arch)
  ctx.fillStyle = '#9aa583';
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.74);
  ctx.arc(w * 0.5, h * 0.74, w * 0.5, Math.PI, 0, false); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  // terracotta sun, half-tucked behind the hill
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h * 0.74); ctx.clip();
  ctx.fillStyle = '#c97b5a';
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.42, w * 0.22, 0, 7); ctx.fill();
  ctx.restore();
  // thin sand arch outline echoing the sun
  ctx.strokeStyle = '#b89a74'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.42, w * 0.31, Math.PI, 0, false); ctx.stroke();
  // horizon line
  ctx.strokeStyle = '#5c5346'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(w * 0.18, h * 0.86); ctx.lineTo(w * 0.82, h * 0.86); ctx.stroke();
  // single calm word, tying to "more room to breathe"
  ctx.fillStyle = '#4f4636'; ctx.textAlign = 'center';
  ctx.font = `${Math.floor(h * 0.06)}px Georgia, serif`;
  ctx.fillText('b r e a t h e', w * 0.5, h * 0.93);
  // inner border
  ctx.strokeStyle = '#c3b59c'; ctx.lineWidth = 9; ctx.strokeRect(20, 20, w - 40, h - 40);
}

const POSTER_DRAW = { gamer: drawGame, study: drawQuote, cosy: drawLake, minimal: drawMinimal };

/* a framed poster on the right wall (authored x≈2, faces −X into the room) */
function Poster({ vibe }) {
  const tex = useMemo(() => makePosterTexture(POSTER_DRAW[vibe.id] || drawLake), [vibe.id]);
  return (
    <group position={[1.96, 1.5, -0.4]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0, -0.012]}><planeGeometry args={[1.18, 1.52]} /><meshBasicMaterial color="#15120e" /></mesh>
      <mesh><planeGeometry args={[1.06, 1.4]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    </group>
  );
}

function Box({ args, color, position, rotation, emissive, ei = 0.6, rough = 0.92, metal = 0 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} emissive={emissive || '#000'} emissiveIntensity={emissive ? ei : 0} roughness={rough} metalness={metal} />
    </mesh>
  );
}

const WOOD = '#8a6a45', WOOD_D = '#6b5238';

/* curtained window on the back wall (z ≈ -1.95, faces +Z) */
function Window({ x = 0.85, frame = '#7a5836', curtain = '#d8c4a0' }) {
  return (
    <group position={[x, 1.78, -1.94]}>
      {/* brown wooden frame (solid surround behind the glass) */}
      <Box args={[1.34, 1.34, 0.1]} color={frame} rough={0.8} />
      {/* bright daylight 'outside' seen through the glass */}
      <Box args={[1.1, 1.1, 0.02]} color="#d4ecff" position={[0, 0, 0.05]} emissive="#e8f5ff" ei={0.9} />
      {/* crystal-clear glass pane (transparent, no brown showing through) */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[1.12, 1.12, 0.012]} />
        <meshStandardMaterial color="#f2fbff" transparent opacity={0.16} roughness={0.45} metalness={0} />
      </mesh>
      {/* slim wooden muntin bars in front of the glass */}
      <Box args={[0.05, 1.1, 0.03]} color={frame} position={[0, 0, 0.1]} />
      <Box args={[1.1, 0.05, 0.03]} color={frame} position={[0, 0, 0.1]} />
      <Box args={[1.7, 0.07, 0.07]} color="#4a3a2c" position={[0, 0.8, 0.16]} />{/* rod */}
      <Box args={[0.3, 1.55, 0.1]} color={curtain} position={[-0.74, 0, 0.15]} rough={1} />
      <Box args={[0.3, 1.55, 0.1]} color={curtain} position={[0.74, 0, 0.15]} rough={1} />
    </group>
  );
}

/* wooden + glass door on the FRONT wall (z ≈ +1.94, opposite the bed, faces -Z) */
function Door({ frame = '#6f5030', slab = '#8a6646' }) {
  return (
    <group position={[-0.75, 1.05, 1.94]} rotation={[0, Math.PI, 0]}>
      <Box args={[1.12, 2.12, 0.12]} color={frame} rough={0.8} />
      <Box args={[0.94, 1.96, 0.06]} color={slab} position={[0, 0, 0.05]} rough={0.7} />
      {/* bright daylight + crystal-clear glass in the upper door panel */}
      <Box args={[0.72, 0.82, 0.01]} color="#d4ecff" position={[0, 0.46, 0.085]} emissive="#e8f5ff" ei={0.85} />
      <mesh position={[0, 0.46, 0.1]}>
        <boxGeometry args={[0.74, 0.84, 0.012]} />
        <meshStandardMaterial color="#f2fbff" transparent opacity={0.16} roughness={0.45} metalness={0} />
      </mesh>
      <Box args={[0.32, 0.36, 0.03]} color={frame} position={[-0.18, -0.5, 0.08]} />
      <Box args={[0.32, 0.36, 0.03]} color={frame} position={[0.18, -0.5, 0.08]} />
      <mesh position={[0.36, -0.05, 0.11]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#caa84e" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  );
}

/* tall 2-door wardrobe on the FRONT wall (door side), beside the door */
function Wardrobe({ x = 1.15, body = '#7a5a3c', door = '#8a6646', handle = '#caa84e' }) {
  return (
    <group position={[x, 1.16, 1.71]}>
      <Box args={[0.96, 2.3, 0.52]} color={body} rough={0.85} />
      <Box args={[0.45, 2.18, 0.04]} color={door} position={[-0.24, 0, -0.27]} rough={0.75} />
      <Box args={[0.45, 2.18, 0.04]} color={door} position={[0.24, 0, -0.27]} rough={0.75} />
      <Box args={[0.03, 0.34, 0.05]} color={handle} position={[-0.04, 0, -0.3]} metal={0.5} rough={0.3} />
      <Box args={[0.03, 0.34, 0.05]} color={handle} position={[0.04, 0, -0.3]} metal={0.5} rough={0.3} />
    </group>
  );
}

function Plant({ pos, pot = '#9a7b53', leaf = '#5a8a5a' }) {
  return (
    <group position={pos}>
      <Box args={[0.22, 0.24, 0.22]} color={pot} position={[0, 0.12, 0]} />
      <mesh position={[0, 0.42, 0]}><sphereGeometry args={[0.26, 12, 12]} /><meshStandardMaterial color={leaf} roughness={1} /></mesh>
    </group>
  );
}

function Furniture({ vibe }) {
  switch (vibe.id) {
    case 'cosy': // warm + cosy, modern style
      return (
        <group>
          {/* low modern platform bed */}
          <Box args={[1.7, 0.22, 2.3]} color="#5b4636" position={[-0.45, 0.13, -0.3]} rough={0.8} />
          <Box args={[1.7, 0.26, 2.3]} color="#e09a96" position={[-0.45, 0.36, -0.25]} rough={1} />
          <Box args={[1.7, 0.7, 0.22]} color="#7a5f49" position={[-0.45, 0.5, -1.42]} />{/* slim headboard */}
          <Box args={[0.66, 0.2, 0.44]} color="#fff3e6" position={[-0.78, 0.55, -1.08]} rough={1} />
          <Box args={[0.66, 0.2, 0.44]} color="#ffe6d2" position={[-0.12, 0.55, -1.08]} rough={1} />
          <Box args={[1.55, 0.1, 0.7]} color="#c97f7f" position={[-0.45, 0.52, 0.45]} rough={1} />{/* folded throw */}
          {/* floating nightstand + modern lamp */}
          <Box args={[0.5, 0.22, 0.42]} color="#6b5238" position={[0.95, 0.7, -1.15]} />
          <Box args={[0.1, 0.42, 0.1]} color="#caa06a" position={[0.95, 1.02, -1.15]} />
          <mesh position={[0.95, 1.3, -1.15]}><cylinderGeometry args={[0.16, 0.2, 0.26, 18]} /><meshStandardMaterial color="#ffd28a" emissive="#ffb86b" emissiveIntensity={1.3} /></mesh>
          {/* bluetooth speaker on the nightstand, by the bed */}
          <mesh position={[1.12, 0.92, -1.0]}><cylinderGeometry args={[0.082, 0.088, 0.22, 22]} /><meshStandardMaterial color="#2b2e36" roughness={0.55} /></mesh>
          <mesh position={[1.12, 1.03, -1.0]}><cylinderGeometry args={[0.084, 0.084, 0.016, 22]} /><meshStandardMaterial color="#ffb86b" emissive="#ffb86b" emissiveIntensity={0.8} /></mesh>
          {/* arc floor lamp */}
          <Box args={[0.06, 1.5, 0.06]} color="#4a3f33" position={[1.55, 0.75, 0.2]} />
          <mesh position={[1.15, 1.45, 0.2]}><sphereGeometry args={[0.16, 14, 14]} /><meshStandardMaterial color="#ffdca0" emissive="#ffcf6b" emissiveIntensity={1.0} /></mesh>
          {/* round rug */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.25, 0.02, 0.5]}><circleGeometry args={[0.95, 30]} /><meshStandardMaterial color={vibe.glow} roughness={1} /></mesh>
          {/* framed art */}
          <Box args={[0.5, 0.62, 0.04]} color="#caa06a" position={[-1.1, 1.9, -1.96]} />
          <Box args={[0.4, 0.52, 0.02]} color="#e2887a" position={[-1.1, 1.9, -1.93]} />
          <Plant pos={[1.55, 0, 0.7]} leaf="#6a9a6a" />
          {/* coffered wooden ceiling panel */}
          <Box args={[2.6, 0.05, 2.6]} color="#8a6648" position={[0, 2.95, 0]} rough={0.85} />
          <Box args={[2.2, 0.05, 2.2]} color="#a07a52" position={[0, 2.9, 0]} rough={0.85} />
          <Box args={[0.34, 0.06, 0.34]} color="#caa06a" position={[0, 2.85, 0]} />{/* medallion */}
          {/* hanging pendant lamp */}
          <Box args={[0.03, 0.5, 0.03]} color="#5a4a38" position={[0, 2.58, 0]} />
          <mesh position={[0, 2.3, 0]}><cylinderGeometry args={[0.2, 0.27, 0.28, 20]} /><meshStandardMaterial color="#ffe0a8" emissive="#ffcf8f" emissiveIntensity={1.5} /></mesh>
          {/* warm rope / cove lights running around the ceiling edge */}
          <Box args={[3.84, 0.05, 0.05]} color="#ffcf8f" position={[0, 2.82, -1.92]} emissive="#ffcf8f" ei={1.7} />
          <Box args={[3.84, 0.05, 0.05]} color="#ffcf8f" position={[0, 2.82, 1.92]} emissive="#ffcf8f" ei={1.7} />
          <Box args={[0.05, 0.05, 3.84]} color="#ffcf8f" position={[-1.92, 2.82, 0]} emissive="#ffcf8f" ei={1.7} />
          <Box args={[0.05, 0.05, 3.84]} color="#ffcf8f" position={[1.92, 2.82, 0]} emissive="#ffcf8f" ei={1.7} />
          <Window x={0.4} curtain="#e0c6a0" />
          <Door slab="#9a7350" />
          <Wardrobe body="#8a6648" door="#9a7350" />
          <Poster vibe={vibe} />
        </group>
      );
    case 'study':
      return (
        <group>
          {/* desk */}
          <Box args={[1.9, 0.08, 0.72]} color={WOOD} position={[-0.2, 1.0, -1.25]} />
          <Box args={[0.08, 1.0, 0.08]} color={WOOD_D} position={[-1.05, 0.5, -1.25]} />
          <Box args={[0.08, 1.0, 0.08]} color={WOOD_D} position={[0.6, 0.5, -1.25]} />
          {/* monitor + keyboard */}
          <Box args={[0.72, 0.46, 0.05]} color="#23262e" position={[-0.45, 1.46, -1.45]} />
          <Box args={[0.62, 0.37, 0.02]} color="#eaf4ff" position={[-0.45, 1.46, -1.41]} emissive="#cfe6ff" ei={0.4} />
          {/* notes / document open on the study screen */}
          <Box args={[0.34, 0.035, 0.004]} color="#2f3a4a" position={[-0.55, 1.58, -1.398]} />{/* heading */}
          {[1.52, 1.47, 1.42, 1.37, 1.32].map((y, i) => (
            <Box key={`note${i}`} args={[[0.46, 0.4, 0.44, 0.34, 0.42][i], 0.018, 0.004]} color="#5a6680" position={[[-0.49, -0.52, -0.5, -0.55, -0.51][i], y, -1.398]} />
          ))}
          <Box args={[0.6, 0.03, 0.2]} color="#2a2e36" position={[-0.45, 1.06, -1.1]} />
          {/* task lamp + mug */}
          <Box args={[0.05, 0.42, 0.05]} color="#3a3f48" position={[0.5, 1.25, -1.35]} />
          <Box args={[0.16, 0.1, 0.16]} color="#fff0c4" position={[0.36, 1.44, -1.22]} emissive="#ffe9a8" ei={0.8} />
          <mesh position={[0.55, 1.1, -1.0]}><cylinderGeometry args={[0.07, 0.07, 0.13, 14]} /><meshStandardMaterial color="#d65b5b" /></mesh>
          {/* stack of books + open notebook on the desk */}
          <Box args={[0.34, 0.06, 0.24]} color="#c14b4b" position={[0.2, 1.07, -1.05]} />
          <Box args={[0.32, 0.06, 0.22]} color="#4b7bc1" position={[0.2, 0.13 + 1.0, -1.05]} />
          <Box args={[0.3, 0.05, 0.2]} color="#4bb06a" position={[0.2, 0.19 + 1.0, -1.05]} />
          <Box args={[0.34, 0.02, 0.26]} color="#fdf6e3" position={[-0.05, 1.05, -0.85]} rotation={[0, 0.2, 0]} />
          <Box args={[0.01, 0.18, 0.01]} color="#333" position={[-0.05, 1.07, -0.82]} rotation={[0, 0.2, 0]} />{/* pen */}
          {/* chair — faces the desk (−z), backrest behind the sitter, 4 legs */}
          <Box args={[0.5, 0.1, 0.5]} color="#4b5563" position={[-0.45, 0.55, -0.45]} />
          <Box args={[0.5, 0.6, 0.1]} color="#4b5563" position={[-0.45, 0.85, -0.25]} />
          {[[-0.63, -0.63], [-0.27, -0.63], [-0.63, -0.27], [-0.27, -0.27]].map(([x, z], i) => (
            <Box key={i} args={[0.06, 0.5, 0.06]} color="#374151" position={[x, 0.25, z]} />
          ))}
          {/* tall bookshelf, rows of books */}
          <Box args={[0.95, 1.9, 0.32]} color={WOOD} position={[1.45, 0.95, -1.5]} />
          {[0.45, 0.95, 1.45].map((y, r) => (
            <group key={r}>
              <Box args={[0.9, 0.05, 0.28]} color={WOOD_D} position={[1.45, y + 0.18, -1.5]} />
              {[-0.28, -0.12, 0.04, 0.2].map((dx, c) => (
                <Box key={c} args={[0.12, 0.32, 0.22]} color={['#d65b5b', '#5b8fd6', '#5bd68f', '#e0a23a', '#a855f7'][(r + c) % 5]} position={[1.45 + dx, y + 0.36, -1.5]} />
              ))}
            </group>
          ))}
          {/* small single bed in the corner */}
          <Box args={[0.85, 0.22, 1.7]} color="#6b5238" position={[1.45, 0.13, 0.55]} />
          <Box args={[0.85, 0.18, 1.7]} color="#8fb3d6" position={[1.45, 0.32, 0.6]} rough={1} />
          <Box args={[0.5, 0.16, 0.4]} color="#fff" position={[1.45, 0.42, -0.05]} rough={1} />
          {/* rug + plant */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.02, 0.2]}><planeGeometry args={[1.2, 1.0]} /><meshStandardMaterial color="#cdb89a" roughness={1} /></mesh>
          <Plant pos={[-1.3, 0, 0.7]} leaf="#5b9a6a" />
          {/* basic recessed ceiling panel + flush light */}
          <Box args={[2.8, 0.05, 2.8]} color="#dfeae2" position={[0, 2.95, 0]} rough={0.9} />
          <mesh position={[0, 2.88, 0]}><boxGeometry args={[1.1, 0.05, 1.1]} /><meshStandardMaterial color="#f2fff8" emissive="#eafff6" emissiveIntensity={1.2} /></mesh>
          {/* cool rope / cove lights around the ceiling edge */}
          <Box args={[3.84, 0.05, 0.05]} color="#cfeee6" position={[0, 2.82, -1.92]} emissive="#bdeee2" ei={1.5} />
          <Box args={[3.84, 0.05, 0.05]} color="#cfeee6" position={[0, 2.82, 1.92]} emissive="#bdeee2" ei={1.5} />
          <Box args={[0.05, 0.05, 3.84]} color="#cfeee6" position={[-1.92, 2.82, 0]} emissive="#bdeee2" ei={1.5} />
          <Box args={[0.05, 0.05, 3.84]} color="#cfeee6" position={[1.92, 2.82, 0]} emissive="#bdeee2" ei={1.5} />
          <Window x={0.5} curtain="#bcd0e0" />
          <Door slab="#8a6646" />
          <Wardrobe body={WOOD_D} door={WOOD} />
          <Poster vibe={vibe} />
        </group>
      );
    case 'gamer':
      return (
        <group>
          {/* dark desk */}
          <Box args={[2.1, 0.08, 0.78]} color="#1a1d28" position={[-0.05, 1.0, -1.25]} metal={0.3} />
          <Box args={[0.08, 1.0, 0.08]} color="#11131a" position={[-1.05, 0.5, -1.25]} />
          <Box args={[0.08, 1.0, 0.08]} color="#11131a" position={[0.95, 0.5, -1.25]} />
          {/* triple RGB monitors */}
          <Box args={[0.86, 0.5, 0.05]} color="#0e0f16" position={[-0.6, 1.5, -1.42]} rotation={[0, 0.32, 0]} />
          <Box args={[0.76, 0.42, 0.02]} color="#a855f7" position={[-0.6, 1.5, -1.38]} rotation={[0, 0.32, 0]} emissive="#a855f7" ei={0.95} />
          <Box args={[0.95, 0.54, 0.05]} color="#0e0f16" position={[-0.05, 1.52, -1.48]} />
          <Box args={[0.85, 0.46, 0.02]} color="#22d3ee" position={[-0.05, 1.52, -1.44]} emissive="#22d3ee" ei={0.95} />
          {/* a game running on the centre screen */}
          <Box args={[0.8, 0.24, 0.004]} color="#3b6fd0" position={[-0.05, 1.62, -1.425]} emissive="#3b6fd0" ei={0.55} />{/* sky */}
          <Box args={[0.8, 0.2, 0.004]} color="#3a9a4a" position={[-0.05, 1.42, -1.425]} emissive="#2f8a40" ei={0.4} />{/* ground */}
          <mesh position={[0.22, 1.69, -1.42]}><circleGeometry args={[0.05, 18]} /><meshStandardMaterial color="#ffd23f" emissive="#ffd23f" emissiveIntensity={0.9} /></mesh>{/* sun */}
          <Box args={[0.08, 0.13, 0.004]} color="#15151b" position={[-0.22, 1.47, -1.42]} />{/* player */}
          <Box args={[0.07, 0.07, 0.004]} color="#ff5fae" position={[0.12, 1.46, -1.42]} emissive="#ff5fae" ei={0.7} />{/* enemy */}
          <Box args={[0.24, 0.03, 0.004]} color="#22ff88" position={[-0.31, 1.72, -1.42]} emissive="#22ff88" ei={0.8} />{/* HUD bar */}
          <Box args={[0.86, 0.5, 0.05]} color="#0e0f16" position={[0.5, 1.5, -1.42]} rotation={[0, -0.32, 0]} />
          <Box args={[0.76, 0.42, 0.02]} color="#ff5fae" position={[0.5, 1.5, -1.38]} rotation={[0, -0.32, 0]} emissive="#ff5fae" ei={0.95} />
          {/* RGB keyboard + mouse */}
          <Box args={[0.72, 0.04, 0.22]} color="#15171f" position={[-0.05, 1.06, -1.02]} />
          <Box args={[0.68, 0.015, 0.18]} color="#ff5fae" position={[-0.05, 1.085, -1.02]} emissive="#ff5fae" ei={0.8} />
          <Box args={[0.12, 0.04, 0.2]} color="#15171f" position={[0.5, 1.06, -1.0]} />
          {/* headphone stand */}
          <Box args={[0.05, 0.42, 0.05]} color="#222" position={[0.85, 1.25, -1.2]} />
          <mesh position={[0.85, 1.5, -1.2]}><torusGeometry args={[0.12, 0.04, 8, 18]} /><meshStandardMaterial color="#2a2d36" metalness={0.4} /></mesh>
          {/* RGB PC tower */}
          <Box args={[0.4, 0.78, 0.66]} color="#15171f" position={[-1.45, 0.4, -1.0]} metal={0.2} />
          <Box args={[0.02, 0.56, 0.46]} color="#22d3ee" position={[-1.24, 0.45, -1.0]} emissive="#22d3ee" ei={0.9} />
          <Box args={[0.3, 0.02, 0.5]} color="#a855f7" position={[-1.45, 0.8, -1.0]} emissive="#a855f7" ei={0.6} />
          {/* gaming chair */}
          <Box args={[0.58, 0.12, 0.58]} color="#e0444c" position={[-0.05, 0.62, -0.25]} />
          <Box args={[0.58, 1.0, 0.12]} color="#e0444c" position={[-0.05, 1.12, 0.02]} />
          <Box args={[0.18, 0.9, 0.1]} color="#15171f" position={[-0.05, 1.12, 0.04]} />
          <Box args={[0.5, 0.06, 0.5]} color="#111418" position={[-0.05, 0.08, -0.25]} metal={0.5} />
          <Box args={[0.08, 0.5, 0.08]} color="#1a1d24" position={[-0.05, 0.32, -0.25]} />
          {/* wall shelf w/ collectibles + neon sign */}
          <Box args={[1.5, 0.06, 0.26]} color="#22252f" position={[-0.2, 2.2, -1.9]} />
          <Box args={[0.2, 0.32, 0.2]} color="#a855f7" position={[-0.7, 2.42, -1.9]} emissive="#a855f7" ei={0.4} />
          <Box args={[0.18, 0.26, 0.18]} color="#ff5fae" position={[-0.3, 2.39, -1.9]} />
          <Box args={[0.2, 0.3, 0.2]} color="#22d3ee" position={[0.1, 2.41, -1.9]} />
          <mesh position={[1.3, 2.3, -1.92]}><torusGeometry args={[0.22, 0.04, 10, 24]} /><meshStandardMaterial color="#ff5fae" emissive="#ff5fae" emissiveIntensity={1.4} /></mesh>
          {/* LED strips */}
          <Box args={[3.96, 0.06, 0.06]} color={vibe.glow} position={[0, 2.72, -1.97]} emissive={vibe.glow} ei={1.6} />
          <Box args={[0.06, 0.06, 3.96]} color="#ff5fae" position={[-1.97, 2.72, 0]} emissive="#ff5fae" ei={1.6} />
          <Box args={[3.96, 0.05, 0.05]} color="#22d3ee" position={[0, 0.12, -1.97]} emissive="#22d3ee" ei={1.2} />
          {/* rug */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.35]}><planeGeometry args={[1.7, 1.6]} /><meshStandardMaterial color="#1e2130" roughness={1} /></mesh>
          <Window x={1.0} frame="#2a2d3a" curtain="#3a2d52" />
          <Door frame="#2a2d3a" slab="#3a3f4d" />
          <Wardrobe body="#1a1d28" door="#22252f" handle="#a855f7" />
          <Poster vibe={vibe} />
        </group>
      );
    default: // minimal
      return (
        <group>
          <Box args={[1.4, 0.26, 2.0]} color="#cbb59a" position={[-0.45, 0.18, -0.4]} />
          <Box args={[1.4, 0.2, 2.0]} color="#bfe0f5" position={[-0.45, 0.4, -0.35]} rough={1} />{/* light-blue mattress */}
          <Box args={[1.4, 0.4, 0.22]} color="#cbb59a" position={[-0.45, 0.45, -1.32]} />
          <Box args={[0.6, 0.16, 0.4]} color="#f5f6f8" position={[-0.45, 0.55, -1.05]} rough={1} />
          {/* a basic table + chair */}
          <Box args={[0.95, 0.06, 0.6]} color="#d8c9b0" position={[1.1, 0.78, -1.0]} />
          <Box args={[0.06, 0.78, 0.06]} color="#c2b298" position={[0.7, 0.39, -0.75]} />
          <Box args={[0.06, 0.78, 0.06]} color="#c2b298" position={[1.5, 0.39, -0.75]} />
          <Box args={[0.06, 0.78, 0.06]} color="#c2b298" position={[0.7, 0.39, -1.25]} />
          <Box args={[0.06, 0.78, 0.06]} color="#c2b298" position={[1.5, 0.39, -1.25]} />
          <Box args={[0.42, 0.06, 0.42]} color="#e6e0d4" position={[1.1, 0.5, -0.35]} />
          <Box args={[0.42, 0.5, 0.06]} color="#e6e0d4" position={[1.1, 0.75, -0.15]} />
          {[[0.92, -0.53], [1.28, -0.53], [0.92, -0.17], [1.28, -0.17]].map(([x, z], i) => (
            <Box key={i} args={[0.05, 0.47, 0.05]} color="#cfc7b6" position={[x, 0.235, z]} />
          ))}
          {/* single framed art + plant */}
          <Box args={[0.5, 0.6, 0.03]} color="#dad4c8" position={[-1.0, 1.85, -1.96]} />
          <Box args={[0.4, 0.5, 0.01]} color="#bcc6cf" position={[-1.0, 1.85, -1.94]} />
          <Plant pos={[1.5, 0, 0.6]} pot="#d8d2c6" leaf="#6aa07a" />
          {/* light rug */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.02, 0.4]}><circleGeometry args={[0.85, 28]} /><meshStandardMaterial color="#e3ded3" roughness={1} /></mesh>
          {/* basic minimalist recessed ceiling panel */}
          <Box args={[3.0, 0.05, 3.0]} color="#eef1f4" position={[0, 2.95, 0]} rough={1} />
          <Box args={[2.2, 0.04, 2.2]} color="#e2e6ea" position={[0, 2.9, 0]} rough={1} />
          {/* clean soft-white rope / cove lights around the ceiling edge */}
          <Box args={[3.84, 0.05, 0.05]} color="#f4f9ff" position={[0, 2.82, -1.92]} emissive="#eaf4ff" ei={1.4} />
          <Box args={[3.84, 0.05, 0.05]} color="#f4f9ff" position={[0, 2.82, 1.92]} emissive="#eaf4ff" ei={1.4} />
          <Box args={[0.05, 0.05, 3.84]} color="#f4f9ff" position={[-1.92, 2.82, 0]} emissive="#eaf4ff" ei={1.4} />
          <Box args={[0.05, 0.05, 3.84]} color="#f4f9ff" position={[1.92, 2.82, 0]} emissive="#eaf4ff" ei={1.4} />
          <Window x={0.6} frame="#bca888" curtain="#bfe0f5" />
          <Door frame="#bca888" slab="#d8c9b0" />
          <Wardrobe body="#cbb59a" door="#d8c9b0" handle="#b9a88c" />
          <Poster vibe={vibe} />
        </group>
      );
  }
}

function Lights({ vibe }) {
  switch (vibe.id) {
    case 'gamer':
      return (<>
        <ambientLight intensity={1.05} color="#e6ddff" />
        <pointLight position={[-1, 1.6, 1]} intensity={1.5} color={vibe.glow} distance={9} />
        <pointLight position={[1.6, 1, -1]} intensity={1.2} color="#ff5fae" distance={9} />
        <directionalLight position={[3, 4, 3]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[-2, 3, 2]} intensity={0.6} color="#cfe0ff" />
      </>);
    case 'cosy':
      return (<>
        <ambientLight intensity={1.05} color="#fff0dc" />
        <pointLight position={[0.95, 1.3, -1.15]} intensity={1.7} color="#ffb86b" distance={6} />
        <pointLight position={[0, 3.0, 0]} intensity={1.1} color="#ffcf8f" distance={9} />{/* pendant + cove glow */}
        <directionalLight position={[3, 4, 3]} intensity={0.95} color="#fff1dd" />
        <directionalLight position={[-2, 3, 2]} intensity={0.5} color="#ffe7c4" />
      </>);
    case 'minimal':
      return (<>
        <ambientLight intensity={1.1} color="#f4f7fa" />
        <directionalLight position={[3, 5, 3]} intensity={1.0} color="#ffffff" />
        <pointLight position={[0, 3.0, 0]} intensity={0.8} color="#eaf4ff" distance={9} />{/* cove glow */}
      </>);
    default: // study
      return (<>
        <ambientLight intensity={0.9} color="#eef3f8" />
        <directionalLight position={[2, 4, 3]} intensity={0.85} color="#ffffff" />
        <pointLight position={[0.36, 1.5, -1.15]} intensity={0.5} color="#fff0c4" distance={5} />
        <pointLight position={[0, 3.0, 0]} intensity={0.9} color="#e8fff8" distance={9} />{/* ceiling + cove glow */}
      </>);
  }
}

function Scene({ vibe, hoveredRef }) {
  const g = useRef();
  const speed = useRef(0);
  useFrame((_, d) => {
    if (!g.current) return;
    // STATIC until hovered — then this room (and only this one) eases into a spin
    const target = hoveredRef?.current ? 0.42 : 0;
    speed.current += (target - speed.current) * 0.07;
    g.current.rotation.y += d * speed.current;
  });
  // Interior view (same style as Scene 1): the camera sits INSIDE the room
  // looking toward the back wall. Each wall's front face points into the room,
  // so from inside all four walls are visible — a full enclosed room. Room is
  // 6×6×4; the camera stays at xz-radius < 3 (the wall half-size), so it remains
  // inside the box at every rotation angle while the room turns on hover. The
  // furniture is authored for a 4×4×3 box, so it's scaled up to fill the 6×6×4
  // room (and wall-anchored pieces move out to the new wall planes).
  return (
    <>
      <Lights vibe={vibe} />
      <group ref={g} rotation={[0, 0.35, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[6, 6]} /><meshStandardMaterial color={vibe.floor} roughness={1} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}><planeGeometry args={[6, 6]} /><meshStandardMaterial color={vibe.wall} roughness={1} /></mesh>
        <mesh position={[0, 2, -3]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color={vibe.wall} roughness={1} /></mesh>
        <mesh position={[0, 2, 3]} rotation={[0, Math.PI, 0]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color={vibe.wall} roughness={1} /></mesh>
        <mesh position={[-3, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color={vibe.wall2} roughness={1} /></mesh>
        <mesh position={[3, 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><meshStandardMaterial color={vibe.wall2} roughness={1} /></mesh>
        <group scale={[1.5, 1.3333, 1.5]}><Furniture vibe={vibe} /></group>
      </group>
    </>
  );
}

class GLBoundary extends Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function VibeRoom3D({ vibe, hoveredRef }) {
  const fallback = <div className="dbm-vcard__fallback" style={{ background: `linear-gradient(160deg, ${vibe.wall2}, ${vibe.floor})` }} />;
  return (
    <GLBoundary fallback={fallback}>
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 2.05, 2.55], fov: 72 }} onCreated={({ camera }) => camera.lookAt(0, 1.35, -3)} gl={{ antialias: true, alpha: true }} style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={null}>
          <Scene vibe={vibe} hoveredRef={hoveredRef} />
        </Suspense>
      </Canvas>
    </GLBoundary>
  );
}
