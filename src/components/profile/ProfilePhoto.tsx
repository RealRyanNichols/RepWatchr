"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type ProfileMedia = {
  public_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  caption: string | null;
  credit: string | null;
};

type ProfilePhotoProps = {
  profileId: string;
  name: string;
  staticImageUrl?: string;
  staticImageCredit?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-14 w-14 text-base",
  md: "h-20 w-20 text-xl",
  lg: "h-32 w-32 text-4xl",
};

function initialsFor(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "W");
}

export default function ProfilePhoto({
  profileId,
  name,
  staticImageUrl,
  staticImageCredit,
  size = "md",
}: ProfilePhotoProps) {
  const supabase = useMemo(() => createClient(), []);
  const [approvedMedia, setApprovedMedia] = useState<ProfileMedia | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadApprovedHeadshot() {
      const { data } = await supabase
        .from("profile_media")
        .select("public_url, storage_bucket, storage_path, caption, credit")
        .eq("profile_id", profileId)
        .eq("media_type", "headshot")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mounted && data) {
        setApprovedMedia(data as ProfileMedia);
      }
    }

    loadApprovedHeadshot();

    return () => {
      mounted = false;
    };
  }, [profileId, supabase]);

  const storageUrl =
    approvedMedia?.storage_path && approvedMedia.storage_bucket
      ? supabase.storage
          .from(approvedMedia.storage_bucket)
          .getPublicUrl(approvedMedia.storage_path).data.publicUrl
      : null;
  const imageUrl = approvedMedia?.public_url ?? storageUrl ?? staticImageUrl;
  const credit = approvedMedia?.credit ?? staticImageCredit;

  return (
    <figure className="shrink-0">
      <div
        className={`${sizeClasses[size]} overflow-hidden rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,#002868,#bf0d3e)] shadow-sm`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${name} profile photo`}
            loading={size === "lg" ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-center font-black uppercase tracking-wide text-white">
            {initialsFor(name)}
          </div>
        )}
      </div>
      {credit ? (
        <figcaption className="mt-1 max-w-[9rem] text-[10px] font-bold leading-4 text-gray-500">
          {credit}
        </figcaption>
      ) : null}
    </figure>
  );
}
