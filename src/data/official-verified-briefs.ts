export type VerifiedBriefEvidenceKind =
  | "official_record"
  | "reported"
  | "external_data"
  | "interview_statement";

export type VerifiedBriefSource = {
  title: string;
  url: string;
  publisher: string;
  kind: VerifiedBriefEvidenceKind;
  publishedAt?: string;
};

export type VerifiedBriefFact = {
  id: string;
  metric: string;
  label: string;
  detail: string;
  source: VerifiedBriefSource;
};

export type VerifiedBriefStoryCard = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  sources: readonly VerifiedBriefSource[];
  response?: string;
  caution?: string;
};

export type VerifiedBriefTurningPoint = {
  id: string;
  dateLabel: string;
  label: string;
  title: string;
  detail: string;
  sources: readonly VerifiedBriefSource[];
};

export type VerifiedBriefTimelineItem = {
  id: string;
  dateLabel: string;
  title: string;
  detail: string;
  source: VerifiedBriefSource;
};

export type VerifiedBriefMedia = {
  title: string;
  description: string;
  embedUrl: string;
  originalUrl: string;
  source: VerifiedBriefSource;
};

export type OfficialVerifiedBriefData = {
  officialId: string;
  eyebrow: string;
  title: string;
  summary: string;
  reviewedThrough: string;
  facts: readonly VerifiedBriefFact[];
  storyLead: string;
  bottomLine: string;
  strengths: readonly VerifiedBriefStoryCard[];
  concerns: readonly VerifiedBriefStoryCard[];
  turningPoints: readonly VerifiedBriefTurningPoint[];
  headlineSignal?: {
    value: string;
    label: string;
    detail: string;
  };
  timeline: readonly VerifiedBriefTimelineItem[];
  media: VerifiedBriefMedia;
  evidenceNote: string;
};

const officialRecord = (
  title: string,
  url: string,
  publisher: string,
  publishedAt?: string,
): VerifiedBriefSource => ({
  title,
  url,
  publisher,
  kind: "official_record",
  publishedAt,
});

const reported = (
  title: string,
  url: string,
  publisher: string,
  publishedAt?: string,
): VerifiedBriefSource => ({
  title,
  url,
  publisher,
  kind: "reported",
  publishedAt,
});

const externalData = (
  title: string,
  url: string,
  publisher: string,
  publishedAt?: string,
): VerifiedBriefSource => ({
  title,
  url,
  publisher,
  kind: "external_data",
  publishedAt,
});

export const OFFICIAL_VERIFIED_BRIEFS = {
  "jay-dean": {
    officialId: "jay-dean",
    eyebrow: "2026 verified brief",
    title: "The office, the district, and the record in motion.",
    summary:
      "A fast, visual read built from Texas legislative records and clearly labeled reporting. Official records stay separate from reported activity and interview statements.",
    storyLead:
      "Jay Dean is a former Longview mayor who chairs the Texas House Insurance Committee and serves on Energy Resources. His recent record includes documented East Texas appropriations and enacted measures, a verified change in his school-voucher vote, and attributed intraparty criticism.",
    bottomLine:
      "Dean won the 2026 Republican primary 54.9% to 45.1%. The result documents a competitive intraparty contest; it does not establish voter motives or district-wide approval. His record includes documented appropriations and enacted measures alongside a verified voucher-vote change and named local criticism.",
    headlineSignal: {
      value: "54.9%",
      label: "2026 GOP primary",
      detail: "Dean won; this is not a district-wide approval rating",
    },
    reviewedThrough: "July 15, 2026",
    facts: [
      {
        id: "district-counties",
        metric: "3 counties",
        label: "House District 7",
        detail: "The district includes Gregg, Harrison, and Marion counties.",
        source: officialRecord(
          "Jay Dean member profile",
          "https://house.texas.gov/members/3515",
          "Texas House of Representatives",
        ),
      },
      {
        id: "service",
        metric: "Since 2017",
        label: "Texas House service",
        detail: "His official biography also lists ten years as Longview mayor and five years on its city council.",
        source: officialRecord(
          "Official biography",
          "https://house.texas.gov/members/3515/biography",
          "Texas House of Representatives",
        ),
      },
      {
        id: "committee-role",
        metric: "Insurance chair",
        label: "Current committee role",
        detail: "He also serves on Energy Resources and the Select Committee on Health Care Affordability.",
        source: officialRecord(
          "89th Legislature committee assignments",
          "https://capitol.texas.gov/committees/MembershipMbr.aspx?LegCode=A3515&LegSess=89R",
          "Texas Legislature Online",
        ),
      },
      {
        id: "district-population",
        metric: "205,372",
        label: "Estimated residents",
        detail: "The figure is an ACS 2020–2024 estimate, not a 2026 census count.",
        source: officialRecord(
          "House District 7 district profile",
          "https://fyi.capitol.texas.gov/fyiwebdocs/PDF/house/dist7/profile.pdf",
          "Texas Legislative Council",
          "2026-06-03",
        ),
      },
      {
        id: "election-2024",
        metric: "74.2%",
        label: "2024 general election",
        detail: "The district report lists 59,056 votes for Dean and 62.4% district turnout.",
        source: officialRecord(
          "House District 7 2024 general election report",
          "https://fyi.capitol.texas.gov/fyiwebdocs/PDF/house/dist7/r8.pdf",
          "Texas Legislative Council",
          "2025-02-25",
        ),
      },
      {
        id: "authored-measures",
        metric: "46 measures",
        label: "Authored or joint-authored",
        detail: "This is the count listed in the official 89th Legislature author report, not a performance score.",
        source: officialRecord(
          "89th Legislature author report",
          "https://capitol.texas.gov/reports/report.aspx?Code=A3515&ID=author&LegSess=89R",
          "Texas Legislature Online",
        ),
      },
    ],
    strengths: [
      {
        id: "airport-appropriation",
        title: "$10 million for East Texas Regional Airport",
        summary: "A state appropriation for airport upgrades requiring a local match and project delivery.",
        detail:
          "The enacted 2025–27 budget included $10 million for East Texas Regional Airport upgrades. Gregg County Judge Bill Stoudt credited Dean for helping obtain the appropriation; the grant still requires a local match and project delivery.",
        sources: [
          officialRecord(
            "SB 1 enrolled budget, East Texas Regional Airport appropriation",
            "https://capitol.texas.gov/tlodocs/89R/billtext/pdf/SB00001F.pdf",
            "Texas Legislature Online",
            "2025-06-22",
          ),
          reported(
            "Rep. Dean presents $10 million TxDOT grant",
            "https://www.kltv.com/2025/09/16/rep-dean-presents-10-million-txdot-grant-east-texas-regional-airport/",
            "KLTV",
            "2025-09-16",
          ),
        ],
        caution: "The record supports 'helped secure,' not that Dean obtained the money alone.",
      },
      {
        id: "marion-water-appropriation",
        title: "$10 million for Marion County water and sewer work",
        summary: "A state appropriation for Marion County water and sewer infrastructure.",
        detail:
          "The same state budget appropriated $10 million for Marion County water and sewer infrastructure. The appropriation is documented; completed construction and long-term outcomes still need to be tracked.",
        sources: [
          officialRecord(
            "SB 1 enrolled budget, Marion County appropriation",
            "https://capitol.texas.gov/tlodocs/89R/billtext/pdf/SB00001F.pdf",
            "Texas Legislature Online",
            "2025-06-22",
          ),
          reported(
            "Dean presents Marion County $10 million grant",
            "https://www.cbs19.tv/article/news/local/rep-jay-dean-presents-marion-county-10-million-grant/501-4678b9ff-3fe7-4d11-bead-7bd0333cb4d5",
            "CBS19",
            "2025-09-29",
          ),
        ],
        caution: "An appropriation is not the same as a completed project or a solved water system.",
      },
      {
        id: "lake-procedure",
        title: "Public safeguards around Lake O' the Pines transfers",
        summary: "He coauthored enacted procedures for specified interbasin transfers.",
        detail:
          "After a heavily attended town hall, Dean coauthored HB 5659. The enacted measure requires a public hearing and approval from at least five member-city governing bodies before specified interbasin transfers.",
        sources: [
          officialRecord(
            "HB 5659 enrolled text",
            "https://capitol.texas.gov/tlodocs/89R/billtext/html/HB05659F.htm",
            "Texas Legislature Online",
            "2025-06-22",
          ),
          reported(
            "East Texas defends Lake O' the Pines water",
            "https://www.texastribune.org/2025/04/17/east-texas-defends-water-lake-the-pines/",
            "The Texas Tribune",
            "2025-04-17",
          ),
        ],
        caution: "The law adds procedure; it did not permanently end every possible future transfer.",
      },
      {
        id: "well-restoration",
        title: "Surface restoration after state well-plugging work",
        summary: "Requirements affecting surface restoration and landowner access after state well-plugging work.",
        detail:
          "Dean was the sole House author of HB 3619. In most state-directed well-plugging cases, it requires contour and vegetation restoration, preserves owner access, and adds civil-immunity protection for authorized work.",
        sources: [
          officialRecord(
            "HB 3619 enrolled text",
            "https://capitol.texas.gov/tlodocs/89R/billtext/html/HB03619F.htm",
            "Texas Legislature Online",
          ),
        ],
        caution: "Outcome data on the number of properties affected is not yet available.",
      },
    ],
    concerns: [
      {
        id: "voucher-reversal",
        title: "A verified school-voucher reversal",
        summary: "He opposed the proposal in 2023, then supported the final program in 2025.",
        detail:
          "In 2023, Dean joined the House majority that removed a voucher provision from HB 1. In 2025, he voted for SB 2's education savings account program and said amendments he helped add protected public schools.",
        sources: [
          reported(
            "Texas House votes to strip school vouchers",
            "https://www.texastribune.org/2023/11/16/texas-house-school-vouchers/",
            "The Texas Tribune",
            "2023-11-16",
          ),
          officialRecord(
            "House Journal, SB 2 final passage",
            "https://journals.house.texas.gov/hjrnl/89r/pdf/89RDAY46FINAL.PDF",
            "Texas House Journal",
            "2025-04-17",
          ),
          reported(
            "Dean says amendments protect public schools",
            "https://www.cbs19.tv/article/news/local/dean-says-amendments-he-helped-add-protect-our-schools/501-ad149761-845c-41c4-936e-79186e6fe1cc",
            "CBS19",
            "2025-04-17",
          ),
        ],
        response: "Dean attributed the change to safeguards added to the 2025 bill.",
        caution: "The vote change is verified. A claim that money or threats caused it is not.",
      },
      {
        id: "speaker-split",
        title: "A sharp split with local Republican critics",
        summary: "His support for Dustin Burrows prompted criticism from some local Republican officials.",
        detail:
          "Dean backed Burrows in the 2025 speaker contest while the Harrison County GOP warned of possible censure if he defied party priorities. Burrows ultimately won with a coalition that included Democrats.",
        sources: [
          reported(
            "Dustin Burrows wins Texas House speakership",
            "https://apnews.com/article/4d9daceb85d38b13bbde8d924ab120cd",
            "Associated Press",
            "2025-01-14",
          ),
          reported(
            "Harrison County GOP threatens Dean with censure",
            "https://www.kltv.com/2025/01/02/harrison-county-gop-threatens-rep-jay-dean-with-censure-push-conservative-speaker/",
            "KLTV",
            "2025-01-02",
          ),
        ],
        caution: "A threatened censure is not a completed censure.",
      },
      {
        id: "industry-alignment",
        title: "Committee roles, private employment, and campaign support",
        summary: "His committee assignments, private employment, and reported contributors overlap in some policy areas.",
        detail:
          "Official sources list Dean as Insurance chair, an Energy Resources member, and a Thomas Oilfield Services general manager. Transparency USA and the Longview News-Journal report contributions from insurance, property, energy, and leadership-aligned PACs.",
        sources: [
          officialRecord(
            "Texas House member biography and committee assignments",
            "https://house.texas.gov/members/3515/biography",
            "Texas House of Representatives",
          ),
          externalData(
            "Jay Dean contributors",
            "https://www.transparencyusa.org/tx/candidate/jay-dean-coh/contributors",
            "Transparency USA",
            "2026-05-16",
          ),
          reported(
            "Dean brings in nearly $230K in campaign report",
            "https://news-journal.com/2026/02/25/dean-brings-in-230k-in-latest-campaign-finance-report-beckett-raises-17k/",
            "Longview News-Journal",
            "2026-02-25",
          ),
        ],
        response:
          "Dean said statewide PACs include local members and that support reflects the policy areas handled by his committees.",
        caution:
          "The cited sources document roles and contributions; they do not establish improper conduct or a causal link between contributions and official action.",
      },
      {
        id: "public-access",
        title: "Named local criticism over public access",
        summary: "Some Republican organizers said he avoided questions and debate during the 2026 primary.",
        detail:
          "Four Republican Women of Gregg County board members supporting Dean's challenger criticized his decision to leave a February event without taking questions. Dean said an open Q&A risked becoming a partisan 'food fight' and invited constituents to call him directly.",
        sources: [
          reported(
            "Dean chides Republican Women over party unity",
            "https://news-journal.com/2026/02/24/dean-chides-republican-women-of-gregg-county-over-party-unity/",
            "Longview News-Journal",
            "2026-02-24",
          ),
        ],
        response: "Dean defended the format and pointed constituents to direct phone access.",
        caution: "This is named political criticism, not a neutral district-wide accessibility finding.",
      },
    ],
    turningPoints: [
      {
        id: "voucher-2023",
        dateLabel: "Nov. 2023",
        label: "Voucher opposition",
        title: "Dean votes to remove the voucher provision",
        detail: "He was one of 21 House Republicans joining Democrats in the 84–63 vote.",
        sources: [
          reported(
            "Texas House votes to strip school vouchers",
            "https://www.texastribune.org/2023/11/16/texas-house-school-vouchers/",
            "The Texas Tribune",
            "2023-11-16",
          ),
        ],
      },
      {
        id: "speaker-2025",
        dateLabel: "Jan. 2025",
        label: "Speaker fight",
        title: "He backs Burrows despite local party pressure",
        detail: "The Harrison County GOP warned of possible censure over the speaker choice.",
        sources: [
          reported(
            "Harrison County GOP threatens Dean with censure",
            "https://www.kltv.com/2025/01/02/harrison-county-gop-threatens-rep-jay-dean-with-censure-push-conservative-speaker/",
            "KLTV",
            "2025-01-02",
          ),
        ],
      },
      {
        id: "voucher-2025",
        dateLabel: "Apr. 2025",
        label: "Voucher reversal",
        title: "He votes for the final ESA program",
        detail: "Dean said amendments added protections that changed the proposal enough to support it.",
        sources: [
          officialRecord(
            "House Journal, SB 2 final passage",
            "https://journals.house.texas.gov/hjrnl/89r/pdf/89RDAY46FINAL.PDF",
            "Texas House Journal",
            "2025-04-17",
          ),
          reported(
            "Dean says amendments protect public schools",
            "https://www.cbs19.tv/article/news/local/dean-says-amendments-he-helped-add-protect-our-schools/501-ad149761-845c-41c4-936e-79186e6fe1cc",
            "CBS19",
            "2025-04-17",
          ),
        ],
      },
      {
        id: "primary-2026",
        dateLabel: "Mar. 2026",
        label: "Republican primary",
        title: "Dean wins the 2026 Republican primary",
        detail: "Dean received 54.9% (11,905 votes) to Melissa Beckett's 45.1% (9,777 votes).",
        sources: [
          reported(
            "2026 Texas primary election results",
            "https://apps.texastribune.org/features/2026/primary-election-results-2026/",
            "The Texas Tribune / AP",
            "2026-03-08",
          ),
        ],
      },
    ],
    timeline: [
      {
        id: "house-service-begins",
        dateLabel: "2017",
        title: "House service begins",
        detail: "Dean began serving Texas House District 7.",
        source: officialRecord(
          "Official biography",
          "https://house.texas.gov/members/3515/biography",
          "Texas House of Representatives",
        ),
      },
      {
        id: "hb-138-effective",
        dateLabel: "Jun. 20, 2025",
        title: "Health-cost analysis measure takes effect",
        detail:
          "HB 138 established a program to analyze the health and financial effects of proposed health-insurance mandates.",
        source: officialRecord(
          "HB 138 enrolled text",
          "https://capitol.texas.gov/tlodocs/89R/billtext/html/HB00138F.htm",
          "Texas Legislature Online",
          "2025-06-20",
        ),
      },
      {
        id: "hb-5659-effective",
        dateLabel: "Jun. 22, 2025",
        title: "Northeast Texas water measure takes effect",
        detail:
          "HB 5659 changed procedures for certain interbasin transfers involving the Northeast Texas Municipal Water District.",
        source: officialRecord(
          "HB 5659 history",
          "https://capitol.texas.gov/BillLookup/History.aspx?Bill=HB5659&LegSess=89R",
          "Texas Legislature Online",
          "2025-06-22",
        ),
      },
      {
        id: "marshall-water-report",
        dateLabel: "Apr. 3, 2026",
        title: "Marshall water-infrastructure discussion",
        detail:
          "KLTV reported that Dean met Marshall officials about emergency funding for transmission lines and isolation valves.",
        source: {
          title: "Marshall faces ongoing water infrastructure crisis",
          url: "https://www.kltv.com/2026/04/03/just-matter-time-marshall-faces-ongoing-water-infrastructure-crisis/",
          publisher: "KLTV",
          kind: "reported",
          publishedAt: "2026-04-03",
        },
      },
      {
        id: "health-affordability-hearing",
        dateLabel: "Apr. 30, 2026",
        title: "Health Care Affordability hearing",
        detail:
          "The committee hearing covered cost drivers, regulation, market structure, consolidation, fraud, and price transparency.",
        source: officialRecord(
          "Select Committee hearing notice",
          "https://capitol.texas.gov/tlodocs/89R/schedules/pdf/C0592026043009001.PDF",
          "Texas Legislature Online",
          "2026-04-30",
        ),
      },
    ],
    media: {
      title: "2026 profile interview",
      description:
        "This KETK interview records Dean's own answers. The embed verifies what was said in the interview; it does not independently establish every claim made in it.",
      embedUrl: "https://www.youtube-nocookie.com/embed/aUN4Pk9gahY",
      originalUrl: "https://www.youtube.com/watch?v=aUN4Pk9gahY",
      source: {
        title: "2026 profile interview with Jay Dean",
        url: "https://www.youtube.com/watch?v=aUN4Pk9gahY",
        publisher: "KETK",
        kind: "interview_statement",
      },
    },
    evidenceNote:
      "Official records document offices, committee assignments, bill histories, and published district figures. Reported items describe what a newsroom observed or was told. Interview statements are attributed to the speaker and are not converted into RepWatchr conclusions.",
  },
  "leward-j-lafleur-ii": {
    officialId: "leward-j-lafleur-ii",
    eyebrow: "Marion County verified brief",
    title: "County power, public service, and an unresolved record.",
    summary:
      "A role-aware review of the Marion County Judge's executive, budget, emergency-management, regional-planning, and constitutional-court record. Official actions, reported allegations, responses, and research gaps remain visibly separate.",
    storyLead:
      "Leward J. LaFleur II is a U.S. Navy veteran who was appointed Marion County Judge in August 2018 and began his first elected term in 2019. His public record includes regional transportation leadership, rural-broadband work, emergency declarations, and water advocacy. It also includes reported unwanted-touching allegations that he denies and that had not produced a publicly located charge, conviction, or final adjudication as of this review.",
    bottomLine:
      "LaFleur is the incumbent Republican nominee after receiving 1,079 votes in an unopposed 2026 primary. The available record documents county and regional service, but it does not yet support a complete performance grade: RepWatchr still needs multi-year budget and audit trends, Commissioners Court attendance and decisions, contract records, court-administration metrics, and a later authoritative disposition of the reported allegations.",
    headlineSignal: {
      value: "1,079",
      label: "2026 GOP primary votes",
      detail: "Unopposed primary; not a countywide approval rating",
    },
    reviewedThrough: "July 27, 2026",
    facts: [
      {
        id: "county-office",
        metric: "Since 2019",
        label: "First elected term",
        detail:
          "Commissioners appointed LaFleur in August 2018 after he won the Republican primary; his first elected term began in 2019.",
        source: reported(
          "Marion County Judge Lex Jones retires; LaFleur appointed",
          "https://news-journal.com/2018/08/30/marion-county-judge-lex-jones-retires-lafleur-appointed/",
          "Longview News-Journal",
          "2018-08-30",
        ),
      },
      {
        id: "county-authority",
        metric: "Countywide",
        label: "Executive and court authority",
        detail:
          "The county judge presides over Commissioners Court and also leads a constitutional county court with criminal, probate, and other jurisdiction defined by Texas law.",
        source: officialRecord(
          "Constitutional county courts",
          "https://www.txcourts.gov/media/1460595/constitutional-county-courts.pdf",
          "Texas Office of Court Administration",
        ),
      },
      {
        id: "regional-board",
        metric: "Selected chair · 2023",
        label: "CEO–RTPO regional role",
        detail:
          "ETCOG says LaFleur joined the board in 2018, its executive committee in 2021, and was selected as chair in 2023.",
        source: officialRecord(
          "ETCOG announces new CEO–RTPO leadership",
          "https://www.etcog.org/etcog-announces-new-leadership-for-ceo-rtpo-board",
          "East Texas Council of Governments",
          "2023-05-25",
        ),
      },
      {
        id: "navy-service",
        metric: "U.S. Navy",
        label: "Military service",
        detail:
          "LaFleur described returning to East Texas after serving in the U.S. Navy in an ETCOG leadership announcement.",
        source: officialRecord(
          "ETCOG announces new CEO–RTPO leadership",
          "https://www.etcog.org/etcog-announces-new-leadership-for-ceo-rtpo-board",
          "East Texas Council of Governments",
          "2023-05-25",
        ),
      },
      {
        id: "primary-2026",
        metric: "1,079 votes",
        label: "2026 Republican primary",
        detail:
          "The official Marion County report lists LaFleur as the unopposed Republican nominee, with 594 undervotes.",
        source: officialRecord(
          "Official 2026 Republican primary results",
          "https://marioncountytaxoffice.com/wp-content/uploads/2026/03/OFFICIAL-RESULTS-REPUBLICAN-PARTY.pdf",
          "Marion County Elections",
          "2026-03-03",
        ),
      },
      {
        id: "judicial-education",
        metric: "Academy fellow",
        label: "Continuing judicial education",
        detail:
          "Marion County announced LaFleur's induction as a Texas Judicial Academy fellow for education beyond statutory requirements.",
        source: officialRecord(
          "Judge LaFleur inducted as a Texas Judicial Academy fellow",
          "https://www.co.marion.tx.us/upload/page/1263/2021/Judge%20LaFleur%20Inducted%20as%20Fellow%20Press%20Release%208-21.pdf",
          "Marion County",
          "2021-08-01",
        ),
      },
    ],
    strengths: [
      {
        id: "regional-transportation",
        title: "Regional transportation and workforce leadership",
        summary:
          "Documented service on the 14-county CEO–RTPO board and executive committee, including selection as chair in 2023.",
        detail:
          "ETCOG records show LaFleur joined the CEO–RTPO board in 2018, moved to its executive committee in 2021, and was selected as chair in 2023. The board coordinates rural transportation priorities and local workforce-policy responsibilities across East Texas.",
        sources: [
          officialRecord(
            "LaFleur appointed to CEO–RTPO executive committee",
            "https://www.etcog.org/etcog-ceo-rtpo-board-member-judge-leward-lafleur-appointed-to-executive-committee",
            "East Texas Council of Governments",
            "2021-12-15",
          ),
          officialRecord(
            "ETCOG announces new CEO–RTPO leadership",
            "https://www.etcog.org/etcog-announces-new-leadership-for-ceo-rtpo-board",
            "East Texas Council of Governments",
            "2023-05-25",
          ),
        ],
        caution:
          "Board titles document responsibility and participation; they do not by themselves establish project outcomes for Marion County.",
      },
      {
        id: "rural-broadband",
        title: "A documented push for rural broadband",
        summary:
          "LaFleur described a multi-county broadband project in 2022; later reporting documented fiber construction in parts of Marion County.",
        detail:
          "KLTV reported LaFleur working with Harrison and Gregg counties on a broadband project extending toward the Louisiana line. By 2026, local reporting said fiber construction was underway in parts of Marion County while funding and coverage gaps remained.",
        sources: [
          reported(
            "Marion County judge has plan to bring broadband to rural residents",
            "https://www.kltv.com/2022/05/12/webxtra-marion-county-judge-has-plan-bring-broadband-rural-residents/",
            "KLTV",
            "2022-05-12",
          ),
          reported(
            "East Texas broadband expansion advances, but funding and timing hamper projects",
            "https://marshallnewsmessenger.com/2026/02/02/east-texas-broadband-internet-expansion-advances-but-funding-timing-hamper-some-projects/",
            "Marshall News Messenger",
            "2026-02-02",
          ),
        ],
        caution:
          "Construction in parts of the county is not the same as universal, affordable service. Coverage, adoption, cost, and completion data still need to be tracked.",
      },
      {
        id: "emergency-response",
        title: "Emergency action during severe weather",
        summary:
          "The record includes a 2021 winter-storm disaster response and a signed March 2026 disaster declaration.",
        detail:
          "During the February 2021 winter storm, KLTV reported that LaFleur issued a second disaster declaration while the county faced widespread water and power disruption. Marion County also publishes a March 2026 disaster declaration signed under the county judge's emergency authority.",
        sources: [
          reported(
            "Marion County declares disaster again after winter storm",
            "https://www.kltv.com/2021/02/24/we-need-help-over-here-marion-county-declares-disaster-second-time-following-winter-storm/",
            "KLTV",
            "2021-02-24",
          ),
          officialRecord(
            "March 2026 Marion County disaster declaration",
            "https://www.co.marion.tx.us/upload/page/1263/2026/03-2026%20MC%20Disaster%20Declaration.pdf",
            "Marion County",
            "2026-03-01",
          ),
        ],
        caution:
          "Declarations document the use of emergency authority. A full assessment still requires response times, procurement, recovery spending, and after-action outcomes.",
      },
      {
        id: "water-advocacy",
        title: "Public opposition to a Lake O' the Pines water transfer",
        summary:
          "LaFleur joined local officials and residents opposing a proposed sale of lake water rights to North Texas.",
        detail:
          "Reporting documented Marion County's special public meeting and LaFleur's opposition during the regional fight over a proposed Lake O' the Pines water transfer. The broader dispute later produced state-law procedural safeguards.",
        sources: [
          reported(
            "Marion County commissioners fight Lake O' the Pines water sale",
            "https://www.kltv.com/2025/02/14/marion-county-commissioners-fight-lake-o-pines-water-sale-dfw-area/",
            "KLTV",
            "2025-02-14",
          ),
          reported(
            "East Texans unite to stop water sale to Dallas suburbs",
            "https://www.texastribune.org/2025/04/17/east-texas-defends-water-lake-the-pines/",
            "The Texas Tribune",
            "2025-04-17",
          ),
        ],
        caution:
          "The documented record supports public opposition and advocacy, not sole credit for stopping or permanently preventing a transfer.",
      },
      {
        id: "judicial-education",
        title: "Judicial education beyond the statutory minimum",
        summary:
          "An official county announcement documents his induction as a Texas Judicial Academy fellow.",
        detail:
          "Marion County's 2021 announcement says LaFleur completed education beyond the statutory requirement for county judges and was inducted as a Texas Judicial Academy fellow.",
        sources: [
          officialRecord(
            "Judge LaFleur inducted as a Texas Judicial Academy fellow",
            "https://www.co.marion.tx.us/upload/page/1263/2021/Judge%20LaFleur%20Inducted%20as%20Fellow%20Press%20Release%208-21.pdf",
            "Marion County",
            "2021-08-01",
          ),
        ],
        caution:
          "Training is relevant preparation, but it is not a substitute for docket, disposition, recusal, access, or court-administration performance data.",
      },
    ],
    concerns: [
      {
        id: "reported-allegations",
        title: "Reported allegations, explicit denials, and no located final disposition",
        summary:
          "Two people reportedly alleged unwanted sexual touching connected to a 2025 Halloween gathering. LaFleur denies both allegations.",
        detail:
          "CBS19, KLTV, and the News-Journal reported separate allegations and a changing referral history. On April 21, 2026, the district attorney said LaFleur had not been charged; LaFleur's attorney denied both allegations. RepWatchr located no later authoritative arrest, charge, conviction, acquittal, dismissal, or final adjudication through July 27, 2026.",
        sources: [
          reported(
            "Marion County judge denies groping allegation",
            "https://www.cbs19.tv/article/news/local/marion-county-judge-leward-lafleur-denies-groping-teen-party/501-525ec554-78d1-440a-9fd7-eb2730adbb4e",
            "CBS19",
            "2026-02-23",
          ),
          reported(
            "Marion County judge denies allegations of unwanted touching",
            "https://www.kltv.com/2026/04/21/marion-county-judge-denies-allegations-unwanted-touching-halloween-party/",
            "KLTV",
            "2026-04-21",
          ),
          reported(
            "District attorney to review additional complaint",
            "https://news-journal.com/2026/04/21/da-to-review-additional-complaint-possible-felony-charges-against-marion-county-judge/",
            "Longview News-Journal",
            "2026-04-21",
          ),
        ],
        response:
          "LaFleur and his attorney denied the allegations. The April 21 reporting said he had not been charged.",
        caution:
          "Allegations are not findings of guilt. RepWatchr does not treat them as proven misconduct or use them to calculate a performance grade.",
      },
    ],
    turningPoints: [
      {
        id: "appointment-2018",
        dateLabel: "Aug. 2018",
        label: "County leadership",
        title: "Commissioners appoint LaFleur to the county judge's office",
        detail:
          "Commissioners selected him to complete the retiring county judge's term after LaFleur won the Republican primary.",
        sources: [
          reported(
            "Marion County Judge Lex Jones retires; LaFleur appointed",
            "https://news-journal.com/2018/08/30/marion-county-judge-lex-jones-retires-lafleur-appointed/",
            "Longview News-Journal",
            "2018-08-30",
          ),
        ],
      },
      {
        id: "winter-storm-2021",
        dateLabel: "Feb. 2021",
        label: "Emergency management",
        title: "A second disaster declaration follows the winter storm",
        detail:
          "KLTV reported severe water and power disruption as LaFleur sought additional county relief.",
        sources: [
          reported(
            "Marion County declares disaster again after winter storm",
            "https://www.kltv.com/2021/02/24/we-need-help-over-here-marion-county-declares-disaster-second-time-following-winter-storm/",
            "KLTV",
            "2021-02-24",
          ),
        ],
      },
      {
        id: "rtpo-chair-2023",
        dateLabel: "May 2023",
        label: "Regional leadership",
        title: "CEO–RTPO board selects LaFleur as chair",
        detail:
          "The role followed board service beginning in 2018 and executive-committee service beginning in 2021.",
        sources: [
          officialRecord(
            "ETCOG announces new CEO–RTPO leadership",
            "https://www.etcog.org/etcog-announces-new-leadership-for-ceo-rtpo-board",
            "East Texas Council of Governments",
            "2023-05-25",
          ),
        ],
      },
      {
        id: "water-dispute-2025",
        dateLabel: "Feb.–Apr. 2025",
        label: "Water policy",
        title: "LaFleur joins opposition to a proposed lake-water transfer",
        detail:
          "Marion County's public meeting became part of a broader East Texas campaign against the proposal.",
        sources: [
          reported(
            "Marion County commissioners fight Lake O' the Pines water sale",
            "https://www.kltv.com/2025/02/14/marion-county-commissioners-fight-lake-o-pines-water-sale-dfw-area/",
            "KLTV",
            "2025-02-14",
          ),
          reported(
            "East Texans unite to stop water sale to Dallas suburbs",
            "https://www.texastribune.org/2025/04/17/east-texas-defends-water-lake-the-pines/",
            "The Texas Tribune",
            "2025-04-17",
          ),
        ],
      },
      {
        id: "primary-and-allegations-2026",
        dateLabel: "Mar.–Apr. 2026",
        label: "Election and public scrutiny",
        title: "An unopposed primary win is followed by renewed allegation reporting",
        detail:
          "The official primary report lists 1,079 votes for LaFleur. April reporting described an additional allegation, his denial, and further prosecutorial review without a charge at that time.",
        sources: [
          officialRecord(
            "Official 2026 Republican primary results",
            "https://marioncountytaxoffice.com/wp-content/uploads/2026/03/OFFICIAL-RESULTS-REPUBLICAN-PARTY.pdf",
            "Marion County Elections",
            "2026-03-03",
          ),
          reported(
            "Marion County judge denies allegations of unwanted touching",
            "https://www.kltv.com/2026/04/21/marion-county-judge-denies-allegations-unwanted-touching-halloween-party/",
            "KLTV",
            "2026-04-21",
          ),
        ],
      },
    ],
    timeline: [
      {
        id: "appointed-county-judge",
        dateLabel: "Aug. 30, 2018",
        title: "Appointed Marion County Judge",
        detail:
          "Commissioners appointed LaFleur to complete the retiring county judge's term.",
        source: reported(
          "Marion County Judge Lex Jones retires; LaFleur appointed",
          "https://news-journal.com/2018/08/30/marion-county-judge-lex-jones-retires-lafleur-appointed/",
          "Longview News-Journal",
          "2018-08-30",
        ),
      },
      {
        id: "winter-storm-disaster",
        dateLabel: "Feb. 24, 2021",
        title: "Winter-storm disaster response",
        detail:
          "KLTV reported a second county disaster declaration amid continued water and power disruption.",
        source: reported(
          "Marion County declares disaster again after winter storm",
          "https://www.kltv.com/2021/02/24/we-need-help-over-here-marion-county-declares-disaster-second-time-following-winter-storm/",
          "KLTV",
          "2021-02-24",
        ),
      },
      {
        id: "judicial-academy-fellow",
        dateLabel: "Aug. 2021",
        title: "Inducted as a Texas Judicial Academy fellow",
        detail:
          "The county announcement cites judicial education beyond statutory requirements.",
        source: officialRecord(
          "Judge LaFleur inducted as a Texas Judicial Academy fellow",
          "https://www.co.marion.tx.us/upload/page/1263/2021/Judge%20LaFleur%20Inducted%20as%20Fellow%20Press%20Release%208-21.pdf",
          "Marion County",
          "2021-08-01",
        ),
      },
      {
        id: "broadband-plan",
        dateLabel: "May 12, 2022",
        title: "Multi-county broadband plan described publicly",
        detail:
          "LaFleur told KLTV Marion County was working with Harrison and Gregg counties on expansion toward the Louisiana line.",
        source: reported(
          "Marion County judge has plan to bring broadband to rural residents",
          "https://www.kltv.com/2022/05/12/webxtra-marion-county-judge-has-plan-bring-broadband-rural-residents/",
          "KLTV",
          "2022-05-12",
        ),
      },
      {
        id: "disaster-declaration-2026",
        dateLabel: "Mar. 2026",
        title: "County disaster declaration signed",
        detail:
          "The official county document records LaFleur's use of emergency authority.",
        source: officialRecord(
          "March 2026 Marion County disaster declaration",
          "https://www.co.marion.tx.us/upload/page/1263/2026/03-2026%20MC%20Disaster%20Declaration.pdf",
          "Marion County",
          "2026-03-01",
        ),
      },
      {
        id: "allegation-review-2026",
        dateLabel: "Apr. 21, 2026",
        title: "Additional allegation and denial reported",
        detail:
          "KLTV reported further review, LaFleur's denial, and that he had not been charged.",
        source: reported(
          "Marion County judge denies allegations of unwanted touching",
          "https://www.kltv.com/2026/04/21/marion-county-judge-denies-allegations-unwanted-touching-halloween-party/",
          "KLTV",
          "2026-04-21",
        ),
      },
    ],
    media: {
      title: "LaFleur on the Lake O' the Pines water-rights dispute",
      description:
        "This public video records LaFleur's own account of the water issue. It verifies what he said, not every underlying factual claim or the eventual policy outcome.",
      embedUrl: "https://www.youtube-nocookie.com/embed/3oZgRLoGWDs",
      originalUrl: "https://www.youtube.com/watch?v=3oZgRLoGWDs",
      source: {
        title: "Marion County Judge LaFleur on water rights",
        url: "https://www.youtube.com/watch?v=3oZgRLoGWDs",
        publisher: "Judge Leward J. LaFleur public video",
        kind: "interview_statement",
      },
    },
    evidenceNote:
      "Official records document the office, jurisdiction, election total, declarations, training, and regional-board roles. Reporting documents observed projects, attributed statements, allegations, denials, and the procedural status known at publication. Missing budget, attendance, contracting, access, and court-administration analysis is labeled as a RepWatchr research gap—not an adverse finding. Reported allegations are not treated as proven misconduct or used to calculate a grade.",
  },
} as const satisfies Record<string, OfficialVerifiedBriefData>;

export type OfficialVerifiedBriefId = keyof typeof OFFICIAL_VERIFIED_BRIEFS;

export function getOfficialVerifiedBrief(officialId: string): OfficialVerifiedBriefData | undefined {
  return OFFICIAL_VERIFIED_BRIEFS[officialId as OfficialVerifiedBriefId];
}

export function getOfficialVerifiedBriefSources(
  brief: OfficialVerifiedBriefData | undefined,
): VerifiedBriefSource[] {
  if (!brief) return [];

  const sources = [
    ...brief.facts.map((fact) => fact.source),
    ...brief.strengths.flatMap((item) => item.sources),
    ...brief.concerns.flatMap((item) => item.sources),
    ...brief.turningPoints.flatMap((item) => item.sources),
    ...brief.timeline.map((item) => item.source),
    brief.media.source,
  ];
  const seen = new Set<string>();

  return sources.filter((source) => {
    if (!source.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
