import type { PublicPowerProfile } from "@/types/power-watch";

interface PowerProfileAvatarProps {
  profile: PublicPowerProfile;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-12 w-12 text-xs",
  md: "h-16 w-16 text-sm",
  lg: "h-24 w-24 text-xl",
};

function initialsFor(name: string) {
  const words = name
    .replaceAll("&", " ")
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export default function PowerProfileAvatar({ profile, size = "md" }: PowerProfileAvatarProps) {
  const imageLabel = profile.profileImageAlt ?? `${profile.name} profile image`;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-white bg-slate-200 shadow-sm ${sizeClasses[size]}`}
    >
      {profile.profileImageUrl ? (
        <span
          aria-label={imageLabel}
          role="img"
          className="block h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${profile.profileImageUrl}")` }}
        />
      ) : (
        <span className="grid h-full w-full place-items-center font-black text-slate-700">
          {initialsFor(profile.name)}
        </span>
      )}
      {profile.watchMark ? (
        <span
          aria-label={`${profile.watchMark.label}: ${profile.watchMark.reason}`}
          className="absolute -right-0.5 -top-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-red-700 text-lg font-black leading-none text-white shadow-sm"
          title={`${profile.watchMark.label}: ${profile.watchMark.reason}`}
        >
          *
        </span>
      ) : null}
    </div>
  );
}
