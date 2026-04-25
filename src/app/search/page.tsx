import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import GideonSearchBox from "@/components/shared/GideonSearchBox";
import { getAllOfficials } from "@/lib/data";
import { getSchoolBoardDistricts, getSchoolBoardDossiers, getShareLine } from "@/lib/school-board-research";
import { getSchoolBoardCandidateUrl, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export const metadata: Metadata = {
  title: "Search RepWatchr",
  description:
    "Search RepWatchr for elected officials, school boards, counties, cities, districts, races, votes, funding, and public-record questions.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const query = (params?.q ?? "").trim();
  const lower = query.toLowerCase();
  const officials = getAllOfficials();
  const districts = getSchoolBoardDistricts();
  const candidates = getSchoolBoardDossiers();

  const officialResults = lower
    ? officials
        .filter((official) => {
          const haystack = `${official.name} ${official.position} ${official.jurisdiction} ${official.district ?? ""} ${official.county.join(" ")}`.toLowerCase();
          return haystack.includes(lower);
        })
        .slice(0, 12)
    : officials.slice(0, 6);

  const districtResults = lower
    ? districts
        .filter((district) => {
          const haystack = `${district.district} ${district.county} ${district.candidates.map((candidate) => candidate.full_name).join(" ")}`.toLowerCase();
          return haystack.includes(lower);
        })
        .slice(0, 8)
    : districts.slice(0, 6);

  const candidateResults = lower
    ? candidates
        .filter((candidate) => {
          const haystack = `${candidate.full_name} ${candidate.preferred_name ?? ""} ${candidate.district} ${candidate.county} ${candidate.seat ?? ""} ${candidate.role ?? ""}`.toLowerCase();
          return haystack.includes(lower);
        })
        .slice(0, 12)
    : candidates.slice(0, 6);

  return (
    <div className="bg-[#fbfcff]">
      <section className="border-b border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_50%,#fff7ed_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Gideon search</p>
          <h1 className="mt-2 text-4xl font-black text-blue-950 sm:text-5xl">
            Find the official, district, race, or record.
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-gray-700">
            Search the public RepWatchr data. Gideon uses this same path to help members find people, places, source records, and the next research question.
          </p>
          <div className="mt-6 max-w-4xl">
            <GideonSearchBox defaultQuery={query} />
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <ResultColumn title="Officials" count={officialResults.length}>
          {officialResults.map((official) => (
            <ResultCard
              key={official.id}
              href={`/officials/${official.id}`}
              eyebrow={official.level.replace("-", " ")}
              title={official.name}
              body={`${official.position} - ${official.jurisdiction}${official.district ? ` - ${official.district}` : ""}`}
            />
          ))}
        </ResultColumn>

        <ResultColumn title="School boards" count={districtResults.length}>
          {districtResults.map((district) => (
            <ResultCard
              key={district.district_slug}
              href={getSchoolBoardDistrictUrl(district)}
              eyebrow={`${district.county} County`}
              title={district.district}
              body={`${district.candidates.length} board-member files loaded. Open the district profile, source stack, and investigation queue.`}
            />
          ))}
        </ResultColumn>

        <ResultColumn title="Board members" count={candidateResults.length}>
          {candidateResults.map((candidate) => (
            <ResultCard
              key={candidate.candidate_id}
              href={getSchoolBoardCandidateUrl(candidate)}
              eyebrow={candidate.district}
              title={candidate.preferred_name ?? candidate.full_name}
              body={getShareLine(candidate)}
            />
          ))}
        </ResultColumn>
      </main>
    </div>
  );
}

function ResultColumn({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-gray-950">{title}</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-900">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
      {count === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-5 text-sm font-semibold text-gray-600">
          No exact local result yet. Try a county, city, district number, school name, or official name.
        </p>
      ) : null}
    </section>
  );
}

function ResultCard({ href, eyebrow, title, body }: { href: string; eyebrow: string; title: string; body: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-red-200 hover:bg-white hover:shadow-md">
      <p className="text-xs font-black uppercase tracking-wide text-red-700">{eyebrow}</p>
      <h3 className="mt-1 text-base font-black text-gray-950">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-gray-600">{body}</p>
    </Link>
  );
}
