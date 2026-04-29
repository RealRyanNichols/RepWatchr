import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttorneyWatchProfileBySlug, getAttorneyWatchProfiles } from "@/lib/power-watch";
import { getProfileScorecardTargetType } from "@/lib/universal-scorecards";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";

interface AttorneyProfilePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAttorneyWatchProfiles().map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: AttorneyProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getAttorneyWatchProfileBySlug(slug);

  if (!profile) {
    return { title: "Attorney Profile Not Found | RepWatchr" };
  }

  return {
    title: `${profile.name} | Attorney Watch | RepWatchr`,
    description: `${profile.name} public profile: ${profile.summary}`,
  };
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function signalClasses(tone: "good" | "warning" | "bad" | "neutral") {
  switch (tone) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "bad":
      return "border-red-200 bg-red-50 text-red-950";
    case "neutral":
      return "border-slate-200 bg-slate-50 text-slate-950";
  }
}

const defaultSignals = [
  {
    label: "Client wins and losses",
    status: "needs_records_review" as const,
    tone: "neutral" as const,
    detail: "No client-outcome dataset has been loaded for this profile yet.",
    sourceTitle: undefined,
  },
  {
    label: "Online reviews",
    status: "needs_records_review" as const,
    tone: "neutral" as const,
    detail: "No review sample has been scored yet. Add Google, Avvo, Martindale, Facebook, or submitted review evidence with source links.",
    sourceTitle: undefined,
  },
  {
    label: "Social media sentiment",
    status: "needs_records_review" as const,
    tone: "neutral" as const,
    detail: "No social-media comment sample has been loaded yet.",
    sourceTitle: undefined,
  },
  {
    label: "Rulings and discipline",
    status: "needs_records_review" as const,
    tone: "neutral" as const,
    detail: "No sanctions, disciplinary findings, malpractice rulings, civil rulings, or criminal rulings have been loaded for this profile yet.",
    sourceTitle: undefined,
  },
];

export default async function AttorneyProfilePage({ params }: AttorneyProfilePageProps) {
  const { slug } = await params;
  const profile = getAttorneyWatchProfileBySlug(slug);

  if (!profile) notFound();

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/attorneys" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Attorneys and law firms
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
              {profile.profileTags?.map((tag) => (
                <span key={tag} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {profile.featuredSpotlight ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-red-200 bg-slate-950 text-white shadow-sm">
            <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_50%,#d6b35a_50%,#d6b35a_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
            <div className="p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">
                {profile.featuredSpotlight.label}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">{profile.featuredSpotlight.title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                {profile.featuredSpotlight.summary}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-300">Status</p>
                  <p className="mt-1 text-sm font-black capitalize text-white">
                    {profile.featuredSpotlight.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-300">Case</p>
                  <p className="mt-1 text-sm font-black text-white">{profile.featuredSpotlight.caseNumber ?? "Not loaded"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-300">Sentiment</p>
                  <p className="mt-1 text-sm font-black text-[#d6b35a]">
                    {profile.sentimentSummary?.score ?? "Review"} / {profile.sentimentSummary?.label ?? "Pending"}
                  </p>
                </div>
              </div>
              {profile.featuredSpotlight.callout ? (
                <p className="mt-4 rounded-xl border border-white/10 bg-white/10 p-4 text-sm font-semibold leading-6 text-slate-200">
                  {profile.featuredSpotlight.callout}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <ProfileScorecardVote
            targetType={getProfileScorecardTargetType(profile.kind)}
            targetId={profile.slug}
            targetName={profile.name}
            targetPath={`/attorneys/${profile.slug}`}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Attorney sentiment file</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Reviews, outcomes, rulings, and client-rights signals</h2>
            </div>
            {profile.sentimentSummary ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Current score</p>
                <p className="text-3xl font-black text-blue-950">{profile.sentimentSummary.score ?? "Review"}</p>
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {profile.sentimentSummary?.basis ??
              "RepWatchr will score attorneys from sourced client outcomes, public reviews, social comments, court rulings, disciplinary records, malpractice/civil rulings, criminal rulings, and findings that a client right was violated."}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(profile.accountabilitySignals ?? defaultSignals).map((signal) => (
              <div key={signal.label} className={`rounded-xl border p-4 ${signalClasses(signal.tone)}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-black">{signal.label}</p>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
                    {signal.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6">{signal.detail}</p>
                {signal.sourceTitle ? (
                  <p className="mt-2 text-xs font-black uppercase tracking-wide opacity-70">Source: {signal.sourceTitle}</p>
                ) : null}
              </div>
            ))}
          </div>
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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Authority and practice areas</p>
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
                    href={`/attorneys/${person.slug}`}
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
