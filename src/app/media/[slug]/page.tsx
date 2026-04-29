import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMediaWatchProfileBySlug, getMediaWatchProfiles } from "@/lib/power-watch";
import { getProfileScorecardTargetType } from "@/lib/universal-scorecards";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";

interface MediaProfilePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getMediaWatchProfiles().map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: MediaProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getMediaWatchProfileBySlug(slug);

  if (!profile) {
    return { title: "Media Profile Not Found | RepWatchr" };
  }

  return {
    title: `${profile.name} | Media Watch | RepWatchr`,
    description: `${profile.name} public media profile: ${profile.summary}`,
  };
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function MediaProfilePage({ params }: MediaProfilePageProps) {
  const { slug } = await params;
  const profile = getMediaWatchProfileBySlug(slug);

  if (!profile) notFound();

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/media" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Media watch
        </Link>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                  {profile.categoryLabel}
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{profile.name}</h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                  {profile.summary}
                </p>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 md:w-64">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Buildout</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{profile.buildoutPercent}%</p>
                <p className="mt-1 text-xs font-bold capitalize text-slate-600">{statusLabel(profile.profileStatus)}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#b42318,#1d4ed8)]"
                    style={{ width: `${Math.min(100, Math.max(0, profile.buildoutPercent))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[profile.city, profile.county ? `${profile.county} County` : undefined, profile.region, profile.state]
                .filter(Boolean)
                .map((item) => (
                  <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-900">
                    {item}
                  </span>
                ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <ProfileScorecardVote
            targetType={getProfileScorecardTargetType(profile.kind)}
            targetId={profile.slug}
            targetName={profile.name}
            targetPath={`/media/${profile.slug}`}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Why tracked</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{profile.whyTracked}</p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public scrutiny areas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.scrutinyAreas.map((item) => (
                <span key={item} className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-black capitalize text-slate-800">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Authority and coverage areas</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {profile.authorityAreas.map((item) => (
              <div key={item} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-black capitalize text-slate-800">
                {item}
              </div>
            ))}
          </div>
        </section>

        {profile.affiliatedPeople?.length ? (
          <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Affiliated public people</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {profile.affiliatedPeople.map((person) => (
                person.slug ? (
                  <Link
                    key={`${person.name}-${person.role}`}
                    href={`/media/${person.slug}`}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 hover:border-blue-400 hover:bg-blue-50"
                  >
                    {person.name} <span className="font-semibold text-slate-500">/ {person.role}</span>
                  </Link>
                ) : (
                  <div key={`${person.name}-${person.role}`} className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                    {person.name} <span className="font-semibold text-slate-500">/ {person.role}</span>
                  </div>
                )
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Public sources</p>
          <div className="mt-3 space-y-2">
            {profile.sourceLinks.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-black text-blue-800 hover:border-blue-400 hover:bg-blue-50"
              >
                {source.title}
                <span className="block pt-1 text-xs font-semibold text-slate-500">
                  {source.sourceType} / checked {source.lastCheckedAt}
                </span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
