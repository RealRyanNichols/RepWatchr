import { getAllOfficials, getFundingSummary, getOfficialById } from "@/lib/data";
import { formatLevelName } from "@/lib/formatting";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

function compactMoney(value: number) {
  if (value >= 1_000_000_000) return `$${Math.round(value / 100_000_000) / 10}B`;
  if (value >= 1_000_000) return `$${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `$${Math.round(value / 100) / 10}K`;
  return `$${value}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const officialId = url.searchParams.get("officialId") ?? "";
  const official = officialId ? getOfficialById(officialId) : undefined;
  const funding = official ? getFundingSummary(official.id) : undefined;
  const allFunding = getAllOfficials()
    .map((item) => getFundingSummary(item.id))
    .filter((item): item is NonNullable<ReturnType<typeof getFundingSummary>> => Boolean(item));
  const totalRaised = allFunding.reduce((sum, item) => sum + item.totalRaised, 0);

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Funding page",
    title: official ? `${official.name} campaign funding` : "Campaign funding records",
    subtitle: official
      ? "Reported campaign finance totals, donor categories, geography, and source links."
      : "Follow reported campaign money, donor categories, geography, source paths, and missing finance records.",
    jurisdiction: official ? `${official.position} / ${formatLevelName(official.level)}` : "Campaign finance watch",
    metricValue: funding ? compactMoney(funding.totalRaised) : allFunding.length,
    metricLabel: funding ? "total raised" : "summaries loaded",
    path: official ? `/funding/${official.id}` : "/funding",
    badges: [
      { label: "Sources", value: funding?.sources.length ?? "Review", tone: funding ? "green" : "gold" },
      { label: "Cash on hand", value: funding ? compactMoney(funding.cashOnHand) : compactMoney(totalRaised), tone: "blue" },
      { label: "Donors", value: funding?.topDonors.length ?? "Open", tone: "red" },
    ],
  });
}
