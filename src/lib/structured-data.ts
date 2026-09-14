import { HOME_DISTRICT_BEAT_TERMS, HOME_DISTRICT_COUNTIES } from "@/lib/home-districts";
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
  spatialCoverage?: string;
  variableMeasured?: string[];
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

/**
 * The one stable identifier for RepWatchr as an entity.
 *
 * Nesting an Organization node inside a creator or publisher field states the
 * relationship but creates an ANONYMOUS node: it is not a reference to the
 * canonical entity, so consumers see several RepWatchr organizations. Every
 * mention points at this @id instead.
 */
export const REPWATCHR_ORGANIZATION_ID = `${REPWATCHR_ORIGIN}/#organization`;

/** A reference to the canonical organization, not a second declaration of it. */
export function repwatchrOrganizationRef() {
  return { "@id": REPWATCHR_ORGANIZATION_ID };
}

/**
 * NewsMediaOrganization, not a bare Organization.
 *
 * A plain Organization is what a vendor or a SaaS product emits. This desk
 * publishes source-backed reporting on a named beat, so it declares itself the
 * way an outlet does, points at its published standards, and names the ground
 * it covers. Search engines read `areaServed` and `publishingPrinciples` when
 * deciding who is a local authority on a place.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@id": REPWATCHR_ORGANIZATION_ID,
    "@type": "NewsMediaOrganization",
    name: "RepWatchr",
    url: REPWATCHR_ORIGIN,
    logo: absoluteRepWatchrUrl("/images/repwatchr-logo-america-first.png"),
    slogan: "Search. Grade. Source. Share.",
    description:
      "Source-backed accountability reporting on Texas House District 7 and Texas's 1st congressional district: officials, school boards, county government, votes, funding, and the public records behind them.",
    publishingPrinciples: absoluteRepWatchrUrl("/methodology"),
    ethicsPolicy: absoluteRepWatchrUrl("/methodology"),
    correctionsPolicy: absoluteRepWatchrUrl("/methodology"),
    // Derived from the home-district module so the beat cannot drift from the
    // declared source of truth.
    knowsAbout: [
      ...HOME_DISTRICT_BEAT_TERMS,
      "East Texas local government",
      "Texas school boards",
      "Texas public records",
    ],
    areaServed: HOME_DISTRICT_COUNTIES.map((county) => ({
      "@type": "AdministrativeArea",
      name: `${county} County, Texas`,
    })),
    founder: { "@type": "Person", name: "Ryan Nichols" },
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
    creator: repwatchrOrganizationRef(),
    license: absoluteRepWatchrUrl("/terms"),
    isAccessibleForFree: true,
    spatialCoverage: input.spatialCoverage,
    variableMeasured: input.variableMeasured,
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
    publisher: repwatchrOrganizationRef(),
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
