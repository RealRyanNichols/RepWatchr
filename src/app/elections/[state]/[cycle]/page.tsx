import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

const texasStateSlugs = new Set(["texas", "tx"]);
const supportedCycles = new Set(["2026"]);

export function generateStaticParams() {
  return [{ state: "texas", cycle: "2026" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; cycle: string }>;
}): Promise<Metadata> {
  const { state, cycle } = await params;
  if (texasStateSlugs.has(state.toLowerCase()) && supportedCycles.has(cycle)) {
    return {
      title: `Texas ${cycle} Election Races | RepWatchr`,
      description: "Source-backed Texas election race hubs, candidate comparisons, filings, finance links, and public questions.",
      alternates: { canonical: "/elections/texas" },
    };
  }

  return { title: "Election Cycle Not Found" };
}

export default async function ElectionCycleAliasPage({
  params,
}: {
  params: Promise<{ state: string; cycle: string }>;
}) {
  const { state, cycle } = await params;
  if (texasStateSlugs.has(state.toLowerCase()) && supportedCycles.has(cycle)) {
    redirect("/elections/texas");
  }

  notFound();
}
