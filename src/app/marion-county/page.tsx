import Link from "next/link";
import CommentSection from "@/components/comments/CommentSection";
import ForumFormatPoll from "@/components/elections/ForumFormatPoll";
import MarionArticleCards from "@/components/elections/MarionArticleCards";
import MarionCommunityEntry from "@/components/elections/MarionCommunityEntry";
import styles from "@/components/elections/MarionDesk.module.css";
import { marionElectionDates, MARION_ELECTION_PAGE } from "@/data/marion-public-records";
import { getMarionArticles, MARION_RACE_PATH, marionDateLabel } from "@/lib/marion-coverage";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const revalidate = 300;
export const metadata = buildRepWatchrMetadata({ title: "Marion County News & Public Records", description: "Marion County reporting, election records, dated updates, community questions and original sources. Read the record and join the discussion.", path: "/marion-county", imagePath: buildOgImageUrl("race", { slug: "marion-county-judge-2026" }), imageAlt: "RepWatchr Marion County record desk" });

export default async function MarionCountyPage() {
  const articles = await getMarionArticles();
  return <main>
    <section className={styles.hero} aria-labelledby="county-title">
      <p className={styles.eyebrow}>Independent reporting · Marion County, Texas</p>
      <h1 id="county-title">Your county.<br />On the record.</h1>
      <p>Articles worth reading. Sources you can open. Questions the community can discuss. Follow Marion County government and the 2026 County Judge race without turning claims into findings.</p>
      <div className={styles.actions}><a href="#reporting">Read the latest reporting</a><Link href="/marion-county/records">Check the original sources ↗</Link></div>
    </section>
    <MarionCommunityEntry />
    <section id="reporting" className={styles.section} aria-labelledby="reporting-title">
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>The county desk</p><h2 id="reporting-title">The story. Then the receipts.</h2></div><Link href={MARION_RACE_PATH} className={styles.textLink}>Compare the County Judge candidates ↗</Link></div>
      <MarionArticleCards articles={articles} />
    </section>
    <section className={styles.section} aria-labelledby="calendar-title">
      <div className={styles.sectionHead}><div><p className={styles.eyebrow}>November 2026 · County-published calendar</p><h2 id="calendar-title">Keep the dates straight.</h2></div><a href={MARION_ELECTION_PAGE} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Current county dates & locations ↗</a></div>
      <div className={styles.calendar}>{marionElectionDates.map((item) => <article key={item.date}><time dateTime={item.date}>{marionDateLabel(item.date).replace(", 2026", "")}</time><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div>
      <p className={styles.intro}>Calendar reviewed September 29, 2026. Confirm current notices, hours, precinct information, and eligibility with the county elections office.</p>
    </section>
    <section className={`${styles.section} ${styles.split}`} aria-labelledby="community-title">
      <div><p className={styles.eyebrow}>Public questions</p><h2 id="community-title">What should a forum look like?</h2><p className={styles.intro}>Read the posted correspondence before sharing an interpretation. Compare the proposed conditions, see what remains unverified, and bring your own question.</p><div className={styles.actions}><Link href={`${MARION_RACE_PATH}#coverage`}>Open the forum fact ledger</Link><Link href={`${MARION_RACE_PATH}#community-poll`}>County Judge community poll</Link></div><p className={styles.note}>Poll responses reflect participants who choose to respond. They do not represent all residents, predict the election, or enter an official’s performance grade.</p></div>
      <ForumFormatPoll />
    </section>
    <section id="discussion" className={styles.section} aria-labelledby="county-discussion-title"><p className={styles.eyebrow}>Your public square</p><h2 id="county-discussion-title">Ask a question. Bring a source.</h2><p className={styles.intro}>Anyone can read. A free account is required to post. Keep private records and identifying information about children out of the discussion.</p><CommentSection officialId="county:marion" officialName="Marion County" targetPath="/marion-county#discussion" storyMode /></section>
    <section className={styles.section}><p className={styles.note}>A missing source is a gap to resolve. If you have an original record, a complete exchange, or a correction, <Link className={styles.textLink} href="/submit-source?target=marion-county">send it to the source desk.</Link></p></section>
  </main>;
}
