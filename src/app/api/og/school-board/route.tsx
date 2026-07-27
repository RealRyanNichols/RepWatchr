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
import { getLocalMeetings, getMeetingBySlug, getMeetingsForJurisdiction } from "@/lib/local-meetings";
import {
  REPWATCHR_EDITORIAL_OG_BACKGROUND,
  renderRepWatchrOgImage,
} from "@/lib/repwatchr-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const districtSlug = url.searchParams.get("district") ?? "";
  const candidateId = url.searchParams.get("candidate") ?? "";
  const stateSlug = url.searchParams.get("state") ?? "";
  const meetingSlug = url.searchParams.get("meeting") ?? "";
  const jurisdictionSlug = url.searchParams.get("jurisdiction") ?? "";
  const district = getSchoolBoardDistrict(getDistrictDataSlug(districtSlug));
  const candidate = candidateId ? getSchoolBoardCandidate(getCandidateDataId(candidateId)) : undefined;
  const meeting = type === "meeting" && meetingSlug ? getMeetingBySlug(meetingSlug) : undefined;
  const jurisdiction = type === "jurisdiction-meetings" && jurisdictionSlug
    ? getMeetingsForJurisdiction(jurisdictionSlug)
    : undefined;
  const stats = getSchoolBoardStats();
  const profileName = candidate?.preferred_name ?? candidate?.full_name;
  const title =
    type === "member" && candidate
      ? `${profileName}: school board record`
      : meeting
        ? meeting.title
        : jurisdiction?.body
          ? `${jurisdiction.body.name}: meeting record`
          : stateSlug
            ? `${stateSlug.replaceAll("-", " ")} school boards`
            : district
              ? `${district.district}: board record`
              : type === "meetings"
                ? "Open the public meeting record."
                : "School boards, on the record.";
  const supportLine =
    type === "member" && candidate
      ? `${candidate.seat ?? "Seat pending"}${candidate.role ? `, ${candidate.role}` : ""}. Sources, good records, public questions, and visible research gaps.`
      : meeting
        ? `${meeting.publicBodyName}: agenda, minutes, video, items, votes, and source gaps.`
        : jurisdiction?.body
          ? "Members, agendas, minutes, videos, public questions, and visible source gaps."
          : stateSlug
            ? "Find district and trustee profiles, meeting sources, public questions, and missing records."
            : type === "meetings"
              ? "Track agendas, minutes, videos, votes, public questions, and missing sources."
              : "District profiles, board-member records, public questions, praise, concerns, and source links.";
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
      : meeting
        ? `/meetings/${meeting.slug}`
        : jurisdictionSlug
          ? `/jurisdictions/${jurisdictionSlug}/meetings`
          : type === "meetings"
            ? "/meetings"
            : stateSlug
              ? `/school-boards/${stateSlug}`
      : district
        ? `/school-boards/${getDistrictUrlSlug(district.district_slug)}`
        : "/school-boards";
  const metricValue = meeting
    ? meeting.sourceCount
    : jurisdiction
      ? jurisdiction.meetings.reduce((sum, item) => sum + item.sourceCount, 0)
      : candidate || district
        ? sourceCount
        : type === "meetings"
          ? getLocalMeetings().length
          : stats.candidates.toLocaleString("en-US");
  const metricLabel = meeting || jurisdiction
    ? "public sources"
    : type === "meetings"
      ? "meetings loaded"
      : candidate || district
        ? "public sources"
        : "profiles";

  return renderRepWatchrOgImage({
    requestUrl: request.url,
    pageType:
      type === "member"
        ? "School board profile"
        : meeting || jurisdiction || type === "meetings"
          ? "Public meeting file"
          : "School board watch",
    headline: title ?? "National School Board Watch",
    supportLine,
    backgroundImage: REPWATCHR_EDITORIAL_OG_BACKGROUND,
    backgroundPosition: "center 45%",
    visualCredit: "Original RepWatchr editorial artwork",
    jurisdiction:
      type === "member" && candidate
        ? candidate.district
        : meeting
          ? meeting.publicBodyName
          : jurisdiction?.body?.name
            ? jurisdiction.body.name
            : district?.county
              ? `${district.county} County`
              : "Texas-first school board watch",
    metricValue,
    metricLabel,
    path: publicPath,
    badges: [
      { label: "Good records", value: goodCount, tone: "green" },
      { label: "Voter questions", value: flagCount, tone: "red" },
      { label: "Research gaps", value: gapCount, tone: "gold" },
    ],
  });
}
