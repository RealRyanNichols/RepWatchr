import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PredatorWatchReportForm from "@/components/predator-watch/PredatorWatchReportForm";
import { getPredatorWatchProfileBySlug, getPredatorWatchProfiles } from "@/lib/predator-watch";
import type { PredatorProfile } from "@/types/predator-watch";

export const dynamic = "force-dynamic";

interface PredatorProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const profiles = await getPredatorWatchProfiles();
  return profiles.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: PredatorProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPredatorWatchProfileBySlug(slug);

  if (!profile) {
    return { title: "Predator Watch Profile Not Found | RepWatchr" };
  }

  return {
    title: `${profile.fullName} | East Texas Predator Watch | RepWatchr`,
    description: `${profile.fullName} official registry profile: ${profile.offense}`,
  };
}

function riskLabel(riskLevel: PredatorProfile["riskLevel"]) {
  switch (riskLevel) {
    case "low":
      return "Level one / low";
    case "moderate":
      return "Level two / moderate";
    case "high":
      return "Level three / high";
    case "civil_commitment":
      return "Civil commitment";
    case "not_reported":
      return "Not reported";
  }
}

function statusLabel(status: PredatorProfile["registryStatus"]) {
  return status.replaceAll("_", " ");
}

function FactCard({ label, value }: { label: string; value?: string | number | boolean }) {
  const shown = typeof value === "boolean" ? (value ? "Yes" : "No") : value;
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black capitalize text-slate-950">{shown || "Not listed"}</p>
    </div>
  );
}

export default async function PredatorWatchProfilePage({ params }: PredatorProfilePageProps) {
  const { slug } = await params;
  const profile = await getPredatorWatchProfileBySlug(slug);

  if (!profile) notFound();

  return (
    <div className="rw-page-shell">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/east-texas-predator-watch" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; East Texas Predator Watch
        </Link>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#7f1d1d_0%,#dc2626_42%,#d6b35a_42%,#d6b35a_52%,#ffffff_52%,#ffffff_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 md:grid-cols-[300px_minmax(0,1fr)] lg:p-7">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
              {profile.photoUrl ? (
                <span
                  aria-label={`Official registry photo for ${profile.fullName}`}
                  role="img"
                  className="block aspect-[4/5] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${JSON.stringify(profile.photoUrl)})` }}
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center bg-[radial-gradient(circle_at_30%_10%,#334155,#0f172a_48%,#450a0a)]">
                  <span aria-hidden="true" className="text-6xl font-black text-red-200">!</span>
                </div>
              )}
              <div className="border-t border-white/10 p-3 text-xs font-bold leading-5 text-slate-300">
                Photo source:{" "}
                {profile.photoSourceUrl ? (
                  <a href={profile.photoSourceUrl} target="_blank" rel="noopener noreferrer" className="text-red-100 underline">
                    official source
                  </a>
                ) : (
                  "not published"
                )}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
                  {riskLabel(profile.riskLevel)}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-950">
                  {statusLabel(profile.registryStatus)}
                </span>
                {profile.isWanted ? (
                  <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-950">
                    Official wanted flag
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">{profile.fullName}</h1>
              {profile.aliases.length ? (
                <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-300">
                  Aliases: {profile.aliases.join(", ")}
                </p>
              ) : null}
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-200">{profile.offense}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <FactCard label="City" value={profile.city} />
                <FactCard label="County" value={`${profile.county} County`} />
                <FactCard label="Registry address" value={profile.registryAddress} />
                <FactCard label="Registering agency" value={profile.registeringAgency} />
              </div>
              <a
                href={profile.officialProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-black text-white transition hover:bg-red-800"
              >
                <span aria-hidden="true" className="text-base leading-none">-&gt;</span>
                Open official registry record
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FactCard label="Offense category" value={profile.offenseCategory} />
          <FactCard label="Conviction date" value={profile.convictionDate} />
          <FactCard label="Punishment" value={profile.punishment} />
          <FactCard label="Victim age" value={profile.victimAge} />
          <FactCard label="Last verified" value={profile.lastVerifiedAt} />
          <FactCard label="Source freshness" value={profile.sourceFreshness.replaceAll("_", " ")} />
          <FactCard label="Failure to register" value={profile.failureToRegister} />
          <FactCard label="Civil commitment" value={profile.civilCommitment} />
        </section>

        {(profile.isWanted || profile.failureToRegister || profile.recentAddressChange || profile.civilCommitment) ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-700 text-white">
                <span aria-hidden="true" className="text-base font-black">!</span>
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Watch priority basis</p>
                <h2 className="mt-1 text-2xl font-black text-red-950">{profile.priorityReason}</h2>
                {profile.warrantSourceUrl ? (
                  <a
                    href={profile.warrantSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-black text-red-800 underline underline-offset-4"
                  >
                    <span aria-hidden="true" className="text-base leading-none">-&gt;</span>
                    Official warrant source
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Records show</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Official facts on file</h2>
            <div className="mt-4 space-y-2">
              {(profile.recordsShow.length ? profile.recordsShow : ["No expanded records-show summary has been approved yet."]).map((item) => (
                <div key={item} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
                  <span aria-hidden="true" className="mt-1 shrink-0 text-sm font-black leading-none text-red-700">OK</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Safety notes</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Use current official records before acting</h2>
            <div className="mt-4 space-y-2">
              {[
                ...profile.safetyNotes,
                "Do not threaten, intimidate, harass, or contact people through this page.",
                "Verify address and status with the official registry or local law enforcement before relying on stale data.",
              ].map((item) => (
                <div key={item} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
                  <span aria-hidden="true" className="mt-1 shrink-0 text-xs font-black leading-none text-blue-700">PIN</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Source trail</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Registry, court, agency, and public-record links</h2>
            <div className="mt-4 space-y-2">
              {profile.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-black text-blue-800 hover:border-blue-400 hover:bg-blue-50"
                >
                  {source.title}
                  <span className="block pt-1 text-xs font-semibold text-slate-500">
                    {source.sourceType} / checked {source.lastCheckedAt}
                    {source.detail ? ` / ${source.detail}` : ""}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Community reports under review</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Only redacted, approved notes publish</h2>
            <div className="mt-4 space-y-2">
              {profile.publicNotes.length ? (
                profile.publicNotes.map((note) => (
                  <div key={note.id ?? note.body} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{note.label}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{note.body}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      <span aria-hidden="true" className="text-xs leading-none">DOC</span>
                      {note.sourceLabel ?? "Approved public note"} / {note.publishedAt}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-black leading-6 text-amber-950">
                  No public community notes have been approved for this profile.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <PredatorWatchReportForm defaultPersonName={profile.fullName} profileSlug={profile.slug} />
        </section>
      </main>
    </div>
  );
}
