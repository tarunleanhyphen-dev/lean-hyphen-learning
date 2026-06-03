/**
 * 2D dollhouse room — used both as the WebGL fallback for <Room3D> and as a
 * lightweight "flat" preview. Furniture pops in/out as the cart changes.
 * Vibe colours drive the wall + floor + glow.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { ItemArt } from './ItemArt.jsx';

/* left% / bottom% within the floor band, and render scale, per item id */
const POS = {
  'bed-budget':       { l: 20, b: 4,  s: 1.7 },
  'bed-premium':      { l: 20, b: 4,  s: 1.8 },
  'wardrobe-budget':  { l: 74, b: 6,  s: 1.6 },
  'wardrobe-premium': { l: 74, b: 6,  s: 1.7 },
  'study-desk':       { l: 49, b: 3,  s: 1.4 },
  'basic-chair':      { l: 40, b: 1,  s: 1.05 },
  'gaming-chair':     { l: 40, b: 1,  s: 1.15 },
  'bookshelf':        { l: 88, b: 7,  s: 1.3 },
  'under-bed-box':    { l: 30, b: 0,  s: 0.85 },
  'desk-lamp':        { l: 55, b: 24, s: 0.7 },
  'ceiling-light':    { l: 50, b: 70, s: 0.9 },
  'led-strips':       { l: 0,  b: 0,  s: 1 },
  'curtains':         { l: 63, b: 36, s: 1.5 },
  'table-fan':        { l: 8,  b: 4,  s: 0.95 },
  'posters':          { l: 32, b: 44, s: 1.05 },
  'bluetooth-speaker':{ l: 92, b: 28, s: 0.7 },
  'mini-fridge':      { l: 5,  b: 5,  s: 1.2 },
  'mirror':           { l: 2,  b: 4,  s: 1.35 },
};

export function IsoRoom2D({ vibe, cart = [], className = '' }) {
  const hasLed = cart.includes('led-strips');
  const placed = cart.filter((id) => POS[id]);

  return (
    <div
      className={`iso2d ${className} ${hasLed ? 'iso2d--led' : ''}`}
      style={{
        '--wall': vibe.wall, '--wall2': vibe.wall2, '--floor': vibe.floor, '--glow': vibe.glow,
      }}
    >
      <div className="iso2d__wall" />
      <div className="iso2d__floor" />
      <div className="iso2d__rug" />
      {hasLed && <div className="iso2d__ledtop" />}

      <AnimatePresence>
        {placed.map((id) => {
          const p = POS[id];
          return (
            <motion.div
              key={id}
              className="iso2d__item"
              style={{ left: `${p.l}%`, bottom: `${p.b}%` }}
              initial={{ opacity: 0, y: 18, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: p.s }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            >
              <ItemArt art={(catalogueArt(id))} size={64} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {placed.length === 0 && (
        <div className="iso2d__empty">
          <span>Your room is empty…</span>
          <small>add items and watch it come alive</small>
        </div>
      )}
    </div>
  );
}

/* id → art key (kept local so IsoRoom2D needs no catalogue import) */
function catalogueArt(id) {
  const map = {
    'bed-budget': 'bed', 'bed-premium': 'bed',
    'wardrobe-budget': 'wardrobe', 'wardrobe-premium': 'wardrobe',
    'study-desk': 'desk', 'basic-chair': 'chair', 'gaming-chair': 'gchair',
    'bookshelf': 'shelf', 'under-bed-box': 'boxes',
    'desk-lamp': 'lamp', 'ceiling-light': 'ceiling', 'led-strips': 'led',
    'curtains': 'curtains', 'table-fan': 'fan', 'posters': 'poster',
    'bluetooth-speaker': 'speaker', 'mini-fridge': 'fridge', 'mirror': 'mirror',
  };
  return map[id] || 'boxes';
}
