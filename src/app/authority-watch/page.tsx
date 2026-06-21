import type { Metadata } from "next";
import Link from "next/link";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Authority Watch",
  description:
    "RepWatchr tracks public officials and public-facing authority roles through source-backed records, review labels, and safer citizen submissions.",
  path: "/authority-watch",
  imagePath: buildOgImageUrl("home"),
  imageAlt: "RepWatchr Authority Watch preview",
});

const authorityLanes = [
  {
    title: "Elected officials",
    description:
      "Federal, state, county, city, school-board, and public-board officials who ask voters for authority or spend public money.",
  },
  {
    title: "Badge and custody roles",
    description:
      "Law enforcement, corrections, probation, jail, detention, fire, EMS, and other public-safety roles when the record is public and relevant.",
  },
  {
    title: "Schools and boards",
    description:
      "Trustees, administrators, faculty leadership, and school decision makers when the role is public-facing, source documented, and connected to policy or oversight.",
  },
  {
    title: "Proceedings and public systems",
    description:
      "People tied to public hearings, public contracts, public records, public funds, public proceedings, or authority that can affect citizens.",
  },
];

const reviewRules = [
  "Use public records, official pages, agendas, minutes, filings, public video, or source-linked reporting.",
  "Separate facts, allegations, public claims, inferences, and missing records.",
  "Do not submit private home addresses, minor children, medical details, sealed records, or personal contact data.",
  "Positive records belong here too: good votes, public service, transparency, correction, and accountability all count.",
];

export default function AuthorityWatchPage() {
  return (
    <div className="rw-page-shell">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Authority Watch
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-blue-950 sm:text-6xl">
              Public power belongs on the record.
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700 sm:text-lg">
              RepWatchr starts with elected officials and school boards, then expands
              into public-facing authority roles only when the record can be sourced,
              reviewed, and shown without exposing private information.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/officials"
                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-950"
              >
                Browse Officials
              </Link>
              <Link
                href="/submit-source"
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white"
              >
                Submit Source
              </Link>
              <Link
                href="/methodology"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-800 transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50"
              >
                Review Rules
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-blue-950/15">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
              Boundary
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight">
              Strong record. Safer public page.
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              Authority Watch is not for rumors, threats, private details, or harassment.
              It is for public roles, public records, public conduct, public praise,
              public concerns, and source-backed gaps citizens can inspect.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            What belongs here
          </p>
          <h2 className="mt-2 text-3xl font-black text-blue-950">
            Focus on roles that can affect citizens.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {authorityLanes.map((lane) => (
            <div key={lane.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-blue-950">{lane.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {lane.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-[#f8fbff]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                Source standard
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight text-blue-950">
                If it cannot be checked, it needs review before it goes public.
              </h2>
            </div>
            <div className="grid gap-3">
              {reviewRules.map((rule, index) => (
                <div key={rule} className="grid grid-cols-[36px_1fr] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-red-700 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
