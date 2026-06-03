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
