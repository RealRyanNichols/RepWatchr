import { getTexasElectionRaces } from "@/data/texas-election-races";
import { getOfficialById } from "@/lib/data";
import { resolveTexasElectionSlug } from "@/lib/race-hub";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const view = url.searchParams.get("view");
  const resolution = slug ? resolveTexasElectionSlug(slug) : null;
  const races = getTexasElectionRaces();

  if (resolution?.kind === "race") {
    const race = resolution.race;
    const isComparison = view === "compare";
    const isMarionCountyJudge = race.slug === "marion-county-judge-2026";
    const linkedOfficial = race.officialIds
      .map((officialId) => getOfficialById(officialId))
      .find(Boolean);
    const headline = isMarionCountyJudge
      ? "Dina Carroll vs. Leward LaFleur"
      : isComparison
        ? `${race.shortTitle}: compare the field`
        : `${race.shortTitle}: open the record`;
    const supportLine = isMarionCountyJudge
      ? "A declared write-in challenge. Compare the sourced record, unresolved questions, and current qualification status."
      : isComparison
        ? "Compare candidate profiles, public sources, funding paths, and missing records side by side."
        : race.summary;
    const path = isComparison
      ? `/compare/race/${race.slug}`
      : `/elections/texas/${race.slug}`;

    return renderRepWatchrOgImage({
      requestUrl: request.url,
      pageType: isComparison ? "Candidate comparison" : "Race watch",
      headline,
      supportLine,
      backgroundImage: isMarionCountyJudge
        ? "/images/races/marion-county-judge-2026-hero.webp"
        : REPWATCHR_EDITORIAL_OG_BACKGROUND,
      backgroundPosition: isMarionCountyJudge ? "center" : "center 45%",
      portraitImage: isMarionCountyJudge ? undefined : linkedOfficial?.photo,
      visualCredit: isMarionCountyJudge
        ? "Original RepWatchr civic artwork"
        : linkedOfficial?.photo
          ? linkedOfficial.photoCredit
          : "Original RepWatchr editorial artwork",
      jurisdiction: `${race.region} / ${race.office}`,
      metricValue: race.candidates.length || race.officialIds.length,
      metricLabel: "record lanes",
      path,
      badges: [
        { label: "Public sources", value: race.sourceCount, tone: "blue" },
        { label: "Election", value: race.electionDate, tone: "gold" },
      ],
    });
  }

  if (resolution?.kind === "county") {
    return renderRepWatchrOgImage({
      requestUrl: request.url,
      pageType: "County election hub",
      headline: `${resolution.county.county} County: follow every race`,
      supportLine: resolution.county.summary,
      backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
      backgroundPosition: "center 45%",
      visualCredit: "Original RepWatchr editorial artwork",
      jurisdiction: resolution.county.region,
      metricValue: resolution.county.races.length,
      metricLabel: "races loaded",
      path: resolution.county.href,
      badges: [
        { label: "School boards", value: resolution.county.schoolBoards.length, tone: "blue" },
        { label: "Missing records", value: resolution.county.missingRecords.length, tone: "gold" },
      ],
    });
  }

  if (resolution?.kind === "district") {
    return renderRepWatchrOgImage({
      requestUrl: request.url,
      pageType: "District election hub",
      headline: `${resolution.district.name}: open the race file`,
      supportLine: resolution.district.summary,
      backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
      backgroundPosition: "center 45%",
      visualCredit: "Original RepWatchr editorial artwork",
      jurisdiction: resolution.district.region,
      metricValue: resolution.district.races.length,
      metricLabel: "races loaded",
      path: resolution.district.href,
      badges: [
        { label: "Race lanes", value: resolution.district.raceSlugs.length, tone: "blue" },
        { label: "Missing records", value: resolution.district.missingRecords.length, tone: "gold" },
      ],
    });
  }

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Texas election watch",
    headline: "Every race needs a receipt trail.",
    supportLine: "Open Texas races, candidate records, money paths, public sources, and visible evidence gaps.",
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    visualCredit: "Original RepWatchr editorial artwork",
    jurisdiction: "Texas election watch",
    metricValue: races.length,
    metricLabel: "races loaded",
    path: "/elections/texas",
    badges: [
      { label: "State", value: "Texas", tone: "blue" },
      { label: "Cycle", value: "2026", tone: "gold" },
    ],
  });
}
