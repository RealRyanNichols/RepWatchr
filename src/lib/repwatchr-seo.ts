import type { Metadata } from "next";

export const REPWATCHR_ORIGIN = "https://www.repwatchr.com";
export const REPWATCHR_TAGLINE = "Search. Grade. Source. Share.";
export const REPWATCHR_OG_SIZE = { width: 1200, height: 630 } as const;

type RepWatchrMetadataInput = {
  title: string;
  description: string;
  path: string;
  imagePath: string;
  imageAlt: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  authors?: string[];
  robots?: Metadata["robots"];
};

export function absoluteRepWatchrUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${REPWATCHR_ORIGIN}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function buildOgImageUrl(kind: string, params: Record<string, string | number | undefined | null> = {}) {
  const url = new URL(`/api/og/${kind}`, REPWATCHR_ORIGIN);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function buildRepWatchrMetadata({
  title,
  description,
  path,
  imagePath,
  imageAlt,
  type = "website",
  publishedTime,
  authors,
  robots,
}: RepWatchrMetadataInput): Metadata {
  const url = absoluteRepWatchrUrl(path);
  const imageUrl = absoluteRepWatchrUrl(imagePath);
  const openGraphBase = {
    title,
    description,
    url,
    siteName: "RepWatchr",
    locale: "en_US",
    images: [
      {
        url: imageUrl,
        width: REPWATCHR_OG_SIZE.width,
        height: REPWATCHR_OG_SIZE.height,
        alt: imageAlt,
      },
    ],
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph:
      type === "article"
        ? {
            ...openGraphBase,
            type: "article",
            publishedTime,
            authors,
          }
        : {
            ...openGraphBase,
            type,
          },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots,
  };
}
