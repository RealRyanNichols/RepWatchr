import type { PublicPowerProfile, PublicPowerStats } from "@/types/power-watch";
import { attorneyWatchProfiles } from "@/data/attorney-watch";
import { mediaWatchProfiles } from "@/data/media-watch";
import { publicSafetyWatchProfiles } from "@/data/public-safety-watch";

function sortProfiles(profiles: PublicPowerProfile[]) {
  return [...profiles].sort((a, b) => {
    const region = a.region.localeCompare(b.region);
    if (region !== 0) return region;
    const county = (a.county ?? "").localeCompare(b.county ?? "");
    if (county !== 0) return county;
    return a.name.localeCompare(b.name);
  });
}

export function getAttorneyWatchProfiles(): PublicPowerProfile[] {
  return sortProfiles(attorneyWatchProfiles);
}

export function getAttorneyWatchProfileBySlug(slug: string): PublicPowerProfile | undefined {
  return attorneyWatchProfiles.find((profile) => profile.slug === slug);
}

export function getMediaWatchProfiles(): PublicPowerProfile[] {
  return sortProfiles(mediaWatchProfiles);
}

export function getMediaWatchProfileBySlug(slug: string): PublicPowerProfile | undefined {
  return mediaWatchProfiles.find((profile) => profile.slug === slug);
}

export function getPublicSafetyWatchProfiles(): PublicPowerProfile[] {
  return sortProfiles(publicSafetyWatchProfiles);
}

export function getPublicSafetyWatchProfileBySlug(slug: string): PublicPowerProfile | undefined {
  return publicSafetyWatchProfiles.find((profile) => profile.slug === slug);
}

export function getPowerWatchStats(profiles: PublicPowerProfile[]): PublicPowerStats {
  const peopleKinds = new Set([
    "attorney",
    "journalist",
    "editor",
    "newsroom-leadership",
    "sheriff",
    "police-chief",
    "public-safety-official",
  ]);
  const counties = new Set(profiles.map((profile) => profile.county).filter(Boolean));
  const cities = new Set(profiles.map((profile) => profile.city).filter(Boolean));

  return {
    totalProfiles: profiles.length,
    organizations: profiles.filter((profile) => !peopleKinds.has(profile.kind)).length,
    people: profiles.filter((profile) => peopleKinds.has(profile.kind)).length,
    sourceSeeded: profiles.filter((profile) => profile.profileStatus === "source_seeded").length,
    needsBuildout: profiles.filter((profile) => profile.profileStatus === "needs_profile_buildout").length,
    sourceLinks: new Set(profiles.flatMap((profile) => profile.sourceLinks.map((source) => source.url))).size,
    counties: counties.size,
    cities: cities.size,
  };
}
