/**
 * SPAFA logo — official brand mark (SPAFA Brand Identity Guide v1.0).
 *
 * Renders the full "SPAFA" wordmark, where the two A's are the brand's
 * signature nested peak motif (Electric-Blue outer chevron + Luxury-Gold inner
 * chevron), with the "STUDENT PROFILE AND FUTURE ADVANCEMENT" tagline beneath.
 *
 * Built inline (SVG peaks + live text) so the wordmark uses the page's loaded
 * Sora font (the brand's primary typeface) and stays crisp at any size — an
 * <img> can't inherit document fonts. Colours come straight from the brand
 * palette.
 *
 *   <SpafaLogo />                       // md, light letters (for dark headers)
 *   <SpafaLogo size="sm" />
 *   <SpafaLogo tone="dark" />           // Midnight-Navy letters (for light bg)
 *   <SpafaLogo tagline={false} />       // wordmark only
 */

const BLUE = '#2563EB'; // SPAFA Electric Blue
const GOLD = '#D4A017'; // Luxury Gold
const NAVY = '#0A2540'; // Midnight Navy

const SIZES = {
  sm: { word: 'text-lg sm:text-xl',               tag: 'text-[6px] sm:text-[7px]',  pad: 'mt-[3px]' },
  md: { word: 'text-2xl sm:text-3xl md:text-4xl', tag: 'text-[8px] sm:text-[9px]',  pad: 'mt-1' },
  lg: { word: 'text-4xl sm:text-5xl',             tag: 'text-[10px] sm:text-[12px]', pad: 'mt-1.5' },
};

/** The brand's nested blue+gold peak, used in place of each "A". */
function PeakA() {
  return (
    <svg
      viewBox="0 0 64 80"
      aria-hidden="true"
      style={{ height: '0.82em', width: 'auto', display: 'block', margin: '0 0.01em' }}
    >
      <path d="M32 3 L62 78 L45 78 L32 42 L19 78 L2 78 Z" fill={BLUE} />
      <path d="M32 45 L46 78 L37.5 78 L32 63 L26.5 78 L18 78 Z" fill={GOLD} />
    </svg>
  );
}

export default function SpafaLogo({ size = 'md', tone = 'light', tagline = true, className = '' }) {
  const s = SIZES[size] || SIZES.md;
  const letter = tone === 'dark' ? NAVY : '#FFFFFF';
  const tagColor = tone === 'dark' ? 'rgba(10,37,64,0.85)' : 'rgba(255,255,255,0.92)';
  const ruleColor = tone === 'dark' ? 'rgba(10,37,64,0.35)' : 'rgba(255,255,255,0.4)';

  return (
    <span className={`inline-flex flex-col items-start ${className}`} aria-label="SPAFA — Student Profile And Future Advancement">
      {/* Wordmark: S P [peak] F [peak] */}
      <span
        className={`inline-flex items-end leading-none ${s.word}`}
        style={{
          fontFamily: "'Sora','Plus Jakarta Sans',system-ui,sans-serif",
          fontWeight: 800,
          letterSpacing: '0.015em',
          color: letter,
        }}
      >
        <span>SP</span>
        <PeakA />
        <span>F</span>
        <PeakA />
      </span>

      {/* Tagline with side rules */}
      {tagline && (
        <span
          className={`inline-flex items-center ${s.tag} ${s.pad}`}
          style={{
            fontFamily: "'Sora',system-ui,sans-serif",
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: tagColor,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: '1.1em', height: '1px', background: ruleColor, marginRight: '0.55em' }} />
          STUDENT PROFILE <span style={{ color: GOLD, margin: '0 0.35em' }}>AND</span> FUTURE ADVANCEMENT
          <span style={{ width: '1.1em', height: '1px', background: ruleColor, marginLeft: '0.55em' }} />
        </span>
      )}
    </span>
  );
}
