import type {
  OfficialVerifiedBriefData,
  VerifiedBriefEvidenceKind,
} from "@/data/official-verified-briefs";
import styles from "./OfficialVerifiedBrief.module.css";

type OfficialVerifiedBriefProps = {
  brief: OfficialVerifiedBriefData;
};

const evidenceLabels: Record<VerifiedBriefEvidenceKind, string> = {
  official_record: "Official record",
  reported: "Reported",
  external_data: "External data",
  interview_statement: "Interview statement",
};

export function OfficialVerifiedBrief({ brief }: OfficialVerifiedBriefProps) {
  const headingId = `${brief.officialId}-verified-brief-heading`;

  return (
    <section id="verified-brief" className={`${styles.section} scroll-mt-24`} aria-labelledby={headingId}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{brief.eyebrow}</p>
            <h2 id={headingId} className={styles.title}>
              {brief.title}
            </h2>
          </div>
          <p className={styles.reviewDate}>Reviewed through {brief.reviewedThrough}</p>
          <p className={styles.summary}>{brief.summary}</p>
        </header>

        <div className={styles.factGrid}>
          {brief.facts.map((fact) => (
            <article key={fact.id} className={styles.factCard}>
              <p className={styles.evidenceLabel}>{evidenceLabels[fact.source.kind]}</p>
              <p className={styles.metric}>{fact.metric}</p>
              <h3 className={styles.factTitle}>{fact.label}</h3>
              <p className={styles.factDetail}>{fact.detail}</p>
              <a
                className={styles.sourceLink}
                href={fact.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {fact.source.publisher}: {fact.source.title}
                <span aria-hidden="true"> ↗</span>
              </a>
            </article>
          ))}
        </div>

        <div className={styles.featureGrid}>
          <article className={styles.timelinePanel}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.panelKicker}>Committee and service timeline</p>
                <h3>What happened, when, and who says so.</h3>
              </div>
              <span className={styles.recordCount}>{brief.timeline.length} source-linked moments</span>
            </div>

            <ol className={styles.timeline}>
              {brief.timeline.map((item) => (
                <li key={item.id} className={styles.timelineItem}>
                  <div className={styles.timelineDate}>{item.dateLabel}</div>
                  <div className={styles.timelineBody}>
                    <p className={styles.evidenceLabel}>{evidenceLabels[item.source.kind]}</p>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                    <a href={item.source.url} target="_blank" rel="noopener noreferrer">
                      Inspect {item.source.publisher} source
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <figure className={styles.mediaPanel}>
            <div className={styles.mediaHeader}>
              <p className={styles.evidenceLabel}>{evidenceLabels[brief.media.source.kind]}</p>
              <h3>{brief.media.title}</h3>
              <p>{brief.media.description}</p>
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
            <figcaption className={styles.mediaCaption}>
              <span>{brief.media.source.publisher}</span>
              <a href={brief.media.originalUrl} target="_blank" rel="noopener noreferrer">
                Watch at the original source
                <span aria-hidden="true"> ↗</span>
              </a>
            </figcaption>
          </figure>
        </div>

        <aside className={styles.evidenceNote} aria-label="How this brief labels evidence">
          <p className={styles.noteTitle}>How to read the labels</p>
          <p>{brief.evidenceNote}</p>
          <div className={styles.legend} aria-label="Evidence label legend">
            <span>Official record</span>
            <span>Reported</span>
            <span>Interview statement</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
