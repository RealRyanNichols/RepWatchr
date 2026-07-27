import type {
  OfficialVerifiedBriefData,
  VerifiedBriefSource,
  VerifiedBriefStoryCard,
} from "@/data/official-verified-briefs";
import type { Official } from "@/types";
import styles from "./OfficialStoryProfile.module.css";

type OfficialStoryProfileProps = {
  official: Official;
  brief: OfficialVerifiedBriefData;
  sourceCount: number;
};

const evidenceLabels: Record<VerifiedBriefSource["kind"], string> = {
  official_record: "Official record",
  reported: "Independent reporting",
  external_data: "External data",
  interview_statement: "Official statement",
};

export default function OfficialStoryProfile({
  official,
  brief,
  sourceCount,
}: OfficialStoryProfileProps) {
  return (
    <main className={styles.story}>
      <section id="verified-brief" className={styles.opening}>
        <div className={styles.shell}>
          <div className={styles.recordColumn}>
            <ChapterHeading
              number="01"
              eyebrow={brief.eyebrow}
              title="Start with the answer. Then test it against the record."
              description={brief.storyLead}
            />

            <blockquote className={styles.shortAnswer}>
              <p>The short answer</p>
              <strong>{brief.bottomLine}</strong>
            </blockquote>

            <dl className={styles.factRail}>
              {brief.facts.slice(0, 4).map((fact) => (
                <div key={fact.id}>
                  <dt>{fact.metric}</dt>
                  <dd>{fact.label}</dd>
                  <dd>{fact.detail}</dd>
                  <dd>
                    <a href={fact.source.url} target="_blank" rel="noopener noreferrer">
                      {fact.source.publisher} ↗
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="documented-record" className={styles.documentedRecord}>
        <div className={styles.shell}>
          <div className={styles.recordColumn}>
            <div className={styles.recordIntro}>
              <p>Documented record</p>
              <h2>What he delivered—and where the record gets complicated.</h2>
              <span>
                Favorable and critical material use the same source rule. The detail is visible without making the
                reader open a stack of accordions.
              </span>
            </div>

            <RecordLedgerSection
              title="What he delivered"
              subtitle="Documented measures and district-facing outcomes"
              items={brief.strengths.slice(0, 3)}
              tone="strength"
            />
            <RecordLedgerSection
              title="Questions and criticism"
              subtitle="Verified changes, named criticism, and what the evidence does not prove"
              items={brief.concerns.slice(0, 2)}
              tone="concern"
            />

            <p className={styles.reviewNote}>
              Reviewed through {brief.reviewedThrough} · {sourceCount.toLocaleString()} unique public receipts are
              associated with the complete profile file. {brief.evidenceNote}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.mediaSection} aria-labelledby={`media-${official.id}`}>
        <div className={styles.shell}>
          <div className={styles.mediaGrid}>
            <div>
              <p className={styles.mediaKicker}>In his own words</p>
              <h2 id={`media-${official.id}`}>{brief.media.title}</h2>
              <p>{brief.media.description}</p>
              <a href={brief.media.originalUrl} target="_blank" rel="noopener noreferrer">
                Open the original source ↗
              </a>
            </div>
            <div className={styles.videoFrame}>
              <iframe
                src={brief.media.embedUrl}
                title={brief.media.title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ChapterHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className={styles.chapterHeading}>
      <p className={styles.chapterNumber} aria-hidden="true">
        {number}
      </p>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
        <p className={styles.chapterDeck}>{description}</p>
      </div>
    </header>
  );
}

function RecordLedgerSection({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: readonly VerifiedBriefStoryCard[];
  tone: "strength" | "concern";
}) {
  return (
    <section className={`${styles.recordGroup} ${tone === "strength" ? styles.strength : styles.concern}`}>
      <header className={styles.recordGroupHeader}>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      <ol>
        {items.map((item, index) => {
          const marker = buildLedgerMarker(item, index, tone);
          return (
            <li key={item.id} className={styles.recordRow}>
              <div className={styles.recordMarker}>
                <span>{marker.eyebrow}</span>
                <strong>{marker.value}</strong>
              </div>
              <article>
                <h4>{item.title}</h4>
                <p className={styles.recordSummary}>{item.summary}</p>
                <p className={styles.recordDetail}>{item.detail}</p>
                {item.response ? (
                  <p className={styles.contextNote}>
                    <strong>Response or context:</strong> {item.response}
                  </p>
                ) : null}
                {item.caution ? (
                  <p className={styles.cautionNote}>
                    <strong>What this does not prove:</strong> {item.caution}
                  </p>
                ) : null}
                <EvidenceLinks sources={item.sources} />
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EvidenceLinks({ sources }: { sources: readonly VerifiedBriefSource[] }) {
  return (
    <ol className={styles.evidenceLinks} aria-label="Evidence sources">
      {sources.map((source) => (
        <li key={source.url}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.publisher} · {evidenceLabels[source.kind]} ↗
          </a>
        </li>
      ))}
    </ol>
  );
}

function buildLedgerMarker(
  item: VerifiedBriefStoryCard,
  index: number,
  tone: "strength" | "concern",
) {
  const money = item.title.match(/\$[\d,.]+\s*(?:million|billion|M|B)?/i)?.[0];
  const years = item.sources
    .map((source) => source.publishedAt?.slice(0, 4))
    .filter((year): year is string => Boolean(year));
  const uniqueYears = [...new Set(years)];

  if (money) return { eyebrow: "Documented amount", value: money.replace(/ million/i, "M").replace(/ billion/i, "B") };
  if (uniqueYears.length > 1) return { eyebrow: "Record changed", value: `${uniqueYears[0]} → ${uniqueYears.at(-1)}` };
  return {
    eyebrow: tone === "strength" ? "Documented result" : "Review point",
    value: String(index + 1).padStart(2, "0"),
  };
}
