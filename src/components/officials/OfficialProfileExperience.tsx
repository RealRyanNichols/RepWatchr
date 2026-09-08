import Link from "next/link";
import type { CSSProperties } from "react";
import OfficialPhotoImage, { FEATURED_OFFICIAL_PHOTO_QUALITY } from "@/components/shared/OfficialPhotoImage";
import ProfileActionDock from "@/components/officials/ProfileActionDock";
import { getOfficeAccountabilityProfile } from "@/lib/official-accountability";
import type { PerformanceGradeResult } from "@/lib/performance-grade";
import type { Official, PublicVoteRecord } from "@/types";
import styles from "./OfficialProfileExperience.module.css";
import { harletonRoster } from "@/data/coverage/harleton-roster";

type OfficialProfileHeroProps = {
  official: Official;
  sourceCount: number;
  buildoutPercent: number;
  buildoutComplete: boolean;
  voteRecord?: PublicVoteRecord;
  performanceGrade?: PerformanceGradeResult;
  heroSummary?: string;
};

export function OfficialProfileHero({
  official,
  sourceCount,
  buildoutPercent,
  buildoutComplete,
  voteRecord,
  performanceGrade,
  heroSummary,
}: OfficialProfileHeroProps) {
  const reviewedAt = official.lastVerifiedAt ?? voteRecord?.lastUpdated;
  const officeAccountability = getOfficeAccountabilityProfile(official);
  const gradeValue =
    performanceGrade?.status === "published" && performanceGrade.score !== null
      ? `${performanceGrade.score} / ${performanceGrade.letterGrade}`
      : performanceGrade?.status === "provisional" && performanceGrade.score !== null
        ? `${performanceGrade.score} / provisional`
        : "Not rated";
  const gradeDetail = officeAccountability.supportsLegislatorGrade
    ? performanceGrade
      ? `${performanceGrade.scoreableWeight}% of grade weight cleared`
      : "Evidence gate not reviewed"
    : "Role-specific method pending";
  const watchHref = `/dashboard?watch=${encodeURIComponent(`/officials/${official.id}`)}&target=${encodeURIComponent(official.name)}`;
  const voteTotal = voteRecord?.summary.totalVotesLoaded ?? 0;
  const recordedPositionCount = voteRecord
    ? voteRecord.summary.yea + voteRecord.summary.nay + voteRecord.summary.present
    : 0;
  const recordedPositionRate = voteTotal > 0 ? `${((recordedPositionCount / voteTotal) * 100).toFixed(1)}%` : null;
  const portraitMetadata = official.featuredPhoto ? official.featuredPhotoMetadata : official.photoMetadata;
  const portraitStyle = portraitMetadata
    ? {
        "--profile-photo-width": `${portraitMetadata.width}px`,
        "--profile-photo-ratio": `${portraitMetadata.width} / ${portraitMetadata.height}`,
      } as CSSProperties
    : undefined;

  return (
    <section className={styles.hero}>
      <div className={styles.heroShell}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <div className={styles.breadcrumbItems}>
            <Link href="/officials">
              Officials
            </Link>
            <span aria-hidden="true">
              /
            </span>
            <span>{official.name}</span>
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.heroIntro}>
            <div className={styles.datelineRow}>
              <p className={styles.dateline}>
                {official.position}
                {official.district ? ` · ${official.district}` : ""} · {formatPartyName(official.party)}
              </p>
              <p className={styles.datelineMeta}>
                {sourceCount.toLocaleString()} public receipt{sourceCount === 1 ? "" : "s"}
                {reviewedAt ? ` · reviewed ${formatShortDate(reviewedAt)}` : ""}
              </p>
            </div>

            <p className={styles.sectionMark}>
              <span aria-hidden="true" /> Public record
            </p>

            <h1 className={styles.heroName}>
              {official.name}
            </h1>
            <p className={styles.jurisdiction}>
              {official.jurisdiction}
            </p>
            {official.id === "kevin-evers-harleton-isd" ? (
              <aside className="mt-4 rounded-md border border-amber-200/40 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                <strong>Earlier office record · roster checked {harletonRoster.observedAt}.</strong>{" "}
                The district now lists Chance Ebarb in Place 4, appointed July 2026. Kevin Evers is absent from that roster. His exact departure date is unconfirmed; earlier records remain available below.{" "}
                <a href={harletonRoster.sourceUrl} className="font-bold underline underline-offset-4">Open district source ↗</a>
              </aside>
            ) : null}
            <p className={styles.heroSummary}>
              {heroSummary ??
                `A source-linked view of ${official.name}'s public record, applicable decisions, coverage, and open research gaps. Missing evidence stays labeled as missing—not turned into a conclusion.`}
            </p>
          </div>

          <div className={styles.heroLower}>
            <div className={styles.actionDock}>
              <ProfileActionDock
                officialName={official.name}
                path={`/officials/${official.id}`}
                watchHref={watchHref}
              />
              <p className="mt-3 text-xs leading-6 text-slate-300">
                Represent this profile?{" "}
                <Link
                  href={{ pathname: "/profiles/claim", query: { profileType: official.level === "school-board" ? "school_board" : "official", profileId: official.id, profileName: official.name } }}
                  className="font-bold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Claim this profile
                </Link>
                {" · Free, subject to review"}
              </p>
            </div>

            <div className={styles.recordLedger}>
              <div className={styles.gradeBlock}>
                <p className={styles.recordLabel}>Overall grade</p>
                <p className={styles.gradeValue}>{gradeValue}</p>
                <p className={styles.gradeDetail}>{gradeDetail}</p>
              </div>
              <dl className={styles.statRail}>
                <HeroMetric
                  label={officeAccountability.decisionLabel}
                  value={voteRecord ? voteTotal.toLocaleString() : officeAccountability.supportsLegislatorGrade ? "Pending" : "Role-specific"}
                  detail={voteRecord ? `Through ${formatShortDate(voteRecord.lastUpdated)}` : officeAccountability.pendingHeading}
                />
                <HeroMetric
                  label={voteRecord ? "Recorded positions" : "Profile depth"}
                  value={recordedPositionRate ?? `${buildoutPercent}%`}
                  detail={voteRecord ? `${recordedPositionCount.toLocaleString()} yea, nay, or present` : buildoutComplete ? "Core fields loaded" : "Buildout continues"}
                />
                <HeroMetric
                  label="Public receipts"
                  value={sourceCount.toLocaleString()}
                  detail="Unique linked sources"
                />
              </dl>
            </div>
          </div>

          <div
            className={`${styles.portraitStage} ${portraitMetadata ? styles.portraitNative : ""}`}
            style={portraitStyle}
          >
            <figure className={styles.portraitFigure}>
              <div className={styles.portraitFrame}>
                <OfficialPhotoImage
                  official={official}
                  sizes="(min-width: 1440px) 432px, (min-width: 1024px) 30vw, (min-width: 416px) 384px, calc(100vw - 32px)"
                  quality={FEATURED_OFFICIAL_PHOTO_QUALITY}
                  preload
                  adaptivePortrait
                  blurredBackdrop={false}
                  featuredClassName={styles.portraitImage}
                  portraitClassName={styles.portraitImageAdaptive}
                  fallbackClassName="grid h-full w-full place-items-center text-7xl font-black text-white/55"
                />
              </div>
              <figcaption className={styles.portraitCaption}>
                <span className={styles.photoCredit}>
                  {official.featuredPhotoCredit ?? official.photoCredit ?? "Official portrait"}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className={styles.railStat}>
      <dt className={styles.recordLabel}>{label}</dt>
      <dd className={styles.railValue}>{value}</dd>
      <dd className={styles.railDetail}>{detail}</dd>
    </div>
  );
}

function formatPartyName(party: Official["party"]) {
  switch (party) {
    case "R":
      return "Republican";
    case "D":
      return "Democrat";
    case "I":
      return "Independent";
    case "VR":
      return "Votes Republican";
    case "VD":
      return "Votes Democrat";
    default:
      return "Non-partisan";
  }
}

function formatShortDate(value?: string) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
