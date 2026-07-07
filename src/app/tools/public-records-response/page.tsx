import type { Metadata } from "next";
import Link from "next/link";
import RecordsResponseIntakeForm from "@/components/records-responses/RecordsResponseIntakeForm";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Public Records Response Intake | RepWatchr",
  description: "Submit a public records response for private RepWatchr review, source-packet drafting, and safe public-summary handling.",
  path: "/tools/public-records-response",
  imagePath: buildOgImageUrl("methodology", { title: "Public Records Response Intake" }),
  imageAlt: "RepWatchr public records response intake preview",
});

export default function PublicRecordsResponsePage() {
  return (
    <main className="rw-page-shell">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Records response intake</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Got the agency response? Turn it into a reviewable record.
            </h1>
            <p className="mt-4 text-lg font-semibold leading-8 text-slate-700">
              Paste the response link, copy the email text, or upload the document. RepWatchr keeps it private until a human review clears sensitive data and source labels.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Private by default",
                "Safe packet export",
                "Admin review before public display",
                "Profile, story, race, and timeline attachment path",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-800">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">What this tool does not do</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-blue-950">
              It does not publish uploaded documents automatically, create legal conclusions, or expose private addresses, minor children, medical data, bank data, sealed material, or unsupported allegations.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/dashboard" className="secondary-button bg-white">Draft a request</Link>
              <Link href="/submit-source" className="secondary-button bg-white">Submit a source</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <RecordsResponseIntakeForm />
      </section>
    </main>
  );
}
