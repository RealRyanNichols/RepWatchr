import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REVIEWED_AT = "2026-08-08";
const ROOT = process.cwd();
const STATE_DIR = join(ROOT, "src", "data", "officials", "state");
const IMAGE_DIR = join(ROOT, "public", "images", "officials", "texas-accountability");
const SENATE_ROSTER = "https://www.senate.texas.gov/members.php";
const SENATE_DIRECTORY = "https://www.senate.texas.gov/directory.php";
const HOUSE_ROSTER = "https://house.texas.gov/api/getMembers";
const HOUSE_MEMBERS = "https://house.texas.gov/members";
const VOTE_HELP = "https://capitol.texas.gov/help/findvoteinfo.aspx";
const FINANCE_SEARCH = "https://www.ethics.state.tx.us/search/cf/";
const ELECTION_ARCHIVE = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const TRIBUNE_TERMS = "https://www.texastribune.org/about/terms-of-service/";

const senateMembers = [
  { district: 17, slug: "joan-huffman" },
  { district: 18, slug: "lois-kolkhorst" },
  { district: 19, slug: "roland-gutierrez" },
  { district: 20, slug: "juan-chuy-hinojosa" },
  { district: 21, slug: "judith-zaffirini" },
  { district: 23, slug: "royce-west" },
  {
    district: 24,
    slug: "pete-flores",
    portraitUrl: "https://tpwd.texas.gov/newsmedia/news_images/pete_flores/pete_flores--.jpg",
    portraitSourcePage: "https://tpwd.texas.gov/newsmedia/news_images/?g=pete_flores",
    photoCredit: "Official Texas Parks and Wildlife Department news-media image.",
    photoRights: "Texas Parks and Wildlife Department news-media image; source and gallery provenance retained.",
  },
  { district: 25, slug: "donna-campbell" },
  { district: 26, slug: "jose-menendez" },
  { district: 27, slug: "adam-hinojosa" },
  { district: 28, slug: "charles-perry" },
  {
    district: 29,
    slug: "cesar-j-blanco",
    portraitUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Cesar_Blanco_Open_Congress_Austin_2023.jpg",
    portraitSourcePage: "https://commons.wikimedia.org/wiki/File:Cesar_Blanco_Open_Congress_Austin_2023.jpg",
    photoCredit: "Larry D. Moore, CC BY 4.0, via Wikimedia Commons; unmodified.",
    photoRights: "Creative Commons Attribution 4.0 International (CC BY 4.0); attribution and source retained.",
  },
  { district: 30, slug: "brent-hagenbuch" },
  { district: 31, slug: "kevin-sparks" },
];

// The August 8 checkpoint continues the House sequence. Senate profiles were
// completed and published in the August 7 batch, so keep them out of this run.
senateMembers.length = 0;

const houseDistricts = [
  49, 50, 52, 53, 54, 55, 56, 59, 60, 61,
  62, 64, 65, 66, 67, 69, 71, 72, 73, 76,
  77, 78, 79, 81, 82, 83, 85, 86, 87, 88,
  89, 92, 93, 94, 95, 96, 97, 98, 99, 100,
  101, 102, 105, 106, 107, 108, 109, 110, 111, 114,
];

function decodeEntities(value) {
  return value
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&iacute;", "í")
    .replaceAll("&ntilde;", "ñ")
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

async function downloadPortrait(url, id) {
  const response = await fetch(url, { headers: { "user-agent": "RepWatchr profile importer" } });
  if (!response.ok) throw new Error(`${response.status} portrait ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const dimensions = jpegDimensions(bytes);
  if (!dimensions || dimensions.width < 500 || dimensions.height < 500) {
    throw new Error(`Portrait failed 500x500 gate for ${id}: ${dimensions?.width ?? 0}x${dimensions?.height ?? 0}`);
  }
  const filename = `${id}.jpg`;
  writeFileSync(join(IMAGE_DIR, filename), bytes);
  return { path: `/images/officials/texas-accountability/${filename}`, ...dimensions, bytes: bytes.length };
}

function jpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function alreadyCompleted(path) {
  if (!existsSync(path)) return null;
  const profile = readJson(path);
  if (profile.lastVerifiedAt !== REVIEWED_AT || !profile.photo?.startsWith("/images/officials/texas-accountability/")) return null;
  const portraitPath = join(ROOT, "public", profile.photo);
  if (!existsSync(portraitPath)) return null;
  const dimensions = jpegDimensions(readFileSync(portraitPath));
  if (!dimensions || dimensions.width < 500 || dimensions.height < 500) return null;
  if (!profile.sourceLinks?.every((item) => item.accessedAt === REVIEWED_AT)) return null;
  return { profile, portrait: { ...dimensions, path: profile.photo, bytes: readFileSync(portraitPath).length } };
}

function parseElectionYear(html) {
  const match = textFromHtml(html).match(/Seat up for election\s+(\d{4})/i);
  if (!match) throw new Error("Election year not found in directory profile");
  return Number(match[1]);
}

function parseParty(html, fallback) {
  const text = textFromHtml(html);
  if (/Party\s+Democrat/i.test(text)) return "D";
  if (/Party\s+Republican/i.test(text)) return "R";
  return fallback;
}

function parseTribunePortraitUrl(html) {
  const path = html.match(/static\/images\/headshots\/[^\"'?<]+/i)?.[0];
  if (!path) throw new Error("Directory portrait not found");
  return `https://directory.texastribune.org/${encodeURI(decodeEntities(path))}`;
}

function parseSenateCommittees(html) {
  const block = html.match(/id=["']mem_cmtes["'][\s\S]*?<\/div>/i)?.[0] ?? "";
  return [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => textFromHtml(match[1]).replaceAll("**", "").replaceAll("*", "").trim())
    .filter((value) => value && !/No committee assignments/i.test(value));
}

function parseSenateAuthorCode(html) {
  return html.match(/name=["']code["'][^>]+value=["']([^"']+)/i)?.[1] ?? null;
}

function parseHouseBiography(html, name, district) {
  const block = html.match(/<section id=["']biography["'][\s\S]*?<\/section>/i)?.[0] ?? "";
  const text = textFromHtml(block).replace(/^Biography\s*/i, "");
  if (!text) return `${name} currently represents Texas House District ${district}.`;
  const clipped = text.length > 760 ? text.slice(0, 760).replace(/\s+\S*$/, "") : text;
  return clipped.endsWith(".") ? clipped : `${clipped}.`;
}

function parseHouseContact(html, fallback = {}) {
  const block = html.match(/Capitol Address:[\s\S]*?Bills Authored\/Sponsored:/i)?.[0] ?? "";
  const text = textFromHtml(block);
  const phone = text.match(/\(?(\d{3})\)?[ -](\d{3})[ -](\d{4})/)?.slice(1).join("-");
  const office = text.match(/Capitol Address:\s*(.*?)\s*(?:\(\d{3}\)|\d{3}-\d{3})/i)?.[1];
  return {
    ...fallback,
    ...(office ? { office } : {}),
    ...(phone ? { phone } : {}),
  };
}

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

function freshness(status, sourceUrl, note) {
  return { status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) };
}

function evidenceNotes() {
  return [
    "Positive work and constituent benefit claims remain pending editorial review until a primary record and a response or independent context are attached.",
    "Criticism and controversies remain pending editorial review until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
    "Campaign-finance totals, donors, industries/PACs, and expenditures remain unpublished until the correct filer and reporting period are matched to Texas Ethics Commission records.",
    "Constituent sentiment remains unpublished until the sample discloses its collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty.",
    "A constitutional-alignment score is not published without cited votes, a public rubric, applicable constitutional provisions, uncertainty, and a RepWatchr-analysis disclaimer.",
  ];
}

mkdirSync(IMAGE_DIR, { recursive: true });
const results = [];

for (const member of senateMembers) {
  const path = join(STATE_DIR, `tx-senate-sd${member.district}.json`);
  const completed = alreadyCompleted(path);
  if (completed) {
    results.push({ id: completed.profile.id, district: completed.profile.district, kind: "senate", portrait: completed.portrait });
    continue;
  }
  const existing = readJson(path);
  const officialUrl = `https://www.senate.texas.gov/member.php?d=${member.district}`;
  const directoryUrl = `https://directory.texastribune.org/${member.slug}/`;
  const [officialHtml, directoryHtml] = await Promise.all([fetchText(officialUrl), fetchText(directoryUrl)]);
  const officialText = normalizedName(textFromHtml(officialHtml));
  if (!officialText.includes(normalizedName(existing.lastName))) {
    throw new Error(`Senate identity mismatch for SD-${member.district}`);
  }
  const election = parseElectionYear(directoryHtml);
  const committees = parseSenateCommittees(officialHtml);
  const authorCode = parseSenateAuthorCode(officialHtml);
  const portraitUrl = member.portraitUrl ?? parseTribunePortraitUrl(directoryHtml);
  const portraitSourcePage = member.portraitSourcePage ?? portraitUrl;
  const portrait = await downloadPortrait(portraitUrl, existing.id);
  const billUrl = authorCode
    ? `https://capitol.texas.gov/Reports/Report.aspx?LegSess=892&ID=author&code=${authorCode}`
    : "https://capitol.texas.gov/MnuSearch.aspx";
  const committeeSummary = committees.length
    ? `The official Senate profile lists ${committees.slice(0, 3).join(", ")}${committees.length > 3 ? ", and additional assignments" : ""}.`
    : "The official Senate profile displayed no active committee assignments at review time.";
  const profile = {
    ...existing,
    photo: portrait.path,
    photoSourceUrl: portraitUrl,
    photoCredit: member.photoCredit ?? "Texas Tribune elected-officials directory portrait; identity cross-checked against the official Texas Senate roster.",
    photoRights: member.photoRights ?? "Stored with source attribution and site-terms provenance; reuse rights should be rechecked before redistribution outside RepWatchr.",
    party: parseParty(directoryHtml, existing.party),
    termEnd: `${election}-12-31`,
    nextElection: `${election} general election`,
    contactInfo: { ...existing.contactInfo, website: officialUrl },
    bio: `${existing.name} currently represents Texas Senate District ${member.district}. ${committeeSummary} Individual bills, roll calls, finance figures, public-record findings, and sentiment publish only after their evidence gates pass.`,
    committeeAssignments: committees,
    accountabilityNotes: evidenceNotes(),
    reviewStatus: "source_seeded",
    sourceLinks: [
      source("Official Texas Senate member profile", officialUrl, ["identity", "office", "biography", "committees", "contact"]),
      source("Official current Texas Senate roster", SENATE_ROSTER, ["current_office", "district", "party"]),
      source("Official Texas Senate directory", SENATE_DIRECTORY, ["contact", "district"]),
      source("Texas Legislature Online bills by author", billUrl, ["sponsored_legislation"]),
      source("Texas Legislature Online vote-information guide", VOTE_HELP, ["voting_record_method"]),
      source("Texas Ethics Commission campaign-finance search", FINANCE_SEARCH, ["campaign_finance_source_path"]),
      source("Texas Secretary of State election archive", ELECTION_ARCHIVE, ["term", "election_history"]),
      source("Texas Tribune elected-official directory", directoryUrl, ["portrait", "party", "next_election", "contact"]),
      source("Stored portrait source and rights provenance", portraitSourcePage, ["portrait", "portrait_provenance"]),
      source("Texas Tribune site terms", TRIBUNE_TERMS, ["portrait_provenance"]),
    ],
    fieldFreshness: {
      identity: freshness("current", SENATE_ROSTER),
      portrait: freshness("current", portraitUrl, `${portrait.width}x${portrait.height}; ${portrait.bytes} bytes`),
      contact: freshness("current", officialUrl),
      term: freshness("current", directoryUrl),
      assignments: freshness("current", officialUrl),
      legislation: freshness("source_path_only", billUrl, "Individual bills require record-level editorial review."),
      votingRecord: freshness("source_path_only", VOTE_HELP, "Vote rows require official journals or reports."),
      campaignFinance: freshness("pending_review", FINANCE_SEARCH, "Filer and reporting period are not yet matched."),
      positiveWork: freshness("pending_review", officialUrl),
      criticism: freshness("pending_review", officialUrl),
      sentiment: freshness("pending_review", officialUrl),
      constitutionalAlignment: freshness("pending_review", VOTE_HELP),
    },
    lastVerifiedAt: REVIEWED_AT,
  };
  writeJson(path, profile);
  results.push({ id: profile.id, district: profile.district, kind: "senate", portrait });
}

const houseRoster = await fetchJson(HOUSE_ROSTER);
for (const district of houseDistricts) {
  const path = join(STATE_DIR, `tx-house-hd${district}.json`);
  const completed = alreadyCompleted(path);
  if (completed) {
    results.push({ id: completed.profile.id, district: completed.profile.district, kind: "house", portrait: completed.portrait });
    continue;
  }
  const existing = readJson(path);
  const rosterMember = houseRoster.find((member) => Number(member.id) === district);
  if (!rosterMember) throw new Error(`House roster missing HD-${district}`);
  const rosterName = textFromHtml(rosterMember.member_name).split(",").reverse().join(" ").trim();
  if (!normalizedName(rosterName).includes(normalizedName(existing.lastName))) {
    throw new Error(`House identity mismatch for HD-${district}: ${rosterName} vs ${existing.name}`);
  }
  const memberCode = String(rosterMember.member_bill_code);
  const officialUrl = `https://house.texas.gov/members/${memberCode}`;
  const biographyUrl = `${officialUrl}/biography`;
  const committeeUrl = `${officialUrl}/committees`;
  const committeeApiUrl = `https://house.texas.gov/api/getMemberCommittees/${memberCode}`;
  const directorySlug = existing.id.normalize("NFD").replaceAll(/[\u0300-\u036f]/g, "").replaceAll(/[^a-z0-9-]/g, "");
  const directoryUrl = `https://directory.texastribune.org/${directorySlug}/`;
  const [officialHtml, biographyHtml, committees, directoryHtml] = await Promise.all([
    fetchText(officialUrl),
    fetchText(biographyUrl),
    fetchJson(committeeApiUrl),
    fetchText(directoryUrl),
  ]);
  if (!normalizedName(textFromHtml(officialHtml)).includes(normalizedName(existing.lastName))) {
    throw new Error(`Official House page identity mismatch for HD-${district}`);
  }
  const election = parseElectionYear(directoryHtml);
  const portraitUrl = parseTribunePortraitUrl(directoryHtml);
  const portrait = await downloadPortrait(portraitUrl, existing.id);
  const assignments = (Array.isArray(committees) ? committees : []).map((committee) =>
    committee.position && committee.position !== "Member"
      ? `${committee.committeeName} — ${committee.position}`
      : committee.committeeName,
  ).filter(Boolean);
  const authoredUrl = `https://capitol.texas.gov/reports/report.aspx?ID=author&LegSess=89R&Code=A${memberCode}`;
  const sponsoredUrl = `https://capitol.texas.gov/reports/report.aspx?ID=sponsor&LegSess=89R&Code=A${memberCode}`;
  const contactInfo = parseHouseContact(officialHtml, existing.contactInfo);
  contactInfo.website = officialUrl;
  const profile = {
    ...existing,
    name: rosterName,
    photo: portrait.path,
    photoSourceUrl: portraitUrl,
    photoCredit: "Texas Tribune elected-officials directory portrait; identity cross-checked against the official Texas House roster.",
    photoRights: "Stored with source attribution and site-terms provenance; reuse rights should be rechecked before redistribution outside RepWatchr.",
    party: parseParty(directoryHtml, existing.party),
    termEnd: `${election}-12-31`,
    nextElection: `${election} general election`,
    contactInfo,
    bio: parseHouseBiography(biographyHtml, rosterName, district),
    committeeAssignments: assignments,
    accountabilityNotes: evidenceNotes(),
    reviewStatus: "source_seeded",
    sourceLinks: [
      source("Official Texas House member page", officialUrl, ["identity", "office", "contact", "legislation_paths"]),
      source("Official current Texas House roster API", HOUSE_ROSTER, ["current_office", "district", "identity"]),
      source("Official Texas House member directory", HOUSE_MEMBERS, ["current_office", "district"]),
      source("Official Texas House biography", biographyUrl, ["biography"]),
      source("Official Texas House committee assignments", committeeUrl, ["committees", "leadership"]),
      source("Texas Legislature Online authored bills", authoredUrl, ["sponsored_legislation"]),
      source("Texas Legislature Online sponsored bills", sponsoredUrl, ["sponsored_legislation"]),
      source("Texas Legislature Online vote-information guide", VOTE_HELP, ["voting_record_method"]),
      source("Texas Ethics Commission campaign-finance search", FINANCE_SEARCH, ["campaign_finance_source_path"]),
      source("Texas Secretary of State election archive", ELECTION_ARCHIVE, ["term", "election_history"]),
      source("Texas Tribune elected-official directory", directoryUrl, ["portrait", "party", "next_election"]),
      source("Texas Tribune site terms", TRIBUNE_TERMS, ["portrait_provenance"]),
    ],
    fieldFreshness: {
      identity: freshness("current", HOUSE_ROSTER),
      portrait: freshness("current", portraitUrl, `${portrait.width}x${portrait.height}; ${portrait.bytes} bytes`),
      contact: freshness("current", officialUrl),
      term: freshness("current", directoryUrl),
      assignments: freshness("current", committeeUrl),
      legislation: freshness("source_path_only", authoredUrl, "Individual bills require record-level editorial review."),
      votingRecord: freshness("source_path_only", VOTE_HELP, "Vote rows require official journals or reports."),
      campaignFinance: freshness("pending_review", FINANCE_SEARCH, "Filer and reporting period are not yet matched."),
      positiveWork: freshness("pending_review", biographyUrl),
      criticism: freshness("pending_review", officialUrl),
      sentiment: freshness("pending_review", officialUrl),
      constitutionalAlignment: freshness("pending_review", VOTE_HELP),
    },
    lastVerifiedAt: REVIEWED_AT,
  };
  writeJson(path, profile);
  results.push({ id: profile.id, district: profile.district, kind: "house", portrait });
}

if (results.length !== 50) throw new Error(`Expected 50 completed profiles, found ${results.length}`);
console.log(JSON.stringify({ reviewedAt: REVIEWED_AT, count: results.length, profiles: results }, null, 2));
