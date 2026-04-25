import type { Metadata } from "next";
import GideonConsole from "@/components/gideon/GideonConsole";

export const metadata: Metadata = {
  title: "GideonAI",
  description:
    "Ask Gideon to search RepWatchr, find officials, collect research facts, and shape the next public-record question.",
};

export default async function GideonPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="bg-[#0A0E1A]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <GideonConsole initialQuery={params?.q ?? ""} />
      </div>
    </div>
  );
}
