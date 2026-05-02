import Link from "next/link";

type ClaimProfileCtaProps = {
  profileId: string;
  profileName: string;
  districtSlug?: string;
  profileType?:
    | "school_board"
    | "official"
    | "attorney"
    | "law_firm"
    | "media_company"
    | "journalist"
    | "editor"
    | "newsroom_leadership"
    | "law_enforcement_agency"
    | "sheriff"
    | "police_chief"
    | "public_safety_official"
    | "oversight_agency";
};

export default function ClaimProfileCta({
  profileId,
  profileName,
  districtSlug,
  profileType = "school_board",
}: ClaimProfileCtaProps) {
  const params = new URLSearchParams({
    profileType,
    profileId,
    profileName,
  });

  if (districtSlug) {
    params.set("districtSlug", districtSlug);
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-blue-800">
        Claimed profile tools
      </p>
      <h2 className="mt-2 text-xl font-black text-blue-950">
        Do you represent {profileName}?
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-blue-950/75">
        Claim this profile to request a reviewed public bio, statement, approved
        media, and official links. RepWatchr facts, scores, evidence, red flags,
        source links, and research gaps stay locked.
      </p>
      <Link
        href={`/profiles/claim?${params.toString()}`}
        className="mt-4 inline-flex rounded-xl bg-blue-900 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
      >
        Claim this profile
      </Link>
    </div>
  );
}
