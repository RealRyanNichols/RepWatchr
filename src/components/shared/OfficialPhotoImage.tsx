import Image from "next/image";
import type { CSSProperties } from "react";
import type { Official } from "@/types";
import styles from "./OfficialPhotoImage.module.css";

export const OFFICIAL_PHOTO_QUALITY = 96;
export const FEATURED_OFFICIAL_PHOTO_QUALITY = 96;

type OfficialPhotoImageProps = {
  official: Pick<Official, "firstName" | "lastName" | "name" | "photo" | "featuredPhoto" | "photoMetadata" | "featuredPhotoMetadata">;
  sizes: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  quality?: 75 | 90 | 96 | 100;
  preload?: boolean;
  adaptivePortrait?: boolean;
  blurredBackdrop?: false;
  featuredClassName?: string;
  portraitClassName?: string;
};

export function getOfficialInitials(
  official: Pick<Official, "firstName" | "lastName" | "name">,
) {
  const initials = `${official.firstName?.[0] ?? ""}${official.lastName?.[0] ?? ""}`;
  if (initials.trim()) return initials;

  return official.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export default function OfficialPhotoImage({
  official,
  sizes,
  alt,
  className = "object-cover",
  fallbackClassName = "grid h-full w-full place-items-center text-center font-black uppercase tracking-wide text-slate-600",
  quality = OFFICIAL_PHOTO_QUALITY,
  preload = false,
  adaptivePortrait = false,
  featuredClassName,
  portraitClassName,
}: OfficialPhotoImageProps) {
  const photo = official.featuredPhoto ?? official.photo;
  const metadata = official.featuredPhoto ? official.featuredPhotoMetadata : official.photoMetadata;
  const src = photo && metadata ? `${photo}?v=${metadata.revision}` : photo;
  const bypassOptimizer = photo?.startsWith("https://www.txcourts.gov/") ?? false;
  const nativeSize = adaptivePortrait && metadata ? {
    "--portrait-width": `${metadata.width}px`,
    "--portrait-height": `${metadata.height}px`,
  } as CSSProperties : undefined;

  if (src) {
    const imageClassName = adaptivePortrait
      ? official.featuredPhoto
        ? featuredClassName ?? "object-contain object-center"
        : portraitClassName ?? "object-contain object-center"
      : featuredClassName ?? className;
    return (
      <Image
        src={src}
        alt={alt ?? `${official.name} profile photo`}
        fill
        sizes={sizes}
        quality={quality}
        preload={preload}
        unoptimized={bypassOptimizer}
        className={`${nativeSize ? styles.portrait : ""} ${imageClassName}`}
        style={nativeSize}
      />
    );
  }

  return <div className={fallbackClassName}>{getOfficialInitials(official)}</div>;
}
