import { getRepWatchrServices } from "@/data/repwatchr-services";
import { getRepWatchrPackages, packageRoute } from "@/data/repwatchr-packages";
import { getTexasElectionRaces } from "@/data/texas-election-races";
import {
  getAllBills,
  getAllNews,
  getAllOfficials,
  getFundingSummary,
  getIssueCategories,
} from "@/lib/data";
import { getOfficialCompletionDashboard, buildOfficialCompletionSnapshot } from "@/lib/profile-completion";
import {
  getAttorneyWatchProfiles,
  getMediaWatchProfiles,
  getPublicSafetyWatchProfiles,
} from "@/lib/power-watch";
import { getSchoolBoardDistricts, getSchoolBoardDossiers } from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export type SitemapGroup =
  | "static"
  | "profiles"
  | "officials"
  | "agencies"
  | "jurisdictions"
  | "races"
  | "school-boards"
  | "stories"
  | "sources";

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export const sitemapGroups: Array<{ key: SitemapGroup; path: string; label: string }> = [
  { key: "static", path: "/sitemaps/static.xml", label: "Static pages" },
  { key: "profiles", path: "/sitemaps/profiles.xml", label: "Profile pages" },
  { key: "officials", path: "/sitemaps/officials.xml", label: "Official data pages" },
  { key: "agencies", path: "/sitemaps/agencies.xml", label: "Agency and public-power pages" },
  { key: "jurisdictions", path: "/sitemaps/jurisdictions.xml", label: "Jurisdiction pages" },
  { key: "races", path: "/sitemaps/races.xml", label: "Race pages" },
  { key: "school-boards", path: "/sitemaps/school-boards.xml", label: "School-board pages" },
  { key: "stories", path: "/sitemaps/stories.xml", label: "Story pages" },
  { key: "sources", path: "/sitemaps/sources.xml", label: "Public source pages" },
];

function isoDate(value: string | undefined, fallback = new Date()) {
  if (!value) return fallback.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
}

function entry(path: string, options: Omit<SitemapEntry, "loc"> = {}): SitemapEntry {
  return {
    loc: absoluteUrl(path),
    ...options,
  };
}

function usefulOfficialEntries() {
  return getAllOfficials()
    .filter((official) => {
      const completion = buildOfficialCompletionSnapshot(official);
      return completion.completionPercent >= 35 && (official.sourceLinks?.length ?? 0) > 0 && official.reviewStatus !== "needs_source_review";
    })
    .map((official) =>
      entry(`/officials/${official.id}`, {
        lastmod: isoDate(official.lastVerifiedAt),
        changefreq: "weekly",
        priority: official.state === "TX" ? 0.78 : 0.7,
      }),
    );
}

export function getStaticSitemapEntries(): SitemapEntry[] {
  const now = new Date().toISOString();
  return [
    "/",
    "/about",
    "/search",
    "/officials",
    "/authority-watch",
    "/school-boards",
    "/free-packet",
    "/tools/source-packet-builder",
    "/tools/public-records-request",
    "/submit-source",
    "/sources/submit",
    "/blog",
    "/services",
    "/packages",
    "/beta-access",
    "/data-reports",
    "/contributors",
    "/growth-engine",
    "/funding",
    "/red-flags",
    "/votes",
    "/news",
    "/issues",
    "/scorecards",
    "/methodology",
    "/privacy",
    "/terms",
    "/elections",
    "/elections/texas",
    "/elections/texas/contribute",
    ...getRepWatchrServices()
      .filter((service) => service.slug !== "free-source-packet")
      .map((service) => `/services/${service.slug}`),
    ...getRepWatchrPackages().map((packageItem) => packageRoute(packageItem)),
  ].map((path) =>
    entry(path, {
      lastmod: now,
      changefreq: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.76,
    }),
  );
}

export function getProfileSitemapEntries(): SitemapEntry[] {
  return usefulOfficialEntries();
}

export function getOfficialSitemapEntries(): SitemapEntry[] {
  const timelineEntries = getAllOfficials()
    .filter((official) => (official.sourceLinks?.length ?? 0) > 0)
    .map((official) =>
      entry(`/officials/${official.id}/timeline`, {
        lastmod: isoDate(official.lastVerifiedAt),
        changefreq: "weekly",
        priority: 0.66,
      }),
    );

  const fundingEntries = getAllOfficials()
    .filter((official) => getFundingSummary(official.id))
    .map((official) =>
      entry(`/funding/${official.id}`, {
        changefreq: "weekly",
        priority: 0.64,
      }),
    );

  const voteEntries = getAllBills().map((bill) =>
    entry(`/votes/${bill.id}`, {
      lastmod: isoDate(bill.dateVoted),
      changefreq: "monthly",
      priority: 0.68,
    }),
  );

  const issueEntries = getIssueCategories().flatMap((issue) => [
    entry(`/issues/${issue.id}`, { changefreq: "monthly", priority: 0.62 }),
    entry(`/scorecards/${issue.id}`, { changefreq: "monthly", priority: 0.62 }),
  ]);

  return [...timelineEntries, ...fundingEntries, ...voteEntries, ...issueEntries];
}

export function getAgencySitemapEntries(): SitemapEntry[] {
  const profiles = [
    ...getAttorneyWatchProfiles().map((profile) => ({ path: `/attorneys/${profile.slug}`, profile })),
    ...getMediaWatchProfiles().map((profile) => ({ path: `/media/${profile.slug}`, profile })),
    ...getPublicSafetyWatchProfiles().map((profile) => ({ path: `/public-safety/${profile.slug}`, profile })),
  ];

  return profiles
    .filter(({ profile }) => profile.profileStatus !== "needs_source_review" && profile.profileStatus !== "needs_profile_buildout")
    .map(({ path, profile }) =>
      entry(path, {
        changefreq: "weekly",
        priority: profile.state === "TX" ? 0.66 : 0.58,
      }),
    );
}

export function getJurisdictionSitemapEntries(): SitemapEntry[] {
  return [];
}

export function getRaceSitemapEntries(): SitemapEntry[] {
  const now = new Date().toISOString();
  return getTexasElectionRaces().map((race) =>
    entry(`/elections/texas/${race.slug}`, {
      lastmod: now,
      changefreq: "weekly",
      priority: race.lane === "big-race" ? 0.82 : 0.78,
    }),
  );
}

export function getSchoolBoardSitemapEntries(): SitemapEntry[] {
  const districtEntries = getSchoolBoardDistricts().map((district) =>
    entry(getSchoolBoardDistrictUrl(district), {
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: 0.72,
    }),
  );
  const candidateEntries = getSchoolBoardDossiers()
    .filter((candidate) => (candidate.sources?.length ?? 0) > 0 || ["initial_dossier", "complete"].includes(String(candidate.status ?? "")))
    .map((candidate) =>
      entry(getSchoolBoardCandidateUrl(candidate), {
        lastmod: isoDate(candidate.last_updated),
        changefreq: "weekly",
        priority: 0.68,
      }),
    );

  return [...districtEntries, ...candidateEntries];
}

export function getStorySitemapEntries(): SitemapEntry[] {
  return getAllNews().map((article) =>
    entry(`/news/${article.id}`, {
      lastmod: isoDate(article.publishedAt),
      changefreq: "weekly",
      priority: article.featured ? 0.76 : 0.66,
    }),
  );
}

export function getSourceSitemapEntries(): SitemapEntry[] {
  return [];
}

export function getSitemapEntries(group: SitemapGroup): SitemapEntry[] {
  switch (group) {
    case "static":
      return getStaticSitemapEntries();
    case "profiles":
      return getProfileSitemapEntries();
    case "officials":
      return getOfficialSitemapEntries();
    case "agencies":
      return getAgencySitemapEntries();
    case "jurisdictions":
      return getJurisdictionSitemapEntries();
    case "races":
      return getRaceSitemapEntries();
    case "school-boards":
      return getSchoolBoardSitemapEntries();
    case "stories":
      return getStorySitemapEntries();
    case "sources":
      return getSourceSitemapEntries();
  }
}

export function getSitemapIndexEntries() {
  const now = new Date().toISOString();
  return [
    ...sitemapGroups.map((group) => ({
      loc: absoluteUrl(group.path),
      lastmod: now,
    })),
    {
      loc: absoluteUrl("/sitemaps/news.xml"),
      lastmod: now,
    },
  ];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function sitemapIndexXml() {
  const body = getSitemapIndexEntries()
    .map((item) => `  <sitemap><loc>${escapeXml(item.loc)}</loc><lastmod>${item.lastmod}</lastmod></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function urlSetXml(entries: SitemapEntry[]) {
  const body = entries
    .map((item) => {
      const lastmod = item.lastmod ? `<lastmod>${escapeXml(item.lastmod)}</lastmod>` : "";
      const changefreq = item.changefreq ? `<changefreq>${item.changefreq}</changefreq>` : "";
      const priority = typeof item.priority === "number" ? `<priority>${item.priority.toFixed(2)}</priority>` : "";
      return `  <url><loc>${escapeXml(item.loc)}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function newsSitemapXml() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = getAllNews().filter((article) => new Date(article.publishedAt).getTime() >= cutoff).slice(0, 1000);
  const body = recent
    .map((article) => {
      const title = article.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return [
        "  <url>",
        `    <loc>${escapeXml(absoluteUrl(`/news/${article.id}`))}</loc>`,
        "    <news:news>",
        "      <news:publication><news:name>RepWatchr</news:name><news:language>en</news:language></news:publication>",
        `      <news:publication_date>${escapeXml(isoDate(article.publishedAt))}</news:publication_date>`,
        `      <news:title>${title}</news:title>`,
        "    </news:news>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${body}\n</urlset>\n`;
}

export function getSeoAuditReport() {
  const groups = sitemapGroups.map((group) => ({
    ...group,
    count: getSitemapEntries(group.key).length,
  }));
  const completion = getOfficialCompletionDashboard();
  const sourceCountByIndexableProfile = usefulOfficialEntries().length;
  const lowCompletenessIndexablePages = getAllOfficials().filter((official) => {
    const snapshot = buildOfficialCompletionSnapshot(official);
    return (official.sourceLinks?.length ?? 0) > 0 && snapshot.completionPercent < 50 && official.reviewStatus !== "needs_source_review";
  }).length;

  return {
    siteUrl: SITE_URL,
    sitemapUrlCount: groups.reduce((sum, group) => sum + group.count, 0),
    groups,
    sourceCountByIndexableProfile,
    lowCompletenessIndexablePages,
    noindexRules: ["/admin", "/admin/", "/auth/", "/dashboard/", "/login", "/buildout", "/uap"],
    missingMetadata: [],
    missingCanonical: [],
    missingOgImage: [],
    duplicateSlugs: [],
    orphanCandidates: completion.missingItemCounts.slice(0, 10).map((item) => ({
      label: item.label,
      count: item.count,
    })),
    generatedAt: new Date().toISOString(),
  };
}
