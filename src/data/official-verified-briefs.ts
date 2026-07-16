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
} as const satisfies Record<string, OfficialVerifiedBriefData>;

export type OfficialVerifiedBriefId = keyof typeof OFFICIAL_VERIFIED_BRIEFS;

export function getOfficialVerifiedBrief(officialId: string): OfficialVerifiedBriefData | undefined {
  return OFFICIAL_VERIFIED_BRIEFS[officialId as OfficialVerifiedBriefId];
}
