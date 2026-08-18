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
const REVIEWED_AT = "2026-08-18";
const IMAGE_DIR = join(ROOT, "public", "images", "officials", "texas-accountability");
const FEDERAL_IMAGE_DIR = join(ROOT, "public", "images", "officials", "federal");
const HOUSE_ROSTER = "https://house.texas.gov/api/getMembers";
const HOUSE_DIRECTORY = "https://house.texas.gov/members";
const HOUSE_VOTES = "https://capitol.texas.gov/Reports/GeneralVotesByDateHouse.aspx";
const TEXAS_VOTE_GUIDE = "https://capitol.texas.gov/billlookup/voteinfo.aspx";
const TEXAS_FINANCE = "https://www.ethics.state.tx.us/search/cf/";
const TEXAS_ELECTIONS = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const TX_DIRECTORY_ROOT = "https://www.txdirectory.com/online/txhouse/";
const TX_DIRECTORY_TERMS = "https://www.txdirectory.com/terms/";
const TRIBUNE_TERMS = "https://www.texastribune.org/about/terms-of-service/";
const CAPITOL_MAILING_SUFFIX = "P.O. Box 12910 Austin, Texas 78711-2910";
const CLERK_VOTES = "https://clerk.house.gov/evs/2026/index.asp";
const CLERK_VOTE_GUIDE = "https://clerk.house.gov/Votes/MemberVotes";
const CONGRESS_MEMBERS = "https://www.congress.gov/members";
const FEC_CANDIDATES = "https://www.fec.gov/data/candidates/house/?election_year=2026&state=TX";
const FEC_FILINGS = "https://www.fec.gov/data/filings/?data_type=processed&election_year=2026&state=TX";
const ARTICLE_ONE = "https://constitution.congress.gov/constitution/article-1/";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

const housePortraits = new Map([
  [2, {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brent%20Money%20by%20Gage%20Skidmore.jpg",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Brent_Money_by_Gage_Skidmore.jpg",
    credit: "Gage Skidmore; identity cross-checked against the current official Texas House roster.",
    rights: "CC BY-SA 3.0; attribution and license provenance retained on the Wikimedia Commons file page.",
  }],
  [3, {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/CecilBellJr-PachydermClubMoCo-TheWoodlandsTX24SEPT2019.jpg",
    sourcePage: "https://commons.wikimedia.org/wiki/File:CecilBellJr-PachydermClubMoCo-TheWoodlandsTX24SEPT2019.jpg",
    credit: "CharlesShirley; identity cross-checked against the current official Texas House roster.",
    rights: "CC BY-SA 4.0; attribution and license provenance retained on the Wikimedia Commons file page.",
  }],
  [27, {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ron%20Reynolds%20DSCN3537.jpg",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Ron_Reynolds_DSCN3537.jpg",
    credit: "Dcs57; identity cross-checked against the current official Texas House roster.",
    rights: "CC BY-SA 4.0; attribution and license provenance retained on the Wikimedia Commons file page.",
  }],
  [57, {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Richard%20hayes%20texas%20rep.jpg",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Richard_hayes_texas_rep.jpg",
    credit: "Richard Hayes Campaign; identity cross-checked against the current official Texas House roster.",
    rights: "CC0; public-domain dedication and provenance retained on the Wikimedia Commons file page.",
  }],
  [58, {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Helen%20Kerwin.jpg",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Helen_Kerwin.jpg",
    credit: "Atsme; identity cross-checked against the current official Texas House roster.",
    rights: "CC0; public-domain dedication and provenance retained on the Wikimedia Commons file page.",
  }],
  [112, {
    url: "https://commons.wikimedia.org/wiki/Special:FilePath/Angie%20Chen%20Button%20in%202019.jpg",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Angie_Chen_Button_in_2019.jpg",
    credit: "LBJ Library; identity cross-checked against the current official Texas House roster.",
    rights: "Public domain; provenance retained on the Wikimedia Commons file page.",
  }],
]);

const federalDistricts = [19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
const houseNameOverrides = new Map();
const federalPortraitOverrides = new Map([
  ["V000134", "https://commons.wikimedia.org/wiki/Special:FilePath/Beth%20Van%20Duyne.jpg"],
  ["D000399", "https://commons.wikimedia.org/wiki/Special:FilePath/Lloyd%20Doggett%2C%20Official%20Portrait%2C%20112th%20Congress.jpg"],
]);
const requestedHouseDistricts = new Set(
  String(process.env.HOUSE_DISTRICTS ?? "").split(",").filter(Boolean).map(Number),
);
const requestedFederalDistricts = new Set(
  String(process.env.FEDERAL_DISTRICTS ?? "").split(",").filter(Boolean).map(Number),
);
const selectedHousePortraits = requestedHouseDistricts.size
  ? new Map([...housePortraits].filter(([district]) => requestedHouseDistricts.has(district)))
  : housePortraits;
const selectedFederalDistricts = requestedFederalDistricts.size
  ? federalDistricts.filter((district) => requestedFederalDistricts.has(district))
  : federalDistricts;

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function decodeEntities(value = "") {
  return value
    .replaceAll("&mdash;", "—")
    .replaceAll("&ndash;", "–")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&aacute;", "á")
    .replaceAll("&eacute;", "é")
    .replaceAll("&iacute;", "í")
    .replaceAll("&oacute;", "ó")
    .replaceAll("&uacute;", "ú")
    .replaceAll("&ntilde;", "ñ")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replaceAll(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function textFromHtml(value = "") {
  return decodeEntities(value.replaceAll(/<[^>]+>/g, " ")).replaceAll(/\s+/g, " ").trim();
}

function normalizedName(value = "") {
  return decodeEntities(value)
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, "");
}

function stripHtml(value = "") {
  return textFromHtml(value).replaceAll(/\s+/g, " ").trim();
}

function ordinal(value) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

async function fetchResponse(url, options = {}) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "user-agent": "RepWatchr Texas profile build (Ryan@RealRyanNichols.com)",
        accept: "text/html,application/json,image/*,*/*",
        ...(options.headers ?? {}),
      },
      signal: options.signal ?? AbortSignal.timeout(60_000),
    });
    lastStatus = response.status;
    if (response.ok) return response;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) break;
    await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }
  throw new Error(`${lastStatus} ${url}`);
}

async function fetchText(url) {
  return (await fetchResponse(url)).text();
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json();
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

function guardedNotes(recordLabel) {
  return [
    `${recordLabel} rows report source-linked recorded positions only and do not infer motive, ideology, attendance, constitutional alignment, or performance.`,
    "Positive-work claims remain pending until a dated primary record, measurable result, and independent context are attached.",
    "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, contextualized, and paired with the official's response when available.",
    "Campaign-finance totals, donors, industries/PACs, expenditures, and reporting periods remain unpublished until the correct filer is matched.",
    "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
    "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
  ];
}

function identify(file) {
  const [width, height] = execFileSync("identify", ["-format", "%w %h", file], { encoding: "utf8" })
    .trim()
    .split(/\s+/)
    .map(Number);
  return { width, height, bytes: readFileSync(file).length };
}

async function downloadPortrait(url, destination, minimum = 500) {
  const response = await fetchResponse(url, { headers: { accept: "image/*,*/*" } });
  const bytes = Buffer.from(await response.arrayBuffer());
  const extension = extname(new URL(response.url).pathname) || extname(new URL(url).pathname) || ".img";
  const temporary = `${destination}-source${extension}`;
  writeFileSync(temporary, bytes);
  execFileSync("convert", [temporary, "-auto-orient", "-resize", "1600x1600>", "-quality", "88", "-strip", destination]);
  unlinkSync(temporary);
  const dimensions = identify(destination);
  if (Math.min(dimensions.width, dimensions.height) < minimum) {
    unlinkSync(destination);
    throw new Error(`Portrait failed ${minimum}px gate: ${dimensions.width}x${dimensions.height} from ${url}`);
  }
  return dimensions;
}

function parseHouseBiography(html, name, district) {
  const block = html.match(/<section id=["']biography["'][\s\S]*?<\/section>/i)?.[0] ?? "";
  const text = textFromHtml(block).replace(/^Biography\s*/i, "");
  if (!text) {
    return `${name} represents House District ${district} in the Texas House of Representatives. The current official House directory verifies the office and contact channels. RepWatchr also links the official committee, authored-bill, sponsored-bill, and record-vote paths while keeping finance, sentiment, praise, criticism, and constitutional analysis behind their evidence gates.`;
  }
  const clipped = text.length > 760 ? text.slice(0, 760).replace(/\s+\S*$/, "") : text;
  return clipped.endsWith(".") ? clipped : `${clipped}.`;
}

function repairCapitolAddress(value) {
  const address = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!address.includes("P.O. Box 12910")) throw new Error(`Unexpected Texas House office address: ${address}`);
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

async function buildHouseProfiles() {
  const roster = await fetchJson(HOUSE_ROSTER);
  const results = [];
  for (const [district, portraitMeta] of selectedHousePortraits) {
    const profileFile = join(ROOT, "src", "data", "officials", "state", `tx-house-hd${district}.json`);
    const profile = readJson(profileFile);
    const voteFile = join(ROOT, "src", "data", "vote-records", `${profile.id}.json`);
    const record = readJson(voteFile);
    const rosterMember = roster.find((member) => Number(member.id) === district);
    if (!rosterMember) throw new Error(`Current House roster missing HD-${district}`);
    const rosterName = houseNameOverrides.get(district)
      ?? textFromHtml(rosterMember.member_name).split(",").reverse().join(" ").trim();
    if (!normalizedName(rosterName).includes(normalizedName(profile.lastName))) {
      throw new Error(`House identity mismatch for HD-${district}: ${rosterName} vs ${profile.name}`);
    }
    const memberCode = String(rosterMember.member_bill_code);
    const officialUrl = `https://house.texas.gov/members/${memberCode}`;
    const biographyUrl = `${officialUrl}/biography`;
    const committeeUrl = `${officialUrl}/committees`;
    const [officialHtml, biographyHtml, committees] = await Promise.all([
      fetchText(officialUrl),
      fetchText(biographyUrl),
      fetchJson(`https://house.texas.gov/api/getMemberCommittees/${memberCode}`),
    ]);
    if (!normalizedName(textFromHtml(officialHtml)).includes(normalizedName(profile.lastName))) {
      throw new Error(`Official House page identity mismatch for HD-${district}`);
    }
    const destination = join(IMAGE_DIR, `${profile.id}.jpg`);
    const portrait = await downloadPortrait(portraitMeta.url, destination);
    profile.photo = `/images/officials/texas-accountability/${profile.id}.jpg`;
    profile.photoSourceUrl = portraitMeta.url;
    profile.photoCredit = portraitMeta.credit
      ?? "Texas State Directory Online elected-official portrait; identity cross-checked against the current official Texas House roster.";
    profile.photoRights = portraitMeta.rights
      ?? "Stored as an attributed delivery derivative of the Texas State Directory Online profile image; source provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.";

    const assignments = (Array.isArray(committees) ? committees : [])
      .map((committee) => committee.position && committee.position !== "Member"
        ? `${committee.committeeName} — ${committee.position}`
        : committee.committeeName)
      .filter(Boolean);
    const authoredUrl = `https://capitol.texas.gov/reports/report.aspx?ID=author&LegSess=89R&Code=A${memberCode}`;
    const sponsoredUrl = `https://capitol.texas.gov/reports/report.aspx?ID=sponsor&LegSess=89R&Code=A${memberCode}`;
    const latestVoteDate = record.votes.reduce((latest, vote) => vote.date > latest ? vote.date : latest, "");
    if (record.officialId !== profile.id || record.chamber !== "house" || record.level !== "state") {
      throw new Error(`Texas vote record identity mismatch for ${profile.id}`);
    }
    if (!record.summary?.totalVotesLoaded || record.votes?.length !== record.storedVoteRows) {
      throw new Error(`Incomplete Texas vote record for ${profile.id}`);
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
    profile.accountabilityNotes = guardedNotes("Texas House record-vote");
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
      sourceUrl: HOUSE_VOTES,
      reviewedAt: REVIEWED_AT,
      methodology: "RepWatchr indexes the member position printed in official Texas House record-vote material. Totals describe loaded positions in the stated collection window; they are not an attendance, ideology, constitutional, or performance score.",
    };
    profile.officialRecord = {
      type: "legislative",
      session: "89th Legislature",
      status: "record_level_vote_evidence_loaded",
      billsByAuthorUrl: authoredUrl,
      billsSponsoredUrl: sponsoredUrl,
      voteInformationUrl: HOUSE_VOTES,
      financeSourceUrl: TEXAS_FINANCE,
      note: "Official bill paths support legislation review. The voting summary is backed by source-linked official record-vote rows and is not a score.",
    };
    profile.campaignFinanceDisclosure = {
      status: "pending_review",
      sourceUrl: TEXAS_FINANCE,
      reviewedAt: REVIEWED_AT,
      note: "Totals, donors, industries/PACs, expenditures, and reporting period are withheld until the officeholder filer is matched without ambiguity.",
    };
    profile.sentimentDisclosure = {
      status: "pending_review",
      reviewedAt: REVIEWED_AT,
      note: "No sentiment is published without jurisdiction-confidence, sampling, collection-window, platform-mix, duplication/bot, and uncertainty disclosures.",
    };

    const portraitSourcePage = portraitMeta.sourcePage
      ?? `https://www.txdirectory.com/online/person/?id=${portraitMeta.profileId}`;
    const sources = [];
    for (const entry of [
      source("Official Texas House member page", officialUrl, ["identity", "office", "contact", "legislation_paths"]),
      source("Official current Texas House roster API", HOUSE_ROSTER, ["current_office", "district", "identity", "party"]),
      source("Official Texas House member directory", HOUSE_DIRECTORY, ["current_office", "district"]),
      source("Official Texas House biography", biographyUrl, ["biography"]),
      source("Official Texas House committee assignments", committeeUrl, ["committees", "leadership"]),
      source("Texas Legislature Online authored bills", authoredUrl, ["sponsored_legislation"]),
      source("Texas Legislature Online sponsored bills", sponsoredUrl, ["sponsored_legislation"]),
      source("Official Texas House votes-by-date ledger", HOUSE_VOTES, ["record_level_votes", "voting_record_summary", "roll_call_links"]),
      source("Texas Legislature Online vote-information guide", TEXAS_VOTE_GUIDE, ["voting_record_method", "record_vote_lookup"]),
      source("Texas Ethics Commission campaign-finance search", TEXAS_FINANCE, ["campaign_finance_source_path"]),
      source("Texas Secretary of State election archive", TEXAS_ELECTIONS, ["term", "election_history"]),
      source("Portrait source profile and provenance", portraitSourcePage, ["portrait", "portrait_provenance"]),
      source("Stored portrait source file", portraitMeta.url, ["portrait", "portrait_provenance"]),
      source(portraitMeta.sourcePage ? "Portrait license and provenance record" : "Texas State Directory roster and publisher context", portraitMeta.sourcePage ?? TX_DIRECTORY_ROOT, ["portrait_provenance", "portrait_license", "rights_recheck"]),
    ]) upsertSource(sources, entry);
    profile.sourceLinks = sources;
    profile.fieldFreshness = {
      identity: freshness("current", HOUSE_ROSTER, "Matched to the current official Texas House roster by district and full name."),
      portrait: freshness("current", profile.photoSourceUrl, `${portrait.width}x${portrait.height}; ${portrait.bytes} stored bytes; source was never upscaled.`),
      contact: freshness("current", officialUrl, "Capitol room, complete mailing address, telephone, email channel, and website were checked on the official member page."),
      term: freshness("current", TEXAS_ELECTIONS, "The current two-year House term and 2026 general-election cycle are disclosed; exact term-end remains labeled pending review."),
      assignments: freshness("current", committeeUrl, "Current committee and leadership assignments were loaded from the official House committee API."),
      biography: freshness("current", biographyUrl, "Concise biography derived from the official House biography page."),
      legislation: freshness("source_path_only", authoredUrl, "Official authored and sponsored bill paths are linked; individual bill findings require record-level review."),
      votingRecord: freshness("current", HOUSE_VOTES, `${record.summary.totalVotesLoaded.toLocaleString()} positions are indexed; ${record.storedVoteRows} source-linked rows are stored for display.`),
      campaignFinance: freshness("pending_review", TEXAS_FINANCE, "Filer identity and reporting period are not yet matched."),
      positiveWork: freshness("pending_review", biographyUrl, "No positive-work claim is published without a dated primary record, measurable result, and independent context."),
      criticism: freshness("pending_review", officialUrl, "No criticism or controversy is published without substantiation, attribution, date, context, and an official response when available."),
      sentiment: freshness("pending_review", officialUrl, "No constituent sentiment is published without jurisdiction-confidence and sampling disclosures."),
      constitutionalAlignment: freshness("pending_review", HOUSE_VOTES, "No score is published without cited votes, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis disclaimer."),
      officialRecord: freshness("current", HOUSE_VOTES, "Record-level vote rows are loaded; legislation remains linked at source-path depth."),
    };
    writeJson(profileFile, profile);
    results.push({ district: profile.district, id: profile.id, name: profile.name, portrait, indexedPositions: record.summary.totalVotesLoaded, storedVoteRows: record.storedVoteRows });
  }
  return results;
}

async function wikidataImages(bioguideIds) {
  const values = bioguideIds.map((id) => `"${id}"`).join(" ");
  const query = `SELECT ?id ?item ?itemLabel ?image WHERE { VALUES ?id { ${values} } ?item wdt:P1157 ?id. ?item wdt:P18 ?image. SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }`;
  const body = new URLSearchParams({ query, format: "json" });
  const payload = await (await fetchResponse(WIKIDATA_SPARQL, {
    method: "POST",
    body,
    headers: { accept: "application/sparql-results+json", "content-type": "application/x-www-form-urlencoded" },
  })).json();
  return new Map(payload.results.bindings.map((row) => [row.id.value, {
    image: row.image.value.replace("http://", "https://"),
    item: row.item.value.replace("http://", "https://"),
    label: row.itemLabel?.value,
  }]));
}

function commonsFileTitle(sourceUrl) {
  const marker = "/wiki/Special:FilePath/";
  const parsed = new URL(sourceUrl);
  if (!parsed.pathname.includes(marker)) throw new Error(`Unexpected Commons image URL: ${sourceUrl}`);
  return `File:${decodeURIComponent(parsed.pathname.split(marker)[1])}`;
}

async function commonsMetadata(sourceUrl) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    titles: commonsFileTitle(sourceUrl),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1400",
    origin: "*",
  });
  const payload = await fetchJson(`${COMMONS_API}?${params}`);
  const page = Object.values(payload.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url || !info?.descriptionurl) throw new Error(`Commons metadata missing for ${sourceUrl}`);
  const metadata = info.extmetadata ?? {};
  return {
    originalUrl: info.url,
    downloadUrl: info.thumburl ?? info.url,
    descriptionUrl: info.descriptionurl,
    originalWidth: info.width,
    originalHeight: info.height,
    artist: stripHtml(metadata.Artist?.value) || "U.S. House of Representatives",
    credit: stripHtml(metadata.Credit?.value) || "Official U.S. House portrait",
    license: stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value) || "License listed on Wikimedia Commons source page",
    licenseUrl: metadata.LicenseUrl?.value || info.descriptionurl,
  };
}

function parseClerkProfile(html, profile, district) {
  const title = decodeEntities(html.match(/<meta name="twitter:title" content="([^"]+)"/i)?.[1] ?? "");
  if (!normalizedName(title).includes(normalizedName(profile.lastName)) || !title.includes("Texas (TX)")) {
    throw new Error(`Clerk identity mismatch for ${profile.id}: ${title}`);
  }
  const districtValue = html.match(/id="stateDistrict"[^>]*value="([^"]+)"/i)?.[1] ?? "";
  if (Number.parseInt(districtValue, 10) !== district) throw new Error(`Clerk district mismatch for ${profile.id}: ${districtValue}`);
  const overview = html.match(/<section class="overviewAndContact">[\s\S]*?<\/section>/i)?.[0] ?? "";
  const office = textFromHtml(overview.match(/<span aria-label="\s*[^"']*House Office Building[^"']*"[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "");
  const addressText = textFromHtml(overview.match(/<span class="address">([\s\S]*?)<\/span>/i)?.[1] ?? "");
  const phone = overview.match(/Phone:\s*\(?([0-9]{3})\)?\s*([0-9]{3})-([0-9]{4})/i)?.slice(1).join("-");
  const website = overview.match(/Website:\s*<a href=([^\s>]+)/i)?.[1] ?? profile.contactInfo?.website;
  const partyBlock = html.match(/about_bio-copy[\s\S]*?<\/div>/i)?.[0] ?? "";
  const partyName = textFromHtml(partyBlock).match(/(?:\d+(?:st|nd|rd|th),)\s*(Republican|Democrat(?:ic)?)/i)?.[1];
  const description = decodeEntities(html.match(/<meta name="description" content="([^"]+)"/i)?.[1] ?? "");
  const committeeLinks = [...html.matchAll(/<a class="library-committeePanel-subItems" href="\/Committees\/[A-Z]{2}00"[^>]*>([^<]+)<\/a>/gi)]
    .map((match) => textFromHtml(match[1]))
    .filter(Boolean);
  const committees = [...new Set(committeeLinks.length
    ? committeeLinks
    : (description.split("COMMITTEE:")[1]?.split(/,(?=Committee|Permanent Select)/).map((value) => value.trim()).filter(Boolean) ?? []))];
  if (!office || !addressText || !phone || !website || !partyName || !committees.length) {
    throw new Error(`Incomplete current Clerk profile for ${profile.id}`);
  }
  return {
    office: `${office}, ${addressText}`.replace(/\s+/g, " "),
    phone,
    website,
    party: partyName?.startsWith("Republican") ? "R" : "D",
    committees,
  };
}

async function buildFederalProfiles() {
  const profiles = selectedFederalDistricts.map((district) => {
    const file = join(ROOT, "src", "data", "officials", "federal", `us-house-tx${district}.json`);
    return { district, file, profile: readJson(file) };
  });
  const images = await wikidataImages(profiles.map(({ profile }) => profile.bioguideId));
  const results = [];
  for (const { district, file, profile } of profiles) {
    const clerkUrl = `https://clerk.house.gov/members/${profile.bioguideId}`;
    const clerkHtml = await fetchText(clerkUrl);
    const clerk = parseClerkProfile(clerkHtml, profile, district);
    if (clerk.party !== profile.party) throw new Error(`Party mismatch for ${profile.id}: ${clerk.party} vs ${profile.party}`);
    const match = images.get(profile.bioguideId);
    if (!match) throw new Error(`No identity-backed Wikimedia portrait for ${profile.id}`);
    const commons = await commonsMetadata(federalPortraitOverrides.get(profile.bioguideId) ?? match.image);
    if (Math.min(commons.originalWidth, commons.originalHeight) < 500) {
      throw new Error(`Original Commons portrait below gate for ${profile.id}: ${commons.originalWidth}x${commons.originalHeight}`);
    }
    const imageDir = join(FEDERAL_IMAGE_DIR, profile.id);
    mkdirSync(imageDir, { recursive: true });
    const destination = join(imageDir, "portrait.jpg");
    const portrait = await downloadPortrait(commons.downloadUrl, destination);
    profile.photo = `/images/officials/federal/${profile.id}/portrait.jpg`;
    profile.photoSourceUrl = commons.descriptionUrl;
    profile.photoCredit = `${commons.credit}; ${commons.artist}; Wikimedia Commons.`;
    profile.photoRights = `${commons.license}; license and provenance recorded at ${commons.descriptionUrl}.`;
    profile.contactInfo = {
      office: clerk.office,
      phone: clerk.phone,
      email: clerk.website,
      website: clerk.website,
    };
    profile.committeeAssignments = clerk.committees;
    profile.termStart = "2025-01-03";
    profile.termEnd = "2027-01-03";
    profile.nextElection = "2026 general election";
    profile.reviewStatus = "record_enriched";
    profile.lastVerifiedAt = REVIEWED_AT;

    const voteFile = join(ROOT, "src", "data", "vote-records", `${profile.id}.json`);
    const record = readJson(voteFile);
    if (record.officialId !== profile.id || record.chamber !== "house" || record.level !== "federal") {
      throw new Error(`Federal vote record identity mismatch for ${profile.id}`);
    }
    if (!record.summary?.totalVotesLoaded || record.votes.length !== record.storedVoteRows || record.votes.some((vote) => !vote.sourceUrl || !vote.voteCast || !vote.date)) {
      throw new Error(`Incomplete federal vote record for ${profile.id}`);
    }
    const congressSlug = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const congressMemberUrl = `https://www.congress.gov/member/${congressSlug}/${profile.bioguideId}`;
    const legislationUrl = `${congressMemberUrl}?q=%7B%22sponsorship%22%3A%22sponsored%22%7D`;
    const bioguideUrl = `https://bioguide.congress.gov/search/bio/${profile.bioguideId}`;
    const latestVoteDate = record.votes.reduce((latest, vote) => vote.date > latest ? vote.date : latest, "");
    profile.bio = `${profile.name} represents Texas's ${ordinal(district)} Congressional District in the U.S. House. The current Clerk profile verifies the office, contact details, party, and assignments to ${clerk.committees.join(" and ")}. RepWatchr links the official sponsorship and roll-call records and does not turn source availability into an uncited performance judgment.`;
    profile.accountabilityNotes = guardedNotes("U.S. House roll-call");
    profile.votingRecordEvidence = {
      status: "record_level_evidence_loaded",
      chamber: "U.S. House",
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
      sourceUrl: CLERK_VOTES,
      reviewedAt: REVIEWED_AT,
      methodology: "RepWatchr indexes the member position printed in official Clerk roll-call material. Totals describe loaded positions in the stated collection window; they are not an attendance, ideology, constitutional, or performance score.",
    };
    profile.officialRecord = {
      type: "legislative",
      session: record.session,
      status: "record_level_vote_evidence_loaded",
      billsSponsoredUrl: legislationUrl,
      voteInformationUrl: CLERK_VOTES,
      financeSourceUrl: FEC_CANDIDATES,
      note: "Official sponsorship and roll-call paths support record review; no source path is treated as a favorable or unfavorable finding by itself.",
    };
    profile.campaignFinanceDisclosure = {
      status: "pending_review",
      sourceUrl: FEC_CANDIDATES,
      reviewedAt: REVIEWED_AT,
      note: "Candidate/committee identity, reporting period, receipts, donors, industries/PACs, and expenditures remain withheld until filer-level reconciliation is complete.",
    };
    profile.sentimentDisclosure = {
      status: "pending_review",
      reviewedAt: REVIEWED_AT,
      note: "No sentiment is published without district-confidence, sampling, collection-window, platform-mix, duplication/bot, and uncertainty disclosures.",
    };
    profile.sourceLinks = [
      source("Office of the Clerk current member profile", clerkUrl, ["identity", "current_office", "district", "party", "contact", "committees"]),
      source("Official congressional website", clerk.website, ["contact", "constituent_service", "biography_context"]),
      source("Congress.gov current member directory", CONGRESS_MEMBERS, ["current_office", "identity"]),
      source("Congress.gov member and service profile", congressMemberUrl, ["identity", "service_history", "legislation"]),
      source("Congress.gov sponsored legislation", legislationUrl, ["sponsored_legislation", "bill_status", "official_actions"]),
      source("Biographical Directory of the United States Congress", bioguideUrl, ["identity", "biography", "service_history", "term"]),
      source("Office of the Clerk 2026 roll-call index", CLERK_VOTES, ["record_level_votes", "voting_record_summary", "roll_call_links"]),
      source("Office of the Clerk member-vote search", CLERK_VOTE_GUIDE, ["voting_record_method", "member_vote_lookup"]),
      source("Federal Election Commission candidate search", FEC_CANDIDATES, ["campaign_finance_source_path"]),
      source("Federal Election Commission filing search", FEC_FILINGS, ["campaign_finance_reporting_periods", "expenditures_source_path"]),
      source("U.S. Constitution, Article I", ARTICLE_ONE, ["constitutional_authority", "house_terms", "federal_legislative_power"]),
      source("Wikidata Bioguide identity match", match.item, ["portrait_identity_match", "bioguide_id"]),
      source("Wikimedia Commons portrait and license record", commons.descriptionUrl, ["portrait", "portrait_provenance", "portrait_license"]),
      source("Wikimedia Commons license link", commons.licenseUrl, ["portrait_license", "rights_recheck"]),
    ];
    profile.fieldFreshness = {
      identity: freshness("current", clerkUrl, "Full name, current Texas district, party, and 119th Congress membership verified on the Clerk profile."),
      portrait: freshness("current", commons.descriptionUrl, `${portrait.width}x${portrait.height}; ${portrait.bytes} stored bytes; original ${commons.originalWidth}x${commons.originalHeight}; ${commons.license}; never upscaled.`),
      contact: freshness("current", clerkUrl, "Washington office, full mailing address, phone, and official website were parsed from the current Clerk profile."),
      term: freshness("current", clerkUrl, "Clerk oath date and 119th Congress service support the January 3, 2025 through January 3, 2027 House term and 2026 election cycle."),
      assignments: freshness("current", clerkUrl, "Current standing/select committee assignments were loaded from the Clerk profile."),
      biography: freshness("current", bioguideUrl, "Concise service biography combines the current Clerk assignment with the official Bioguide path."),
      legislation: freshness("source_path_only", legislationUrl, "Official sponsored-legislation results are linked; individual bill findings require record-level review."),
      votingRecord: freshness("current", CLERK_VOTES, `${record.summary.totalVotesLoaded.toLocaleString()} positions are indexed; ${record.storedVoteRows} recent source-linked rows are stored for display.`),
      officialRecord: freshness("current", CLERK_VOTES, "Record-level roll-call evidence is loaded; sponsorship remains linked at source-path depth."),
      campaignFinance: freshness("pending_review", FEC_CANDIDATES, "Candidate and committee filer identities and reporting periods are not yet reconciled."),
      positiveWork: freshness("pending_review", congressMemberUrl, "No positive-work claim is published without a dated primary record, measurable result, and independent context."),
      criticism: freshness("pending_review", clerkUrl, "No criticism or controversy is published without substantiation, attribution, date, context, and an official response when available."),
      sentiment: freshness("pending_review", clerkUrl, "No constituent sentiment is published without district-confidence and sampling disclosures."),
      constitutionalAlignment: freshness("pending_review", ARTICLE_ONE, "No score is published without cited votes, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis disclaimer."),
    };
    writeJson(file, profile);
    results.push({ district: profile.district, id: profile.id, name: profile.name, portrait, license: commons.license, indexedPositions: record.summary.totalVotesLoaded, storedVoteRows: record.storedVoteRows, committees: clerk.committees });
  }
  return results;
}

mkdirSync(IMAGE_DIR, { recursive: true });
mkdirSync(FEDERAL_IMAGE_DIR, { recursive: true });
const scope = process.env.PROFILE_SCOPE ?? "all";
const house = scope === "federal" ? [] : await buildHouseProfiles();
const federal = scope === "house" ? [] : await buildFederalProfiles();
const expectedHouse = scope === "federal" ? 0 : selectedHousePortraits.size;
const expectedFederal = scope === "house" ? 0 : selectedFederalDistricts.length;
if (house.length !== expectedHouse || federal.length !== expectedFederal) {
  throw new Error(`Expected ${expectedHouse} House and ${expectedFederal} federal profiles; received ${house.length} and ${federal.length}`);
}
console.log(JSON.stringify({ reviewedAt: REVIEWED_AT, count: house.length + federal.length, house, federal }, null, 2));
