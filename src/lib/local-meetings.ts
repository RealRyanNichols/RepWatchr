import {
  getDistrictSourceLinks,
  getSchoolBoardDistrict,
  getSchoolBoardDistricts,
  type DistrictResearch,
  type SchoolBoardFeedItem,
  type SourceLink,
} from "@/lib/school-board-research";
import { getDistrictDataSlug, getDistrictUrlSlug, getSchoolBoardDistrictUrl } from "@/lib/school-board-urls";

export type PublicBodyType =
  | "school_board"
  | "city_council"
  | "county_commissioners"
  | "board"
  | "commission"
  | "committee"
  | "special_district"
  | "court"
  | "agency_board"
  | "other";

export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "canceled"
  | "minutes_pending"
  | "minutes_available"
  | "video_available"
  | "needs_sources";

export type SourceGapType =
  | "missing_agenda"
  | "missing_minutes"
  | "missing_video"
  | "missing_vote_record"
  | "missing_member_source"
  | "missing_policy"
  | "missing_campaign_finance"
  | "missing_election_filing";

export type PublicBodyMember = {
  id: string;
  publicBodySlug: string;
  entityId?: string;
  memberName: string;
  roleTitle?: string;
  districtOrPlace?: string;
  term?: string;
  sourceUrl?: string;
  status: "active" | "needs_review" | "former" | "vacant";
  profileUrl?: string;
};

export type LocalSourceGap = {
  id: string;
  type: SourceGapType;
  label: string;
  detail: string;
  priority: "high" | "medium" | "low";
  submitUrl: string;
  packetUrl: string;
  watchUrl: string;
};

export type PublicBody = {
  id: string;
  name: string;
  slug: string;
  bodyType: PublicBodyType;
  jurisdiction: string;
  state?: string;
  county?: string;
  city?: string;
  officialUrl?: string;
  meetingsUrl?: string;
  sourceCount: number;
  status: "active" | "needs_review" | "archived";
  completenessScore: number;
  profileUrl: string;
  watchUrl: string;
  sourceGaps: LocalSourceGap[];
  members: PublicBodyMember[];
};

export type MeetingVote = {
  id: string;
  voterName?: string;
  votePosition?: string;
  sourceUrl?: string;
  confidence: "source_backed" | "needs_review" | "missing_source";
};

export type MeetingItem = {
  id: string;
  itemNumber?: string;
  title: string;
  description?: string;
  actionType?: string;
  voteResult?: string;
  sourceUrl?: string;
  status: "source_backed" | "needs_review" | "missing_source";
  votes: MeetingVote[];
};

export type LocalMeeting = {
  id: string;
  publicBodySlug: string;
  publicBodyName: string;
  bodyType: PublicBodyType;
  title: string;
  slug: string;
  meetingDate?: string;
  location?: string;
  agendaUrl?: string;
  minutesUrl?: string;
  videoUrl?: string;
  transcriptUrl?: string;
  status: MeetingStatus;
  sourceCount: number;
  sourceTrail: SourceLink[];
  items: MeetingItem[];
  sourceGaps: LocalSourceGap[];
};

const sourceText = (source: SourceLink) => `${source.title ?? ""} ${source.source_type ?? ""} ${source.url}`.toLowerCase();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bodySlugForDistrict(district: DistrictResearch) {
  return `${getDistrictUrlSlug(district.district_slug)}-school-board`;
}

function sourceCountForDistrict(district: DistrictResearch, sourceLinks: SourceLink[]) {
  const candidateSources = district.candidates.flatMap((candidate) => candidate.sources?.map((source) => source.url).filter(Boolean) ?? []);
  return new Set([...sourceLinks.map((source) => source.url), ...candidateSources]).size;
}

function statusForMember(memberName: string): PublicBodyMember["status"] {
  return /vacant/i.test(memberName) ? "vacant" : "active";
}

function memberProfileUrl(district: DistrictResearch, memberName: string) {
  const candidate = district.candidates.find((item) => item.full_name === memberName || item.preferred_name === memberName);
  if (!candidate) return undefined;
  return `/school-boards/${getDistrictUrlSlug(candidate.district_slug)}/${candidate.candidate_id.replaceAll("_", "-")}`;
}

function buildMembers(district: DistrictResearch, bodySlug: string): PublicBodyMember[] {
  const sourceLinks = getDistrictSourceLinks(district.district_slug);
  const primarySource = sourceLinks[0]?.url;
  const roster = district.officialRoster?.length ? district.officialRoster : district.candidates;
  return roster.map((member, index) => {
    const fullName = member.full_name;
    const candidate = district.candidates.find((item) => item.full_name === fullName || item.preferred_name === fullName);
    return {
      id: `${bodySlug}-member-${slugify(fullName || `member-${index + 1}`)}`,
      publicBodySlug: bodySlug,
      entityId: candidate?.candidate_id,
      memberName: fullName || `Member ${index + 1}`,
      roleTitle: "role" in member ? member.role : candidate?.role,
      districtOrPlace: "seat" in member ? member.seat : candidate?.seat,
      term: "term" in member ? member.term : undefined,
      sourceUrl: candidate?.sources?.[0]?.url ?? primarySource,
      status: statusForMember(fullName || ""),
      profileUrl: memberProfileUrl(district, fullName || ""),
    };
  });
}

function sourceGapUrl(slug: string, gapType: SourceGapType) {
  return `/submit-source?target=${encodeURIComponent(slug)}&type=${encodeURIComponent(gapType)}`;
}

function buildSourceGaps({
  slug,
  sourceLinks,
  members,
  meeting,
}: {
  slug: string;
  sourceLinks: SourceLink[];
  members: PublicBodyMember[];
  meeting?: LocalMeeting;
}): LocalSourceGap[] {
  const text = sourceLinks.map(sourceText).join(" ");
  const hasAgenda = Boolean(meeting?.agendaUrl) || /\bagenda|boardbook|packet\b/.test(text);
  const hasMinutes = Boolean(meeting?.minutesUrl) || /\bminutes\b/.test(text);
  const hasVideo = Boolean(meeting?.videoUrl) || /\bvideo|recording|youtube|livestream\b/.test(text);
  const hasVoteRecord = Boolean(meeting?.items.some((item) => item.voteResult || item.votes.length)) || /\bvote|approved|motion\b/.test(text);
  const hasMemberSource = members.some((member) => Boolean(member.sourceUrl));
  const gaps: Array<Omit<LocalSourceGap, "submitUrl" | "packetUrl" | "watchUrl">> = [];

  if (!hasAgenda) {
    gaps.push({
      id: `${slug}-missing-agenda`,
      type: "missing_agenda",
      label: "Missing agenda",
      detail: "RepWatchr needs the official agenda or board packet link for this body or meeting.",
      priority: "high",
    });
  }
  if (!hasMinutes) {
    gaps.push({
      id: `${slug}-missing-minutes`,
      type: "missing_minutes",
      label: "Missing minutes",
      detail: "Approved minutes are needed before claims about board action should be treated as complete.",
      priority: "high",
    });
  }
  if (!hasVideo) {
    gaps.push({
      id: `${slug}-missing-video`,
      type: "missing_video",
      label: "Missing video",
      detail: "Meeting video or audio helps verify public comments, discussion, and vote context.",
      priority: "medium",
    });
  }
  if (!hasVoteRecord) {
    gaps.push({
      id: `${slug}-missing-vote-record`,
      type: "missing_vote_record",
      label: "Missing vote record",
      detail: "RepWatchr needs item-level vote records before assigning score impact to members.",
      priority: "high",
    });
  }
  if (!hasMemberSource) {
    gaps.push({
      id: `${slug}-missing-member-source`,
      type: "missing_member_source",
      label: "Missing member source",
      detail: "Current member names, roles, places, and terms need an official roster source.",
      priority: "high",
    });
  }

  return gaps.map((gap) => ({
    ...gap,
    submitUrl: sourceGapUrl(slug, gap.type),
    packetUrl: `/free-packet?target=${encodeURIComponent(slug)}&type=${gap.type}`,
    watchUrl: `/dashboard?watch=${encodeURIComponent(slug)}`,
  }));
}

function meetingStatus(source: SourceLink | SchoolBoardFeedItem): MeetingStatus {
  const text = "type" in source ? `${source.title} ${source.source_title ?? ""}`.toLowerCase() : sourceText(source);
  if (/video|recording|youtube|livestream/.test(text)) return "video_available";
  if (/minutes/.test(text)) return "minutes_available";
  if ("event_date" in source && source.event_date) return "completed";
  return "needs_sources";
}

function buildMeetingFromFeed(district: DistrictResearch, body: PublicBody, item: SchoolBoardFeedItem): LocalMeeting {
  const sourceTrail = item.source_url ? [{ url: item.source_url, title: item.source_title ?? item.title, source_type: item.type, accessed_date: item.event_date }] : [];
  const title = `${district.district}: ${item.title}`;
  const slug = `${getDistrictUrlSlug(district.district_slug)}-${slugify(item.id || item.title)}`;
  const status = meetingStatus(item);
  const meetingItem: MeetingItem = {
    id: `${slug}-item-1`,
    title: item.title,
    description: item.summary,
    actionType: item.type.replaceAll("_", " "),
    sourceUrl: item.source_url,
    status: item.source_url ? "source_backed" : "needs_review",
    votes: [],
  };
  const draft: LocalMeeting = {
    id: slug,
    publicBodySlug: body.slug,
    publicBodyName: body.name,
    bodyType: body.bodyType,
    title,
    slug,
    meetingDate: item.event_date,
    agendaUrl: undefined,
    minutesUrl: /minutes/i.test(item.source_title ?? item.title) ? item.source_url : undefined,
    videoUrl: /video|recording|youtube/i.test(item.source_title ?? item.title) ? item.source_url : undefined,
    status,
    sourceCount: sourceTrail.length,
    sourceTrail,
    items: [meetingItem],
    sourceGaps: [],
  };
  draft.sourceGaps = buildSourceGaps({ slug: draft.slug, sourceLinks: sourceTrail, members: body.members, meeting: draft });
  return draft;
}

function buildMeetingFromSource(district: DistrictResearch, body: PublicBody, source: SourceLink, index: number): LocalMeeting {
  const lower = sourceText(source);
  const title = `${district.district}: ${source.title ?? "Meeting records source"}`;
  const slug = `${getDistrictUrlSlug(district.district_slug)}-source-${index + 1}-${slugify(source.title ?? "meeting-source")}`;
  const draft: LocalMeeting = {
    id: slug,
    publicBodySlug: body.slug,
    publicBodyName: body.name,
    bodyType: body.bodyType,
    title,
    slug,
    meetingDate: undefined,
    agendaUrl: /\bagenda|boardbook|packet\b/.test(lower) ? source.url : undefined,
    minutesUrl: /\bminutes\b/.test(lower) ? source.url : undefined,
    videoUrl: /\bvideo|recording|youtube\b/.test(lower) ? source.url : undefined,
    status: meetingStatus(source),
    sourceCount: 1,
    sourceTrail: [source],
    items: [],
    sourceGaps: [],
  };
  draft.sourceGaps = buildSourceGaps({ slug: draft.slug, sourceLinks: [source], members: body.members, meeting: draft });
  return draft;
}

function bodyCompleteness(sourceCount: number, memberCount: number, gaps: number, meetingCount: number) {
  const score = Math.round(
    Math.min(100, sourceCount * 10) +
      Math.min(30, memberCount * 4) +
      Math.min(20, meetingCount * 5) -
      Math.min(40, gaps * 8),
  );
  return Math.max(0, Math.min(100, score));
}

export function getPublicBodyForDistrict(districtSlug: string): PublicBody | undefined {
  const district = getSchoolBoardDistrict(getDistrictDataSlug(districtSlug));
  if (!district) return undefined;
  const sourceLinks = getDistrictSourceLinks(district.district_slug);
  const slug = bodySlugForDistrict(district);
  const members = buildMembers(district, slug);
  const gaps = buildSourceGaps({ slug, sourceLinks, members });
  const meetingSource = sourceLinks.find((source) => /\bmeeting|agenda|minutes|boardbook|video\b/i.test(sourceText(source)));
  return {
    id: slug,
    name: `${district.district} Board of Trustees`,
    slug,
    bodyType: "school_board",
    jurisdiction: district.district,
    state: "TX",
    county: district.county,
    officialUrl: sourceLinks[0]?.url,
    meetingsUrl: meetingSource?.url,
    sourceCount: sourceCountForDistrict(district, sourceLinks),
    status: "active",
    completenessScore: bodyCompleteness(sourceCountForDistrict(district, sourceLinks), members.length, gaps.length, district.feed?.length ?? 0),
    profileUrl: getSchoolBoardDistrictUrl(district),
    watchUrl: `/dashboard?watch=${encodeURIComponent(slug)}`,
    sourceGaps: gaps,
    members,
  };
}

export function getPublicBodies(): PublicBody[] {
  return getSchoolBoardDistricts()
    .map((district) => getPublicBodyForDistrict(district.district_slug))
    .filter((body): body is PublicBody => Boolean(body));
}

export function getPublicBodyBySlug(slug: string): PublicBody | undefined {
  const normalized = getDistrictDataSlug(slug.replace(/-school-board$/, ""));
  return getPublicBodies().find((body) => body.slug === slug || body.slug === `${getDistrictUrlSlug(normalized)}-school-board`);
}

export function getLocalMeetings(): LocalMeeting[] {
  const meetings: LocalMeeting[] = [];
  for (const district of getSchoolBoardDistricts()) {
    const body = getPublicBodyForDistrict(district.district_slug);
    if (!body) continue;
    for (const feedItem of district.feed ?? []) {
      meetings.push(buildMeetingFromFeed(district, body, feedItem));
    }
    const meetingSources = getDistrictSourceLinks(district.district_slug).filter((source) =>
      /\bmeeting|agenda|minutes|boardbook|video|recording\b/i.test(sourceText(source)),
    );
    meetingSources.slice(0, 3).forEach((source, index) => meetings.push(buildMeetingFromSource(district, body, source, index)));
  }
  return meetings.sort((a, b) => (b.meetingDate ?? "").localeCompare(a.meetingDate ?? "") || a.title.localeCompare(b.title));
}

export function getMeetingBySlug(slug: string): LocalMeeting | undefined {
  return getLocalMeetings().find((meeting) => meeting.slug === slug);
}

export function getMeetingsForPublicBody(publicBodySlug: string): LocalMeeting[] {
  return getLocalMeetings().filter((meeting) => meeting.publicBodySlug === publicBodySlug);
}

export function getMeetingsForJurisdiction(slug: string): { body?: PublicBody; meetings: LocalMeeting[] } {
  const normalized = getDistrictDataSlug(slug.replace(/-school-board$/, ""));
  const body = getPublicBodyBySlug(slug) ?? getPublicBodyForDistrict(normalized);
  if (body) return { body, meetings: getMeetingsForPublicBody(body.slug) };
  const county = slug.replace(/-/g, " ").replace(/\bcounty\b/i, "").trim().toLowerCase();
  const meetings = getLocalMeetings().filter((meeting) => {
    const bodyForMeeting = getPublicBodyBySlug(meeting.publicBodySlug);
    return bodyForMeeting?.county?.toLowerCase().includes(county);
  });
  return { meetings };
}

export function getPublicBodyQuestions(bodyOrMeeting: PublicBody | LocalMeeting) {
  const name = "name" in bodyOrMeeting ? bodyOrMeeting.name : bodyOrMeeting.publicBodyName;
  return [
    `Where can residents find the agenda for the next ${name} meeting?`,
    `Where are the approved minutes posted for ${name}?`,
    `Was this item voted on, and where is the public vote record?`,
    `Where can the public watch the recording for ${name}?`,
  ];
}

export function formatMeetingDate(value?: string) {
  if (!value) return "Date needs source";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}
