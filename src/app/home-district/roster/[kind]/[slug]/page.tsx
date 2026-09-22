import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OfficialPhotoImage from "@/components/shared/OfficialPhotoImage";
import { getAllOfficials } from "@/lib/data";
import {
  FOOTPRINT_BOUNDARY_PROVENANCE,
  FOOTPRINT_PLACE_PROVENANCE,
  OFFICE_SLATE_PROVENANCE,
  OFFICE_SLATE_SOURCES,
} from "@/lib/district-footprint";
import {
  getJurisdictionRecord,
  getJurisdictionSummaries,
  rosterSourceHref,
  type JurisdictionRecord,
} from "@/lib/jurisdiction-explorer";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import type { Official } from "@/types";

type RouteProps = { params: Promise<{ kind: string; slug: string }> };

function getRecord(kind: string, slug: string) {
  const record = getJurisdictionRecord(kind, slug, getAllOfficials());
  if (!record) notFound();
  return record;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { kind, slug } = await params;
  const record = getRecord(kind, slug);
  return buildRepWatchrMetadata({
    title: `${record.name} | Local Office Roster`,
    description: `Explore ${record.name} profiles, attached public sources and office families still needing records. A working RepWatchr roster for the HD-7 and TX-01 beat.`,
    path: record.href,
    imagePath: buildOgImageUrl("home", { page: "home-district-roster" }),
    imageAlt: `${record.name} working office roster on RepWatchr`,
    // The footprint and each jurisdiction's actual slate still require review.
    robots: { index: false, follow: true },
  });
}

const REVIEW_LABELS = {
  needs_source_review: "Needs source review",
  source_seeded: "Source seeded",
  verified: "Verified",
  complete: "Complete",
} as const;

function isPublicSource(url: string) {
  try {
    return ["https:", "http:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function ProfileCard({ official, record }: { official: Official; record: JurisdictionRecord }) {
  const sources = official.sourceLinks?.filter((source) => isPublicSource(source.url)) ?? [];
  // Only known dimensions can keep a portrait within its native pixel density.
  const portrait = {
    ...official,
    photo: official.photoMetadata ? official.photo : undefined,
    featuredPhoto: official.featuredPhotoMetadata ? official.featuredPhoto : undefined,
  };

  return (
    <article className="flex h-full flex-col border border-[#cabfae] bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-[#ded6c9] bg-[#f1ede4]">
          <OfficialPhotoImage official={portrait} sizes="80px" adaptivePortrait />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#a23a2b]">Profile on file</p>
          <h3 className="mt-1 break-words font-[Fraunces] text-2xl font-semibold leading-tight">
            <Link href={`/officials/${official.id}`} className="underline-offset-4 hover:underline">
              {official.name}
            </Link>
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{official.position}</p>
          {official.district ? <p className="text-xs leading-5 text-slate-600">{official.district}</p> : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-y border-[#e4ded3] py-4 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-slate-600">Recorded review status</dt>
          <dd className="mt-1 font-bold">{official.reviewStatus ? REVIEW_LABELS[official.reviewStatus] : "Not recorded"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-600">Last checked, as recorded</dt>
          <dd className="mt-1 font-bold">{official.lastVerifiedAt || "No date on file"}</dd>
        </div>
      </dl>

      {sources.length ? (
        <details className="mt-4 text-sm">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold underline-offset-4 hover:underline">
            {sources.length} attached public {sources.length === 1 ? "source" : "sources"}
          </summary>
          <ul className="mt-2 space-y-3 border-l-2 border-[#cabfae] pl-4">
            {sources.map((source, index) => (
              <li key={`${source.url}-${index}`}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words font-semibold underline underline-offset-4">
                  {source.title || "Open source record"}
                </a>
                {source.accessedAt ? <p className="mt-1 text-xs text-slate-600">Access recorded: {source.accessedAt}</p> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#873426]">
          No public source link is attached to this profile yet.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-4 text-sm font-semibold">
        <Link href={`/officials/${official.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
          Open profile <span className="ml-2" aria-hidden="true">↗</span>
        </Link>
        {!sources.length ? (
          <Link href={rosterSourceHref(record, official.position)} className="inline-flex min-h-11 items-center text-[#a23a2b] underline underline-offset-4">
            Add a source
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function RosterProvenance({ record }: { record: JurisdictionRecord }) {
  const officeKeys = new Set(record.officeGroups.map((office) => office.key));
  const slateSources = OFFICE_SLATE_SOURCES.filter((source) => source.supports.some((key) => officeKeys.has(key)));

  return (
    <section id="scope" className="scroll-mt-28 border-t border-[#cabfae] pt-10">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-[#a23a2b]">Read the limits with the record</p>
      <h2 className="mt-3 font-[Fraunces] text-3xl font-semibold sm:text-4xl">Scope, sources and open questions</h2>
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <article className="border border-[#cabfae] bg-white p-5">
          <h3 className="font-[Fraunces] text-2xl font-semibold">District boundary</h3>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#873426]">
            TX-01: {FOOTPRINT_BOUNDARY_PROVENANCE.status.replaceAll("_", " ")}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">County labels guide coverage. They are not an authenticated TX-01 boundary.</p>
          <p className="mt-3 text-xs text-slate-600">Review recorded: {FOOTPRINT_BOUNDARY_PROVENANCE.reviewedAt}</p>
          <details className="mt-2 text-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Read the boundary review note</summary>
            <p className="mt-2 leading-6 text-slate-700">{FOOTPRINT_BOUNDARY_PROVENANCE.note}</p>
          </details>
          <ul className="mt-4 space-y-3 text-sm">
            {FOOTPRINT_BOUNDARY_PROVENANCE.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{source.label}</a>
              </li>
            ))}
          </ul>
        </article>
        <article className="border border-[#cabfae] bg-white p-5">
          <h3 className="font-[Fraunces] text-2xl font-semibold">Cities and towns</h3>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#873426]">
            {FOOTPRINT_PLACE_PROVENANCE.status.replaceAll("_", " ")}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700">The municipality list is a working set. A missing town is a gap to review.</p>
          <p className="mt-3 text-xs text-slate-600">Review recorded: {FOOTPRINT_PLACE_PROVENANCE.reviewedAt}</p>
          <details className="mt-2 text-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Read the municipality review note</summary>
            <p className="mt-2 leading-6 text-slate-700">{FOOTPRINT_PLACE_PROVENANCE.note}</p>
          </details>
          <ul className="mt-4 space-y-3 text-sm">
            {FOOTPRINT_PLACE_PROVENANCE.reconcileAgainst.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{source.label}</a>
              </li>
            ))}
          </ul>
        </article>
        <article className="border border-[#cabfae] bg-white p-5">
          <h3 className="font-[Fraunces] text-2xl font-semibold">Office planning slate</h3>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-600">Local counts need review</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">Generic counts guide research. The local office count is not authenticated here.</p>
          <p className="mt-3 text-xs text-slate-600">Review recorded: {OFFICE_SLATE_PROVENANCE.reviewedAt}</p>
          <details className="mt-4 text-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">Read the office-slate note and sources</summary>
            <p className="mt-2 leading-6 text-slate-700">{OFFICE_SLATE_PROVENANCE.note}</p>
            <ul className="mt-2 space-y-3">
              {slateSources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">{source.label}</a>
                </li>
              ))}
            </ul>
          </details>
        </article>
      </div>
    </section>
  );
}

export default async function JurisdictionRosterPage({ params }: RouteProps) {
  const { kind, slug } = await params;
  const record = getRecord(kind, slug);
  const summaries = getJurisdictionSummaries(getAllOfficials());
  const related = summaries.filter((jurisdiction) => {
    if (record.kind === "county") return jurisdiction.kind === "city" && jurisdiction.counties.includes(record.county);
    return jurisdiction.kind === "county" && record.counties.includes(jurisdiction.county);
  });
  const missingSources = record.profileCount - record.sourceLinkedCount;
  const officeFamiliesLoaded = record.officeGroups.filter((group) => group.officials.length > 0).length;

  return (
    <div className="bg-[#f5f1e8] text-[#111b24]">
      <section className="border-b border-[#cabfae] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
            <Link href="/home-district" className="inline-flex min-h-11 items-center underline underline-offset-4">The beat</Link>
            <span aria-hidden="true">/</span>
            <Link href="/home-district/roster" className="inline-flex min-h-11 items-center underline underline-offset-4">Local office explorer</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-semibold text-[#111b24]">{record.name}</span>
          </nav>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_19rem] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a23a2b]">{record.kind === "county" ? "County" : "Municipal"} record desk · Texas</p>
              <h1 className="mt-4 break-words font-[Fraunces] text-5xl font-semibold leading-[1.02] sm:text-7xl">{record.name}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Find the profiles on file, follow their sources, and see which office families still need records.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {record.kind === "city" ? `${record.counties.join(" / ")} ${record.counties.length === 1 ? "County" : "counties"} · ` : ""}
                Working coverage labels: <span className="font-semibold">{record.districts.join(" · ")}</span>
              </p>
            </div>
            <Link href={rosterSourceHref(record)} className="inline-flex min-h-12 items-center justify-center gap-4 bg-[#a23a2b] px-6 py-4 text-sm font-semibold text-white hover:bg-[#8b3024]">
              Send a {record.kind === "county" ? "county" : "city"} roster <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="mt-8 border-l-4 border-[#a23a2b] bg-[#eee7da] px-5 py-4 text-sm leading-6">
            <p className="font-bold">Working roster. Current officeholders and local seat counts still need authentication.</p>
            <p className="mt-1 text-slate-700">
              A profile or source link is not confirmation of a current incumbent. TX-01 boundary labels and the municipality list also need authentication.{" "}
              <a href="#scope" className="font-semibold underline underline-offset-4">Read the source notes.</a>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 lg:px-12">
        <dl className="grid grid-cols-2 gap-px border border-[#cabfae] bg-[#cabfae] lg:grid-cols-4">
          {[
            { value: record.profileCount, label: "Profiles on file", detail: "Records loaded for this jurisdiction" },
            { value: record.sourceLinkedCount, label: "With public source links", detail: `${missingSources} ${missingSources === 1 ? "profile needs" : "profiles need"} a source link` },
            { value: `${officeFamiliesLoaded}/${record.officeGroups.length}`, label: "Office families started", detail: "At least one matching profile on file" },
            { value: record.missingOfficeFamilyCount, label: "Office families below floor", detail: "Gaps against the generic planning slate" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#f5f1e8] p-4 sm:p-6">
              <dt className="text-xs font-bold leading-5 text-slate-600">{stat.label}</dt>
              <dd className="mt-2">
                <span className="font-[Fraunces] text-4xl font-semibold">{stat.value}</span>
                <p className="mt-2 text-xs leading-5 text-slate-600">{stat.detail}</p>
              </dd>
            </div>
          ))}
        </dl>

        <div className="my-12 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside>
            <nav aria-label="Office families" className="lg:sticky lg:top-28">
              <h2 className="font-[Fraunces] text-2xl font-semibold">Go to an office</h2>
              <div className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:divide-y lg:divide-[#cabfae] lg:border-y lg:border-[#cabfae]">
                {record.officeGroups.map((group) => (
                  <a key={group.key} href={`#office-${group.key}`} className="flex min-h-11 items-center justify-between gap-3 border border-[#cabfae] px-3 py-3 text-sm font-semibold hover:bg-white lg:border-0 lg:px-0">
                    <span>{group.label}</span>
                    <span className="font-normal text-slate-500">{group.officials.length}</span>
                  </a>
                ))}
                {record.unmatchedOfficials.length ? (
                  <a href="#other-profiles" className="flex min-h-11 items-center justify-between gap-3 border border-[#cabfae] px-3 py-3 text-sm font-semibold hover:bg-white lg:border-0 lg:px-0">
                    <span>Other profiles</span><span className="font-normal text-slate-500">{record.unmatchedOfficials.length}</span>
                  </a>
                ) : null}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-600">
                Counts show loaded profiles, not a verified complete roster. A missing record does not mean an office is vacant.
              </p>
            </nav>
          </aside>

          <div className="min-w-0 space-y-10">
            {record.officeGroups.map((group) => (
              <section id={`office-${group.key}`} key={group.key} className="scroll-mt-28">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#111b24] pb-4">
                  <div>
                    <h2 className="font-[Fraunces] text-3xl font-semibold">{group.label}</h2>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      {group.officials.length} {group.officials.length === 1 ? "profile" : "profiles"} on file · Generic planning floor: {group.expected}
                      {group.variable ? " · Local count varies" : ""}
                    </p>
                  </div>
                  {group.missing > 0 ? <span className="bg-[#eee2cc] px-3 py-2 text-xs font-bold text-[#634819]">{group.missing} below planning floor</span> : null}
                </div>
                {group.officials.length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {group.officials.map((official) => <ProfileCard key={official.id} official={official} record={record} />)}
                  </div>
                ) : (
                  <div className="border border-dashed border-[#b7a992] bg-[#f0eade] p-5 sm:p-7">
                    <p className="font-[Fraunces] text-2xl font-semibold">This office family needs a record.</p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                      No matching profile is loaded for {record.name}. An official roster, election result or government page can help establish who should be listed.
                    </p>
                    <Link href={rosterSourceHref(record, group.label)} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#a23a2b] underline underline-offset-4">Send a {group.label.toLowerCase()} source <span className="ml-2" aria-hidden="true">↗</span></Link>
                  </div>
                )}
                {group.missing > 0 && group.officials.length > 0 ? (
                  <Link href={rosterSourceHref(record, group.label)} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#a23a2b] underline underline-offset-4">Help fill this office family <span className="ml-2" aria-hidden="true">↗</span></Link>
                ) : null}
              </section>
            ))}
            {record.unmatchedOfficials.length ? (
              <section id="other-profiles" className="scroll-mt-28">
                <h2 className="border-b-2 border-[#111b24] pb-4 font-[Fraunces] text-3xl font-semibold">Other profiles on file</h2>
                <p className="my-4 text-sm leading-6 text-slate-700">These records match the jurisdiction but do not match an office family in the generic planning slate.</p>
                <div className="grid gap-4 xl:grid-cols-2">
                  {record.unmatchedOfficials.map((official) => <ProfileCard key={official.id} official={official} record={record} />)}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <section className="mb-12 border border-[#cabfae] bg-[#111b24] p-6 text-[#f5f1e8] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-[#dec4a6]">Keep following the local record</p>
              <h2 className="mt-3 font-[Fraunces] text-3xl font-semibold">{record.kind === "county" ? "Cities and towns in the working list" : "Connected county desks"}</h2>
            </div>
            <Link href="/home-district/roster" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Explore every jurisdiction <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
          {related.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((jurisdiction) => (
                <Link key={jurisdiction.href} href={jurisdiction.href} className="flex min-h-16 items-center justify-between gap-3 border border-white/25 px-4 py-4 hover:bg-white/10">
                  <span><span className="block font-semibold">{jurisdiction.name}</span><span className="mt-1 block text-xs text-slate-300">{jurisdiction.profileCount} profiles on file</span></span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-300">No related municipality is in the working list yet. This is a coverage gap, not a finding that none exist.</p>
          )}
        </section>

        <RosterProvenance record={record} />
      </div>
    </div>
  );
}
