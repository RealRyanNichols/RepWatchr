import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const target = url.searchParams.get("target") ?? "RepWatchr source packet";
  const view = url.searchParams.get("view");
  const copy =
    view === "authors"
      ? {
          pageType: "Authors",
          headline: "Meet the people behind the source review.",
          supportLine: "Publishing credits, review roles, corrections, and source accountability.",
          path: "/authors",
        }
      : view === "feedback"
        ? {
            pageType: "Feedback",
            headline: "Tell RepWatchr what needs fixing.",
            supportLine: "Send a correction, missing source, product issue, or accountability lead for review.",
            path: "/feedback",
          }
        : view === "free-packet"
          ? {
              pageType: "Free source packet",
              headline: "Build a shareable receipt packet.",
              supportLine: "Start with the public links, questions, and missing records that matter.",
              path: "/free-packet",
            }
          : {
              pageType: "Source packet",
              headline: id ? "Your source is queued for review." : "Send the receipt.",
              supportLine: target,
              path: id ? `/submit-source/thanks?id=${encodeURIComponent(id)}` : "/submit-source",
            };

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: copy.pageType,
    headline: copy.headline,
    supportLine: copy.supportLine,
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    jurisdiction: "Public records first",
    metricValue: id ? "Queued" : "Open",
    metricLabel: id ? "submission" : "source review",
    path: copy.path,
    badges: [
      { label: "Packet", value: id ? "Saved" : "Build", tone: "blue" },
      { label: "Review", value: "Admin", tone: "gold" },
      { label: "Share", value: "Ready", tone: "red" },
    ],
  });
}
