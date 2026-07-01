import type { Metadata } from "next";
import { SourceSubmissionForm } from "@/components/sources/SourceSubmission";

export const metadata: Metadata = {
  title: "Submit a Source | RepWatchr",
  description:
    "Submit a public source URL for a RepWatchr official, race, agency, school board, vote, funding record, story, or correction review.",
};

export default function SubmitSourcePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#fff7ed_100%)] shadow-sm">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public records first</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-blue-950 sm:text-5xl">
            Send the receipt. RepWatchr will review it.
          </h1>
          <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-700">
            Sources can support profiles, races, school boards, judges, agencies, votes, funding records, articles, and corrections. User-submitted claims do not publish as verified truth. They enter review first.
          </p>
        </div>
      </section>

      <SourceSubmissionForm />

      <section className="mt-8 grid gap-3 md:grid-cols-3">
        {[
          ["Use public URLs", "Official pages, filings, agendas, minutes, videos, public databases, and named publications review fastest."],
          ["Say appears to show", "Before admin review, describe what the source appears to show. Do not overstate it."],
          ["Keep it safe", "No private addresses, minor-child details, threats, doxxing, or unsourced criminal accusations."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-blue-950">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
