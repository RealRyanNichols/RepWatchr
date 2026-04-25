import type { Metadata } from "next";
import GideonConsole from "@/components/gideon/GideonConsole";

export const metadata: Metadata = {
  title: "GideonAI: God. Family. Country. Justice.",
  description:
    "Ask GideonAI to search RepWatchr, find officials, collect public facts, and shape the next clear research question.",
  openGraph: {
    title: "GideonAI: God. Family. Country. Justice.",
    description:
      "Search RepWatchr, collect research direction, and turn scattered public facts into the next clear question.",
    url: "/gideon",
    images: [
      {
        url: "/images/gideon-ai-cover.jpg",
        width: 1672,
        height: 941,
        alt: "GideonAI - God. Family. Country. Justice.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GideonAI: God. Family. Country. Justice.",
    description:
      "Search RepWatchr, collect research direction, and turn scattered public facts into the next clear question.",
    images: ["/images/gideon-ai-cover.jpg"],
  },
};

export default async function GideonPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_55%,#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <GideonConsole initialQuery={params?.q ?? ""} />
      </div>
    </div>
  );
}
