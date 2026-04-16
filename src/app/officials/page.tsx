import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllOfficials, getAllScoreCards } from "@/lib/data";
import OfficialGrid from "@/components/officials/OfficialGrid";

export const metadata: Metadata = {
  title: "All Officials",
  description:
    "Browse all tracked elected officials in Texas - federal, state, county, city, and school board.",
};

export default function OfficialsPage() {
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Elected Officials
        </h1>
        <p className="mt-2 text-gray-500">
          {officials.length} officials tracked across Texas. Search, filter by
          government level, county, or party.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 rounded-xl bg-gray-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-gray-100" />
              ))}
            </div>
          </div>
        }
      >
        <OfficialGrid officials={officials} scoreCards={scoreCards} />
      </Suspense>
    </div>
  );
}
