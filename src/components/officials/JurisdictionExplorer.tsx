import Link from "next/link";
import { FOOTPRINT_COUNTIES } from "@/lib/district-footprint";
import { rosterSourceHref, type JurisdictionSummary } from "@/lib/jurisdiction-explorer";
import { filterJurisdictions, type RosterFilters } from "@/lib/roster-filters";

const fieldClass = "mt-2 block min-h-12 w-full rounded-none border border-[#b9b1a4] bg-white px-3 py-3 text-base font-normal text-[#111b24] focus:outline-2 focus:outline-offset-2 focus:outline-[#163b5c]";

export default function JurisdictionExplorer({ rows, filters }: { rows: JurisdictionSummary[]; filters: RosterFilters }) {
  const results = filterJurisdictions(rows, filters);
  const hasFilters = Boolean(filters.q || filters.county || filters.kind !== "all" || filters.status !== "all");
  const profileCount = results.reduce((total, row) => total + row.profileCount, 0);

  return (
    <section id="explore" className="mt-12 scroll-mt-24" aria-labelledby="explorer-heading">
      <div className="grid gap-4 border-t-2 border-[#111b24] pt-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a23a2b]">Start with your community</p>
          <h2 id="explorer-heading" className="mt-3 font-[Fraunces] text-3xl font-semibold sm:text-4xl">Find a county. Open a town.</h2>
        </div>
        <p className="text-sm leading-6 text-slate-600 lg:self-end">See which office records are on file, follow their sources, and help fill the gaps. These are research records, not a certified current roster.</p>
      </div>

      <form action="/home-district/roster#explore" method="get" className="mt-7 border border-[#cabfae] bg-white p-5 sm:p-6" role="search" aria-label="Search local coverage">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <label className="min-w-0 text-sm font-semibold">County or town
            <input name="q" type="search" maxLength={100} defaultValue={filters.q} placeholder="Try Longview or Harrison" className={fieldClass} />
          </label>
          <label className="min-w-0 text-sm font-semibold">County
            <select name="county" defaultValue={filters.county} className={fieldClass}>
              <option value="">All counties</option>
              {filters.county && !FOOTPRINT_COUNTIES.some((county) => county.name === filters.county) ? <option value={filters.county}>{filters.county}</option> : null}
              {FOOTPRINT_COUNTIES.map((county) => <option key={county.slug} value={county.name}>{county.name}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-sm font-semibold">Government
            <select name="kind" defaultValue={filters.kind} className={fieldClass}>
              <option value="all">Counties and towns</option>
              <option value="county">County government</option>
              <option value="city">Cities and towns</option>
            </select>
          </label>
          <label className="min-w-0 text-sm font-semibold">Research coverage
            <select name="status" defaultValue={filters.status} className={fieldClass}>
              <option value="all">All coverage</option>
              <option value="gaps">Missing office records</option>
              <option value="not-started">No profiles yet</option>
              <option value="has-records">Has profiles to read</option>
            </select>
          </label>
          <label className="min-w-0 text-sm font-semibold">Sort by
            <select name="sort" defaultValue={filters.sort} className={fieldClass}>
              <option value="name">Name A to Z</option>
              <option value="gaps">Most missing records</option>
              <option value="records">Most profiles on file</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <button type="submit" className="min-h-12 bg-[#163b5c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0e2a43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163b5c]">Find local records</button>
            <Link href="/home-district/roster#explore" className="inline-flex min-h-12 items-center px-2 text-sm font-semibold underline underline-offset-4">Reset</Link>
          </div>
        </div>
      </form>

      <div className="my-6 flex flex-wrap items-baseline justify-between gap-3" aria-live="polite">
        <p className="font-semibold">{results.length} of {rows.length} jurisdictions{hasFilters ? " match your filters" : " in the working list"}</p>
        <p className="text-sm text-slate-600">{profileCount} profile records in this view</p>
      </div>

      {results.length === 0 ? (
        <div className="border border-[#cabfae] bg-white p-7">
          <h3 className="font-[Fraunces] text-2xl font-semibold">No matching jurisdiction in the working list.</h3>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">Try fewer filters or a county name. A missing town here means the research list may be incomplete; it does not establish that the town is outside the coverage area.</p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link href="/home-district/roster#explore" className="inline-flex min-h-11 items-center bg-[#163b5c] px-4 py-3 text-sm font-semibold text-white">Show all jurisdictions</Link>
            <Link href="/submit-source?type=roster" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Send a missing town or roster</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((row) => (
            <article key={`${row.kind}-${row.slug}`} className="flex min-w-0 flex-col border border-[#cabfae] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className="text-slate-600">{row.kind === "county" ? "County government" : "City / town"}</span>
                <span className={`px-2 py-1 ${row.profileCount === 0 ? "bg-[#f7ece9] text-[#923326]" : "bg-[#edf1f4] text-[#163b5c]"}`}>{row.profileCount === 0 ? "Not started" : "Research open"}</span>
              </div>
              <h3 className="mt-5 break-words font-[Fraunces] text-3xl font-semibold"><Link href={row.href} className="hover:text-[#a23a2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#163b5c]">{row.name}</Link></h3>
              <p className="mt-2 text-sm text-slate-600">{row.kind === "city" ? `${row.counties.join(" / ")} ${row.counties.length > 1 ? "counties" : "County"}` : "Texas"}</p>
              <dl className="my-5 grid grid-cols-2 gap-4 border-y border-[#ddd6cb] py-4">
                <div className="flex flex-col"><dt className="mt-1 text-xs text-slate-600">Profiles on file</dt><dd className="-order-1 font-[Fraunces] text-3xl font-semibold">{row.profileCount}</dd></div>
                <div className="flex flex-col"><dt className="mt-1 text-xs text-slate-600">With source links</dt><dd className="-order-1 font-[Fraunces] text-3xl font-semibold">{row.sourceLinkedCount}</dd></div>
              </dl>
              <p className="mb-5 text-sm leading-6 text-slate-600">{row.missingOfficeCount > 0 ? `${row.missingOfficeCount} record gaps against the reference slate. Open the record to see which offices need research.` : "Each reference office group has records. Current membership and local seat counts still need confirmation."}</p>
              <Link href={row.href} className="mt-auto flex min-h-12 items-center justify-between gap-4 bg-[#163b5c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0e2a43]" aria-label={`Open ${row.name} records`}>Open local records <span aria-hidden="true">↗</span></Link>
              <Link href={rosterSourceHref(row)} className="mt-2 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-[#923326] underline underline-offset-4" aria-label={`Send a roster for ${row.name}`}>Have a roster? Send the source</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
