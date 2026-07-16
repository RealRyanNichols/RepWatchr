export type VerifiedBriefEvidenceKind = "official_record" | "reported" | "interview_statement";

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

export const OFFICIAL_VERIFIED_BRIEFS = {
  "jay-dean": {
    officialId: "jay-dean",
    eyebrow: "2026 verified brief",
    title: "The office, the district, and the record in motion.",
    summary:
      "A fast, visual read built from Texas legislative records and clearly labeled reporting. Official records stay separate from reported activity and interview statements.",
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
          "HB 138 continued the state program that analyzes health and financial effects of proposed insurance mandates.",
        source: officialRecord(
          "HB 138 history",
          "https://capitol.texas.gov/BillLookup/History.aspx?Bill=HB138&LegSess=89R",
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
