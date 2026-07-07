import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TexasElectionRacePage, {
  generateMetadata as generateTexasRaceMetadata,
  generateStaticParams as generateTexasRaceStaticParams,
} from "@/app/elections/texas/[raceSlug]/page";

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
    return { title: "Race Not Found" };
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
