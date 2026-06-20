import type { Metadata } from "next";
import ReportButton from "@/components/shared/ReportButton";

export const metadata: Metadata = {
  title: "Submit Source",
  description:
    "Send RepWatchr a public source, correction, roster, vote, filing, meeting record, or missing official for review.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#fff7ed_100%)] shadow-sm">
        <div className="h-1.5 w-full bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
            Source drop
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-blue-950">
            Put a missing receipt in the record.
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            Build a source packet for the agenda, clip, filing, roster, article, vote, meeting video, campaign-finance record, correction, or missing official. You do not need an account. Public-source links are what turn concern into a reusable record.
          </p>
        </div>
      </section>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-950">
            Fix the record
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Wrong name, outdated office, broken source, incorrect party, bad term date, score issue, or missing context.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-950">
            Add a target
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            County, city, school board, public board, appointed office, election result, or official roster that RepWatchr has not loaded yet.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-red-100 bg-red-50 p-5">
        <h2 className="text-sm font-black uppercase tracking-wide text-red-800">
          What gets reviewed fastest
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {["Official source URL", "Date and jurisdiction", "Why voters should look"].map((item) => (
            <div key={item} className="rounded-lg bg-white px-3 py-2 text-sm font-black text-blue-950 shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <ReportButton pageUrl="/submit-source" />

      <div className="mt-10 rounded-xl bg-blue-50/70 border border-blue-100 p-6">
        <h2 className="text-lg font-bold text-blue-950 mb-3">
          What to include
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Official name and office",
            "Jurisdiction, county, district, or seat",
            "Public source URL",
            "Term, election date, or appointment date",
            "What is wrong, missing, or new",
            "No private addresses or minor children",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-black text-blue-950">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-xl bg-gray-50 border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          What happens after you submit?
        </h2>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              1
            </span>
            <span>
              While Supabase is paused, the form creates a copyable source packet instead of writing to a database.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              2
            </span>
            <span>
              Keep the packet with the public source URL, date, jurisdiction, and what needs to be checked.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              3
            </span>
            <span>
              When the review queue is active again, packets can be imported into the database-backed workflow.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
