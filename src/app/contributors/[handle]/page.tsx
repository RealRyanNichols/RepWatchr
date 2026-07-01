import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  contributionKindLabels,
  contributorDisplayName,
  contributorLevelDescriptions,
  contributorLevelLabels,
  contributorBadgeCatalog,
  type ContributorBadgeAward,
  type PublicContributorProfile,
} from "@/lib/contributors";
import { getPublicContributorByHandle, publicBadgeCatalog } from "@/lib/contributor-data";

type PageProps = {
  params: Promise<{ handle: string }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function initials(profile: PublicContributorProfile) {
  const name = contributorDisplayName(profile).replace("@", "");
  return name
    .split(/\s+|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RW";
}

function badgeFromAward(award: ContributorBadgeAward) {
  if (award.contributor_badges) return award.contributor_badges;
  const fallback = contributorBadgeCatalog.find((badge) => badge.badgeKey === award.badge_key);
  return fallback
    ? {
        name: fallback.name,
        description: fallback.description,
        icon_label: fallback.iconLabel,
        accent: fallback.accent,
      }
    : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const bundle = await getPublicContributorByHandle(handle);

  if (!bundle) {
    return {
      title: "Contributor Not Found",
      robots: { index: false, follow: false },
    };
  }

  const name = contributorDisplayName(bundle.profile);
  const description = `${name} has ${formatNumber(bundle.profile.total_xp)} RepWatchr XP, ${formatNumber(bundle.profile.accepted_sources_count)} accepted sources, and ${Math.round(bundle.profile.accuracy_score)}% accuracy.`;

  return {
    title: `${name} | RepWatchr Contributor`,
    description,
    alternates: {
      canonical: `https://www.repwatchr.com/contributors/${bundle.profile.handle}`,
    },
    openGraph: {
      title: `${name} | RepWatchr Contributor`,
      description,
      url: `https://www.repwatchr.com/contributors/${bundle.profile.handle}`,
      siteName: "RepWatchr",
      type: "profile",
      images: [
        {
          url: "/images/repwatchr-cover-america-first.png",
          width: 2172,
          height: 724,
          alt: `${name} RepWatchr contributor profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | RepWatchr Contributor`,
      description,
      images: ["/images/repwatchr-cover-america-first.png"],
    },
  };
}

export default async function ContributorProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const bundle = await getPublicContributorByHandle(handle);
  if (!bundle) notFound();

  const { profile, records, badgeAwards } = bundle;
  const name = contributorDisplayName(profile);
  const badges = badgeAwards.length ? badgeAwards.map(badgeFromAward).filter(Boolean) : publicBadgeCatalog().slice(0, 4);

  const stats = [
    { label: "XP", value: formatNumber(profile.total_xp), detail: profile.reputation_status },
    { label: "Accepted Sources", value: formatNumber(profile.accepted_sources_count), detail: "review-counted records" },
    { label: "Verified", value: formatNumber(profile.verified_contributions_count), detail: "confirmed contribution rows" },
    { label: "Accuracy", value: `${Math.round(profile.accuracy_score)}%`, detail: "based on reviewed rows" },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
          <div className="h-2 bg-[linear-gradient(90deg,#bf0d3e,#d6b35a,#ffffff,#1d4ed8)]" />
          <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:p-8">
            <div className="grid h-28 w-28 place-items-center rounded-3xl bg-blue-950 text-3xl font-black text-white shadow-xl shadow-blue-950/20">
              {initials(profile)}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">RepWatchr contributor</p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-blue-950 sm:text-6xl">{name}</h1>
              <p className="mt-2 text-sm font-black uppercase tracking-wide text-blue-800">
                @{profile.handle} / {contributorLevelLabels[profile.primary_level]} / {profile.county ?? "County not public"} / {profile.state}
              </p>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-700">
                {profile.public_bio ?? contributorLevelDescriptions[profile.primary_level]}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[220px] lg:grid-cols-1">
              <RankCard label="Overall Rank" value={`#${profile.overall_rank ?? "Open"}`} />
              <RankCard label={`${profile.state} Rank`} value={`#${profile.state_rank ?? "Open"}`} />
              <RankCard label="County Rank" value={`#${profile.county_rank ?? "Open"}`} />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
              <p className="text-3xl font-black text-blue-950">{stat.value}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{stat.label}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{stat.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Badges</p>
              <div className="mt-4 grid gap-3">
                {badges.map((badge) => (
                  <div key={badge!.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-800">{badge!.icon_label}</p>
                    <p className="mt-2 text-lg font-black text-blue-950">{badge!.name}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{badge!.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">Reputation rules</p>
              <div className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
                <p>Contributors earn reputation for public-record work, not money.</p>
                <p>Accepted sources, verified rows, usefulness, and accuracy matter more than volume.</p>
                <p>Private addresses, doxxing, threats, and unsourced allegations do not belong in RepWatchr contribution records.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Accepted contribution trail</p>
                <h2 className="mt-1 text-3xl font-black text-blue-950">Records people can inspect</h2>
              </div>
              <Link href="/submit-source" className="text-sm font-black uppercase tracking-wide text-blue-700 hover:text-red-700">
                Submit better source
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {records.length ? (
                records.map((record) => (
                  <article key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-blue-800">
                          {contributionKindLabels[record.kind]} / {record.status.replace(/_/g, " ")}
                        </p>
                        <h3 className="mt-1 text-xl font-black text-blue-950">{record.title}</h3>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-red-700 shadow-sm">
                        +{record.xp_awarded} XP
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                      {record.target_label} {record.jurisdiction ? `/ ${record.jurisdiction}` : ""}
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{record.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {record.source_url ? (
                        <Link
                          href={record.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-800 hover:border-red-300 hover:text-red-700"
                        >
                          Open Source
                        </Link>
                      ) : null}
                      {record.attached_href ? (
                        <Link
                          href={record.attached_href}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-700 hover:border-red-300 hover:text-red-700"
                        >
                          Open Attached Record
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-lg font-black text-blue-950">No accepted public contribution rows are visible yet.</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    This profile can still have private submitted records awaiting review. Public contribution rows appear after review.
                  </p>
                  <Link
                    href="/submit-source"
                    className="mt-4 inline-flex rounded-xl bg-red-700 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-blue-950"
                  >
                    Submit a better source
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <ActionCard href="/contributors" eyebrow="Leaderboard" title="Compare contributors" detail="Open county, state, accepted-source, and accuracy rankings." />
          <ActionCard href="/dashboard" eyebrow="Earn XP" title="Build your record" detail="Submit source, vote, funding, meeting, edit, and fact-check records." />
          <ActionCard href="/officials" eyebrow="Next target" title="Open an official" detail="Find the next profile that needs a source trail." />
          <ActionCard href="/submit-source" eyebrow="Receipt" title="Submit source" detail="Send the record that confirms, corrects, or narrows a claim." />
        </section>
      </main>
    </div>
  );
}

function RankCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <p className="text-2xl font-black text-blue-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function ActionCard({ href, eyebrow, title, detail }: { href: string; eyebrow: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="rw-click-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300"
    >
      <p className="text-xs font-black uppercase tracking-wide text-red-700">{eyebrow}</p>
      <p className="mt-2 text-lg font-black text-blue-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">{detail}</p>
    </Link>
  );
}
