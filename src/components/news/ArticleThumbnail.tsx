import Image from "next/image";
import { articleThumbnailMessage } from "@/lib/editorial-visuals";
import type { NewsArticle } from "@/types";
import styles from "./ArticleThumbnail.module.css";

type ThumbnailArticle = Pick<NewsArticle, "title" | "thumbnailMessage" | "imageUrl" | "imageAlt" | "imageFocalPoint" | "locationLabel" | "scope" | "category">;

export default function ArticleThumbnail({
  article,
  priority = false,
  featured = false,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  article: ThumbnailArticle;
  priority?: boolean;
  featured?: boolean;
  className?: string;
  sizes?: string;
}) {
  const message = articleThumbnailMessage(article);
  const location = article.locationLabel || (article.scope === "east-texas" ? "East Texas" : article.scope === "texas" ? "Texas" : "United States");
  return (
    <div className={`${styles.thumbnail} ${featured ? styles.featured : ""} ${className}`} data-editorial-thumbnail data-article-thumbnail data-thumbnail-headline={message}>
      {article.imageUrl ? <Image src={article.imageUrl} alt={article.imageAlt ?? article.title} fill sizes={sizes} quality={90} priority={priority} className={styles.image} style={{ objectPosition: article.imageFocalPoint || "center" }} /> : <div className={styles.backdrop} aria-hidden="true" />}
      <div className={styles.shade} aria-hidden="true" />
      <span className={styles.brand} aria-hidden="true">REPWATCHR</span>
      <div className={styles.copy}>
        <span className={styles.location}>{location}</span>
        <p className={styles.headline}>{message}</p>
      </div>
    </div>
  );
}
