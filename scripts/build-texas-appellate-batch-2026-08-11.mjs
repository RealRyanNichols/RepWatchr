import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-11";
const outputDir = path.join(ROOT, "src/data/officials/state");
const imageDir = path.join(ROOT, "public/images/officials/texas-accountability");
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(imageDir, { recursive: true });

// A sober Texas judicial record desk: portrait and place first, official opinions
// and case records next, unsupported judgment visibly withheld.
const courts = {
  1: {
    ordinal: "First",
    code: "01",
    contact: "First Court of Appeals, 301 Fannin Street, Houston, TX 77002-2066",
    phone: "713-274-2700",
    contactUrl: "https://www.txcourts.gov/1stcoa/contact-us/",
    rosterUrl: "https://www.txcourts.gov/1stcoa/about-the-court/justices/",
    oralUrl: "https://search.txcourts.gov/SubmissionsArchive.aspx?coa=coa01&s=c",
  },
  2: {
    ordinal: "Second",
    code: "02",
    contact: "Tim Curry Criminal Justice Center, 401 West Belknap, Suite 9000, Fort Worth, TX 76196-0211",
    phone: "817-884-1900",
    contactUrl: "https://www.txcourts.gov/2ndcoa/contact-us/",
    rosterUrl: "https://www.txcourts.gov/2ndcoa/about-the-court/justices/",
    oralUrl: "https://www.txcourts.gov/2ndcoa/practice-before-the-court/oral-arguments/",
  },
  3: {
    ordinal: "Third",
    code: "03",
    contact: "Third Court of Appeals, P.O. Box 12547, Austin, TX 78711",
    phone: "512-463-1733",
    contactUrl: "https://www.txcourts.gov/3rdcoa/contact-us/",
    rosterUrl: "https://www.txcourts.gov/3rdcoa/about-the-court/justices/",
    oralUrl: "https://www.txcourts.gov/3rdcoa/oral-argument-audio/",
  },
  4: {
    ordinal: "Fourth",
    code: "04",
    contact: "Cadena-Reeves Justice Center, 300 Dolorosa, Suite 3200, San Antonio, TX 78205-3037",
    phone: "210-335-2635",
    contactUrl: "https://www.txcourts.gov/4thcoa/contact-us/",
    rosterUrl: "https://www.txcourts.gov/4thcoa/about-the-court/justices/",
    oralUrl: "https://www.txcourts.gov/4thcoa/",
  },
};

const judges = [
  [1, 1, "Terry Adams", "R", "chief-justice-terry-adams", 2022],
  [1, 2, "Jennifer Caughey", "R", "justice-jennifer-caughey", 2024],
  [1, 3, "Veronica Rivas-Molloy", "D", "justice-veronica-rivas-molloy", 2020],
  [1, 4, "David M. Gunn", "R", "justice-david-m-gunn", null],
  [1, 5, "Amparo \"Amy\" Guerra", "D", "justice-amparo-amy-guerra", 2020],
  [1, 6, "Andrew Johnson", "R", "justice-andrew-johnson", 2024],
  [1, 7, "Clint Morgan", "R", "justice-clint-morgan", 2024],
  [1, 8, "Kristin Guiney", "R", "justice-kristin-guiney", 2024],
  [1, 9, "Susanna Dokupil", "R", "justice-susanna-dokupil", 2024],
  [2, 1, "Bonnie Sudderth", "R", "chief-justice-bonnie-sudderth", null],
  [2, 2, "Dana Womack", "R", "justice-dana-womack", null],
  [2, 3, "Elizabeth Kerr", "R", "justice-elizabeth-kerr", null],
  [2, 4, "J. Wade Birdwell", "R", "justice-j-wade-birdwell", null],
  [2, 5, "Dabney Bassel", "R", "justice-dabney-bassel", null],
  [2, 6, "Mike Wallach", "R", "justice-mike-wallach", null],
  [2, 7, "Brian Walker", "R", "justice-brian-walker", null],
  [3, 1, "Darlene Byrne", "D", "chief-justice-darlene-byrne", 2020],
  [3, 2, "Maggie Ellis", "D", "justice-maggie-ellis", 2024],
  [3, 3, "Chari L. Kelly", "D", "justice-chari-l-kelly", 2020],
  [3, 4, "Rosa Lopez Theofanis", "D", "justice-rosa-lopez-theofanis", null],
  [3, 5, "Karin Crump", "R", "justice-karin-crump", 2024],
  [3, 6, "Gisela D. Triana", "D", "justice-gisela-d-triana", 2020],
  [4, 1, "Rebeca Martinez", "D", "chief-justice-rebeca-martinez", 2020],
  [4, 2, "Velia J. Meza", "D", "justice-velia-j-meza", 2024],
  [4, 3, "H. Todd McCray", "R", "justice-h-todd-mccray", 2024],
  // Lori Massey Brissette is intentionally deferred: the current official image is only 300x413.
  [4, 5, "Adrian A. Spears II", "R", "justice-adrian-a-spears-ii", 2024],
  // Irene Rios and Lori I. Valenzuela are deferred with Brissette: official images are 300x413.
].map(([court, place, name, party, pageSlug, electionYear]) => ({ court, place, name, party, pageSlug, electionYear }));

function decode(text) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(text) {
  const cleaned = decode(text);
  const match = cleaned.match(/^(.{40,520}?[.!?])(?:\s|$)/);
  return (match?.[1] || cleaned.slice(0, 420)).trim();
}

function slugify(name) {
  return name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

async function savePortrait(url, id) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Portrait fetch failed ${response.status}: ${url}`);
  const temp = path.join(os.tmpdir(), `${id}-${Date.now()}`);
  fs.writeFileSync(temp, Buffer.from(await response.arrayBuffer()));
  const destination = path.join(imageDir, `${id}.jpg`);
  execFileSync("convert", [temp, "-auto-orient", "-resize", "800x800>", "-strip", "-quality", "78", destination]);
  fs.unlinkSync(temp);
  const [width, height] = execFileSync("identify", ["-format", "%w %h", destination], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
  if (Math.min(width, height) < 500) throw new Error(`${id} portrait below 500px: ${width}x${height}`);
  return { destination, width, height };
}

for (const judge of judges) {
  const court = courts[judge.court];
  const detailUrl = `${court.rosterUrl}${judge.pageSlug}/`;
  const response = await fetch(detailUrl);
  if (!response.ok) throw new Error(`Biography fetch failed ${response.status}: ${detailUrl}`);
  const html = await response.text();
  const h1 = decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  if (!h1.toLowerCase().includes(judge.name.split(" ").at(-1).toLowerCase())) throw new Error(`Identity mismatch for ${judge.name}: ${h1}`);
  const imageTag = html.match(/<img[^>]+class=["'][^"']*bioImage[^"']*["'][^>]*>/i)?.[0] || "";
  const imagePath = imageTag.match(/src=["']([^"']+)/i)?.[1];
  if (!imagePath) throw new Error(`No official portrait for ${judge.name}`);
  const imageUrl = new URL(imagePath, detailUrl).href;
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || html;
  const paragraphs = [...main.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => decode(match[1])).filter((item) => item.length > 40);
  const officialIntro = firstSentence(paragraphs[0] || `${judge.name} serves on the ${court.ordinal} Court of Appeals.`);
  const id = `tx-coa-${judge.court}-place-${judge.place}-${slugify(judge.name)}`;
  const portrait = await savePortrait(imageUrl, id);
  const isChief = judge.place === 1 && h1.toLowerCase().includes("chief");
  const position = `${isChief ? "Chief Justice" : "Justice"}, ${court.ordinal} Court of Appeals`;
  const election = judge.electionYear
    ? {
        termStart: `${judge.electionYear + 1}-01-01`,
        termEnd: `${judge.electionYear + 6}-12-31`,
        nextElection: `${judge.electionYear + 6} general election`,
      }
    : { nextElection: "Pending authoritative election-cycle match" };
  const caseUrl = `https://search.txcourts.gov/CaseSearch.aspx?coa=coa${court.code}&s=c`;
  const documentUrl = `https://search.txcourts.gov/CaseSearch.aspx?coa=coa${court.code}&s=d&d=1`;
  const opinionUrl = `https://search.txcourts.gov/DocketSrch.aspx?coa=coa${court.code}`;
  const nameParts = judge.name.split(" ");
  const suffixes = new Set(["II", "III", "IV", "Jr.", "Sr."]);
  const profile = {
    id,
    name: judge.name,
    firstName: nameParts[0].replace(/[^A-Za-z'-]/g, ""),
    lastName: nameParts[suffixes.has(nameParts.at(-1)) ? nameParts.length - 2 : nameParts.length - 1].replace(/[^A-Za-z'-]/g, ""),
    party: judge.party,
    level: "state",
    position,
    district: `${court.ordinal} Court of Appeals, Place ${judge.place}`,
    jurisdiction: `${court.ordinal} Court of Appeals District, Texas`,
    county: ["Texas"],
    ...election,
    contactInfo: { office: court.contact, phone: court.phone, website: detailUrl },
    bio: `${judge.name} serves as ${position}, Place ${judge.place}. The official court biography states: ${officialIntro} RepWatchr treats opinions, orders, case records, and oral arguments as the role-compatible accountability record; legislative roll calls are not substituted for judicial work.`,
    campaignPromises: [],
    reviewStatus: "source_seeded",
    state: "TX",
    sourceLinks: [
      source(`Official ${court.ordinal} Court biography`, detailUrl, ["identity", "office", "biography"]),
      source(`Official ${court.ordinal} Court roster`, court.rosterUrl, ["current_office", "place", "leadership"]),
      source(`Official ${court.ordinal} Court contact page`, court.contactUrl, ["contact", "office"]),
      source(`Official ${court.ordinal} Court case search`, caseUrl, ["judicial_record", "case_record"]),
      source(`Official ${court.ordinal} Court document search`, documentUrl, ["judicial_record", "opinions", "orders"]),
      source(`Official ${court.ordinal} Court orders and opinions`, opinionUrl, ["judicial_record", "opinions", "orders"]),
      source(`Official ${court.ordinal} Court oral-argument path`, court.oralUrl, ["oral_arguments", "judicial_record"]),
      source("Texas Judicial Branch courts-of-appeals overview", "https://www.txcourts.gov/about-texas-courts/courts-of-appeals.aspx", ["jurisdiction", "office_structure"]),
      source("Texas Secretary of State election-results archive", "https://www.sos.state.tx.us/elections/historical/index.shtml", ["election_history", "party", "term"]),
      source("Texas Ethics Commission campaign-finance search", "https://www.ethics.state.tx.us/search/cf/", ["campaign_finance_source_path"]),
      source("State Commission on Judicial Conduct", "https://www.scjc.texas.gov/", ["judicial_conduct_source_path"]),
      source("Texas Constitution, Article V", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm", ["constitutional_authority", "office_structure", "term_length"]),
      source("Official Texas Judicial Branch portrait", imageUrl, ["portrait", "portrait_provenance"]),
    ],
    lastVerifiedAt: REVIEWED_AT,
    photo: `/images/officials/texas-accountability/${id}.jpg`,
    photoSourceUrl: imageUrl,
    photoCredit: "Official Texas Judicial Branch portrait.",
    photoRights: "Official public-profile portrait; source provenance is retained and reuse rights should be rechecked before redistribution outside RepWatchr.",
    accountabilityNotes: [
      "Role-compatible accountability is based on opinions, orders, case records, and oral arguments; legislative roll calls are not substituted where they do not apply.",
      "Positive-work claims remain pending until a primary record, date, measurable result, and independent context are attached.",
      "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
      "Campaign-finance totals, donors, industries/PACs, and expenditures remain unpublished until the correct filer and reporting period are matched.",
      "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
      "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
    ],
    fieldFreshness: {},
    committeeAssignments: [],
  };
  const freshness = (status, sourceUrl, note) => ({ status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) });
  profile.fieldFreshness = {
    identity: freshness("current", court.rosterUrl),
    portrait: freshness("current", imageUrl, `Stored official portrait; verified at ${portrait.width} by ${portrait.height} pixels.`),
    contact: freshness("current", court.contactUrl),
    term: freshness(judge.electionYear ? "current" : "pending_review", "https://www.sos.state.tx.us/elections/historical/index.shtml", judge.electionYear ? "Election year is stated by the official biography or election record; the six-year end date is derived from Texas Constitution Article V." : "Current service is verified; exact current-term election record remains to be matched."),
    assignments: freshness("not_applicable", court.rosterUrl, "No standing legislative committee assignment applies to this judicial office."),
    legislation: freshness("not_applicable", opinionUrl, "Sponsored legislation is not a function of this judicial office."),
    votingRecord: freshness("not_applicable", opinionUrl, "Legislative roll calls do not apply; the role-compatible official record is linked separately."),
    officialRecord: freshness("source_path_only", opinionUrl, "Individual opinions, orders, and case actions require record-level editorial review before evaluation."),
    campaignFinance: freshness("pending_review", "https://www.ethics.state.tx.us/search/cf/", "Filer identity and reporting period are not yet matched."),
    positiveWork: freshness("pending_review", detailUrl),
    criticism: freshness("pending_review", detailUrl),
    sentiment: freshness("pending_review", court.rosterUrl),
    constitutionalAlignment: freshness("pending_review", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm"),
  };
  fs.writeFileSync(path.join(outputDir, `${id}.json`), `${JSON.stringify(profile, null, 2)}\n`);
}

const waynePath = path.join(ROOT, "src/data/officials/statewide/tx/tx-rrc-wayne-christian.json");
const deferredBrissetteImage = path.join(imageDir, "tx-coa-4-place-4-lori-massey-brissette.jpg");
if (fs.existsSync(deferredBrissetteImage)) fs.unlinkSync(deferredBrissetteImage);
for (const deferred of ["tx-coa-4-place-6-irene-rios.jpg", "tx-coa-4-place-7-lori-i-valenzuela.jpg"]) {
  const deferredPath = path.join(imageDir, deferred);
  if (fs.existsSync(deferredPath)) fs.unlinkSync(deferredPath);
}
const wayne = JSON.parse(fs.readFileSync(waynePath, "utf8"));
const wayneImageUrl = "https://directory.texastribune.org/static/images/headshots/Wayne%20Christian.jpg";
const waynePortrait = await savePortrait(wayneImageUrl, wayne.id);
Object.assign(wayne, {
  photo: `/images/officials/texas-accountability/${wayne.id}.jpg`,
  photoSourceUrl: wayneImageUrl,
  photoCredit: "Published Texas Tribune elected-official directory portrait; identity cross-checked against the official Railroad Commission roster.",
  photoRights: "Published editorial directory portrait; provenance is retained and reuse rights should be rechecked before redistribution outside RepWatchr.",
  contactInfo: {
    office: "Railroad Commission of Texas, 1701 N. Congress Avenue, Austin, TX 78701",
    phone: "512-463-7140",
    website: "https://www.rrc.texas.gov/about-us/commissioners/wayne-christian/",
  },
  bio: "Wayne Christian serves as a statewide elected Railroad Commissioner of Texas. The official commission biography identifies his regulatory role, while RepWatchr keeps agency actions, campaign finance, public response, and any evaluative claims separated by evidence status. No finance total, sentiment finding, controversy, or constitutional score is published here until its underlying records pass person-level review.",
  reviewStatus: "source_seeded",
  lastVerifiedAt: REVIEWED_AT,
  nextElection: "2028 general election",
  committeeAssignments: [],
  accountabilityNotes: [
    "Role-compatible accountability is based on commission votes, orders, rules, open meetings, and agency records; legislative roll calls are not substituted where they do not apply.",
    "Positive-work claims and criticism remain pending until each claim has a dated primary record, measurable result, independent context, and an official response when applicable.",
    "Campaign-finance totals, donors, industries/PACs, and expenditures remain unpublished until the correct filer and reporting period are matched.",
    "Texas-wide sentiment remains unpublished until the collection window, source mix, geography-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
    "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
  ],
});
wayne.sourceLinks = [
  source("Official commissioner biography", wayne.contactInfo.website, ["identity", "office", "biography"]),
  source("Official current-commissioner roster", "https://www.rrc.texas.gov/about-us/commissioners/", ["current_office", "leadership"]),
  source("Official Railroad Commission contact directory", "https://www.rrc.texas.gov/about-us/contact-us/", ["contact", "office"]),
  source("Official Railroad Commission open meetings", "https://www.rrc.texas.gov/general-counsel/open-meetings/", ["official_record", "commission_votes"]),
  source("Official Railroad Commission orders", "https://www.rrc.texas.gov/general-counsel/orders/", ["official_record", "orders"]),
  source("Official Railroad Commission rules", "https://www.rrc.texas.gov/general-counsel/rules/", ["official_record", "rules"]),
  source("Texas Ethics Commission campaign-finance search", "https://www.ethics.state.tx.us/search/cf/", ["campaign_finance_source_path"]),
  source("Texas Secretary of State election-results archive", "https://www.sos.state.tx.us/elections/historical/index.shtml", ["election_history", "party", "term"]),
  source("Texas Constitution, Article XVI", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm", ["constitutional_authority", "office_structure"]),
  source("Railroad Commission public data and statistics", "https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/", ["agency_performance_source_path"]),
  source("Texas Tribune elected-official directory", "https://directory.texastribune.org/wayne-christian/", ["biography_context", "portrait_publisher"]),
  source("Published portrait image", wayneImageUrl, ["portrait", "portrait_provenance"]),
];
const wf = (status, sourceUrl, note) => ({ status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) });
wayne.fieldFreshness = {
  identity: wf("current", "https://www.rrc.texas.gov/about-us/commissioners/"),
  portrait: wf("current", wayneImageUrl, `Stored publisher portrait; verified at ${waynePortrait.width} by ${waynePortrait.height} pixels.`),
  contact: wf("current", "https://www.rrc.texas.gov/about-us/contact-us/"),
  term: wf("current", "https://www.sos.state.tx.us/elections/historical/index.shtml"),
  assignments: wf("not_applicable", wayne.contactInfo.website, "No standing legislative committee assignment applies to this statewide regulatory office."),
  legislation: wf("not_applicable", "https://www.rrc.texas.gov/general-counsel/rules/", "Sponsored legislation is not a function of this regulatory office."),
  votingRecord: wf("not_applicable", "https://www.rrc.texas.gov/general-counsel/open-meetings/", "Legislative roll calls do not apply; commission votes and orders are linked as the role-compatible record."),
  officialRecord: wf("source_path_only", "https://www.rrc.texas.gov/general-counsel/open-meetings/", "Individual commission actions require record-level editorial review before evaluation."),
  campaignFinance: wf("pending_review", "https://www.ethics.state.tx.us/search/cf/", "Filer identity and reporting period are not yet matched."),
  positiveWork: wf("pending_review", wayne.contactInfo.website),
  criticism: wf("pending_review", wayne.contactInfo.website),
  sentiment: wf("pending_review", wayne.contactInfo.website),
  constitutionalAlignment: wf("pending_review", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm"),
};
fs.writeFileSync(waynePath, `${JSON.stringify(wayne, null, 2)}\n`);

console.log(`Built ${judges.length + 1} Texas profiles with stored portraits.`);
