import { getImageSeoRecords } from "@/lib/seo-inventory";
import { renderImageSitemap, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return xmlResponse(renderImageSitemap(getImageSeoRecords()));
}
