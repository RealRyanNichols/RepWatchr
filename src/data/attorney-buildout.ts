import type { PublicPowerProfile } from "@/types/power-watch";

const checkedAt = "2026-04-29";

export type AttorneySourceStatus = "active" | "source_mapped" | "queued";

export interface AttorneyBarSource {
  code: string;
  state: string;
  region: "Texas first" | "Border ring" | "High-volume next" | "National queue";
  status: AttorneySourceStatus;
  licensingAuthority: string;
  licenseLookupUrl: string;
  finderUrl?: string;
  notes: string;
  lastCheckedAt: string;
}

export interface AttorneyBuildoutStage {
  id: string;
  label: string;
  current: number;
  target: number;
  percent: number;
  stage: string;
  detail: string;
  href: string;
}

export const attorneyNationalSourcePlan = {
  title: "State-by-state attorney license source map",
  primaryNationalSource: {
    title: "American Bar Association lawyer licensing agency list",
    url: "https://www.americanbar.org/groups/legal_services/flh-home/flh-lawyer-licensing/",
    lastCheckedAt: checkedAt,
  },
  directorySource: {
    title: "American Bar Association bar directories and lawyer finders",
    url: "https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/",
    lastCheckedAt: checkedAt,
  },
  texasPublicInfoSource: {
    title: "State Bar of Texas public information and grievance-history access",
    url: "https://www.texasbar.com/publicinformation/",
    lastCheckedAt: checkedAt,
  },
} as const;

export const attorneyBuildoutQuestions = [
  {
    id: "priority-signal",
    question: "When an attorney profile is started, what should RepWatchr verify first?",
    options: ["license status", "public discipline", "court appearances", "client-file issues"],
  },
  {
    id: "texas-next",
    question: "After Texas, which state or region should move from queued to active next?",
    options: ["Arkansas/Louisiana/Oklahoma", "New York", "Florida", "California"],
  },
  {
    id: "publish-threshold",
    question: "What makes an attorney page ready to publish beyond source-seeded?",
    options: ["bar profile plus firm roster", "bar profile plus court record", "discipline check plus correction path", "all of the above"],
  },
  {
    id: "cross-link",
    question: "What cross-link matters most when attorneys connect to public power?",
    options: ["government clients", "judge/prosecutor ties", "campaign/vendor records", "public case files"],
  },
  {
    id: "model-feedback",
    question: "What should Faretta AI ask you next when a new attorney name is submitted?",
    options: ["state and bar number", "court/cause number", "firm and public role", "source URL"],
  },
] as const;

export const attorneyBarSources: AttorneyBarSource[] = [
  {
    code: "TX",
    state: "Texas",
    region: "Texas first",
    status: "active",
    licensingAuthority: "State Bar of Texas",
    licenseLookupUrl: "https://www.texasbar.com/findalawyer/",
    finderUrl: "https://www.texasbar.com/findalawyer/",
    notes: "Active first-pass state. State Bar profile pages are the required license-status and public grievance-history starting point.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "AR",
    state: "Arkansas",
    region: "Border ring",
    status: "source_mapped",
    licensingAuthority: "Arkansas Judiciary attorney search",
    licenseLookupUrl: "https://attorneyinfo.aoc.arkansas.gov/",
    notes: "Texas-border state. Move here after the first Texas county and firm pass is steady.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "LA",
    state: "Louisiana",
    region: "Border ring",
    status: "source_mapped",
    licensingAuthority: "Louisiana Attorney Disciplinary Board",
    licenseLookupUrl: "https://www.ladb.org/",
    notes: "Texas-border state. Add licensed-attorney lookup and public discipline source review before profiles.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "OK",
    state: "Oklahoma",
    region: "Border ring",
    status: "source_mapped",
    licensingAuthority: "Oklahoma Bar Association",
    licenseLookupUrl: "https://ams.okbar.org/",
    notes: "Texas-border state. Good next ring for license lookup, grievance history, and court-docket cross-links.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NM",
    state: "New Mexico",
    region: "Border ring",
    status: "source_mapped",
    licensingAuthority: "State Bar of New Mexico",
    licenseLookupUrl: "https://www.sbnm.org/",
    notes: "Texas-border state. Source map loaded; attorney profiles stay queued until bar records are pulled.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "CA",
    state: "California",
    region: "High-volume next",
    status: "source_mapped",
    licensingAuthority: "State Bar of California",
    licenseLookupUrl: "https://members.calbar.ca.gov/",
    notes: "High-volume national source. Useful for public discipline and attorney-status checks once Texas is stable.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "FL",
    state: "Florida",
    region: "High-volume next",
    status: "source_mapped",
    licensingAuthority: "The Florida Bar",
    licenseLookupUrl: "https://www.floridabar.org/",
    notes: "High-volume national source. Useful for public discipline, practice location, and court footprint work.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NY",
    state: "New York",
    region: "High-volume next",
    status: "source_mapped",
    licensingAuthority: "New York State Unified Court System",
    licenseLookupUrl: "https://iapps.courts.state.ny.us/",
    notes: "Starter RepWatchr profiles already exist; license records still need to be attached before publication-strength claims.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "AL",
    state: "Alabama",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Alabama State Bar",
    licenseLookupUrl: "https://www.alabar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "AK",
    state: "Alaska",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Alaska Bar Association",
    licenseLookupUrl: "https://alaskabar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "AZ",
    state: "Arizona",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of Arizona",
    licenseLookupUrl: "https://azbar.legalserviceslink.com/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "CO",
    state: "Colorado",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Colorado Supreme Court attorney registration",
    licenseLookupUrl: "https://www.coloradosupremecourt.com/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "CT",
    state: "Connecticut",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Connecticut Judicial Branch",
    licenseLookupUrl: "https://www.jud.ct.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "DE",
    state: "Delaware",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Delaware legal directory",
    licenseLookupUrl: "https://rp470541.doelegal.com/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "GA",
    state: "Georgia",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of Georgia",
    licenseLookupUrl: "https://www.gabar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "HI",
    state: "Hawaii",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Hawaii State Bar Association",
    licenseLookupUrl: "https://hsba.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "ID",
    state: "Idaho",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Idaho State Bar",
    licenseLookupUrl: "https://isb.idaho.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "IL",
    state: "Illinois",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Illinois Attorney Registration and Disciplinary Commission",
    licenseLookupUrl: "https://www.iardc.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "IN",
    state: "Indiana",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Indiana courts attorney search",
    licenseLookupUrl: "https://courtapps.in.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "IA",
    state: "Iowa",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Iowa Supreme Court Attorney Disciplinary Board",
    licenseLookupUrl: "https://www.iacourtcommissions.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "KS",
    state: "Kansas",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Kansas attorney registration directory",
    licenseLookupUrl: "https://directory-kard.kscourts.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "KY",
    state: "Kentucky",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Kentucky Bar Association",
    licenseLookupUrl: "https://www.kybar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "ME",
    state: "Maine",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Maine Board of Overseers of the Bar",
    licenseLookupUrl: "https://www1.maine.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MD",
    state: "Maryland",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Maryland courts attorney listing",
    licenseLookupUrl: "https://www.courts.state.md.us/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MA",
    state: "Massachusetts",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Massachusetts Board of Bar Overseers",
    licenseLookupUrl: "https://www.massbbo.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MI",
    state: "Michigan",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of Michigan",
    licenseLookupUrl: "https://www.michbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MN",
    state: "Minnesota",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Minnesota Lawyer Registration Office",
    licenseLookupUrl: "https://www.lro.mn.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MS",
    state: "Mississippi",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "The Mississippi Bar",
    licenseLookupUrl: "https://www.msbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MO",
    state: "Missouri",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "The Missouri Bar",
    licenseLookupUrl: "https://mobar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "MT",
    state: "Montana",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of Montana",
    licenseLookupUrl: "https://www.montanabar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NE",
    state: "Nebraska",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Nebraska attorney services",
    licenseLookupUrl: "https://mcle.wcc.ne.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NV",
    state: "Nevada",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of Nevada",
    licenseLookupUrl: "https://www.nvbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NH",
    state: "New Hampshire",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "New Hampshire Bar Association",
    licenseLookupUrl: "https://www.nhbar.org/",
    notes: "ABA notes New Hampshire may require calling the bar association to determine license and good standing.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NJ",
    state: "New Jersey",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "New Jersey courts attorney search",
    licenseLookupUrl: "https://portalattysearch-cloud.njcourts.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "NC",
    state: "North Carolina",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "North Carolina State Bar",
    licenseLookupUrl: "https://portal.ncbar.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "ND",
    state: "North Dakota",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "North Dakota courts",
    licenseLookupUrl: "https://www.ndcourts.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "OH",
    state: "Ohio",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Supreme Court of Ohio",
    licenseLookupUrl: "https://www.supremecourt.ohio.gov/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "OR",
    state: "Oregon",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Oregon State Bar",
    licenseLookupUrl: "https://www.osbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "PA",
    state: "Pennsylvania",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Disciplinary Board of the Supreme Court of Pennsylvania",
    licenseLookupUrl: "https://www.padisciplinaryboard.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "RI",
    state: "Rhode Island",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Rhode Island Bar Association",
    licenseLookupUrl: "https://www.ribar.com/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "SC",
    state: "South Carolina",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "South Carolina Judicial Branch",
    licenseLookupUrl: "https://www.sccourts.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "SD",
    state: "South Dakota",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of South Dakota",
    licenseLookupUrl: "https://statebarofsouthdakota.com/",
    notes: "ABA notes South Dakota may require calling the state bar to determine license and good standing.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "TN",
    state: "Tennessee",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Tennessee Board of Professional Responsibility",
    licenseLookupUrl: "https://www.tbpr.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "UT",
    state: "Utah",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Utah State Bar",
    licenseLookupUrl: "https://services.utahbar.org/",
    finderUrl: "https://www.licensedlawyer.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "VT",
    state: "Vermont",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Vermont Judiciary",
    licenseLookupUrl: "https://www.vermontjudiciary.org/",
    notes: "ABA notes Vermont requires selecting the attorneys-in-good-standing source.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "VA",
    state: "Virginia",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Virginia State Bar",
    licenseLookupUrl: "https://member.vsb.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "WA",
    state: "Washington",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Washington State Bar Association",
    licenseLookupUrl: "https://www.mywsba.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "WV",
    state: "West Virginia",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "West Virginia State Bar",
    licenseLookupUrl: "https://www.mywvbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "WI",
    state: "Wisconsin",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "State Bar of Wisconsin",
    licenseLookupUrl: "https://www.wisbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
  {
    code: "WY",
    state: "Wyoming",
    region: "National queue",
    status: "source_mapped",
    licensingAuthority: "Wyoming State Bar",
    licenseLookupUrl: "https://www.wyomingbar.org/",
    notes: "Source mapped from the ABA licensing-agency list; profiles remain queued.",
    lastCheckedAt: checkedAt,
  },
];

function percent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.round((Math.min(current, target) / target) * 100);
}

function launchStage(value: number) {
  if (value >= 90) return "Orbit";
  if (value >= 70) return "Climb";
  if (value >= 45) return "Liftoff";
  if (value >= 20) return "Ignition";
  return "Launch pad";
}

function hasLicenseSource(profile: PublicPowerProfile) {
  if (profile.kind !== "attorney") return false;
  return profile.sourceLinks.some((source) => {
    const joined = `${source.title} ${source.url}`.toLowerCase();
    return joined.includes("state bar") || joined.includes("texasbar.com/attorneys") || joined.includes("bar profile");
  });
}

function hasCrossLink(profile: PublicPowerProfile) {
  return Boolean(
    profile.affiliatedOrganizationSlug ||
      profile.affiliatedPeople?.length ||
      profile.connectedOfficialIds?.length ||
      profile.sourceLinks.some((source) => ["case-file", "court-record", "public-record"].includes(source.sourceType)),
  );
}

export function getAttorneyBuildoutDashboard(profiles: PublicPowerProfile[]) {
  const stateCount = new Set(profiles.map((profile) => profile.state.toUpperCase())).size;
  const texasProfiles = profiles.filter((profile) => profile.state.toUpperCase() === "TX");
  const texasAttorneyPeople = texasProfiles.filter((profile) => profile.kind === "attorney");
  const licenseLinkedPeople = texasAttorneyPeople.filter(hasLicenseSource);
  const crossLinkedProfiles = texasProfiles.filter(hasCrossLink);
  const sourceMapped = attorneyBarSources.filter((source) => source.status !== "queued").length;
  const activeSources = attorneyBarSources.filter((source) => source.status === "active").length;
  const averageCompletion =
    profiles.length > 0
      ? Math.round(profiles.reduce((sum, profile) => sum + profile.buildoutPercent, 0) / profiles.length)
      : 0;

  const stages: AttorneyBuildoutStage[] = [
    {
      id: "license-source-map",
      label: "License source map",
      current: sourceMapped,
      target: attorneyBarSources.length,
      percent: percent(sourceMapped, attorneyBarSources.length),
      stage: launchStage(percent(sourceMapped, attorneyBarSources.length)),
      detail: "Every state has a licensing authority or bar lookup source mapped before profiles are imported.",
      href: attorneyNationalSourcePlan.primaryNationalSource.url,
    },
    {
      id: "active-state-pass",
      label: "Texas first pass",
      current: activeSources,
      target: 1,
      percent: percent(activeSources, 1),
      stage: launchStage(percent(activeSources, 1)),
      detail: "Texas is the first active state because RepWatchr already has East Texas attorney and firm profiles started.",
      href: "/attorneys?state=TX",
    },
    {
      id: "texas-profile-seed",
      label: "Texas profile seed",
      current: texasProfiles.length,
      target: 25,
      percent: percent(texasProfiles.length, 25),
      stage: launchStage(percent(texasProfiles.length, 25)),
      detail: "Initial target is 25 Texas attorney, firm, and bar-source records before the next state moves to active.",
      href: "/attorneys?state=TX#profiles",
    },
    {
      id: "license-linked-people",
      label: "Person license links",
      current: licenseLinkedPeople.length,
      target: Math.max(1, texasAttorneyPeople.length),
      percent: percent(licenseLinkedPeople.length, Math.max(1, texasAttorneyPeople.length)),
      stage: launchStage(percent(licenseLinkedPeople.length, Math.max(1, texasAttorneyPeople.length))),
      detail: "Individual attorney profiles should link to a state bar profile, license page, or court/bar licensing source.",
      href: attorneyNationalSourcePlan.texasPublicInfoSource.url,
    },
    {
      id: "cross-linked-records",
      label: "Cross-linked records",
      current: crossLinkedProfiles.length,
      target: Math.max(1, texasProfiles.length),
      percent: percent(crossLinkedProfiles.length, Math.max(1, texasProfiles.length)),
      stage: launchStage(percent(crossLinkedProfiles.length, Math.max(1, texasProfiles.length))),
      detail: "Profiles should connect firm, attorney, court record, public client, case file, correction path, or official relationship.",
      href: "/buildout",
    },
    {
      id: "learning-loop",
      label: "Learning loop",
      current: attorneyBuildoutQuestions.length,
      target: 5,
      percent: percent(attorneyBuildoutQuestions.length, 5),
      stage: launchStage(percent(attorneyBuildoutQuestions.length, 5)),
      detail: "The page now asks structured questions so submitted answers can teach which attorney signals matter most.",
      href: "/attorneys#teach-model",
    },
  ];

  return {
    checkedAt,
    stateCount,
    texasProfiles: texasProfiles.length,
    texasAttorneyPeople: texasAttorneyPeople.length,
    licenseLinkedPeople: licenseLinkedPeople.length,
    crossLinkedProfiles: crossLinkedProfiles.length,
    sourceMapped,
    activeSources,
    averageCompletion,
    stages,
    sources: attorneyBarSources,
    questions: attorneyBuildoutQuestions,
  };
}
