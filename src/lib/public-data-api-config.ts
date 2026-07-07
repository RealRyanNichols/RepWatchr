export const PUBLIC_API_DISABLED_MESSAGE =
  "RepWatchr public API is not enabled yet. Request access at /packages/public-data-api.";

export const PUBLIC_API_SCOPES = [
  "public_profiles_read",
  "public_sources_read",
  "public_jurisdictions_read",
  "public_races_read",
  "public_stories_read",
  "public_questions_read",
  "aggregate_trends_read",
  "exports_create",
  "admin_internal",
] as const;

export const API_ACCESS_STATUSES = ["new", "reviewed", "approved", "denied", "waitlist", "archived"] as const;

export const DATA_EXPORT_TYPES = [
  "profile_csv",
  "source_csv",
  "jurisdiction_csv",
  "race_csv",
  "watchlist_export",
  "source_packet_export",
  "records_request_export",
  "aggregate_trend_export",
] as const;

export type PublicApiScope = (typeof PUBLIC_API_SCOPES)[number];
export type ApiAccessStatus = (typeof API_ACCESS_STATUSES)[number];

export type PublicApiEndpoint = {
  path: string;
  label: string;
  scope: PublicApiScope;
  description: string;
};

export const PUBLIC_API_ENDPOINTS: PublicApiEndpoint[] = [
  {
    path: "/api/public/profiles",
    label: "Profiles",
    scope: "public_profiles_read",
    description: "Approved source-backed public official and public power profiles.",
  },
  {
    path: "/api/public/profiles/[id]",
    label: "Profile detail",
    scope: "public_profiles_read",
    description: "One approved public profile with source labels and source counts.",
  },
  {
    path: "/api/public/jurisdictions",
    label: "Jurisdictions",
    scope: "public_jurisdictions_read",
    description: "Public state, county, city, district, and local civic hub metadata.",
  },
  {
    path: "/api/public/races",
    label: "Races",
    scope: "public_races_read",
    description: "Approved public election/race metadata and source gaps.",
  },
  {
    path: "/api/public/sources",
    label: "Sources",
    scope: "public_sources_read",
    description: "Approved public source links only, never under-review user claims.",
  },
  {
    path: "/api/public/stories",
    label: "Stories",
    scope: "public_stories_read",
    description: "Published story and Daily Watch records with public source context.",
  },
  {
    path: "/api/public/search",
    label: "Search",
    scope: "public_profiles_read",
    description: "Search public profiles, races, jurisdictions, sources, and stories.",
  },
  {
    path: "/api/public/aggregate-trends",
    label: "Aggregate trends",
    scope: "aggregate_trends_read",
    description: "Non-identifying aggregate attention, source, watch, and trend signals.",
  },
];
