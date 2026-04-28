import type { PublicPowerProfile } from "@/types/power-watch";

const checkedAt = "2026-04-28";

export const attorneyWatchImportPlan = {
  title: "Texas attorney and law-firm buildout",
  region: "Texas, starting with East Texas",
  masterSource: "State Bar of Texas Find a Lawyer",
  summary:
    "RepWatchr will treat the State Bar directory as the first license-status source, then connect attorneys and firms to public court records, official representation records, campaign/vendor records, disciplinary records when public, and correction requests.",
  sourceLinks: [
    {
      title: "State Bar of Texas Find a Lawyer",
      url: "https://www.texasbar.com/findalawyer/",
      sourceType: "official-directory",
      lastCheckedAt: checkedAt,
    },
    {
      title: "State Bar of Texas public information and grievance-history access",
      url: "https://www.texasbar.com/publicinformation/",
      sourceType: "official-directory",
      lastCheckedAt: checkedAt,
    },
  ],
} as const;

export const attorneyWatchProfiles: PublicPowerProfile[] = [
  {
    slug: "state-bar-of-texas-find-a-lawyer",
    name: "State Bar of Texas Find a Lawyer",
    kind: "bar-source",
    categoryLabel: "Master attorney source",
    city: "Austin",
    county: "Travis",
    state: "TX",
    region: "Texas",
    summary:
      "The State Bar directory is the license-status starting point for Texas attorney profiles before RepWatchr attaches court, representation, grievance, funding, or public-record evidence.",
    whyTracked:
      "Attorney scrutiny has to start with the official licensing record. RepWatchr should not profile a Texas attorney as licensed without a source path back to the State Bar or another official court/bar record.",
    authorityAreas: ["License status", "public disciplinary-history lookup", "firm and contact profile fields"],
    scrutinyAreas: ["license status", "public grievance history", "court appearances", "government-client representation"],
    profileStatus: "source_seeded",
    buildoutPercent: 35,
    sourceLinks: [...attorneyWatchImportPlan.sourceLinks],
  },
  {
    slug: "kutch-law-firm-longview",
    name: "Kutch Law Firm",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview law firm serving East Texas, including Gregg, Smith, Upshur, Marion, Cass, Rusk, Bowie, Panola, Wood, and Harrison counties according to its public site.",
    whyTracked:
      "This is an East Texas legal-services profile seeded so attorney, court, official-representation, and public-record relationships can be attached as the legal directory expands.",
    authorityAreas: ["civil litigation", "business disputes", "personal injury", "probate", "oil and gas"],
    scrutinyAreas: ["court record footprint", "government or official clients", "campaign or vendor relationships", "public disciplinary records if any"],
    profileStatus: "source_seeded",
    buildoutPercent: 30,
    affiliatedPeople: [{ name: "Kyle Kutch", role: "Attorney", slug: "kyle-kutch" }],
    sourceLinks: [
      {
        title: "Kutch Law Firm public website",
        url: "https://kutchlaw.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "kyle-kutch",
    name: "Kyle Kutch",
    kind: "attorney",
    categoryLabel: "Attorney",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Attorney profile seeded from the public Kutch Law Firm website. State Bar license-status and court-record attachments still need to be pulled before this becomes a complete attorney page.",
    whyTracked:
      "Individual attorney pages will connect the lawyer, firm, public court footprint, official relationships, and public disciplinary records when those records exist.",
    authorityAreas: ["civil litigation", "personal injury", "probate", "business disputes"],
    scrutinyAreas: ["State Bar profile", "court appearances", "official or agency representation", "correction requests"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 18,
    affiliatedOrganizationSlug: "kutch-law-firm-longview",
    sourceLinks: [
      {
        title: "Kutch Law Firm public website",
        url: "https://kutchlaw.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "potter-minton-tyler",
    name: "Potter Minton",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Tyler law firm with a public history dating to 1898 and practice areas including business, intellectual property, trials, appeals, and probate according to its website.",
    whyTracked:
      "Long-running East Texas firms can influence local government, courts, businesses, and public disputes. This starter profile creates the record bucket for source-backed attorney and matter-level review.",
    authorityAreas: ["business litigation", "appeals", "probate", "intellectual property", "trial practice"],
    scrutinyAreas: ["court record footprint", "public-sector clients", "official relationships", "disciplinary records if any"],
    profileStatus: "source_seeded",
    buildoutPercent: 25,
    sourceLinks: [
      {
        title: "Potter Minton public website",
        url: "https://potterminton.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "boren-mims-tyler",
    name: "Boren & Mims",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Tyler criminal-defense firm serving East Texas counties including Smith, Cherokee, Henderson, Wood, and Anderson according to its public site.",
    whyTracked:
      "Criminal-defense firms intersect with prosecutors, judges, law enforcement witnesses, and public court records. RepWatchr needs a sourced bucket for those relationships before drawing conclusions.",
    authorityAreas: ["criminal defense", "federal criminal defense", "record sealing", "protective orders"],
    scrutinyAreas: ["court record footprint", "former prosecutor relationships", "public disciplinary records if any", "case-source accuracy"],
    profileStatus: "source_seeded",
    buildoutPercent: 24,
    sourceLinks: [
      {
        title: "Boren & Mims public website",
        url: "https://www.borenmims.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "coghlan-crowson-longview",
    name: "Coghlan Crowson, LLP",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview law firm that describes itself as providing a full range of legal services throughout Texas and Arkansas.",
    whyTracked:
      "Business, oil-and-gas, estate, and litigation firms can appear in disputes involving local officials, agencies, school districts, and public money. This profile is the source-backed starting point.",
    authorityAreas: ["business planning", "tax disputes", "oil and gas", "estate and probate", "civil litigation"],
    scrutinyAreas: ["public-sector clients", "court record footprint", "official relationships", "vendor or campaign ties"],
    profileStatus: "source_seeded",
    buildoutPercent: 24,
    sourceLinks: [
      {
        title: "Coghlan Crowson public website",
        url: "https://ccfww.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "j-brandt-thorson-pllc",
    name: "J. Brandt Thorson, PLLC",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview law firm focused on criminal, family, personal injury, and Social Security disability matters according to its public site.",
    whyTracked:
      "The firm page is seeded because the public site states Brandt Thorson is a former Gregg County felony prosecutor. Former-government roles and current courtroom work need sourced context, not assumptions.",
    authorityAreas: ["criminal defense", "family law", "personal injury", "Social Security disability"],
    scrutinyAreas: ["State Bar profile", "former prosecutor role", "court record footprint", "public disciplinary records if any"],
    profileStatus: "source_seeded",
    buildoutPercent: 28,
    affiliatedPeople: [{ name: "J. Brandt Thorson", role: "Attorney", slug: "j-brandt-thorson" }],
    sourceLinks: [
      {
        title: "J. Brandt Thorson public website",
        url: "https://www.jbtfirm.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "j-brandt-thorson",
    name: "J. Brandt Thorson",
    kind: "attorney",
    categoryLabel: "Attorney",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Attorney profile seeded from the firm website, which states he is a former Gregg County felony prosecutor. Bar and court records still need to be attached.",
    whyTracked:
      "Former prosecutor and current defense/civil-practice roles can matter when tracking local legal power, case outcomes, government relationships, and public accountability.",
    authorityAreas: ["criminal defense", "family law", "personal injury"],
    scrutinyAreas: ["State Bar profile", "former public role", "court appearances", "official relationships"],
    profileStatus: "needs_profile_buildout",
    buildoutPercent: 18,
    affiliatedOrganizationSlug: "j-brandt-thorson-pllc",
    sourceLinks: [
      {
        title: "J. Brandt Thorson public website",
        url: "https://www.jbtfirm.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "boon-calk-echols-coleman-goolsby-longview",
    name: "Boon Calk Echols Coleman & Goolsby PLLC",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview law firm serving East Texas communities including Longview, Marshall, Tyler, Henderson, Carthage, and Gilmer according to its public site.",
    whyTracked:
      "Personal-injury and litigation firms operate inside the same court ecosystem as elected judges, prosecutors, sheriffs, counties, and school districts. RepWatchr will attach public records before scoring or flagging.",
    authorityAreas: ["personal injury", "litigation", "family law", "business law", "criminal defense"],
    scrutinyAreas: ["court record footprint", "public-sector clients", "official relationships", "case-source accuracy"],
    profileStatus: "source_seeded",
    buildoutPercent: 24,
    sourceLinks: [
      {
        title: "Boon Calk Echols Coleman & Goolsby public website",
        url: "https://www.boonlaw.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "smith-legal-tyler",
    name: "Smith Legal, PLLC",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "Tyler law firm describing itself as the only East Texas based law firm dedicated primarily to civil appeals.",
    whyTracked:
      "Appeals shape the record after trial courts act. Appellate attorneys should be connected to published opinions, public clients, and issue areas when those sources are loaded.",
    authorityAreas: ["civil appeals", "briefing", "trial support"],
    scrutinyAreas: ["appellate docket footprint", "public-sector clients", "published opinions", "conflicts and corrections"],
    profileStatus: "source_seeded",
    buildoutPercent: 25,
    sourceLinks: [
      {
        title: "Smith Legal public website",
        url: "https://smithlegaltx.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "carroll-maloney-henry-nelson",
    name: "Carroll, Maloney, Henry and Nelson, PLLC",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Tyler",
    county: "Smith",
    state: "TX",
    region: "East Texas",
    summary:
      "East Texas litigation firm with offices in Tyler and Longview according to its public site.",
    whyTracked:
      "The firm is seeded for later attachment to court records, official clients, judges, agencies, and public disputes in East Texas.",
    authorityAreas: ["business litigation", "oil and gas disputes", "personal injury", "real estate", "estate litigation"],
    scrutinyAreas: ["court record footprint", "public-sector clients", "official relationships", "public disciplinary records if any"],
    profileStatus: "source_seeded",
    buildoutPercent: 24,
    sourceLinks: [
      {
        title: "Carroll, Maloney, Henry and Nelson public website",
        url: "https://cmhnlaw.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
];
