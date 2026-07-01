import Link from "next/link";
import type { OfficialWithScores } from "@/types";
import { formatLevelName } from "@/lib/formatting";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import PartyBadge from "@/components/officials/PartyBadge";
import ScoreGauge from "@/components/scores/ScoreGauge";
import ProfileActionDock from "@/components/officials/ProfileActionDock";
import ProfileCompletenessRing from "@/components/officials/ProfileCompletenessRing";

type OfficialHeroProps = {
  official: OfficialWithScores;
  sourceCount: number;
  completionPercent: number;
  confidenceLabel: string;
  lastUpdatedLabel: string;
  partyColor: string;
};

export default function OfficialHero({
  official,
  sourceCount,
  completionPercent,
  confidenceLabel,
  lastUpdatedLabel,
  partyColor,
}: OfficialHeroProps) {
  const contactEmail = official.contactInfo.email;
  const contactIsUrl = contactEmail?.startsWith("http://") || contactEmail?.startsWith("https://");
  const scoreCard = official.scoreCard;
  const profilePath = `/officials/${official.id}`;

  return (
    <section
      className="relative isolate overflow-hidden border-b-4 bg-slate-950 text-white"
      style={{ borderBottomColor: partyColor }}
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_22%,rgba(37,99,235,0.34),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(191,13,62,0.30),transparent_27%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-7 pb-24 sm:px-6 sm:py-10 md:pb-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/[0.075] p-4 shadow-2xl shadow-black/25 backdrop-blur sm:p-5">
            <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]">
              <figure className="min-w-0">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/15 bg-slate-800 shadow-2xl shadow-black/35">
                  <OfficialPhotoImage
                    official={official}
                    sizes="(min-width: 768px) 208px, 44vw"
                    quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                    preload
                    className="object-cover"
                    fallbackClassName="grid h-full w-full place-items-center text-center text-5xl font-black uppercase tracking-wide text-slate-400"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/86 to-transparent p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-100">
                      Public official profile
                    </p>
                  </div>
                </div>
                {official.photoCredit ? (
                  <figcaption className="mt-2 text-[11px] font-semibold leading-5 text-slate-300">
                    {official.photoCredit}
                  </figcaption>
                ) : null}
              </figure>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PartyBadge party={official.party} />
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-50">
                    {confidenceLabel}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-200">
                    {official.reviewStatus?.replace(/_/g, " ") ?? "source seeded"}
                  </span>
                </div>

                <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
                  {official.name}
                </h1>
                <p className="mt-3 text-xl font-semibold text-blue-100 sm:text-2xl">
                  {official.position}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-slate-200">
                  {official.district ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                      District: {official.district}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    {official.jurisdiction}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    {formatLevelName(official.level)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1">
                    {official.state ?? "public office"}
                  </span>
                </div>

                {official.bio ? (
                  <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-200">
                    {official.bio}
                  </p>
                ) : (
                  <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-200">
                    RepWatchr has the identity and office record loaded. A fuller public-record summary still needs more source review before it should be treated as complete.
                  </p>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-3xl font-black text-white">{sourceCount}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wide text-blue-100">
                      Source links
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-3xl font-black text-white">{lastUpdatedLabel}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wide text-blue-100">
                      Last updated
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-3xl font-black text-white">{scoreCard ? scoreCard.letterGrade : "N/A"}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wide text-blue-100">
                      Score status
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
                  {official.contactInfo.website ? (
                    <a
                      href={official.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-white transition hover:bg-white/18"
                    >
                      Official website
                    </a>
                  ) : null}
                  {contactEmail ? (
                    <a
                      href={contactIsUrl ? contactEmail : `mailto:${contactEmail}`}
                      target={contactIsUrl ? "_blank" : undefined}
                      rel={contactIsUrl ? "noopener noreferrer" : undefined}
                      className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-white transition hover:bg-white/18"
                    >
                      {contactIsUrl ? "Contact form" : "Email office"}
                    </a>
                  ) : null}
                  {official.contactInfo.phone ? (
                    <span className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-white">
                      {official.contactInfo.phone}
                    </span>
                  ) : null}
                  <Link
                    href="/methodology"
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-white transition hover:bg-white/18"
                  >
                    Methodology
                  </Link>
                </div>

                <ProfileActionDock
                  officialId={official.id}
                  officialName={official.name}
                  office={official.position}
                  jurisdiction={official.jurisdiction}
                  profilePath={profilePath}
                  sourceCount={sourceCount}
                />
              </div>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.075] p-5 shadow-2xl shadow-black/25 backdrop-blur">
              <ProfileCompletenessRing
                percent={completionPercent}
                confidenceLabel={confidenceLabel}
              />
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-200">
                Completeness is a profile-build signal, not a claim that every public record has been found. Missing records stay visible instead of being hidden.
              </p>
            </div>
            {scoreCard ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.075] p-5 shadow-2xl shadow-black/25 backdrop-blur">
                <ScoreGauge
                  score={scoreCard.overall}
                  letterGrade={scoreCard.letterGrade}
                  size="lg"
                />
                <p className="mt-3 text-center text-xs font-black uppercase tracking-wide text-blue-100">
                  Overall score
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.075] p-5 shadow-2xl shadow-black/25 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                  Score pending
                </p>
                <p className="mt-2 text-2xl font-black text-white">Needs reviewed vote data</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                  RepWatchr will not invent a score when the supporting votes, funding, or issue rules are not loaded.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
