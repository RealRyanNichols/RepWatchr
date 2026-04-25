export type NationalCoverageLane = {
  title: string;
  scope: string;
  status: "Live first" | "Building" | "Queued";
  description: string;
};

export const nationalCoverageLanes: NationalCoverageLane[] = [
  {
    title: "Federal",
    scope: "President, Vice President, U.S. House, U.S. Senate",
    status: "Live first",
    description:
      "National federal profiles are the first non-local lane because votes, funding, statements, and committee records are the most standardized.",
  },
  {
    title: "State",
    scope: "Governors, statewide offices, state house, state senate",
    status: "Building",
    description:
      "State profiles need official rosters, voting records, campaign finance links, district maps, and issue-weighted scorecards by state.",
  },
  {
    title: "County",
    scope: "County judges, commissioners, sheriffs, district attorneys, clerks",
    status: "Building",
    description:
      "County profiles need jurisdiction, term, public contact, court or agency links, budget authority, and local accountability records.",
  },
  {
    title: "City",
    scope: "Mayors, city councils, city managers where relevant",
    status: "Building",
    description:
      "City profiles need local office rosters, council minutes, public comments, ordinances, police/fire oversight, spending, and elections.",
  },
  {
    title: "School Boards",
    scope: "ISD trustees, candidates, meetings, policies, parent questions",
    status: "Live first",
    description:
      "School-board profiles stay evidence-first with district pages, trustee pages, source links, praise reports, concerns, and claim tools.",
  },
];

export function getNationalCoverageStats(liveProfiles: number) {
  return [
    { label: "Sourced profiles live", value: liveProfiles.toLocaleString() },
    { label: "Target geography", value: "50 states + DC" },
    { label: "Office lanes", value: String(nationalCoverageLanes.length) },
    { label: "Publishing rule", value: "Facts first" },
  ];
}
