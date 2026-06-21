import type { Metadata } from "next";
import ProfileClaimForm from "@/components/profile/ProfileClaimForm";

export const metadata: Metadata = {
  title: "Claim a Profile | RepWatchr",
  description:
    "Request verified RepWatchr profile ownership for reviewed bio, media, and official links while public facts and evidence stay locked.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ClaimProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const getValue = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return (
    <ProfileClaimForm
      initialProfileType={getValue("profileType")}
      initialProfileId={getValue("profileId")}
      initialProfileName={getValue("profileName")}
      initialDistrictSlug={getValue("districtSlug")}
    />
  );
}
