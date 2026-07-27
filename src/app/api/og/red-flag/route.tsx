import { getAllRedFlagRecords, getRedFlagRecordById } from "@/lib/data";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const flagId = url.searchParams.get("id") ?? url.searchParams.get("flag") ?? "";
  const record = flagId ? getRedFlagRecordById(flagId) : undefined;
  const allFlags = getAllRedFlagRecords();
  const criticalCount = allFlags.filter(({ flag }) => flag.severity === "critical").length;
  const warningCount = allFlags.filter(({ flag }) => flag.severity === "warning").length;

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: record ? "Documented concern" : "Red-flag review",
    headline: record?.flag.title ?? "Open the concern. Check the source.",
    supportLine:
      record?.flag.whyItMatters ??
      "Public-record questions, source links, status, and review context voters should inspect before repeating.",
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    portraitImage: record?.official.photo,
    visualCredit: record?.official.photo
      ? record.official.photoCredit
      : "Original RepWatchr editorial artwork",
    jurisdiction: record ? `${record.official.name} / ${record.official.position}` : "RepWatchr red-flag review",
    metricValue: record ? record.flag.severity : allFlags.length,
    metricLabel: record ? "severity" : "flags loaded",
    path: record ? `/red-flags?flag=${record.flag.id}` : "/red-flags",
    badges: [
      { label: "Critical", value: criticalCount, tone: "red" },
      { label: "Warnings", value: warningCount, tone: "gold" },
      { label: "Officials", value: new Set(allFlags.map(({ official }) => official.id)).size, tone: "blue" },
    ],
  });
}
