import { getTexasElectionRace, getTexasElectionRaces } from "@/data/texas-election-races";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const race = getTexasElectionRace(slug);
  const races = getTexasElectionRaces();
  const title = race?.title ?? "Texas Election Race Watch";
  const summary = race?.summary ?? "Texas races, East Texas officials, votes, money, source links, and share-ready election records.";
  const path = race ? `/elections/texas/${race.slug}` : "/elections/texas";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Race page",
    title,
    subtitle: summary,
    jurisdiction: race ? `${race.region} / ${race.office}` : "Texas election watch",
    metricValue: race?.officialIds.length ?? races.length,
    metricLabel: race ? "profiles linked" : "races loaded",
    path,
    badges: [
      { label: "Record focus", value: race?.recordFocus.length ?? "Texas", tone: "blue" },
      { label: "Election", value: race?.electionDate ?? "2026", tone: "gold" },
      { label: "Stage", value: race?.stage ?? "Review", tone: "red" },
    ],
  });
}
