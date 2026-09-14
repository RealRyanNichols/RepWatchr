import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";
import { SECTION_COPY, withoutZeros } from "@/lib/section-og-copy";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { sectionArtDataUri } from "@/lib/section-og-art";

/**
 * The share card behind most of the site's section pages.
 *
 * This used to draw all fifteen sections on one photograph with three
 * identical badges. Only the words changed, so fifteen RepWatchr links in one
 * feed looked like the same link posted fifteen times, and two of them
 * (`/home-district` and `/home-district/roster`, which are the beat) were
 * getting the homepage's card outright because the route had no entry for
 * their key and quietly fell back.
 *
 * Now each section carries its own drawing, its own headline number, and its
 * own badges. The fallback for an unknown key still exists, because a page
 * with no preview image at all is worse than a page with the wrong one, but
 * it is no longer how a mistake gets discovered: smoke:og-sections fails the
 * build when any page passes a key this route has no entry for.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stats = getRepWatchrDataStats();
  const schoolBoards = getSchoolBoardStats();

  const requested = url.searchParams.get("page") ?? "";
  const key = requested in SECTION_COPY ? requested : "home";
  const copy = SECTION_COPY[key];
  const metric = copy.metric(stats, schoolBoards);

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: copy.pageType,
    headline: copy.headline,
    supportLine: copy.supportLine,
    backgroundImage: sectionArtDataUri(key) ?? undefined,
    jurisdiction: copy.jurisdiction,
    metricValue: metric.value.toLocaleString("en-US"),
    metricLabel: metric.label,
    path: copy.path,
    badges: withoutZeros(copy.badges(stats, schoolBoards)),
  });
}
