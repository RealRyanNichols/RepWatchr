import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials } from "@/lib/data";
import {
  CITY_OFFICE_SLATE,
  COUNTY_OFFICE_SLATE,
  EXPECTED_CITY_SEATS,
  EXPECTED_COUNTY_SEATS,
  FOOTPRINT_COUNTIES,
  FOOTPRINT_PLACE_PROVENANCE,
  footprintJurisdictions,
  seatLedgerFor,
  type SeatLedgerRow,
} from "@/lib/district-footprint";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "HD-7 and TX-01 Seat Ledger",
  description:
    "Every county, city and town inside Texas House District 7 and TX-01, the elected seats each one carries, and exactly which seats RepWatchr still has to fill.",
  path: "/home-district/roster",
  imagePath: buildOgImageUrl("home", { page: "home-district-roster" }),
  imageAlt: "RepWatchr HD-7 and TX-01 seat ledger",
});

function normalizedCounty(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+county$/, "");
}

function LedgerTable({ rows, caption }: { rows: SeatLedgerRow[]; caption: string }) {
  if (!rows.length) return null;
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-[#111b24]">
            <th scope="col" className="py-3 pr-4 font-bold uppercase tracking-wide">Jurisdiction</th>
            <th scope="col" className="py-3 pr-4 font-bold uppercase tracking-wide">District</th>
            <th scope="col" className="py-3 pr-4 font-bold uppercase tracking-wide">Seats on file</th>
            <th scope="col" className="py-3 font-bold uppercase tracking-wide">Offices still empty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.kind}-${row.slug}`} className="border-b border-[#cabfae] align-top">
              <th scope="row" className="py-4 pr-4 font-[Fraunces] text-lg font-semibold">
                {row.name}
                {row.kind === "city" ? (
                  <span className="block text-xs font-normal text-slate-600">{row.county} County</span>
                ) : null}
              </th>
              <td className="py-4 pr-4 text-slate-700">{row.districts.join(" · ")}</td>
              <td className="py-4 pr-4">
                <span className="font-[Fraunces] text-xl font-semibold">{row.covered}</span>
                <span className="text-slate-600"> of {row.expected}</span>
                <span
                  className={`ml-2 inline-block px-2 py-0.5 text-xs font-bold ${
                    row.covered === 0
                      ? "bg-[#a23a2b] text-white"
                      : row.percent >= 100
                        ? "bg-[#2f6b4f] text-white"
                        : "bg-[#e8d9b8] text-[#111b24]"
                  }`}
                >
                  {row.covered === 0 ? "NOT STARTED" : row.percent >= 100 ? "SLATE FILLED" : `${row.percent}%`}
                </span>
              </td>
              <td className="py-4 text-slate-700">
                {row.missingLabels.length ? row.missingLabels.join(", ") : "None on the expected slate"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HomeDistrictRosterPage() {
  const officials = getAllOfficials();
  const { counties, places } = footprintJurisdictions();

  const countyRows = counties.map((county) =>
    seatLedgerFor(
      "county",
      county,
      officials.filter(
        (official) =>
          official.level === "county" &&
          official.county.some((name) => normalizedCounty(name) === county.county.toLowerCase()),
      ),
    ),
  );

  const placeRows = places.map((place) =>
    seatLedgerFor(
      "city",
      place,
      officials.filter(
        (official) =>
          official.level === "city" &&
          (official.jurisdiction ?? "").toLowerCase().includes(place.name.toLowerCase()),
      ),
    ),
  );

  const allRows = [...countyRows, ...placeRows];
  const seatsOnFile = allRows.reduce((total, row) => total + row.covered, 0);
  const seatsExpected = allRows.reduce((total, row) => total + row.expected, 0);
  const notStarted = allRows.filter((row) => row.covered === 0).length;

  const sortByNeed = (rows: SeatLedgerRow[]) =>
    [...rows].sort((a, b) => a.percent - b.percent || a.name.localeCompare(b.name));

  return (
    <main className="bg-[#f5f1e8] text-[#111b24]">
      <section className="border-b border-[#cabfae] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-semibold text-[#a23a2b]">The buildout target</p>
          <h1 className="mt-5 max-w-4xl font-[Fraunces] text-5xl font-semibold leading-[.94] sm:text-7xl">
            Every seat in HD-7 and TX-01. Nothing hidden.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-700">
            This is the whole job, written down. Every county, city and town inside the two districts, the elected seats
            each one carries, and exactly which of those seats are still empty on this site. A missing name here is a
            gap on the record, not a person cleared of anything.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
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
        <div className="grid gap-px border-y border-[#cabfae] bg-[#cabfae] md:grid-cols-4">
          {[
            ["Counties", FOOTPRINT_COUNTIES.length],
            ["Cities and towns", places.length],
            ["Seats on file", seatsOnFile],
            ["Jurisdictions not started", notStarted],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[#f5f1e8] px-5 py-7">
              <p className="font-[Fraunces] text-4xl font-semibold">{Number(value).toLocaleString()}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-3xl leading-7 text-slate-700">
          {seatsOnFile.toLocaleString()} of roughly {seatsExpected.toLocaleString()} expected elected seats are on file
          across the footprint. The expected counts are the standard slate for each kind of office, so a jurisdiction
          that seats extra justices of the peace, constables, or council members can exceed its own target.
        </p>

        <section className="mt-14">
          <h2 className="font-[Fraunces] text-4xl font-semibold">County government</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Texas counties elect the judge, four commissioners, the sheriff, both clerks, the tax assessor-collector,
            the treasurer, the prosecuting attorney, and their justices of the peace and constables. That is{" "}
            {EXPECTED_COUNTY_SEATS} seats before precinct courts are counted.
          </p>
          <LedgerTable rows={sortByNeed(countyRows)} caption="County seat coverage across HD-7 and TX-01" />
        </section>

        <section className="mt-16">
          <h2 className="font-[Fraunces] text-4xl font-semibold">Cities and towns</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            Every municipality elects a mayor and a council. Council size varies between general-law and home-rule
            cities, so {EXPECTED_CITY_SEATS} is the floor, not the ceiling.
          </p>
          <LedgerTable rows={sortByNeed(placeRows)} caption="City and town seat coverage across HD-7 and TX-01" />
        </section>

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
    </main>
  );
}
