import Link from "next/link";
import { getOfficialCoverage } from "@/lib/official-coverage";
import {
  harletonMemberHref,
  harletonRoster,
} from "@/data/coverage/harleton-roster";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export const metadata = buildRepWatchrMetadata({
  title: "Official Directory Coverage by State",
  description:
    "See actual RepWatchr profile and school-district coverage, source dates, remaining gaps, and the Harleton-to-national research priorities.",
  path: "/coverage",
  imagePath: buildOgImageUrl("home", { page: "officials" }),
  imageAlt: "RepWatchr official directory coverage",
});

const number = (value: number) => value.toLocaleString("en-US");
const linkClass =
  "font-semibold text-[#163b5c] underline decoration-slate-300 underline-offset-4 hover:decoration-[#163b5c]";

export default function CoveragePage() {
  const coverage = getOfficialCoverage();
  return (
    <div className="rw-page-shell">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <header className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">
            Coverage, with the gaps visible
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            From Harleton to every state.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            Find the records already here, see when their sources were checked,
            and help fill the next gap. A profile, a school district, and a
            verified officeholder are different counts.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link className={linkClass} href="/officials">
              Search all records →
            </Link>
            <a className={linkClass} href="#states">
              Browse every state
            </a>
            <a className={linkClass} href="#harleton">
              Harleton roster check
            </a>
          </div>
        </header>

        <section
          aria-label="Loaded coverage"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            [
              coverage.officialProfiles,
              "Official profile records",
              "Source-linked identity profiles; editorial depth varies.",
            ],
            [
              coverage.schoolNamedRecords,
              "Named school research records",
              "Includes older roster entries and candidates; not a current elected-member count.",
            ],
            [
              coverage.schoolDistricts,
              "School districts with records",
              "Texas district identities, counted once per district.",
            ],
            [
              coverage.searchRecords,
              "Searchable records",
              `${number(coverage.linkedSchoolRecords)} reviewed identity links joined; ${coverage.excludedVacancies} vacancy placeholders excluded.`,
            ],
          ].map(([value, label, detail]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <p className="text-3xl font-bold text-slate-950">
                {number(Number(value))}
              </p>
              <h2 className="mt-2 text-sm font-bold text-slate-800">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </section>

        <section
          className="rounded-lg border border-amber-200 bg-amber-50 p-5 sm:p-6"
          aria-labelledby="source-dates"
        >
          <h2 id="source-dates" className="text-xl font-bold text-slate-950">
            Read the date before relying on the roster.
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            {number(coverage.schoolSnapshotRecords)} named school records retain
            a March 2025 AskTED snapshot. A later import or edit date does not
            confirm that a person still holds office. Current terms, vacancies,
            appointments, and election results need reconciliation with district
            records.
          </p>
          <p className="mt-3 leading-7 text-slate-700">
            {number(coverage.staleOfficialRecords)} official profiles have a
            recorded source-check date older than 90 days or no usable date.
            Source links are present on {number(coverage.sourceLinkedProfiles)}{" "}
            profiles; links alone do not verify every claim. The total number of
            unique people and current elected officeholders across both
            collections is not yet established.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Counts calculated {coverage.generatedAt} UTC.{" "}
            {coverage.stateUnknownProfiles > 0
              ? `${number(coverage.stateUnknownProfiles)} official profiles still need a supported state assignment.`
              : "All official profiles have a state supported by their stored jurisdiction or public address."}
          </p>
        </section>

        <section
          id="harleton"
          className="scroll-mt-24"
          aria-labelledby="harleton-title"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-700">
                First refresh · Harrison County
              </p>
              <h2
                id="harleton-title"
                className="mt-2 font-serif text-3xl font-semibold text-slate-950"
              >
                Harleton ISD: seven listed trustees.
              </h2>
            </div>
            <a href={harletonRoster.sourceUrl} className={linkClass}>
              Open district roster ↗
            </a>
          </div>
          <p className="mt-4 max-w-4xl leading-7 text-slate-700">
            Checked {harletonRoster.observedAt}. The district lists six trustees
            as elected and Chance Ebarb as appointed in July 2026. His term
            expiration is not listed. This confirms the roster fields below, not
            the full contents of linked profiles. Earlier records remain
            available for historical research.
          </p>
          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[650px] text-left text-sm">
              <caption className="sr-only">
                Harleton ISD roster observed September 8, 2026
              </caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {[
                    "Trustee",
                    "Place / role",
                    "District lists",
                    "Listed expiration",
                  ].map((label) => (
                    <th key={label} className="p-4 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {harletonRoster.members.map((member) => (
                  <tr
                    key={member.candidateId}
                    className="border-t border-slate-200"
                  >
                    <th scope="row" className="p-4">
                      <Link
                        className={linkClass}
                        href={harletonMemberHref(member)}
                      >
                        {member.name}
                      </Link>
                    </th>
                    <td className="p-4">
                      {member.seat} · {member.role}
                    </td>
                    <td className="p-4 capitalize">
                      {member.selection} {member.selectedMonth}
                    </td>
                    <td className="p-4">
                      {member.termEndMonth ?? "Not listed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            The superintendent is an administrative role and is not included in
            the seven trustees. Kevin Evers is absent from this observed roster;
            his earlier record is retained with the departure date unconfirmed.
            The older AskTED name Pat McGill is linked to Patrick McGill rather
            than counted as another current seat.
          </p>
        </section>

        <section aria-labelledby="local-title">
          <h2
            id="local-title"
            className="font-serif text-3xl font-semibold text-slate-950"
          >
            Build outward from East Texas.
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            Harrison County comes first, followed by nearby counties and the
            wider region. These counts describe loaded records, not complete
            county governments.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {coverage.localCounties.map((county) => (
              <Link
                key={county.county}
                href={`/officials?state=TX&county=${encodeURIComponent(county.county)}`}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:border-[#163b5c]"
              >
                <h3 className="font-bold text-slate-900">
                  {county.county} County →
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {county.officialProfiles} associated official profiles ·{" "}
                  {county.schoolDistricts} school districts
                </p>
              </Link>
            ))}
          </div>
          <details className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-bold text-slate-900">
              School-district research priorities (
              {coverage.priorityDistricts.length})
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coverage.priorityDistricts.map((district) => (
                <Link
                  key={district.district_slug}
                  href={getSchoolBoardDistrictUrl(district)}
                  className={linkClass}
                >
                  {district.district}{" "}
                  <span className="font-normal text-slate-600">
                    · {district.namedRecords} records
                  </span>
                </Link>
              ))}
            </div>
          </details>
        </section>

        <section
          id="states"
          className="scroll-mt-24"
          aria-labelledby="states-title"
        >
          <h2
            id="states-title"
            className="font-serif text-3xl font-semibold text-slate-950"
          >
            Browse all 50 states, D.C., and territories.
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            Federal and state records extend nationwide. Local and school-board
            coverage is uneven. A zero means no matching records are loaded; it
            does not mean the jurisdiction has no officials. District counts are
            separate from people.
          </p>
          <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <caption className="sr-only">
                Actual loaded coverage by jurisdiction and office level
              </caption>
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  {[
                    "State / territory",
                    "Federal",
                    "State",
                    "County",
                    "City",
                    "School profiles",
                    "School research",
                    "School districts",
                  ].map((label) => (
                    <th key={label} className="p-3 font-semibold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coverage.states.map((state) => (
                  <tr key={state.code} className="border-t border-slate-200">
                    <th scope="row" className="p-3">
                      <Link
                        className={linkClass}
                        href={`/officials?state=${state.code}`}
                      >
                        {state.name}
                      </Link>
                    </th>
                    {[
                      state.federal,
                      state.state,
                      state.county,
                      state.city,
                      state.schoolProfiles,
                      state.schoolResearch,
                      state.schoolDistricts,
                    ].map((value, index) => (
                      <td key={index} className="p-3 tabular-nums">
                        {number(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="sources-title"
          className="rounded-lg border border-slate-200 bg-white p-6"
        >
          <h2 id="sources-title" className="text-2xl font-bold text-slate-950">
            How coverage grows
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-bold">Federal and state officials</h3>
              <p className="mt-2 leading-7 text-slate-700">
                Use stable person and office identifiers, current terms, and
                original government sources.{" "}
                <a
                  className={linkClass}
                  href="https://github.com/unitedstates/congress-legislators"
                >
                  Congress Legislators
                </a>{" "}
                and{" "}
                <a
                  className={linkClass}
                  href="https://github.com/openstates/people"
                >
                  Open States People
                </a>{" "}
                publish reusable CC0 identity data. Neither provides a complete
                national local-office roster.
              </p>
            </div>
            <div>
              <h3 className="font-bold">School boards and local offices</h3>
              <p className="mt-2 leading-7 text-slate-700">
                <a
                  className={linkClass}
                  href="https://tealprod.tea.state.tx.us/tea.askted.web/Forms/Home.aspx"
                >
                  TEA AskTED
                </a>{" "}
                and district roster pages support Texas refreshes.{" "}
                <a
                  className={linkClass}
                  href="https://nces.ed.gov/ccd/pubagency.asp"
                >
                  NCES agency directories
                </a>{" "}
                identify school systems, not their trustees or how each member
                was selected. County and city directories supply the next local
                batches.
              </p>
            </div>
          </div>
          <p className="mt-5 leading-7 text-slate-700">
            New source batches require identity matching, seat and term checks,
            a saved source date, and review before current-office claims change.
            Elected members, appointed members, candidates, historical records,
            and vacancies stay distinct.
          </p>
          <Link
            href="/submit-source?target=coverage"
            className="mt-5 inline-flex rounded-sm bg-[#163b5c] px-5 py-3 font-semibold text-white hover:bg-[#0d2a44]"
          >
            Submit a missing public source →
          </Link>
        </section>
      </div>
    </div>
  );
}
