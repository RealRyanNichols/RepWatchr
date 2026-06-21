import type { Metadata } from "next";
import Link from "next/link";
import TexasElectionContributionForm from "@/components/elections/TexasElectionContributionForm";
import { getTexasRaceHubRaces } from "@/lib/race-hub";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata: Metadata = {
  ...buildRepWatchrMetadata({
    title: "Contribute Texas Election Records | RepWatchr",
    description:
      "Build source-backed Texas election record packets for review across statewide, East Texas, county, school board, and judicial races.",
    path: "/elections/texas/contribute",
    imagePath: buildOgImageUrl("source-packet", { target: "Texas election source packet" }),
    imageAlt: "RepWatchr Texas election contribution source packet preview",
  }),
};

const contributorSteps = [
  "Submit a source into the RepWatchr review queue and keep a copyable packet as backup.",
  "Pick the Texas race lane that matches the source.",
  "Add a public URL and plain-English summary of what the source shows.",
  "RepWatchr reviews the record before anything becomes public or attaches to a profile.",
];

const priorityTargets = [
  "East Texas congressional races",
  "Texas Senate and House districts",
  "County election offices and ballot records",
  "School board races, bonds, agendas, and meeting clips",
  "Statewide executive and judicial races",
];

export default async function TexasElectionContributePage({
  searchParams,
}: {
  searchParams: Promise<{ race?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const defaultRaceSlug = typeof params.race === "string" ? params.race : undefined;
  const races = getTexasRaceHubRaces().map((race) => ({
    slug: race.slug,
    title: race.title,
    shortTitle: race.shortTitle,
    region: race.region,
  }));

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <section className="order-2 grid content-start gap-5 lg:order-1">
          <Link href="/elections/texas" className="text-sm font-black text-blue-800 hover:text-red-700">
            &larr; Texas race hub
          </Link>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Texas starts here</p>
            <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight text-blue-950 sm:text-5xl">
              Build the Texas election record with local eyes on it.
            </h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-700 sm:text-base">
              RepWatchr should become the page voters open before they vote, share, or show up.
              That only works if Texas people can add records, corrections, meeting clips, filings,
              and local questions without turning the site into noise. Right now this page builds
              clean source packets and sends them into the private review queue when the database is configured.
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-900">How contributions work</p>
            <div className="mt-4 grid gap-2">
              {contributorSteps.map((step, index) => (
                <div key={step} className="grid grid-cols-[32px_1fr] gap-3 rounded-lg bg-white p-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-blue-950">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Build first</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              East Texas, then statewide.
            </h2>
            <div className="mt-4 grid gap-2">
              {priorityTargets.map((target) => (
                <div key={target} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                  {target}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <TexasElectionContributionForm races={races} defaultRaceSlug={defaultRaceSlug} />
        </section>
      </main>
    </div>
  );
}
