import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REVIEWED_AT = "2026-08-02";
const OUTPUT_DIR = join(process.cwd(), "src", "data", "officials", "statewide", "tx");
const TEXAS_ELECTIONS = "https://www.sos.state.tx.us/elections/historical/index.shtml";
const TEXAS_FINANCE = "https://www.ethics.state.tx.us/search/cf/";
const TRIBUNE_HEADSHOTS = "https://directory.texastribune.org/static/images/headshots";

const sboeMembers = [
  [1, "Gustavo Reveles", "Gustavo", "Reveles", "D", "El Paso", 2028, "Gustavo%20Reveles%20TT%2001.jpg", "gustavo-reveles"],
  [2, "LJ Francis", "LJ", "Francis", "R", "Corpus Christi", 2026, "LJ%20Francis%20TT%2001.jpg", "lj-francis"],
  [3, "Marisa B. Perez-Diaz", "Marisa", "Perez-Diaz", "D", "San Antonio", 2028, "marisa-perez.jpg", "marisa-b-perez-diaz"],
  [5, "Rebecca Bell-Metereau", "Rebecca", "Bell-Metereau", "D", "San Marcos", 2026, "Rebecca%20Bell-Metereau.jpg", "rebecca-bell-metereau"],
  [6, "Will Hickman", "Will", "Hickman", "R", "Houston", 2026, "Will%20Hickman.jpg", "will-hickman"],
  [7, "Julie Pickren", "Julie", "Pickren", "R", "Pearland", 2026, "Julie%20Pickren%20TT%2001.jpg", "julie-pickren"],
  [8, "Audrey Young", "Audrey", "Young", "R", "Trinity", 2026, "Audrey%20Young.jpg", "audrey-young"],
  [9, "Keven Ellis", "Keven", "Ellis", "R", "Lufkin", 2026, "Keven-Ellis.jpg", "keven-ellis"],
  [10, "Tom Maynard", "Tom", "Maynard", "R", "Florence", 2028, "tom-maynard.jpg", "tom-maynard"],
  [13, "Tiffany Clark", "Tiffany", "Clark", "D", "DeSoto", 2026, "Tiffany%20Clark%20TT%2001.jpg", "tiffany-clark"],
  [15, "Aaron Kinsey", "Aaron", "Kinsey", "R", "Midland", 2028, "Aaron%20Kinsey%20TT%2001.jpg", "aaron-kinsey"],
];

const ccaJudges = [
  ["david-j-schenck", "David J. Schenck", "David", "Schenck", "1", "Presiding Judge", 2025, 2030, "presiding-judge-david-j-schenck", "schenck.jpg"],
  ["bert-richardson", "Bert Richardson", "Bert", "Richardson", "3", "Judge", 2021, 2026, "judge-bert-richardson", "richardson.jpg"],
  ["kevin-yeary", "Kevin Yeary", "Kevin", "Yeary", "4", "Judge", 2021, 2026, "judge-kevin-yeary", "yeary.jpg"],
  ["david-newell", "David Newell", "David", "Newell", "9", "Judge", 2021, 2026, "judge-david-newell", "newell.jpg"],
  ["mary-lou-keel", "Mary Lou Keel", "Mary Lou", "Keel", "2", "Judge", 2023, 2028, "judge-mary-lou-keel", "keel.jpg"],
  ["scott-walker", "Scott Walker", "Scott", "Walker", "5", "Judge", 2023, 2028, "judge-scott-walker", "walker.jpg"],
  ["jesse-f-mcclure-iii", "Jesse F. McClure III", "Jesse", "McClure", "6", "Judge", 2023, 2028, "judge-jesse-f-mcclure-iii", "mcclure.jpg"],
  ["lee-finley", "Lee Finley", "Lee", "Finley", "8", "Judge", 2025, 2030, "judge-lee-finley", "finley.jpg"],
  ["gina-g-parker", "Gina G. Parker", "Gina", "Parker", "7", "Judge", 2025, 2030, "judge-gina-g-parker", "parker.jpg"],
];

const railroadCommissioners = [
  ["jim-wright", "Jim Wright", "Jim", "Wright", "Chairman, Railroad Commission of Texas", 2021, 2026, "jim-wright", "Jim%20Wright.jpg"],
  ["christi-craddick", "Christi Craddick", "Christi", "Craddick", "Railroad Commissioner", 2025, 2030, "christi-craddick", "christi-craddick.jpg"],
  ["wayne-christian", "Wayne Christian", "Wayne", "Christian", "Railroad Commissioner", 2023, 2028, "wayne-christian", "Wayne%20Christian.jpg"],
];

function writeProfile(profile) {
  writeFileSync(join(OUTPUT_DIR, `${profile.id}.json`), `${JSON.stringify(profile, null, 2)}\n`);
}

function commonProfile({ id, name, firstName, lastName, photo, photoSourceUrl, photoCredit, party, position, district, jurisdiction, termStart, termEnd, website, bio, sourceLinks }) {
  return {
    id,
    name,
    firstName,
    lastName,
    photo,
    photoSourceUrl,
    photoCredit,
    party,
    level: "state",
    position,
    district,
    jurisdiction,
    county: ["Texas"],
    termStart,
    termEnd,
    contactInfo: { website },
    bio,
    campaignPromises: [],
    reviewStatus: "source_seeded",
    state: "TX",
    sourceLinks,
    lastVerifiedAt: REVIEWED_AT,
  };
}

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const [district, name, firstName, lastName, party, city, electionYear, photoFile, directorySlug] of sboeMembers) {
  const officialUrl = `https://sboe.texas.gov/state-board-of-education/sboe-board-members/sboe-member-district-${district}`;
  const directoryUrl = `https://directory.texastribune.org/${directorySlug}/`;
  const photo = `${TRIBUNE_HEADSHOTS}/${photoFile}`;
  writeProfile(commonProfile({
    id: `tx-sboe-d${district}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
    name,
    firstName,
    lastName,
    photo,
    photoSourceUrl: directoryUrl,
    photoCredit: "Texas Tribune elected-officials directory portrait; identity cross-checked against the official SBOE roster.",
    party,
    position: "Board Member, Texas State Board of Education",
    district: `SBOE District ${district}`,
    jurisdiction: `Texas State Board of Education District ${district}`,
    termStart: `${electionYear - 3}-01-01`,
    termEnd: `${electionYear}-12-31`,
    website: officialUrl,
    bio: `${name} is the current elected State Board of Education member for District ${district} and is listed by the official board roster as based in ${city}. RepWatchr keeps decision, campaign-finance, and constituent-sentiment modules unrated until their underlying records are loaded and reviewed.`,
    sourceLinks: [
      { title: "Official SBOE member biography", url: officialUrl },
      { title: "Official SBOE current-member roster", url: "https://sboe.texas.gov/state-board-of-education/sboe-board-members/sboe-members" },
      { title: "Texas Tribune elected-official directory and portrait", url: directoryUrl },
      { title: "Official SBOE meeting agendas", url: "https://sboe.texas.gov/state-board-of-education/meetings/meeting-agenda-current" },
      { title: "Texas campaign-finance disclosure search", url: TEXAS_FINANCE },
      { title: "Texas election-results archive", url: TEXAS_ELECTIONS },
    ],
  }));
}

for (const [id, name, firstName, lastName, place, title, termStartYear, electionYear, profileSlug, photoFile] of ccaJudges) {
  const officialUrl = `https://www.txcourts.gov/cca/about-the-court/judges/${profileSlug}/`;
  const photo = `https://www.txcourts.gov/media/14625${({
    "schenck.jpg": "36",
    "richardson.jpg": "35",
    "yeary.jpg": "38",
    "newell.jpg": "33",
    "keel.jpg": "31",
    "walker.jpg": "37",
    "mcclure.jpg": "32",
    "finley.jpg": "30",
    "parker.jpg": "34",
  })[photoFile]}/${photoFile}`;
  writeProfile(commonProfile({
    id: `tx-cca-${id}`,
    name,
    firstName,
    lastName,
    photo,
    photoSourceUrl: photo,
    photoCredit: "Official Texas Judicial Branch portrait.",
    party: "R",
    position: `${title}, Texas Court of Criminal Appeals`,
    district: `Place ${place}`,
    jurisdiction: "Texas statewide criminal appellate court",
    termStart: `${termStartYear}-01-01`,
    termEnd: `${electionYear}-12-31`,
    website: officialUrl,
    bio: `${name} currently serves in Place ${place} on the Texas Court of Criminal Appeals. RepWatchr treats judicial opinions and case records as the role-compatible accountability record and does not substitute legislative roll calls for judicial work.`,
    sourceLinks: [
      { title: "Official Court of Criminal Appeals biography", url: officialUrl },
      { title: "Official current-judge roster", url: "https://www.txcourts.gov/cca/about-the-court/judges/" },
      { title: "Official appellate case and opinion search", url: "https://search.txcourts.gov/CaseSearch.aspx?coa=coscca&s=c" },
      { title: "Texas campaign-finance disclosure search", url: TEXAS_FINANCE },
      { title: "Texas election-results archive", url: TEXAS_ELECTIONS },
    ],
  }));
}

for (const [id, name, firstName, lastName, position, termStartYear, electionYear, profileSlug, photoFile] of railroadCommissioners) {
  const officialUrl = `https://www.rrc.texas.gov/about-us/commissioners/${profileSlug}/`;
  const directoryUrl = `https://directory.texastribune.org/${profileSlug}/`;
  const photo = `${TRIBUNE_HEADSHOTS}/${photoFile}`;
  writeProfile(commonProfile({
    id: `tx-rrc-${id}`,
    name,
    firstName,
    lastName,
    photo,
    photoSourceUrl: directoryUrl,
    photoCredit: "Texas Tribune elected-officials directory portrait; identity cross-checked against the official Railroad Commission roster.",
    party: "R",
    position,
    district: "Texas statewide",
    jurisdiction: "Railroad Commission of Texas",
    termStart: `${termStartYear}-01-01`,
    termEnd: `${electionYear}-12-31`,
    website: officialUrl,
    bio: `${name} is a current statewide elected member of the Railroad Commission of Texas. RepWatchr keeps regulatory actions, campaign finance, and public sentiment visibly separate and unrated until source records are reviewed.`,
    sourceLinks: [
      { title: "Official commissioner biography", url: officialUrl },
      { title: "Official current-commissioner roster", url: "https://www.rrc.texas.gov/about-us/commissioners/" },
      { title: "Texas Tribune elected-official directory and portrait", url: directoryUrl },
      { title: "Official Railroad Commission open meetings", url: "https://www.rrc.texas.gov/general-counsel/open-meetings/" },
      { title: "Texas campaign-finance disclosure search", url: TEXAS_FINANCE },
      { title: "Texas election-results archive", url: TEXAS_ELECTIONS },
    ],
  }));
}

writeProfile(commonProfile({
  id: "tx-land-commissioner-dawn-buckingham",
  name: "Dawn Buckingham",
  firstName: "Dawn",
  lastName: "Buckingham",
  photo: "https://www.glo.texas.gov/sites/default/files/2024-08/L_Commissioner_Buckingham_sitting_at_Piano.jpg",
  photoSourceUrl: "https://www.glo.texas.gov/about-glo/about-the-commissioner",
  photoCredit: "Official Texas General Land Office portrait.",
  party: "R",
  position: "Commissioner, Texas General Land Office",
  district: "Texas statewide",
  jurisdiction: "Texas General Land Office",
  termStart: "2023-01-01",
  termEnd: "2026-12-31",
  website: "https://www.glo.texas.gov/about-glo/about-the-commissioner",
  bio: "Dawn Buckingham is the current elected Commissioner of the Texas General Land Office. RepWatchr treats executive actions, agency records, campaign finance, and constituent sentiment as separate evidence lanes.",
  sourceLinks: [
    { title: "Official General Land Office commissioner biography", url: "https://www.glo.texas.gov/about-glo/about-the-commissioner" },
    { title: "Texas campaign-finance disclosure search", url: TEXAS_FINANCE },
    { title: "Texas election-results archive", url: TEXAS_ELECTIONS },
  ],
}));

writeProfile(commonProfile({
  id: "tx-agriculture-commissioner-sid-miller",
  name: "Sid Miller",
  firstName: "Sid",
  lastName: "Miller",
  photo: "https://www.texasagriculture.gov/Portals/0/forms/COMM/Sid%20Miller.jpg",
  photoSourceUrl: "https://texasagriculture.gov/About/Commissioner-Miller",
  photoCredit: "Official Texas Department of Agriculture portrait.",
  party: "R",
  position: "Texas Agriculture Commissioner",
  district: "Texas statewide",
  jurisdiction: "Texas Department of Agriculture",
  termStart: "2023-01-01",
  termEnd: "2026-12-31",
  website: "https://texasagriculture.gov/About/Commissioner-Miller",
  bio: "Sid Miller is the current elected Texas Agriculture Commissioner. RepWatchr treats executive actions, agency records, campaign finance, and constituent sentiment as separate evidence lanes.",
  sourceLinks: [
    { title: "Official Department of Agriculture commissioner biography", url: "https://texasagriculture.gov/About/Commissioner-Miller" },
    { title: "Texas campaign-finance disclosure search", url: TEXAS_FINANCE },
    { title: "Texas election-results archive", url: TEXAS_ELECTIONS },
  ],
}));

console.log(`Wrote ${sboeMembers.length + ccaJudges.length + railroadCommissioners.length + 2} source-seeded Texas statewide profiles to ${OUTPUT_DIR}`);
