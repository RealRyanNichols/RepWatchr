import type { Metadata } from "next";
import SearchPageClient from "@/components/search/SearchDiscovery";
import { coerceSearchSort, normalizeSearchFilters } from "@/lib/search-discovery";

export const metadata: Metadata = {
  title: "Search RepWatchr | Officials, Votes, Funding, Boards",
  description: "Search RepWatchr for public officials, school boards, counties, agencies, stories, issues, votes, funding, campaigns, and source-backed records.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search RepWatchr",
    description: "Predictive search for officials, boards, votes, funding, campaigns, stories, and public records.",
    url: "/search",
    type: "website",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const first = (key: string) => {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const all = (key: string) => {
    const value = params?.[key];
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  };
  const query = (first("q") ?? first("search") ?? "").trim();
  const initialFilters = normalizeSearchFilters({
    entityTypes: [...all("entityType"), ...all("type")],
    state: first("state"),
    county: first("county"),
    city: first("city"),
    officeLevel: first("officeLevel"),
    officeType: first("officeType"),
    sourceCountMin: first("sourceCountMin"),
    completenessMin: first("completenessMin"),
    hasVotes: first("hasVotes"),
    hasFunding: first("hasFunding"),
    hasSourceGaps: first("hasSourceGaps"),
    hasCorrectionRequested: first("hasCorrectionRequested"),
    recentlyUpdated: first("recentlyUpdated"),
    popular: first("popular"),
    watched: first("watched"),
    publicBodyType: first("publicBodyType"),
  });
  const initialSort = coerceSearchSort(first("sort"));
  const initialPage = Math.max(1, Math.min(1000, Number(first("page") ?? 1) || 1));

  return <SearchPageClient initialQuery={query} initialFilters={initialFilters} initialSort={initialSort} initialPage={initialPage} />;
}
