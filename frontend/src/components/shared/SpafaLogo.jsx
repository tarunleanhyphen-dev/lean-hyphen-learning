/**
 * SPAFA logo — official brand mark (image asset from the SPAFA Brand Guide).
 *
 * Renders the real logo lockup (`public/spafa-logo.jpg`) on a clean white rounded
 * badge, so the navy + gold wordmark stays crisp and legible on the dark lesson
 * headers. Shared by all three lessons' home pages and act headers — swap the
 * image (or this file) and every page updates together.
 *
 *   <SpafaLogo />            // md (default)
 *   <SpafaLogo size="sm" />  // act header rails
 *   <SpafaLogo size="lg" />
 */

const SIZES = {
  sm: 'h-6 sm:h-7',
  md: 'h-8 sm:h-10',
  lg: 'h-12 sm:h-14',
};

export default function SpafaLogo({ size = 'md', className = '' }) {
  const h = SIZES[size] || SIZES.md;
  return (
    <span
      className={`inline-flex items-center rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/5 ${className}`}
    >
      <img
        src="/spafa-logo.jpg"
        alt="SPAFA — Student Profile And Future Advancement"
        className={`${h} w-auto select-none`}
        draggable="false"
      />
    </span>
  );
}
