"use client";
import Link from "next/link";
import { useState } from "react";
import type { MarionPublicRecord } from "@/data/marion-public-records";
import { marionDateLabel } from "@/lib/marion-date";
import styles from "./MarionDesk.module.css";

const kinds = ["All", "Official", "Correspondence", "Commentary"] as const;
export default function MarionRecordRoom({ records }: { records: MarionPublicRecord[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<(typeof kinds)[number]>("All");
  const visible = records.filter((record) => (kind === "All" || kind === record.kind) && `${record.title} ${record.supports} ${record.limit}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className={styles.filters}><label htmlFor="record-search">Find a record<input id="record-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ballot, moderator, declaration…" /></label><div role="group" aria-label="Filter by source type">{kinds.map((item) => <button key={item} type="button" aria-pressed={kind === item} onClick={() => setKind(item)}>{item}</button>)}</div></div>
    <p className={styles.intro} aria-live="polite">{visible.length} record{visible.length === 1 ? "" : "s"} shown. A source label describes the record; it does not establish every claim about it.</p>
    <div className={styles.recordList}>{visible.map((record) => <article key={record.id} className={styles.record}>
      <span className={`${styles.badge} ${record.status === "Attributed" ? styles.attributed : record.status === "Unverified" ? styles.unverified : ""}`}>{record.status}</span><span className={styles.eyebrow}>{record.kind}</span>
      <h2>{record.title}</h2><p>{record.supports}</p><details><summary>What this record does not establish</summary><p>{record.limit}</p></details>
      <div className={styles.meta}><time dateTime={record.reviewedAt}>Reviewed {marionDateLabel(record.reviewedAt)}</time><Link href={`/submit-source?target=${encodeURIComponent(`marion:${record.id}`)}`} className={styles.textLink}>Submit a correction</Link></div>
      <p><a href={record.url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Open original source ↗</a></p>
    </article>)}</div>
    {visible.length === 0 && <div className={styles.empty}><p>No record matches these filters.</p><button type="button" className={styles.textLink} onClick={() => { setQuery(""); setKind("All"); }}>Clear filters</button></div>}
  </>;
}
