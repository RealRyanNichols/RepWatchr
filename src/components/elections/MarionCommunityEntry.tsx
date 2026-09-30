"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./MarionDesk.module.css";

const returnPath = "/marion-county#discussion";
const authQuery = `?next=${encodeURIComponent(returnPath)}`;

export default function MarionCommunityEntry() {
  const { user } = useAuth();

  return (
    <section className={styles.communityEntry} aria-labelledby="community-entry-title">
      <div>
        <p className={styles.eyebrow}>The Marion County conversation</p>
        <h2 id="community-entry-title">Your questions belong here.</h2>
        <p>Ask about the record. Share a public source. Add your perspective. Reading and commenting are free.</p>
      </div>
      <div className={styles.communityActions}>
        {user ? <Link href={returnPath}>Join the discussion ↓</Link> : <>
          <Link href={`/auth/signup${authQuery}`}>Create a free account</Link>
          <Link href={`/auth/login${authQuery}`}>Already a member? Sign in</Link>
        </>}
        <Link href={returnPath} className={styles.communityRead}>Read the conversation ↓</Link>
      </div>
    </section>
  );
}
