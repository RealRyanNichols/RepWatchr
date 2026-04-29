import { publicDefenderWatchProfiles } from "@/data/public-defender-watch";
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
const millerFairHenryLogo = "https://millerfairhenry.com/wp-content/uploads/2024/01/Miller-Fair-Henry-White.svg";
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

export const attorneyWatchImportPlan = {
  title: "State-by-state attorney and law-firm buildout",
  region: "Texas first, then border states and high-volume states",
  masterSource: "State Bar of Texas Find a Lawyer and ABA lawyer licensing agency list",
  summary:
    "RepWatchr will treat official state licensing records as the first license-status source, starting in Texas, then connect attorneys and firms to public court records, official representation records, campaign/vendor records, disciplinary records when public, and correction requests.",
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
    {
      title: "American Bar Association lawyer licensing agency list",
      url: "https://www.americanbar.org/groups/legal_services/flh-home/flh-lawyer-licensing/",
      sourceType: "official-directory",
      lastCheckedAt: checkedAt,
    },
    {
      title: "American Bar Association bar directories and lawyer finders",
      url: "https://www.americanbar.org/groups/legal_services/flh-home/flh-bar-directories-and-lawyer-finders/",
      sourceType: "official-directory",
      lastCheckedAt: checkedAt,
    },
  ],
} as const;

export const attorneyWatchProfiles: PublicPowerProfile[] = [
  ...publicDefenderWatchProfiles,
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
      "This firm profile gives RepWatchr a public source bucket for attorney, practice-area, court-record, and client-rights research before any conclusions are published.",
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
      "This is a starter attorney profile. RepWatchr has not loaded a final evidence packet, rulings dataset, client-outcome dataset, or disciplinary review into this profile yet.",
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
    profileTags: ["New York", "Criminal defense", "Needs records review"],
    profileImageUrl: mcbrideProfileImage,
    profileImageAlt: "Joseph D. McBride public website image",
    profileImageSource: "The McBride Law Firm public website",
    profileImageKind: "headshot",
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
        tone: "neutral",
        detail:
          "Court records, client outcomes, public discipline, reviews, and social sentiment have not been gathered into this profile yet.",
        sourceTitle: "RepWatchr source-review queue",
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
    slug: "miller-fair-henry-longview",
    name: "Miller Fair Henry PLLC",
    kind: "law-firm",
    categoryLabel: "Law firm",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview trial law firm describing itself as rooted in litigation experience, with public practice-area pages for intellectual-property and patent litigation, commercial litigation, personal legal services, and alternative dispute resolution.",
    whyTracked:
      "This firm is now cross-linked because Brett F. Miller is both a State Bar-listed Texas attorney at the firm and a Longview ISD school-board trustee already tracked in RepWatchr.",
    authorityAreas: ["commercial litigation", "intellectual property", "patent litigation", "personal legal services", "alternative dispute resolution"],
    scrutinyAreas: ["public-sector relationships", "school-board conflict checks", "court record footprint", "public disciplinary records if any"],
    profileStatus: "source_seeded",
    buildoutPercent: 42,
    profileTags: ["Longview", "Trial firm", "School-board cross-link"],
    profileImageUrl: millerFairHenryLogo,
    profileImageAlt: "Miller Fair Henry logo",
    profileImageSource: "Miller Fair Henry public website",
    profileImageKind: "firm-logo",
    affiliatedPeople: [{ name: "Brett F. Miller", role: "Partner / attorney", slug: "brett-f-miller-attorney" }],
    connectedOfficialIds: ["brett-f-miller"],
    sourceLinks: [
      {
        title: "Miller Fair Henry public website",
        url: "https://millerfairhenry.com/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
      {
        title: "Miller Fair Henry attorney bio: Brett F. Miller",
        url: "https://millerfairhenry.com/attorneys/brett-miller/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
      {
        title: "State Bar of Texas profile: Brett Fisher Miller",
        url: "https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/MemberDirectoryDetail.cfm&ContactID=305535",
        sourceType: "official-directory",
        lastCheckedAt: checkedAt,
      },
      {
        title: "Longview ISD BoardBook public organization page",
        url: "https://meetings.boardbook.org/public/Organization/2235",
        sourceType: "public-record",
        lastCheckedAt: checkedAt,
      },
    ],
  },
  {
    slug: "brett-f-miller-attorney",
    name: "Brett F. Miller",
    kind: "attorney",
    categoryLabel: "Attorney / school-board trustee",
    city: "Longview",
    county: "Gregg",
    state: "TX",
    region: "East Texas",
    summary:
      "Longview attorney and Miller Fair Henry partner. The State Bar of Texas lists Brett Fisher Miller as eligible to practice in Texas, and the firm bio states he serves on the Longview ISD school board.",
    whyTracked:
      "This profile connects an attorney license record to an already tracked public official profile. RepWatchr should separate verified bar status, firm role, school-board role, and any future conflict or court-record findings.",
    authorityAreas: ["family law", "labor-employment", "commercial litigation", "personal injury litigation", "real estate"],
    scrutinyAreas: ["school-board role", "public-sector relationships", "court record footprint", "public disciplinary records if any", "correction requests"],
    profileStatus: "source_seeded",
    buildoutPercent: 48,
    profileTags: ["Eligible in Texas", "Longview ISD trustee", "School-board cross-link", "Needs court-record review"],
    affiliatedOrganizationSlug: "miller-fair-henry-longview",
    connectedOfficialIds: ["brett-f-miller"],
    profileImageUrl: millerFairHenryLogo,
    profileImageAlt: "Miller Fair Henry logo for Brett F. Miller",
    profileImageSource: "Miller Fair Henry public website",
    profileImageKind: "firm-logo",
    sentimentSummary: {
      label: "License verified / public role linked",
      score: 55,
      basis:
        "The State Bar profile lists eligibility and no public disciplinary history. The firm bio and RepWatchr school-board record connect this attorney profile to Longview ISD trustee service.",
      lastUpdated: checkedAt,
    },
    accountabilitySignals: [
      {
        label: "State Bar eligibility",
        status: "verified",
        tone: "neutral",
        detail: "State Bar of Texas lists Brett Fisher Miller as eligible to practice in Texas with bar card number 24065750 and Texas license date 11/07/2008.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Public discipline",
        status: "verified",
        tone: "good",
        detail: "The State Bar profile lists no public disciplinary history.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Public official cross-link",
        status: "verified",
        tone: "neutral",
        detail: "The Miller Fair Henry bio states Miller serves on the Longview ISD school board, matching the RepWatchr official profile id brett-f-miller.",
        sourceTitle: "Miller Fair Henry attorney bio",
      },
      {
        label: "Court and conflict review",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "RepWatchr has not loaded matter-level court records, public-client records, school-district vendor conflict checks, or campaign-finance review into this attorney profile yet.",
      },
    ],
    sourceLinks: [
      {
        title: "State Bar of Texas profile: Brett Fisher Miller",
        url: "https://www.texasbar.com/AM/Template.cfm?Section=Find_A_Lawyer&template=/Customsource/MemberDirectory/MemberDirectoryDetail.cfm&ContactID=305535",
        sourceType: "official-directory",
        lastCheckedAt: checkedAt,
      },
      {
        title: "Miller Fair Henry attorney bio: Brett F. Miller",
        url: "https://millerfairhenry.com/attorneys/brett-miller/",
        sourceType: "official-website",
        lastCheckedAt: checkedAt,
      },
      {
        title: "Longview News-Journal 2020 candidate filing report",
        url: "https://www.news-journal.com/news/local/attorney-files-to-challenge-longview-isd-place-2-trustee-ava-welge/article_d7c8606e-4f55-11ea-8b3b-2399070be9ec.html",
        sourceType: "article",
        lastCheckedAt: checkedAt,
      },
      {
        title: "Longview ISD BoardBook public organization page",
        url: "https://meetings.boardbook.org/public/Organization/2235",
        sourceType: "public-record",
        lastCheckedAt: checkedAt,
      },
    ],
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
      {
        title: "State Bar of Texas profile: Kyle Kutch",
        url: "https://www.texasbar.com/AM/Template.cfm?ContactID=228061&template=%2FCustomsource%2FMemberDirectory%2FMemberDirectoryDetail.cfm",
        sourceType: "official-directory",
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
      "Longview attorney. The State Bar of Texas lists Kyle Kutch as eligible to practice in Texas, with practice areas including business, commercial litigation, personal-injury litigation, oil and gas, and wills-trusts-probate.",
    whyTracked:
      "Individual attorney pages will connect the lawyer, firm, public court footprint, official relationships, and public disciplinary records when those records exist.",
    authorityAreas: ["civil litigation", "personal injury", "probate", "business disputes"],
    scrutinyAreas: ["State Bar profile", "court appearances", "official or agency representation", "correction requests"],
    profileStatus: "source_seeded",
    buildoutPercent: 42,
    profileTags: ["Eligible in Texas", "State Bar linked", "Needs court-record review"],
    affiliatedOrganizationSlug: "kutch-law-firm-longview",
    profileImageUrl: kutchLawLogo,
    profileImageAlt: "Kutch Law Firm logo for Kyle Kutch",
    profileImageSource: "Kutch Law Firm public website",
    profileImageKind: "firm-logo",
    sentimentSummary: {
      label: "License verified / records pending",
      score: 52,
      basis:
        "The State Bar profile lists eligibility and no public disciplinary history. RepWatchr still needs court-record, public-client, and review-source coverage.",
      lastUpdated: checkedAt,
    },
    accountabilitySignals: [
      {
        label: "State Bar eligibility",
        status: "verified",
        tone: "neutral",
        detail: "State Bar of Texas lists Kyle Kutch as eligible to practice in Texas with bar card number 11770543 and Texas license date 11/07/1986.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Public discipline",
        status: "verified",
        tone: "good",
        detail: "The State Bar profile lists no public disciplinary history.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Court and public-client review",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "RepWatchr has not loaded matter-level court records, public-client relationships, campaign/vendor relationships, or client-review samples into this profile yet.",
      },
    ],
    sourceLinks: [
      {
        title: "State Bar of Texas profile: Kyle Kutch",
        url: "https://www.texasbar.com/AM/Template.cfm?ContactID=228061&template=%2FCustomsource%2FMemberDirectory%2FMemberDirectoryDetail.cfm",
        sourceType: "official-directory",
        lastCheckedAt: checkedAt,
      },
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
      {
        title: "State Bar of Texas profile: John Brandt Thorson",
        url: "https://www.texasbar.com/attorneys/member.cfm?id=278022",
        sourceType: "official-directory",
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
      "Longview attorney. The State Bar of Texas lists John Brandt 'Brandt' Thorson as eligible to practice in Texas, board certified in criminal law, and admitted in the Eastern and Northern Districts of Texas.",
    whyTracked:
      "Former prosecutor and current defense/civil-practice roles can matter when tracking local legal power, case outcomes, government relationships, and public accountability.",
    authorityAreas: ["criminal defense", "family law", "personal injury"],
    scrutinyAreas: ["State Bar profile", "former public role", "court appearances", "official relationships"],
    profileStatus: "source_seeded",
    buildoutPercent: 44,
    profileTags: ["Eligible in Texas", "Criminal law board certification", "State Bar linked", "Needs court-record review"],
    affiliatedOrganizationSlug: "j-brandt-thorson-pllc",
    profileImageUrl: brandtThorsonHeadshot,
    profileImageAlt: "J. Brandt Thorson public website image",
    profileImageSource: "J. Brandt Thorson public website",
    profileImageKind: "headshot",
    sentimentSummary: {
      label: "License verified / records pending",
      score: 53,
      basis:
        "The State Bar profile lists eligibility, criminal-law board certification, and no public disciplinary history. RepWatchr still needs matter-level court and public-client review.",
      lastUpdated: checkedAt,
    },
    accountabilitySignals: [
      {
        label: "State Bar eligibility",
        status: "verified",
        tone: "neutral",
        detail:
          "State Bar of Texas lists John Brandt 'Brandt' Thorson as eligible to practice in Texas with bar card number 24043958 and Texas license date 05/04/2004.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Board certification",
        status: "verified",
        tone: "neutral",
        detail: "The State Bar profile displays board certification in criminal law.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Public discipline",
        status: "verified",
        tone: "good",
        detail: "The State Bar profile lists no public disciplinary history.",
        sourceTitle: "State Bar of Texas Find a Lawyer",
      },
      {
        label: "Court and public-role review",
        status: "needs_records_review",
        tone: "neutral",
        detail:
          "RepWatchr has not loaded former-prosecutor source records, matter-level court records, public-client relationships, or review-source coverage into this profile yet.",
      },
    ],
    sourceLinks: [
      {
        title: "State Bar of Texas profile: John Brandt Thorson",
        url: "https://www.texasbar.com/attorneys/member.cfm?id=278022",
        sourceType: "official-directory",
        lastCheckedAt: checkedAt,
      },
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
