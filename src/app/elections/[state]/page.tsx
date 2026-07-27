import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

const texasStateSlugs = new Set(["texas", "tx"]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  if (texasStateSlugs.has(state.toLowerCase())) {
    return buildRepWatchrMetadata({
      title: "Texas Election Races 2026 | RepWatchr",
      description:
        "Source-backed Texas election race hubs, candidate comparisons, filings, finance links, and public questions.",
      path: "/elections/texas",
      imagePath: buildOgImageUrl("race"),
      imageAlt: "Texas 2026 election race watch preview",
    });
  }

  return buildRepWatchrMetadata({
    title: "Election State Not Found | RepWatchr",
    description: "This state election hub is not published.",
    path: `/elections/${state}`,
    imagePath: buildOgImageUrl("race"),
    imageAlt: "RepWatchr election hub preview",
    robots: { index: false, follow: false },
  });
}

export default async function ElectionStateAliasPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  if (texasStateSlugs.has(state.toLowerCase())) {
    redirect("/elections/texas");
  }

  notFound();
}
