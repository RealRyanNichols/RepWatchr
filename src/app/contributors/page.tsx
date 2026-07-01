import type { Metadata } from "next";
import Link from "next/link";
import {
  contributionKindLabels,
  contributionKinds,
  contributorDisplayName,
  contributorLevelDescriptions,
  contributorLevelLabels,
  contributorLevels,
  type PublicContributorProfile,
} from "@/lib/contributors";
import { getPublicContributorLeaderboard, publicBadgeCatalog } from "@/lib/contributor-data";

export const metadata: Metadata = {
  title: "RepWatchr Contributors | XP, Badges, and Rankings",
  description:
    "RepWatchr contributor profiles reward public-record work with XP, badges, county rankings, state rankings, accuracy, and accepted-source reputation.",
  alternates: {
    canonical: "https://www.repwatchr.com/contributors",
  },
  openGraph: {
    title: "RepWatchr Contributors | Reputation for Public Records",
    description:
      "Source Runners, Vote Hunters, Funding Trackers, Fact Checkers, and Community Builders earn reputation for useful public-record work.",
    url: "https://www.repwatchr.com/contributors",
    siteName: "RepWatchr",
    type: "website",
    images: [
      {
        url: "/images/repwatchr-cover-america-first.png",
        width: 2172,
        height: 724,
        alt: "RepWatchr contributor leaderboards",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWatchr Contributors | Reputation for Public Records",
    description: "XP, badges, county rankings, state rankings, accepted sources, and accuracy for public-record contributors.",
    images: ["/images/repwatchr-cover-america-first.png"],
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function topBy(contributors: PublicContributorProfile[], key: keyof PublicContributorProfile) {
  return [...contributors].sort((a, b) => Number(b[key] ?? 0) - Number(a[key] ?? 0))[0] ?? contributors[0];
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

export default async function ContributorsPage() {
  const { contributors, countyRankings, stateRankings, fallback } = await getPublicContributorLeaderboard();
  const badges = publicBadgeCatalog();
  const mostUseful = topBy(contributors, "useful_votes_count");
  const mostVerified = topBy(contributors, "verified_contributions_count");
  const highestAccuracy = topBy(contributors, "accuracy_score");
  const mostAcceptedSources = topBy(contributors, "accepted_sources_count");

  const spotlight = [
    { label: "Most Useful Contributor", profile: mostUseful, value: `${formatNumber(mostUseful.useful_votes_count)} useful votes` },
    { label: "Most Verified Contributor", profile: mostVerified, value: `${formatNumber(mostVerified.verified_contributions_count)} verified` },
    { label: "Highest Accuracy", profile: highestAccuracy, value: `${Math.round(highestAccuracy.accuracy_score)}% accuracy` },
    { label: "Most Accepted Sources", profile: mostAcceptedSources, value: `${formatNumber(mostAcceptedSources.accepted_sources_count)} accepted sources` },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,#06172f_0%,#0b2a55_48%,#ffffff_48%,#ffffff_100%)] shadow-2xl shadow-blue-950/15">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
            <div className="text-white">
              <p className="inline-flex rounded-full bg-red-700 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
                Reputation only
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                Contributor profiles turn useful records into public reputation.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-blue-50 sm:text-lg">
                RepWatchr rewards people who help source the record: Source Runners, Meeting Reporters, Vote Hunters, Funding Trackers,
                Researchers, Fact Checkers, Editors, and Community Builders. No paid contribution market. No bounties. Reputation only.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-red-700"
                >
                  Start Earning XP
                </Link>
                <Link
                  href="/submit-source"
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-blue-950"
                >
                  Submit Source
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {spotlight.map((item) => (
                <Link
                  key={item.label}
                  href={`/contributors/${item.profile.handle}`}
                  className="rw-click-card group rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-blue-950/10 transition hover:-translate-y-0.5 hover:border-red-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-950 text-sm font-black text-white shadow-sm">
                      {initials(item.profile)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-black uppercase tracking-wide text-red-700">{item.label}</span>
                      <span className="mt-1 block truncate text-lg font-black text-blue-950">{contributorDisplayName(item.profile)}</span>
                      <span className="mt-1 block text-xs font-bold text-slate-500">{item.value}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {fallback ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            Public contributor records are shown in preview mode until production reputation rows are live.
          </div>
        ) : null}

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contributorLevels.map((level) => (
            <div key={level} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{contributorLevelLabels[level]}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{contributorLevelDescriptions[level]}</p>
            </div>
          ))}
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Leaderboard</p>
                <h2 className="mt-1 text-3xl font-black text-blue-950">Most useful contributors</h2>
              </div>
              <Link href="/dashboard" className="text-sm font-black uppercase tracking-wide text-blue-700 hover:text-red-700">
                Build your record
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {contributors.map((profile, index) => (
                <Link
                  key={profile.id}
                  href={`/contributors/${profile.handle}`}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-950 text-sm font-black text-white">
                      #{profile.overall_rank ?? index + 1}
                    </span>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-blue-950">
                      {initials(profile)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-blue-950">{contributorDisplayName(profile)}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
                      {contributorLevelLabels[profile.primary_level]} / {profile.county ?? "County not public"} / {profile.state}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">{profile.public_bio ?? "Public-record contributor."}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[260px]">
                    <MiniStat label="XP" value={formatNumber(profile.total_xp)} />
                    <MiniStat label="Verified" value={formatNumber(profile.verified_contributions_count)} />
                    <MiniStat label="Accuracy" value={`${Math.round(profile.accuracy_score)}%`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">County rankings</p>
              <div className="mt-4 grid gap-2">
                {countyRankings.slice(0, 8).map((row) => (
                  <div key={`${row.state}-${row.county}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-blue-950">{row.county}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-red-700">
                        #{row.state_county_rank} / {row.state}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {formatNumber(row.total_xp)} XP / {row.contributor_count} contributor{row.contributor_count === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">State rankings</p>
              <div className="mt-4 grid gap-2">
                {stateRankings.slice(0, 8).map((row) => (
                  <div key={row.state} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-blue-950">{row.state}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-800">
                        #{row.national_rank}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {formatNumber(row.total_xp)} XP / {formatNumber(row.accepted_sources_count)} accepted sources
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-blue-100 bg-blue-950 p-5 text-white shadow-xl shadow-blue-950/15">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Badges</p>
              <h2 className="mt-2 text-3xl font-black">Earn reputation people can inspect.</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-blue-50">
                Badges should point to actual work: sources accepted, votes found, funding checked, meetings reported, corrections submitted, and
                public records made easier to inspect.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {badges.slice(0, 8).map((badge) => (
                <div key={badge.badge_key} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-300">{badge.icon_label}</p>
                  <p className="mt-2 text-sm font-black text-white">{badge.name}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-blue-50">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-3 md:grid-cols-4">
          {contributionKinds.map((kind) => (
            <Link
              key={kind}
              href="/dashboard"
              className="rw-click-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-red-300"
            >
              <p className="text-xs font-black uppercase tracking-wide text-red-700">Earn XP</p>
              <p className="mt-2 text-lg font-black text-blue-950">{contributionKindLabels[kind]}</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-slate-600">Submit the record for review and build public reputation.</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-2 py-2">
      <p className="text-sm font-black text-blue-950">{value}</p>
      <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
