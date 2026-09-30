import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/components/elections/MarionDesk.module.css";

export default function MarionCountyLayout({ children }: { children: ReactNode }) {
  return <div className={styles.desk}><div className={styles.wrap}>
    <header className={styles.masthead}>
      <Link href="/marion-county">Marion County / RepWatchr</Link>
      <nav className={styles.nav} aria-label="Marion County desk">
        <Link href="/marion-county#reporting">Reporting</Link>
        <Link href="/marion-county/records">Source room</Link>
        <Link href="/elections/texas/marion-county-judge-2026">County Judge race</Link>
        <Link href="/marion-county#discussion">Discuss</Link>
        <Link href="/auth/signup?next=%2Fmarion-county%23discussion">Join free</Link>
      </nav>
    </header>{children}
  </div></div>;
}
