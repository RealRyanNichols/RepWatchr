import { getRepWatchrService, getRepWatchrServices } from "@/data/repwatchr-services";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const service = slug ? getRepWatchrService(slug) : undefined;
  const services = getRepWatchrServices();
  const special =
    slug === "investors"
      ? {
          pageType: "RepWatchr partners",
          headline: "Build public-record infrastructure.",
          supportLine:
            "RepWatchr is building accountable profiles, source trails, watchlists, dashboards, and civic data workflows.",
          jurisdiction: "Investor and partner briefing",
          metricValue: "Build",
          metricLabel: "the public record",
          path: "/investors",
        }
      : slug === "public-data-api"
        ? {
            pageType: "Public data access",
            headline: "Put sourced civic data to work.",
            supportLine:
              "Request future access to public profiles, sources, jurisdictions, races, and aggregate trends.",
            jurisdiction: "RepWatchr public data",
            metricValue: "API",
            metricLabel: "access request",
            path: "/packages/public-data-api",
          }
        : undefined;

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: special?.pageType ?? (service ? "Service" : "Services page"),
    headline: special?.headline ?? (service ? service.name : "Build the packet. Show the source."),
    supportLine:
      special?.supportLine ??
      service?.summary ??
      "Free source-packet tools and public-record research for races, officials, boards, and records.",
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    jurisdiction: special?.jurisdiction ?? service?.eyebrow ?? "Public-record research",
    metricValue: special?.metricValue ?? service?.priceLabel ?? services.length,
    metricLabel: special?.metricLabel ?? (service ? service.billingLabel : "packages"),
    path: special?.path ?? (service ? `/services/${service.slug}` : "/services"),
    badges: [
      { label: "Turnaround", value: service?.turnaround ?? "Start free", tone: "blue" },
      { label: "Inputs", value: service?.inputs.length ?? "Source URL", tone: "gold" },
      { label: "Deliverables", value: service?.deliverables.length ?? "Packets", tone: "green" },
    ],
  });
}
