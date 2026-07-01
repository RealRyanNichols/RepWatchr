import type { MetadataRoute } from "next";

const siteUrl = "https://www.repwatchr.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/auth/", "/dashboard/", "/login", "/buildout", "/uap"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
