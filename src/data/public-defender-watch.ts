import type { PublicPowerProfile, PublicPowerSource } from "@/types/power-watch";

const checkedAt = "2026-04-29";

export type PublicDefenseSourceScope = "national" | "federal" | "state" | "county" | "municipal";
export type PublicDefenseSourceStatus = "source_mapped" | "profile_seeded" | "roster_needed" | "license_match_needed";

export interface PublicDefenseOfficeSource {
  id: string;
  name: string;
  state: string;
  scope: PublicDefenseSourceScope;
  sourceUrl: string;
  status: PublicDefenseSourceStatus;
  notes: string;
  lastCheckedAt: string;
}

const source = (
  title: string,
  url: string,
  sourceType: PublicPowerSource["sourceType"] = "official-website",
): PublicPowerSource => ({
  title,
  url,
  sourceType,
  lastCheckedAt: checkedAt,
});

const federalDefenderDirectorySource = source(
  "Federal Public & Community Defender Directory",
  "https://www.fd.org/sites/default/files/public/other-resources/Federal-Defender-Programs/defenderdir_0.pdf",
  "official-directory",
);

const tidcSource = source("Texas Indigent Defense Commission", "https://www.tidc.texas.gov/", "official-directory");
const northernTexasFederalDefenderSource = source("Federal Public Defender, Northern District of Texas offices", "https://txn.fd.org/offices", "official-directory");
const easternTexasFederalDefenderSource = source("Federal Public Defender, Eastern District of Texas", "https://txe.fd.org/", "official-website");
const southernTexasFederalDefenderSource = source("Federal Public Defender, Southern District of Texas", "https://www.fpdsdot.org/en/", "official-website");
const westernTexasFederalDefenderSource = source("Federal Public Defender, Western District of Texas", "https://txw.fd.org/", "official-website");
const travisCountyPublicDefenderSource = source("Travis County Public Defender's Office", "https://www.traviscountytx.gov/public-defender", "official-website");
const bexarCountyPublicDefenderSource = source("Bexar County Public Defender's Office", "https://www.bexar.org/1041/Public-Defenders-Office", "official-website");
const bexarCountyStaffSource = source("Bexar County Public Defender staff roster", "https://www.bexar.org/3687/Our-Staff", "official-directory");
const californiaPublicDefenderSource = source("California Office of the State Public Defender", "https://www.ospd.ca.gov/", "official-website");
const coloradoPublicDefenderSource = source("Colorado State Public Defender", "https://www.coloradodefenders.us/", "official-website");
const idahoPublicDefenderSource = source("Idaho State Public Defender", "https://spd.idaho.gov/about/", "official-website");
const iowaPublicDefenderSource = source("Iowa Office of the State Public Defender", "https://spd.iowa.gov/", "official-website");
const mainePublicDefenderSource = source("Maine Commission on Public Defense Services public defender offices", "https://www.maine.gov/pds/public-defenders", "official-directory");
const mississippiPublicDefenderSource = source("Mississippi Office of State Public Defender directory", "https://www.ospd.ms.gov/find-public-defender", "official-directory");
const washingtonPublicDefenderSource = source("Washington Office of Public Defense public defender offices", "https://opd.wa.gov/public-defender-offices", "official-directory");

export const publicDefenderImportPlan = {
  title: "Public defender and court-appointed defense buildout",
  priority: "Public defenders first, then assigned-counsel and conflict-panel attorneys",
  summary:
    "RepWatchr will start with official public-defense offices and directories. Individual public defenders should only become attorney profiles after the office roster, role, and bar/license source are attached.",
  personReadyRule:
    "Do not mark a public defender person profile as publish-ready unless it has an official office/roster source plus a state bar, federal court, or licensing source showing admission or eligibility.",
  sourceLinks: [
    federalDefenderDirectorySource,
    tidcSource,
    travisCountyPublicDefenderSource,
    bexarCountyPublicDefenderSource,
    californiaPublicDefenderSource,
    coloradoPublicDefenderSource,
    idahoPublicDefenderSource,
    iowaPublicDefenderSource,
    mainePublicDefenderSource,
    mississippiPublicDefenderSource,
    washingtonPublicDefenderSource,
  ],
} as const;

export const publicDefenderOfficeSources: PublicDefenseOfficeSource[] = [
  {
    id: "federal-public-community-defender-directory",
    name: "Federal Public & Community Defender Directory",
    state: "US",
    scope: "national",
    sourceUrl: federalDefenderDirectorySource.url,
    status: "source_mapped",
    notes: "National federal defender office directory. Use as the first source for federal defender organizations before adding district-level offices and attorneys.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "texas-indigent-defense-commission",
    name: "Texas Indigent Defense Commission",
    state: "TX",
    scope: "state",
    sourceUrl: tidcSource.url,
    status: "profile_seeded",
    notes: "Texas statewide public-defense oversight and data source. TIDC states that it funds, oversees, and improves public defense throughout Texas.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "federal-public-defender-northern-district-texas",
    name: "Federal Public Defender, Northern District of Texas",
    state: "TX",
    scope: "federal",
    sourceUrl: northernTexasFederalDefenderSource.url,
    status: "profile_seeded",
    notes: "Federal public defender office source for Dallas, Fort Worth, Lubbock, and Amarillo office coverage.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "federal-public-defender-eastern-district-texas",
    name: "Federal Public Defender, Eastern District of Texas",
    state: "TX",
    scope: "federal",
    sourceUrl: easternTexasFederalDefenderSource.url,
    status: "profile_seeded",
    notes: "Federal defender source for East Texas federal criminal-defense representation. Individual defenders still need roster and bar-license matching.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "federal-public-defender-southern-district-texas",
    name: "Federal Public Defender, Southern District of Texas",
    state: "TX",
    scope: "federal",
    sourceUrl: southernTexasFederalDefenderSource.url,
    status: "profile_seeded",
    notes: "Federal defender source for Houston and South Texas federal criminal-defense representation.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "federal-public-defender-western-district-texas",
    name: "Federal Public Defender, Western District of Texas",
    state: "TX",
    scope: "federal",
    sourceUrl: westernTexasFederalDefenderSource.url,
    status: "profile_seeded",
    notes: "Federal defender source for Western District of Texas federal criminal-defense representation.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "travis-county-public-defender",
    name: "Travis County Public Defender's Office",
    state: "TX",
    scope: "county",
    sourceUrl: travisCountyPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "County public defender source. Travis County states the PDO represents youth in juvenile court and adults in criminal court.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "bexar-county-public-defender",
    name: "Bexar County Public Defender's Office",
    state: "TX",
    scope: "county",
    sourceUrl: bexarCountyPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "County public defender source with official staff roster. Named staff still need bar-license matching before individual attorney profiles are marked ready.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "california-office-state-public-defender",
    name: "California Office of the State Public Defender",
    state: "CA",
    scope: "state",
    sourceUrl: californiaPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "State source for appellate, capital, systemic, non-capital, and indigent-defense improvement work.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "colorado-state-public-defender",
    name: "Colorado State Public Defender",
    state: "CO",
    scope: "state",
    sourceUrl: coloradoPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "Statewide public defender source with trial, appellate, and central office coverage.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "idaho-state-public-defender",
    name: "Idaho State Public Defender",
    state: "ID",
    scope: "state",
    sourceUrl: idahoPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "Statewide public-defense source. Idaho states all public defense is funded and managed by the state public defender.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "iowa-state-public-defender",
    name: "Iowa Office of the State Public Defender",
    state: "IA",
    scope: "state",
    sourceUrl: iowaPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "State source for Iowa's indigent defense system, office locations, key staff, and contract attorney lists.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "maine-public-defense-services",
    name: "Maine Commission on Public Defense Services",
    state: "ME",
    scope: "state",
    sourceUrl: mainePublicDefenderSource.url,
    status: "profile_seeded",
    notes: "State public-defense source listing Maine's developing public defender offices and assigned counsel path.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "mississippi-office-state-public-defender",
    name: "Mississippi Office of State Public Defender",
    state: "MS",
    scope: "state",
    sourceUrl: mississippiPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "State public defender source with felony, parent, youth, and death-penalty public defender directories.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "washington-office-public-defense",
    name: "Washington Office of Public Defense",
    state: "WA",
    scope: "state",
    sourceUrl: washingtonPublicDefenderSource.url,
    status: "profile_seeded",
    notes: "State source listing county and municipal public defender offices across Washington.",
    lastCheckedAt: checkedAt,
  },
];

export const publicDefenderWatchProfiles: PublicPowerProfile[] = [
  {
    slug: "federal-public-community-defender-directory",
    name: "Federal Public & Community Defender Directory",
    kind: "bar-source",
    categoryLabel: "National public-defense source",
    city: "Washington",
    state: "DC",
    region: "Federal / national",
    summary:
      "National directory source for federal public and community defender organizations. This is the first federal public-defense source before district offices and individual assistant federal public defenders are added.",
    whyTracked:
      "Federal public defenders represent people appointed counsel in federal criminal cases and related Criminal Justice Act matters. RepWatchr needs the district organization first, then roster and licensing verification for named attorneys.",
    authorityAreas: ["federal public defense", "Criminal Justice Act appointments", "federal defender office directory"],
    scrutinyAreas: ["district office roster", "bar admission source", "federal court admission", "case appointment context", "conflict panel relationships"],
    profileStatus: "source_seeded",
    buildoutPercent: 35,
    profileTags: ["Public defense", "Federal defender", "National source"],
    sourceLinks: [federalDefenderDirectorySource],
  },
  {
    slug: "texas-indigent-defense-commission",
    name: "Texas Indigent Defense Commission",
    kind: "bar-source",
    categoryLabel: "Texas public-defense source",
    city: "Austin",
    county: "Travis",
    state: "TX",
    region: "Texas",
    summary:
      "Texas statewide source for indigent-defense funding, oversight, data, public defender planning, reports, and public-defense improvement.",
    whyTracked:
      "Public defenders and appointed-defense systems sit at the center of criminal defense for people who cannot hire counsel. TIDC is the Texas source layer before RepWatchr adds county offices, managed assigned counsel systems, and individual attorneys.",
    authorityAreas: ["public-defense funding", "indigent-defense oversight", "public-defense data", "public defender planning"],
    scrutinyAreas: ["county plans", "public defender offices", "managed assigned counsel", "defender caseloads", "attorney eligibility standards"],
    profileStatus: "source_seeded",
    buildoutPercent: 42,
    profileTags: ["Public defense", "Texas", "Indigent defense"],
    sourceLinks: [tidcSource],
  },
  {
    slug: "federal-public-defender-northern-district-texas",
    name: "Federal Public Defender, Northern District of Texas",
    kind: "law-firm",
    categoryLabel: "Federal public defender office",
    city: "Dallas",
    county: "Dallas",
    state: "TX",
    region: "Federal public defense / Texas Northern District",
    summary:
      "Federal public defender office source for Northern District of Texas federal criminal-defense appointments, with public office locations including Dallas, Fort Worth, Lubbock, and Amarillo.",
    whyTracked:
      "Federal defender offices represent indigent defendants in federal criminal cases. RepWatchr will attach office locations, attorney rosters, federal court admission, state bar admission, and appointment context before adding individual defenders.",
    authorityAreas: ["federal criminal defense", "CJA representation", "trial defense", "appeals and post-conviction support"],
    scrutinyAreas: ["assistant defender roster", "bar-license matching", "federal court admission", "case appointment context", "workload and conflict-panel records"],
    profileStatus: "source_seeded",
    buildoutPercent: 32,
    profileTags: ["Public defense", "Federal defender", "Texas", "Roster needed"],
    sourceLinks: [northernTexasFederalDefenderSource, federalDefenderDirectorySource],
  },
  {
    slug: "federal-public-defender-eastern-district-texas",
    name: "Federal Public Defender, Eastern District of Texas",
    kind: "law-firm",
    categoryLabel: "Federal public defender office",
    state: "TX",
    region: "Federal public defense / Texas Eastern District",
    summary:
      "Federal public defender source for Eastern District of Texas federal criminal-defense representation. Individual defenders still need official roster and bar-license matching.",
    whyTracked:
      "East Texas federal cases are part of the public legal-power map. RepWatchr needs the public defender organization, office source, roster, attorney licensing, and case-appointment context before scoring or claims.",
    authorityAreas: ["federal criminal defense", "CJA representation", "trial defense", "appeals and post-conviction support"],
    scrutinyAreas: ["assistant defender roster", "bar-license matching", "federal court admission", "case appointment context", "conflict records"],
    profileStatus: "source_seeded",
    buildoutPercent: 28,
    profileTags: ["Public defense", "Federal defender", "Texas", "Roster needed"],
    sourceLinks: [easternTexasFederalDefenderSource, federalDefenderDirectorySource],
  },
  {
    slug: "federal-public-defender-southern-district-texas",
    name: "Federal Public Defender, Southern District of Texas",
    kind: "law-firm",
    categoryLabel: "Federal public defender office",
    city: "Houston",
    county: "Harris",
    state: "TX",
    region: "Federal public defense / Texas Southern District",
    summary:
      "Federal public defender organization for Southern District of Texas federal criminal cases and related Criminal Justice Act matters.",
    whyTracked:
      "South Texas has a high-volume federal criminal docket. RepWatchr should track the defender office, attorney roster, appointment standards, state/federal admission status, and public case context before adding individual defenders.",
    authorityAreas: ["federal criminal defense", "CJA representation", "trial defense", "appeals", "Fifth Circuit review"],
    scrutinyAreas: ["assistant defender roster", "bar-license matching", "federal court admission", "case appointment context", "border-docket pressure"],
    profileStatus: "source_seeded",
    buildoutPercent: 34,
    profileTags: ["Public defense", "Federal defender", "Texas", "Roster needed"],
    sourceLinks: [southernTexasFederalDefenderSource, federalDefenderDirectorySource],
  },
  {
    slug: "federal-public-defender-western-district-texas",
    name: "Federal Public Defender, Western District of Texas",
    kind: "law-firm",
    categoryLabel: "Federal public defender office",
    city: "San Antonio",
    county: "Bexar",
    state: "TX",
    region: "Federal public defense / Texas Western District",
    summary:
      "Federal public defender source for Western District of Texas federal criminal-defense appointments and other covered matters.",
    whyTracked:
      "Western District federal defender coverage intersects San Antonio, Austin, El Paso, Waco, Midland/Odessa, Del Rio, and border-adjacent federal courts. RepWatchr needs office and attorney-source coverage before person-level profiles.",
    authorityAreas: ["federal criminal defense", "CJA representation", "trial defense", "appeals and post-conviction support"],
    scrutinyAreas: ["assistant defender roster", "bar-license matching", "federal court admission", "case appointment context", "conflict-panel relationships"],
    profileStatus: "source_seeded",
    buildoutPercent: 31,
    profileTags: ["Public defense", "Federal defender", "Texas", "Roster needed"],
    sourceLinks: [westernTexasFederalDefenderSource, federalDefenderDirectorySource],
  },
  {
    slug: "travis-county-public-defender",
    name: "Travis County Public Defender's Office",
    kind: "law-firm",
    categoryLabel: "County public defender office",
    city: "Austin",
    county: "Travis",
    state: "TX",
    region: "Texas county public defense",
    summary:
      "County public defender office serving Travis County residents. The public site says the office represents youth in juvenile court and adults in criminal court, including clients with serious mental illness or intellectual/developmental disability.",
    whyTracked:
      "County public defenders are core public actors in criminal courts. RepWatchr will attach staff pages, bar-license sources, court appointment records, and public-defense standards before adding individual public defenders.",
    authorityAreas: ["adult criminal defense", "juvenile defense", "mental health defense", "holistic defense support"],
    scrutinyAreas: ["staff roster", "bar-license matching", "appointment standards", "caseload and budget records", "court relationship records"],
    profileStatus: "source_seeded",
    buildoutPercent: 40,
    profileTags: ["Public defense", "County office", "Texas", "Roster needed"],
    sourceLinks: [travisCountyPublicDefenderSource, tidcSource],
  },
  {
    slug: "bexar-county-public-defender",
    name: "Bexar County Public Defender's Office",
    kind: "law-firm",
    categoryLabel: "County public defender office",
    city: "San Antonio",
    county: "Bexar",
    state: "TX",
    region: "Texas county public defense",
    summary:
      "County public defender office appointed by Bexar County trial courts for indigent individuals under the county indigent-defense plan. The official county site also maintains a staff roster.",
    whyTracked:
      "Bexar County has an official office page and staff roster, making it a priority public defender source. Individual staff profiles still need State Bar matching before license-status claims are complete.",
    authorityAreas: ["adult criminal defense", "appellate defense", "mental health defense", "non-citizen unit", "immigration-related criminal defense support"],
    scrutinyAreas: ["staff roster", "bar-license matching", "appointment standards", "division coverage", "county budget and oversight board records"],
    profileStatus: "source_seeded",
    buildoutPercent: 45,
    profileTags: ["Public defense", "County office", "Texas", "Staff roster found"],
    sourceLinks: [bexarCountyPublicDefenderSource, bexarCountyStaffSource, tidcSource],
  },
  {
    slug: "california-office-state-public-defender",
    name: "California Office of the State Public Defender",
    kind: "law-firm",
    categoryLabel: "State public defender office",
    state: "CA",
    region: "California public defense",
    summary:
      "California state public defender office focused on appellate, capital, systemic, non-capital, capacity-building, training, research, and indigent-defense improvement work.",
    whyTracked:
      "California is a high-volume legal market with county-driven public defense. OSPD is the state source for appellate/capital defense and public-defense improvement before RepWatchr adds county offices and named attorneys.",
    authorityAreas: ["appellate defense", "capital litigation", "indigent-defense improvement", "training and capacity building"],
    scrutinyAreas: ["county system links", "attorney roster", "bar-license matching", "public reports", "statewide defense standards"],
    profileStatus: "source_seeded",
    buildoutPercent: 38,
    profileTags: ["Public defense", "State office", "California", "County systems needed"],
    sourceLinks: [californiaPublicDefenderSource],
  },
  {
    slug: "colorado-state-public-defender",
    name: "Colorado State Public Defender",
    kind: "law-firm",
    categoryLabel: "State public defender office",
    city: "Denver",
    state: "CO",
    region: "Colorado public defense",
    summary:
      "Colorado statewide public defender system. The official site says OSPD staffs 21 regional trial offices, serves all 22 judicial districts and 64 counties, and has a central appellate division.",
    whyTracked:
      "Colorado provides a strong statewide model for public-defense coverage. RepWatchr should map regional offices, named defenders, bar-license sources, and public reports before individual profiles are scored.",
    authorityAreas: ["state criminal defense", "trial defense", "appellate defense", "public defender training"],
    scrutinyAreas: ["regional office coverage", "attorney roster", "bar-license matching", "caseload and budget records", "statewide standards"],
    profileStatus: "source_seeded",
    buildoutPercent: 40,
    profileTags: ["Public defense", "State office", "Colorado", "Regional offices"],
    sourceLinks: [coloradoPublicDefenderSource],
  },
  {
    slug: "idaho-state-public-defender",
    name: "Idaho State Public Defender",
    kind: "law-firm",
    categoryLabel: "State public defender office",
    city: "Boise",
    county: "Ada",
    state: "ID",
    region: "Idaho public defense",
    summary:
      "Idaho statewide public defender office established in 2023, with public defense funded and managed by the state and organized through district public defenders, institutional offices, and contract attorneys.",
    whyTracked:
      "Idaho is a newer statewide public-defense model. RepWatchr should track institutional offices, contract-attorney coverage, named district defenders, and bar-license sources before individual profiles are marked complete.",
    authorityAreas: ["state public defense", "district public defenders", "contract public defense", "institutional public defender offices"],
    scrutinyAreas: ["district office roster", "contract attorney list", "bar-license matching", "caseload and budget records", "capital counsel qualifications"],
    profileStatus: "source_seeded",
    buildoutPercent: 42,
    profileTags: ["Public defense", "State office", "Idaho", "Contract defenders"],
    sourceLinks: [idahoPublicDefenderSource],
  },
  {
    slug: "iowa-state-public-defender",
    name: "Iowa Office of the State Public Defender",
    kind: "law-firm",
    categoryLabel: "State public defender office",
    city: "Des Moines",
    county: "Polk",
    state: "IA",
    region: "Iowa public defense",
    summary:
      "Iowa state public defender office responsible for coordinating Iowa's indigent defense system, with public links for key staff, office locations, and contract attorney lists.",
    whyTracked:
      "Iowa gives RepWatchr a source path for offices and contract attorneys. Individual attorneys still need bar-license matching and appointment context before person pages are marked ready.",
    authorityAreas: ["indigent defense coordination", "public defender offices", "contract attorneys", "claims and defense resources"],
    scrutinyAreas: ["contract attorney lists", "office locations", "bar-license matching", "appointment standards", "fee-claim records"],
    profileStatus: "source_seeded",
    buildoutPercent: 39,
    profileTags: ["Public defense", "State office", "Iowa", "Contract attorneys"],
    sourceLinks: [iowaPublicDefenderSource],
  },
  {
    slug: "maine-public-defense-services",
    name: "Maine Commission on Public Defense Services",
    kind: "law-firm",
    categoryLabel: "State public-defense office source",
    state: "ME",
    region: "Maine public defense",
    summary:
      "Maine public-defense source listing existing regional public defender offices and assigned-counsel resources.",
    whyTracked:
      "Maine is actively building brick-and-mortar public defender offices. RepWatchr should map each regional office, assigned-counsel source, and bar-license match before adding individual defenders.",
    authorityAreas: ["public defender offices", "assigned counsel", "regional criminal defense", "child protective representation"],
    scrutinyAreas: ["regional office roster", "assigned-counsel list", "bar-license matching", "case appointment context", "system expansion records"],
    profileStatus: "source_seeded",
    buildoutPercent: 36,
    profileTags: ["Public defense", "State source", "Maine", "Regional offices"],
    sourceLinks: [mainePublicDefenderSource],
  },
  {
    slug: "mississippi-office-state-public-defender",
    name: "Mississippi Office of State Public Defender",
    kind: "law-firm",
    categoryLabel: "State public defender source",
    state: "MS",
    region: "Mississippi public defense",
    summary:
      "Mississippi state public defender source with directories for felony-level public defenders, certified parent defenders, certified youth defenders, and certified death-penalty defenders.",
    whyTracked:
      "Mississippi publishes defender directory categories that can drive individual attorney intake. RepWatchr should attach those directories, then match each public defender to a bar/license source before scoring.",
    authorityAreas: ["felony public defense", "parent defense", "youth defense", "death-penalty defense", "public defender training"],
    scrutinyAreas: ["defender directories", "bar-license matching", "certification standards", "appointment context", "training records"],
    profileStatus: "source_seeded",
    buildoutPercent: 38,
    profileTags: ["Public defense", "State source", "Mississippi", "Defender directories"],
    sourceLinks: [mississippiPublicDefenderSource],
  },
  {
    slug: "washington-office-public-defense",
    name: "Washington Office of Public Defense",
    kind: "law-firm",
    categoryLabel: "State public defender source",
    state: "WA",
    region: "Washington public defense",
    summary:
      "Washington state public-defense source with a public directory of county and municipal public defender offices.",
    whyTracked:
      "Washington publishes many local public defender offices in one source. RepWatchr should map office records first, then add named attorneys only when the local office source and Washington bar record are both attached.",
    authorityAreas: ["public defender office directory", "county public defense", "municipal public defense", "indigent defense standards"],
    scrutinyAreas: ["county office roster", "municipal office roster", "bar-license matching", "state funding", "standards and reports"],
    profileStatus: "source_seeded",
    buildoutPercent: 37,
    profileTags: ["Public defense", "State source", "Washington", "Office directory"],
    sourceLinks: [washingtonPublicDefenderSource],
  },
];
