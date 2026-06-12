/**
 * PressScene2D — a 2D (SVG) press-conference scene for the Act 2 fake giveaway
 * video: a generic bearded cricketer in an India-blue jersey + India cap,
 * seated at a desk with a mic, talking, against a multi-sponsor backdrop with
 * camera flashes.
 *
 * IMPORTANT: a GENERIC, non-photoreal figure — NOT a likeness of any real
 * person. The beard + India kit evoke the "celebrity cricketer" the scam
 * impersonates, while staying clearly illustrated/synthetic. Sponsor names
 * are fictional.
 */
const SKIN = '#d29a68';
const SKIN_SH = '#bd8757';
const JERSEY = '#1666d4';
const JERSEY_DK = '#0e3f8c';
const CAP = '#0b2a63';
const HAIR = '#1b130e';

// Fictional sponsor wall (varied brands + colours).
const SPONSORS = [
  { t: 'CRICKET BOARD OF INDIA', c: '#ffffff' },
  { t: 'PAYZO', c: '#22d3ee' },
  { t: 'ZYNGO', c: '#fbbf24' },
  { t: 'BHARAT XI', c: '#34d399' },
  { t: 'STAR PLAY', c: '#f472b6' },
  { t: 'RUNX', c: '#a78bfa' },
];

export default function PressScene2D() {
  return (
    <div className="press2d" aria-hidden>
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="press2d__svg">
        {/* backdrop */}
        <rect x="0" y="0" width="320" height="180" fill="#0c2350" />
        <rect x="0" y="0" width="320" height="132" fill="#10306b" />
        {/* multi-sponsor step-and-repeat */}
        {[14, 50, 86, 118].map((y, r) => (
          <g key={r} opacity="0.55">
            {[8, 86, 164, 242].map((x, c) => {
              const s = SPONSORS[(r * 4 + c) % SPONSORS.length];
              return (
                <g key={c} transform={`translate(${x + (r % 2) * 30}, ${y})`}>
                  <circle cx="4" cy="0" r="5" fill={s.c} opacity="0.9" />
                  <path d="M1.5,-2 L6.5,3 M6.5,-2 L1.5,3" stroke="#10306b" strokeWidth="1" />
                  <text x="13" y="3" fill={s.c} fontSize="6.5" fontWeight="700" letterSpacing="0.3">{s.t}</text>
                </g>
              );
            })}
          </g>
        ))}

        {/* cricketer */}
        <g>
          {/* jersey / shoulders */}
          <path d="M103,132 Q106,103 160,99 Q214,103 217,132 Z" fill={JERSEY} />
          {/* tricolour collar */}
          <path d="M144,102 L160,114 L176,102 L173,99 L160,108 L147,99 Z" fill="#ff9933" />
          <path d="M148,101 L160,111 L172,101" fill="none" stroke="#ffffff" strokeWidth="1.4" />
          <path d="M151,100 L160,108 L169,100" fill="none" stroke="#138808" strokeWidth="1.2" />
          {/* chest emblem + INDIA */}
          <circle cx="184" cy="116" r="5.5" fill="#ffd24a" stroke={JERSEY_DK} strokeWidth="0.6" />
          <text x="160" y="128" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="800" letterSpacing="1">INDIA</text>
          {/* neck */}
          <rect x="151" y="89" width="18" height="16" rx="4" fill={SKIN_SH} />
          {/* head */}
          <ellipse cx="160" cy="68" rx="21" ry="24" fill={SKIN} />
          <path d="M139,68 Q139,88 160,92 Q142,88 141,70 Z" fill={SKIN_SH} opacity="0.5" />
          {/* full beard + sideburns + moustache */}
          <path d="M140,66 Q141,93 160,96 Q179,93 180,66 Q175,86 160,89 Q145,86 140,66 Z" fill={HAIR} />
          <path d="M141,58 Q140,64 141,68 M179,58 Q180,64 179,68" stroke={HAIR} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M151,79 q9,4 18,0" stroke={HAIR} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* India cap: crown + brim + emblem */}
          <path d="M137,66 Q138,42 160,42 Q182,42 183,66 Q170,55 160,55 Q150,55 137,66 Z" fill={CAP} />
          <path d="M141,66 Q160,73 179,66 L181,69 Q160,77 139,69 Z" fill={CAP} />
          <circle cx="160" cy="50" r="3.4" fill="#ff9933" />
          <path d="M160,47 v6 M157,50 h6" stroke="#fff" strokeWidth="0.8" />
          {/* eyebrows */}
          <path d="M147,62 q5,-3 10,0 M163,62 q5,-3 10,0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* eyes */}
          <ellipse cx="152" cy="66" rx="2.4" ry="2.2" fill="#2a2018" />
          <ellipse cx="168" cy="66" rx="2.4" ry="2.2" fill="#2a2018" />
          {/* nose */}
          <path d="M160,67 l-2,7 q2,2 4,0" fill="none" stroke={SKIN_SH} strokeWidth="1.2" strokeLinecap="round" />
          {/* mouth (talking) */}
          <ellipse className="press2d__mouth" cx="160" cy="82" rx="5" ry="2" fill="#6b2b22" />
        </g>

        {/* desk */}
        <rect x="0" y="132" width="320" height="48" fill="#13182a" />
        <rect x="0" y="132" width="320" height="4" fill="#1e5bb8" />
        <rect x="116" y="146" width="88" height="20" rx="3" fill="#1e5bb8" opacity="0.9" />
        <text x="160" y="159" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700">CRICKET BOARD OF INDIA</text>

        {/* microphone */}
        <line x1="160" y1="132" x2="160" y2="99" stroke="#2b2f3a" strokeWidth="2.6" />
        <ellipse cx="160" cy="97" rx="5" ry="6" fill="#0c0d12" />
        <rect x="156" y="92" width="8" height="4" rx="2" fill="#2b2f3a" />
      </svg>

      <div className="press2d__flash press2d__flash--1" />
      <div className="press2d__flash press2d__flash--2" />
      <div className="press2d__flash press2d__flash--3" />
    </div>
  );
}
