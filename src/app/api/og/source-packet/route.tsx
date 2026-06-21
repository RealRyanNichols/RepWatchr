import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const target = url.searchParams.get("target") ?? "RepWatchr source packet";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Source packet",
    title: target,
    subtitle: "Submit the public source, correction, filing, vote, agenda, clip, or missing record for review.",
    jurisdiction: "Public records first",
    metricValue: id ? "Queued" : "Open",
    metricLabel: id ? "submission" : "source review",
    path: id ? `/submit-source/thanks?id=${encodeURIComponent(id)}` : "/submit-source",
    badges: [
      { label: "Packet", value: id ? "Saved" : "Build", tone: "blue" },
      { label: "Review", value: "Admin", tone: "gold" },
      { label: "Share", value: "Ready", tone: "red" },
    ],
  });
}
