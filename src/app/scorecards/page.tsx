import type { Metadata } from "next";
import Link from "next/link";
import { getAllOfficials, getAllScoreCards, getIssueCategories } from "@/lib/data";
import { getAttorneyWatchProfiles, getMediaWatchProfiles } from "@/lib/power-watch";
import { getProfileScorecardTargetType } from "@/lib/universal-scorecards";
import LetterGradeBadge from "@/components/scores/LetterGradeBadge";
import PartyBadge from "@/components/officials/PartyBadge";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import { calculateLetterGrade, getScoreDescription } from "@/lib/scoring";
import type { Official, ScoreCard } from "@/types";
import type { PublicPowerProfile } from "@/types/power-watch";

export const metadata: Metadata = {
  title: "Universal Scorecards | RepWatchr",
  description:
    "Scorecards for every RepWatchr public profile: officials, school-board members, attorneys, law firms, media companies, journalists, and editors.",
};

type ScoredOfficial = {
  official: Official;
  scoreCard: ScoreCard;
};

function isScoredOfficial(item: ScoredOfficial | null): item is ScoredOfficial {
  return Boolean(item);
}

function publicPowerPath(profile: PublicPowerProfile) {
  return profile.kind === "media-company" || profile.kind === "journalist" || profile.kind === "editor" || profile.kind === "newsroom-leadership"
    ? `/media/${profile.slug}`
    : `/attorneys/${profile.slug}`;
}

export default function ScorecardsPage() {
  const officials = getAllOfficials();
  const scoreCards = getAllScoreCards();
  const issueCategories = getIssueCategories();
  const attorneyProfiles = getAttorneyWatchProfiles();
  const mediaProfiles = getMediaWatchProfiles();
  const powerProfiles = [...attorneyProfiles, ...mediaProfiles];

  const scoredOfficials = officials
    .map((official) => {
      const sc = scoreCards.find((s) => s.officialId === official.id);
      return sc ? { official, scoreCard: sc } : null;
    })
    .filter(isScoredOfficial)
    .sort((a, b) => b.scoreCard.overall - a.scoreCard.overall);

  const starterTargets = powerProfiles
    .filter((profile) => profile.kind !== "bar-source")
    .sort((a, b) => b.buildoutPercent - a.buildoutPercent || a.name.localeCompare(b.name))
    .slice(0, 12);

  const totalPublicProfiles = officials.length + powerProfiles.length;

  return (
    <div className="bg-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_48%,#ffffff_48%,#ffffff_52%,#1d4ed8_52%,#1d4ed8_100%)]" />
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Universal scorecards</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Scorecards are for everyone on RepWatchr.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                Elected officials, school-board members, attorneys, law firms, media companies, journalists, editors,
                and future public-power profiles all use the same verified scorecard vote rule: one verified profile,
                one vote per target.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Public profiles</p>
                <p className="mt-1 text-3xl font-black text-blue-950">{totalPublicProfiles.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Vote files</p>
                <p className="mt-1 text-3xl font-black text-blue-950">{scoreCards.length}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">New rule</p>
                <p className="mt-1 text-2xl font-black text-red-700">1x</p>
                <p className="text-xs font-bold text-slate-500">per verified profile</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Algorithm</p>
                <p className="mt-1 text-2xl font-black text-red-700">Live</p>
                <p className="text-xs font-bold text-slate-500">weighted community view</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Who can be scored</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Any public RepWatchr profile can receive a verified scorecard vote once the profile is live.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Who can vote</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Signed-in users with a verified RepWatchr profile can cast one A-F scorecard vote per target.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">What is not loaded yet</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Source-backed vote-record scorecards still exist only where vote files are loaded. Community scorecard
              votes are the universal layer.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Issue files</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Source-backed official vote scorecards</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                These are the existing scored vote files. They remain separate from the verified community scorecard vote.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {issueCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/scorecards/${cat.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition-all hover:border-blue-300 hover:shadow-sm"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </Link>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Profile</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Position</th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500">Vote-record score</th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Verified scorecard vote</th>
                    {issueCategories.map((cat) => (
                      <th key={cat.id} className="hidden px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500 lg:table-cell">
                        <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name.split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {scoredOfficials.map(({ official, scoreCard }, index) => {
                    const categoryKeys = Object.keys(scoreCard.categories) as Array<keyof typeof scoreCard.categories>;
                    return (
                      <tr key={official.id} className="align-top hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm font-bold text-slate-500">#{index + 1}</td>
                        <td className="px-4 py-4">
                          <Link href={`/officials/${official.id}`} className="text-sm font-black text-blue-700 hover:underline">
                            {official.name}
                          </Link>
                          <div className="mt-1">
                            <PartyBadge party={official.party} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {official.position}
                          {official.district ? <span className="text-slate-400"> ({official.district})</span> : null}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <LetterGradeBadge grade={calculateLetterGrade(scoreCard.overall)} score={scoreCard.overall} />
                          <div className="mt-1 text-xs font-semibold text-slate-500">
                            {scoreCard.overall} - {getScoreDescription(scoreCard.overall)}
                          </div>
                        </td>
                        <td className="min-w-[260px] px-4 py-4">
                          <ProfileScorecardVote
                            targetType="official"
                            targetId={official.id}
                            targetName={official.name}
                            targetPath={`/officials/${official.id}`}
                            compact
                          />
                        </td>
                        {categoryKeys.map((key) => (
                          <td key={key} className="hidden px-4 py-4 text-center lg:table-cell">
                            <LetterGradeBadge
                              grade={calculateLetterGrade(scoreCard.categories[key].score)}
                              score={scoreCard.categories[key].score}
                              size="sm"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">New universal targets</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Attorneys, firms, media, journalists, and editors</h2>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              These profiles may not have source-backed vote records, but verified users can score them as public-power profiles.
              The scorecard vote becomes part of the universal algorithm.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {starterTargets.map((profile) => {
              const path = publicPowerPath(profile);
              return (
                <div key={`${profile.kind}-${profile.slug}`} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-red-700">{profile.categoryLabel}</p>
                      <Link href={path} className="mt-1 block text-lg font-black text-slate-950 hover:text-blue-800">
                        {profile.name}
                      </Link>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{profile.summary}</p>
                    </div>
                    <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                      <p className="text-xs font-black uppercase text-slate-500">Buildout</p>
                      <p className="text-xl font-black text-blue-950">{profile.buildoutPercent}%</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProfileScorecardVote
                      targetType={getProfileScorecardTargetType(profile.kind)}
                      targetId={profile.slug}
                      targetName={profile.name}
                      targetPath={path}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link href="/methodology" className="text-sm font-bold text-slate-500 hover:text-blue-700">
            How are these scores calculated? View methodology &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
