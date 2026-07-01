import { ImageResponse } from "next/og";
import { getOfficialById, getNewsById } from "@/lib/data";
import { getTexasElectionRace } from "@/data/texas-election-races";
import { getRepWatchrService } from "@/data/repwatchr-services";
import { getRepWatchrPackageBySlug, packageRoute } from "@/data/repwatchr-packages";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };

type OgContext = {
  type: string;
  label: string;
  title: string;
  subtitle: string;
  jurisdiction?: string;
  sourceCount?: number;
  confidence?: string;
  path: string;
  accent: string;
};

function fitTitle(title: string) {
  if (title.length > 84) return 52;
  if (title.length > 60) return 60;
  if (title.length > 38) return 70;
  return 82;
}

function clean(value: string | null | undefined, fallback: string) {
  const text = value?.trim();
  return text || fallback;
}

function contextFromRequest(request: Request): OgContext {
  const url = new URL(request.url);
  const type = clean(url.searchParams.get("type"), "home");
  const titleParam = url.searchParams.get("title");
  const subtitleParam = url.searchParams.get("subtitle");
  const jurisdictionParam = url.searchParams.get("jurisdiction");
  const countParam = Number(url.searchParams.get("sourceCount"));
  const confidenceParam = url.searchParams.get("confidence");

  if (type === "official" || type === "profile") {
    const official = getOfficialById(clean(url.searchParams.get("id"), ""));
    return {
      type,
      label: "Official profile",
      title: clean(titleParam, official?.name ?? "Public official profile"),
      subtitle: clean(subtitleParam, official ? `${official.position} / ${official.district ?? official.jurisdiction}` : "Public-record profile"),
      jurisdiction: clean(jurisdictionParam, official?.jurisdiction ?? ""),
      sourceCount: Number.isFinite(countParam) ? countParam : official?.sourceLinks?.length,
      confidence: clean(confidenceParam, official?.reviewStatus ?? "source review"),
      path: official ? `/officials/${official.id}` : "/officials",
      accent: "#dc2626",
    };
  }

  if (type === "story") {
    const article = getNewsById(clean(url.searchParams.get("id"), ""));
    return {
      type,
      label: "Source-backed story",
      title: clean(titleParam, article?.title ?? "RepWatchr story"),
      subtitle: clean(subtitleParam, article?.summary ?? "Public-record accountability story"),
      jurisdiction: clean(jurisdictionParam, article?.locationLabel ?? article?.state ?? ""),
      sourceCount: Number.isFinite(countParam) ? countParam : article?.sourceLinks?.length ?? (article?.sourceUrl ? 1 : undefined),
      confidence: clean(confidenceParam, article?.sourceStatus ?? "source linked"),
      path: article ? `/news/${article.id}` : "/news",
      accent: "#1d4ed8",
    };
  }

  if (type === "race") {
    const race = getTexasElectionRace(clean(url.searchParams.get("slug"), ""));
    return {
      type,
      label: "Race watch",
      title: clean(titleParam, race?.title ?? "Election race watch"),
      subtitle: clean(subtitleParam, race?.summary ?? "Candidates, records, filings, questions, and source links"),
      jurisdiction: clean(jurisdictionParam, race?.region ?? "Texas"),
      sourceCount: Number.isFinite(countParam) ? countParam : race?.sourceLinks.length,
      confidence: clean(confidenceParam, race?.stage ?? "source watch"),
      path: race ? `/elections/texas/${race.slug}` : "/elections",
      accent: "#b45309",
    };
  }

  if (type === "package" || type === "package-interest") {
    const packageItem = getRepWatchrPackageBySlug(clean(url.searchParams.get("slug"), ""));
    const service = getRepWatchrService(clean(url.searchParams.get("slug"), ""));
    return {
      type,
      label: "RepWatchr package",
      title: clean(titleParam, packageItem?.name ?? service?.name ?? "RepWatchr public-record package"),
      subtitle: clean(
        subtitleParam,
        packageItem?.summary ?? service?.summary ?? "Source-first research, packets, monitoring, and public questions",
      ),
      jurisdiction: clean(jurisdictionParam, packageItem?.eyebrow ?? service?.bestFor ?? ""),
      confidence: clean(confidenceParam, packageItem?.expectedTiming ?? service?.turnaround ?? "beta interest"),
      path: packageItem ? packageRoute(packageItem) : service ? `/services/${service.slug}` : "/packages",
      accent: "#2563eb",
    };
  }

  const title = clean(titleParam, type === "methodology" ? "RepWatchr Methodology" : "RepWatchr");
  return {
    type,
    label:
      type === "agency"
        ? "Agency profile"
        : type === "jurisdiction"
          ? "Jurisdiction hub"
          : type === "school-board"
            ? "School board watch"
            : type === "source-packet"
              ? "Source packet"
              : type === "public-question"
                ? "Public question"
                : type === "methodology"
                  ? "Methodology"
                  : "Civic intelligence",
    title,
    subtitle: clean(subtitleParam, "Public records first. Source-backed profiles, races, stories, and questions voters can inspect."),
    jurisdiction: clean(jurisdictionParam, "United States"),
    sourceCount: Number.isFinite(countParam) ? countParam : undefined,
    confidence: clean(confidenceParam, "source-first"),
    path: clean(url.searchParams.get("path"), "/"),
    accent: type === "public-question" ? "#b91c1c" : "#1d4ed8",
  };
}

export async function GET(request: Request) {
  const context = contextFromRequest(request);

  return new ImageResponse(
    (
      <div
        style={{
          background: "radial-gradient(circle at 20% 10%, rgba(37, 99, 235, 0.42), transparent 28%), radial-gradient(circle at 82% 18%, rgba(220, 38, 38, 0.34), transparent 24%), linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 62,
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ background: "linear-gradient(90deg, #b42318 0%, #b42318 33%, #d6b35a 33%, #d6b35a 45%, #ffffff 45%, #ffffff 57%, #1d4ed8 57%, #1d4ed8 100%)", height: 14, left: 0, position: "absolute", top: 0, width: "100%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 42 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 820 }}>
            <div style={{ color: "#fbbf24", fontSize: 28, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>
              {context.label}
            </div>
            <div style={{ color: "#ffffff", fontSize: fitTitle(context.title), fontWeight: 900, lineHeight: 1.02 }}>
              {context.title}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 30, fontWeight: 800, lineHeight: 1.25 }}>
              {context.subtitle.length > 160 ? `${context.subtitle.slice(0, 157)}...` : context.subtitle}
            </div>
          </div>
          <div style={{ alignItems: "center", background: `linear-gradient(135deg, ${context.accent}, #0f172a)`, border: "3px solid rgba(255,255,255,0.32)", borderRadius: 44, boxShadow: "0 24px 70px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", height: 238, justifyContent: "center", width: 238 }}>
            <div style={{ fontSize: 34, fontWeight: 900 }}>Rep</div>
            <div style={{ color: "#fbbf24", fontSize: 50, fontWeight: 900 }}>Watchr</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <Badge label="Jurisdiction" value={context.jurisdiction || "Public"} />
          <Badge label="Sources" value={typeof context.sourceCount === "number" ? context.sourceCount : "Open"} />
          <Badge label="Status" value={context.confidence || "Source-first"} />
        </div>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ color: "#ffffff", fontSize: 34, fontWeight: 900 }}>Search. Grade. Source. Share.</div>
          <div style={{ color: "#cbd5e1", fontSize: 23, fontWeight: 800 }}>{context.path}</div>
        </div>
        <SourceNodes />
      </div>
    ),
    size,
  );
}

function Badge({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.18)", borderRadius: 18, display: "flex", flexDirection: "column", minWidth: 205, padding: "18px 22px" }}>
      <div style={{ color: "#ffffff", fontSize: 34, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#fbbf24", fontSize: 18, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function SourceNodes() {
  return (
    <div style={{ bottom: 86, display: "flex", gap: 16, position: "absolute", right: 66 }}>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} style={{ background: item % 2 ? "#dc2626" : "#2563eb", border: "3px solid #ffffff", borderRadius: 999, boxShadow: "0 0 28px rgba(59,130,246,0.5)", height: 20, width: 20 }} />
      ))}
    </div>
  );
}
