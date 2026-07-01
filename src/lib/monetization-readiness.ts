import fs from "fs";
import path from "path";
import { getRepWatchrDataStats } from "@/lib/data";
import { getSchoolBoardStats } from "@/lib/school-board-research";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";

export type ReadinessStatus = "ready" | "partial" | "blocked";

export type ReadinessCategory =
  | "public_surface"
  | "data_intake"
  | "accounts"
  | "analytics"
  | "trust_safety"
  | "seo_share"
  | "monetization";

export type ReadinessFileCheck = {
  label: string;
  path: string;
  exists: boolean;
};

export type ReadinessCheck = {
  id: string;
  title: string;
  category: ReadinessCategory;
  status: ReadinessStatus;
  score: number;
  requiredBeforeSelling: boolean;
  summary: string;
  evidence: string[];
  gaps: string[];
  files: ReadinessFileCheck[];
  requiredTables: string[];
};

export type ReadinessSummary = {
  generatedAt: string;
  overallStatus: ReadinessStatus;
  score: number;
  readyCount: number;
  partialCount: number;
  blockedCount: number;
  requiredBlockedCount: number;
  totalChecks: number;
  publicProfiles: number;
  publicSources: number;
  averageProfileCompletionPercent: number;
  canSellNow: boolean;
  salesBlocker: string;
};

export const REPWATCHR_REQUIRED_PUBLIC_LABELS = [
  "Confirmed public record",
  "Source-backed claim",
  "Public question",
  "Needs source",
  "Under review",
  "Correction requested",
  "Opinion",
  "Allegation",
  "Insufficient data",
  "Archived",
  "Updated",
];

export const REPWATCHR_HARD_SAFETY_RULES = [
  "No private home addresses.",
  "No minor children.",
  "No doxxing.",
  "No threats.",
  "No harassment instructions.",
  "No unsourced criminal accusations.",
  "No personal medical information.",
  "No private financial information.",
  "No publishing personal contact information unless it is clearly official public contact information.",
  "No AI-generated accusations.",
  "No language that implies guilt beyond what a source proves.",
  "No raw user-submitted allegations published as fact.",
  "No official score that pretends to be truth unless the scoring method is clear and source-based.",
];

function projectPath(filePath: string) {
  return path.join(process.cwd(), filePath);
}

function fileCheck(label: string, filePath: string): ReadinessFileCheck {
  return {
    label,
    path: filePath,
    exists: fs.existsSync(projectPath(filePath)),
  };
}

function scoreFromFiles(files: ReadinessFileCheck[], hasData = true) {
  if (!files.length) return hasData ? 100 : 0;
  const found = files.filter((file) => file.exists).length;
  const fileScore = Math.round((found / files.length) * 100);
  return hasData ? fileScore : Math.min(fileScore, 50);
}

function statusFromScore(score: number): ReadinessStatus {
  if (score >= 85) return "ready";
  if (score >= 45) return "partial";
  return "blocked";
}

function buildCheck(input: {
  id: string;
  title: string;
  category: ReadinessCategory;
  requiredBeforeSelling?: boolean;
  summary: string;
  evidence: string[];
  gaps?: string[];
  files?: ReadinessFileCheck[];
  requiredTables?: string[];
  hasData?: boolean;
}): ReadinessCheck {
  const files = input.files ?? [];
  const score = scoreFromFiles(files, input.hasData ?? true);
  return {
    id: input.id,
    title: input.title,
    category: input.category,
    status: statusFromScore(score),
    score,
    requiredBeforeSelling: input.requiredBeforeSelling ?? true,
    summary: input.summary,
    evidence: input.evidence,
    gaps: input.gaps ?? [],
    files,
    requiredTables: input.requiredTables ?? [],
  };
}

export function getMonetizationReadinessChecks(): ReadinessCheck[] {
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const completion = getOfficialCompletionDashboard();
  const profileTotal = dataStats.nonSchoolOfficialFiles + schoolStats.candidates + dataStats.publicPowerProfiles;
  const sourceTotal = dataStats.publicSourceUrls + schoolStats.sourceCount;

  return [
    buildCheck({
      id: "searchable_public_profiles",
      title: "Searchable public profiles",
      category: "public_surface",
      summary: "Visitors need searchable official, school-board, race, issue, funding, and story surfaces before selling.",
      evidence: [
        `${profileTotal.toLocaleString()} public profile records across officials, school boards, and public-power profiles.`,
        `${dataStats.officialsWithPhotos.toLocaleString()} official photos loaded.`,
        `${sourceTotal.toLocaleString()} public source URLs attached.`,
      ],
      gaps: completion.lowestCompletionProfiles.slice(0, 3).map((profile) => `${profile.profileName}: ${profile.completionPercent}% complete`),
      files: [
        fileCheck("Officials directory", "src/app/officials/page.tsx"),
        fileCheck("Official profile route", "src/app/officials/[id]/page.tsx"),
        fileCheck("School boards", "src/app/school-boards/page.tsx"),
        fileCheck("Search page", "src/app/search/page.tsx"),
      ],
      hasData: profileTotal > 0 && sourceTotal > 0,
    }),
    buildCheck({
      id: "clickable_profile_systems",
      title: "Clickable profile dossier system",
      category: "public_surface",
      summary: "Profiles must lead to votes, timelines, funding, red flags, source trails, and next actions.",
      evidence: [
        `${dataStats.publicVoteRecordRows.toLocaleString()} public vote rows.`,
        `${dataStats.fundingSummaries.toLocaleString()} funding summaries.`,
        `${dataStats.redFlagItems.toLocaleString()} red-flag/source-review rows.`,
      ],
      files: [
        fileCheck("Official profile route", "src/app/officials/[id]/page.tsx"),
        fileCheck("Timeline route", "src/app/officials/[id]/timeline/page.tsx"),
        fileCheck("Funding route", "src/app/funding/[officialId]/page.tsx"),
        fileCheck("Vote route", "src/app/votes/[billId]/page.tsx"),
        fileCheck("Share controls", "src/components/shared/ShareButtons.tsx"),
      ],
      hasData: dataStats.publicVoteRecordRows > 0 || dataStats.fundingSummaries > 0,
    }),
    buildCheck({
      id: "watchlists",
      title: "Watchlists and return triggers",
      category: "accounts",
      summary: "Watchlists create return visits through saved officials, issues, races, alerts, and digests.",
      evidence: ["Member watchlist office, watchlist APIs, and alert preference tables are represented in code."],
      files: [
        fileCheck("Watchlist dashboard", "src/app/dashboard/watchlists/page.tsx"),
        fileCheck("Watchlist component", "src/components/dashboard/MemberWatchlistOffice.tsx"),
        fileCheck("Watchlist API", "src/app/api/member/watchlists/route.ts"),
        fileCheck("Watchlist item API", "src/app/api/member/watchlists/items/route.ts"),
      ],
      requiredTables: [
        "member_watchlists",
        "member_watchlist_items",
        "member_watchlist_alert_preferences",
        "member_watchlist_alert_events",
        "member_watchlist_digest_runs",
      ],
    }),
    buildCheck({
      id: "source_and_correction_intake",
      title: "Source submissions and corrections",
      category: "data_intake",
      summary: "The product has to capture missing sources, correction requests, public records, and review packets.",
      evidence: ["Submit-source route, report button, correction packet mode, and report table SQL are present."],
      files: [
        fileCheck("Submit source page", "src/app/submit-source/page.tsx"),
        fileCheck("Correction/report button", "src/components/shared/ReportButton.tsx"),
        fileCheck("Reports SQL", "supabase-reports.sql"),
        fileCheck("Texas contribution form", "src/components/elections/TexasElectionContributionForm.tsx"),
      ],
      requiredTables: ["reports", "texas_election_contributions", "source_submissions"],
    }),
    buildCheck({
      id: "public_record_packet_builders",
      title: "Public-record packet builders",
      category: "data_intake",
      summary: "RepWatchr needs packet builders that turn a link, claim, vote, meeting, or correction into a reusable source packet.",
      evidence: ["Service request packets, election contribution packets, and submit-source query prefill paths are present."],
      gaps: ["Free packet funnel should be verified against production Supabase before being treated as growth-ready."],
      files: [
        fileCheck("Service request packet builder", "src/components/services/ServiceRequestPacketBuilder.tsx"),
        fileCheck("Texas contribution page", "src/app/elections/texas/contribute/page.tsx"),
        fileCheck("Submit source page", "src/app/submit-source/page.tsx"),
      ],
      requiredTables: ["service_requests", "source_submissions", "data_product_interests"],
    }),
    buildCheck({
      id: "accounts_and_dashboards",
      title: "User accounts and member dashboard",
      category: "accounts",
      summary: "Accounts are required before verified feedback, saved history, watchlists, and paid tools are credible.",
      evidence: ["Auth routes, dashboard route, member APIs, and Supabase SSR client exist."],
      files: [
        fileCheck("Signup page", "src/app/auth/signup/page.tsx"),
        fileCheck("Login page", "src/app/auth/login/page.tsx"),
        fileCheck("Auth callback", "src/app/auth/callback/route.ts"),
        fileCheck("Dashboard", "src/app/dashboard/page.tsx"),
        fileCheck("Supabase server client", "src/lib/supabase-server.ts"),
      ],
      requiredTables: ["member_profiles", "user_roles"],
    }),
    buildCheck({
      id: "visitor_analytics_interest_graph",
      title: "Visitor intelligence, behavioral analytics, and interest scoring",
      category: "analytics",
      summary: "RepWatchr needs anonymous visitor profiles, merged member history, interest scoring, and admin analytics before serious monetization.",
      evidence: ["Visitor tracker, interest profile API, behavioral analytics SQL, and admin analytics route exist."],
      files: [
        fileCheck("Visitor tracker", "src/components/shared/VisitorIntelligenceTracker.tsx"),
        fileCheck("Visitor API", "src/app/api/analytics/visitor/route.ts"),
        fileCheck("Interest profile API", "src/app/api/personalization/interest-profile/route.ts"),
        fileCheck("Behavioral analytics admin", "src/app/admin/behavioral-analytics/page.tsx"),
        fileCheck("Behavioral analytics SQL", "supabase-behavioral-analytics.sql"),
      ],
      requiredTables: [
        "visitor_profiles",
        "visitor_sessions",
        "visitor_events",
        "visitor_profile_merges",
        "interest_taxonomy",
        "visitor_interest_scores",
        "visitor_interest_events",
        "behavioral_heatmap_events",
      ],
    }),
    buildCheck({
      id: "admin_queues_and_review",
      title: "Admin queues and review controls",
      category: "trust_safety",
      summary: "Admin must be able to review claims, submissions, content, analytics, buildout, future revenue, and data health.",
      evidence: ["Control center, claims queue, content review, analytics, future revenue, and profile completion APIs exist."],
      files: [
        fileCheck("Admin control center", "src/app/admin/control-center/page.tsx"),
        fileCheck("Claims admin", "src/app/admin/claims/page.tsx"),
        fileCheck("Content review admin", "src/app/admin/content-review/page.tsx"),
        fileCheck("Behavioral analytics admin", "src/app/admin/behavioral-analytics/page.tsx"),
        fileCheck("Future revenue admin", "src/app/admin/future-revenue/page.tsx"),
        fileCheck("Profile completion API", "src/app/api/admin/profile-completion/route.ts"),
      ],
      requiredTables: ["profile_claims", "claimed_profile_content", "reports", "source_submissions"],
    }),
    buildCheck({
      id: "seo_share_next_clicks",
      title: "SEO, sharing, and next-click mechanisms",
      category: "seo_share",
      summary: "Every page needs a next move, share path, canonical/indexing foundation, and source-first social preview posture.",
      evidence: ["Sitemap, robots, share buttons, CivicLoopPanel, and NextUsefulMovePanel exist."],
      files: [
        fileCheck("Sitemap", "src/app/sitemap.ts"),
        fileCheck("Robots", "src/app/robots.ts"),
        fileCheck("Share buttons", "src/components/shared/ShareButtons.tsx"),
        fileCheck("Civic loop panel", "src/components/shared/CivicLoopPanel.tsx"),
        fileCheck("Next useful move", "src/components/shared/NextUsefulMovePanel.tsx"),
      ],
    }),
    buildCheck({
      id: "feedback_and_contributor_reputation",
      title: "Votable feedback and contributor reputation",
      category: "trust_safety",
      summary: "Verified feedback, issue reactions, source contributions, XP, and public contributor pages build trust and repeat use.",
      evidence: ["Feedback panel, contributor routes, and contributor SQL are represented."],
      files: [
        fileCheck("Feedback panel", "src/components/profile/VerifiedPoliticalFeedbackPanel.tsx"),
        fileCheck("Feedback page", "src/app/feedback/page.tsx"),
        fileCheck("Contributors page", "src/app/contributors/page.tsx"),
        fileCheck("Contributor profile route", "src/app/contributors/[handle]/page.tsx"),
        fileCheck("Contributor SQL", "supabase-contributor-profiles.sql"),
      ],
      requiredTables: [
        "political_feedback_questions",
        "political_feedback_responses",
        "official_vote_reactions",
        "contributor_profiles",
        "contributor_xp_events",
      ],
    }),
    buildCheck({
      id: "package_interest_capture",
      title: "Package-interest capture without selling yet",
      category: "monetization",
      summary: "RepWatchr can collect buyer intent before turning on sales, as long as fulfillment and privacy are clear.",
      evidence: ["Package pages, package interest form, admin monetization dashboard, data reports page, and interest APIs are present."],
      files: [
        fileCheck("Packages page", "src/app/packages/page.tsx"),
        fileCheck("Package detail route", "src/app/packages/[packageSlug]/page.tsx"),
        fileCheck("Package interest API", "src/app/api/package-interest/route.ts"),
        fileCheck("Package interest SQL", "supabase-package-interest.sql"),
        fileCheck("Admin monetization dashboard", "src/app/admin/monetization/page.tsx"),
        fileCheck("Data reports page", "src/app/data-reports/page.tsx"),
        fileCheck("Interest form", "src/components/data/DataProductInterestForm.tsx"),
        fileCheck("Interest API", "src/app/api/data-product-interest/route.ts"),
      ],
      requiredTables: ["package_interest", "data_product_interests"],
    }),
    buildCheck({
      id: "future_payment_and_revenue_flags",
      title: "Future revenue flags, payments later",
      category: "monetization",
      summary: "Payment infrastructure must stay behind feature flags until profiles, trust, analytics, source queues, and admin review are ready.",
      evidence: ["Future revenue registry, admin-only route, Stripe routes, and feature flag helper exist."],
      gaps: ["Do not enable checkout or paid API surfaces until legal/privacy, fulfillment, and support paths are approved."],
      files: [
        fileCheck("Future revenue registry", "src/data/future-revenue.ts"),
        fileCheck("Future revenue flags", "src/lib/future-revenue-flags.ts"),
        fileCheck("Future revenue admin", "src/app/admin/future-revenue/page.tsx"),
        fileCheck("Stripe checkout route", "src/app/api/stripe/create-checkout-session/route.ts"),
        fileCheck("Stripe webhook route", "src/app/api/stripe/webhook/route.ts"),
      ],
      requiredTables: [
        "future_revenue_feature_flags",
        "future_revenue_packages",
        "orders",
        "subscriptions",
        "payment_events",
      ],
    }),
  ];
}

export function getMonetizationReadinessSummary(checks = getMonetizationReadinessChecks()): ReadinessSummary {
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const completion = getOfficialCompletionDashboard();
  const readyCount = checks.filter((check) => check.status === "ready").length;
  const partialCount = checks.filter((check) => check.status === "partial").length;
  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const requiredBlockedCount = checks.filter((check) => check.requiredBeforeSelling && check.status !== "ready").length;
  const score = Math.round(checks.reduce((sum, check) => sum + check.score, 0) / Math.max(1, checks.length));
  const overallStatus = requiredBlockedCount > 0 ? "partial" : score >= 85 ? "ready" : "partial";

  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    score,
    readyCount,
    partialCount,
    blockedCount,
    requiredBlockedCount,
    totalChecks: checks.length,
    publicProfiles: dataStats.nonSchoolOfficialFiles + schoolStats.candidates + dataStats.publicPowerProfiles,
    publicSources: dataStats.publicSourceUrls + schoolStats.sourceCount,
    averageProfileCompletionPercent: completion.averageCompletionPercent,
    canSellNow: false,
    salesBlocker:
      "Sales stay off until all required readiness checks are ready and future payment/package flags are explicitly approved.",
  };
}

export function getMonetizationReadinessReport() {
  const checks = getMonetizationReadinessChecks();
  return {
    summary: getMonetizationReadinessSummary(checks),
    checks,
    publicLabels: REPWATCHR_REQUIRED_PUBLIC_LABELS,
    safetyRules: REPWATCHR_HARD_SAFETY_RULES,
  };
}
