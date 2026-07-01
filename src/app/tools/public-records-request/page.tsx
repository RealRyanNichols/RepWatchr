import type { Metadata } from "next";
import Link from "next/link";
import RecordsRequestBuilder from "@/components/tools/RecordsRequestBuilder";
import { breadcrumbJsonLd, getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({
  title: "Public Records Request Generator",
  description: "Draft public-records requests, short emails, follow-ups, and overdue follow-ups for agencies, boards, courts, votes, filings, and meetings.",
  path: "/tools/public-records-request",
  imagePath: "/api/og?type=methodology&title=Public%20Records%20Request%20Generator",
});

export default function PublicRecordsRequestPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(191,13,62,0.14),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_54%,#fff_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "RepWatchr", path: "/" },
              { name: "Tools", path: "/tools/public-records-request" },
              { name: "Public Records Request Generator", path: "/tools/public-records-request" },
            ]),
          ),
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.10)]">
          <div className="h-2 bg-[linear-gradient(90deg,#bf0d3e_0%,#bf0d3e_33%,#ffffff_33%,#ffffff_66%,#002868_66%,#002868_100%)]" />
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-800">Public records research tool</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight tracking-tight text-blue-950 sm:text-6xl">
                Ask for the record in a form an agency can answer.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                Build a focused request, then copy the formal version, short email, follow-up, overdue follow-up, or clarification starter.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80 lg:grid-cols-1">
              <Link href="/free-packet" className="rounded-2xl bg-red-700 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-blue-950">
                Build source packet
              </Link>
              <Link href="/submit-source" className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-black uppercase tracking-wide text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:text-red-700">
                Submit a source
              </Link>
            </div>
          </div>
        </section>

        <RecordsRequestBuilder surface="public_records_request_route" />
      </main>
    </div>
  );
}
