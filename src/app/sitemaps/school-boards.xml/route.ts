import { getSitemapEntries, urlSetXml } from "@/lib/sitemap-builder";

export const dynamic = "force-static";

export function GET() {
  return new Response(urlSetXml(getSitemapEntries("school-boards")), {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
