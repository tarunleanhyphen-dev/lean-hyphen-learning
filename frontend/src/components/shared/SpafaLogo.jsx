/**
 * SPAFA logo — Kit 01 "Electric Momentum" (per Brand Guidelines v1.0).
 *
 * Renders the brand mark inline as SVG + JSX so the wordmark picks up
 * the page's loaded font (Plus Jakarta Sans 800, ~equivalent to the
 * Outfit 900 spec'd in the brand guide). Inline beats an `<img>` tag
 * because <img>-loaded SVGs can't inherit the parent document's
 * loaded fonts — `<text>` inside would fall back to whatever Helvetica
 * the browser ships.
 *
 * Three size variants for the contexts the logo currently lives in:
 *   • `sm`  — Act header rails (was `h-8 sm:h-9`)
 *   • `md`  — Home page header
 *   • `lg`  — End-of-act celebrations etc (not used today; reserved)
 *
 * Usage:
 *   <SpafaLogo />              // md (default)
 *   <SpafaLogo size="sm" />
 *
 * To swap kits later (Aurora / Solar / Midnight), only this file
 * changes — every page importing it inherits the new mark.
 */

const SIZES = {
  sm: {
    icon: 'h-8 w-8 sm:h-9 sm:w-9',
    text: 'text-lg sm:text-xl',
  },
  md: {
    icon: 'h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14',
    text: 'text-2xl sm:text-3xl md:text-4xl',
  },
  lg: {
    icon: 'h-16 w-16 sm:h-20 sm:w-20',
    text: 'text-4xl sm:text-5xl',
  },
};

export default function SpafaLogo({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span className={`inline-flex items-center gap-2 sm:gap-3 ${className}`}>
      <svg
        className={s.icon}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Rounded square — Electric Blue (Kit 01 primary) */}
        <rect width="56" height="56" rx="14" fill="#4F8EF7" />
        {/* Ascending bars — progress / advancement */}
        <rect x="10" y="36" width="10" height="7"  rx="2" fill="white" opacity="0.35" />
        <rect x="23" y="29" width="10" height="14" rx="2" fill="white" opacity="0.6"  />
        <rect x="36" y="20" width="10" height="23" rx="2" fill="white" />
        {/* Solar Yellow arrow — the "future advancement" mark */}
        <path d="M40 10 L48 18 L44.5 18 L44.5 20 L35.5 20 L35.5 18 L32 18 Z" fill="#F5C842" />
      </svg>
      <span
        className={`${s.text} font-extrabold tracking-[0.08em] text-white leading-none`}
        style={{ fontFamily: "'Plus Jakarta Sans', 'Sora', system-ui, sans-serif" }}
      >
        SPAFA
      </span>
    </span>
  );
}
