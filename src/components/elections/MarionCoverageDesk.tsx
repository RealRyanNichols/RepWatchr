import Link from "next/link";
import { getMarionArticles, marionDateLabel } from "@/lib/marion-coverage";
import { marionForumFacts, marionForumUpdates } from "@/data/marion-forum-record";
import ForumFormatPoll from "./ForumFormatPoll";
import MarionArticleCards from "./MarionArticleCards";
import styles from "./MarionDesk.module.css";

export default async function MarionCoverageDesk() {
  const articles = await getMarionArticles(6);
  return (
    <section id="coverage" aria-labelledby="marion-coverage-heading" className={`${styles.desk} ${styles.coverage}`}>
      <header>
        <p className={styles.eyebrow}>Marion County record desk</p>
        <h2 id="marion-coverage-heading">Articles. Updates. Facts you can check.</h2>
        <p className={styles.intro}>Open the reporting. Read the original record. Bring your questions. Every claim carries its source and its limits.</p>
        <div className={styles.actions}>
          <Link href="/marion-county">Open the county desk ↗</Link>
          <Link href="/marion-county/records">Browse the source room</Link>
          <a href="#discussion">Comment or ask a question</a>
        </div>
      </header>
      <div id="coverage-articles" className={styles.section}>
        <div className={styles.sectionHead}><div><p className={styles.eyebrow}>Reporting & explainers</p><h2>Read beyond the headline.</h2></div><Link href="/marion-county#reporting" className={styles.textLink}>All county reporting ↗</Link></div>
        <MarionArticleCards articles={articles} />
      </div>
      <div className={`${styles.section} ${styles.split}`}>
        <div className={styles.factPanel}>
          <p className={styles.eyebrow}>Forum correspondence</p><h2>The fact ledger.</h2>
          <p className={styles.intro}>Public material reviewed September 29, 2026. The posted copies describe the exchange; they do not authenticate the originals.</p>
          <div className={styles.facts}>
            {marionForumFacts.map((fact) => <article key={fact.label} className={styles.fact}>
              <p className={styles.eyebrow}>{fact.label}</p><h3>{fact.statement}</h3><p>{fact.limit}</p>
              <a href={fact.source.url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Open source: {fact.source.title} ↗</a>
            </article>)}
          </div>
        </div>
        <aside className={styles.factPanel}>
          <p className={styles.eyebrow}>Follow the record</p><h2>Dated updates.</h2>
          <ol className={styles.updates}>{marionForumUpdates.map((update) => <li key={`${update.date}-${update.title}`}>
            <time dateTime={update.date}>{marionDateLabel(update.date)}</time><h3>{update.title}</h3><p>{update.text}</p>
            <a href={update.source.url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Read the posted record ↗</a>
          </li>)}</ol>
          <p className={styles.note}>Have an original, a publisher response, or a correction? <Link href="/submit-source?target=marion-county-candidate-forum-2026" className={styles.textLink}>Send it to the source desk.</Link> Keep private messages and information identifying children out of public comments.</p>
        </aside>
      </div>
      <ForumFormatPoll />
    </section>
  );
}
