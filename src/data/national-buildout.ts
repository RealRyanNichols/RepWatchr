export type NationalBuildoutStatus = "loaded" | "partial" | "queued";

export interface NationalJurisdictionBuildout {
  code: string;
  name: string;
  status: NationalBuildoutStatus;
  modelEnabled: boolean;
  loadedProfileCount: number;
  sourcePlan: string[];
  note: string;
}

export interface NationalGovernmentScope {
  id: string;
  label: string;
  publicDescription: string;
  buildoutNeed: string;
  sourcePlan: string[];
}

export const nationalGovernmentScopes: NationalGovernmentScope[] = [
  {
    id: "federal",
    label: "Federal elected officials",
    publicDescription: "President, Vice President, U.S. Senate, U.S. House, delegates, and federal leadership roles.",
    buildoutNeed: "Current officeholder roster, official site, public contact, vote records, statements, funding, photos, and source links.",
    sourcePlan: ["Congress.gov", "House and Senate directories", "FEC records", "official websites", "public social links"],
  },
  {
    id: "statewide",
    label: "Statewide executive offices",
    publicDescription: "Governors, lieutenant governors, attorneys general, secretaries of state, comptrollers, treasurers, and similar offices.",
    buildoutNeed: "State directory source, office term, official contacts, campaign finance source, statements, and executive action records.",
    sourcePlan: ["state official directories", "state ethics/campaign-finance portals", "official websites", "press-release feeds"],
  },
  {
    id: "state-legislature",
    label: "State legislators",
    publicDescription: "State house, assembly, senate, and unicameral legislators for every state.",
    buildoutNeed: "Roster, district, party, official photo, bill votes, committee roles, campaign finance, and public-source links.",
    sourcePlan: ["state legislature roster", "state bill/vote portal", "state ethics portal", "official member pages"],
  },
  {
    id: "county",
    label: "County government",
    publicDescription: "County judges/executives, commissioners, sheriffs, prosecutors, clerks, treasurers, and election officials.",
    buildoutNeed: "County directory, election source, public contact, agendas/minutes, budget votes, contracts, and public records.",
    sourcePlan: ["county official websites", "county election offices", "meeting agendas", "public records portals"],
  },
  {
    id: "municipal",
    label: "Municipal government",
    publicDescription: "Mayors, city council members, city managers, police chiefs, municipal judges, and department leadership.",
    buildoutNeed: "City roster, official contact, meeting records, local election data, public statements, and source links.",
    sourcePlan: ["city official websites", "city council agendas", "local election offices", "public meeting video"],
  },
  {
    id: "school-board",
    label: "School boards",
    publicDescription: "District trustees, superintendents, board officers, candidates, school district source pages, and election cycles.",
    buildoutNeed: "Roster, seat, term, district page, meeting votes, public comments, election data, and trustee profile photos.",
    sourcePlan: ["state education directories", "district board pages", "county election filings", "board agendas and minutes"],
  },
  {
    id: "tribal",
    label: "Tribal governments",
    publicDescription: "Federally recognized tribal governments, councils, chairs, presidents, governors, and public tribal offices where publicly listed.",
    buildoutNeed: "Official tribal government source, public title, term if available, public contact, and correction request path.",
    sourcePlan: ["BIA Tribal Leaders Directory", "official tribal government websites", "tribal election or council pages"],
  },
  {
    id: "courts-prosecutors",
    label: "Courts, prosecutors, and law enforcement offices",
    publicDescription: "Public offices that exercise state power in courts, policing, prosecution, detention, and public-record enforcement.",
    buildoutNeed: "Official role source, jurisdiction, public contact, case/source links, ethics/discipline source, and correction queue.",
    sourcePlan: ["court directories", "prosecutor offices", "sheriff offices", "state judicial directories"],
  },
  {
    id: "special-districts",
    label: "Special districts and public authorities",
    publicDescription: "Water districts, appraisal districts, hospital districts, transit boards, port authorities, and other public bodies.",
    buildoutNeed: "Board roster, appointment/election source, agenda records, financial source, public contact, and public meeting archive.",
    sourcePlan: ["district websites", "state public body registries", "county appointment records", "public meeting notices"],
  },
];

const nationalStateSourcePlan = [
  "state official directory",
  "state legislature roster",
  "state bill and vote portal",
  "state campaign-finance or ethics portal",
  "county and municipal directories",
  "public social account links",
];

export const nationalJurisdictionBuildouts: NationalJurisdictionBuildout[] = [
  { code: "AL", name: "Alabama", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "AK", name: "Alaska", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "AZ", name: "Arizona", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "AR", name: "Arkansas", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "CA", name: "California", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "CO", name: "Colorado", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "CT", name: "Connecticut", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "DE", name: "Delaware", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "FL", name: "Florida", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "GA", name: "Georgia", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "HI", name: "Hawaii", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "ID", name: "Idaho", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "IL", name: "Illinois", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "IN", name: "Indiana", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "IA", name: "Iowa", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "KS", name: "Kansas", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "KY", name: "Kentucky", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "LA", name: "Louisiana", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "ME", name: "Maine", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MD", name: "Maryland", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MA", name: "Massachusetts", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MI", name: "Michigan", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MN", name: "Minnesota", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MS", name: "Mississippi", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MO", name: "Missouri", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "MT", name: "Montana", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "NE", name: "Nebraska", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "NV", name: "Nevada", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "NH", name: "New Hampshire", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "NJ", name: "New Jersey", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "NM", name: "New Mexico", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "NY", name: "New York", status: "partial", modelEnabled: true, loadedProfileCount: 2, sourcePlan: nationalStateSourcePlan, note: "Starter legal-power profile loaded; elected-official roster import queued." },
  { code: "NC", name: "North Carolina", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "ND", name: "North Dakota", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "OH", name: "Ohio", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "OK", name: "Oklahoma", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "OR", name: "Oregon", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "PA", name: "Pennsylvania", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "RI", name: "Rhode Island", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "SC", name: "South Carolina", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "SD", name: "South Dakota", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "TN", name: "Tennessee", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "TX", name: "Texas", status: "loaded", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Texas elected officials, school boards, attorneys, and media are the first active buildout." },
  { code: "UT", name: "Utah", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "VT", name: "Vermont", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "VA", name: "Virginia", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "WA", name: "Washington", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "WV", name: "West Virginia", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "WI", name: "Wisconsin", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
  { code: "WY", name: "Wyoming", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/state model enabled; source import queued." },
];

export const nationalTerritoryBuildouts: NationalJurisdictionBuildout[] = [
  { code: "DC", name: "District of Columbia", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Federal/local model enabled; district source import queued." },
  { code: "AS", name: "American Samoa", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Delegate and territorial government model enabled; source import queued." },
  { code: "GU", name: "Guam", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Delegate and territorial government model enabled; source import queued." },
  { code: "MP", name: "Northern Mariana Islands", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Delegate and territorial government model enabled; source import queued." },
  { code: "PR", name: "Puerto Rico", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Resident commissioner and territorial government model enabled; source import queued." },
  { code: "VI", name: "U.S. Virgin Islands", status: "queued", modelEnabled: true, loadedProfileCount: 0, sourcePlan: nationalStateSourcePlan, note: "Delegate and territorial government model enabled; source import queued." },
];

export const socialMonitoringConnections = [
  {
    label: "Official profile links",
    status: "active",
    detail: "Profiles can expose public X, Facebook, YouTube, Instagram, and official website links when source-loaded.",
  },
  {
    label: "Public statement snapshots",
    status: "schema-ready",
    detail: "The SQL schema added in this build can store approved public statement source URLs, excerpts, and review status.",
  },
  {
    label: "Real-time X scan",
    status: "credential-gated",
    detail: "Requires X API credentials, a collector job, rate-limit handling, and policy-compliant storage before live scanning is enabled.",
  },
  {
    label: "Notable statement queue",
    status: "admin-review",
    detail: "Statements should be reviewed as public-source records with URLs, dates, and context before appearing on public profile pages.",
  },
];

export const adminOnlyWatchItems = [
  {
    label: "Joseph D. McBride",
    type: "internal source-review flag",
    detail:
      "Internal-only follow-up. Do not display a public red mark unless a source-backed public finding is approved for publication.",
    profilePath: "/attorneys/joseph-d-mcbride",
  },
];

export function getNationalBuildoutSummary() {
  const allJurisdictions = [...nationalJurisdictionBuildouts, ...nationalTerritoryBuildouts];

  return {
    stateCount: nationalJurisdictionBuildouts.length,
    territoryAndDistrictCount: nationalTerritoryBuildouts.length,
    allJurisdictionCount: allJurisdictions.length,
    enabledJurisdictions: allJurisdictions.filter((item) => item.modelEnabled).length,
    loadedJurisdictions: allJurisdictions.filter((item) => item.status === "loaded").length,
    partialJurisdictions: allJurisdictions.filter((item) => item.status === "partial").length,
    queuedJurisdictions: allJurisdictions.filter((item) => item.status === "queued").length,
    governmentScopeCount: nationalGovernmentScopes.length,
    socialConnectionCount: socialMonitoringConnections.length,
  };
}
