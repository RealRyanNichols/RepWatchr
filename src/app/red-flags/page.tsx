import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getRedFlagRecordById, getRedFlags } from "@/lib/data";
import RedFlagCard from "@/components/shared/RedFlagCard";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import NextUsefulMove from "@/components/shared/NextUsefulMove";
import PublicContentRulesPanel from "@/components/shared/PublicContentRulesPanel";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const flagId = firstParam(params.flag);
  const record = flagId ? getRedFlagRecordById(flagId) : undefined;
  const title = record ? `${record.flag.title} | RepWatchr Red Flag` : "Red Flags | RepWatchr";
  const description =
    record?.flag.whyItMatters ??
    "Conflicts of interest, broken promises, public-record questions, and accountability issues voters should inspect with source links attached.";

  return buildRepWatchrMetadata({
    title,
    description,
    path: record ? `/red-flags?flag=${record.flag.id}` : "/red-flags",
    imagePath: buildOgImageUrl("red-flag", { id: record?.flag.id }),
    imageAlt: record ? `${record.flag.title} RepWatchr red flag preview` : "RepWatchr red flags preview",
  });
}

export default function RedFlagsPage() {
  const officials = getAllOfficials();

  const allFlags = officials
    .flatMap((o) => {
      const flags = getRedFlags(o.id);
      return flags.map((flag) => ({ flag, official: o }));
    })
    .sort(
      (a, b) =>
        new Date(b.flag.date).getTime() - new Date(a.flag.date).getTime()
    );

  const criticalFlags = allFlags.filter((f) => f.flag.severity === "critical");
  const warningFlags = allFlags.filter((f) => f.flag.severity === "warning");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Red Flags</h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          Public-record questions, sourced concerns, vote records, funding trails,
          and correction requests that voters can inspect with the receipt attached.
        </p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <NextUsefulMove
          recordPath="/red-flags"
          sourcePath="/submit-source?target=red-flag"
          safeShareLine="RepWatchr red flags are public-record review items. Check the receipt, ask the public question, and submit a better source if one is missing."
          meetingQuestion="What public source supports this concern, and has the official or public body answered it on the record?"
        />
        <PublicContentRulesPanel compact />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-red-700">
            {criticalFlags.length}
          </p>
          <p className="text-sm text-red-600">Critical Issues</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-amber-700">
            {warningFlags.length}
          </p>
          <p className="text-sm text-amber-600">Warnings</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center">
          <p className="text-3xl font-bold text-gray-700">
            {new Set(allFlags.map((f) => f.flag.officialId)).size}
          </p>
          <p className="text-sm text-gray-600">Officials Flagged</p>
        </div>
      </div>

      {/* Critical Flags First */}
      {criticalFlags.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-red-700 mb-4">
            Critical Issues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalFlags.map(({ flag, official }) => (
              <div key={flag.id}>
                <div className="mb-2">
                  <Link
                    href={`/officials/${official.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {official.name} - {official.position}
                  </Link>
                </div>
                <RedFlagCard
                  flag={flag}
                  officialName={official.name}
                  jurisdiction={official.jurisdiction}
                  sharePath={`/red-flags?flag=${encodeURIComponent(flag.id)}#red-flag-${flag.id}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Warning Flags */}
      {warningFlags.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-amber-700 mb-4">Warnings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningFlags.map(({ flag, official }) => (
              <div key={flag.id}>
                <div className="mb-2">
                  <Link
                    href={`/officials/${official.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {official.name} - {official.position}
                  </Link>
                </div>
                <RedFlagCard
                  flag={flag}
                  officialName={official.name}
                  jurisdiction={official.jurisdiction}
                  sharePath={`/red-flags?flag=${encodeURIComponent(flag.id)}#red-flag-${flag.id}`}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {allFlags.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">
            No red flags have been documented yet. This section will be updated
            as issues are identified.
          </p>
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-5 text-sm text-gray-600">
        <p className="font-medium text-gray-900 mb-1">About Red Flags</p>
        <p>
          Public red flags must stay tied to public records, named publications,
          official filings, vote records, meeting records, or correction review.
          If a source is missing or weak, the item should be marked for review instead of amplified as a finding.
        </p>
      </div>
    </div>
  );
}
