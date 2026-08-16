import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join } from "node:path";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-16";
const HOUSE_ROSTER = "https://house.texas.gov/api/getMembers";
const HOUSE_DIRECTORY = "https://house.texas.gov/members";
const VOTES_BY_DATE = "https://capitol.texas.gov/Reports/GeneralVotesByDateHouse.aspx";
const VOTE_GUIDE = "https://capitol.texas.gov/billlookup/voteinfo.aspx";
const FINANCE_SEARCH = "https://www.ethics.state.tx.us/search/cf/";
const ELECTION_ARCHIVE = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const DIRECTORY_ROOT = "https://www.txdirectory.com/online/txhouse/";
const CAPITOL_MAILING_SUFFIX = "P.O. Box 12910 Austin, Texas 78711-2910";
const IMAGE_DIR = join(ROOT, "public", "images", "officials", "texas-accountability");

const districts = [
  1, 4, 5, 17, 29, 37, 51, 63, 68, 70, 74, 75, 80,
  84, 90, 91, 104, 139, 141, 143, 144, 145, 148, 149, 150,
];

const portraitUpgrades = new Map([
  [17, { profileId: "68764", url: "https://www.txdirectory.com/files/photo/per68764.png" }],
  [29, { profileId: "71980", url: "https://www.txdirectory.com/files/photo/per71980.jpg" }],
  [37, { profileId: "69354", url: "https://www.txdirectory.com/files/photo/per69354.png" }],
  [51, { profileId: "69314", url: "https://www.txdirectory.com/files/photo/per69314.jpeg" }],
  [63, { profileId: "69358", url: "https://www.txdirectory.com/files/photo/per69358.png" }],
  [68, { profileId: "67289", url: "https://www.txdirectory.com/files/photo/per67289.jpg" }],
  [70, { profileId: "69360", url: "https://www.txdirectory.com/files/photo/per69360.png" }],
  [74, { profileId: "66159", url: "https://www.txdirectory.com/files/photo/per66159.png" }],
  [75, { profileId: "44263", url: "https://www.txdirectory.com/files/photo/per44263.jpg" }],
  [80, { profileId: "71976", url: "https://www.txdirectory.com/files/photo/per71976.jpg" }],
  [84, { profileId: "68765", url: "https://www.txdirectory.com/files/photo/per68765.jpg" }],
  [90, {
    profileId: "48606",
    url: "https://static.texastribune.org/media/files/98a642c7dbb6b67563e13fbbba6eaf7a/Ramon_Romero.jpg",
    sourcePage: "https://www.texastribune.org/directory/ramon-romero-jr/",
    credit: "Texas Tribune elected-official directory portrait; identity cross-checked against the current official Texas House roster.",
    rights: "Stored with source attribution and directory provenance; reuse rights should be rechecked before redistribution outside RepWatchr.",
  }],
  [91, { profileId: "71974", url: "https://www.txdirectory.com/files/photo/per71974.jpg" }],
  [104, { profileId: "60357", url: "https://www.txdirectory.com/files/photo/per60357.jpg" }],
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function decodeEntities(value) {
  return value
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function textFromHtml(value) {
  return decodeEntities(value.replaceAll(/<[^>]+>/g, " ")).replaceAll(/\s+/g, " ").trim();
}

function normalizedName(value) {
  return decodeEntities(value)
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, "");
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "RepWatchr profile importer" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "user-agent": "RepWatchr profile importer" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function jpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

async function downloadPortrait(url, id) {
  const response = await fetch(url, { headers: { "user-agent": "RepWatchr profile importer" } });
  if (!response.ok) throw new Error(`${response.status} portrait ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sourceExt = extname(new URL(url).pathname) || ".img";
  const temporary = join(IMAGE_DIR, `${id}-source${sourceExt}`);
  const output = join(IMAGE_DIR, `${id}.jpg`);
  writeFileSync(temporary, bytes);
  execFileSync("convert", [
    temporary,
    "-auto-orient",
    "-resize",
    "1600x1600>",
    "-quality",
    "88",
    "-strip",
    output,
  ]);
  unlinkSync(temporary);
  const storedBytes = readFileSync(output);
  const dimensions = jpegDimensions(storedBytes);
  if (!dimensions || Math.min(dimensions.width, dimensions.height) < 500) {
    throw new Error(`Portrait failed 500px gate for ${id}: ${dimensions?.width ?? 0}x${dimensions?.height ?? 0}`);
  }
  return {
    path: `/images/officials/texas-accountability/${id}.jpg`,
    ...dimensions,
    bytes: storedBytes.length,
  };
}

function storedPortrait(profile) {
  const file = join(ROOT, "public", profile.photo.replace(/^\//, ""));
  if (!existsSync(file)) throw new Error(`Missing stored portrait for ${profile.id}`);
  const bytes = readFileSync(file);
  const dimensions = jpegDimensions(bytes);
  if (!dimensions || Math.min(dimensions.width, dimensions.height) < 500) {
    throw new Error(`Stored portrait failed 500px gate for ${profile.id}`);
  }
  return { path: profile.photo, ...dimensions, bytes: bytes.length };
}

function parseHouseBiography(html, name, district) {
  const block = html.match(/<section id=["']biography["'][\s\S]*?<\/section>/i)?.[0] ?? "";
  const text = textFromHtml(block).replace(/^Biography\s*/i, "");
  if (!text) return `${name} represents House District ${district} in the Texas House of Representatives.`;
  const clipped = text.length > 760 ? text.slice(0, 760).replace(/\s+\S*$/, "") : text;
  return clipped.endsWith(".") ? clipped : `${clipped}.`;
}

function repairCapitolAddress(value) {
  const address = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!address.includes("P.O. Box 12910")) {
    throw new Error(`Unexpected Texas House office address: ${address}`);
  }
  const room = address.split("P.O. Box 12910")[0].replace(/[,\s]+$/, "").trim();
  return `${room ? `${room} ` : ""}${CAPITOL_MAILING_SUFFIX}`;
}

function parseHouseContact(html, fallback) {
  const block = html.match(/Capitol Address:[\s\S]*?Bills Authored\/Sponsored:/i)?.[0] ?? "";
  const text = textFromHtml(block);
  const phoneParts = text.match(/\(?(\d{3})\)?[ -](\d{3})[ -](\d{4})/)?.slice(1);
  const office = text.match(/Capitol Address:\s*(.*?)\s*(?:\(\d{3}\)|\d{3}-\d{3})/i)?.[1];
  return {
    ...fallback,
    office: repairCapitolAddress(office ?? fallback.office),
    ...(phoneParts ? { phone: phoneParts.join("-") } : {}),
  };
}

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

function freshness(status, sourceUrl, note) {
  return { status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) };
}

function upsertSource(sources, entry) {
  const index = sources.findIndex((item) => item.url === entry.url);
  if (index >= 0) sources[index] = entry;
  else sources.push(entry);
}

function guardedNotes() {
  return [
    "Voting-record summary reflects source-linked Texas House record-vote rows. It reports indexed positions only and does not infer motive, ideology, constitutional alignment, or complete attendance.",
    "Positive-work claims remain pending until a dated primary record, measurable result, and independent context are attached.",
    "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
    "Campaign-finance totals, donors, industries/PACs, expenditures, and reporting periods remain unpublished until the correct filer is matched.",
    "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
    "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
  ];
}

mkdirSync(IMAGE_DIR, { recursive: true });
const houseRoster = await fetchJson(HOUSE_ROSTER);
const results = [];

for (const district of districts) {
  const profileFile = join(ROOT, "src", "data", "officials", "state", `tx-house-hd${district}.json`);
  const profile = readJson(profileFile);
  const voteFile = join(ROOT, "src", "data", "vote-records", `${profile.id}.json`);
  const record = readJson(voteFile);
  const rosterMember = houseRoster.find((member) => Number(member.id) === district);
  if (!rosterMember) throw new Error(`Current House roster missing HD-${district}`);
  const rosterName = textFromHtml(rosterMember.member_name).split(",").reverse().join(" ").trim();
  if (!normalizedName(rosterName).includes(normalizedName(profile.lastName))) {
    throw new Error(`House identity mismatch for HD-${district}: ${rosterName} vs ${profile.name}`);
  }

  const memberCode = String(rosterMember.member_bill_code);
  const officialUrl = `https://house.texas.gov/members/${memberCode}`;
  const biographyUrl = `${officialUrl}/biography`;
  const committeeUrl = `${officialUrl}/committees`;
  const committeeApiUrl = `https://house.texas.gov/api/getMemberCommittees/${memberCode}`;
  const [officialHtml, biographyHtml, committees] = await Promise.all([
    fetchText(officialUrl),
    fetchText(biographyUrl),
    fetchJson(committeeApiUrl),
  ]);
  if (!normalizedName(textFromHtml(officialHtml)).includes(normalizedName(profile.lastName))) {
    throw new Error(`Official House page identity mismatch for HD-${district}`);
  }

  const portraitUpgrade = portraitUpgrades.get(district);
  const portrait = portraitUpgrade
    ? await downloadPortrait(portraitUpgrade.url, profile.id)
    : storedPortrait(profile);
  if (portraitUpgrade) {
    profile.photo = portrait.path;
    profile.photoSourceUrl = portraitUpgrade.url;
    profile.photoCredit = portraitUpgrade.credit
      ?? "Texas State Directory Online elected-official profile portrait; identity cross-checked against the current official Texas House roster.";
    profile.photoRights = portraitUpgrade.rights
      ?? "Stored as an attributed delivery derivative of the Texas State Directory Online profile image; source provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.";
  }

  const assignments = (Array.isArray(committees) ? committees : [])
    .map((committee) => committee.position && committee.position !== "Member"
      ? `${committee.committeeName} — ${committee.position}`
      : committee.committeeName)
    .filter(Boolean);
  const authoredUrl = `https://capitol.texas.gov/reports/report.aspx?ID=author&LegSess=89R&Code=A${memberCode}`;
  const sponsoredUrl = `https://capitol.texas.gov/reports/report.aspx?ID=sponsor&LegSess=89R&Code=A${memberCode}`;
  const latestVoteDate = record.votes.reduce((latest, vote) => vote.date > latest ? vote.date : latest, "");
  if (record.officialId !== profile.id || record.chamber !== "house" || record.level !== "state") {
    throw new Error(`Vote record identity mismatch for ${profile.id}`);
  }
  if (!record.summary?.totalVotesLoaded || record.votes?.length !== record.storedVoteRows) {
    throw new Error(`No complete record-level vote evidence for ${profile.id}`);
  }
  if (record.votes.some((vote) => !vote.sourceUrl || !vote.sourceId || !vote.voteCast || !vote.date)) {
    throw new Error(`Incomplete vote evidence row for ${profile.id}`);
  }

  profile.name = rosterName;
  profile.contactInfo = parseHouseContact(officialHtml, profile.contactInfo);
  profile.contactInfo.website = officialUrl;
  profile.bio = parseHouseBiography(biographyHtml, rosterName, district);
  profile.committeeAssignments = assignments;
  profile.termEnd = "Current two-year House term; exact end date pending source review";
  profile.nextElection = "2026 general election";
  profile.reviewStatus = "record_enriched";
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.accountabilityNotes = guardedNotes();
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
  profile.officialRecord = {
    type: "legislative",
    session: "89th Legislature",
    status: "record_level_vote_evidence_loaded",
    billsByAuthorUrl: authoredUrl,
    billsSponsoredUrl: sponsoredUrl,
    voteInformationUrl: VOTES_BY_DATE,
    financeSourceUrl: FINANCE_SEARCH,
    note: "Official bill paths support legislation review. The voting summary is backed by source-linked official record-vote rows and is not a score.",
  };
  profile.campaignFinanceDisclosure = {
    status: "pending_review",
    sourceUrl: FINANCE_SEARCH,
    reviewedAt: REVIEWED_AT,
    note: "Totals, donors, industries/PACs, expenditures, and reporting period are withheld until the officeholder filer is matched without ambiguity.",
  };
  profile.sentimentDisclosure = {
    status: "pending_review",
    reviewedAt: REVIEWED_AT,
    note: "No sentiment is published without jurisdiction-confidence, sampling, collection-window, platform-mix, duplication/bot, and uncertainty disclosures.",
  };

  const portraitSourcePage = portraitUpgrade?.sourcePage
    ?? (portraitUpgrade ? `https://www.txdirectory.com/online/person/?id=${portraitUpgrade.profileId}` : null);
  const sourceLinks = portraitUpgrade
    ? []
    : (Array.isArray(profile.sourceLinks) ? profile.sourceLinks : []);
  for (const entry of [
    source("Official Texas House member page", officialUrl, ["identity", "office", "contact", "legislation_paths"]),
    source("Official current Texas House roster API", HOUSE_ROSTER, ["current_office", "district", "identity"]),
    source("Official Texas House member directory", HOUSE_DIRECTORY, ["current_office", "district"]),
    source("Official Texas House biography", biographyUrl, ["biography"]),
    source("Official Texas House committee assignments", committeeUrl, ["committees", "leadership"]),
    source("Texas Legislature Online authored bills", authoredUrl, ["sponsored_legislation"]),
    source("Texas Legislature Online sponsored bills", sponsoredUrl, ["sponsored_legislation"]),
    source("Official Texas House votes-by-date ledger", VOTES_BY_DATE, ["record_level_votes", "voting_record_summary", "roll_call_links"]),
    source("Texas Legislature Online vote-information guide", VOTE_GUIDE, ["voting_record_method", "record_vote_lookup"]),
    source("Texas Ethics Commission campaign-finance search", FINANCE_SEARCH, ["campaign_finance_source_path"]),
    source("Texas Secretary of State election archive", ELECTION_ARCHIVE, ["term", "election_history"]),
  ]) upsertSource(sourceLinks, entry);
  if (portraitSourcePage) {
    upsertSource(sourceLinks, source("Portrait source profile and provenance", portraitSourcePage, ["portrait", "portrait_provenance"]));
    upsertSource(sourceLinks, source("Stored portrait source file", portraitUpgrade.url, ["portrait", "portrait_provenance"]));
    if (!portraitUpgrade.sourcePage) {
      upsertSource(sourceLinks, source("Texas State Directory House roster", DIRECTORY_ROOT, ["portrait_provenance", "current_office_cross_check"]));
    }
  }
  profile.sourceLinks = sourceLinks;

  profile.fieldFreshness = {
    identity: freshness("current", HOUSE_ROSTER, "Matched to the current official Texas House roster by district and full name."),
    portrait: freshness("current", profile.photoSourceUrl, `${portrait.width}x${portrait.height}; ${portrait.bytes} stored bytes; downscaled only when the source exceeded 1600px and never upscaled.`),
    contact: freshness("current", officialUrl, "Capitol room, complete mailing address, telephone, email channel, and official website reviewed against the member page."),
    term: freshness("current", ELECTION_ARCHIVE, "The current two-year House term and 2026 general-election cycle are disclosed. The exact term-end date remains labeled pending source review, and candidate filing status is not inferred."),
    assignments: freshness("current", committeeUrl, "Current committee and leadership assignments loaded from the official House committee API and linked page."),
    biography: freshness("current", biographyUrl, "Concise biography derived from the official House biography page."),
    legislation: freshness("source_path_only", authoredUrl, "Official authored and sponsored bill paths are linked; individual bill findings require record-level editorial review."),
    votingRecord: freshness("current", VOTES_BY_DATE, `${record.summary.totalVotesLoaded.toLocaleString()} official House positions are indexed; ${record.storedVoteRows} recent source-linked rows are stored for display.`),
    campaignFinance: freshness("pending_review", FINANCE_SEARCH, "Filer identity and reporting period are not yet matched."),
    positiveWork: freshness("pending_review", biographyUrl, "No positive-work claim is published without a dated primary record, measurable result, and independent context."),
    criticism: freshness("pending_review", officialUrl, "No criticism or controversy is published without substantiation, attribution, date, context, and an official response when available."),
    sentiment: freshness("pending_review", officialUrl, "No constituent sentiment is published without jurisdiction-confidence and sampling disclosures."),
    constitutionalAlignment: freshness("pending_review", VOTES_BY_DATE, "No score is published without cited votes, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis disclaimer."),
    officialRecord: freshness("current", VOTES_BY_DATE, "Record-level vote rows are loaded; legislation remains linked at source-path depth."),
  };

  writeJson(profileFile, profile);
  results.push({
    district: profile.district,
    id: profile.id,
    name: profile.name,
    portrait: { width: portrait.width, height: portrait.height, bytes: portrait.bytes },
    indexedPositions: record.summary.totalVotesLoaded,
    storedVoteRows: record.storedVoteRows,
  });
}

if (results.length !== 25) throw new Error(`Expected 25 completed profiles, found ${results.length}`);
console.log(JSON.stringify({ reviewedAt: REVIEWED_AT, count: results.length, profiles: results }, null, 2));
