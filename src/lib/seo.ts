import type { Metadata } from "next";

export const SITE_URL = "https://www.repwatchr.com";
export const SITE_NAME = "RepWatchr";
export const SITE_TAGLINE = "Search. Grade. Source. Share.";
export const DEFAULT_OG_IMAGE = "/api/og?type=home";

export type PageMetadataContext = {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  type?: "website" | "article" | "profile";
  index?: boolean;
  publishedTime?: string;
  authors?: string[];
};

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getOgImageUrl(path = DEFAULT_OG_IMAGE) {
  return absoluteUrl(path);
}

export function getPageMetadata({
  title,
  description,
  path = "/",
  imagePath = DEFAULT_OG_IMAGE,
  type = "website",
  index = true,
  publishedTime,
  authors,
}: PageMetadataContext): Metadata {
  const canonical = absoluteUrl(path);
  const image = getOgImageUrl(imagePath);

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index,
      follow: index,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && authors?.length ? { authors } : {}),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} | ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/images/repwatchr-logo-america-first.png"),
    slogan: SITE_TAGLINE,
    sameAs: ["https://x.com/RepWatchr", "https://www.facebook.com/RepWatchr"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function datasetJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url: absoluteUrl(path),
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    license: absoluteUrl("/terms"),
    isAccessibleForFree: true,
  };
}

export function profilePageJsonLd({
  name,
  description,
  path,
  jobTitle,
  jurisdiction,
}: {
  name: string;
  description: string;
  path: string;
  jobTitle?: string;
  jurisdiction?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${name} public-record profile`,
    description,
    url: absoluteUrl(path),
    about: {
      "@type": "Person",
      name,
      jobTitle,
      worksFor: jurisdiction
        ? {
            "@type": "GovernmentOrganization",
            name: jurisdiction,
          }
        : undefined,
    },
  };
}
