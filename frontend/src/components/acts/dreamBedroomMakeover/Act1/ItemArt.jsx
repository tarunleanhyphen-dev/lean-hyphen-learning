/**
 * Flat-vector illustrations for every catalogue / sort item, keyed by `art`.
 * Pure SVG — crisp, colourful, zero network. Each returns the inner shapes;
 * <ItemArt> wraps them in a sized viewBox.
 */

const S = {
  bed: (
    <g>
      <rect x="6" y="34" width="52" height="14" rx="3" fill="#a9744a" />
      <rect x="6" y="24" width="20" height="14" rx="3" fill="#c98f5d" />
      <rect x="22" y="28" width="36" height="12" rx="3" fill="#7aa2e8" />
      <rect x="22" y="26" width="14" height="8" rx="2" fill="#fff" />
      <rect x="4" y="46" width="6" height="10" rx="2" fill="#7a5334" />
      <rect x="54" y="46" width="6" height="10" rx="2" fill="#7a5334" />
    </g>
  ),
  desk: (
    <g>
      <rect x="8" y="26" width="48" height="7" rx="2" fill="#b5895a" />
      <rect x="12" y="33" width="6" height="24" fill="#8a6440" />
      <rect x="46" y="33" width="6" height="24" fill="#8a6440" />
      <rect x="40" y="33" width="14" height="14" rx="2" fill="#caa06a" />
      <rect x="20" y="16" width="22" height="14" rx="2" fill="#3b3f54" />
      <rect x="23" y="19" width="16" height="8" rx="1" fill="#7dd3fc" />
    </g>
  ),
  chair: (
    <g>
      <rect x="22" y="14" width="20" height="22" rx="3" fill="#4b5563" />
      <rect x="20" y="34" width="24" height="7" rx="2" fill="#374151" />
      <rect x="30" y="41" width="4" height="14" fill="#6b7280" />
      <rect x="22" y="53" width="20" height="4" rx="2" fill="#6b7280" />
    </g>
  ),
  gchair: (
    <g>
      <rect x="20" y="8" width="24" height="30" rx="6" fill="#e0444c" />
      <rect x="24" y="12" width="16" height="22" rx="4" fill="#111827" />
      <rect x="22" y="36" width="20" height="8" rx="3" fill="#e0444c" />
      <rect x="30" y="44" width="4" height="9" fill="#374151" />
      <path d="M22 56 l10-4 10 4" stroke="#374151" strokeWidth="3" fill="none" />
      <rect x="20" y="16" width="3" height="14" rx="1.5" fill="#a855f7" />
      <rect x="41" y="16" width="3" height="14" rx="1.5" fill="#a855f7" />
    </g>
  ),
  wardrobe: (
    <g>
      <rect x="16" y="8" width="32" height="48" rx="3" fill="#caa06a" />
      <line x1="32" y1="10" x2="32" y2="54" stroke="#7a5a39" strokeWidth="2" />
      <circle cx="28" cy="32" r="2" fill="#3b2f22" />
      <circle cx="36" cy="32" r="2" fill="#3b2f22" />
    </g>
  ),
  shelf: (
    <g>
      <rect x="14" y="10" width="36" height="46" rx="2" fill="#9b7b53" />
      <rect x="14" y="24" width="36" height="3" fill="#7a5a39" />
      <rect x="14" y="40" width="36" height="3" fill="#7a5a39" />
      <rect x="18" y="13" width="5" height="10" fill="#d65b5b" />
      <rect x="24" y="13" width="5" height="10" fill="#5b8fd6" />
      <rect x="30" y="13" width="5" height="10" fill="#5bd68f" />
      <rect x="20" y="29" width="5" height="10" fill="#e0a23a" />
      <rect x="27" y="29" width="5" height="10" fill="#a855f7" />
    </g>
  ),
  boxes: (
    <g>
      <rect x="10" y="32" width="20" height="18" rx="2" fill="#c98b5a" />
      <rect x="32" y="36" width="20" height="14" rx="2" fill="#b97c4d" />
      <line x1="10" y1="40" x2="30" y2="40" stroke="#8a5a33" strokeWidth="2" />
      <line x1="32" y1="42" x2="52" y2="42" stroke="#7a4a28" strokeWidth="2" />
    </g>
  ),
  lamp: (
    <g>
      <path d="M26 18 h14 l4 12 h-22 z" fill="#ffd98a" />
      <rect x="31" y="30" width="3" height="22" fill="#6b7280" />
      <rect x="24" y="52" width="16" height="4" rx="2" fill="#4b5563" />
      <circle cx="32" cy="24" r="6" fill="#fff3c4" opacity="0.6" />
    </g>
  ),
  ceiling: (
    <g>
      <rect x="30" y="6" width="3" height="12" fill="#6b7280" />
      <path d="M18 18 h28 l-6 12 h-16 z" fill="#fffbe8" stroke="#e5c98a" strokeWidth="1.5" />
      <circle cx="32" cy="34" r="9" fill="#fff3c4" opacity="0.5" />
    </g>
  ),
  led: (
    <g>
      <rect x="8" y="20" width="48" height="6" rx="3" fill="#a855f7" />
      <rect x="8" y="32" width="48" height="6" rx="3" fill="#ec4899" />
      <rect x="8" y="44" width="48" height="6" rx="3" fill="#22d3ee" />
      <circle cx="14" cy="23" r="2" fill="#fff" opacity="0.8" />
      <circle cx="50" cy="47" r="2" fill="#fff" opacity="0.8" />
    </g>
  ),
  curtains: (
    <g>
      <rect x="12" y="10" width="40" height="4" rx="2" fill="#7a5a39" />
      <path d="M16 14 q3 4 0 8 q3 4 0 8 q3 4 0 8 q3 4 0 8 v6 h10 v-46 z" fill="#c98fd6" />
      <path d="M48 14 q-3 4 0 8 q-3 4 0 8 q-3 4 0 8 q-3 4 0 8 v6 h-10 v-46 z" fill="#a7c7ff" />
      <rect x="26" y="16" width="12" height="38" fill="#dbeafe" opacity="0.5" />
    </g>
  ),
  fan: (
    <g>
      <circle cx="32" cy="28" r="4" fill="#374151" />
      <ellipse cx="32" cy="16" rx="5" ry="12" fill="#dfe6ee" opacity="0.9" />
      <ellipse cx="43" cy="33" rx="12" ry="5" fill="#cfd8e2" opacity="0.9" />
      <ellipse cx="21" cy="33" rx="12" ry="5" fill="#cfd8e2" opacity="0.9" />
      <rect x="30" y="38" width="4" height="14" fill="#6b7280" />
      <rect x="24" y="52" width="16" height="4" rx="2" fill="#4b5563" />
    </g>
  ),
  poster: (
    <g>
      <rect x="16" y="12" width="32" height="40" rx="2" fill="#ffd166" />
      <circle cx="28" cy="26" r="6" fill="#ff7b54" />
      <path d="M18 50 l10-14 8 8 6-8 6 14 z" fill="#06d6a0" />
    </g>
  ),
  speaker: (
    <g>
      <rect x="22" y="10" width="20" height="44" rx="4" fill="#1f2937" />
      <circle cx="32" cy="24" r="6" fill="#374151" />
      <circle cx="32" cy="24" r="2.5" fill="#a855f7" />
      <circle cx="32" cy="42" r="4" fill="#374151" />
      <rect x="26" y="14" width="12" height="2" rx="1" fill="#7c3aed" />
    </g>
  ),
  fridge: (
    <g>
      <rect x="20" y="8" width="24" height="48" rx="4" fill="#e8eef2" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="20" y1="28" x2="44" y2="28" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="38" y="14" width="3" height="9" rx="1.5" fill="#94a3b8" />
      <rect x="38" y="33" width="3" height="9" rx="1.5" fill="#94a3b8" />
    </g>
  ),
  mirror: (
    <g>
      <rect x="22" y="8" width="20" height="48" rx="9" fill="#7a5a39" />
      <rect x="25" y="11" width="14" height="42" rx="7" fill="#bfe3ff" />
      <path d="M28 16 l-2 20" stroke="#fff" strokeWidth="2" opacity="0.7" />
    </g>
  ),
  speakerwave: null,

  /* ---- Act 2 · Scene 3 expense illustrations ---- */
  stationery: (
    <g>
      {/* pencil cup */}
      <path d="M20 30 h24 l-3 27 h-18 z" fill="#6366f1" />
      <rect x="18" y="27" width="28" height="6" rx="2" fill="#4f46e5" />
      {/* pencil */}
      <rect x="25" y="9" width="5" height="22" fill="#f4b400" />
      <path d="M25 9 l2.5 -6 2.5 6 z" fill="#f6c85f" />
      <circle cx="27.5" cy="4" r="1.3" fill="#374151" />
      {/* pen */}
      <rect x="32" y="11" width="5" height="20" fill="#ef4444" />
      <path d="M32 11 l2.5 -5 2.5 5 z" fill="#b91c1c" />
      {/* ruler */}
      <rect x="39" y="13" width="4.5" height="18" fill="#10b981" />
      <line x1="39" y1="17" x2="41" y2="17" stroke="#065f46" strokeWidth="1" />
      <line x1="39" y1="21" x2="41" y2="21" stroke="#065f46" strokeWidth="1" />
      <line x1="39" y1="25" x2="41" y2="25" stroke="#065f46" strokeWidth="1" />
    </g>
  ),
  buspass: (
    <g>
      <rect x="7" y="17" width="50" height="31" rx="4" fill="#0ea5e9" />
      <rect x="7" y="23" width="50" height="6" fill="#075985" />
      {/* bus */}
      <rect x="12" y="33" width="19" height="10" rx="2" fill="#fde047" />
      <rect x="14" y="35" width="4" height="4" fill="#1e293b" />
      <rect x="20" y="35" width="4" height="4" fill="#1e293b" />
      <rect x="26" y="35" width="3" height="4" fill="#1e293b" />
      <circle cx="17" cy="44" r="2" fill="#111827" />
      <circle cx="27" cy="44" r="2" fill="#111827" />
      {/* PASS lines */}
      <rect x="35" y="34" width="17" height="3" rx="1.5" fill="#ffffff" />
      <rect x="35" y="39" width="12" height="3" rx="1.5" fill="#bae6fd" />
    </g>
  ),
  streaming: (
    <g>
      <rect x="7" y="11" width="50" height="33" rx="3" fill="#111827" />
      <rect x="10" y="14" width="44" height="27" rx="2" fill="#1f2937" />
      <circle cx="32" cy="27" r="10" fill="#e50914" />
      <path d="M29 21.5 l8.5 5.5 -8.5 5.5 z" fill="#ffffff" />
      <rect x="28" y="44" width="8" height="5" fill="#374151" />
      <rect x="21" y="49" width="22" height="3" rx="1.5" fill="#4b5563" />
    </g>
  ),
  snacks: (
    <g>
      {/* glass fridge */}
      <rect x="17" y="7" width="30" height="50" rx="4" fill="#bfdbfe" opacity="0.45" />
      <rect x="17" y="7" width="30" height="50" rx="4" fill="none" stroke="#3b82f6" strokeWidth="2" />
      <line x1="17" y1="23" x2="47" y2="23" stroke="#3b82f6" strokeWidth="1.3" />
      <line x1="17" y1="40" x2="47" y2="40" stroke="#3b82f6" strokeWidth="1.3" />
      <rect x="44" y="18" width="3" height="18" rx="1.5" fill="#1e40af" />
      {/* cold drink */}
      <path d="M21 26 h8 l-1.3 12 h-5.4 z" fill="#ef4444" />
      <rect x="24" y="20" width="2.5" height="7" fill="#9ca3af" />
      {/* samosa */}
      <path d="M33 29 l10 0 -5 10 z" fill="#e0a23a" />
      <path d="M33 29 l10 0 -5 10 z" fill="none" stroke="#a86a1f" strokeWidth="1" />
    </g>
  ),
  earphones: (
    <g>
      <rect x="13" y="19" width="38" height="27" rx="4" fill="#1e293b" />
      <rect x="13" y="19" width="38" height="10" rx="4" fill="#dc2626" />
      <rect x="19" y="22" width="26" height="3.5" rx="1.75" fill="#ffffff" />
      {/* earbuds */}
      <circle cx="25" cy="38" r="4.5" fill="#f1f5f9" />
      <rect x="24" y="38" width="2" height="7" rx="1" fill="#f1f5f9" />
      <circle cx="39" cy="38" r="4.5" fill="#f1f5f9" />
      <rect x="38" y="38" width="2" height="7" rx="1" fill="#f1f5f9" />
    </g>
  ),
  lunch: (
    <g>
      <rect x="5" y="45" width="54" height="5" rx="2" fill="#b5895a" />
      <ellipse cx="32" cy="42" rx="23" ry="7" fill="#cbd5e1" />
      <ellipse cx="32" cy="39" rx="23" ry="7.5" fill="#f8fafc" />
      <ellipse cx="32" cy="38" rx="16" ry="5" fill="#e2e8f0" />
      {/* rice */}
      <ellipse cx="25" cy="36" rx="7" ry="4" fill="#fef3c7" />
      {/* roti */}
      <ellipse cx="40" cy="37" rx="6.5" ry="3.6" fill="#fbbf24" />
      {/* curry + veg */}
      <circle cx="33" cy="34" r="3" fill="#16a34a" />
      <circle cx="36.5" cy="36" r="2.6" fill="#ef4444" />
    </g>
  ),
  movie: (
    <g>
      <rect x="7" y="9" width="50" height="29" rx="2" fill="#1e1b4b" />
      <rect x="9" y="11" width="46" height="25" rx="1" fill="#312e81" />
      <text x="32" y="27" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fbbf24" fontFamily="'Sora', sans-serif">MOVIE</text>
      {/* seats */}
      <rect x="9" y="44" width="11" height="9" rx="2" fill="#7f1d1d" />
      <rect x="22" y="44" width="11" height="9" rx="2" fill="#991b1b" />
      <rect x="35" y="44" width="11" height="9" rx="2" fill="#7f1d1d" />
      <rect x="48" y="44" width="8" height="9" rx="2" fill="#991b1b" />
    </g>
  ),
  piggy: (
    <g>
      <ellipse cx="31" cy="39" rx="20" ry="15" fill="#f472b6" />
      <ellipse cx="49" cy="39" rx="6" ry="5" fill="#ec4899" />
      <circle cx="48" cy="38" r="1.2" fill="#831843" />
      <circle cx="51" cy="38" r="1.2" fill="#831843" />
      <path d="M23 27 l6 2 -2 6 z" fill="#ec4899" />
      <circle cx="29" cy="35" r="2.2" fill="#ffffff" />
      <circle cx="29.5" cy="35" r="1.1" fill="#1f2937" />
      <rect x="21" y="51" width="5" height="6" rx="2" fill="#ec4899" />
      <rect x="39" y="51" width="5" height="6" rx="2" fill="#ec4899" />
      {/* slot */}
      <rect x="28" y="25" width="10" height="3" rx="1.5" fill="#be185d" />
      {/* coin */}
      <circle cx="33" cy="15" r="5.5" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="33" y="18" textAnchor="middle" fontSize="7" fontWeight="800" fill="#92400e" fontFamily="sans-serif">₹</text>
    </g>
  ),
};

export function ItemArt({ art, size = 64, className = '' }) {
  const shapes = S[art];
  if (!shapes) {
    return (
      <div className={className} style={{ fontSize: size * 0.6, lineHeight: 1 }}>📦</div>
    );
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      {shapes}
    </svg>
  );
}
