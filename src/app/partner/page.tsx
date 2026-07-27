import { redirect } from "next/navigation";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata = buildRepWatchrMetadata({
  title: "RepWatchr Investors and Partners",
  description:
    "RepWatchr is building public-record infrastructure for civic accountability, source trails, watchlists, packets, dashboards, and data workflows.",
  path: "/investors",
  imagePath: buildOgImageUrl("services", { slug: "investors" }),
  imageAlt: "RepWatchr investor and partner preview",
});

export default function PartnerRedirectPage() {
  redirect("/investors");
}
