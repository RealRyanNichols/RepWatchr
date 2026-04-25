export function getDistrictUrlSlug(districtSlug: string): string {
  return districtSlug.replaceAll("_", "-");
}

export function getCandidateUrlSlug(candidate: { candidate_id: string }): string {
  return candidate.candidate_id.replaceAll("_", "-");
}

export function getDistrictDataSlug(districtSlug: string): string {
  return districtSlug.replaceAll("-", "_");
}

export function getCandidateDataId(candidateId: string): string {
  return candidateId.replaceAll("-", "_");
}

export function getSchoolBoardDistrictUrl(district: { district_slug: string }): string {
  return `/school-boards/${getDistrictUrlSlug(district.district_slug)}`;
}

export function getSchoolBoardCandidateUrl(candidate: { candidate_id: string; district_slug: string }): string {
  return `/school-boards/${getDistrictUrlSlug(candidate.district_slug)}/${getCandidateUrlSlug(candidate)}`;
}
