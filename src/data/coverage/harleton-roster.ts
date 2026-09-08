// Identity/office observations only. A roster check does not verify votes,
// biographical claims, conflicts, or the rest of an existing dossier.
import { getSchoolBoardCandidateUrl } from "@/lib/school-board-urls";
export const harletonRoster = {
  district: "Harleton ISD",
  districtSlug: "harleton_isd",
  state: "TX",
  county: "Harrison",
  observedAt: "2026-09-08",
  sourceUrl: "https://www.harletonisd.net/76025_3",
  sourceTitle: "Harleton ISD School Board Information",
  members: [
    {
      name: "Ben Wilson",
      candidateId: "ben_wilson_harleton_isd",
      officialId: "ben-wilson-harleton-isd",
      seat: "Place 1",
      role: "Trustee",
      selection: "elected",
      selectedMonth: "2024-11",
      termEndMonth: "2028-11",
    },
    {
      name: "Tim Skaggs",
      candidateId: "tim_skaggs_harleton_isd",
      officialId: "tim-skaggs-harleton-isd",
      seat: "Place 2",
      role: "Trustee",
      selection: "elected",
      selectedMonth: "2024-11",
      termEndMonth: "2028-11",
    },
    {
      name: "Harvey Fox",
      candidateId: "harvey_fox_harleton_isd",
      officialId: "harvey-fox-harleton-isd",
      seat: "Place 3",
      role: "Secretary",
      selection: "elected",
      selectedMonth: "2018-11",
      termEndMonth: "2026-11",
    },
    {
      name: "Chance Ebarb",
      candidateId: "chance_ebarb_harleton_isd",
      officialId: null,
      seat: "Place 4",
      role: "Trustee",
      selection: "appointed",
      selectedMonth: "2026-07",
      termEndMonth: null,
    },
    {
      name: "Brian Fitzgerald",
      candidateId: "brian_fitzgerald_harleton_isd",
      officialId: "brian-fitzgerald-harleton-isd",
      seat: "Place 5",
      role: "Trustee",
      selection: "elected",
      selectedMonth: "2024-11",
      termEndMonth: "2028-11",
    },
    {
      name: "Patrick McGill",
      candidateId: "patrick_mcgill_harleton_isd",
      officialId: "patrick-mcgill-harleton-isd",
      seat: "Place 6",
      role: "Trustee",
      selection: "elected",
      selectedMonth: "2016-11",
      termEndMonth: "2028-11",
    },
    {
      name: "Jacob Muehlstein",
      candidateId: "jacob_muehlstein_harleton_isd",
      officialId: "jacob-muehlstein-harleton-isd",
      seat: "Place 7",
      role: "President",
      selection: "elected",
      selectedMonth: "2018-11",
      termEndMonth: "2026-11",
    },
  ],
} as const;

// Explicit reviewed links between record IDs; never join people by fuzzy names.
export const schoolBoardIdentityLinks = [
  ...harletonRoster.members
    .filter((member) => member.officialId)
    .map((member) => ({
      candidateId: member.candidateId,
      officialId: member.officialId!,
      evidenceUrl: harletonRoster.sourceUrl,
      evidenceKey: `Harleton ISD / ${member.seat}`,
    })),
  {
    candidateId: "pat_mcgill_harleton_isd",
    officialId: "patrick-mcgill-harleton-isd",
    evidenceUrl: harletonRoster.sourceUrl,
    evidenceKey:
      "Harleton district 102-905; current Patrick McGill listing uses public trustee email mcgillpat@harletonisd.net; AskTED source name Pat McGill",
  },
  {
    candidateId: "kevin_evers_harleton_isd",
    officialId: "kevin-evers-harleton-isd",
    evidenceUrl:
      "https://meetings.boardbook.org/Documents/DownloadPDF/92d185dc-6035-4ae5-9435-c52b1c97a761?org=1864",
    evidenceKey: "Existing Harleton ISD Place 4 historical record",
  },
];

export function currentHarletonMember(candidateId: string) {
  const linkedOfficial = schoolBoardIdentityLinks.find(
    (link) => link.candidateId === candidateId,
  )?.officialId;
  return harletonRoster.members.find(
    (member) =>
      member.candidateId === candidateId ||
      Boolean(linkedOfficial && member.officialId === linkedOfficial),
  );
}

export function harletonMemberHref(
  member: (typeof harletonRoster.members)[number],
) {
  return member.officialId
    ? `/officials/${member.officialId}`
    : getSchoolBoardCandidateUrl({
        district_slug: harletonRoster.districtSlug,
        candidate_id: member.candidateId,
      });
}
