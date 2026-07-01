import type { MetadataRoute } from "next";
import { getSitemapIndexEntries } from "@/lib/sitemap-builder";

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
    sitemap: getSitemapIndexEntries().map((item) => item.loc),
    host: siteUrl,
  };
}
