import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PackageLandingPage from "@/components/packages/PackageLandingPage";
import { getRepWatchrPackageBySlug, getRepWatchrPackages, packageRoute } from "@/data/repwatchr-packages";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { absoluteUrl, breadcrumbJsonLd, getPageMetadata, organizationJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return getRepWatchrPackages().map((packageItem) => ({ packageSlug: packageItem.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ packageSlug: string }>;
}): Promise<Metadata> {
  const { packageSlug } = await params;
  const packageItem = getRepWatchrPackageBySlug(packageSlug);
  if (!packageItem) return { title: "Package Not Found | RepWatchr" };

  return getPageMetadata({
    title: `${packageItem.name} | RepWatchr Packages`,
    description: packageItem.summary,
    path: packageRoute(packageItem),
    imagePath: `/api/og?type=package&slug=${encodeURIComponent(packageItem.slug)}&title=${encodeURIComponent(packageItem.name)}&label=${encodeURIComponent(packageItem.eyebrow)}`,
    index: packageItem.indexable,
  });
}

function serviceJsonLd(packageItem: NonNullable<ReturnType<typeof getRepWatchrPackageBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: packageItem.name,
    description: packageItem.summary,
    provider: {
      "@type": "Organization",
      name: "RepWatchr",
      url: "https://www.repwatchr.com",
    },
    serviceType: "Public-record civic intelligence package",
    areaServed: packageItem.slug.includes("texas") || packageItem.slug.includes("county") ? "Texas" : "United States",
    url: absoluteUrl(packageRoute(packageItem)),
  };
}

function faqJsonLd(packageItem: NonNullable<ReturnType<typeof getRepWatchrPackageBySlug>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: packageItem.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ packageSlug: string }>;
}) {
  const { packageSlug } = await params;
  const packageItem = getRepWatchrPackageBySlug(packageSlug);
  if (!packageItem) notFound();

  const paymentsEnabled = await isFeatureEnabled("ENABLE_PAYMENTS");
  const jsonLd = [
    organizationJsonLd(),
    breadcrumbJsonLd([
      { name: "RepWatchr", path: "/" },
      { name: "Packages", path: "/packages" },
      { name: packageItem.name, path: packageRoute(packageItem) },
    ]),
    serviceJsonLd(packageItem),
    faqJsonLd(packageItem),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PackageLandingPage packageItem={packageItem} paymentsEnabled={paymentsEnabled} />
    </>
  );
}
