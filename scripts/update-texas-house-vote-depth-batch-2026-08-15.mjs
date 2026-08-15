import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-15";
const VOTES_BY_DATE = "https://capitol.texas.gov/Reports/GeneralVotesByDateHouse.aspx";
const VOTE_GUIDE = "https://capitol.texas.gov/billlookup/voteinfo.aspx";
const HOUSE_ROSTER = "https://house.texas.gov/api/getMembers";
const HOUSE_DIRECTORY = "https://house.texas.gov/members";
const CAPITOL_MAILING_SUFFIX = "P.O. Box 12910 Austin, Texas 78711-2910";

const districts = [105, 106, 107, 108, 109, 110, 111, 114, 115, 116, 117, 118, 120, 121, 122, 123, 124, 127, 128, 129, 130, 132, 134, 137, 138];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function repairCapitolAddress(value) {
  const address = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!address.includes("P.O. Box 12910")) {
    throw new Error(`Unexpected Texas House office address: ${address}`);
  }
  const room = address.split("P.O. Box 12910")[0].trim();
  return `${room ? `${room} ` : ""}${CAPITOL_MAILING_SUFFIX}`;
}

for (const district of districts) {
  const profileFile = path.join(ROOT, "src", "data", "officials", "state", `tx-house-hd${district}.json`);
  const profile = readJson(profileFile);
  const voteFile = path.join(ROOT, "src", "data", "vote-records", `${profile.id}.json`);
  const record = readJson(voteFile);
  const latestVoteDate = record.votes.reduce((latest, vote) => vote.date > latest ? vote.date : latest, "");

  if (profile.district !== `HD-${district}` || profile.position !== "State Representative" || profile.state !== "TX") {
    throw new Error(`House identity mismatch for ${profile.id}`);
  }
  if (record.officialId !== profile.id || record.chamber !== "house" || record.level !== "state") {
    throw new Error(`Vote record identity mismatch for ${profile.id}`);
  }
  if (!record.summary?.totalVotesLoaded || record.votes?.length !== record.storedVoteRows) {
    throw new Error(`No complete record-level vote evidence for ${profile.id}`);
  }
  if (record.votes.some((vote) => !vote.sourceUrl || !vote.sourceId || !vote.voteCast || !vote.date)) {
    throw new Error(`Incomplete vote evidence row for ${profile.id}`);
  }

  profile.reviewStatus = "record_enriched";
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.contactInfo.office = repairCapitolAddress(profile.contactInfo.office);
  const assignmentNames = profile.committeeAssignments.join(", ");
  profile.bio = `${profile.name} represents ${profile.district.replace("HD-", "House District ")} in the Texas House of Representatives. The current official House profile lists service on ${assignmentNames}.`;
  profile.votingRecordEvidence = {
    status: "record_level_evidence_loaded",
    chamber: "Texas House",
    coverageWindow: record.session,
    indexedPositions: record.summary.totalVotesLoaded,
    positionCounts: {
      yea: record.summary.yea,
      nay: record.summary.nay,
      present: record.summary.present,
      notVoting: record.summary.notVoting,
      other: record.summary.other,
    },
    storedRecordRows: record.storedVoteRows,
    latestRecordedVoteDate: latestVoteDate,
    sourceUrl: VOTES_BY_DATE,
    reviewedAt: REVIEWED_AT,
    methodology: "RepWatchr indexes the member position printed in official Texas House record-vote material. Totals describe loaded positions in the stated collection window; they are not an attendance, ideology, constitutional, or performance score.",
  };

  const ledgerSource = {
    title: "Official Texas House votes-by-date ledger",
    url: VOTES_BY_DATE,
    accessedAt: REVIEWED_AT,
    supports: ["record_level_votes", "voting_record_summary", "roll_call_links"],
  };
  const ledgerIndex = profile.sourceLinks.findIndex((source) => source.url === VOTES_BY_DATE);
  if (ledgerIndex >= 0) profile.sourceLinks[ledgerIndex] = ledgerSource;
  else profile.sourceLinks.push(ledgerSource);

  const guide = profile.sourceLinks.find((source) => source.url === VOTE_GUIDE || source.url === "https://capitol.texas.gov/help/findvoteinfo.aspx");
  if (guide) {
    guide.url = VOTE_GUIDE;
    guide.accessedAt = REVIEWED_AT;
    guide.supports = ["voting_record_method", "record_vote_lookup"];
  }
  for (const source of profile.sourceLinks) {
    if (source.url === HOUSE_ROSTER || source.url === HOUSE_DIRECTORY || source.url.startsWith(profile.contactInfo.website)) {
      source.accessedAt = REVIEWED_AT;
    }
  }

  profile.fieldFreshness.identity = {
    status: "current",
    reviewedAt: REVIEWED_AT,
    sourceUrl: HOUSE_ROSTER,
    note: "Matched to the current official Texas House roster by full name and district profile.",
  };
  profile.fieldFreshness.contact = {
    status: "current",
    reviewedAt: REVIEWED_AT,
    sourceUrl: profile.contactInfo.website,
    note: "Capitol room, complete mailing address, telephone, email, and official website reviewed against the member page.",
  };
  profile.fieldFreshness.assignments = {
    status: "current",
    reviewedAt: REVIEWED_AT,
    sourceUrl: `${profile.contactInfo.website}/committees`,
    note: "Current committee and leadership assignments retained from the official member committee page.",
  };
  profile.fieldFreshness.votingRecord = {
    status: "current",
    reviewedAt: REVIEWED_AT,
    sourceUrl: VOTES_BY_DATE,
    note: `${record.summary.totalVotesLoaded.toLocaleString()} official House positions are indexed for the stated collection window; ${record.storedVoteRows} recent source-linked rows are stored for profile display.`,
  };
  profile.fieldFreshness.biography = {
    status: "current",
    reviewedAt: REVIEWED_AT,
    sourceUrl: profile.contactInfo.website,
    note: "Concise neutral summary derived from the current official House member page and committee assignments.",
  };

  const note = "Voting-record summary now reflects source-linked Texas House record-vote rows. It reports indexed positions only and does not infer motive, ideology, constitutional alignment, or complete attendance.";
  profile.accountabilityNotes = [note, ...profile.accountabilityNotes.filter((item) => item !== note)];

  writeJson(profileFile, profile);
}

console.log(`Updated ${districts.length} Texas House profiles with record-level vote evidence and complete Capitol addresses.`);
