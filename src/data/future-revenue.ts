export type FutureRevenueCategory =
  | "research"
  | "election"
  | "monitoring"
  | "dashboard"
  | "desk"
  | "api"
  | "export"
  | "reporting"
  | "account"
  | "billing"
  | "licensing";

export type FutureRevenuePackage = {
  slug: string;
  name: string;
  category: FutureRevenueCategory;
  audience: string;
  internalPurpose: string;
  flagKey: string;
  capabilities: string[];
  status: "hidden";
};

export const FUTURE_REVENUE_MASTER_FLAG = "future_revenue";

export const FUTURE_REVENUE_PACKAGES: FutureRevenuePackage[] = [
  {
    slug: "research-pro",
    name: "Research Pro",
    category: "research",
    audience: "researchers, campaigns, watchdogs, and source runners",
    internalPurpose: "Expanded saved research, source maps, timelines, exports, and brief generation.",
    flagKey: "future_revenue_research_pro",
    capabilities: ["saved research workspaces", "expanded packets", "export queue", "priority source review"],
    status: "hidden",
  },
  {
    slug: "election-hq",
    name: "Election HQ",
    category: "election",
    audience: "campaigns, local parties, civic groups, donors, and reporters",
    internalPurpose: "Race watch command center with candidates, filings, source gaps, finance, and questions.",
    flagKey: "future_revenue_election_hq",
    capabilities: ["race dashboards", "candidate comparison", "filing monitor", "question builder"],
    status: "hidden",
  },
  {
    slug: "campaign-intel",
    name: "Campaign Intel",
    category: "research",
    audience: "campaigns, consultants, PACs, donors, and opposition researchers",
    internalPurpose: "Source-backed campaign intelligence with vote, funding, profile, and issue cuts.",
    flagKey: "future_revenue_campaign_intel",
    capabilities: ["official dossiers", "funding cuts", "vote reactions", "issue pressure map"],
    status: "hidden",
  },
  {
    slug: "county-monitor",
    name: "County Monitor",
    category: "monitoring",
    audience: "county watchdogs, local media, attorneys, vendors, and civic groups",
    internalPurpose: "County official, meeting, filing, source, and public-record change monitoring.",
    flagKey: "future_revenue_county_monitor",
    capabilities: ["county watchlists", "weekly digest", "meeting alerts", "missing-source queue"],
    status: "hidden",
  },
  {
    slug: "school-board-monitor",
    name: "School Board Monitor",
    category: "monitoring",
    audience: "parents, local reporters, candidates, and education groups",
    internalPurpose: "School board members, bond elections, meetings, votes, and source gaps.",
    flagKey: "future_revenue_school_board_monitor",
    capabilities: ["board profiles", "bond tracking", "meeting clips", "public questions"],
    status: "hidden",
  },
  {
    slug: "local-media-dashboard",
    name: "Local Media Dashboard",
    category: "dashboard",
    audience: "local newsrooms, newsletter writers, and civic media operators",
    internalPurpose: "Source-backed story leads, official pages, questions, and share snippets.",
    flagKey: "future_revenue_local_media_dashboard",
    capabilities: ["story leads", "source packets", "official context", "safe share snippets"],
    status: "hidden",
  },
  {
    slug: "journalist-desk",
    name: "Journalist Desk",
    category: "desk",
    audience: "journalists, editors, freelancers, and civic publishers",
    internalPurpose: "Reporter workflow for public records, source trails, timelines, and corrections.",
    flagKey: "future_revenue_journalist_desk",
    capabilities: ["source trail builder", "timeline export", "public-record drafts", "correction history"],
    status: "hidden",
  },
  {
    slug: "attorney-desk",
    name: "Attorney Desk",
    category: "desk",
    audience: "attorneys, paralegals, investigators, and legal researchers",
    internalPurpose: "Public-record organization and official/agency source tracking without legal-advice claims.",
    flagKey: "future_revenue_attorney_desk",
    capabilities: ["agency tracker", "record packet export", "timeline builder", "source gap report"],
    status: "hidden",
  },
  {
    slug: "investor-dashboard",
    name: "Investor Dashboard",
    category: "dashboard",
    audience: "investors, partners, and strategic buyers",
    internalPurpose: "Internal traction, coverage, data volume, revenue readiness, and growth signal view.",
    flagKey: "future_revenue_investor_dashboard",
    capabilities: ["traction metrics", "coverage counters", "revenue pipeline", "data moat summary"],
    status: "hidden",
  },
  {
    slug: "government-contractor-monitor",
    name: "Government Contractor Monitor",
    category: "monitoring",
    audience: "vendors, watchdogs, reporters, attorneys, and procurement researchers",
    internalPurpose: "Public contract, vendor, donation, official, and agency relationship tracking.",
    flagKey: "future_revenue_government_contractor_monitor",
    capabilities: ["vendor watchlists", "contract source links", "official relationships", "filing alerts"],
    status: "hidden",
  },
  {
    slug: "enterprise-api",
    name: "Enterprise API",
    category: "api",
    audience: "enterprise buyers, data customers, research teams, and integrations",
    internalPurpose: "Contract-gated API access with keys, scopes, quotas, credits, and audit logs.",
    flagKey: "future_revenue_enterprise_api",
    capabilities: ["API keys", "scoped access", "quota enforcement", "usage audits"],
    status: "hidden",
  },
  {
    slug: "public-records-api",
    name: "Public Records API",
    category: "api",
    audience: "newsrooms, watchdogs, civic apps, and data teams",
    internalPurpose: "API lane for public source URLs, record metadata, source gaps, and profile links.",
    flagKey: "future_revenue_public_records_api",
    capabilities: ["source metadata", "record links", "profile references", "change feed"],
    status: "hidden",
  },
  {
    slug: "data-export-api",
    name: "Data Export API",
    category: "api",
    audience: "data buyers, campaigns, consultants, and analysts",
    internalPurpose: "Programmatic export queue for aggregate data, source-backed datasets, and report runs.",
    flagKey: "future_revenue_data_export_api",
    capabilities: ["export jobs", "dataset scopes", "usage credits", "delivery webhooks"],
    status: "hidden",
  },
  {
    slug: "csv-export",
    name: "CSV Export",
    category: "export",
    audience: "campaigns, researchers, journalists, and local operators",
    internalPurpose: "CSV output entitlement for profiles, sources, votes, funding, and watchlists.",
    flagKey: "future_revenue_csv_export",
    capabilities: ["CSV queue", "row caps", "scope controls", "download audit"],
    status: "hidden",
  },
  {
    slug: "pdf-reports",
    name: "PDF Reports",
    category: "reporting",
    audience: "campaigns, local watchdogs, journalists, attorneys, and donors",
    internalPurpose: "Source-backed PDF report generation for officials, races, counties, and boards.",
    flagKey: "future_revenue_pdf_reports",
    capabilities: ["PDF queue", "report templates", "source appendix", "fulfillment status"],
    status: "hidden",
  },
  {
    slug: "weekly-intelligence",
    name: "Weekly Intelligence",
    category: "reporting",
    audience: "members, teams, campaigns, media, and local civic operators",
    internalPurpose: "Paid digest lane for watched officials, counties, races, issues, and sources.",
    flagKey: "future_revenue_weekly_intelligence",
    capabilities: ["weekly digest", "major changes", "new filings", "source gaps"],
    status: "hidden",
  },
  {
    slug: "white-label",
    name: "White Label",
    category: "licensing",
    audience: "local publishers, civic groups, media brands, and partner organizations",
    internalPurpose: "Partner-branded RepWatchr data experiences with strict source and safety controls.",
    flagKey: "future_revenue_white_label",
    capabilities: ["partner branding", "organization tenancy", "scoped datasets", "license terms"],
    status: "hidden",
  },
  {
    slug: "organization-accounts",
    name: "Organization Accounts",
    category: "account",
    audience: "campaigns, firms, newsrooms, civic groups, and research teams",
    internalPurpose: "Shared account container for billing, seats, entitlements, exports, and audit logs.",
    flagKey: "future_revenue_organization_accounts",
    capabilities: ["organization profile", "billing owner", "team seats", "shared workspaces"],
    status: "hidden",
  },
  {
    slug: "team-accounts",
    name: "Team Accounts",
    category: "account",
    audience: "multi-user research, campaign, legal, media, and civic teams",
    internalPurpose: "Seat-based member management and role-based access for organization workflows.",
    flagKey: "future_revenue_team_accounts",
    capabilities: ["seat roles", "member invites", "workspace permissions", "audit log"],
    status: "hidden",
  },
  {
    slug: "subscriptions",
    name: "Subscriptions",
    category: "billing",
    audience: "recurring customers and organization accounts",
    internalPurpose: "Recurring billing container for future package activation without enabling checkout.",
    flagKey: "future_revenue_subscriptions",
    capabilities: ["subscription records", "Stripe mapping", "status changes", "period tracking"],
    status: "hidden",
  },
  {
    slug: "api-keys",
    name: "API Keys",
    category: "api",
    audience: "contracted API customers and internal integrations",
    internalPurpose: "Hashed API-key registry with scopes, quotas, status, expiration, and audit logs.",
    flagKey: "future_revenue_api_keys",
    capabilities: ["key prefix", "hashed key", "scopes", "expiration"],
    status: "hidden",
  },
  {
    slug: "credits",
    name: "Credits",
    category: "billing",
    audience: "export, API, report, and intelligence customers",
    internalPurpose: "Credit ledger for metered exports, API requests, reports, and paid review work.",
    flagKey: "future_revenue_credits",
    capabilities: ["credit ledger", "usage deductions", "manual grants", "balance snapshots"],
    status: "hidden",
  },
  {
    slug: "invoices",
    name: "Invoices",
    category: "billing",
    audience: "B2B customers, organizations, and contracted data buyers",
    internalPurpose: "Invoice records for manual billing, Stripe invoices, PDFs, and status tracking.",
    flagKey: "future_revenue_invoices",
    capabilities: ["invoice status", "amounts", "Stripe mapping", "PDF storage path"],
    status: "hidden",
  },
  {
    slug: "licenses",
    name: "Licenses",
    category: "licensing",
    audience: "data, API, white-label, and enterprise customers",
    internalPurpose: "License and contract terms for package access, exports, seats, and API scopes.",
    flagKey: "future_revenue_licenses",
    capabilities: ["license terms", "seat limits", "contract dates", "revocation status"],
    status: "hidden",
  },
];

export function getFutureRevenuePackages() {
  return FUTURE_REVENUE_PACKAGES;
}

export function getFutureRevenueFlags() {
  return [
    FUTURE_REVENUE_MASTER_FLAG,
    ...FUTURE_REVENUE_PACKAGES.map((item) => item.flagKey),
  ];
}
