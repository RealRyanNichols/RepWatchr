/**
 * Renders one of the site's drawn SVG panels.
 *
 * The artwork modules (`issue-art`, `standard-art`) return markup strings so
 * the same drawing can be inlined on a page and rasterised into a share image.
 * This is the page half of that: no fetch, no image request, nothing to 404,
 * and it stays sharp from a phone card to a full-width banner.
 *
 * `inner` is never user input — every value in it is a palette colour or a
 * number the art module computed.
 */
export default function VectorArt({
  inner,
  viewBox,
  className = "",
  label,
  fit = "slice",
}: {
  inner: string;
  viewBox: string;
  className?: string;
  /** Omit for decoration. Supply only when the drawing carries meaning alone. */
  label?: string;
  fit?: "slice" | "meet";
}) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio={`xMidYMid ${fit}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
