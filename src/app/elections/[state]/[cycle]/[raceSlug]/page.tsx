import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TexasElectionRacePage, {
  generateMetadata as generateTexasRaceMetadata,
  generateStaticParams as generateTexasRaceStaticParams,
} from "@/app/elections/texas/[raceSlug]/page";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

const texasStateSlugs = new Set(["texas", "tx"]);
const supportedCycles = new Set(["2026"]);

export function generateStaticParams() {
  return generateTexasRaceStaticParams().map(({ raceSlug }) => ({
    state: "texas",
    cycle: "2026",
    raceSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; cycle: string; raceSlug: string }>;
}): Promise<Metadata> {
  const { state, cycle, raceSlug } = await params;
  if (!texasStateSlugs.has(state.toLowerCase()) || !supportedCycles.has(cycle)) {
    return buildRepWatchrMetadata({
      title: "Race Not Found | RepWatchr",
      description: "This election race route is not published.",
      path: `/elections/${state}/${cycle}/${raceSlug}`,
      imagePath: buildOgImageUrl("race"),
      imageAlt: "RepWatchr election race preview",
      robots: { index: false, follow: false },
    });
  }

  return generateTexasRaceMetadata({ params: Promise.resolve({ raceSlug }) });
}

export default async function ElectionCycleRacePage({
  params,
}: {
  params: Promise<{ state: string; cycle: string; raceSlug: string }>;
}) {
  const { state, cycle, raceSlug } = await params;
  if (!texasStateSlugs.has(state.toLowerCase()) || !supportedCycles.has(cycle)) {
    notFound();
  }

  return TexasElectionRacePage({ params: Promise.resolve({ raceSlug }) });
}
