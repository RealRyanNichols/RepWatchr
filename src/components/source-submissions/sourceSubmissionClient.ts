import { buildSourcePacket, normalizeSourceSubmission, type SourceSubmissionInput } from "@/lib/source-submissions";

export type SourceSubmissionResponse = {
  ok?: boolean;
  submissionId?: string;
  status?: string;
  packet?: string;
  nextAction?: string;
  shareUrl?: string;
  error?: string;
};

export type StoredSourceSubmission = {
  submissionId: string;
  packet: string;
  nextAction: string;
  shareUrl: string;
  targetName: string;
  sourceUrl: string;
  createdAt: string;
};

export const latestSourceSubmissionKey = "repwatchr.latestSourceSubmission.v1";

export function collectSourceAttribution() {
  if (typeof window === "undefined") {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  return {
    referrer: document.referrer || "",
    landingPage: `${window.location.pathname}${window.location.search}`,
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmTerm: params.get("utm_term") ?? "",
    utmContent: params.get("utm_content") ?? "",
  };
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "repwatchr-source-submission";
}

export function buildClientSourcePacket(input: SourceSubmissionInput & { submissionId?: string }) {
  const normalized = normalizeSourceSubmission(input);
  return buildSourcePacket({ ...normalized, submissionId: input.submissionId });
}

export function storeLatestSourceSubmission(input: StoredSourceSubmission) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(latestSourceSubmissionKey, JSON.stringify(input));
    window.localStorage.setItem(latestSourceSubmissionKey, JSON.stringify(input));
  } catch {
    // The thank-you page can still render the ID from the URL.
  }
}

export function readLatestSourceSubmission() {
  if (typeof window === "undefined") return null;
  try {
    const stored =
      window.sessionStorage.getItem(latestSourceSubmissionKey) ??
      window.localStorage.getItem(latestSourceSubmissionKey);
    return stored ? (JSON.parse(stored) as StoredSourceSubmission) : null;
  } catch {
    return null;
  }
}
