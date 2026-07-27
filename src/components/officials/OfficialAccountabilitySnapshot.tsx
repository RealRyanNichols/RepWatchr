import Link from "next/link";
import { formatShortDate } from "@/lib/formatting";
import { getOfficeAccountabilityProfile } from "@/lib/official-accountability";
import type { OfficialVerifiedBriefData } from "@/data/official-verified-briefs";
import type { PerformanceGradeResult } from "@/lib/performance-grade";
import type { NewsArticle, Official, PublicVoteRecord, RedFlag } from "@/types";
import styles from "./OfficialAccountabilitySnapshot.module.css";

export type VerifiedPublicSentiment = {
  status: "published" | "held_for_sample" | "not_collected";
  approveCount: number;
  disapproveCount: number;
  mixedCount?: number;
  verifiedResponseCount: number;
  inDistrictResponseCount?: number;
  minimumSampleSize: number;
  periodLabel: string;
  asOf?: string;
  methodologyHref?: string;
};

export type OfficialAccountabilitySnapshotProps = {
  official: Pick<Official, "id" | "name" | "level" | "position">;
  performanceGrade?: PerformanceGradeResult;
  voteRecord?: PublicVoteRecord;
  sentiment?: VerifiedPublicSentiment;
  relatedNews?: readonly NewsArticle[];
  redFlags?: readonly RedFlag[];
  verifiedBrief?: Pick<OfficialVerifiedBriefData, "officialId" | "strengths" | "concerns">;
  maxCoverageItems?: number;
  className?: string;
};

type CoverageItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  sourceName: string;
  date?: string;
  kind: "Reviewed report" | "Verified flag" | "Verified brief";
  reviewNote: string;
};

const PUBLIC_RED_FLAG_STATUSES = new Set(["verified", "complete"]);

/**
 * A compact, source-led overview of the independent accountability signals on
 * an official profile. The component deliberately does not calculate a grade,
 * infer article tone, or turn missing evidence into a negative result.
 */
export default function OfficialAccountabilitySnapshot({
  official,
  performanceGrade,
  voteRecord,
  sentiment,
  relatedNews = [],
  redFlags = [],
  verifiedBrief,
  maxCoverageItems = 3,
  className,
}: OfficialAccountabilitySnapshotProps) {
  const officeAccountability = getOfficeAccountabilityProfile(official);
  const grade = describeGrade(performanceGrade, officeAccountability.supportsLegislatorGrade);
  const decisions = describeDecisions(voteRecord, officeAccountability);
  const publicSentiment = describeSentiment(sentiment);
  const coverage = collectReviewedCoverage(official.id, relatedNews, redFlags, verifiedBrief);
  const rootClassName = className ? `${styles.snapshot} ${className}` : styles.snapshot;

  return (
    <section id="snapshot" className={rootClassName} aria-labelledby={`accountability-${official.id}`}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Accountability snapshot</p>
          <h2 id={`accountability-${official.id}`} className={styles.title}>
            What the public record supports.
          </h2>
        </div>
        <p className={styles.intro}>
          Grade, evidence, decisions, sentiment, favorable coverage, and scrutiny stay separate. One headline or a
          missing source cannot silently become {official.name}&rsquo;s score.
        </p>
      </header>

      <div className={styles.scoreBand}>
        <section className={styles.gradeColumn} aria-labelledby={`grade-${official.id}`}>
          <p className={styles.sectionLabel}>Performance grade</p>
          <div className={styles.gradeLockup}>
            <p id={`grade-${official.id}`} className={styles.gradeValue}>
              {grade.value}
            </p>
            <div>
              <p className={styles.gradeState}>{grade.state}</p>
              <p className={styles.gradeScale}>{grade.scale}</p>
            </div>
          </div>
          <p className={styles.explanation}>{grade.explanation}</p>
          <Link href="/methodology" className={styles.textLink}>
            Read the grading method <span aria-hidden="true">→</span>
          </Link>
        </section>

        <section className={styles.evidenceColumn} aria-labelledby={`evidence-${official.id}`}>
          <div className={styles.sectionHeadingRow}>
            <div>
              <p className={styles.sectionLabel}>Confidence and evidence</p>
              <h3 id={`evidence-${official.id}`} className={styles.sectionTitle}>
                How complete is the research file?
              </h3>
            </div>
            <p className={styles.quietNote}>Completeness is not performance.</p>
          </div>
          <dl className={styles.evidenceLedger}>
            <EvidenceMeasure
              label="Evidence coverage"
              value={performanceGrade ? `${performanceGrade.weightedCoverage}%` : "Pending"}
              amount={performanceGrade?.weightedCoverage}
              detail="Weighted share of the grade framework supported by reviewed inputs."
            />
            <EvidenceMeasure
              label="Confidence"
              value={
                performanceGrade && performanceGrade.confidence > 0
                  ? `${performanceGrade.confidence}% · ${sentenceCase(performanceGrade.confidenceLabel)}`
                  : "Not established"
              }
              amount={performanceGrade?.confidence}
              detail="Source quality, freshness, reliability, and coverage—not certainty about the official."
            />
            <EvidenceMeasure
              label="Grade weight cleared"
              value={performanceGrade ? `${performanceGrade.scoreableWeight}%` : "Pending"}
              amount={performanceGrade?.scoreableWeight}
              detail="Only categories that pass publication gates can contribute to a score."
            />
          </dl>
        </section>
      </div>

      <div className={styles.signalBand}>
        <section className={styles.signalColumn} aria-labelledby={`decisions-${official.id}`}>
          <div className={styles.sectionHeadingRow}>
            <div>
              <p className={styles.sectionLabel}>Applicable recorded decisions</p>
              <h3 id={`decisions-${official.id}`} className={styles.sectionTitle}>
                {decisions.heading}
              </h3>
            </div>
            <p className={styles.bigNumber}>{decisions.value}</p>
          </div>
          <p className={styles.explanation}>{decisions.explanation}</p>
          {voteRecord ? (
            <dl className={styles.miniLedger}>
              <MiniFact label="Yea" value={voteRecord.summary.yea} />
              <MiniFact label="Nay" value={voteRecord.summary.nay} />
              <MiniFact label="Present" value={voteRecord.summary.present} />
              <MiniFact label="Not voting / other" value={voteRecord.summary.notVoting + voteRecord.summary.other} />
            </dl>
          ) : null}
          <p className={styles.provenance}>{decisions.provenance}</p>
        </section>

        <section className={styles.signalColumn} aria-labelledby={`sentiment-${official.id}`}>
          <div className={styles.sectionHeadingRow}>
            <div>
              <p className={styles.sectionLabel}>Verified public sentiment</p>
              <h3 id={`sentiment-${official.id}`} className={styles.sectionTitle}>
                {publicSentiment.heading}
              </h3>
            </div>
            <p className={styles.bigNumber}>{publicSentiment.value}</p>
          </div>
          <p className={styles.explanation}>{publicSentiment.explanation}</p>
          {publicSentiment.published && sentiment ? <SentimentFigure sentiment={sentiment} /> : null}
          <p className={styles.provenance}>
            {publicSentiment.provenance}
            {sentiment?.methodologyHref ? (
              <>
                {" "}
                <a href={sentiment.methodologyHref} className={styles.inlineLink}>
                  Methodology
                </a>
              </>
            ) : null}
          </p>
        </section>
      </div>

      <div className={styles.coverageHeader}>
        <div>
          <p className={styles.sectionLabel}>Reviewed reports</p>
          <h3 className={styles.coverageTitle}>Read the favorable record and the scrutiny side by side.</h3>
        </div>
        <p className={styles.coverageNote}>
          Tone appears only after person-level editorial review. A flag identifies a documented matter to inspect; it
          is not automatically a finding of wrongdoing.
        </p>
      </div>

      <div className={styles.coverageBand}>
        <CoverageColumn
          title="Critical reports and verified flags"
          tone="critical"
          items={coverage.critical.slice(0, Math.max(1, maxCoverageItems))}
          emptyText="No reviewed critical item is published in this file yet. That means the review is incomplete—not that the record is clean."
        />
        <CoverageColumn
          title="Favorable coverage"
          tone="favorable"
          items={coverage.favorable.slice(0, Math.max(1, maxCoverageItems))}
          emptyText="No reviewed favorable item is published in this file yet. Missing coverage is not evidence that the official has no accomplishments."
        />
      </div>

      <footer className={styles.footer}>
        <p>
          {coverage.neutralCount.toLocaleString()} reviewed neutral item{coverage.neutralCount === 1 ? "" : "s"} kept
          outside both lanes · {coverage.awaitingReviewCount.toLocaleString()} related item
          {coverage.awaitingReviewCount === 1 ? "" : "s"} awaiting classification or publication review.
        </p>
        <p>Missing material changes research completeness only. It never subtracts points from the official.</p>
      </footer>
    </section>
  );
}

function EvidenceMeasure({
  label,
  value,
  amount,
  detail,
}: {
  label: string;
  value: string;
  amount?: number;
  detail: string;
}) {
  const normalizedAmount = amount === undefined ? 0 : clampPercent(amount);
  return (
    <div className={styles.evidenceRow}>
      <dt>
        <span className={styles.measureLabel}>{label}</span>
        <span className={styles.measureDetail}>{detail}</span>
      </dt>
      <dd>
        <span className={styles.measureValue}>{value}</span>
        <span
          className={styles.measureTrack}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={amount === undefined ? undefined : normalizedAmount}
          aria-valuetext={amount === undefined ? "Review pending" : `${normalizedAmount}% evidence readiness`}
        >
          <span className={styles.measureFill} style={{ width: `${normalizedAmount}%` }} />
        </span>
      </dd>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value.toLocaleString()}</dd>
    </div>
  );
}

function SentimentFigure({ sentiment }: { sentiment: VerifiedPublicSentiment }) {
  const approveCount = normalizeCount(sentiment.approveCount);
  const disapproveCount = normalizeCount(sentiment.disapproveCount);
  const mixedCount = normalizeCount(sentiment.mixedCount ?? 0);
  const responseTotal = Math.max(1, approveCount + disapproveCount + mixedCount);
  const segments = [
    { label: "Approve", value: approveCount, className: styles.sentimentApprove },
    { label: "Mixed", value: mixedCount, className: styles.sentimentMixed },
    { label: "Disapprove", value: disapproveCount, className: styles.sentimentDisapprove },
  ];

  return (
    <figure className={styles.sentimentFigure}>
      <div
        className={styles.sentimentTrack}
        aria-label={`Verified sentiment: ${approveCount} approve, ${mixedCount} mixed, ${disapproveCount} disapprove`}
      >
        {segments.map((segment) => (
          <span
            key={segment.label}
            className={segment.className}
            style={{ width: `${(segment.value / responseTotal) * 100}%` }}
          />
        ))}
      </div>
      <figcaption>
        <dl className={styles.sentimentLegend}>
          {segments.map((segment) => (
            <div key={segment.label}>
              <dt>{segment.label}</dt>
              <dd>
                {segment.value.toLocaleString()} · {Math.round((segment.value / responseTotal) * 100)}%
              </dd>
            </div>
          ))}
        </dl>
      </figcaption>
    </figure>
  );
}

function CoverageColumn({
  title,
  tone,
  items,
  emptyText,
}: {
  title: string;
  tone: "critical" | "favorable";
  items: CoverageItem[];
  emptyText: string;
}) {
  return (
    <section className={`${styles.coverageColumn} ${tone === "critical" ? styles.critical : styles.favorable}`}>
      <div className={styles.coverageColumnHeader}>
        <h4>{title}</h4>
        <span>{items.length.toLocaleString()}</span>
      </div>
      {items.length > 0 ? (
        <ol className={styles.coverageList}>
          {items.map((item) => (
            <li key={item.id}>
              <div className={styles.itemMeta}>
                <span>{item.kind}</span>
                <span>{formatOptionalDate(item.date)}</span>
              </div>
              <h5>{item.title}</h5>
              <p>{item.summary}</p>
              <p className={styles.reviewNote}>{item.reviewNote}</p>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                {item.sourceName} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.emptyState}>{emptyText}</p>
      )}
    </section>
  );
}

function describeGrade(result: PerformanceGradeResult | undefined, supportsLegislatorGrade: boolean) {
  if (!supportsLegislatorGrade) {
    return {
      value: "Not rated",
      state: "Role-specific method pending",
      scale: "A legislator formula is not reused",
      explanation:
        "RepWatchr has not published a comparable scoring method for this office family. The profile can show sourced records without forcing them into the wrong grade.",
    };
  }

  if (!result || result.status === "insufficient_data") {
    return {
      value: "Not rated",
      state: "Evidence gate not cleared",
      scale: "No zero or placeholder grade is assigned",
      explanation:
        result?.reason ??
        "The research file has not been evaluated against the coverage, confidence, category, and ethics publication gates.",
    };
  }

  if (result.status === "provisional") {
    return {
      value: "Not rated",
      state: `${result.score ?? "—"} / 100 provisional score`,
      scale: "Letter grade withheld",
      explanation: result.reason,
    };
  }

  return {
    value: result.letterGrade ?? "Not rated",
    state: result.score === null ? "Score unavailable" : `${result.score} / 100`,
    scale: `${sentenceCase(result.confidenceLabel)} evidence confidence`,
    explanation: result.reason,
  };
}

function describeDecisions(
  record: PublicVoteRecord | undefined,
  officeAccountability: ReturnType<typeof getOfficeAccountabilityProfile>,
) {
  if (!record) {
    return {
      value: "Pending",
      heading: officeAccountability.pendingHeading,
      explanation: officeAccountability.pendingExplanation,
      provenance: `RepWatchr will use ${officeAccountability.decisionLabelLower}; missing material is not scored as misconduct.`,
    };
  }

  const yeaNay = record.summary.yea + record.summary.nay;
  return {
    value: yeaNay.toLocaleString(),
    heading: "Yea or nay positions in the indexed file",
    explanation: `${record.summary.totalVotesLoaded.toLocaleString()} total roll-call position${
      record.summary.totalVotesLoaded === 1 ? " is" : "s are"
    } loaded for ${record.session}. Present, not-voting, and other rows remain visible but are not recast as substantive decisions.`,
    provenance: `Official record through ${formatOptionalDate(record.lastUpdated)}. Eligibility and excused-status review remain separate.`,
  };
}

function describeSentiment(sentiment?: VerifiedPublicSentiment) {
  if (!sentiment || sentiment.status === "not_collected") {
    return {
      value: "Pending",
      heading: "No verified sentiment result is published",
      explanation:
        "No qualifying sample has been supplied. Missing community responses do not raise or lower the performance grade.",
      provenance: "Identity, geography, duplicate-account, and sample-size checks must pass before publication.",
      published: false,
    };
  }

  const responseTotal =
    normalizeCount(sentiment.approveCount) +
    normalizeCount(sentiment.disapproveCount) +
    normalizeCount(sentiment.mixedCount ?? 0);
  const verifiedResponseCount = normalizeCount(sentiment.verifiedResponseCount);
  const minimumSampleSize = Math.max(1, normalizeCount(sentiment.minimumSampleSize));
  const aggregatesReconcile = responseTotal === verifiedResponseCount;
  const clearsSample =
    sentiment.status === "published" &&
    verifiedResponseCount >= minimumSampleSize &&
    responseTotal >= minimumSampleSize &&
    aggregatesReconcile;

  if (!clearsSample) {
    const aggregateIssue = sentiment.status === "published" && !aggregatesReconcile;
    return {
      value: "Held",
      heading: aggregateIssue ? "The published totals need reconciliation" : "The sample is below the publication gate",
      explanation: aggregateIssue
        ? `${verifiedResponseCount.toLocaleString()} responses are marked verified, but ${responseTotal.toLocaleString()} are represented in the approve, mixed, and disapprove totals.`
        : `${verifiedResponseCount.toLocaleString()} verified response${
            verifiedResponseCount === 1 ? " is" : "s are"
          } available; at least ${minimumSampleSize.toLocaleString()} are required for this view.`,
      provenance: `${sentiment.periodLabel}. Results remain hidden rather than publishing an incomplete or misleading percentage.`,
      published: false,
    };
  }

  return {
    value: verifiedResponseCount.toLocaleString(),
    heading: "Verified responses in the published sample",
    explanation: `${
      sentiment.inDistrictResponseCount === undefined
        ? "Unspecified"
        : normalizeCount(sentiment.inDistrictResponseCount).toLocaleString()
    } in-district response${
      sentiment.inDistrictResponseCount !== undefined && normalizeCount(sentiment.inDistrictResponseCount) === 1 ? "" : "s"
    }; geography is shown separately from account verification.`,
    provenance: `${sentiment.periodLabel}${sentiment.asOf ? ` · through ${formatOptionalDate(sentiment.asOf)}` : ""}. Sentiment is opinion, not a grade input.`,
    published: true,
  };
}

function collectReviewedCoverage(
  officialId: string,
  articles: readonly NewsArticle[],
  redFlags: readonly RedFlag[],
  verifiedBrief?: Pick<OfficialVerifiedBriefData, "officialId" | "strengths" | "concerns">,
) {
  const favorable: CoverageItem[] = [];
  const critical: CoverageItem[] = [];
  let neutralCount = 0;
  let awaitingReviewCount = 0;

  if (verifiedBrief?.officialId === officialId) {
    for (const item of verifiedBrief.strengths) {
      const source = item.sources[0];
      if (!source?.url) continue;
      favorable.push({
        id: `brief-strength-${item.id}`,
        title: item.title,
        summary: item.summary,
        href: source.url,
        sourceName: source.publisher,
        date: source.publishedAt,
        kind: "Verified brief",
        reviewNote: item.caution ?? "Curated from the source-linked verified brief.",
      });
    }
    for (const item of verifiedBrief.concerns) {
      const source = item.sources[0];
      if (!source?.url) continue;
      critical.push({
        id: `brief-concern-${item.id}`,
        title: item.title,
        summary: item.summary,
        href: source.url,
        sourceName: source.publisher,
        date: source.publishedAt,
        kind: "Verified brief",
        reviewNote: item.caution ?? "Curated from the source-linked verified brief.",
      });
    }
  }

  for (const article of articles) {
    if (!article.officialIds.includes(officialId)) continue;
    const classification = article.officialCoverage?.[officialId];
    const sourceHref = article.sourceUrl ?? article.sourceLinks?.[0]?.url;
    const isPublishable =
      article.editorialStatus === "approved" && article.sourceStatus === "source_linked" && Boolean(sourceHref);

    if (!isPublishable || !classification) {
      awaitingReviewCount += 1;
      continue;
    }
    if (classification.tone === "neutral") {
      neutralCount += 1;
      continue;
    }

    const item: CoverageItem = {
      id: `article-${article.id}`,
      title: article.title,
      summary: article.summary,
      href: sourceHref ?? `/news/${article.id}`,
      sourceName: article.sourceName ?? "Source-linked reporting",
      date: article.publishedAt,
      kind: "Reviewed report",
      reviewNote: classification.rationale,
    };
    if (classification.tone === "positive") favorable.push(item);
    if (classification.tone === "critical") critical.push(item);
  }

  for (const flag of redFlags) {
    const publishable =
      flag.officialId === officialId &&
      PUBLIC_RED_FLAG_STATUSES.has(flag.reviewerStatus ?? "") &&
      Boolean(flag.sourceUrl) &&
      Boolean(flag.date) &&
      Boolean(flag.whyItMatters);
    if (!publishable) {
      if (flag.officialId === officialId) awaitingReviewCount += 1;
      continue;
    }
    critical.push({
      id: `flag-${flag.id}`,
      title: flag.title,
      summary: flag.description,
      href: flag.sourceUrl,
      sourceName: flag.statusLabel ?? "Verified public record",
      date: flag.date,
      kind: "Verified flag",
      reviewNote: flag.whyItMatters,
    });
  }

  return {
    favorable: dedupeCoverage(favorable),
    critical: dedupeCoverage(critical),
    neutralCount,
    awaitingReviewCount,
  };
}

function dedupeCoverage(items: CoverageItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.href || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatOptionalDate(value?: string) {
  if (!value) return "Date not loaded";
  return formatShortDate(value.slice(0, 10));
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function sentenceCase(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : value;
}
