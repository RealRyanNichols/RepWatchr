import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

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
    return buildRepWatchrMetadata({
      title: `Texas ${cycle} Election Races | RepWatchr`,
      description: "Source-backed Texas election race hubs, candidate comparisons, filings, finance links, and public questions.",
      path: "/elections/texas",
      imagePath: buildOgImageUrl("race"),
      imageAlt: `Texas ${cycle} election race watch preview`,
    });
  }

  return buildRepWatchrMetadata({
    title: "Election Cycle Not Found | RepWatchr",
    description: "This election cycle hub is not published.",
    path: `/elections/${state}/${cycle}`,
    imagePath: buildOgImageUrl("race"),
    imageAlt: "RepWatchr election cycle preview",
    robots: { index: false, follow: false },
  });
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
