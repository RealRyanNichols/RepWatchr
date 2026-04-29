import type { PublicPowerProfile } from "@/types/power-watch";

const checkedAt = "2026-04-29";

const rogersLawLogo =
  "https://img1.wsimg.com/isteam/ip/6319e6fb-c594-4971-913b-50ba15e12af5/logo/6b23c216-d205-44e3-a356-56282dbb2366.png/:/rs=h:80,cg:true,m/qt=q:95";
const kutchLawLogo = "https://kutchlaw.com/images/kyle-kutch-logo.png";
const potterMintonLogo = "https://potterminton.com/wp-content/uploads/2014/11/PotterMintonLogo.jpg";
const borenMimsImage = "https://lirp.cdn-website.com/42f68c73/dms3rep/multi/opt/Boren---Mims--281-29-1920w.png";
const coghlanCrowsonLogo = "https://ccfww.com/wp-content/uploads/2022/08/Logo-cc-llp-1.png";
const brandtThorsonHeadshot = "https://jbtfirm.com/wp-content/uploads/j-brandt-thorson-criminal-defense-attorney.png";
const smithLegalImage = "https://smithlegaltx.com/wp-content/uploads/2017/05/facebook-cover.jpg";
const cmhnLogo = "https://cmhnlaw.com/images/cmhn-LOGO.png";
const mcbrideLawLogo =
  "https://static.wixstatic.com/media/26a2e1_d2df62cf430d495493ccbab386950002~mv2.png/v1/fill/w_885,h_200,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/McBride_jpg.png";
const mcbrideProfileImage =
  "https://static.wixstatic.com/media/26a2e1_46e6a7b0624a4108974960b82cf91692~mv2.jpg/v1/fill/w_662,h_592,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_20250402_104039.jpg";

const rogersWatchMark = {
  label: "Red mark",
  tone: "red",
  reason: "Ryan requested this profile stay marked while the client-file, billing, docket, and source packet are built out.",
  status: "client_allegation",
} as const;

const mcbrideWatchMark = {
  label: "Red mark",
  tone: "red",
  reason: "Ryan requested this New York attorney be marked for deeper records review before any final findings are published.",
  status: "needs_records_review",
} as const;

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
    categoryLabel: "Law firm",
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
    profileTags: ["Red mark", "Client complaint", "Family law", "Needs court-record review"],
    profileImageUrl: rogersLawLogo,
    profileImageAlt: "Rogers Law Firm logo",
    profileImageSource: "Rogers Law Firm public website",
    profileImageKind: "firm-logo",
    watchMark: rogersWatchMark,
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
    categoryLabel: "Attorney",
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
    profileTags: ["Red mark", "Attorney", "Eligible in Texas", "Client complaint"],
    profileImageUrl: rogersLawLogo,
    profileImageAlt: "Rogers Law Firm logo for Raymond E. Bo Rogers Jr.",
    profileImageSource: "Rogers Law Firm public website",
    profileImageKind: "firm-logo",
    watchMark: rogersWatchMark,
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
    slug: "mcbride-law-firm-pllc",
    name: "The McBride Law Firm, PLLC",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "New York",
    county: "New York",
    state: "NY",
    region: "New York / national cases",
    summary:
      "New York City criminal-defense law firm with a public website stating that it handles state and federal criminal-defense matters and works nationally.",
    whyTracked:
      "This firm profile is included because Joseph D. McBride was requested for RepWatchr records review. The firm page gives the public source bucket for attorney, practice-area, court-record, and client-rights research before any conclusions are published.",
    authorityAreas: ["criminal defense", "federal criminal defense", "civil rights", "appeals", "post-conviction matters"],
    scrutinyAreas: [
      "court record footprint",
      "client outcome records",
      "online reviews",
      "social-media sentiment",
      "disciplinary records if any",
      "source-backed correction requests",
    ],
    profileStatus: "needs_source_review",
    buildoutPercent: 30,
    profileTags: ["New York", "Criminal defense", "Needs records review"],
    profileImageUrl: mcbrideLawLogo,
    profileImageAlt: "The McBride Law Firm logo",
    profileImageSource: "The McBride Law Firm public website",
    profileImageKind: "firm-logo",
    affiliatedPeople: [{ name: "Joseph D. McBride", role: "Founder / attorney", slug: "joseph-d-mcbride" }],
    sourceLinks: [
      {
        title: "The McBride Law Firm public website",
        url: "https://www.mcbridelawnyc.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "joseph-d-mcbride",
    name: "Joseph D. McBride",
    kind: "attorney",
    categoryLabel: "Attorney",
    city: "New York",
    county: "New York",
    state: "NY",
    region: "New York / national cases",
    summary:
      "Attorney profile seeded from The McBride Law Firm public website, which identifies Joseph D. McBride as the founder and describes prior Bronx County prosecutor experience.",
    whyTracked:
      "Ryan requested a red mark and deeper source review for Joseph D. McBride. RepWatchr has not loaded a final evidence packet, rulings dataset, client-outcome dataset, or disciplinary review into this profile yet.",
    authorityAreas: ["criminal defense", "federal criminal defense", "civil rights", "appeals", "post-conviction matters"],
    scrutinyAreas: [
      "court record footprint",
      "client outcomes",
      "public disciplinary records if any",
      "reviews and social sentiment",
      "source-backed correction requests",
    ],
    profileStatus: "needs_source_review",
    buildoutPercent: 28,
    affiliatedOrganizationSlug: "mcbride-law-firm-pllc",
    profileTags: ["Red mark", "New York", "Criminal defense", "Needs records review"],
    profileImageUrl: mcbrideProfileImage,
    profileImageAlt: "Joseph D. McBride public website image",
    profileImageSource: "The McBride Law Firm public website",
    profileImageKind: "headshot",
    watchMark: mcbrideWatchMark,
    sentimentSummary: {
      label: "Records pending",
      basis:
        "The official firm website is loaded as a starter source. RepWatchr has not loaded court outcome data, discipline history, review samples, or social sentiment for this profile yet.",
      lastUpdated: checkedAt,
    },
    accountabilitySignals: [
      {
        label: "Profile status",
        status: "needs_records_review",
        tone: "warning",
        detail:
          "Ryan requested a red mark while court records, client outcomes, public discipline, reviews, and social sentiment are gathered.",
        sourceTitle: "RepWatchr research queue",
      },
      {
        label: "Official website source",
        status: "verified",
        tone: "neutral",
        detail:
          "The McBride Law Firm public website identifies Joseph D. McBride and describes the firm's New York City criminal-defense practice.",
        sourceTitle: "The McBride Law Firm public website",
      },
      {
        label: "Final findings",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "No final misconduct, sanctions, civil, criminal, disciplinary, or client-rights finding has been loaded into this profile.",
      },
    ],
    sourceLinks: [
      {
        title: "The McBride Law Firm public website",
        url: "https://www.mcbridelawnyc.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
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
    profileImageUrl: "https://www.texasbar.com/AM/Images/logo.svg",
    profileImageAlt: "State Bar of Texas logo",
    profileImageSource: "State Bar of Texas public website",
    profileImageKind: "company-logo",
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
    profileImageUrl: kutchLawLogo,
    profileImageAlt: "Kutch Law Firm logo",
    profileImageSource: "Kutch Law Firm public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: kutchLawLogo,
    profileImageAlt: "Kutch Law Firm logo for Kyle Kutch",
    profileImageSource: "Kutch Law Firm public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: potterMintonLogo,
    profileImageAlt: "Potter Minton logo",
    profileImageSource: "Potter Minton public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: borenMimsImage,
    profileImageAlt: "Boren and Mims public website image",
    profileImageSource: "Boren & Mims public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: coghlanCrowsonLogo,
    profileImageAlt: "Coghlan Crowson LLP logo",
    profileImageSource: "Coghlan Crowson public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: brandtThorsonHeadshot,
    profileImageAlt: "J. Brandt Thorson public website image",
    profileImageSource: "J. Brandt Thorson public website",
    profileImageKind: "headshot",
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
    profileImageUrl: brandtThorsonHeadshot,
    profileImageAlt: "J. Brandt Thorson public website image",
    profileImageSource: "J. Brandt Thorson public website",
    profileImageKind: "headshot",
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
    profileImageUrl: "https://www.boonlaw.com/favicon.ico",
    profileImageAlt: "Boon Calk Echols Coleman and Goolsby public website icon",
    profileImageSource: "Boon Calk Echols Coleman & Goolsby public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: smithLegalImage,
    profileImageAlt: "Smith Legal public website image",
    profileImageSource: "Smith Legal public website",
    profileImageKind: "firm-logo",
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
    profileImageUrl: cmhnLogo,
    profileImageAlt: "Carroll Maloney Henry and Nelson logo",
    profileImageSource: "Carroll, Maloney, Henry and Nelson public website",
    profileImageKind: "firm-logo",
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
