import Image from "next/image";
import { articleThumbnailMessage } from "@/lib/editorial-visuals";
import type { NewsArticle } from "@/types";
import GeneratedCover from "./GeneratedCover";
import styles from "./ArticleThumbnail.module.css";

type ThumbnailArticle = Pick<NewsArticle, "id" | "title" | "thumbnailMessage" | "imageUrl" | "imageAlt" | "imageFocalPoint" | "locationLabel" | "scope" | "category" | "visualTheme">;

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
  const hasPhoto = Boolean(article.imageUrl);
  return (
    <div
      className={`${styles.thumbnail} ${featured ? styles.featured : ""} ${hasPhoto ? "" : styles.generated} ${className}`}
      data-editorial-thumbnail
      data-article-thumbnail
      data-thumbnail-visual={hasPhoto ? "photo" : "generated"}
      data-thumbnail-headline={message}
    >
      {hasPhoto && article.imageUrl ? (
        <Image src={article.imageUrl} alt={article.imageAlt ?? article.title} fill sizes={sizes} quality={90} priority={priority} className={styles.image} style={{ objectPosition: article.imageFocalPoint || "center" }} />
      ) : (
        <GeneratedCover coverKey={article.id || article.title} scope={article.scope} visualTheme={article.visualTheme} className={styles.backdrop} />
      )}
      <div className={styles.shade} aria-hidden="true" />
      <span className={styles.brand} aria-hidden="true">REPWATCHR</span>
      <div className={styles.copy}>
        <span className={styles.location}>{location}</span>
        <p className={styles.headline}>{message}</p>
      </div>
    </div>
  );
}
