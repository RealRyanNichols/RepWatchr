import {
  getAttorneyWatchProfileBySlug,
  getMediaWatchProfileBySlug,
  getPublicSafetyWatchProfileBySlug,
} from "@/lib/power-watch";
import { getPredatorWatchProfileBySlug } from "@/lib/predator-watch";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

type ProfileKind = "attorney" | "media" | "public-safety" | "predator";

function isProfileKind(value: string | null): value is ProfileKind {
  return value === "attorney" || value === "media" || value === "public-safety" || value === "predator";
}

function localVisual(pathOrUrl: string | undefined) {
  return pathOrUrl?.startsWith("/") ? pathOrUrl : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kindValue = url.searchParams.get("kind");
  const slug = url.searchParams.get("slug") ?? "";
  const kind = isProfileKind(kindValue) ? kindValue : undefined;

  if (kind === "predator" && slug) {
    const profile = await getPredatorWatchProfileBySlug(slug);
    if (profile) {
      return renderRepWatchrOgImage({
        requestUrl: request.url,
        pageType: "Official registry profile",
        headline: `Official registry record: ${profile.fullName}`,
        supportLine: `${profile.county} County · ${profile.registryStatus.replaceAll("_", " ")} · ${profile.offenseCategory}. Verify current status at the official source.`,
        backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
        backgroundPosition: "center 45%",
        portraitImage: profile.photoUrl,
        visualCredit: profile.photoUrl
          ? "Photo: linked official registry source"
          : "Original RepWatchr editorial artwork",
        jurisdiction: `${profile.city}, Texas`,
        metricValue: profile.sources.length,
        metricLabel: "public sources",
        path: `/east-texas-predator-watch/${profile.slug}`,
        badges: [
          { label: "Registry status", value: profile.registryStatus.replaceAll("_", " "), tone: "red" },
          { label: "Last verified", value: profile.lastVerifiedAt, tone: "gold" },
        ],
      });
    }
  }

  const profile =
    kind === "attorney"
      ? getAttorneyWatchProfileBySlug(slug)
      : kind === "media"
        ? getMediaWatchProfileBySlug(slug)
        : kind === "public-safety"
          ? getPublicSafetyWatchProfileBySlug(slug)
          : undefined;

  if (profile && kind) {
    const basePath =
      kind === "attorney"
        ? "/attorneys"
        : kind === "media"
          ? "/media"
          : "/public-safety";
    const pageType =
      kind === "attorney"
        ? "Attorney watch profile"
        : kind === "media"
          ? "Media watch profile"
          : "Public-safety profile";

    return renderRepWatchrOgImage({
      requestUrl: request.url,
      pageType,
      headline: `${profile.name}: open the public record`,
      supportLine: `${profile.categoryLabel} · ${profile.region}. Authority, scrutiny areas, source status, and open research in one file.`,
      backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
      backgroundPosition: "center 45%",
      portraitImage: localVisual(profile.profileImageUrl),
      visualCredit: localVisual(profile.profileImageUrl)
        ? profile.profileImageSource
        : "Original RepWatchr editorial artwork",
      jurisdiction: [profile.city, profile.county ? `${profile.county} County` : undefined, profile.state]
        .filter(Boolean)
        .join(" · "),
      metricValue: profile.sourceLinks.length,
      metricLabel: "public sources",
      path: `${basePath}/${profile.slug}`,
      badges: [
        { label: "Buildout", value: `${profile.buildoutPercent}%`, tone: "blue" },
        { label: "Review status", value: profile.profileStatus.replaceAll("_", " "), tone: "gold" },
      ],
    });
  }

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: "Public profile",
    headline: "Open the public record.",
    supportLine: "Authority, source links, scrutiny areas, and visible research gaps in one accountable profile.",
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    visualCredit: "Original RepWatchr editorial artwork",
    jurisdiction: "RepWatchr profile review",
    metricValue: "Review",
    metricLabel: "source status",
    path: "/officials",
  });
}
