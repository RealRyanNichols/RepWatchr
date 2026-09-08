import { cache } from "react";
import type { Official } from "@/types";
import type { OfficialSearchRow } from "@/lib/official-search";
import { getAllOfficials } from "@/lib/data";
import {
  getSchoolBoardDossiers,
  type CandidateDossier,
} from "@/lib/school-board-research";
import {
  currentHarletonMember,
  harletonRoster,
  schoolBoardIdentityLinks,
} from "@/data/coverage/harleton-roster";
import { getSchoolBoardCandidateUrl } from "@/lib/school-board-urls";

export function isVacancyRecord(
  candidate: Pick<CandidateDossier, "candidate_id" | "full_name">,
) {
  return /\b(vacant|vacancy|unfilled|position open)\b/i.test(
    `${candidate.full_name} ${candidate.candidate_id.replace(/_/g, " ")}`,
  );
}

export function schoolBoardProfileHref(
  candidate: Pick<CandidateDossier, "district_slug" | "candidate_id">,
) {
  return getSchoolBoardCandidateUrl(candidate);
}

export function schoolBoardRecordStatus(candidate: CandidateDossier) {
  const current = currentHarletonMember(candidate.candidate_id);
  if (current)
    return {
      label:
        current.selection === "appointed"
          ? "Appointed trustee · roster checked"
          : "Elected trustee · roster checked",
      date: harletonRoster.observedAt,
      sourceUrl: harletonRoster.sourceUrl,
      snapshot: false,
    };
  if (candidate.district_slug === harletonRoster.districtSlug)
    return {
      label: "Earlier record · absent from current district roster",
      date: candidate.source_snapshot?.snapshot_date ?? null,
      sourceUrl: harletonRoster.sourceUrl,
      snapshot: Boolean(candidate.source_snapshot),
    };
  if (/manager|appointed/i.test(candidate.role ?? ""))
    return {
      label: "Appointed/manager role in source · needs refresh",
      date: candidate.source_snapshot?.snapshot_date ?? null,
      sourceUrl:
        candidate.source_snapshot?.url ?? candidate.sources?.[0]?.url ?? null,
      snapshot: Boolean(candidate.source_snapshot),
    };
  return {
    label: candidate.source_snapshot
      ? `${candidate.source_snapshot.snapshot_date.match(/\d{4}/)?.[0] ?? "Dated"} roster snapshot · current membership unconfirmed`
      : "Research record · current membership unconfirmed",
    date: candidate.source_snapshot?.snapshot_date ?? null,
    sourceUrl:
      candidate.source_snapshot?.url ?? candidate.sources?.[0]?.url ?? null,
    snapshot: Boolean(candidate.source_snapshot),
  };
}

export const getSchoolBoardSearchIndex = cache(() => {
  const officials = new Set(getAllOfficials().map((official) => official.id));
  const linkedCandidates = new Set(
    schoolBoardIdentityLinks
      .filter((link) => officials.has(link.officialId))
      .map((link) => link.candidateId),
  );
  const dossiers = getSchoolBoardDossiers();
  const named = dossiers.filter((candidate) => !isVacancyRecord(candidate));
  const rows = named
    .filter((candidate) => !linkedCandidates.has(candidate.candidate_id))
    .map((candidate): OfficialSearchRow => {
      const status = schoolBoardRecordStatus(candidate);
      const sourceUrls = new Set(
        [
          candidate.source_snapshot?.url,
          ...(candidate.sources?.map((source) => source.url) ?? []),
        ].filter(Boolean),
      );
      const counties = candidate.county
        .split(/\s*[/,]\s*/)
        .map((county) => county.replace(/\s+County$/i, "").trim())
        .filter(Boolean);
      const official: Official = {
        id: `school-research:${candidate.candidate_id}`,
        name: candidate.full_name,
        firstName: candidate.full_name.split(" ")[0],
        lastName: candidate.full_name.split(" ").slice(1).join(" "),
        party: "NP",
        level: "school-board",
        position: candidate.role || "School-board research record",
        district: candidate.seat,
        jurisdiction: candidate.district,
        county: counties,
        state: candidate.state,
        termStart: "",
        termEnd: "",
        contactInfo: {},
        reviewStatus: "needs_source_review",
      };
      return {
        official,
        recordKind: "school-research",
        profileHref: schoolBoardProfileHref(candidate),
        recordStatus: status.label,
        sourceSnapshotDate: candidate.source_snapshot?.snapshot_date ?? null,
        rosterCheckedAt: status.snapshot ? null : status.date,
        provenanceUrl: status.sourceUrl,
        score: null,
        letterGrade: null,
        redFlagCount: 0,
        hasFundingData: false,
        hasVotingData: false,
        missingSources: true,
        recentlyUpdated:
          !status.snapshot &&
          status.date !== null &&
          Date.now() - Date.parse(status.date) <= 90 * 86400000,
        sourceCount: sourceUrls.size,
        profileCompleteness: 0,
        completionMissingItems: ["term", "photo", "vote_record", "funding"],
        state: candidate.state.toUpperCase(),
        countyValues: counties,
        city: "",
        officeType: "school-board",
        officeTypeLabel: "School Board",
        lastUpdated: candidate.last_updated ?? null,
        voteCount: 0,
        fundingCycle: null,
        viewCount: 0,
        watchCount: 0,
        relevanceScore: 0,
        missingSourcePriority: 100,
        searchText: [
          candidate.full_name,
          candidate.candidate_id,
          candidate.district,
          candidate.seat,
          candidate.role,
          candidate.county,
          candidate.state,
          "school board trustee",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .trim(),
      };
    });
  return {
    rows,
    dossiers,
    namedRecords: named.length,
    excludedVacancies: dossiers.length - named.length,
    linkedRecords: named.filter((candidate) =>
      linkedCandidates.has(candidate.candidate_id),
    ).length,
    snapshotRecords: named.filter((candidate) => candidate.source_snapshot)
      .length,
  };
});
