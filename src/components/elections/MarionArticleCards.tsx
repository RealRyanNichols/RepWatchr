import Link from "next/link";
import ArticleThumbnail from "@/components/news/ArticleThumbnail";
import { marionDateLabel } from "@/lib/marion-coverage";
import type { NewsArticle } from "@/types";
import styles from "./MarionDesk.module.css";

export default function MarionArticleCards({ articles }: { articles: NewsArticle[] }) {
  return articles.length ? (
    <div className={styles.articles}>
      {articles.map((article, index) => (
        <article key={article.id} className={styles.articleCard}>
          <Link href={`/news/${article.id}`} className={styles.coverLink} aria-label={`Read ${article.title}`}>
            <ArticleThumbnail article={article} sizes="(min-width: 1000px) 390px, (min-width: 640px) 45vw, 100vw" />
          </Link>
          <div className={styles.articleCopy}>
            <div className={styles.meta}><span>{article.category || "Reporting"}</span><time dateTime={article.publishedAt}>{marionDateLabel(article.publishedAt)}</time></div>
            <h3><Link href={`/news/${article.id}`}>{article.title}</Link></h3>
            <p>{article.summary}</p>
            <Link href={`/news/${article.id}#discussion`} className={styles.textLink}>{index === 0 ? "Open the story & discussion" : "Read & discuss"} <span aria-hidden="true">↗</span></Link>
          </div>
        </article>
      ))}
    </div>
  ) : <p className={styles.empty}>Reviewed reporting will appear here after publication. You can still open the public sources and submit a correction.</p>;
}
