import { getRepWatchrService, getRepWatchrServices } from "@/data/repwatchr-services";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const service = slug ? getRepWatchrService(slug) : undefined;
  const services = getRepWatchrServices();

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: service ? "Service" : "Services page",
    title: service?.name ?? "RepWatchr services",
    subtitle: service?.summary ?? "Free source-packet tools and paid public-record research services for races, officials, boards, and records.",
    jurisdiction: service?.eyebrow ?? "Public-record research",
    metricValue: service?.priceLabel ?? services.length,
    metricLabel: service ? service.billingLabel : "packages",
    path: service ? `/services/${service.slug}` : "/services",
    badges: [
      { label: "Turnaround", value: service?.turnaround ?? "Start free", tone: "blue" },
      { label: "Inputs", value: service?.inputs.length ?? "Source URL", tone: "gold" },
      { label: "Deliverables", value: service?.deliverables.length ?? "Packets", tone: "green" },
    ],
  });
}
