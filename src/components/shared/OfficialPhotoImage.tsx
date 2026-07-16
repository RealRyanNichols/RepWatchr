import Image from "next/image";
import type { Official } from "@/types";

export const OFFICIAL_PHOTO_QUALITY = 96;
export const FEATURED_OFFICIAL_PHOTO_QUALITY = 100;

type OfficialPhotoImageProps = {
  official: Pick<Official, "firstName" | "lastName" | "name" | "photo" | "featuredPhoto">;
  sizes: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  quality?: 75 | 90 | 96 | 100;
  preload?: boolean;
  adaptivePortrait?: boolean;
  blurredBackdrop?: boolean;
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
  blurredBackdrop = true,
  featuredClassName,
  portraitClassName,
}: OfficialPhotoImageProps) {
  const photo = official.featuredPhoto ?? official.photo;

  if (photo) {
    if (adaptivePortrait && !official.featuredPhoto) {
      if (!blurredBackdrop) {
        return (
          <Image
            src={photo}
            alt={alt ?? `${official.name} profile photo`}
            fill
            sizes={sizes}
            quality={quality}
            preload={preload}
            className={portraitClassName ?? "object-contain object-center"}
          />
        );
      }

      return (
        <>
          <Image
            src={photo}
            alt=""
            aria-hidden="true"
            fill
            sizes={sizes}
            quality={quality}
            className="scale-110 object-cover object-center opacity-55 blur-2xl saturate-75"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-slate-950/20" />
          <Image
            src={photo}
            alt={alt ?? `${official.name} profile photo`}
            fill
            sizes={sizes}
            quality={quality}
            preload={preload}
            className={portraitClassName ?? "object-contain object-center"}
          />
        </>
      );
    }

    return (
      <Image
        src={photo}
        alt={alt ?? `${official.name} profile photo`}
        fill
        sizes={sizes}
        quality={quality}
        preload={preload}
        className={featuredClassName ?? className}
      />
    );
  }

  return <div className={fallbackClassName}>{getOfficialInitials(official)}</div>;
}
