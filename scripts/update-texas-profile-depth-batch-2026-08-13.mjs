import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-13";
const financeTexasUrl = "https://www.ethics.state.tx.us/search/cf/";
const electionTexasUrl = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const tribuneTermsUrl = "https://www.texastribune.org/about/terms-of-service/";
const voteGuideUrl = "https://capitol.texas.gov/help/findvoteinfo.aspx";
const texasArticle3Url = "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.3.htm";
const federalFinanceUrl = "https://www.fec.gov/data/candidates/";
const federalConstitutionUrl = "https://constitution.congress.gov/constitution/article-1/";

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

function freshness(status, sourceUrl, note) {
  return { status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) };
}

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

function write(relative, profile) {
  fs.writeFileSync(path.join(ROOT, relative), `${JSON.stringify(profile, null, 2)}\n`);
}

function uniqueSources(items) {
  const seen = new Set();
  return items.filter((item) => item?.url && !seen.has(item.url) && seen.add(item.url));
}

function evidenceNotes(roleLabel) {
  return [
    `${roleLabel} source paths are linked; availability of a record is not treated as a favorable or unfavorable finding without record-level review.`,
    "Positive-work claims remain pending until a dated primary record, measurable result, and independent context are attached.",
    "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
    "Campaign-finance totals, donors, industries/PACs, expenditures, and reporting periods remain unpublished until the correct filer is matched.",
    "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
    "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
  ];
}

function addEvidenceDisclosures(profile, record) {
  profile.officialRecord = record;
  profile.campaignFinanceDisclosure = {
    status: "pending_review",
    sourceUrl: record.financeSourceUrl,
    reviewedAt: REVIEWED_AT,
    note: "Totals, donors, industries/PACs, expenditures, and reporting period are withheld until the officeholder filer is matched without ambiguity.",
  };
  profile.sentimentDisclosure = {
    status: "pending_review",
    reviewedAt: REVIEWED_AT,
    note: "No sentiment is published without jurisdiction-confidence, sampling, collection-window, platform-mix, duplication/bot, and uncertainty disclosures.",
  };
}

const senateRosterUrl = "https://www.senate.texas.gov/members.php";
const senateDirectoryUrl = "https://www.senate.texas.gov/directory.php";
const senateCommitteesUrl = "https://www.senate.texas.gov/committees.php";
const senateJournalUrl = "https://journals.senate.texas.gov/";
for (const district of [27, 28, 29, 30, 31]) {
  const relative = `src/data/officials/state/tx-senate-sd${district}.json`;
  const profile = read(relative);
  const memberUrl = `https://www.senate.texas.gov/member.php?d=${district}`;
  const billUrl = profile.fieldFreshness?.legislation?.sourceUrl
    ?? profile.sourceLinks?.find((item) => item.supports?.includes("sponsored_legislation"))?.url;
  if (profile.district !== `SD-${district}` || !billUrl) throw new Error(`Senate identity/path mismatch: ${relative}`);
  const retained = (profile.sourceLinks ?? []).filter((item) => ![
    memberUrl, senateRosterUrl, senateDirectoryUrl, senateCommitteesUrl, billUrl, voteGuideUrl,
    senateJournalUrl, financeTexasUrl, electionTexasUrl, texasArticle3Url, tribuneTermsUrl,
  ].includes(item.url));
  profile.sourceLinks = uniqueSources([
    source("Official Texas Senate member profile, biography, committees, and contact", memberUrl, ["identity", "current_office", "district", "biography", "committees", "contact"]),
    source("Official current Texas Senate roster", senateRosterUrl, ["current_office", "district", "party"]),
    source("Official Texas Senate directory", senateDirectoryUrl, ["contact", "district", "constituent_service"]),
    source("Official 89th Legislature committee directory", senateCommitteesUrl, ["committees", "committee_structure"]),
    source("Texas Legislature Online bills by author", billUrl, ["sponsored_legislation", "bill_status", "official_actions"]),
    source("Texas Legislature Online vote-information guide", voteGuideUrl, ["voting_record_method", "roll_call_source_path"]),
    source("Official Texas Senate journal", senateJournalUrl, ["floor_actions", "roll_calls", "journal_record"]),
    source("Texas Ethics Commission campaign-finance search", financeTexasUrl, ["campaign_finance_source_path"]),
    source("Texas Secretary of State election-results archive", electionTexasUrl, ["term", "election_history", "party"]),
    source("Texas Constitution, Article III", texasArticle3Url, ["constitutional_authority", "office_structure", "term_length"]),
    ...retained.map((item) => ({ ...item, accessedAt: REVIEWED_AT, supports: item.supports?.length ? item.supports : ["context"] })),
    source("Texas Tribune portrait-publisher terms", tribuneTermsUrl, ["portrait_provenance", "rights_recheck"]),
  ]);
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.nextElection ??= profile.termEnd?.startsWith("2028") ? "2028 general election" : "Pending authoritative election-cycle match";
  profile.bio = `${profile.name} currently represents Texas Senate District ${district}. The official Senate roster and member page verify the assignment and ${profile.committeeAssignments?.length ? `list ${profile.committeeAssignments.slice(0, 3).join(", ")}${profile.committeeAssignments.length > 3 ? ", and additional committees" : ""}` : "show no current standing committee assignment"}. RepWatchr links the official bill-author report, vote guide, and Senate journal; findings publish only after record-level review.`;
  profile.accountabilityNotes = evidenceNotes("Legislative");
  addEvidenceDisclosures(profile, {
    type: "legislative",
    session: "89th Legislature",
    status: "source_path_only",
    billsByAuthorUrl: billUrl,
    voteInformationUrl: voteGuideUrl,
    journalUrl: senateJournalUrl,
    financeSourceUrl: financeTexasUrl,
    note: "Official paths support review; RepWatchr has not converted source availability into an uncited score.",
  });
  const portraitNote = profile.fieldFreshness?.portrait?.note ?? "Stored portrait passed the minimum-dimension gate.";
  profile.fieldFreshness = {
    identity: freshness("current", senateRosterUrl), portrait: freshness("current", profile.photoSourceUrl, portraitNote),
    contact: freshness("current", memberUrl), term: freshness("current", electionTexasUrl),
    assignments: freshness("current", memberUrl), legislation: freshness("source_path_only", billUrl, "Individual bills require record-level review."),
    votingRecord: freshness("source_path_only", senateJournalUrl, "Journal-level roll-call review remains pending."),
    campaignFinance: freshness("pending_review", financeTexasUrl, "Filer and reporting period are not matched."),
    positiveWork: freshness("pending_review", memberUrl), criticism: freshness("pending_review", memberUrl),
    sentiment: freshness("pending_review", memberUrl), constitutionalAlignment: freshness("pending_review", texasArticle3Url),
  };
  write(relative, profile);
  console.log(`Updated Senate SD-${district}: ${profile.name}`);
}

const sboeMeta = {
  1: { committees: ["Committee on Instruction — Member"] },
  2: { committees: ["Committee on School Initiatives — Chair", "Ad Hoc Committee on Mathematics — Chair"] },
  3: { committees: ["Committee on School Finance/Permanent School Fund — Vice Chair", "Ad Hoc Committee on Social Studies — Member"] },
  5: { committees: ["Committee on Instruction — Member"] },
  6: { committees: ["Committee on School Finance/Permanent School Fund — Member"] },
  7: { committees: ["Committee on School Initiatives — Vice Chair", "Ad Hoc Committee on Social Studies — Member"] },
  8: { committees: ["Committee on Instruction — Chair", "Ad Hoc Committee on Social Studies — Member"] },
  9: { committees: ["Committee on School Finance/Permanent School Fund — Member", "Ad Hoc Committee on Mathematics — Member"] },
  10: { committees: ["Committee on School Finance/Permanent School Fund — Chair", "Ad Hoc Committee on Mathematics — Member"] },
  13: { committees: ["Committee on School Initiatives — Member"] },
  15: { committees: ["Committee on School Finance/Permanent School Fund — Member", "Ad Hoc Committee on Social Studies — Chair"] },
};
const sboeRosterUrl = "https://sboe.texas.gov/state-board-of-education/sboe-board-members/sboe-members";
const sboeAgendaUrl = "https://sboe.texas.gov/state-board-of-education/meetings/meeting-agenda-current";
const sboeCalendarUrl = "https://sboe.texas.gov/state-board-of-education/meetings/sboe-meetings";
const sboe2026Url = "https://sboe.texas.gov/state-board-of-education/sboe-2026";
const sboeRulesUrl = "https://sboe.texas.gov/state-board-of-education/sboe-operating-rules";
const educationCodeUrl = "https://statutes.capitol.texas.gov/Docs/ED/htm/ED.7.htm";
const texasArticle7Url = "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.7.htm";
const sboeImageDir = path.join(ROOT, "public/images/officials/texas-accountability");
fs.mkdirSync(sboeImageDir, { recursive: true });

async function storeSboePortrait(profile) {
  const originalUrl = profile.photo;
  if (!originalUrl?.startsWith("http")) throw new Error(`${profile.id}: expected remote portrait before storage`);
  const response = await fetch(originalUrl, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`${profile.id}: portrait fetch ${response.status}`);
  const temp = path.join(os.tmpdir(), `${profile.id}-${Date.now()}`);
  fs.writeFileSync(temp, Buffer.from(await response.arrayBuffer()));
  const destination = path.join(sboeImageDir, `${profile.id}.jpg`);
  execFileSync("convert", [temp, "-auto-orient", "-resize", "1000x1000>", "-strip", "-quality", "82", destination]);
  fs.unlinkSync(temp);
  const [width, height] = execFileSync("identify", ["-format", "%w %h", destination], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
  if (Math.min(width, height) < 500) throw new Error(`${profile.id}: portrait below 500px (${width}x${height})`);
  return { originalUrl, width, height, publicPath: `/images/officials/texas-accountability/${profile.id}.jpg` };
}

for (const district of Object.keys(sboeMeta).map(Number)) {
  const relative = `src/data/officials/statewide/tx/tx-sboe-d${district}-${({1:"gustavo-reveles",2:"lj-francis",3:"marisa-b-perez-diaz",5:"rebecca-bell-metereau",6:"will-hickman",7:"julie-pickren",8:"audrey-young",9:"keven-ellis",10:"tom-maynard",13:"tiffany-clark",15:"aaron-kinsey"})[district]}.json`;
  const profile = read(relative);
  const memberUrl = `https://sboe.texas.gov/state-board-of-education/sboe-board-members/sboe-member-district-${district}`;
  if (profile.district !== `SBOE District ${district}`) throw new Error(`SBOE identity mismatch: ${relative}`);
  const portrait = await storeSboePortrait(profile);
  profile.photo = portrait.publicPath;
  profile.photoSourceUrl = portrait.originalUrl;
  profile.photoCredit = "Texas Tribune elected-officials directory portrait; identity cross-checked against the official SBOE member page.";
  profile.photoRights = "Stored with Texas Tribune attribution and site-terms provenance; reuse rights should be rechecked before redistribution outside RepWatchr.";
  profile.committeeAssignments = sboeMeta[district].committees;
  profile.nextElection = profile.termEnd?.startsWith("2027") ? "2026 general election" : "2028 general election";
  profile.contactInfo = { ...profile.contactInfo, phone: "512-463-9007", website: memberUrl };
  const tribunePage = profile.sourceLinks?.find((item) => item.title?.includes("Texas Tribune"))?.url;
  profile.sourceLinks = uniqueSources([
    source("Official SBOE member biography, term, committee, and contact", memberUrl, ["identity", "current_office", "district", "term", "committees", "contact", "biography"]),
    source("Official current SBOE member roster", sboeRosterUrl, ["current_office", "district", "party"]),
    source("Official current SBOE meeting agenda", sboeAgendaUrl, ["board_actions", "agenda", "public_record"]),
    source("Official SBOE meeting calendar", sboeCalendarUrl, ["meeting_schedule", "public_participation"]),
    source("Official 2026 SBOE meeting archive", sboe2026Url, ["minutes", "votes", "committee_actions", "board_actions"]),
    source("SBOE operating rules", sboeRulesUrl, ["board_procedure", "public_testimony", "voting_method"]),
    source("Texas Education Code, Chapter 7", educationCodeUrl, ["statutory_authority", "board_duties"]),
    source("Texas Constitution, Article VII", texasArticle7Url, ["constitutional_authority", "education_structure"]),
    source("Texas Secretary of State election-results archive", electionTexasUrl, ["term", "election_history", "party"]),
    source("Texas Ethics Commission campaign-finance search", financeTexasUrl, ["campaign_finance_source_path"]),
    ...(tribunePage ? [source("Texas Tribune elected-official directory", tribunePage, ["portrait", "party", "biography_context"])] : []),
    source("Published portrait asset", portrait.originalUrl, ["portrait", "portrait_provenance"]),
    source("Texas Tribune portrait-publisher terms", tribuneTermsUrl, ["portrait_provenance", "rights_recheck"]),
  ]);
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.reviewStatus = "source_seeded";
  profile.bio = `${profile.name} currently represents Texas State Board of Education District ${district}. The official member page verifies the term and lists ${profile.committeeAssignments.join("; ")}. RepWatchr treats agendas, minutes, committee records, and board votes as the role-compatible accountability record and does not substitute legislative roll calls for board work.`;
  profile.accountabilityNotes = evidenceNotes("Board-decision");
  addEvidenceDisclosures(profile, {
    type: "education_board",
    status: "source_path_only",
    agendaUrl: sboeAgendaUrl,
    meetingArchiveUrl: sboe2026Url,
    operatingRulesUrl: sboeRulesUrl,
    financeSourceUrl: financeTexasUrl,
    note: "Board agendas, minutes, committee records, and votes are linked for item-level review; no uncited performance score is inferred.",
  });
  profile.fieldFreshness = {
    identity: freshness("current", memberUrl), portrait: freshness("current", portrait.originalUrl, `Stored publisher portrait; verified at ${portrait.width} by ${portrait.height} pixels.`),
    contact: freshness("current", memberUrl), term: freshness("current", memberUrl), assignments: freshness("current", memberUrl),
    legislation: freshness("not_applicable", educationCodeUrl, "Sponsored legislation is not a function of this board office."),
    votingRecord: freshness("source_path_only", sboe2026Url, "Board minutes and action records require item-level editorial review."),
    officialRecord: freshness("source_path_only", sboe2026Url, "Agendas, minutes, and committee actions are linked."),
    campaignFinance: freshness("pending_review", financeTexasUrl, "Filer identity and reporting period are not matched."),
    positiveWork: freshness("pending_review", memberUrl), criticism: freshness("pending_review", memberUrl),
    sentiment: freshness("pending_review", memberUrl), constitutionalAlignment: freshness("pending_review", texasArticle7Url),
  };
  write(relative, profile);
  console.log(`Updated SBOE D-${district}: ${profile.name} (${portrait.width}x${portrait.height})`);
}

const federalProfiles = [
  { file: "src/data/officials/federal/us-house-tx1.json", chamber: "house", committees: ["Committee on Ethics", "Committee on Ways and Means", "Select Committee on the Strategic Competition Between the United States and the Chinese Communist Party"], committeeUrl: "https://clerk.house.gov/members/M001224", nextElection: "2026 general election" },
  { file: "src/data/officials/federal/us-house-tx12.json", chamber: "house", committees: ["Committee on Energy and Commerce"], committeeUrl: "https://clerk.house.gov/members/G000601", nextElection: "2026 general election" },
  { file: "src/data/officials/federal/us-house-tx18.json", chamber: "house", committees: ["Committee on Oversight and Government Reform", "Committee on Science, Space, and Technology"], committeeUrl: "https://clerk.house.gov/members/M001245", nextElection: "2026 general election" },
  { file: "src/data/officials/federal/us-senate-tx-cornyn.json", chamber: "senate", committees: ["Committee on Finance", "Committee on the Judiciary", "Select Committee on Intelligence", "Committee on Foreign Relations", "Committee on the Budget"], committeeUrl: "https://www.cornyn.senate.gov/about/committee-assignments/", nextElection: "2026 general election" },
  { file: "src/data/officials/federal/us-senate-tx-cruz.json", chamber: "senate", committees: ["Committee on Commerce, Science, and Transportation — Chair", "Committee on Foreign Relations", "Committee on the Judiciary", "Committee on Rules and Administration"], committeeUrl: "https://www.cruz.senate.gov/about/committee-assignments", nextElection: "2030 general election" },
];
for (const item of federalProfiles) {
  const profile = read(item.file);
  const bioguideUrl = `https://bioguide.congress.gov/search/bio/${profile.bioguideId}`;
  const congressMemberUrl = `https://www.congress.gov/member/${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${profile.bioguideId}`;
  const legislationUrl = `https://www.congress.gov/member/${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${profile.bioguideId}?q=%7B%22sponsorship%22%3A%22sponsored%22%7D`;
  const rollCallUrl = item.chamber === "house" ? "https://clerk.house.gov/Votes" : "https://www.senate.gov/legislative/votes_new.htm";
  const journalUrl = item.chamber === "house" ? "https://clerk.house.gov/MemberInfo" : "https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_119_2.htm";
  const officialUrl = profile.contactInfo.website;
  const portraitRightsUrl = profile.photoSourceUrl?.includes("commons.wikimedia.org") ? profile.photoSourceUrl : officialUrl;
  profile.committeeAssignments = item.committees;
  profile.nextElection = item.nextElection;
  profile.sourceLinks = uniqueSources([
    source(item.chamber === "house" ? "Official House Clerk member profile" : "Official U.S. Senate member website", item.chamber === "house" ? item.committeeUrl : officialUrl, ["identity", "current_office", "district", "contact", "committees"]),
    source("Official member website", officialUrl, ["contact", "biography", "constituent_service"]),
    source("Official committee assignments", item.committeeUrl, ["committees", "leadership"]),
    source("Congress.gov member profile", congressMemberUrl, ["identity", "legislative_activity"]),
    source("Congress.gov sponsored legislation", legislationUrl, ["sponsored_legislation", "bill_status", "official_actions"]),
    source(item.chamber === "house" ? "Official House roll-call votes" : "Official Senate roll-call votes", rollCallUrl, ["roll_calls", "voting_record"]),
    source(item.chamber === "house" ? "House Clerk member and legislative records" : "Official 119th Congress Senate vote menu", journalUrl, ["official_actions", "voting_record_method"]),
    source("Federal Election Commission candidate data", federalFinanceUrl, ["campaign_finance_source_path", "reporting_periods"]),
    source("Texas Secretary of State election-results archive", electionTexasUrl, ["election_history", "term"]),
    source("Constitution Annotated, Article I", federalConstitutionUrl, ["constitutional_authority", "office_structure", "term_length"]),
    source("Biographical Directory of the United States Congress", bioguideUrl, ["identity", "biography", "service_history"]),
    source("Published portrait source", profile.photoSourceUrl, ["portrait", "portrait_provenance"]),
    source("Portrait rights/provenance page", portraitRightsUrl, ["portrait_rights", "rights_recheck"]),
  ]);
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.reviewStatus = "source_seeded";
  profile.photoRights ??= "Official or public-domain congressional portrait; source provenance retained.";
  profile.bio = `${profile.name} currently serves as ${profile.position}${profile.district?.startsWith("TX-") ? ` for ${profile.district}` : " for Texas"}. The official congressional record verifies the assignment and lists ${profile.committeeAssignments.join("; ")}. RepWatchr links sponsored-legislation and roll-call paths below; findings remain unrated until cited actions are reviewed in context.`;
  profile.accountabilityNotes = evidenceNotes("Congressional");
  addEvidenceDisclosures(profile, {
    type: "federal_legislative",
    congress: "119th Congress, 2nd Session",
    status: "source_path_only",
    sponsoredLegislationUrl: legislationUrl,
    rollCallUrl,
    financeSourceUrl: federalFinanceUrl,
    note: "Official legislative and vote paths support record-level review; no uncited score is inferred.",
  });
  const portraitNote = profile.photo?.startsWith("/") ? "Stored portrait passed the 500-pixel minimum-dimension gate." : "Portrait storage requires review.";
  profile.fieldFreshness = {
    identity: freshness("current", item.chamber === "house" ? item.committeeUrl : officialUrl),
    portrait: freshness("current", profile.photoSourceUrl, portraitNote), contact: freshness("current", officialUrl),
    term: freshness("current", item.chamber === "house" ? item.committeeUrl : bioguideUrl), assignments: freshness("current", item.committeeUrl),
    legislation: freshness("source_path_only", legislationUrl, "Individual measures require record-level review."),
    votingRecord: freshness("source_path_only", rollCallUrl, "Roll calls require vote-level context review."),
    campaignFinance: freshness("pending_review", federalFinanceUrl, "Candidate identity and reporting period are not matched to published totals."),
    positiveWork: freshness("pending_review", officialUrl), criticism: freshness("pending_review", officialUrl),
    sentiment: freshness("pending_review", officialUrl), constitutionalAlignment: freshness("pending_review", federalConstitutionUrl),
  };
  write(item.file, profile);
  console.log(`Updated federal profile: ${profile.name}`);
}

const countyFile = "src/data/officials/county/marion-county/county-judge.json";
const county = read(countyFile);
const countyOfficialUrl = "https://www.co.marion.tx.us/page/marion.County.Judge";
const countyAgendaUrl = "https://www.co.marion.tx.us/page/marion.Commissioners.Court";
const countyElectionUrl = "https://marioncountytaxoffice.com/elections/";
const countyCourtUrl = "https://www.txcourts.gov/media/1460595/constitutional-county-courts.pdf";
county.sourceLinks = uniqueSources([
  source("Marion County official County Judge page", countyOfficialUrl, ["identity", "current_office", "contact", "duties"]),
  source("Marion County Commissioners Court records", countyAgendaUrl, ["agendas", "minutes", "county_actions", "budget_record"]),
  source("Marion County elections and campaign filings", countyElectionUrl, ["election_history", "campaign_finance_source_path"]),
  ...(county.sourceLinks ?? []).map((item) => ({ ...item, accessedAt: REVIEWED_AT, supports: item.supports?.length ? item.supports : ["context"] })),
  source("Texas OCA constitutional county-court directory", countyCourtUrl, ["judicial_role", "office_structure"]),
  source("Texas Constitution, Article V", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm", ["constitutional_authority", "office_structure"]),
]);
county.lastVerifiedAt = REVIEWED_AT;
county.nextElection = "2026 general election";
county.photoRights ??= "Official campaign-published portrait; source provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.";
county.committeeAssignments = ["Marion County Commissioners Court — Presiding officer"];
county.accountabilityNotes = evidenceNotes("County-governance and constitutional-court");
addEvidenceDisclosures(county, {
  type: "county_governance_and_constitutional_court",
  status: "source_path_only",
  commissionersCourtUrl: countyAgendaUrl,
  constitutionalCourtDirectoryUrl: countyCourtUrl,
  financeSourceUrl: countyElectionUrl,
  note: "Commissioners Court agendas, minutes, budgets, emergency actions, and role-compatible court records require item-level review.",
});
county.fieldFreshness = {
  identity: freshness("current", countyOfficialUrl), portrait: freshness("current", county.photoSourceUrl, "Stored 2700 by 3420 pixel publisher portrait."),
  contact: freshness("current", countyOfficialUrl), term: freshness("current", countyElectionUrl),
  assignments: freshness("current", countyAgendaUrl), legislation: freshness("not_applicable", countyAgendaUrl, "Sponsored legislation is not a function of this county office."),
  votingRecord: freshness("source_path_only", countyAgendaUrl, "Commissioners Court actions require item-level review."),
  officialRecord: freshness("source_path_only", countyAgendaUrl), campaignFinance: freshness("pending_review", countyElectionUrl, "Local filer and reporting period are not matched."),
  positiveWork: freshness("pending_review", countyOfficialUrl), criticism: freshness("reported_disputed", county.sourceLinks.find((item) => item.url.includes("kltv.com"))?.url ?? countyOfficialUrl, "Existing profile text labels the reported allegations disputed and procedurally unresolved."),
  sentiment: freshness("pending_review", countyOfficialUrl), constitutionalAlignment: freshness("pending_review", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm"),
};
write(countyFile, county);
console.log(`Updated county profile: ${county.name}`);

for (const district of [1, 4, 5]) {
  const relative = `src/data/officials/state/tx-house-hd${district}.json`;
  const profile = read(relative);
  const memberUrl = profile.contactInfo.website;
  const billUrl = profile.fieldFreshness.legislation.sourceUrl;
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.bio = `${profile.name} currently represents Texas House District ${district}. The official House member page verifies the assignment and lists ${profile.committeeAssignments.join("; ")}. RepWatchr links the official authored-bill, sponsored-bill, and vote-information paths; findings publish only after the cited action and context pass editorial review.`;
  profile.accountabilityNotes = evidenceNotes("Legislative");
  addEvidenceDisclosures(profile, {
    type: "legislative",
    session: "89th Legislature",
    status: "source_path_only",
    billsByAuthorUrl: billUrl,
    voteInformationUrl: voteGuideUrl,
    financeSourceUrl: financeTexasUrl,
    note: "Official bill and vote paths support record-level review; no uncited score is inferred.",
  });
  profile.sourceLinks = uniqueSources((profile.sourceLinks ?? []).map((item) => ({ ...item, accessedAt: REVIEWED_AT, supports: item.supports?.length ? item.supports : ["context"] })));
  for (const value of Object.values(profile.fieldFreshness ?? {})) value.reviewedAt = REVIEWED_AT;
  profile.fieldFreshness.officialRecord = freshness("source_path_only", billUrl, "Individual bills and votes require record-level review.");
  write(relative, profile);
  console.log(`Deepened House HD-${district}: ${profile.name}`);
}

console.log("Updated 25 Texas elected-official profiles.");
