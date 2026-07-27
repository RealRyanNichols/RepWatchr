import { getAllOfficials, getFundingSummary, getOfficialById } from "@/lib/data";
import { formatLevelName } from "@/lib/formatting";
import { getCommitteeRecordBySlug, getDonorEntityBySlug } from "@/lib/money-trail";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

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
  const committeeSlug = url.searchParams.get("committee") ?? "";
  const donorSlug = url.searchParams.get("donor") ?? "";
  const view = url.searchParams.get("view");
  const official = officialId ? getOfficialById(officialId) : undefined;
  const committee = committeeSlug ? getCommitteeRecordBySlug(committeeSlug) : undefined;
  const donor = donorSlug ? getDonorEntityBySlug(donorSlug) : undefined;
  const funding = official ? getFundingSummary(official.id) : undefined;
  const allFunding = getAllOfficials()
    .map((item) => getFundingSummary(item.id))
    .filter((item): item is NonNullable<ReturnType<typeof getFundingSummary>> => Boolean(item));
  const totalRaised = allFunding.reduce((sum, item) => sum + item.totalRaised, 0);
  const headline = official
    ? `Follow ${official.name}'s campaign money`
    : committee
      ? `${committee.name}: filing source`
      : donor
        ? `${donor.name}: public filing aggregate`
        : "Follow the campaign money.";
  const supportLine = official
    ? "Reported totals, donor categories, geography, public filings, and visible source gaps."
    : committee
      ? "Open the committee's public filing source and related official profiles."
      : donor
        ? "Review public filing rows, totals, source links, and related profiles without implying wrongdoing."
        : "Search reported totals, donor records, committees, geography, and public filing sources.";
  const path = official
    ? `/funding/${official.id}`
    : committee
      ? `/money/committees/${committee.slug}`
      : donor
        ? `/money/donors/${donor.slug}`
        : view === "money"
          ? "/money"
          : "/funding";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: committee ? "Committee record" : donor ? "Donor aggregate" : "Campaign money",
    headline,
    supportLine,
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    portraitImage: official?.photo,
    visualCredit: official?.photo ? official.photoCredit : "Original RepWatchr editorial artwork",
    jurisdiction: official ? `${official.position} / ${formatLevelName(official.level)}` : "Campaign finance watch",
    metricValue: funding
      ? compactMoney(funding.totalRaised)
      : committee
        ? committee.sourceCount
        : donor
          ? compactMoney(donor.totalAmount)
          : allFunding.length,
    metricLabel: funding
      ? "total raised"
      : committee
        ? "public sources"
        : donor
          ? "public filing total"
          : "summaries loaded",
    path,
    badges: [
      { label: "Sources", value: funding?.sources.length ?? "Review", tone: funding ? "green" : "gold" },
      { label: "Cash on hand", value: funding ? compactMoney(funding.cashOnHand) : compactMoney(totalRaised), tone: "blue" },
      { label: "Donors", value: funding?.topDonors.length ?? "Open", tone: "red" },
    ],
  });
}
