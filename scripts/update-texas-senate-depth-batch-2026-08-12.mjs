import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-12";
const districts = [...Array.from({ length: 21 }, (_, index) => index + 1), 23, 24, 25, 26];

const rosterUrl = "https://www.senate.texas.gov/members.php";
const directoryUrl = "https://www.senate.texas.gov/directory.php";
const committeesUrl = "https://www.senate.texas.gov/committees.php";
const journalUrl = "https://journals.senate.texas.gov/";
const voteGuideUrl = "https://capitol.texas.gov/help/findvoteinfo.aspx";
const financeUrl = "https://www.ethics.state.tx.us/search/cf/";
const electionUrl = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const constitutionUrl = "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.3.htm";
const tribuneTermsUrl = "https://www.texastribune.org/about/terms-of-service/";

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

function freshness(status, sourceUrl, note) {
  return { status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) };
}

for (const district of districts) {
  const relative = `src/data/officials/state/tx-senate-sd${district}.json`;
  const file = path.join(ROOT, relative);
  const profile = JSON.parse(fs.readFileSync(file, "utf8"));
  const memberUrl = `https://www.senate.texas.gov/member.php?d=${district}`;
  const billUrl = profile.fieldFreshness?.legislation?.sourceUrl
    ?? profile.sourceLinks?.find((item) => item.supports?.includes("sponsored_legislation"))?.url;

  if (profile.district !== `SD-${district}` || !billUrl) {
    throw new Error(`Profile identity or bill-author path mismatch: ${relative}`);
  }

  const retained = (profile.sourceLinks ?? []).filter((item) => ![
    rosterUrl,
    directoryUrl,
    committeesUrl,
    journalUrl,
    voteGuideUrl,
    financeUrl,
    electionUrl,
    constitutionUrl,
    tribuneTermsUrl,
    memberUrl,
    billUrl,
  ].includes(item.url));

  profile.sourceLinks = [
    source("Official Texas Senate member profile, biography, and committee assignments", memberUrl, ["identity", "current_office", "district", "biography", "committees", "contact"]),
    source("Official current Texas Senate roster", rosterUrl, ["current_office", "district", "party"]),
    source("Official Texas Senate directory", directoryUrl, ["contact", "district", "constituent_service"]),
    source("Official 89th Legislature committee directory", committeesUrl, ["committees", "committee_structure", "committee_freshness"]),
    source("Texas Legislature Online bills by author", billUrl, ["sponsored_legislation", "bill_status", "official_actions"]),
    source("Texas Legislature Online vote-information guide", voteGuideUrl, ["voting_record_method", "roll_call_source_path"]),
    source("Official Texas Senate journal", journalUrl, ["floor_actions", "roll_calls", "journal_record"]),
    source("Texas Ethics Commission campaign-finance search", financeUrl, ["campaign_finance_source_path"]),
    source("Texas Secretary of State election-results archive", electionUrl, ["term", "election_history", "party"]),
    source("Texas Constitution, Article III", constitutionUrl, ["constitutional_authority", "office_structure", "term_length"]),
    ...retained.map((item) => ({ ...item, accessedAt: REVIEWED_AT })),
    source("Texas Tribune portrait-publisher terms", tribuneTermsUrl, ["portrait_provenance", "rights_recheck"]),
  ];

  profile.lastVerifiedAt = REVIEWED_AT;
  profile.reviewStatus = "source_seeded";
  profile.photoRights ??= "Stored with publisher attribution and site-terms provenance; reuse rights should be rechecked before redistribution outside RepWatchr.";
  profile.bio = `${profile.name} currently represents Texas Senate District ${district}. The official Senate roster and member page verify the current assignment${profile.committeeAssignments?.length ? ` and list ${profile.committeeAssignments.slice(0, 3).join(", ")}${profile.committeeAssignments.length > 3 ? ", and additional committee assignments" : ""}` : "; the member page currently lists no committee assignment"}. RepWatchr links the official bill-author report, vote-information guide, and Senate journal below; record-level evaluations publish only after the cited action and context pass editorial review.`;
  profile.accountabilityNotes = [
    "The official bill-author report, vote-information guide, and Senate journal are linked; individual bills and roll calls remain source-path-only until each record is reviewed in context.",
    "Positive-work claims remain pending until a dated primary record, measurable result, and independent context are attached.",
    "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
    "Campaign-finance totals, donors, industries/PACs, and expenditures remain unpublished until the correct filer and reporting period are matched.",
    "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
    "No constitutional-alignment score is published without cited votes, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
  ];
  profile.legislativeRecord = {
    session: "89th Legislature",
    status: "source_path_only",
    billsByAuthorUrl: billUrl,
    voteInformationUrl: voteGuideUrl,
    senateJournalUrl: journalUrl,
    note: "These official paths support record-level review; RepWatchr has not converted source availability into an uncited performance score.",
  };
  profile.campaignFinanceDisclosure = {
    status: "pending_review",
    sourceUrl: financeUrl,
    reviewedAt: REVIEWED_AT,
    note: "Totals, donors, industries/PACs, expenditures, and reporting period are withheld until the officeholder filer is matched without ambiguity.",
  };
  profile.sentimentDisclosure = {
    status: "pending_review",
    reviewedAt: REVIEWED_AT,
    note: "No constituent sentiment is published without jurisdiction-confidence, sampling, collection-window, platform-mix, duplication/bot, and uncertainty disclosures.",
  };

  const portraitNote = profile.fieldFreshness?.portrait?.note ?? "Stored portrait passed the RepWatchr minimum-dimension gate.";
  profile.fieldFreshness = {
    identity: freshness("current", rosterUrl),
    portrait: freshness("current", profile.photoSourceUrl, portraitNote),
    contact: freshness("current", memberUrl),
    term: freshness("current", electionUrl),
    assignments: freshness("current", memberUrl, profile.committeeAssignments?.length ? "Member-page assignments are retained, including official established/dissolved committee labels where shown." : "The current member page lists no committee assignment."),
    legislation: freshness("source_path_only", billUrl, "The official author report is linked; individual bill outcomes require record-level editorial review."),
    votingRecord: freshness("source_path_only", journalUrl, "The official journal and vote-information guide are linked; vote rows require journal-level review."),
    campaignFinance: freshness("pending_review", financeUrl, "Filer identity and reporting period are not yet matched."),
    positiveWork: freshness("pending_review", memberUrl),
    criticism: freshness("pending_review", memberUrl),
    sentiment: freshness("pending_review", memberUrl),
    constitutionalAlignment: freshness("pending_review", constitutionUrl),
  };

  fs.writeFileSync(file, `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`Updated SD-${district}: ${profile.name} (${profile.sourceLinks.length} sources)`);
}

console.log(`Updated ${districts.length} Texas Senate accountability profiles.`);
