"use client";

import { useState } from "react";
import Image from "next/image";
import type { Official } from "@/types";

export const OFFICIAL_PHOTO_QUALITY = 96;
export const FEATURED_OFFICIAL_PHOTO_QUALITY = 100;

type OfficialPhotoImageProps = {
  official: Pick<Official, "firstName" | "lastName" | "name" | "photo">;
  sizes: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  quality?: 75 | 90 | 96 | 100;
  preload?: boolean;
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
}: OfficialPhotoImageProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (official.photo && !imageFailed) {
    return (
      <Image
        src={official.photo}
        alt={alt ?? `${official.name} profile photo`}
        fill
        sizes={sizes}
        quality={quality}
        preload={preload}
        className={className}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <div className={fallbackClassName}>{getOfficialInitials(official)}</div>;
}
