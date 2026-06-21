import { REPWATCHR_ORIGIN, absoluteRepWatchrUrl, buildOgImageUrl } from "@/lib/repwatchr-seo";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type ProfilePageInput = {
  name: string;
  path: string;
  description: string;
  jobTitle?: string;
  image?: string;
  jurisdiction?: string;
};

type DatasetInput = {
  name: string;
  path: string;
  description: string;
  keywords?: string[];
  dateModified?: string;
};

type NewsArticleInput = {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  authorName: string;
  image?: string;
  sourceLinks?: Array<{ title: string; url: string }>;
  about?: Array<{ name: string; path: string; jobTitle?: string }>;
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RepWatchr",
    url: REPWATCHR_ORIGIN,
    logo: absoluteRepWatchrUrl("/images/repwatchr-logo-america-first.png"),
    slogan: "Search. Grade. Source. Share.",
    sameAs: ["https://x.com/RepWatchr", "https://www.facebook.com/RepWatchr"],
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteRepWatchrUrl(item.path),
    })),
  };
}

export function profilePageJsonLd(input: ProfilePageInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: input.name,
    url: absoluteRepWatchrUrl(input.path),
    description: input.description,
    isPartOf: {
      "@type": "WebSite",
      name: "RepWatchr",
      url: REPWATCHR_ORIGIN,
    },
    mainEntity: {
      "@type": "Person",
      name: input.name,
      jobTitle: input.jobTitle,
      image: input.image ? absoluteRepWatchrUrl(input.image) : undefined,
      affiliation: input.jurisdiction
        ? {
            "@type": "GovernmentOrganization",
            name: input.jurisdiction,
          }
        : undefined,
    },
  };
}

export function datasetJsonLd(input: DatasetInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: input.name,
    url: absoluteRepWatchrUrl(input.path),
    description: input.description,
    keywords: input.keywords,
    dateModified: input.dateModified,
    creator: {
      "@type": "Organization",
      name: "RepWatchr",
      url: REPWATCHR_ORIGIN,
    },
    license: absoluteRepWatchrUrl("/terms"),
    isAccessibleForFree: true,
  };
}

export function newsArticleJsonLd(input: NewsArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    url: absoluteRepWatchrUrl(input.path),
    mainEntityOfPage: absoluteRepWatchrUrl(input.path),
    datePublished: input.datePublished,
    dateModified: input.datePublished,
    image: input.image ?? buildOgImageUrl("news"),
    author: {
      "@type": "Organization",
      name: input.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "RepWatchr",
      logo: {
        "@type": "ImageObject",
        url: absoluteRepWatchrUrl("/images/repwatchr-logo-america-first.png"),
      },
    },
    isBasedOn: input.sourceLinks?.map((source) => ({
      "@type": "CreativeWork",
      name: source.title,
      url: source.url,
    })),
    about: input.about?.map((entity) => ({
      "@type": "Person",
      name: entity.name,
      url: absoluteRepWatchrUrl(entity.path),
      jobTitle: entity.jobTitle,
    })),
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
