import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import PublicDataApiAccessForm from "@/components/public-data-api/PublicDataApiAccessForm";
import { PUBLIC_API_ENDPOINTS, PUBLIC_API_SCOPES } from "@/lib/public-data-api-config";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = buildRepWatchrMetadata({
  title: "Public Data API Access | RepWatchr",
  description:
    "Request future RepWatchr public data API access for source-backed profiles, public sources, races, jurisdictions, and aggregate civic trends.",
  path: "/packages/public-data-api",
  imagePath: buildOgImageUrl("services", { slug: "public-data-api" }),
  imageAlt: "RepWatchr public data API access preview",
});

const availableData = [
  "Approved public profile data with public-role fields and source counts.",
  "Approved public source links, source labels, and public record metadata.",
  "Public jurisdictions, races, stories, school-board pages, and source gaps when reviewed.",
  "Aggregate non-identifying trends for pages, searches, watches, shares, records, and jurisdictions.",
  "Data exports that are filtered, logged, expiring, and tied to an approved access request.",
];

const unavailableData = [
  "Private user data, private watchlists, private submissions, or private uploaded documents.",
  "Raw analytics tied to identifiable people or individual visitor histories.",
  "Admin notes, internal reviewer comments, risk notes, payment events, or service fulfillment records.",
  "Under-review claims presented as verified facts.",
  "Private addresses, minor children, medical data, sealed/restricted records, or doxxing material.",
];

const useCases = [
  "Journalists building source-backed local accountability dashboards.",
  "Civic groups tracking public-record gaps across counties, districts, or school boards.",
  "Researchers comparing public profiles, races, source trails, and aggregate trends.",
  "Public affairs or campaign teams that need source links without private-data targeting.",
  "Organizations that may later need CSV exports, API keys, or a monitored jurisdiction feed.",
];

export default function PublicDataApiPackagePage() {
  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-1.5 max-w-xl rounded-full bg-[linear-gradient(90deg,#b42318_0%,#d6b35a_45%,#1d4ed8_100%)]" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-red-300">Future data product</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">
            Public-record data access without private-data games.
          </h1>
          <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-200 sm:text-lg">
            RepWatchr is building a gated public data API for approved source-backed profiles, public sources,
            jurisdictions, races, stories, and aggregate non-identifying trends. It is not publicly launched yet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#request-api-access" className="primary-button">Request access</a>
            <Link href="/methodology" className="secondary-button">View methodology</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="grid content-start gap-6">
          <Panel eyebrow="Use cases" title="Who this is for">
            <BulletList items={useCases} />
          </Panel>

          <Panel eyebrow="Available when approved" title="What the API can include">
            <BulletList items={availableData} />
          </Panel>

          <Panel eyebrow="Hard boundary" title="What the API will not include">
            <BulletList items={unavailableData} tone="warn" />
          </Panel>
        </div>

        <div className="grid content-start gap-6">
          <PublicDataApiAccessForm />

          <Panel eyebrow="Endpoint foundation" title="Future public endpoints">
            <div className="grid gap-2">
              {PUBLIC_API_ENDPOINTS.map((endpoint) => (
                <div key={endpoint.path} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">{endpoint.path}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-blue-950">{endpoint.scope.replaceAll("_", " ")}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Privacy guardrails" title="Data product rules">
            <p className="text-sm font-semibold leading-6 text-slate-700">
              RepWatchr data products are built around public records, public source links, and aggregate signals. Access requests are reviewed before any key is issued. API keys are scoped, rate-limited, logged, and revocable.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {PUBLIC_API_SCOPES.filter((scope) => scope !== "admin_internal").map((scope) => (
                <span key={scope} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-950">
                  {scope.replaceAll("_", " ")}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({ items, tone = "default" }: { items: string[]; tone?: "default" | "warn" }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div
          key={item}
          className={`rounded-lg border px-3 py-2 text-sm font-bold leading-6 ${
            tone === "warn"
              ? "border-amber-200 bg-amber-50 text-amber-950"
              : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
