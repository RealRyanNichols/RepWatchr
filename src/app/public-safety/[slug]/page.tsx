import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PowerProfileAvatar from "@/components/power-watch/PowerProfileAvatar";
import PublicRoleSafetyModule from "@/components/public-safety/PublicRoleSafetyModule";
import PublicSafetyProfileAnalytics from "@/components/public-safety/PublicSafetyProfileAnalytics";
import ClaimProfileCta from "@/components/profile/ClaimProfileCta";
import ProfileScorecardVote from "@/components/scorecards/ProfileScorecardVote";
import ShareButtons from "@/components/shared/ShareButtons";
import { getPublicSafetyWatchProfileBySlug, getPublicSafetyWatchProfiles } from "@/lib/power-watch";
import { getPublicRoleGroup } from "@/lib/public-role-safety";
import { getProfileScorecardTargetType } from "@/lib/universal-scorecards";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";
import { breadcrumbJsonLd, jsonLd, profilePageJsonLd } from "@/lib/structured-data";
import type { PublicPowerKind } from "@/types/power-watch";

interface PublicSafetyProfilePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getPublicSafetyWatchProfiles().map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: PublicSafetyProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getPublicSafetyWatchProfileBySlug(slug);

  if (!profile) {
    return { title: "Public Safety Profile Not Found | RepWatchr" };
  }

  return buildRepWatchrMetadata({
    title: `${profile.name} | Public Safety Watch | RepWatchr`,
    description: `${profile.name} public-safety profile: ${profile.summary}`,
    path: `/public-safety/${profile.slug}`,
    imagePath: buildOgImageUrl("home"),
    imageAlt: `${profile.name} RepWatchr public safety preview`,
    type: "profile",
  });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function claimTypeForKind(kind: PublicPowerKind) {
  if (kind === "law-enforcement-agency") return "law_enforcement_agency";
  if (kind === "sheriff") return "sheriff";
  if (kind === "constable") return "constable";
  if (kind === "police-chief") return "police_chief";
  if (kind === "public-safety-official") return "public_safety_official";
  if (kind === "agency-official") return "agency_official";
  if (kind === "judge") return "judge";
  if (kind === "prosecutor") return "prosecutor";
  if (kind === "district-attorney") return "district_attorney";
  if (kind === "court-official") return "court_official";
  return "oversight_agency";
}

export default async function PublicSafetyProfilePage({ params }: PublicSafetyProfilePageProps) {
  const { slug } = await params;
  const profile = getPublicSafetyWatchProfileBySlug(slug);

  if (!profile) notFound();
  const publicRoleGroup = getPublicRoleGroup(profile);
  const profileStructuredData = profilePageJsonLd({
    name: profile.name,
    path: `/public-safety/${profile.slug}`,
    description: `${profile.name} public-safety profile: ${profile.summary}`,
    jobTitle: profile.categoryLabel,
    jurisdiction: [profile.city, profile.state].filter(Boolean).join(", "),
  });
  const breadcrumbStructuredData = breadcrumbJsonLd([
    { name: "RepWatchr", path: "/" },
    { name: "Public Safety Watch", path: "/public-safety" },
    { name: profile.name, path: `/public-safety/${profile.slug}` },
  ]);

  return (
    <div className="rw-page-shell">
      <PublicSafetyProfileAnalytics
        profileSlug={profile.slug}
        profileName={profile.name}
        group={publicRoleGroup}
        sourceCount={profile.sourceLinks.length}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(profileStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbStructuredData) }}
      />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/public-safety" className="text-sm font-black text-blue-800 hover:text-red-700">
          &larr; Public safety watch
        </Link>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
          <div className="h-1.5 w-full bg-[linear-gradient(90deg,#b42318_0%,#b42318_43%,#d6b35a_43%,#d6b35a_52%,#ffffff_52%,#ffffff_60%,#1d4ed8_60%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <PowerProfileAvatar profile={profile} size="lg" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
                    {profile.categoryLabel}
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">{profile.name}</h1>
                  <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700 sm:text-base">
                    {profile.summary}
                  </p>
                  {profile.profileImageSource ? (
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Profile image source: {profile.profileImageSource}
                    </p>
                  ) : null}
                </div>
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
          <ShareButtons
            title={`${profile.name} | Public Safety Watch | RepWatchr`}
            description={profile.summary}
            path={`/public-safety/${profile.slug}`}
            template="public_question"
            subject={`${profile.name} public-safety accountability profile`}
            sourceLabel={profile.sourceLinks[0]?.title || "public safety source links"}
          />
        </section>

        <PublicRoleSafetyModule profile={profile} />

        <section className="mt-6">
          <ClaimProfileCta
            profileId={profile.slug}
            profileName={profile.name}
            profileType={claimTypeForKind(profile.kind)}
          />
        </section>

        <section className="mt-6">
          <ProfileScorecardVote
            targetType={getProfileScorecardTargetType(profile.kind)}
            targetId={profile.slug}
            targetName={profile.name}
            targetPath={`/public-safety/${profile.slug}`}
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
                    href={`/public-safety/${person.slug}`}
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
