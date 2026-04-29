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
    slug: "rogers-law-firm-longview",
    name: "Rogers Law Firm",
    kind: "law-firm",
    categoryLabel: "Featured law firm",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview law firm at 1504 Colony Circle tied to attorney Raymond E. \"Bo Rogers\" Rogers Jr. Public sources list family law, probate, estate planning, real estate, business law, litigation, and turnover receivership practice areas.",
    whyTracked:
      "This firm is the first RepWatchr attorney spotlight because Ryan Nichols has a public case-file entry concerning Bo Rogers' March 2026 motion to withdraw in Cause No. 25-0847. RepWatchr is treating the dispute as a source-backed client complaint and records-review file, not as a final finding.",
    authorityAreas: ["family law", "probate", "estate planning", "business law", "commercial litigation", "turnover receivership"],
    scrutinyAreas: [
      "client withdrawal dispute",
      "file transition and deadline protection",
      "billing and trust-accounting requests",
      "public disciplinary history",
      "online review footprint",
      "court record footprint",
    ],
    profileStatus: "needs_source_review",
    buildoutPercent: 58,
    profileTags: ["Spotlight", "Client complaint", "Family law", "Needs court-record review"],
    featuredSpotlight: {
      label: "RepWatchr spotlight",
      title: "Bo Rogers withdrawal dispute in Ryan Nichols case",
      status: "client_allegation",
      caseNumber: "Harrison County Cause No. 25-0847",
      callout: "Public case-file entry loaded. Court transcript, docket sheet, billing records, and client-file production still need review.",
      summary:
        "Ryan Nichols' public case file states that Bo Rogers moved to withdraw on March 6, 2026, and that Ryan responded with a verified objection, pro se appearance, request for continuance, and request for transition orders including release of the client file, billing and trust accounting, and a written deadline list.",
    },
    sentimentSummary: {
      label: "Records-review watch",
      score: 42,
      basis:
        "State Bar profile reports eligibility and no public disciplinary history, while the Ryan Nichols withdrawal dispute is pending source review. Public review directories checked here show no visible client-review record.",
      lastUpdated: checkedAt,
    },
    accountabilitySignals: [
      {
        label: "License status",
        status: "verified",
        tone: "neutral",
        detail:
          "The State Bar of Texas profile for Raymond E. 'Bo Rogers' Rogers Jr. lists him as eligible to practice in Texas.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Public disciplinary history",
        status: "verified",
        tone: "good",
        detail: "The State Bar profile lists no public disciplinary history as of this source check.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Client complaint spotlight",
        status: "client_allegation",
        tone: "warning",
        detail:
          "Ryan Nichols' public case file says the withdrawal dispute involved ongoing discovery activity, continuing communications, recent evidence transmission, and requested transition orders.",
        sourceTitle: "Real Ryan Nichols LLC case file",
      },
      {
        label: "Online review footprint",
        status: "not_found",
        tone: "neutral",
        detail:
          "Lawyers.com and Martindale pages reviewed here show no visible client reviews for the firm/attorney on those directories.",
        sourceTitle: "Lawyers.com / Martindale",
      },
      {
        label: "Court/client outcome data",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "RepWatchr has not loaded a court-outcome win/loss dataset, rulings-against dataset, social-media sentiment sample, or malpractice/civil-claim docket review for this profile yet.",
      },
    ],
    affiliatedPeople: [{ name: "Raymond E. \"Bo Rogers\" Rogers Jr.", role: "Attorney", slug: "raymond-bo-rogers-jr" }],
    sourceLinks: [
      {
        title: "Rogers Law Firm public website",
        url: "https://borogerslaw.com/",
        sourceType: "official-website",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "State Bar of Texas profile: Raymond E. 'Bo Rogers' Rogers Jr.",
        url: "https://www.texasbar.com/attorneys/member.cfm?id=200797",
        sourceType: "official-directory",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Bo Rogers Motion to Withdraw and Ryan Nichols Response",
        url: "https://www.realryannichols.com/case-files/bo-rogers-motion-to-withdraw-and-ryan-nichols-response",
        sourceType: "case-file",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Lawyers.com firm page",
        url: "https://www.lawyers.com/longview/texas/law-office-of-raymond-e-bo-rogers-jr-p-c-46512596-f/",
        sourceType: "review-directory",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Martindale firm page",
        url: "https://www.martindale.com/organization/law-office-of-raymond-e-bo-32080330/longview-texas-46512596-f/",
        sourceType: "review-directory",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Longview Chamber listing",
        url: "https://members.longviewchamber.com/directory/Details/rogers-law-firm-1382667",
        sourceType: "official-directory",
        lastCheckedAt: "2026-04-29",
      },
    ],
  },
  {
    slug: "raymond-bo-rogers-jr",
    name: "Raymond E. \"Bo Rogers\" Rogers Jr.",
    kind: "attorney",
    categoryLabel: "Spotlight attorney",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview attorney listed by the State Bar of Texas as eligible to practice, with practice areas including business, creditor-debtor, family, commercial litigation, and wills-trusts-probate.",
    whyTracked:
      "Ryan Nichols has placed a public complaint record online concerning Bo Rogers' attempted withdrawal from representation in a Harrison County family-law case. RepWatchr is tracking the license profile, firm profile, withdrawal record, client-file transition issues, public discipline status, and any later court or bar records.",
    authorityAreas: ["family law", "business", "creditor-debtor", "commercial litigation", "wills-trusts-probate"],
    scrutinyAreas: [
      "withdrawal procedure",
      "client file and trust accounting",
      "deadline protection",
      "public disciplinary history",
      "online reviews",
      "court rulings and client outcomes",
    ],
    profileStatus: "needs_source_review",
    buildoutPercent: 56,
    affiliatedOrganizationSlug: "rogers-law-firm-longview",
    profileTags: ["Spotlight", "Attorney", "Eligible in Texas", "Client complaint"],
    featuredSpotlight: {
      label: "Client-rights spotlight",
      title: "Ryan Nichols withdrawal objection and transition-order request",
      status: "client_allegation",
      caseNumber: "Harrison County Cause No. 25-0847",
      callout: "This is a complaint/evidence issue, not a final disciplinary finding.",
      summary:
        "The public case file says Ryan Nichols objected to withdrawal and requested a continuance plus transition orders requiring the full client file, billing and trust accounting, and a written list of deadlines and obligations.",
    },
    sentimentSummary: {
      label: "Mixed / records pending",
      score: 45,
      basis:
        "The State Bar profile reports no public disciplinary history; review-directory pages checked here show no visible client reviews; Ryan Nichols' case-file complaint is loaded for scrutiny and needs court-record follow-up.",
      lastUpdated: checkedAt,
    },
    accountabilitySignals: [
      {
        label: "State Bar eligibility",
        status: "verified",
        tone: "neutral",
        detail:
          "State Bar of Texas lists Raymond E. 'Bo Rogers' Rogers Jr. as eligible to practice in Texas with license date 05/03/1999.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Public discipline",
        status: "verified",
        tone: "good",
        detail: "The State Bar page lists no public disciplinary history.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Ryan Nichols complaint record",
        status: "client_allegation",
        tone: "warning",
        detail:
          "The public case file describes a motion to withdraw, Ryan's verified objection, and Ryan's request for client-file, billing, trust-accounting, and deadline-transition orders.",
        sourceTitle: "Real Ryan Nichols LLC case file",
      },
      {
        label: "Reviews and social sentiment",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "RepWatchr has not loaded Google, Facebook, Avvo, social comments, or client-review samples for this attorney yet. Third-party pages checked here show no visible Lawyers.com/Martindale reviews.",
      },
      {
        label: "Rulings against attorney or firm",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "No civil, criminal, malpractice, sanctions, or rights-violation finding has been loaded into this profile yet. Docket and court-order review is still required.",
      },
    ],
    sourceLinks: [
      {
        title: "State Bar of Texas profile: Raymond E. 'Bo Rogers' Rogers Jr.",
        url: "https://www.texasbar.com/attorneys/member.cfm?id=200797",
        sourceType: "official-directory",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Rogers Law Firm public website",
        url: "https://borogerslaw.com/",
        sourceType: "official-website",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Bo Rogers Motion to Withdraw and Ryan Nichols Response",
        url: "https://www.realryannichols.com/case-files/bo-rogers-motion-to-withdraw-and-ryan-nichols-response",
        sourceType: "case-file",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Lawyers.com firm page",
        url: "https://www.lawyers.com/longview/texas/law-office-of-raymond-e-bo-rogers-jr-p-c-46512596-f/",
        sourceType: "review-directory",
        lastCheckedAt: "2026-04-29",
      },
      {
        title: "Martindale firm page",
        url: "https://www.martindale.com/organization/law-office-of-raymond-e-bo-32080330/longview-texas-46512596-f/",
        sourceType: "review-directory",
        lastCheckedAt: "2026-04-29",
      },
    ],
  },
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
