import { COVER_VIEWBOX, generatedCoverInnerSvg } from "@/lib/generated-cover-markup";

/**
 * Cover art drawn for articles that ship without a photograph.
 *
 * Pure inline SVG: nothing to fetch, nothing to 404, and it scales from a
 * 190px phone card to a 520px desktop hero. The artwork itself lives in
 * `generated-cover-markup`, which the share image inlines too, so the card on
 * the page and the card someone shares are always the same graphic.
 */
export default function GeneratedCover({
  coverKey,
  scope,
  visualTheme,
  className = "",
}: {
  coverKey: string;
  scope?: string;
  visualTheme?: string;
  className?: string;
}) {
  const { motif, markup } = generatedCoverInnerSvg({ key: coverKey, scope, visualTheme });

  return (
    <svg
      className={className}
      viewBox={COVER_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      data-generated-cover={motif}
      // Artwork comes from the shared markup module. No user input reaches it:
      // every value is a palette colour or a number that module computes.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
