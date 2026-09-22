import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials } from "@/lib/data";
import {
  CITY_OFFICE_SLATE,
  COUNTY_OFFICE_SLATE,
  FOOTPRINT_BOUNDARY_PROVENANCE,
  FOOTPRINT_COUNTIES,
  FOOTPRINT_PLACES,
  FOOTPRINT_PLACE_PROVENANCE,
  OFFICE_SLATE_PROVENANCE,
  OFFICE_SLATE_SOURCES,
} from "@/lib/district-footprint";
import JurisdictionExplorer from "@/components/officials/JurisdictionExplorer";
import { getJurisdictionSummaries } from "@/lib/jurisdiction-explorer";
import { parseRosterFilters } from "@/lib/roster-filters";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

const rosterMetadata = {
  title: "Local Records: HD-7 and TX-01",
  description:
    "Explore county and town records in RepWatchr’s HD-7 and TX-01 working area. Find profiles, public sources, and offices that still need research.",
  path: "/home-district/roster",
  imagePath: buildOgImageUrl("home", { page: "home-district-roster" }),
  imageAlt: "RepWatchr HD-7 and TX-01 seat ledger",
};

type RosterPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: RosterPageProps): Promise<Metadata> {
  const params = await searchParams;
  return buildRepWatchrMetadata({
    ...rosterMetadata,
    robots: Object.keys(params).length ? { index: false, follow: true } : undefined,
  });
}

export default async function HomeDistrictRosterPage({ searchParams }: RosterPageProps) {
  const filters = parseRosterFilters(await searchParams);
  const rows = getJurisdictionSummaries(getAllOfficials());
  const profilesOnFile = rows.reduce((total, row) => total + row.profileCount, 0);
  const seatsExpected = rows.reduce((total, row) => total + row.expected, 0);
  const notStarted = rows.filter((row) => row.profileCount === 0).length;

  return (
    <div className="bg-[#f5f1e8] text-[#111b24]">
      <section className="border-b border-[#cabfae] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-semibold text-[#a23a2b]">The local record</p>
          <h1 className="mt-5 max-w-4xl font-[Fraunces] text-5xl font-semibold leading-[.94] sm:text-7xl">
            Your county. Your town. The public record.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-700">
            Open the county and town records in RepWatchr’s HD-7 and TX-01 working area. Find the profiles already
            on file, see which offices still need research, and send a public source that helps fill the gap.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="#explore" className="min-h-11 bg-[#163b5c] px-5 py-3 text-white hover:bg-[#0e2a43]">
              Find your local records
            </Link>
            <Link href="/home-district" className="min-h-11 border border-[#111b24] px-5 py-3 hover:bg-[#111b24] hover:text-white">
              The coverage beat
            </Link>
            <Link href="/submit-source" className="min-h-11 border border-[#a23a2b] bg-[#a23a2b] px-5 py-3 text-white hover:bg-[#8b3024]">
              Send a roster
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-px border-y border-[#cabfae] bg-[#cabfae] md:grid-cols-4">
          {[
            ["Counties", FOOTPRINT_COUNTIES.length],
            ["Cities and towns", FOOTPRINT_PLACES.length],
            ["Profile records on file", profilesOnFile],
            ["Jurisdictions without profiles", notStarted],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[#f5f1e8] px-5 py-7">
              <p className="font-[Fraunces] text-4xl font-semibold">{Number(value).toLocaleString()}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
            </div>
          ))}
        </div>

        {FOOTPRINT_BOUNDARY_PROVENANCE.status !== "verified" ? (
          <section className="mt-6 border-l-4 border-[#a23a2b] bg-[#f7ece9] p-5">
            <p className="text-sm font-semibold leading-6">This is a working coverage list. TX-01 boundaries and the municipality list still need authentication.</p>
            <details className="mt-2">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold underline underline-offset-4">Read boundary sources and review dates</summary>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              {FOOTPRINT_BOUNDARY_PROVENANCE.note}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {FOOTPRINT_BOUNDARY_PROVENANCE.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              Reviewed {FOOTPRINT_BOUNDARY_PROVENANCE.reviewedAt}. HD-7&rsquo;s three counties are carried by a primary
              record and are not affected.
            </p>
            </details>
          </section>
        ) : null}

        <p className="mt-6 max-w-3xl leading-7 text-slate-700">
          {profilesOnFile.toLocaleString()} profile records are on file across this working list. The reference slate
          contains roughly {seatsExpected.toLocaleString()} office records to research. These are different measures:
          a loaded profile does not confirm current membership, and local charters and precincts can change the seat count.
        </p>

        <JurisdictionExplorer rows={rows} filters={filters} />

        <section className="mt-16 border-l-4 border-[#a23a2b] bg-[#f7ece9] p-6">
          <p className="font-bold uppercase tracking-wide">The place list is not finished either</p>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">{FOOTPRINT_PLACE_PROVENANCE.note}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {FOOTPRINT_PLACE_PROVENANCE.reconcileAgainst.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">Reviewed {FOOTPRINT_PLACE_PROVENANCE.reviewedAt}.</p>
        </section>

        <section className="mt-16">
          <h2 className="font-[Fraunces] text-4xl font-semibold">The expected slate</h2>
          <div className="mt-5 border-l-4 border-[#2f6b4f] bg-[#eef5f0] p-5">
            <p className="text-sm font-bold uppercase tracking-wide">Where the slate comes from</p>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">{OFFICE_SLATE_PROVENANCE.note}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {OFFICE_SLATE_SOURCES.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-600">Reviewed {OFFICE_SLATE_PROVENANCE.reviewedAt}.</p>
          </div>

          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-[Fraunces] text-2xl font-semibold">County offices</h3>
              <ul className="mt-4 divide-y divide-[#cabfae] border-y border-[#cabfae]">
                {COUNTY_OFFICE_SLATE.map((office) => (
                  <li key={office.key} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="font-semibold">{office.label}</span>
                    <span className="text-slate-600">
                      {office.expected}
                      {"variable" in office && office.variable ? "+ by precinct" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-[Fraunces] text-2xl font-semibold">City offices</h3>
              <ul className="mt-4 divide-y divide-[#cabfae] border-y border-[#cabfae]">
                {CITY_OFFICE_SLATE.map((office) => (
                  <li key={office.key} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="font-semibold">{office.label}</span>
                    <span className="text-slate-600">
                      {office.expected}
                      {"variable" in office && office.variable ? "+ by charter" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
