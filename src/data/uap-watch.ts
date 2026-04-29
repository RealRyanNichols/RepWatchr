const checkedAt = "2026-04-29";

export type UapSourceStatus = "live_collection" | "rolling_release" | "introduced_bill" | "declassification_process";
export type UapTrackStatus = "active" | "watching" | "needs_records" | "unverified_claims";

export interface UapWatchSource {
  id: string;
  title: string;
  agency: string;
  url: string;
  status: UapSourceStatus;
  summary: string;
  lastCheckedAt: string;
}

export interface UapWatchLane {
  id: string;
  label: string;
  title: string;
  status: UapTrackStatus;
  completion: number;
  detail: string;
  nextStep: string;
}

export const uapWatchSources: UapWatchSource[] = [
  {
    id: "nara-uap-records",
    title: "Records Related to UFOs and UAPs at the National Archives",
    agency: "National Archives",
    url: "https://www.archives.gov/research/topics/uaps",
    status: "live_collection",
    summary:
      "NARA has a public research hub for UFO and UAP records, including Record Group 615, related photographs, moving images, sound recordings, textual records, microfilm, and presidential-library holdings.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "nara-april-2025-release",
    title: "National Archives Releases UAP Records",
    agency: "National Archives",
    url: "https://www.archives.gov/press/press-releases/2025/nr25-07",
    status: "rolling_release",
    summary:
      "NARA announced an April 24, 2025 release of UAP records transferred from ODNI, OSD, FAA, and NRC, and said additional records will be added on an ongoing rolling basis as agencies transfer them.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "hr-1187-uap-transparency-act",
    title: "H.R.1187 - UAP Transparency Act",
    agency: "Congress.gov",
    url: "https://www.congress.gov/bill/119th-congress/house-bill/1187",
    status: "introduced_bill",
    summary:
      "Introduced February 11, 2025 and referred to House Oversight and Government Reform. The bill would direct federal agencies to declassify UAP records and publish them on public agency websites.",
    lastCheckedAt: checkedAt,
  },
  {
    id: "aaro-declassification-process",
    title: "AARO and the Declassification Process",
    agency: "AARO",
    url: "https://www.aaro.mil/Portals/136/PDFs/Information%20Papers/AARO_Declassification_Info_Paper_2025.pdf",
    status: "declassification_process",
    summary:
      "AARO explains that declassification depends on originating offices, source-and-method protection, redactions, public-release review, and transfer of UAP records to NARA where applicable.",
    lastCheckedAt: checkedAt,
  },
];

export const uapWatchLanes: UapWatchLane[] = [
  {
    id: "official-records",
    label: "Official records",
    title: "NARA release tracker",
    status: "active",
    completion: 48,
    detail: "Track Record Group 615, rolling NARA releases, source agencies, catalog entries, dates, and downloadable record links.",
    nextStep: "Build a release log from NARA catalog items and agency transfer notices.",
  },
  {
    id: "legislation",
    label: "Legislation",
    title: "Transparency bills and mandates",
    status: "watching",
    completion: 34,
    detail: "Track UAP disclosure bills, NDAA sections, committee referrals, hearing dates, cosponsors, and whether release requirements are law or proposed.",
    nextStep: "Add bill status, all actions, committee assignments, and related amendments.",
  },
  {
    id: "declassification",
    label: "Declassification",
    title: "What can actually be released",
    status: "watching",
    completion: 31,
    detail: "Separate public records, redacted records, classified source/method issues, and unresolved claims so users know what is evidence and what is still blocked.",
    nextStep: "Map AARO release categories against NARA records and FOIA/public-release pages.",
  },
  {
    id: "hearings",
    label: "Hearings",
    title: "Congressional witness and hearing file",
    status: "needs_records",
    completion: 20,
    detail: "Capture hearing witnesses, transcripts, exhibits, claims, agency responses, and follow-up records without treating testimony as a final finding.",
    nextStep: "Add hearing pages, witness statements, committee videos, and exhibit indexes.",
  },
  {
    id: "alien-claims",
    label: "Alien claims",
    title: "Claims requiring proof",
    status: "unverified_claims",
    completion: 12,
    detail: "Keep alien, non-human intelligence, crash retrieval, biological material, and reverse-engineering claims in a separate evidence bucket until records support them.",
    nextStep: "Create a claim matrix: source, exact quote, record support, contradiction, and missing document.",
  },
];

export const uapEvidenceBuckets = [
  "National Archives catalog record",
  "Agency-originating office",
  "Congressional bill or hearing",
  "AARO case resolution",
  "FOIA or public-release page",
  "Witness claim with exact source",
  "Sensor/video/photo record",
  "Redaction and classification note",
];

export const uapLearningQuestions = [
  "What is the exact source link for the UFO, UAP, or alien claim?",
  "Is this an official record, a hearing statement, a news report, a witness claim, or a social clip?",
  "What agency, committee, witness, or archive owns the original record?",
  "What date was the record created, released, transferred, or testified to?",
  "What part is confirmed, what part is alleged, and what document is still missing?",
  "What would prove or disprove the claim without relying on hype?",
];

export const uapPageStats = {
  officialSources: uapWatchSources.length,
  trackerLanes: uapWatchLanes.length,
  averageCompletion: Math.round(uapWatchLanes.reduce((sum, lane) => sum + lane.completion, 0) / uapWatchLanes.length),
  activeRecords: uapWatchSources.filter((source) => source.status === "live_collection" || source.status === "rolling_release").length,
};
