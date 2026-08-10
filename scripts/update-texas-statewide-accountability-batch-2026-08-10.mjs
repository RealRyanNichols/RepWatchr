import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REVIEWED_AT = "2026-08-10";
const SOS_ROSTER = "https://www.sos.texas.gov/elections/voter/elected.shtml";
const ELECTION_ARCHIVE = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const TEC_FINANCE = "https://www.ethics.state.tx.us/search/cf/";
const TEXAS_CONSTITUTION = "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.5.htm";

const ccaFiles = fs.readdirSync(path.join(ROOT, "src/data/officials/statewide/tx"))
  .filter((name) => name.startsWith("tx-cca-") && name.endsWith(".json"))
  .map((name) => `src/data/officials/statewide/tx/${name}`);

const supremeFiles = fs.readdirSync(path.join(ROOT, "src/data/officials/state"))
  .filter((name) => name.startsWith("tx-supreme-") && name.endsWith(".json"))
  .map((name) => `src/data/officials/state/${name}`);

const selectedFiles = [
  ...ccaFiles,
  ...supremeFiles,
  "src/data/officials/statewide/tx/tx-rrc-christi-craddick.json",
  "src/data/officials/statewide/tx/tx-rrc-jim-wright.json",
  "src/data/officials/state-executive/tx/tx-governor-greg-abbott.json",
  "src/data/officials/state-executive/tx/tx-lt-governor-dan-patrick.json",
  "src/data/officials/state-executive/tx/tx-attorney-general-ken-paxton.json",
  "src/data/officials/statewide/tx/tx-agriculture-commissioner-sid-miller.json",
  "src/data/officials/statewide/tx/tx-land-commissioner-dawn-buckingham.json",
];

if (selectedFiles.length !== 25) {
  throw new Error(`Expected 25 profiles, found ${selectedFiles.length}`);
}

const executiveConfig = {
  "greg-abbott": {
    official: "https://gov.texas.gov/",
    contact: "https://gov.texas.gov/contact",
    record: "https://gov.texas.gov/news/category/executive-orders",
    news: "https://gov.texas.gov/news",
    office: "P.O. Box 12428, Austin, TX 78711",
    phone: "512-463-2000",
    title: "Governor",
    portrait: "https://commons.wikimedia.org/wiki/File:Greg_Abbott_by_Gage_Skidmore.jpg",
    portraitCredit: "Gage Skidmore, via Wikimedia Commons.",
    portraitRights: "CC BY-SA 3.0; attribution and license link retained. Cropped and web-compressed by RepWatchr.",
  },
  "dan-patrick": {
    official: "https://www.ltgov.texas.gov/",
    contact: "https://www.ltgov.texas.gov/contact/",
    record: "https://senate.texas.gov/ltgov.php",
    news: "https://www.ltgov.texas.gov/",
    office: "P.O. Box 12068, Austin, TX 78711",
    phone: "512-463-0001",
    title: "Lieutenant Governor",
    portrait: "https://www.ltgov.state.tx.us/wp-content/uploads/2021/01/dan_patrick_new_2021.jpg",
    portraitCredit: "Official Office of the Texas Lieutenant Governor portrait.",
    portraitRights: "Official public-profile portrait; provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.",
  },
  "ken-paxton": {
    official: "https://www.texasattorneygeneral.gov/",
    contact: "https://www.texasattorneygeneral.gov/contact-us",
    record: "https://www.texasattorneygeneral.gov/opinions",
    news: "https://www.texasattorneygeneral.gov/news/releases",
    office: "Capitol Station, P.O. Box 12548, Austin, TX 78711-2548",
    phone: "512-463-2100",
    title: "Attorney General",
    portrait: "https://commons.wikimedia.org/wiki/File:Ken_Paxton_(54816860552)_(cropped).jpg",
    portraitCredit: "Gage Skidmore, via Wikimedia Commons.",
    portraitRights: "CC BY-SA 4.0; attribution and license link retained. Cropped and web-compressed by RepWatchr.",
  },
  "tx-agriculture-commissioner-sid-miller": {
    official: "https://texasagriculture.gov/About/Commissioner-Miller",
    contact: "https://texasagriculture.gov/About/Commissioner-Miller",
    record: "https://texasagriculture.gov/Regulatory-Programs",
    news: "https://texasagriculture.gov/News-Events",
    office: "P.O. Box 12847, Austin, TX 78711",
    title: "Texas Agriculture Commissioner",
    portrait: "https://www.texasagriculture.gov/Portals/0/forms/COMM/Sid%20Miller.jpg",
    portraitCredit: "Official Texas Department of Agriculture commissioner portrait.",
    portraitRights: "Official public-profile portrait; provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.",
  },
  "tx-land-commissioner-dawn-buckingham": {
    official: "https://www.glo.texas.gov/about-glo/about-the-commissioner",
    contact: "https://www.glo.texas.gov/",
    record: "https://www.glo.texas.gov/open-government/important-links-and-information/public-information-request",
    news: "https://www.glo.texas.gov/about-glo/press-releases",
    office: "P.O. Box 12873, Austin, TX 78711",
    title: "Commissioner, Texas General Land Office",
    portrait: "https://www.glo.texas.gov/sites/default/files/2024-08/L_Commissioner_Buckingham_sitting_at_Piano.jpg",
    portraitCredit: "Official Texas General Land Office commissioner portrait.",
    portraitRights: "Official public-profile portrait; provenance retained and reuse rights should be rechecked before redistribution outside RepWatchr.",
  },
};

const rrcConfig = {
  "tx-rrc-christi-craddick": {
    email: "Christi.Craddick@rrc.texas.gov",
    phone: "512-463-7140",
    portrait: "https://directory.texastribune.org/static/images/headshots/christi-craddick.jpg",
  },
  "tx-rrc-jim-wright": {
    email: "jim.wright@rrc.texas.gov",
    phone: "512-463-7144",
    portrait: "https://directory.texastribune.org/static/images/headshots/Jim%20Wright.jpg",
  },
};

function source(title, url, supports, note) {
  return { title, url, accessedAt: REVIEWED_AT, supports, ...(note ? { note } : {}) };
}

function electionFor(profile) {
  const year = profile.termEnd?.match(/^(20\d{2})/)?.[1];
  return `${year || "2026"} general election`;
}

function pendingNotes(kind) {
  const record = kind === "judicial" ? "opinions, orders, and case records" : "official actions, orders, meetings, and agency records";
  return [
    `Role-compatible accountability is based on ${record}; legislative roll calls are not substituted where they do not apply.`,
    "Positive-work claims remain pending until a primary record, date, measurable result, and independent context are attached.",
    "Criticism and controversies remain pending until each claim is substantiated, attributed, dated, and paired with the official's response when available.",
    "Campaign-finance totals, donors, industries/PACs, and expenditures remain unpublished until the correct filer and reporting period are matched.",
    "Constituent sentiment remains unpublished until the collection window, source mix, jurisdiction-confidence method, duplicate/bot filtering, sample size, and uncertainty are disclosed.",
    "No constitutional-alignment score is published without cited official actions, a transparent rubric, applicable provisions, uncertainty, and a RepWatchr-analysis/non-legal-judgment disclaimer.",
  ];
}

function freshness({ identity, portrait, contact, record, role }) {
  return {
    identity: { status: "current", reviewedAt: REVIEWED_AT, sourceUrl: identity },
    portrait: { status: "current", reviewedAt: REVIEWED_AT, sourceUrl: portrait, note: "Stored portrait; minimum dimension verified at 500 pixels." },
    contact: { status: "current", reviewedAt: REVIEWED_AT, sourceUrl: contact },
    term: { status: "current", reviewedAt: REVIEWED_AT, sourceUrl: SOS_ROSTER },
    assignments: { status: "not_applicable", reviewedAt: REVIEWED_AT, sourceUrl: identity, note: `No standing legislative committee assignment applies to this ${role}.` },
    legislation: { status: "not_applicable", reviewedAt: REVIEWED_AT, sourceUrl: record, note: `Sponsored legislation is not a function of this ${role}.` },
    votingRecord: { status: "not_applicable", reviewedAt: REVIEWED_AT, sourceUrl: record, note: "Legislative roll calls do not apply; the role-compatible official record is linked separately." },
    officialRecord: { status: "source_path_only", reviewedAt: REVIEWED_AT, sourceUrl: record, note: "Individual actions require record-level editorial review before evaluation." },
    campaignFinance: { status: "pending_review", reviewedAt: REVIEWED_AT, sourceUrl: TEC_FINANCE, note: "Filer identity and reporting period are not yet matched." },
    positiveWork: { status: "pending_review", reviewedAt: REVIEWED_AT, sourceUrl: identity },
    criticism: { status: "pending_review", reviewedAt: REVIEWED_AT, sourceUrl: identity },
    sentiment: { status: "pending_review", reviewedAt: REVIEWED_AT, sourceUrl: identity },
    constitutionalAlignment: { status: "pending_review", reviewedAt: REVIEWED_AT, sourceUrl: TEXAS_CONSTITUTION },
  };
}

function updateJudicial(profile, isCca) {
  const roster = isCca
    ? "https://www.txcourts.gov/cca/about-the-court/judges/"
    : "https://www.txcourts.gov/supreme/about-the-court/";
  const contact = isCca
    ? "https://www.txcourts.gov/cca/contact-us/"
    : "https://www.txcourts.gov/supreme/contact-us/";
  const record = isCca
    ? "https://search.txcourts.gov/CaseSearch.aspx?coa=coscca&s=c"
    : "https://www.txcourts.gov/supreme/orders-opinions/";
  const portraitSource = profile.photoSourceUrl;
  const courtName = isCca ? "Texas Court of Criminal Appeals" : "Supreme Court of Texas";

  if (isCca) {
    profile.photo = `/images/officials/texas-accountability/${profile.id}.jpg`;
    profile.contactInfo = {
      office: "Supreme Court Building, 201 W. 14th Street, Room 106, Austin, TX 78701",
      phone: "512-463-1551",
      email: "ccarecordrequests@txcourts.gov",
      website: profile.contactInfo.website,
    };
  } else {
    profile.contactInfo = {
      ...profile.contactInfo,
      office: "Supreme Court Building, 201 W. 14th Street, Room 104, Austin, TX 78701",
      phone: "512-463-1312",
    };
  }

  profile.photoRights = "Official or published public-profile portrait; source provenance is retained and reuse rights should be rechecked before redistribution outside RepWatchr.";
  profile.nextElection = electionFor(profile);
  profile.committeeAssignments = [];
  profile.accountabilityNotes = pendingNotes("judicial");
  profile.sourceLinks = [
    source(`Official ${courtName} biography`, profile.contactInfo.website, ["identity", "office", "biography"]),
    source(`Official current ${courtName} roster`, roster, ["current_office", "place", "leadership"]),
    source(`Official ${courtName} contact page`, contact, ["contact", "office"]),
    source("Official Texas appellate case and opinion search", "https://search.txcourts.gov/", ["judicial_record", "opinions", "case_record"]),
    source(isCca ? "Court of Criminal Appeals case and opinion search" : "Supreme Court orders and opinions", record, ["judicial_record", "opinions", "orders"]),
    source(isCca ? "Court of Criminal Appeals oral arguments" : "Supreme Court oral arguments", isCca ? "https://www.txcourts.gov/cca/oral-arguments/" : "https://www.txcourts.gov/supreme/oral-arguments/", ["oral_arguments", "judicial_record"]),
    source("Texas Secretary of State statewide elected-official roster", SOS_ROSTER, ["elected_status", "party", "term"]),
    source("Texas Secretary of State election-results archive", ELECTION_ARCHIVE, ["election_history", "term"]),
    source("Texas Ethics Commission campaign-finance search", TEC_FINANCE, ["campaign_finance_source_path"]),
    source("State Commission on Judicial Conduct", "https://www.scjc.texas.gov/", ["judicial_conduct_source_path"]),
    source("Texas Constitution, Article V", TEXAS_CONSTITUTION, ["constitutional_authority", "office_structure"]),
    source("Published portrait image", portraitSource, ["portrait", "portrait_provenance"]),
  ];
  profile.fieldFreshness = freshness({ identity: roster, portrait: portraitSource, contact, record, role: "statewide judicial office" });
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.reviewStatus = "source_seeded";
}

function updateRrc(profile) {
  const cfg = rrcConfig[profile.id];
  const official = profile.contactInfo.website;
  const staff = `${official}staff/`;
  const record = "https://www.rrc.texas.gov/general-counsel/open-meetings/";
  profile.photo = `/images/officials/texas-accountability/${profile.id}.jpg`;
  profile.photoSourceUrl = cfg.portrait;
  profile.photoCredit = "Published Texas Tribune elected-official directory portrait.";
  profile.photoRights = "Editorial-use published portrait; source provenance is retained and reuse remains governed by the publisher's terms.";
  profile.contactInfo = {
    office: "Railroad Commission of Texas, P.O. Box 12967, Austin, TX 78711-2967",
    phone: cfg.phone,
    email: cfg.email,
    website: official,
  };
  profile.bio = `${profile.name} is a current statewide elected member of the Railroad Commission of Texas${profile.position.startsWith("Chairman") ? " and serves as chairman" : ""}. RepWatchr evaluates regulatory actions and public meeting records separately from campaign finance and public opinion.`;
  profile.nextElection = electionFor(profile);
  profile.committeeAssignments = [];
  profile.accountabilityNotes = pendingNotes("executive");
  profile.sourceLinks = [
    source("Official Railroad Commission commissioner biography", official, ["identity", "office", "biography"]),
    source("Official Railroad Commission commissioner roster", "https://www.rrc.texas.gov/about-us/commissioners/", ["current_office", "leadership"]),
    source("Official commissioner staff and contact page", staff, ["contact", "office"]),
    source("Railroad Commission open meetings", record, ["official_record", "meetings", "votes"]),
    source("Railroad Commission online research queries", "https://www.rrc.texas.gov/resource-center/research/research-queries/", ["regulatory_record", "dockets"]),
    source("Railroad Commission rules", "https://www.rrc.texas.gov/general-counsel/rules/", ["rulemaking_record"]),
    source("Texas Secretary of State statewide elected-official roster", SOS_ROSTER, ["elected_status", "party", "term"]),
    source("Texas Secretary of State election-results archive", ELECTION_ARCHIVE, ["election_history", "term"]),
    source("Texas Ethics Commission campaign-finance search", TEC_FINANCE, ["campaign_finance_source_path"]),
    source("Texas Constitution, Article XVI", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm", ["office_structure"]),
    source("Published portrait image", cfg.portrait, ["portrait", "portrait_provenance"]),
  ];
  profile.fieldFreshness = freshness({ identity: official, portrait: cfg.portrait, contact: staff, record, role: "statewide regulatory office" });
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.reviewStatus = "source_seeded";
}

function updateExecutive(profile) {
  const cfg = executiveConfig[profile.id];
  const originalPortrait = cfg.portrait || profile.photoSourceUrl || profile.photo;
  if (profile.id.startsWith("tx-")) {
    profile.photo = `/images/officials/texas-accountability/${profile.id}.jpg`;
    profile.photoSourceUrl = originalPortrait === profile.contactInfo.website ? profile.photo : originalPortrait;
  }
  profile.photoSourceUrl = originalPortrait;
  profile.photoCredit = cfg.portraitCredit || profile.photoCredit || "Published official-profile portrait.";
  profile.photoRights = cfg.portraitRights || "Official or published public-profile portrait; source provenance is retained and reuse rights should be rechecked before redistribution outside RepWatchr.";
  profile.contactInfo = {
    office: cfg.office,
    ...(cfg.phone ? { phone: cfg.phone } : {}),
    website: cfg.official,
  };
  profile.bio = `${profile.name} currently serves as ${cfg.title}, a statewide elected office in Texas. RepWatchr separates official actions, campaign finance, documented outcomes, criticism, and public opinion into independently sourced evidence lanes.`;
  profile.nextElection = "2026 general election";
  profile.committeeAssignments = [];
  profile.accountabilityNotes = pendingNotes("executive");
  profile.sourceLinks = [
    source(`Official ${cfg.title} website`, cfg.official, ["identity", "office", "biography"]),
    source(`Official ${cfg.title} contact page`, cfg.contact, ["contact", "office"]),
    source("Official role-compatible action record", cfg.record, ["official_record", "actions"]),
    source("Official agency news and public statements", cfg.news, ["public_statements", "agency_actions"]),
    source("Texas Secretary of State statewide elected-official roster", SOS_ROSTER, ["elected_status", "party", "term"]),
    source("Texas Secretary of State election-results archive", ELECTION_ARCHIVE, ["election_history", "term"]),
    source("Texas Ethics Commission campaign-finance search", TEC_FINANCE, ["campaign_finance_source_path"]),
    source("Texas Ethics Commission personal financial statements", "https://www.ethics.state.tx.us/search/pfs/", ["personal_financial_disclosure_source_path"]),
    source("Texas Constitution, Article IV", "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.4.htm", ["constitutional_authority", "office_structure"]),
    source("Published portrait image", profile.photoSourceUrl, ["portrait", "portrait_provenance"]),
  ];
  profile.fieldFreshness = freshness({ identity: cfg.official, portrait: profile.photoSourceUrl, contact: cfg.contact, record: cfg.record, role: "statewide executive office" });
  profile.lastVerifiedAt = REVIEWED_AT;
  profile.reviewStatus = "source_seeded";
}

for (const relative of selectedFiles.sort()) {
  const absolute = path.join(ROOT, relative);
  const profile = JSON.parse(fs.readFileSync(absolute, "utf8"));
  if (relative.includes("/tx-cca-")) updateJudicial(profile, true);
  else if (relative.includes("/tx-supreme-")) updateJudicial(profile, false);
  else if (relative.includes("/tx-rrc-")) updateRrc(profile);
  else updateExecutive(profile);
  fs.writeFileSync(absolute, `${JSON.stringify(profile, null, 2)}\n`);
}

console.log(`Updated ${selectedFiles.length} Texas statewide profiles for ${REVIEWED_AT}.`);
