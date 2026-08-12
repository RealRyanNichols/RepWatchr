import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-12";
const outputDir = path.join(ROOT, "src/data/officials/state");
const imageDir = path.join(ROOT, "public/images/officials/texas-accountability");
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(imageDir, { recursive: true });

const courts = {
  4: ["Fourth", "04", "Cadena-Reeves Justice Center, 300 Dolorosa, Suite 3200, San Antonio, TX 78205-3037", "210-335-2635"],
  5: ["Fifth", "05", "George L. Allen, Sr. Courts Building, 600 Commerce Street, Suite 200, Dallas, TX 75202-4658", "214-712-3400"],
  7: ["Seventh", "07", "350 SE 6th Avenue, Suite 2C, Amarillo, TX 79101", "806-342-2650"],
  9: ["Ninth", "09", "1001 Pearl Street, Suite 330, Beaumont, TX 77701", "409-835-8402"],
  10: ["Tenth", "10", "501 Washington Avenue, Room 415, Waco, TX 76701", "254-757-5200"],
  12: ["Twelfth", "12", "1517 West Front Street, Suite 354, Tyler, TX 75702", "903-593-8471"],
  13: ["Thirteenth", "13", "901 Leopard Street, 10th Floor, Corpus Christi, TX 78401", "361-888-0416"],
  14: ["Fourteenth", "14", "1910 Courthouse, 301 Fannin Street, Room 245, Houston, TX 77002", "713-274-2800"],
  15: ["Fifteenth", "15", "William P. Clements Building, 300 West 15th Street, Suite 607, Austin, TX 78701", "512-463-1610"],
};

const wp = "Candidate/justice portrait published by Texas Judges; source provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.";
const judges = [
  [4, 4, "Lori Massey Brissette", "D", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/Lori_Massey_Brissette.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 1, "J.J. Koch", "R", 2024, "https://static.wixstatic.com/media/d13346_e216be2c091c4d1980f175631d1cc48d~mv2.jpg", "Official Koch campaign portrait", "Official campaign-published portrait; source provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr."],
  [5, 5, "Cynthia M. Barbare", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/10/cynthia-barbare2.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 9, "Tina Clinton", "D", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/tina_clinton.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 10, "Earl Jackson", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/earl_jackson-scaled.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 11, "Gino J. Rossini", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/02/gino-rossini.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 7, "Nancy Kennedy", "D", 2022, "https://texasjudges.org/wp-content/uploads/2022/04/nancy_kennedy_bordered.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 8, "Dennise Garcia", "D", 2022, "https://texasjudges.org/wp-content/uploads/2024/01/dennise-garcia.jpg", "Texas Judges candidate/justice portrait", wp],
  [5, 13, "Emily Miskel", "R", 2022, "https://texasjudges.org/wp-content/uploads/2022/03/Emiskel_bordered-1.png", "Texas Judges candidate/justice portrait", wp],
  [7, 3, "Alex L. Yarbrough", "R", 2022, "https://texasjudges.org/wp-content/uploads/2022/10/Alex_Yarbrough.jpeg", "Texas Judges candidate/justice portrait", wp],
  [7, 4, "Lawrence M. Doss", "R", 2024, "https://texasjudges.org/wp-content/uploads/2021/04/justice-lawrence-m-doss-1-scaled.jpg", "Texas Judges candidate/justice portrait", wp],
  [9, 2, "Jay Wright", "R", 2022, "https://texasjudges.org/wp-content/uploads/2022/02/Jay_Wright_cropped-1.jpg", "Texas Judges candidate/justice portrait", wp],
  [9, 4, "Kent Chambers", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/kent_chambers.jpg", "Texas Judges candidate/justice portrait", wp],
  [10, 2, "Lee Harris", "R", 2024, "https://texasjudges.org/wp-content/uploads/2025/05/justice-lee-harris.png", "Texas Judges candidate/justice portrait", wp],
  [12, 2, "Brian T. Hoyle", "R", 2020, "https://texasjudges.org/wp-content/uploads/2025/08/justice-brian-hoyle.png", "Texas Judges candidate/justice portrait", wp],
  [12, 3, "C. Michael Davis", "R", null, "https://texasjudges.org/wp-content/uploads/2025/10/Michael-Davis.jpg", "Texas Judges candidate/justice portrait", wp],
  [13, 1, "Jaime E. Tijerina", "R", 2020, "https://texasjudges.org/wp-content/uploads/2019/07/jaime-tijerina.jpg", "Texas Judges candidate/justice portrait", wp],
  [13, 2, "Jenny Cron", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/JennyCron.jpg", "Texas Judges candidate/justice portrait", wp],
  [14, 3, "Chad Bridges", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/02/chad-bridges-scaled-1.jpg", "Texas Judges candidate/justice portrait", wp],
  [14, 4, "Tonya McLaughlin", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/tonya-mclaughlin_bordered-scaled.jpg", "Texas Judges candidate/justice portrait", wp],
  [14, 6, "Katy Boatman", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/katy-boatman.png", "Texas Judges candidate/justice portrait", wp],
  [14, 7, "Ken Wise", "R", 2020, "https://texasjudges.org/wp-content/uploads/2025/04/texas-talk_ken-wise_webp.jpg", "Texas Judges justice portrait", wp],
  [14, 8, "Brad Hart", "R", 2024, "https://texasjudges.org/wp-content/uploads/2024/01/brad_hart.jpg", "Texas Judges candidate/justice portrait", wp],
  [14, 9, "Randy Wilson", "R", 2022, "https://texasjudges.org/wp-content/uploads/2022/10/RandyWWilson_bordered.jpg", "Texas Judges candidate/justice portrait", wp],
  [15, 1, "Scott Brister", "R", null, "https://texasjudges.org/wp-content/uploads/2024/06/Brister_Scott_hiresRGB_12_2012.jpg", "Texas Judges candidate/justice portrait", wp],
].map(([court, place, name, party, electionYear, imageUrl, photoCredit, photoRights]) => ({ court, place, name, party, electionYear, imageUrl, photoCredit, photoRights }));

function slugify(name) {
  return name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function source(title, url, supports) {
  return { title, url, accessedAt: REVIEWED_AT, supports };
}

async function savePortrait(url, id) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`Portrait fetch failed ${response.status}: ${url}`);
  const temp = path.join(os.tmpdir(), `${id}-${Date.now()}`);
  fs.writeFileSync(temp, Buffer.from(await response.arrayBuffer()));
  const destination = path.join(imageDir, `${id}.jpg`);
  execFileSync("convert", [temp, "-auto-orient", "-resize", "800x800>", "-strip", "-quality", "78", destination]);
  fs.unlinkSync(temp);
  const [width, height] = execFileSync("identify", ["-format", "%w %h", destination], { encoding: "utf8" }).trim().split(/\s+/).map(Number);
  if (Math.min(width, height) < 500) throw new Error(`${id} portrait below 500px: ${width}x${height}`);
  return { width, height };
}

for (const judge of judges) {
  const [ordinal, code, office, phone] = courts[judge.court];
  const rosterUrl = [9, 15].includes(judge.court)
    ? `https://www.txcourts.gov/${judge.court}thcoa/about-the-court/`
    : `https://www.txcourts.gov/${judge.court}thcoa/about-the-court/justices/`;
  const contactUrl = `https://www.txcourts.gov/${judge.court}thcoa/contact-us/`;
  const id = `tx-coa-${judge.court}-place-${judge.place}-${slugify(judge.name)}`;
  const portrait = await savePortrait(judge.imageUrl, id);
  const isChief = judge.place === 1;
  const position = `${isChief ? "Chief Justice" : "Justice"}, ${ordinal} Court of Appeals`;
  const caseUrl = `https://search.txcourts.gov/CaseSearch.aspx?coa=coa${code}&s=c`;
  const documentUrl = `https://search.txcourts.gov/CaseSearch.aspx?coa=coa${code}&s=d&d=1`;
  const opinionUrl = `https://search.txcourts.gov/DocketSrch.aspx?coa=coa${code}`;
  const election = judge.electionYear ? {
    termStart: `${judge.electionYear + 1}-01-01`,
    termEnd: `${judge.electionYear + 6}-12-31`,
    nextElection: `${judge.electionYear + 6} general election`,
  } : { nextElection: "Pending authoritative election-cycle match" };
  const names = judge.name.split(" ");
  const freshness = (status, sourceUrl, note) => ({ status, reviewedAt: REVIEWED_AT, sourceUrl, ...(note ? { note } : {}) });
  const profile = {
    id,
    name: judge.name,
    firstName: names[0].replace(/[^A-Za-z'-]/g, ""),
    lastName: names.at(-1).replace(/[^A-Za-z'-]/g, ""),
    party: judge.party,
    level: "state",
    position,
    district: `${ordinal} Court of Appeals, Place ${judge.place}`,
    jurisdiction: `${ordinal} Court of Appeals District, Texas`,
    county: ["Texas"],
    ...election,
    contactInfo: { office, phone, website: rosterUrl },
    bio: `${judge.name} currently serves as ${position}, Place ${judge.place}. The official court roster verifies the current assignment. RepWatchr treats published opinions, orders, case records, and oral arguments as the role-compatible accountability record; legislative roll calls are not substituted for judicial work.`,
    campaignPromises: [],
    reviewStatus: "source_seeded",
    state: "TX",
    sourceLinks: [
      source(`Official ${ordinal} Court roster`, rosterUrl, ["identity", "current_office", "place", "leadership"]),
      source(`Official ${ordinal} Court contact page`, contactUrl, ["contact", "office"]),
      source(`Official ${ordinal} Court case search`, caseUrl, ["judicial_record", "case_record"]),
      source(`Official ${ordinal} Court document search`, documentUrl, ["judicial_record", "opinions", "orders"]),
      source(`Official ${ordinal} Court orders and opinions`, opinionUrl, ["judicial_record", "opinions", "orders"]),
      source("Texas Judicial Branch courts-of-appeals overview", "https://www.txcourts.gov/about-texas-courts/courts-of-appeals.aspx", ["jurisdiction", "office_structure"]),
      source("Texas Judicial Directory", "https://www.txcourts.gov/judicial-directory/", ["identity", "office_structure"]),
      source("Texas Secretary of State election-results archive", "https://www.sos.state.tx.us/elections/historical/index.shtml", ["election_history", "party", "term"]),
      source("Texas Ethics Commission campaign-finance search", "https://www.ethics.state.tx.us/search/cf/", ["campaign_finance_source_path"]),
      source("State Commission on Judicial Conduct", "https://www.scjc.texas.gov/", ["judicial_conduct_source_path"]),
      source("Texas Constitution, Article V", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm", ["constitutional_authority", "office_structure", "term_length"]),
      source("Texas Judges judicial comparisons", "https://texasjudges.org/judicial-comparisons/", ["party_context", "portrait_publisher"]),
      source("Published portrait source", judge.imageUrl, ["portrait", "portrait_provenance"]),
    ],
    lastVerifiedAt: REVIEWED_AT,
    photo: `/images/officials/texas-accountability/${id}.jpg`,
    photoSourceUrl: judge.imageUrl,
    photoCredit: judge.photoCredit,
    photoRights: judge.photoRights,
    accountabilityNotes: [
      "Role-compatible accountability is based on opinions, orders, case records, and oral arguments; legislative roll calls are not substituted where they do not apply.",
      "Positive-work claims remain pending until a primary record, date, measurable result, and independent context are attached.",
      "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
      "Campaign-finance totals, donors, industries/PACs, and expenditures remain unpublished until the correct filer and reporting period are matched.",
      "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
      "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
    ],
    fieldFreshness: {
      identity: freshness("current", rosterUrl),
      portrait: freshness("current", judge.imageUrl, `Stored publisher portrait; verified at ${portrait.width} by ${portrait.height} pixels.`),
      contact: freshness("current", contactUrl),
      term: freshness(judge.electionYear ? "current" : "pending_review", "https://www.sos.state.tx.us/elections/historical/index.shtml", judge.electionYear ? "Election year is matched to the public election cycle; the six-year end date is derived from Texas Constitution Article V." : "Current service is verified; exact election-cycle record remains to be matched."),
      assignments: freshness("not_applicable", rosterUrl, "No standing legislative committee assignment applies to this judicial office."),
      legislation: freshness("not_applicable", opinionUrl, "Sponsored legislation is not a function of this judicial office."),
      votingRecord: freshness("not_applicable", opinionUrl, "Legislative roll calls do not apply; the role-compatible official record is linked separately."),
      officialRecord: freshness("source_path_only", opinionUrl, "Individual opinions, orders, and case actions require record-level editorial review before evaluation."),
      campaignFinance: freshness("pending_review", "https://www.ethics.state.tx.us/search/cf/", "Filer identity and reporting period are not yet matched."),
      positiveWork: freshness("pending_review", rosterUrl),
      criticism: freshness("pending_review", rosterUrl),
      sentiment: freshness("pending_review", rosterUrl),
      constitutionalAlignment: freshness("pending_review", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm"),
    },
    committeeAssignments: [],
  };
  fs.writeFileSync(path.join(outputDir, `${id}.json`), `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`${id} ${portrait.width}x${portrait.height}`);
}

console.log(`Built ${judges.length} Texas appellate profiles with stored portraits.`);
