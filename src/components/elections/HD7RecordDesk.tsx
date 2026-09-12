import Link from "next/link";
import {
  HD7_RACE_SLUG,
  HD7_RECORDS_REVIEWED_AT,
  HD7_RECORD_SUBJECTS,
  HD7_REPORTED_PRIMARY,
} from "@/data/hd7-records";
import styles from "./HD7RecordDesk.module.css";

export default function HD7RecordDesk() {
  return (
    <div className={styles.desk} data-hd7-record-desk>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Gregg · Harrison · Marion</p>
        <h1>HD7: follow the public record.</h1>
        <p className={styles.intro}>
          Jay Dean&apos;s House record. Melissa Beckett&apos;s campaign positions.
          Leward LaFleur&apos;s county decisions. Open the documents, see what they
          establish, and ask for what is missing.
        </p>
        <p className={styles.reviewed}>
          Records checked <time dateTime={HD7_RECORDS_REVIEWED_AT}>September 12, 2026</time>
        </p>
        <nav className={styles.subjectNav} aria-label="Jump to a public record">
          {HD7_RECORD_SUBJECTS.map((person) => (
            <a key={person.id} href={`#record-${person.id}`}>{person.name}</a>
          ))}
        </nav>
      </header>

      <div className={styles.roleNote}>
        <strong>Different offices. Different records.</strong>{" "}
        Dean represents HD7 in the Texas House. Beckett challenged him in its Republican primary.
        LaFleur holds a county office within the district and is not listed here as an HD7 candidate.{" "}
        <Link href="/elections/texas/marion-county-judge-2026">Open the Marion County Judge race →</Link>
      </div>

      <section className={styles.records} aria-label="Public records by person">
        {HD7_RECORD_SUBJECTS.map((person) => (
          <article key={person.id} id={`record-${person.id}`} className={styles.person}>
            <header className={styles.personHeader}>
              <p className={styles.role}>{person.role}</p>
              <h2>{person.name}</h2>
              <p className={styles.context}>{person.context}</p>
              <Link href={person.profileHref} className={styles.profileLink}>
                Open {person.name}&apos;s profile →
              </Link>
            </header>
            <div className={styles.recordList}>
              {person.records.map((record) => (
                <div key={record.title} className={styles.record}>
                  <p className={styles.sourceType}>{record.sourceType} <span>· {record.dateLabel}</span></p>
                  <h3>{record.title}</h3>
                  <p>{record.detail}</p>
                  <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                    {record.sourceLabel} ↗
                  </a>
                </div>
              ))}
            </div>
            <div className={styles.questions}>
              <h3>Questions the records should answer</h3>
              <ul>
                {person.questions.map((question) => <li key={question}>{question}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.electionNote} aria-labelledby="hd7-election-status">
        <p className={styles.role}>Reported result · Secondary source</p>
        <h2 id="hd7-election-status">The primary is over. The record stays open.</h2>
        <p>{HD7_REPORTED_PRIMARY.detail}</p>
        <a href={HD7_REPORTED_PRIMARY.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
          {HD7_REPORTED_PRIMARY.sourceLabel} ↗
        </a>
      </section>

      <section className={styles.contribute} aria-labelledby="hd7-next-record">
        <div>
          <p className={styles.role}>Help complete the record</p>
          <h2 id="hd7-next-record">Have the document that answers a question?</h2>
          <p>Send the public filing, recorded vote, adopted budget or source link. Missing records are gaps to resolve, not evidence of misconduct.</p>
        </div>
        <Link href={`/elections/texas/contribute?race=${HD7_RACE_SLUG}`} className={styles.submit} data-race-submit-source="Submit HD7 record">
          Submit a public record
        </Link>
      </section>
    </div>
  );
}
