import type { PublicPowerProfile, PublicPowerSource } from "@/types/power-watch";

const checkedAt = "2026-05-02";

function source(
  title: string,
  url: string,
  sourceType: PublicPowerSource["sourceType"],
): PublicPowerSource {
  return {
    title,
    url,
    sourceType,
    lastCheckedAt: checkedAt,
  };
}

const texasDpsSource = source(
  "Texas Department of Public Safety official website",
  "https://www.dps.texas.gov/",
  "official-website",
);

const texasDpsLeadershipSource = source(
  "DPS leadership change notice naming Colonel Freeman F. Martin",
  "https://www.dps.texas.gov/news/dps-announces-leadership-changes-april-psc-meeting",
  "official-website",
);

const tcoleSource = source(
  "Texas Commission on Law Enforcement official website",
  "https://www.tcole.texas.gov/",
  "oversight-record",
);

const tcoleComplaintSource = source(
  "TCOLE complaint procedures",
  "https://tcole.texas.gov/content/complaint-procedures",
  "complaint-process",
);

const smithCountySheriffSource = source(
  "Smith County Sheriff's Office public source page",
  "https://www.smith-county.com/266/Sheriff",
  "agency-directory",
);

const greggCountySheriffSource = source(
  "Gregg County Sheriff's Office official website",
  "https://www.greggcountytxsheriff.org/",
  "official-website",
);

const tylerPoliceSource = source(
  "City of Tyler Police Department",
  "https://www.cityoftyler.org/government/departments/police-department",
  "agency-directory",
);

const tylerChiefSource = source(
  "City of Tyler Chief of Police page",
  "https://www.cityoftyler.org/government/departments/police-department/divisions-services/administration/chief-of-police",
  "official-directory",
);

const longviewPoliceSource = source(
  "City of Longview Police Department",
  "https://longviewtexas.gov/Police",
  "agency-directory",
);

const longviewChiefSource = source(
  "City of Longview Meet the Chief page",
  "https://longviewtexas.gov/2750/Police-Chief",
  "official-directory",
);

const kilgorePoliceSource = source(
  "City of Kilgore Police Department",
  "https://www.cityofkilgore.com/529/Police",
  "agency-directory",
);

const kilgoreChiefSource = source(
  "City of Kilgore Chief Todd Hunter staff page",
  "https://www.cityofkilgore.com/directory.aspx?eid=26",
  "official-directory",
);

const kilgoreProfessionalStandardsSource = source(
  "Kilgore Police Professional Standards complaint page",
  "https://www.cityofkilgore.com/287/Professional-Standards",
  "complaint-process",
);

const harrisonCountySheriffSource = source(
  "Harrison County, Texas Sheriff's Office page",
  "https://www.harrisoncountytexas.gov/page/harrison.Sheriff",
  "agency-directory",
);

export const publicSafetyWatchImportPlan = {
  title: "Public safety and badge-power buildout",
  region: "Texas first, then nationwide",
  summary:
    "RepWatchr tracks public safety power through official agency pages, elected sheriff offices, police chiefs, jail and custody records, complaint paths, policy records, public lawsuits, public statements, TCOLE records, and source-linked news. The page is built around public roles and public agencies, not private doxxing.",
  sourceLinks: [
    texasDpsSource,
    tcoleSource,
    tcoleComplaintSource,
    smithCountySheriffSource,
    greggCountySheriffSource,
    tylerPoliceSource,
    longviewPoliceSource,
    kilgorePoliceSource,
    harrisonCountySheriffSource,
  ],
} as const;

export const publicSafetyWatchProfiles: PublicPowerProfile[] = [
  {
    slug: "texas-department-of-public-safety",
    name: "Texas Department of Public Safety",
    kind: "law-enforcement-agency",
    categoryLabel: "State law-enforcement agency",
    state: "TX",
    region: "Texas",
    summary:
      "Statewide public safety agency with Texas Highway Patrol, driver license, emergency management support, criminal investigations, regulatory services, and statewide law-enforcement authority.",
    whyTracked:
      "DPS touches statewide policing, border operations, traffic enforcement, investigations, budgets, public safety policy, and state emergency response. RepWatchr needs one source bucket for leadership, public statements, policy records, contracts, and agency accountability.",
    authorityAreas: ["statewide law enforcement", "highway patrol", "criminal investigations", "driver license services", "regulatory services", "emergency response"],
    scrutinyAreas: ["use-of-force policy", "border operations", "public statements", "contracts", "complaint process", "legislative oversight"],
    profileStatus: "source_seeded",
    buildoutPercent: 38,
    profileTags: ["Statewide", "Agency", "Public safety"],
    profileImageUrl: "https://www.dps.texas.gov/favicon.ico",
    profileImageAlt: "Texas Department of Public Safety public site icon",
    profileImageSource: "Texas Department of Public Safety public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [{ name: "Freeman F. Martin", role: "DPS Colonel / Director", slug: "freeman-f-martin" }],
    sourceLinks: [texasDpsSource, texasDpsLeadershipSource],
  },
  {
    slug: "freeman-f-martin",
    name: "Freeman F. Martin",
    kind: "public-safety-official",
    categoryLabel: "State public-safety official",
    state: "TX",
    region: "Texas",
    summary:
      "DPS Colonel Freeman F. Martin is listed in 2026 DPS public releases as the agency leader commenting on confirmed Public Safety Commission leadership changes.",
    whyTracked:
      "The DPS director controls statewide public safety priorities, command structure, budget execution, enforcement posture, and public response to agency failures or major events.",
    authorityAreas: ["DPS leadership", "statewide enforcement priorities", "agency budget", "public safety policy", "Public Safety Commission reporting"],
    scrutinyAreas: ["public statements", "agency discipline", "major-incident response", "legislative testimony", "policy transparency"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 24,
    profileTags: ["DPS", "Leadership", "Needs photo"],
    affiliatedOrganizationSlug: "texas-department-of-public-safety",
    sourceLinks: [texasDpsLeadershipSource, texasDpsSource],
  },
  {
    slug: "texas-commission-on-law-enforcement",
    name: "Texas Commission on Law Enforcement",
    kind: "oversight-agency",
    categoryLabel: "Law-enforcement oversight source",
    state: "TX",
    region: "Texas",
    summary:
      "State licensing and standards body for Texas law-enforcement licensees, training providers, and related complaint jurisdiction.",
    whyTracked:
      "TCOLE is a core source for officer licensing, training, certification, appointment, and certain discipline or complaint records. Every officer-facing page needs TCOLE as a source lane.",
    authorityAreas: ["peace officer licensing", "training standards", "certification", "appointment records", "jurisdictional complaint review"],
    scrutinyAreas: ["license discipline", "complaint limits", "training records", "agency compliance", "public lookup gaps"],
    profileStatus: "source_seeded",
    buildoutPercent: 42,
    profileTags: ["Oversight", "License source", "Complaint path"],
    profileImageUrl: "https://www.tcole.texas.gov/favicon.ico",
    profileImageAlt: "Texas Commission on Law Enforcement public site icon",
    profileImageSource: "TCOLE public website",
    profileImageKind: "company-logo",
    sourceLinks: [tcoleSource, tcoleComplaintSource],
  },
  {
    slug: "smith-county-sheriffs-office",
    name: "Smith County Sheriff's Office",
    kind: "law-enforcement-agency",
    categoryLabel: "Sheriff's office",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "County sheriff office serving Smith County with public county source page, jail/custody responsibilities, warrants, patrol, investigations, and county law-enforcement functions.",
    whyTracked:
      "County sheriffs are elected public officials with arrest, jail, warrant, civil process, and budget authority. Their agencies need profiles connected to jail records, complaints, open records, court cases, and public statements.",
    authorityAreas: ["county law enforcement", "jail operations", "warrants", "civil process", "criminal investigations", "public records"],
    scrutinyAreas: ["jail custody records", "use-of-force policy", "complaint process", "civil-rights litigation", "open-records compliance", "budget votes"],
    profileStatus: "source_seeded",
    buildoutPercent: 34,
    profileTags: ["Sheriff office", "Jail authority", "East Texas"],
    affiliatedPeople: [{ name: "Larry Smith", role: "Sheriff", slug: "smith-county-sheriff-larry-smith" }],
    sourceLinks: [smithCountySheriffSource, tcoleComplaintSource],
  },
  {
    slug: "smith-county-sheriff-larry-smith",
    name: "Larry Smith",
    kind: "sheriff",
    categoryLabel: "Elected sheriff",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Smith County sheriff profile bucket for elected-office, jail, warrant, complaint, public statement, and agency-record review.",
    whyTracked:
      "An elected sheriff holds both law-enforcement power and public-office accountability. This profile needs term source, election records, TCOLE status, public statements, jail records, and civil-case links before it is complete.",
    authorityAreas: ["elected sheriff office", "jail command", "county law enforcement", "public statements", "agency budget"],
    scrutinyAreas: ["jail conditions", "complaint process", "civil lawsuits", "open records", "public statements", "TCOLE source review"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 22,
    profileTags: ["Sheriff", "Needs election source", "Needs photo"],
    affiliatedOrganizationSlug: "smith-county-sheriffs-office",
    sourceLinks: [smithCountySheriffSource, tcoleComplaintSource],
  },
  {
    slug: "gregg-county-sheriffs-office",
    name: "Gregg County Sheriff's Office",
    kind: "law-enforcement-agency",
    categoryLabel: "Sheriff's office",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Gregg County Sheriff's Office public site identifies the office under Sheriff Maxey Cerliano and includes jail, press release, tip, complaint, and public-contact paths.",
    whyTracked:
      "Gregg County is a core East Texas county. The sheriff's office touches jail custody, warrants, investigations, public information, and official statements that should connect to officials, courts, attorneys, and news coverage.",
    authorityAreas: ["county law enforcement", "county jail", "criminal investigations", "warrants", "public information", "complaint intake"],
    scrutinyAreas: ["jail records", "complaint process", "civil lawsuits", "use-of-force policy", "press releases", "public-record response"],
    profileStatus: "source_seeded",
    buildoutPercent: 39,
    profileTags: ["Sheriff office", "Jail authority", "Gregg County"],
    profileImageUrl: "https://www.greggcountytxsheriff.org/favicon.ico",
    profileImageAlt: "Gregg County Sheriff's Office public site icon",
    profileImageSource: "Gregg County Sheriff's Office public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [{ name: "Maxey Cerliano", role: "Sheriff", slug: "gregg-county-sheriff-maxey-cerliano" }],
    sourceLinks: [greggCountySheriffSource, tcoleComplaintSource],
  },
  {
    slug: "gregg-county-sheriff-maxey-cerliano",
    name: "Maxey Cerliano",
    kind: "sheriff",
    categoryLabel: "Elected sheriff",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Gregg County sheriff profile bucket seeded from the official sheriff office website.",
    whyTracked:
      "Sheriff profiles connect elected authority, jail command, public safety statements, budget requests, public complaints, and court-record footprint.",
    authorityAreas: ["elected sheriff office", "jail command", "county law enforcement", "public statements", "agency budget"],
    scrutinyAreas: ["jail custody records", "complaint process", "civil lawsuits", "TCOLE records", "public statements"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 24,
    profileTags: ["Sheriff", "Needs election source", "Needs photo"],
    affiliatedOrganizationSlug: "gregg-county-sheriffs-office",
    sourceLinks: [greggCountySheriffSource, tcoleComplaintSource],
  },
  {
    slug: "tyler-police-department",
    name: "Tyler Police Department",
    kind: "law-enforcement-agency",
    categoryLabel: "Police department",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "City police department serving Tyler with public department and chief pages, sworn staffing, budget, divisions, public contact, and official complaint/source paths.",
    whyTracked:
      "City police departments exercise arrest power, public-safety authority, emergency response, policy discretion, and public-message influence. The profile needs complaint paths, policy records, use-of-force records, lawsuits, and official statements.",
    authorityAreas: ["city policing", "patrol", "investigations", "records", "animal services and code enforcement oversight", "public safety messaging"],
    scrutinyAreas: ["use-of-force policy", "complaint process", "body-camera policy", "civil litigation", "public records", "budget"],
    profileStatus: "source_seeded",
    buildoutPercent: 40,
    profileTags: ["Police department", "City", "Smith County"],
    profileImageUrl: "https://www.cityoftyler.org/favicon.ico",
    profileImageAlt: "City of Tyler public site icon",
    profileImageSource: "City of Tyler public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [{ name: "Jimmy Toler", role: "Chief of Police", slug: "tyler-police-chief-jimmy-toler" }],
    sourceLinks: [tylerPoliceSource, tylerChiefSource, tcoleComplaintSource],
  },
  {
    slug: "tyler-police-chief-jimmy-toler",
    name: "Jimmy Toler",
    kind: "police-chief",
    categoryLabel: "Police chief",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "City of Tyler public chief page lists Jimmy Toler as chief of police and describes department command, staffing, and budget responsibilities.",
    whyTracked:
      "Police chiefs are not usually elected, but they hold major public power over policy, discipline, budgets, records, and public safety priorities. This profile connects the chief to public agency records and source-backed review.",
    authorityAreas: ["police command", "department budget", "policy direction", "records oversight", "public safety messaging"],
    scrutinyAreas: ["complaint outcomes", "policy changes", "use-of-force records", "public statements", "budget priorities"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 31,
    profileTags: ["Police chief", "Needs source expansion", "Needs photo"],
    affiliatedOrganizationSlug: "tyler-police-department",
    sourceLinks: [tylerChiefSource, tylerPoliceSource, tcoleComplaintSource],
  },
  {
    slug: "longview-police-department",
    name: "Longview Police Department",
    kind: "law-enforcement-agency",
    categoryLabel: "Police department",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "City police department serving Longview with public pages for department operations, police chief, police news, open records, patrol, community programs, and public contact.",
    whyTracked:
      "Longview is a key East Texas city. The police department should connect to official statements, open records, city council votes, public complaints, use-of-force records, court cases, and local news coverage.",
    authorityAreas: ["city policing", "patrol", "operations bureau", "public information", "open records", "community programs"],
    scrutinyAreas: ["complaint process", "use-of-force policy", "body-camera policy", "public information", "civil litigation", "city budget"],
    profileStatus: "source_seeded",
    buildoutPercent: 41,
    profileTags: ["Police department", "Open records", "Gregg County"],
    profileImageUrl: "https://longviewtexas.gov/favicon.ico",
    profileImageAlt: "City of Longview public site icon",
    profileImageSource: "City of Longview public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [{ name: "Anthony Boone", role: "Chief of Police", slug: "longview-police-chief-anthony-boone" }],
    sourceLinks: [longviewPoliceSource, longviewChiefSource, tcoleComplaintSource],
  },
  {
    slug: "longview-police-chief-anthony-boone",
    name: "Anthony Boone",
    kind: "police-chief",
    categoryLabel: "Police chief",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "City of Longview public chief page lists Anthony Boone as police chief and describes his Longview Police Department leadership path.",
    whyTracked:
      "Police chiefs control command priorities, policy implementation, supervision, discipline routing, public information posture, and budget asks. This profile is the source bucket for that public authority.",
    authorityAreas: ["police command", "department leadership", "policy direction", "public safety messaging", "records oversight"],
    scrutinyAreas: ["complaint process", "use-of-force records", "policy changes", "public statements", "city council oversight"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 33,
    profileTags: ["Police chief", "Needs source expansion", "Needs photo"],
    affiliatedOrganizationSlug: "longview-police-department",
    sourceLinks: [longviewChiefSource, longviewPoliceSource, tcoleComplaintSource],
  },
  {
    slug: "kilgore-police-department",
    name: "Kilgore Police Department",
    kind: "law-enforcement-agency",
    categoryLabel: "Police department",
    city: "Kilgore",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "City police department serving Kilgore with public agency, organization, chief, staff directory, and professional standards complaint pages.",
    whyTracked:
      "Kilgore sits in the East Texas accountability map between Gregg and Rusk counties. The department needs public profiles for leadership, complaint paths, professional standards, public statements, and city oversight.",
    authorityAreas: ["city policing", "patrol", "investigations", "professional standards", "public safety messaging", "records"],
    scrutinyAreas: ["complaint process", "professional standards", "use-of-force policy", "civil litigation", "city budget", "public statements"],
    profileStatus: "source_seeded",
    buildoutPercent: 43,
    profileTags: ["Police department", "Professional standards", "Gregg/Rusk"],
    profileImageUrl: "https://www.cityofkilgore.com/favicon.ico",
    profileImageAlt: "City of Kilgore public site icon",
    profileImageSource: "City of Kilgore public website",
    profileImageKind: "company-logo",
    affiliatedPeople: [{ name: "Todd Hunter", role: "Chief of Police", slug: "kilgore-police-chief-todd-hunter" }],
    sourceLinks: [kilgorePoliceSource, kilgoreChiefSource, kilgoreProfessionalStandardsSource, tcoleComplaintSource],
  },
  {
    slug: "kilgore-police-chief-todd-hunter",
    name: "Todd Hunter",
    kind: "police-chief",
    categoryLabel: "Police chief",
    city: "Kilgore",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "City of Kilgore staff and chief pages list Todd Hunter as chief of police and provide public department leadership context.",
    whyTracked:
      "Police chief pages need a public record trail for command authority, professional standards, policy, complaints, public statements, budget requests, and source-linked records.",
    authorityAreas: ["police command", "professional standards chain", "agency policy", "public safety messaging", "city department leadership"],
    scrutinyAreas: ["complaint process", "professional standards", "policy transparency", "public statements", "city oversight"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 34,
    profileTags: ["Police chief", "Needs source expansion", "Needs photo"],
    affiliatedOrganizationSlug: "kilgore-police-department",
    sourceLinks: [kilgoreChiefSource, kilgorePoliceSource, kilgoreProfessionalStandardsSource, tcoleComplaintSource],
  },
  {
    slug: "harrison-county-sheriffs-office",
    name: "Harrison County Sheriff's Office",
    kind: "law-enforcement-agency",
    categoryLabel: "Sheriff's office",
    city: "Marshall",
    county: "Harrison",
    state: "TX",
    region: "East Texas",
    summary:
      "Harrison County, Texas sheriff page lists sheriff, administration, jail, open-records, transport, civil, warrant, complaint, and contact information.",
    whyTracked:
      "Harrison County belongs in the East Texas map because sheriff, jail, open-records, court, news, and public-safety records connect directly to the county and municipal accountability model.",
    authorityAreas: ["county law enforcement", "jail operations", "transport and warrants", "civil process", "open records", "complaint intake"],
    scrutinyAreas: ["jail records", "complaint process", "open-records response", "civil litigation", "public statements", "budget"],
    profileStatus: "source_seeded",
    buildoutPercent: 37,
    profileTags: ["Sheriff office", "Jail authority", "Harrison County"],
    affiliatedPeople: [{ name: "Brandon 'BJ' Fletcher", role: "Sheriff", slug: "harrison-county-sheriff-brandon-fletcher" }],
    sourceLinks: [harrisonCountySheriffSource, tcoleComplaintSource],
  },
  {
    slug: "harrison-county-sheriff-brandon-fletcher",
    name: "Brandon Fletcher",
    kind: "sheriff",
    categoryLabel: "Elected sheriff",
    city: "Marshall",
    county: "Harrison",
    state: "TX",
    region: "East Texas",
    summary:
      "Harrison County sheriff profile bucket seeded from the county's public sheriff page.",
    whyTracked:
      "The elected sheriff profile should connect public title, term source, jail command, complaint path, open-records role, public statements, and court-record footprint.",
    authorityAreas: ["elected sheriff office", "county law enforcement", "jail command", "public records", "agency budget"],
    scrutinyAreas: ["jail custody records", "complaint process", "civil lawsuits", "public statements", "TCOLE records"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 24,
    profileTags: ["Sheriff", "Needs election source", "Needs photo"],
    affiliatedOrganizationSlug: "harrison-county-sheriffs-office",
    sourceLinks: [harrisonCountySheriffSource, tcoleComplaintSource],
  },
];
