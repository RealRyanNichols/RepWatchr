import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

const REVIEWED_AT = "2026-08-03";
const ROOT = process.cwd();
const STATE_DIR = join(ROOT, "src", "data", "officials", "state");
const IMAGE_DIR = join(ROOT, "public", "images", "officials", "texas-accountability");
const SENATE_ROSTER = "https://www.senate.texas.gov/members.php";
const SENATE_DIRECTORY = "https://www.senate.texas.gov/directory.php";
const SUPREME_ROSTER = "https://www.txcourts.gov/supreme/about-the-court/justices/";
const SUPREME_OPINIONS = "https://www.txcourts.gov/supreme/orders-opinions/";
const SUPREME_SEARCH = "https://search.txcourts.gov/CaseSearch.aspx?coa=cossup";
const VOTE_HELP = "https://capitol.texas.gov/help/findvoteinfo.aspx";
const FINANCE_SEARCH = "https://www.ethics.state.tx.us/search/cf/";
const ELECTION_ARCHIVE = "https://www.sos.state.tx.us/elections/historical/index.shtml";

const senateMembers = [
  { district: 1, id: "bryan-hughes", name: "Bryan Hughes", slug: "bryan-hughes", image: "Bryan_Hughes.jpg", party: "R" },
  { district: 2, id: "bob-hall", name: "Bob Hall", slug: "bob-hall", image: "Bob_Hall.jpg", party: "R" },
  { district: 3, id: "robert-nichols", name: "Robert Nichols", slug: "robert-nichols", image: "Robert_Nichols_.jpg", party: "R" },
  { district: 4, id: "brett-ligon", name: "Brett Ligon", slug: "brett-ligon", image: "Brett-Ligon.jpg", party: "R", termStart: "2026-05-02" },
  { district: 5, id: "charles-schwertner", name: "Charles Schwertner", slug: "charles-schwertner", image: "Charles_Schwertner.jpg", party: "R" },
  { district: 6, id: "carol-alvarado", name: "Carol Alvarado", slug: "carol-alvarado", image: "Carol-Alvarado.jpg", party: "D" },
  { district: 7, id: "paul-bettencourt", name: "Paul Bettencourt", slug: "paul-bettencourt", image: "Paul_Bettencourt.jpg", party: "R" },
  { district: 8, id: "angela-paxton", name: "Angela Paxton", slug: "angela-paxton", image: "angela-paxton.JPG", party: "R" },
  { district: 9, id: "taylor-rehmet", name: "Taylor Rehmet", slug: "taylor-rehmet", image: "Taylor-Rehmet.jpg", party: "D" },
  { district: 10, id: "phil-king", name: "Phil King", slug: "phil-king", image: "Phil_King.jpg", party: "R" },
  { district: 11, id: "mayes-middleton", name: "Mayes Middleton", slug: "mayes-middleton", image: "Mayes_Middleton.jpg", party: "R" },
  { district: 12, id: "tan-parker", name: "Tan Parker", slug: "tan-parker", image: "Tan_Parker_.jpg", party: "R" },
  { district: 13, id: "borris-miles", name: "Borris Miles", slug: "borris-l-miles", image: "Boris_L_Miles.jpg", party: "D" },
  { district: 14, id: "sarah-eckhardt", name: "Sarah Eckhardt", slug: "sarah-eckhardt", image: "Sarah Eckhardt TT.jpg", party: "D" },
  { district: 15, id: "molly-cook", name: "Molly Cook", slug: "molly-cook", image: "Molly Cook Directory TT 01.jpg", party: "D" },
  { district: 16, id: "nathan-johnson", name: "Nathan Johnson", slug: "nathan-johnson", image: "Nathan-Johnson-low.JPG", party: "D" },
];

const supremeJustices = [
  { id: "tx-supreme-jimmy-blacklock", slug: "chief-justice-jimmy-blacklock", directorySlug: "jimmy-blacklock", image: "https://www.txcourts.gov/media/1460030/chief-justice-jimmy-blacklock-web.jpg", election: 2030 },
  { id: "tx-supreme-debra-lehrmann", slug: "justice-debra-lehrmann", directorySlug: "debra-lehrmann", image: "https://www.txcourts.gov/media/1452363/justice-debra-lehrmann-web.jpg", election: 2028, termStart: "2010-06-21" },
  { id: "tx-supreme-john-phillip-devine", slug: "justice-john-phillip-devine", directorySlug: "john-devine", image: "https://www.txcourts.gov/media/1460028/justice-john-p-devine-web.jpg", election: 2030 },
  { id: "tx-supreme-brett-busby", slug: "justice-brett-busby", directorySlug: "brett-busby", image: "https://directory.texastribune.org/static/images/headshots/busby_web_cr_082619.jpg", election: 2026, photoCredit: "Texas Tribune elected-officials directory portrait; identity cross-checked against the official Texas Judicial Branch roster." },
  { id: "tx-supreme-jane-bland", slug: "justice-jane-bland", directorySlug: "jane-bland", image: "https://www.txcourts.gov/media/1460006/justice-jane-bland-2025-web.jpg", election: 2030 },
  { id: "tx-supreme-rebeca-aizpuru-huddle", slug: "justice-rebeca-aizpuru-huddle", directorySlug: "rebeca-aizpuru-huddle", image: "https://www.txcourts.gov/media/1450011/rah042921.jpg", election: 2028 },
  { id: "tx-supreme-evan-a-young", slug: "justice-evan-a-young", directorySlug: "evan-young", image: "https://www.txcourts.gov/media/1460005/justice-evan-a-young.jpg", election: 2028 },
  { id: "tx-supreme-james-p-sullivan", slug: "justice-james-p-sullivan", directorySlug: "james-p-sullivan", image: "https://www.txcourts.gov/media/1460010/justice-james-p-sullivan-2025-web.jpg", election: 2026 },
  { id: "tx-supreme-kyle-d-hawkins", slug: "justice-kyle-d-hawkins", directorySlug: "kyle-hawkins", image: "https://directory.texastribune.org/static/images/headshots/Kyle%20Hawkins.jpeg", election: 2026, photoCredit: "Texas Tribune elected-officials directory portrait; identity cross-checked against the official Texas Judicial Branch roster." },
];

function decodeEntities(value) {
  return value
    .replaceAll("&mdash;", "—")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function textFromHtml(value) {
  return decodeEntities(value.replaceAll(/<[^>]+>/g, " ")).replaceAll(/\s+/g, " ").trim();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "RepWatchr profile importer" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function downloadImage(url, id) {
  const response = await fetch(url, { headers: { "user-agent": "RepWatchr profile importer" } });
  if (!response.ok) throw new Error(`${response.status} image ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const dimensions = jpegDimensions(bytes);
  if (!dimensions || dimensions.width < 500 || dimensions.height < 700) {
    throw new Error(`Portrait failed 500x700 gate for ${id}: ${dimensions?.width ?? 0}x${dimensions?.height ?? 0}`);
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

function parseElectionYear(html) {
  const text = textFromHtml(html);
  const match = text.match(/Seat up for election\s+(\d{4})/i);
  if (!match) throw new Error("Election year not found");
  return Number(match[1]);
}

function parseCommitteeAssignments(html) {
  const block = html.match(/id=["']mem_cmtes["'][\s\S]*?<\/div>/i)?.[0] ?? "";
  return [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => textFromHtml(match[1]).replaceAll("**", "").replaceAll("*", "").replaceAll(/\s+—/g, " —").trim())
    .filter((value) => value && !/No committee assignments/i.test(value));
}

function parseAuthorCode(html) {
  return html.match(/name=["']code["'][^>]+value=["']([^"']+)/i)?.[1] ?? null;
}

function parseDirectoryContact(html) {
  const text = textFromHtml(html);
  return {
    phone: text.match(/Phone\s+((?:\+?1[ -]?)?\d{3}[ -]\d{3}[ -]\d{4})/i)?.[1],
    email: text.match(/Email\s+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1],
  };
}

function senateImageUrl(member) {
  return `https://directory.texastribune.org/static/images/headshots/${encodeURIComponent(member.image).replaceAll("%2F", "/")}`;
}

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

function freshness(status, sourceUrl, note) {
  return { status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) };
}

mkdirSync(IMAGE_DIR, { recursive: true });
const results = [];

for (const member of senateMembers) {
  const officialUrl = `https://senate.texas.gov/member.php?d=${member.district}`;
  const directoryUrl = `https://directory.texastribune.org/${member.slug}/`;
  const [officialHtml, directoryHtml] = await Promise.all([fetchText(officialUrl), fetchText(directoryUrl)]);
  const officialText = textFromHtml(officialHtml).toLowerCase();
  const nameParts = member.name.toLowerCase().split(" ");
  if (!officialText.includes(nameParts[0]) || !officialText.includes(nameParts.at(-1))) {
    throw new Error(`Roster identity mismatch for SD-${member.district}`);
  }
  const election = parseElectionYear(directoryHtml);
  const committees = parseCommitteeAssignments(officialHtml);
  const authorCode = parseAuthorCode(officialHtml);
  const portraitUrl = senateImageUrl(member);
  const portrait = await downloadImage(portraitUrl, member.id);
  const path = join(STATE_DIR, `tx-senate-sd${member.district}.json`);
  const existing = member.district === 4 ? null : readJson(path);
  const names = member.name.split(" ");
  const committeeSummary = committees.length
    ? `The official Senate profile lists ${committees.slice(0, 3).join(", ")}${committees.length > 3 ? ", and additional assignments" : ""}.`
    : "The official Senate profile displayed no active committee assignments when this record was reviewed.";
  const billUrl = authorCode
    ? `https://capitol.texas.gov/Reports/Report.aspx?LegSess=892&ID=author&code=${authorCode}`
    : "https://capitol.texas.gov/MnuSearch.aspx";
  const contact = parseDirectoryContact(directoryHtml);
  const profile = {
    ...(existing ?? {}),
    id: member.id,
    name: member.name,
    firstName: existing?.firstName ?? names[0],
    lastName: existing?.lastName ?? names.at(-1),
    photo: portrait.path,
    photoSourceUrl: portraitUrl,
    photoCredit: "Texas Tribune elected-officials directory portrait; identity cross-checked against the official Texas Senate roster.",
    party: member.party,
    level: "state",
    position: "State Senator",
    district: `SD-${member.district}`,
    jurisdiction: "Texas Senate",
    county: ["Texas"],
    termStart: existing?.termStart ?? member.termStart,
    termEnd: `${election}-12-31`,
    nextElection: `${election} general election`,
    contactInfo: {
      ...(existing?.contactInfo ?? {}),
      office: existing?.contactInfo?.office ?? "P.O. Box 12068, Capitol Station, Austin, TX 78711",
      phone: contact.phone ?? existing?.contactInfo?.phone ?? `512-463-${String(100 + member.district).padStart(4, "0")}`,
      email: contact.email ?? existing?.contactInfo?.email,
      website: officialUrl,
    },
    bio: `${member.name} currently represents Texas Senate District ${member.district}. ${committeeSummary} RepWatchr links the official bill and vote paths below and leaves campaign-finance totals and constituent sentiment unrated until their underlying records pass identity, geography, and filing-period review.`,
    committeeAssignments: committees,
    campaignPromises: existing?.campaignPromises ?? [],
    accountabilityNotes: [
      "Campaign-finance totals, donors, industries, and expenditures remain unpublished until the correct candidate or officeholder filing is matched and reviewed.",
      "Constituent sentiment remains unpublished until the sample discloses its collection window, source mix, geography confidence, duplicate/bot filtering, and uncertainty.",
      "A constitutional-alignment score is not published without cited votes, a public rubric, applicable constitutional provisions, and uncertainty disclosure.",
    ],
    reviewStatus: "source_seeded",
    state: "TX",
    sourceLinks: [
      source("Official Texas Senate member profile, biography, and committee assignments", officialUrl, ["identity", "office", "biography", "committees", "contact"]),
      source("Official current Texas Senate roster", SENATE_ROSTER, ["current_office", "district", "party"]),
      source("Official Texas Senate membership directory", SENATE_DIRECTORY, ["contact", "counties"]),
      source("Texas Legislature Online bills by author", billUrl, ["sponsored_legislation"]),
      source("Texas Legislature Online vote information guide", VOTE_HELP, ["voting_record_method"]),
      source("Texas Ethics Commission campaign-finance search", FINANCE_SEARCH, ["campaign_finance_source_path"]),
      source("Texas Secretary of State election-results archive", ELECTION_ARCHIVE, ["term", "election_history"]),
      source("Texas Tribune elected-official directory and portrait", directoryUrl, ["portrait", "party", "next_election", "contact"]),
      source("Published portrait image", portraitUrl, ["portrait"]),
    ],
    fieldFreshness: {
      identity: freshness("current", SENATE_ROSTER),
      portrait: freshness("current", portraitUrl, `${portrait.width}x${portrait.height}; ${portrait.bytes} bytes`),
      contact: freshness("current", SENATE_DIRECTORY),
      term: freshness("current", directoryUrl),
      assignments: freshness("current", officialUrl),
      legislation: freshness("source_path_only", billUrl, "Individual bills require record-level editorial review."),
      votingRecord: freshness("source_path_only", VOTE_HELP, "Vote rows publish separately only when linked to official journals or reports."),
      campaignFinance: freshness("pending_review", FINANCE_SEARCH),
      sentiment: freshness("pending_review", officialUrl),
    },
    lastVerifiedAt: REVIEWED_AT,
  };
  Object.keys(profile.contactInfo).forEach((key) => profile.contactInfo[key] === undefined && delete profile.contactInfo[key]);
  writeJson(path, profile);
  results.push({ id: member.id, path, portrait, election, committees: committees.length, kind: "senate" });
}

for (const justice of supremeJustices) {
  const path = join(STATE_DIR, `${justice.id}.json`);
  const existing = readJson(path);
  const officialUrl = `${SUPREME_ROSTER}${justice.slug}/`;
  const directoryUrl = `https://directory.texastribune.org/${justice.directorySlug}/`;
  const [officialHtml, directoryHtml] = await Promise.all([fetchText(officialUrl), fetchText(directoryUrl)]);
  if (!textFromHtml(officialHtml).toLowerCase().includes(existing.lastName.toLowerCase())) {
    throw new Error(`Roster identity mismatch for ${justice.id}`);
  }
  const directoryElection = parseElectionYear(directoryHtml);
  if (directoryElection !== justice.election) throw new Error(`Election-year mismatch for ${justice.id}`);
  const contact = parseDirectoryContact(directoryHtml);
  const portrait = await downloadImage(justice.image, justice.id);
  const profile = {
    ...existing,
    photo: portrait.path,
    photoSourceUrl: justice.image,
    photoCredit: justice.photoCredit ?? "Official Texas Judicial Branch portrait.",
    party: "R",
    termStart: justice.termStart ?? existing.termStart,
    termEnd: `${justice.election}-12-31`,
    nextElection: `${justice.election} general election`,
    contactInfo: {
      ...existing.contactInfo,
      phone: contact.phone ?? existing.contactInfo.phone,
      email: contact.email ?? existing.contactInfo.email,
      website: officialUrl,
    },
    bio: `${existing.bio} RepWatchr treats opinions, orders, rules, and case records as the role-compatible accountability record; it does not substitute legislative roll calls for judicial work. Campaign-finance totals and constituent sentiment remain unrated until their source records pass review.`,
    accountabilityNotes: [
      "Judicial accountability is sourced from opinions, orders, rules, administration, and case records rather than legislative roll calls.",
      "Campaign-finance totals and donor groupings remain unpublished until the correct filing committee and reporting period are matched.",
      "Constituent sentiment remains unpublished until geography confidence, sample composition, duplicate/bot filtering, and uncertainty are disclosed.",
      "No constitutional-alignment score is published without cited judicial actions, a transparent rubric, applicable provisions, and a clear non-legal-judgment disclaimer.",
    ],
    reviewStatus: "source_seeded",
    sourceLinks: [
      source("Official Texas Judicial Branch justice biography", officialUrl, ["identity", "office", "biography"]),
      source("Official Supreme Court of Texas justice roster", SUPREME_ROSTER, ["current_office", "place"]),
      source("Official Supreme Court orders and opinions", SUPREME_OPINIONS, ["judicial_record"]),
      source("Official appellate case search", SUPREME_SEARCH, ["case_record"]),
      source("Texas Ethics Commission campaign-finance search", FINANCE_SEARCH, ["campaign_finance_source_path"]),
      source("Texas Secretary of State election-results archive", ELECTION_ARCHIVE, ["term", "election_history"]),
      source("Texas Tribune elected-official directory", directoryUrl, ["party", "next_election", "contact"]),
      source("Published portrait image", justice.image, ["portrait"]),
    ],
    fieldFreshness: {
      identity: freshness("current", SUPREME_ROSTER),
      portrait: freshness("current", justice.image, `${portrait.width}x${portrait.height}; ${portrait.bytes} bytes`),
      contact: freshness("current", directoryUrl),
      term: freshness("current", directoryUrl),
      judicialRecord: freshness("source_path_only", SUPREME_OPINIONS, "Opinion-level indexing remains a separate evidence pass."),
      campaignFinance: freshness("pending_review", FINANCE_SEARCH),
      sentiment: freshness("pending_review", officialUrl),
    },
    lastVerifiedAt: REVIEWED_AT,
  };
  Object.keys(profile.contactInfo).forEach((key) => profile.contactInfo[key] === undefined && delete profile.contactInfo[key]);
  writeJson(path, profile);
  results.push({ id: justice.id, path, portrait, election: justice.election, committees: 0, kind: "supreme_court" });
}

if (results.length !== 25) throw new Error(`Expected 25 updated profiles, wrote ${results.length}`);
console.log(JSON.stringify({ reviewedAt: REVIEWED_AT, count: results.length, results }, null, 2));
