import type { Metadata } from "next";
import ProfileClaimForm from "@/components/profile/ProfileClaimForm";

export const metadata: Metadata = {
  title: "Claim a Profile",
  description:
    "Request free profile access for reviewed bio, authentic media and official links. Authority checks and review of public facts remain separate.",
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
