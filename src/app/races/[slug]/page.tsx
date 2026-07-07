import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveTexasElectionSlug } from "@/lib/race-hub";
import { absoluteRepWatchrUrl, buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolution = resolveTexasElectionSlug(slug);
  if (!resolution) return { title: "Race Not Found" };

  const title =
    resolution.kind === "race"
      ? resolution.race.title
      : resolution.kind === "county"
        ? resolution.county.name
        : resolution.district.name;
  const description =
    resolution.kind === "race"
      ? resolution.race.summary
      : resolution.kind === "county"
        ? resolution.county.summary
        : resolution.district.summary;
  const path =
    resolution.kind === "race"
      ? resolution.race.href
      : resolution.kind === "county"
        ? resolution.county.href
        : resolution.district.href;

  return {
    ...buildRepWatchrMetadata({
      title: `${title} | RepWatchr`,
      description,
      path,
      imagePath: buildOgImageUrl("race", { slug }),
      imageAlt: `${title} RepWatchr preview`,
    }),
    alternates: { canonical: absoluteRepWatchrUrl(path) },
  };
}

export default async function RaceAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolution = resolveTexasElectionSlug(slug);
  if (!resolution) notFound();

  if (resolution.kind === "county") redirect(resolution.county.href);
  if (resolution.kind === "district") redirect(resolution.district.href);
  redirect(resolution.race.href);
}
