export const MARION_ELECTION_REVIEW_DATE = "2026-09-29";
export const MARION_ELECTION_PAGE = "https://marioncountytaxoffice.com/november-3-2026-general-special-election/";
export const MARION_SAMPLE_BALLOT = "https://marioncountytaxoffice.com/wp-content/uploads/2026/09/SAMPLE-BALLOT-PCT-1-2.pdf";

export const marionElectionDates = [
  { date: "2026-10-05", title: "Registration deadline", detail: "The county lists October 5 as the last day to register." },
  { date: "2026-10-19", title: "Early voting begins", detail: "The county lists October 19–30 for early voting." },
  { date: "2026-10-23", title: "Mail-ballot application", detail: "The county says applications must be received by October 23, not merely postmarked." },
  { date: "2026-10-30", title: "Early voting ends", detail: "Check the county page for current hours and locations." },
  { date: "2026-11-03", title: "Election Day", detail: "The county lists Election Day voting from 7 a.m. to 7 p.m." },
] as const;

export type MarionPublicRecord = {
  id: string; title: string; kind: "Official" | "Correspondence" | "Commentary";
  status: "Documented" | "Attributed" | "Unverified";
  url: string; reviewedAt: string; supports: string; limit: string;
};

export const marionOfficialRecords: MarionPublicRecord[] = [
  { id: "election-calendar", title: "November election calendar", kind: "Official", status: "Documented", url: MARION_ELECTION_PAGE, reviewedAt: MARION_ELECTION_REVIEW_DATE, supports: "The county publishes election dates, voting-location information, and links to sample ballots.", limit: "Check the county's current notice before relying on hours or locations. This review does not verify an individual voter's eligibility." },
  { id: "sample-ballot", title: "Sample ballot: precincts 1 and 2", kind: "Official", status: "Documented", url: MARION_SAMPLE_BALLOT, reviewedAt: MARION_ELECTION_REVIEW_DATE, supports: "Page 2 lists Leward J. LaFleur as Republican in the County Judge contest and provides a blank write-in line.", limit: "This is one precinct-specific sample. The blank line does not name Carroll or establish her write-in qualification. It is not an election result." },
  { id: "treasurer-appointment", title: "Carroll campaign-treasurer appointment", kind: "Official", status: "Documented", url: "https://marioncountytaxoffice.com/wp-content/uploads/2026/07/CTA-D-CARROLL.pdf", reviewedAt: MARION_ELECTION_REVIEW_DATE, supports: "The county elections index links a campaign-treasurer appointment under Dina K. Carroll.", limit: "A treasurer appointment is separate from an accepted write-in declaration. The accepted declaration or qualified-write-in roster has not been acquired for this desk." },
  { id: "write-in-procedures", title: "Texas 2026 write-in procedures", kind: "Official", status: "Documented", url: "https://www.sos.state.tx.us/elections/candidates/guide/2026/writein2026.shtml", reviewedAt: MARION_ELECTION_REVIEW_DATE, supports: "The Secretary of State lists the declaration filing period as July 18 through August 17, 2026, at 5 p.m.", limit: "State procedures do not prove county acceptance of a particular candidate. This filing window has closed." },
];
