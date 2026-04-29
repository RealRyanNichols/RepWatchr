import type { Metadata } from "next";
import FarettaConsole from "@/components/faretta/FarettaConsole";

export const metadata: Metadata = {
  title: "AI Search | RepWatchr",
  description:
    "Use Faretta AI as a RepWatchr search helper for profiles, source links, files, public questions, and research paths.",
};

export default async function FarettaAIPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <div className="bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FarettaConsole initialQuery={params?.q ?? ""} />
      </div>
    </div>
  );
}
