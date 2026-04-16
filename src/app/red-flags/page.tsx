import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getRedFlags } from "@/lib/data";
import RedFlagCard from "@/components/shared/RedFlagCard";

export const metadata: Metadata = {
  title: "Red Flags",
  description:
    "Conflicts of interest, broken promises, and accountability issues Texas voters should know about.",
};

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
          Issues that Texas voters should know about -- conflicts of
          interest, broken campaign promises, ethics complaints, suspicious
          funding connections, and controversial votes that may have flown under
          the radar.
        </p>
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
                <RedFlagCard flag={flag} />
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
                <RedFlagCard flag={flag} />
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
          All red flags are sourced from public records, news reports, and
          official filings. Each flag includes a source link for verification.
          We document these to ensure voters have the information they need to
          make informed decisions.
        </p>
      </div>
    </div>
  );
}
