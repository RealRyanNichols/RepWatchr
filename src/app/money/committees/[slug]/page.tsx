import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCommitteeRecordBySlug, getAllMoneyTrailDossiers } from "@/lib/money-trail";
import { buildRepWatchrMetadata, buildOgImageUrl } from "@/lib/repwatchr-seo";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const committee = getCommitteeRecordBySlug(slug);
  if (!committee) return { title: "Committee Not Found", robots: { index: false, follow: false } };
  return {
    ...buildRepWatchrMetadata({
      title: `${committee.name} | Money Trail`,
      description: `Public campaign finance filing source path for ${committee.name}.`,
      path: `/money/committees/${committee.slug}`,
      imagePath: buildOgImageUrl("funding", { committee: committee.slug }),
      imageAlt: `${committee.name} RepWatchr money trail preview`,
    }),
    robots: { index: false, follow: true },
  };
}

export default async function CommitteeMoneyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const committee = getCommitteeRecordBySlug(slug);
  if (!committee) notFound();
  const trails = getAllMoneyTrailDossiers().filter((trail) => committee.officialIds.includes(trail.official.id));

  return (
    <main className="rw-page-shell">
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/money" className="text-sm font-black text-blue-700 hover:text-red-700">&larr; Money trail</Link>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Committee / filing source</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{committee.name}</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            This page identifies a public filing source or committee source path. It does not imply wrongdoing, influence, or control.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Type" value={committee.committeeType.replaceAll("_", " ")} />
            <Metric label="Source count" value={committee.sourceCount.toLocaleString()} />
            <Metric label="Status" value={committee.status.replaceAll("_", " ")} />
          </div>
          {committee.sourceUrl ? (
            <a href={committee.sourceUrl} target="_blank" rel="noopener noreferrer" className="primary-button mt-5 inline-flex">
              Open public source
            </a>
          ) : null}
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Related profiles</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {trails.map((trail) => (
              <Link key={trail.official.id} href={`/funding/${trail.official.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:border-blue-300">
                <p className="font-black text-blue-950">{trail.official.name}</p>
                <p className="text-sm font-semibold text-slate-600">{trail.confidenceLabel}</p>
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
