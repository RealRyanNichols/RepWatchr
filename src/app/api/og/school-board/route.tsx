import { getCandidateDataId, getCandidateUrlSlug, getDistrictDataSlug, getDistrictUrlSlug } from "@/lib/school-board-urls";
import {
  getCandidateFlags,
  getCandidateGaps,
  getCandidateGoodRecords,
  getDistrictSourceLinks,
  getSchoolBoardStats,
  getSchoolBoardCandidate,
  getSchoolBoardDistrict,
} from "@/lib/school-board-research";
import { renderRepWatchrOgImage } from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const districtSlug = url.searchParams.get("district") ?? "";
  const candidateId = url.searchParams.get("candidate") ?? "";
  const district = getSchoolBoardDistrict(getDistrictDataSlug(districtSlug));
  const candidate = candidateId ? getSchoolBoardCandidate(getCandidateDataId(candidateId)) : undefined;
  const stats = getSchoolBoardStats();
  const profileName = candidate?.preferred_name ?? candidate?.full_name;
  const title = type === "member" && candidate ? profileName : district?.district ?? "School Board Watch";
  const subtitle =
    type === "member" && candidate
      ? `${candidate.seat ?? "Seat pending"}${candidate.role ? `, ${candidate.role}` : ""}`
      : "District profile, board-member records, public questions, praise, concerns, and source links.";
  const goodCount = candidate
    ? getCandidateGoodRecords(candidate).length
    : (district?.candidates.reduce((total, item) => total + getCandidateGoodRecords(item).length, 0) ?? 0);
  const flagCount = candidate
    ? getCandidateFlags(candidate).length
    : (district?.candidates.reduce((total, item) => total + getCandidateFlags(item).length, 0) ?? 0);
  const gapCount = candidate
    ? getCandidateGaps(candidate).length
    : (district?.candidates.reduce((total, item) => total + getCandidateGaps(item).length, 0) ?? 0);
  const sourceCount = candidate ? (candidate.sources?.length ?? 0) : district ? getDistrictSourceLinks(district.district_slug).length : stats.sourceCount;
  const publicPath =
    type === "member" && candidate
      ? `/school-boards/${getDistrictUrlSlug(candidate.district_slug)}/${getCandidateUrlSlug(candidate)}`
      : district
        ? `/school-boards/${getDistrictUrlSlug(district.district_slug)}`
        : "/school-boards";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType: type === "member" ? "School board profile" : "School board page",
    title: title ?? "National School Board Watch",
    subtitle,
    jurisdiction: type === "member" && candidate ? candidate.district : district?.county ? `${district.county} County` : "Texas-first school board watch",
    metricValue: candidate || district ? sourceCount : stats.candidates.toLocaleString("en-US"),
    metricLabel: candidate || district ? "public sources" : "profiles",
    path: publicPath,
    badges: [
      { label: "Good records", value: goodCount, tone: "green" },
      { label: "Voter questions", value: flagCount, tone: "red" },
      { label: "Research gaps", value: gapCount, tone: "gold" },
    ],
  });
}
