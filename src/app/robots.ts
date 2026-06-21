import type { MetadataRoute } from "next";

const siteUrl = "https://www.repwatchr.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/auth/",
          "/dashboard/",
          "/login",
          "/create-account",
          "/profiles/claim",
          "/services/checkout/",
          "/submit-source/thanks",
          "/api/",
          "/seo-report",
          "/buildout",
          "/uap",
        ],
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/news-sitemap.xml`,
      `${siteUrl}/image-sitemap.xml`,
    ],
    host: siteUrl,
  };
}
