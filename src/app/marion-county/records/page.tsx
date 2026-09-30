import Link from "next/link";
import MarionRecordRoom from "@/components/elections/MarionRecordRoom";
import styles from "@/components/elections/MarionDesk.module.css";
import { marionOfficialRecords, type MarionPublicRecord } from "@/data/marion-public-records";
import { marionForumFacts } from "@/data/marion-forum-record";
import { buildOgImageUrl, buildRepWatchrMetadata } from "@/lib/repwatchr-seo";

export const metadata = buildRepWatchrMetadata({ title: "Marion County Source Room & Verification Gaps", description: "Open Marion County election records and posted forum correspondence. See what each source supports, what remains unverified, and how to send a correction.", path: "/marion-county/records", imagePath: buildOgImageUrl("methodology"), imageAlt: "RepWatchr public source room" });
const forumRecords: MarionPublicRecord[] = marionForumFacts.map((fact, index) => ({ id: `forum-${index}`, title: fact.source.title, url: fact.source.url, reviewedAt: "2026-09-29", supports: fact.statement, limit: fact.limit, kind: index === 3 ? "Commentary" : "Correspondence", status: index === 3 ? "Unverified" : "Attributed" }));

export default function MarionCountyRecordsPage() {
  return <main>
    <section className={styles.hero}><p className={styles.eyebrow}>The original record comes first</p><h1>The source room.</h1><p>Read what each record supports. See what it leaves unresolved. Official documents, attributed correspondence, and commentary have different jobs.</p><div className={styles.actions}><Link href="/marion-county">Back to county reporting</Link><Link href="/submit-source?target=marion-county">Submit a source or correction ↗</Link></div></section>
    <section className={styles.section} aria-label="Searchable public record ledger"><MarionRecordRoom records={[...marionOfficialRecords, ...forumRecords]} /></section>
    <section className={styles.section}><p className={styles.note}>Still missing: the accepted write-in declaration or qualified roster, the original forum invitation and complete correspondence, independent authentication of the posted response, and verified authorship of the Exposed commentary. A record not acquired is not proof that it does not exist.</p></section>
  </main>;
}
