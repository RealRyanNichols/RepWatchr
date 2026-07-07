import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllMoneyTrailDossiers, getDonorEntityBySlug } from "@/lib/money-trail";
import { formatCurrency } from "@/lib/formatting";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const donor = getDonorEntityBySlug(slug);
  if (!donor) return { title: "Donor Not Found", robots: { index: false, follow: false } };
  return {
    ...buildRepWatchrMetadata({
      title: `${donor.name} | Money Trail`,
      description: `Public campaign finance donor/source aggregate for ${donor.name}.`,
      path: `/money/donors/${donor.slug}`,
      imagePath: buildOgImageUrl("funding", { donor: donor.slug }),
      imageAlt: `${donor.name} RepWatchr donor/source aggregate preview`,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function DonorMoneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const donor = getDonorEntityBySlug(slug);
  if (!donor) notFound();
  const trails = getAllMoneyTrailDossiers().filter((trail) => donor.officialIds.includes(trail.official.id));

  return (
    <main className="rw-page-shell">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/money" className="text-sm font-black text-blue-700 hover:text-red-700">&larr; Money trail</Link>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Donor / source aggregate</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{donor.name}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            This page summarizes public filing rows and source aggregates. RepWatchr does not imply wrongdoing from a contribution by itself.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Public filing total" value={formatCurrency(donor.totalAmount)} />
            <Metric label="Record rows" value={donor.recordCount.toLocaleString()} />
            <Metric label="Type" value={donor.donorType.replaceAll("_", " ")} />
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Related filing sources</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {donor.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-bold text-blue-800 hover:border-blue-300">
                {source.label}
              </a>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Related profiles</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {trails.map((trail) => (
              <Link key={trail.official.id} href={`/funding/${trail.official.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-blue-300">
                <p className="font-black text-blue-950">{trail.official.name}</p>
                <p className="text-sm font-semibold text-slate-600">{trail.official.position}</p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-lg font-black capitalize text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
