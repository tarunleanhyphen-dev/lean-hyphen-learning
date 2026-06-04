/**
 * Detailed 2D item illustrations for the Needs-vs-Wants sort (Scene 4) and the
 * shop catalogue (Scene 5). Pure inline SVG — crisp at any size, no assets.
 *
 * <ItemArt2D art="bed" tier="premium" size={120} />
 * `tier` ("budget" | "premium") changes the look for bed and wardrobe.
 */

/* ---- shared bits ---- */
const Defs = ({ id, from, to }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  </defs>
);

/* =================== individual items (viewBox 0 0 100 100) =================== */

function Bed({ premium }) {
  const wood = premium ? '#a9794b' : '#8a6a45';
  const woodD = premium ? '#7d5733' : '#6b5238';
  const quilt = premium ? '#e98aa6' : '#8fb0e0';
  const g = `bed-${premium ? 'p' : 'b'}`;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id={g} from={quilt} to={premium ? '#d06f90' : '#6f93cf'} />
      <ellipse cx="50" cy="84" rx="42" ry="5" fill="rgba(0,0,0,0.14)" />
      {/* headboard */}
      <rect x="10" y="30" width="14" height="42" rx="3" fill={wood} />
      <rect x="12.5" y="34" width="9" height="30" rx="2" fill={woodD} />
      {/* base + mattress */}
      <rect x="22" y="56" width="68" height="20" rx="4" fill={woodD} />
      <rect x="22" y="48" width="68" height="12" rx="5" fill={`url(#${g})`} />
      {/* blanket fold */}
      <path d="M52 48 H90 V58 Q71 63 52 58 Z" fill={premium ? '#f3bcce' : '#bcd2f2'} />
      {/* pillows */}
      <rect x="26" y="42" width="20" height="12" rx="5" fill="#fbf6ee" />
      <rect x="27" y="44" width="18" height="9" rx="4" fill="#fff" />
      {/* legs */}
      <rect x="25" y="74" width="4" height="8" fill={woodD} />
      <rect x="83" y="74" width="4" height="8" fill={woodD} />
      {premium && <text x="68" y="40" fontSize="11">✨</text>}
    </svg>
  );
}

function Desk() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="desk" from="#c69a63" to="#9a6f3f" />
      <ellipse cx="50" cy="86" rx="40" ry="5" fill="rgba(0,0,0,0.14)" />
      {/* top */}
      <rect x="14" y="40" width="72" height="10" rx="3" fill="url(#desk)" />
      <rect x="14" y="40" width="72" height="3" rx="1.5" fill="#d8b483" />
      {/* legs */}
      <rect x="20" y="50" width="7" height="34" rx="2" fill="#7a5a39" />
      <rect x="73" y="50" width="7" height="34" rx="2" fill="#7a5a39" />
      {/* drawer */}
      <rect x="56" y="50" width="24" height="14" rx="2" fill="#a87b4c" />
      <circle cx="68" cy="57" r="1.8" fill="#5a4126" />
    </svg>
  );
}

function GamingChair() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="gch" from="#3a3f4d" to="#1c2029" />
      <ellipse cx="50" cy="90" rx="30" ry="4.5" fill="rgba(0,0,0,0.16)" />
      {/* headrest */}
      <rect x="38" y="14" width="24" height="14" rx="7" fill="url(#gch)" />
      <rect x="44" y="17" width="12" height="8" rx="4" fill="#e0444c" />
      {/* backrest */}
      <rect x="34" y="26" width="32" height="34" rx="9" fill="url(#gch)" />
      <rect x="40" y="30" width="20" height="26" rx="6" fill="#2a2e38" />
      <rect x="46" y="30" width="8" height="26" rx="3" fill="#e0444c" />
      {/* seat */}
      <rect x="32" y="58" width="36" height="11" rx="5" fill="#2a2e38" />
      <rect x="32" y="58" width="36" height="5" rx="2.5" fill="#e0444c" />
      {/* armrest */}
      <rect x="28" y="50" width="6" height="14" rx="2" fill="#15171f" />
      {/* gas lift + 5-star base */}
      <rect x="47" y="69" width="6" height="11" fill="#444" />
      <g stroke="#555" strokeWidth="4" strokeLinecap="round">
        <line x1="50" y1="82" x2="34" y2="90" />
        <line x1="50" y1="82" x2="66" y2="90" />
        <line x1="50" y1="82" x2="50" y2="92" />
      </g>
      <circle cx="34" cy="90" r="2.6" fill="#222" /><circle cx="66" cy="90" r="2.6" fill="#222" /><circle cx="50" cy="92" r="2.6" fill="#222" />
    </svg>
  );
}

function Wardrobe({ premium }) {
  if (premium) {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
        <Defs id="wp" from="#d8b888" to="#b6905f" />
        <ellipse cx="50" cy="90" rx="34" ry="4.5" fill="rgba(0,0,0,0.14)" />
        <rect x="22" y="14" width="56" height="74" rx="4" fill="url(#wp)" />
        {/* sliding doors */}
        <rect x="25" y="18" width="24" height="66" rx="2" fill="#e6cda4" />
        <rect x="51" y="18" width="24" height="66" rx="2" fill="#d9bd91" />
        <rect x="25" y="18" width="24" height="66" rx="2" fill="none" stroke="#b6905f" strokeWidth="1" />
        {/* glass sheen on sliding panel */}
        <rect x="29" y="22" width="5" height="58" rx="2" fill="#fff" opacity="0.35" />
        {/* recessed bar handles */}
        <rect x="46" y="44" width="2.5" height="14" rx="1" fill="#7a5733" />
        <rect x="51.5" y="44" width="2.5" height="14" rx="1" fill="#7a5733" />
        <text x="60" y="30" fontSize="10">✨</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="wb" from="#a98a64" to="#876b48" />
      <ellipse cx="50" cy="90" rx="34" ry="4.5" fill="rgba(0,0,0,0.14)" />
      <rect x="24" y="16" width="52" height="72" rx="4" fill="url(#wb)" />
      {/* two hinged doors */}
      <rect x="27" y="20" width="22" height="64" rx="2" fill="#9c7e58" />
      <rect x="51" y="20" width="22" height="64" rx="2" fill="#947651" />
      <line x1="50" y1="20" x2="50" y2="84" stroke="#6b5238" strokeWidth="1.5" />
      {/* round knobs */}
      <circle cx="46" cy="52" r="2.2" fill="#3b2f22" />
      <circle cx="54" cy="52" r="2.2" fill="#3b2f22" />
      {/* legs */}
      <rect x="28" y="88" width="4" height="6" fill="#6b5238" />
      <rect x="68" y="88" width="4" height="6" fill="#6b5238" />
    </svg>
  );
}

function Led() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="ledstrip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4d6d" /><stop offset="0.33" stopColor="#ffd23f" />
          <stop offset="0.66" stopColor="#3ad0ff" /><stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* roll/coil of strip */}
      <circle cx="50" cy="52" r="30" fill="none" stroke="#2a2d3a" strokeWidth="10" />
      <circle cx="50" cy="52" r="30" fill="none" stroke="url(#ledstrip)" strokeWidth="6" strokeDasharray="3 4" opacity="0.95" />
      <circle cx="50" cy="52" r="18" fill="none" stroke="#2a2d3a" strokeWidth="9" />
      <circle cx="50" cy="52" r="18" fill="none" stroke="url(#ledstrip)" strokeWidth="5" strokeDasharray="3 4" />
      <circle cx="50" cy="52" r="8" fill="#1a1c26" />
      {/* loose glowing tail */}
      <path d="M80 40 Q92 34 92 24" fill="none" stroke="url(#ledstrip)" strokeWidth="5" strokeLinecap="round" strokeDasharray="3 4" />
      <circle cx="92" cy="22" r="3" fill="#ffd23f" />
    </svg>
  );
}

function Lamp() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs>
        <radialGradient id="lampglow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#fff4c4" /><stop offset="1" stopColor="#ffcf6b" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="88" rx="26" ry="4.5" fill="rgba(0,0,0,0.14)" />
      {/* base + arm */}
      <rect x="34" y="82" width="32" height="6" rx="3" fill="#3a3f48" />
      <rect x="47" y="40" width="5" height="44" rx="2.5" fill="#4a505a" />
      <path d="M49.5 40 L74 24" stroke="#4a505a" strokeWidth="5" strokeLinecap="round" />
      {/* glowing head */}
      <g transform="translate(76 22) rotate(35)">
        <path d="M-13 -8 H13 L9 8 H-9 Z" fill="#5a626e" />
        <ellipse cx="0" cy="8" rx="9" ry="3.5" fill="url(#lampglow)" />
      </g>
      <circle cx="78" cy="30" r="13" fill="#fff3bf" opacity="0.35" />
    </svg>
  );
}

function Speaker() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="spk" from="#3a3f47" to="#15181d" />
      <ellipse cx="50" cy="74" rx="40" ry="4.5" fill="rgba(0,0,0,0.16)" />
      {/* horizontal rectangular body */}
      <rect x="10" y="40" width="80" height="28" rx="8" fill="url(#spk)" />
      {/* speaker grilles */}
      <circle cx="28" cy="54" r="9" fill="#0c0e12" /><circle cx="28" cy="54" r="6" fill="#23262d" />
      <circle cx="72" cy="54" r="9" fill="#0c0e12" /><circle cx="72" cy="54" r="6" fill="#23262d" />
      {/* centre controls */}
      <rect x="44" y="48" width="12" height="3" rx="1.5" fill="#5a626e" />
      <circle cx="50" cy="60" r="2.2" fill="#3ad0ff" />
      {/* brand */}
      <text x="50" y="38" fontSize="9" fontWeight="700" fill="#cfd6df" textAnchor="middle" fontFamily="Arial, sans-serif">SONY</text>
    </svg>
  );
}

function Curtains() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="curt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a2a55" /><stop offset="1" stopColor="#4a1838" />
        </linearGradient>
      </defs>
      {/* window with daylight */}
      <rect x="24" y="16" width="52" height="68" rx="3" fill="#cfeaff" />
      <rect x="24" y="16" width="52" height="34" fill="#bfe6ff" />
      <circle cx="62" cy="32" r="7" fill="#fff6cf" />
      <rect x="48" y="16" width="3" height="68" fill="#9bb6c9" />
      <rect x="24" y="48" width="52" height="3" fill="#9bb6c9" />
      <rect x="22" y="14" width="56" height="6" rx="3" fill="#5a4a38" />{/* rod */}
      {/* billowing dark curtains */}
      <path d="M24 14 Q16 40 26 56 Q18 72 30 84 L34 84 Q26 50 34 14 Z" fill="url(#curt)" />
      <path d="M76 14 Q84 40 74 56 Q82 72 70 84 L66 84 Q74 50 66 14 Z" fill="url(#curt)" />
      <path d="M30 16 Q26 46 32 80" stroke="#9c3a6e" strokeWidth="1.4" fill="none" opacity="0.7" />
      <path d="M70 16 Q74 46 68 80" stroke="#9c3a6e" strokeWidth="1.4" fill="none" opacity="0.7" />
      <ellipse cx="50" cy="74" rx="40" ry="4" fill="rgba(0,0,0,0.12)" />
    </svg>
  );
}

function Shelf() {
  const books = ['#d65b5b', '#5b8fd6', '#5bd68f', '#e0a23a', '#a855f7', '#ef6aa0'];
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="shf" from="#a98158" to="#876239" />
      <ellipse cx="50" cy="90" rx="32" ry="4.5" fill="rgba(0,0,0,0.14)" />
      {/* open frame (no doors) */}
      <rect x="22" y="14" width="56" height="74" rx="3" fill="url(#shf)" />
      <rect x="27" y="19" width="46" height="64" fill="#6b4f33" />
      {/* shelves */}
      {[33, 51, 69].map((y) => <rect key={y} x="27" y={y} width="46" height="4" fill="#9c7b52" />)}
      {/* books per shelf */}
      {[20, 38, 56].map((y, r) => (
        <g key={r}>
          {[0, 1, 2, 3, 4].map((c) => (
            <rect key={c} x={29 + c * 8.6} y={y} width={c === 2 ? 7 : 7.4} height="13" rx="1"
              fill={books[(r * 2 + c) % books.length]} transform={c === 4 ? `rotate(8 ${29 + c * 8.6 + 3} ${y + 7})` : ''} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function Fridge() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="frg" from="#9aa1aa" to="#4a4f57" />
      <ellipse cx="50" cy="90" rx="28" ry="4.5" fill="rgba(0,0,0,0.16)" />
      <rect x="30" y="14" width="40" height="74" rx="6" fill="url(#frg)" />
      {/* door split */}
      <line x1="30" y1="44" x2="70" y2="44" stroke="#2f343b" strokeWidth="2" />
      {/* handles */}
      <rect x="34" y="30" width="3" height="10" rx="1.5" fill="#2a2e34" />
      <rect x="34" y="50" width="3" height="14" rx="1.5" fill="#2a2e34" />
      {/* sheen */}
      <rect x="40" y="18" width="6" height="64" rx="3" fill="#fff" opacity="0.18" />
      <rect x="58" y="20" width="8" height="4" rx="2" fill="#3ad0ff" opacity="0.8" />
    </svg>
  );
}

function Chair() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="chr" from="#bd8e58" to="#946a3c" />
      <ellipse cx="50" cy="90" rx="26" ry="4.5" fill="rgba(0,0,0,0.14)" />
      {/* backrest */}
      <rect x="36" y="22" width="28" height="8" rx="3" fill="url(#chr)" />
      <rect x="38" y="30" width="4" height="22" fill="#7a5a39" />
      <rect x="58" y="30" width="4" height="22" fill="#7a5a39" />
      {/* seat */}
      <rect x="32" y="50" width="36" height="8" rx="3" fill="url(#chr)" />
      {/* legs */}
      <rect x="34" y="58" width="4" height="28" fill="#7a5a39" />
      <rect x="62" y="58" width="4" height="28" fill="#7a5a39" />
      <rect x="40" y="58" width="4" height="28" fill="#8a6a45" opacity="0.7" />
      <rect x="56" y="58" width="4" height="28" fill="#8a6a45" opacity="0.7" />
    </svg>
  );
}

function Poster() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="psky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" /><stop offset="0.6" stopColor="#bfe0f5" /><stop offset="1" stopColor="#e8f6ff" />
        </linearGradient>
      </defs>
      {/* frame */}
      <rect x="16" y="14" width="68" height="72" rx="3" fill="#6b4f33" />
      <rect x="20" y="18" width="60" height="64" fill="url(#psky)" />
      <clipPath id="pclip"><rect x="20" y="18" width="60" height="64" /></clipPath>
      <g clipPath="url(#pclip)">
        {/* sun */}
        <circle cx="64" cy="34" r="8" fill="#fff3bf" />
        {/* ice mountains */}
        <path d="M20 58 L34 36 L46 58 Z" fill="#d6e6f2" />
        <path d="M34 36 L40 44 L34 50 L28 44 Z" fill="#fff" opacity="0.85" />
        <path d="M40 58 L58 32 L78 58 Z" fill="#bcd2e4" />
        <path d="M58 32 L64 42 L58 50 L52 42 Z" fill="#fff" opacity="0.85" />
        {/* trees */}
        <path d="M28 70 l5 -12 l5 12 Z" fill="#2f7d4a" /><path d="M28 64 l5 -10 l5 10 Z" fill="#3a9a5a" />
        <path d="M66 72 l5 -12 l5 12 Z" fill="#2f7d4a" /><path d="M66 66 l5 -10 l5 10 Z" fill="#3a9a5a" />
        {/* river */}
        <path d="M20 82 Q44 64 50 70 Q56 76 80 60 L80 82 Z" fill="#6fb0d2" />
        <path d="M30 78 Q48 70 64 72" stroke="#bfe6ff" strokeWidth="1.5" fill="none" opacity="0.8" />
      </g>
    </svg>
  );
}

function Fan() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <Defs id="fan" from="#dfe6ee" to="#9aa3ad" />
      <ellipse cx="50" cy="90" rx="22" ry="4" fill="rgba(0,0,0,0.14)" />
      {/* base + stand */}
      <ellipse cx="50" cy="86" rx="16" ry="4" fill="#4a505a" />
      <rect x="47" y="58" width="6" height="28" fill="#5a626e" />
      {/* cage */}
      <circle cx="50" cy="44" r="26" fill="#eef2f6" stroke="#9aa3ad" strokeWidth="2" />
      <circle cx="50" cy="44" r="26" fill="none" stroke="#c3ccd6" strokeWidth="1" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1="50" y1="44" x2={50 + 25 * Math.cos((i * Math.PI) / 3)} y2={44 + 25 * Math.sin((i * Math.PI) / 3)} stroke="#c3ccd6" strokeWidth="1" />
      ))}
      {/* blades */}
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx="50" cy="44" rx="9" ry="20" fill="url(#fan)" opacity="0.92" transform={`rotate(${i * 60} 50 44)`} />
      ))}
      <circle cx="50" cy="44" r="5" fill="#5a626e" />
    </svg>
  );
}

function Boxes() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <ellipse cx="50" cy="84" rx="34" ry="5" fill="rgba(0,0,0,0.14)" />
      <rect x="20" y="44" width="34" height="32" rx="3" fill="#c98b5a" /><rect x="20" y="44" width="34" height="9" fill="#b97c4d" />
      <rect x="50" y="50" width="32" height="26" rx="3" fill="#d59a68" /><rect x="50" y="50" width="32" height="8" fill="#c2884f" />
      <line x1="37" y1="44" x2="37" y2="76" stroke="#a86c3f" strokeWidth="1.4" />
    </svg>
  );
}

function Ceiling() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <defs><radialGradient id="cl" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fffdf0" /><stop offset="1" stopColor="#ffe9a8" /></radialGradient></defs>
      <rect x="46" y="14" width="8" height="14" fill="#9aa3ad" />
      <ellipse cx="50" cy="48" rx="30" ry="22" fill="url(#cl)" />
      <ellipse cx="50" cy="48" rx="30" ry="22" fill="none" stroke="#ffd98a" strokeWidth="1.5" />
      <ellipse cx="50" cy="70" rx="44" ry="10" fill="#fff3bf" opacity="0.3" />
    </svg>
  );
}

function Mirror() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
      <ellipse cx="50" cy="90" rx="20" ry="4" fill="rgba(0,0,0,0.14)" />
      <rect x="34" y="12" width="32" height="76" rx="16" fill="#7a5a39" />
      <rect x="38" y="16" width="24" height="68" rx="12" fill="#cdeaff" />
      <path d="M44 20 L42 80" stroke="#fff" strokeWidth="3" opacity="0.6" />
      <path d="M52 22 L50 78" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

const ART2D = {
  bed: Bed, desk: Desk, gchair: GamingChair, wardrobe: Wardrobe, led: Led,
  lamp: Lamp, speaker: Speaker, curtains: Curtains, shelf: Shelf, fridge: Fridge,
  chair: Chair, poster: Poster, fan: Fan, boxes: Boxes, ceiling: Ceiling, mirror: Mirror,
};

export function ItemArt2D({ art, tier, size = 100, className = '' }) {
  const Cmp = ART2D[art];
  const style = { width: size, height: size, display: 'block' };
  if (!Cmp) return <div className={className} style={{ ...style, fontSize: size * 0.6, lineHeight: 1, textAlign: 'center' }}>📦</div>;
  return (
    <div className={className} style={style}>
      <Cmp premium={tier === 'premium'} />
    </div>
  );
}
