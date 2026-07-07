"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  buildClientSourcePacket,
  collectSourceAttribution,
  copyText,
  downloadTextFile,
  safeFileName,
  storeLatestSourceSubmission,
  type SourceSubmissionResponse,
} from "@/components/source-submissions/sourceSubmissionClient";
import { REPWATCHR_SERVICES } from "@/data/repwatchr-services";
import {
  CONTRIBUTOR_ROLES,
  MEMBERSHIP_TIERS,
  getMembershipTier,
  membershipBillingEnabled,
  membershipUpgradeMessage,
  tierMeetsMinimum,
  type MembershipTier,
  type MembershipTierId,
} from "@/lib/membership-tiers";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import { createClient } from "@/lib/supabase";

type WatchItemType = "official" | "school_board" | "race" | "issue" | "attorney" | "media" | "authority";

type WatchItem = {
  id: string;
  label: string;
  href: string;
  itemType: WatchItemType;
  notes: string;
  createdAt: string;
};

type SourceDraft = {
  id: string;
  targetName: string;
  jurisdiction: string;
  sourceUrl: string;
  sourceType: string;
  claimSummary: string;
  checkRequest: string;
  publicFlag: boolean;
  packetText: string;
  status: "draft" | "submitted";
  createdAt: string;
};

type PublicRecordsRequestStatus =
  | "draft"
  | "sent"
  | "response_received"
  | "partially_fulfilled"
  | "denied"
  | "overdue"
  | "closed";

type RecordDraftVariant = "draftText" | "emailText" | "followUpText" | "overdueText" | "denialText";

type RecordsRequestForm = {
  state: string;
  agency: string;
  jurisdiction: string;
  recordType: string;
  dateRange: string;
  namesOffices: string;
  meetingEvent: string;
  deliveryMethod: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  notes: string;
  shareWithRepWatchr: boolean;
};

type RecordsRequest = {
  id: string;
  state: string;
  agency: string;
  jurisdiction: string;
  recordType: string;
  subject: string;
  dateRange: string;
  namesOffices: string;
  meetingEvent: string;
  deliveryMethod: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  notes: string;
  draftText: string;
  emailText: string;
  followUpText: string;
  overdueText: string;
  denialText: string;
  shareWithRepWatchr: boolean;
  status: PublicRecordsRequestStatus;
  createdAt: string;
};

type TimelineEvent = {
  id: string;
  date: string;
  claim: string;
  sourceLink: string;
  missingProof: string;
  nextRecord: string;
};

type TimelineStarter = {
  id: string;
  title: string;
  jurisdiction: string;
  events: TimelineEvent[];
  missingProof: string;
  nextRecords: string;
  timelineText: string;
  createdAt: string;
};

type FarettaNote = {
  id: string;
  prompt: string;
  sourceLinks: string[];
  noteText: string;
  createdAt: string;
};

type SourceSubmissionRecord = {
  id: string;
  target_name: string;
  source_title: string | null;
  source_url: string;
  status: string;
  created_at: string;
};

type DigestPreference = {
  weeklyDigestEnabled: boolean;
  topics: string[];
};

type DashboardStatus = "loading" | "synced" | "local";

const STORAGE_KEYS = {
  watchlist: "repwatchr.dashboard.watchlist.v1",
  sourceDrafts: "repwatchr.dashboard.sourceDrafts.v1",
  recordsRequests: "repwatchr.dashboard.recordsRequests.v1",
  timelines: "repwatchr.dashboard.timelines.v1",
  farettaNotes: "repwatchr.dashboard.farettaNotes.v1",
  lastVisit: "repwatchr.dashboard.lastVisit.v1",
  digest: "repwatchr.dashboard.digest.v1",
};

const watchItemTypes: Array<{ value: WatchItemType; label: string; href: string }> = [
  { value: "official", label: "Official", href: "/officials" },
  { value: "school_board", label: "School Board", href: "/school-boards" },
  { value: "race", label: "Race", href: "/elections/texas" },
  { value: "issue", label: "Issue", href: "/issues" },
  { value: "attorney", label: "Attorney", href: "/attorneys" },
  { value: "media", label: "Media", href: "/media" },
  { value: "authority", label: "Authority", href: "/authority-watch" },
];

const sourceTypes = [
  "official_record",
  "vote_record",
  "campaign_finance",
  "agenda_minutes",
  "video_clip",
  "article",
  "correction",
  "other",
];

const recordTypes = [
  "Agenda, minutes, and vote records",
  "Contracts, invoices, and vendor records",
  "Campaign finance or donor record",
  "Emails or correspondence",
  "Roster, appointment, or personnel record",
  "Policy, rule, or public filing",
  "Video, transcript, or meeting recording",
  "All records related to a meeting, date, or event",
];

const deliveryMethods = [
  "Email / electronic delivery",
  "Online portal",
  "Mail copies",
  "Certified mail",
  "In-person inspection",
  "Pickup after notice",
];

const recordRequestStatuses: Array<{ value: PublicRecordsRequestStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "response_received", label: "Response Received" },
  { value: "partially_fulfilled", label: "Partially Fulfilled" },
  { value: "denied", label: "Denied" },
  { value: "overdue", label: "Overdue" },
  { value: "closed", label: "Closed" },
];

const recordDraftViews: Array<{ value: RecordDraftVariant; label: string }> = [
  { value: "draftText", label: "Full Request" },
  { value: "emailText", label: "Short Email" },
  { value: "followUpText", label: "Follow-Up" },
  { value: "overdueText", label: "Overdue" },
  { value: "denialText", label: "Denial Reply" },
];

const paidServices = REPWATCHR_SERVICES.filter((service) => service.priceCents > 0);
const digestTopicOptions = ["Official updates", "Source queue", "Funding trails", "Vote records", "School boards", "Race pages"];

const seedWatchlist: WatchItem[] = [
  {
    id: "seed-officials",
    label: "Texas officials",
    href: "/officials?state=TX",
    itemType: "official",
    notes: "Start with federal, state, county, and city records.",
    createdAt: "Seed",
  },
  {
    id: "seed-school-boards",
    label: "Texas school boards",
    href: "/school-boards",
    itemType: "school_board",
    notes: "District pages, trustees, public source gaps, and election lanes.",
    createdAt: "Seed",
  },
  {
    id: "seed-races",
    label: "Texas race hub",
    href: "/elections/texas",
    itemType: "race",
    notes: "Statewide, congressional, county, and school-board race files.",
    createdAt: "Seed",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value: string) {
  if (!value || value === "Seed") return value || "Unknown";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is best effort.
  }
}

function defaultDigestPreference(): DigestPreference {
  return {
    weeklyDigestEnabled: false,
    topics: ["Official updates", "Source queue"],
  };
}

function initialLastVisitSummary() {
  if (typeof window === "undefined") return "This is your first dashboard visit in this browser.";
  const previousVisit = window.localStorage.getItem(STORAGE_KEYS.lastVisit);
  if (!previousVisit) return "This is your first dashboard visit in this browser.";
  const previous = new Date(previousVisit);
  if (Number.isNaN(previous.getTime())) return "Last visit timestamp was not readable. Current saved work is shown below.";
  return `Last visit in this browser: ${previous.toLocaleString()}. Watchlist, packets, requests, and submissions below show the current saved state.`;
}

function initialDigestPreference() {
  if (typeof window === "undefined") return defaultDigestPreference();
  return readLocal(STORAGE_KEYS.digest, defaultDigestPreference());
}

function splitSourceLinks(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function cleanRequestValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

function recordRequestLawLabel(state: string) {
  const normalized = state.trim().toUpperCase();
  if (normalized === "TX" || normalized === "TEXAS") {
    return "Texas Public Information Act / Texas Government Code Chapter 552";
  }
  return normalized ? `${normalized} public records or open records law` : "the applicable public records or open records law";
}

function buildRecordRequestSubject(input: Pick<RecordsRequestForm, "recordType" | "dateRange" | "namesOffices" | "meetingEvent" | "notes">) {
  return [
    cleanRequestValue(input.recordType, "public records"),
    input.namesOffices.trim() ? `involving ${input.namesOffices.trim()}` : "",
    input.meetingEvent.trim() ? `related to ${input.meetingEvent.trim()}` : "",
    input.dateRange.trim() ? `from ${input.dateRange.trim()}` : "",
    input.notes.trim() ? `Notes: ${input.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildRecordsRequestDrafts(input: RecordsRequestForm) {
  const state = cleanRequestValue(input.state.toUpperCase(), "State not supplied");
  const agency = cleanRequestValue(input.agency, "Agency/public body not supplied");
  const jurisdiction = cleanRequestValue(input.jurisdiction, "Jurisdiction not supplied");
  const recordType = cleanRequestValue(input.recordType, "Public records");
  const dateRange = cleanRequestValue(input.dateRange, "Date range not supplied");
  const namesOffices = cleanRequestValue(input.namesOffices, "Names/offices not supplied");
  const meetingEvent = cleanRequestValue(input.meetingEvent, "Meeting, date, event, or decision not supplied");
  const deliveryMethod = cleanRequestValue(input.deliveryMethod, "Email / electronic delivery");
  const requesterName = cleanRequestValue(input.requesterName, "Requester name not supplied");
  const requesterEmail = cleanRequestValue(input.requesterEmail, "Requester email not supplied");
  const requesterPhone = cleanRequestValue(input.requesterPhone, "Requester phone not supplied");
  const notes = cleanRequestValue(input.notes, "No extra notes supplied.");
  const lawLabel = recordRequestLawLabel(input.state);
  const subject = buildRecordRequestSubject(input);

  const requestScope = [
    `Please provide public records sufficient to show ${subject}.`,
    `This request includes ${recordType.toLowerCase()}, agendas, minutes, attachments, vote records, filings, contracts, correspondence, recordings, transcripts, exhibits, metadata available in the ordinary course of business, and any other responsive public records.`,
    "If the records are held by another custodian, please identify the correct custodian or forward the request if your process allows it.",
    "If any portion is withheld, please identify the legal basis for withholding and release all reasonably segregable non-exempt portions.",
  ].join("\n\n");

  const contactBlock = [
    `Requester: ${requesterName}`,
    `Email: ${requesterEmail}`,
    `Phone: ${requesterPhone}`,
    `Preferred delivery: ${deliveryMethod}`,
  ].join("\n");

  return {
    draftText: [
      "Public Records Request Draft",
      "RepWatchr public-records research tool, not legal advice.",
      "",
      `State: ${state}`,
      `Public body: ${agency}`,
      `Jurisdiction: ${jurisdiction}`,
      `Record type: ${recordType}`,
      `Date range: ${dateRange}`,
      `Names/offices involved: ${namesOffices}`,
      `Meeting/date/event: ${meetingEvent}`,
      "",
      contactBlock,
      "",
      `Request under ${lawLabel}:`,
      requestScope,
      "",
      "Notes for custodian:",
      notes,
      "",
      "Please confirm receipt and provide the tracking number, estimated production date, and any estimated charges before work begins if charges may apply.",
    ].join("\n"),
    emailText: [
      `Subject: Public records request - ${recordType}`,
      "",
      `Hello ${agency},`,
      "",
      `I am requesting public records under ${lawLabel}. Please provide records sufficient to show ${subject}.`,
      "",
      `Date range: ${dateRange}`,
      `Names/offices: ${namesOffices}`,
      `Meeting/date/event: ${meetingEvent}`,
      `Preferred delivery: ${deliveryMethod}`,
      "",
      "If anything is withheld, please cite the basis and release all non-exempt portions.",
      "",
      contactBlock,
      "",
      "RepWatchr public-records research tool, not legal advice.",
    ].join("\n"),
    followUpText: [
      `Subject: Follow-up on public records request - ${recordType}`,
      "",
      `Hello ${agency},`,
      "",
      `I am following up on my public records request regarding ${subject}. Please confirm whether the request has been received, whether it has a tracking number, and the current estimated response or production date.`,
      "",
      `Original request scope: ${recordType} / ${dateRange} / ${namesOffices} / ${meetingEvent}`,
      "",
      "If clarification is needed, please identify the specific portion that needs narrowing so I can respond quickly.",
      "",
      contactBlock,
      "",
      "RepWatchr public-records research tool, not legal advice.",
    ].join("\n"),
    overdueText: [
      `Subject: Overdue public records request - ${recordType}`,
      "",
      `Hello ${agency},`,
      "",
      `I am following up because I have not received a response or production update for my public records request regarding ${subject}. Please provide the status, tracking number, reason for delay, and expected production date.`,
      "",
      "If responsive records are ready in part, please release the available non-exempt records now and continue processing the remainder.",
      "",
      contactBlock,
      "",
      "RepWatchr public-records research tool, not legal advice.",
    ].join("\n"),
    denialText: [
      `Subject: Clarification requested on public records response - ${recordType}`,
      "",
      `Hello ${agency},`,
      "",
      `Thank you for the response to my public records request regarding ${subject}. I am asking for clarification so the record is clear.`,
      "",
      "Please identify which records were searched for, which records were found, which records were withheld, and the specific legal basis for each withheld category. If any non-exempt portions can be released, please provide those portions.",
      "",
      "If the request needs to be narrowed, please describe the records you maintain and the terms/date ranges that would help locate them.",
      "",
      contactBlock,
      "",
      "RepWatchr public-records research tool, not legal advice.",
    ].join("\n"),
  };
}

function buildTimelineText(input: {
  title: string;
  jurisdiction: string;
  events: TimelineEvent[];
  missingProof: string;
  nextRecords: string;
}) {
  const lines = [
    "RepWatchr Timeline Starter",
    "",
    `Title: ${input.title || "Untitled timeline"}`,
    `Jurisdiction: ${input.jurisdiction || "Not supplied"}`,
    "",
    "Events:",
  ];

  if (input.events.length === 0) {
    lines.push("- No dated events added yet.");
  } else {
    input.events.forEach((event) => {
      lines.push(`- ${event.date || "Date unknown"}: ${event.claim}`);
      if (event.sourceLink) lines.push(`  Source: ${event.sourceLink}`);
      if (event.missingProof) lines.push(`  Missing proof: ${event.missingProof}`);
      if (event.nextRecord) lines.push(`  Next record to pull: ${event.nextRecord}`);
    });
  }

  lines.push("", "Missing proof:", input.missingProof || "Not supplied");
  lines.push("", "Next records to pull:", input.nextRecords || "Not supplied");
  lines.push("", "Guardrail:", "This timeline is a research starter. Do not publish claims as findings until the source record is checked.");
  return lines.join("\n");
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function isPublicRecordsRequestStatus(value: string): value is PublicRecordsRequestStatus {
  return recordRequestStatuses.some((status) => status.value === value);
}

function normalizeRecordsRequestRow(item: Record<string, unknown>): RecordsRequest {
  const form: RecordsRequestForm = {
    state: String(item.state || "TX"),
    agency: String(item.agency || ""),
    jurisdiction: String(item.jurisdiction || ""),
    recordType: String(item.record_type || recordTypes[0]),
    dateRange: String(item.date_range || ""),
    namesOffices: String(item.names_offices || item.subject || ""),
    meetingEvent: String(item.meeting_event || ""),
    deliveryMethod: String(item.preferred_delivery_method || deliveryMethods[0]),
    requesterName: String(item.requester_name || ""),
    requesterEmail: String(item.requester_email || ""),
    requesterPhone: String(item.requester_phone || ""),
    notes: String(item.notes || ""),
    shareWithRepWatchr: Boolean(item.share_with_repwatchr),
  };
  const generated = buildRecordsRequestDrafts(form);
  const status = String(item.status || "draft");

  return {
    id: String(item.id),
    ...form,
    subject: String(item.subject || buildRecordRequestSubject(form)),
    draftText: String(item.draft_text || generated.draftText),
    emailText: String(item.email_text || generated.emailText),
    followUpText: String(item.follow_up_text || generated.followUpText),
    overdueText: String(item.overdue_follow_up_text || generated.overdueText),
    denialText: String(item.denial_clarification_text || generated.denialText),
    status: isPublicRecordsRequestStatus(status) ? status : "draft",
    createdAt: String(item.created_at || nowIso()),
  };
}

export default function RepWatchrMemberDashboard({ initialEmail }: { initialEmail: string }) {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [dashboardStatus, setDashboardStatus] = useState<DashboardStatus>("loading");
  const [notice, setNotice] = useState("");
  const [watchlist, setWatchlist] = useState<WatchItem[]>(seedWatchlist);
  const [sourceDrafts, setSourceDrafts] = useState<SourceDraft[]>([]);
  const [recordsRequests, setRecordsRequests] = useState<RecordsRequest[]>([]);
  const [timelines, setTimelines] = useState<TimelineStarter[]>([]);
  const [farettaNotes, setFarettaNotes] = useState<FarettaNote[]>([]);
  const [sourceSubmissions, setSourceSubmissions] = useState<SourceSubmissionRecord[]>([]);
  const [membershipTierId, setMembershipTierId] = useState<MembershipTierId>("free_founder");
  const [lastVisitSummary] = useState(initialLastVisitSummary);
  const [digestPreference, setDigestPreference] = useState<DigestPreference>(initialDigestPreference);

  const [watchForm, setWatchForm] = useState({
    label: "",
    href: "",
    itemType: "official" as WatchItemType,
    notes: "",
  });
  const [packetForm, setPacketForm] = useState({
    targetName: "",
    jurisdiction: profile?.county ?? "",
    sourceUrl: "",
    sourceType: "official_record",
    claimSummary: "",
    checkRequest: "",
    publicFlag: true,
  });
  const [recordForm, setRecordForm] = useState<RecordsRequestForm>({
    state: "TX",
    agency: "",
    jurisdiction: profile?.county ?? "",
    recordType: recordTypes[0],
    dateRange: "",
    namesOffices: "",
    meetingEvent: "",
    deliveryMethod: deliveryMethods[0],
    requesterName: "",
    requesterEmail: initialEmail,
    requesterPhone: "",
    notes: "",
    shareWithRepWatchr: false,
  });
  const [recordPreviewKey, setRecordPreviewKey] = useState<RecordDraftVariant>("draftText");
  const [timelineForm, setTimelineForm] = useState({
    title: "",
    jurisdiction: profile?.county ?? "",
    missingProof: "",
    nextRecords: "",
  });
  const [timelineEventForm, setTimelineEventForm] = useState({
    date: "",
    claim: "",
    sourceLink: "",
    missingProof: "",
    nextRecord: "",
  });
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [farettaForm, setFarettaForm] = useState({
    prompt: "",
    sourceLinks: "",
  });
  const [farettaReply, setFarettaReply] = useState("");
  const [farettaLoading, setFarettaLoading] = useState(false);
  const [packetSubmitting, setPacketSubmitting] = useState(false);

  const currentEmail = user?.email ?? initialEmail;
  const membershipTier = getMembershipTier(membershipTierId);
  const billingEnabled = membershipBillingEnabled();
  const generatedPacket = buildClientSourcePacket({
    submitterEmail: currentEmail,
    targetName: packetForm.targetName,
    targetType: "member_source_packet",
    jurisdiction: packetForm.jurisdiction,
    sourceUrl: packetForm.sourceUrl,
    sourceType: packetForm.sourceType,
    claimSummary: packetForm.claimSummary,
    checkRequest: packetForm.checkRequest,
    publicFlag: packetForm.publicFlag,
  });
  const recordsDrafts = buildRecordsRequestDrafts(recordForm);
  const activeRecordsDraftText = recordsDrafts[recordPreviewKey];
  const timelineDraftText = buildTimelineText({
    ...timelineForm,
    events: timelineEvents,
  });
  const submissionsByStatus = sourceSubmissions.reduce<Record<string, number>>((totals, submission) => {
    totals[submission.status] = (totals[submission.status] ?? 0) + 1;
    return totals;
  }, {});

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.lastVisit, nowIso());
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      if (authLoading) return;

      if (!user) {
        window.setTimeout(() => {
          if (!mounted) return;
          setWatchlist(readLocal(STORAGE_KEYS.watchlist, seedWatchlist));
          setSourceDrafts(readLocal(STORAGE_KEYS.sourceDrafts, []));
          setRecordsRequests(readLocal(STORAGE_KEYS.recordsRequests, []));
          setTimelines(readLocal(STORAGE_KEYS.timelines, []));
          setFarettaNotes(readLocal(STORAGE_KEYS.farettaNotes, []));
          setDashboardStatus("local");
        }, 0);
        return;
      }

      const [
        watchResult,
        packetResult,
        requestResult,
        timelineResult,
        farettaResult,
        submissionResult,
        membershipResult,
        digestResult,
      ] = await Promise.all([
        supabase
          .from("member_tracked_items")
          .select("id, label, href, item_type, notes, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("member_source_packet_drafts")
          .select("id, target_name, jurisdiction, source_url, source_type, claim_summary, check_request, public_flag, packet_text, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("member_public_record_requests")
          .select("id, state, agency, jurisdiction, record_type, subject, date_range, names_offices, meeting_event, preferred_delivery_method, requester_name, requester_email, requester_phone, notes, draft_text, email_text, follow_up_text, overdue_follow_up_text, denial_clarification_text, share_with_repwatchr, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("member_timeline_starters")
          .select("id, title, jurisdiction, events, missing_proof, next_records, timeline_text, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("member_faretta_notes")
          .select("id, prompt, source_links, note_text, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("source_submissions")
          .select("id, target_name, source_title, source_url, status, created_at")
          .eq("submitter_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("member_memberships")
          .select("tier, status")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("member_digest_preferences")
          .select("weekly_digest_enabled, topics")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      const hasDashboardError = [
        watchResult.error,
        packetResult.error,
        requestResult.error,
        timelineResult.error,
        farettaResult.error,
      ].some(Boolean);

      if (watchResult.data) {
        setWatchlist(
          watchResult.data.length
            ? watchResult.data.map((item) => ({
                id: String(item.id),
                label: String(item.label),
                href: String(item.href),
                itemType: String(item.item_type || "official") as WatchItemType,
                notes: String(item.notes || ""),
                createdAt: String(item.created_at),
              }))
            : seedWatchlist,
        );
      } else {
        setWatchlist(readLocal(STORAGE_KEYS.watchlist, seedWatchlist));
      }

      if (packetResult.data) {
        setSourceDrafts(
          packetResult.data.map((item) => ({
            id: String(item.id),
            targetName: String(item.target_name),
            jurisdiction: String(item.jurisdiction || ""),
            sourceUrl: String(item.source_url || ""),
            sourceType: String(item.source_type || "official_record"),
            claimSummary: String(item.claim_summary || ""),
            checkRequest: String(item.check_request || ""),
            publicFlag: Boolean(item.public_flag),
            packetText: String(item.packet_text || ""),
            status: String(item.status || "draft") === "submitted" ? "submitted" : "draft",
            createdAt: String(item.created_at),
          })),
        );
      } else {
        setSourceDrafts(readLocal(STORAGE_KEYS.sourceDrafts, []));
      }

      if (requestResult.data) {
        setRecordsRequests(requestResult.data.map((item) => normalizeRecordsRequestRow(item as Record<string, unknown>)));
      } else {
        setRecordsRequests(readLocal(STORAGE_KEYS.recordsRequests, []));
      }

      if (timelineResult.data) {
        setTimelines(
          timelineResult.data.map((item) => ({
            id: String(item.id),
            title: String(item.title),
            jurisdiction: String(item.jurisdiction || ""),
            events: Array.isArray(item.events) ? (item.events as TimelineEvent[]) : [],
            missingProof: String(item.missing_proof || ""),
            nextRecords: String(item.next_records || ""),
            timelineText: String(item.timeline_text || ""),
            createdAt: String(item.created_at),
          })),
        );
      } else {
        setTimelines(readLocal(STORAGE_KEYS.timelines, []));
      }

      if (farettaResult.data) {
        setFarettaNotes(
          farettaResult.data.map((item) => ({
            id: String(item.id),
            prompt: String(item.prompt || ""),
            sourceLinks: Array.isArray(item.source_links) ? item.source_links.map(String) : [],
            noteText: String(item.note_text || ""),
            createdAt: String(item.created_at),
          })),
        );
      } else {
        setFarettaNotes(readLocal(STORAGE_KEYS.farettaNotes, []));
      }

      if (submissionResult.data) {
        setSourceSubmissions(submissionResult.data as SourceSubmissionRecord[]);
      }

      if (membershipResult.data?.tier) {
        setMembershipTierId(getMembershipTier(String(membershipResult.data.tier)).id);
      } else if (!membershipResult.error) {
        await supabase.from("member_memberships").insert({
          user_id: user.id,
          tier: "free_founder",
          status: "active",
          source: "dashboard_default",
        });
        setMembershipTierId("free_founder");
      } else {
        setMembershipTierId("free_founder");
      }

      if (digestResult.data) {
        setDigestPreference({
          weeklyDigestEnabled: Boolean(digestResult.data.weekly_digest_enabled),
          topics: Array.isArray(digestResult.data.topics) ? digestResult.data.topics.map(String) : ["Official updates", "Source queue"],
        });
      }

      setDashboardStatus(hasDashboardError ? "local" : "synced");
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [authLoading, supabase, user]);

  async function saveWatchItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item: WatchItem = {
      id: makeId("watch"),
      label: watchForm.label.trim(),
      href: watchForm.href.trim() || watchItemTypes.find((type) => type.value === watchForm.itemType)?.href || "/search",
      itemType: watchForm.itemType,
      notes: watchForm.notes.trim(),
      createdAt: nowIso(),
    };
    if (!item.label) return;

    let saved = item;
    if (user) {
      const { data, error } = await supabase
        .from("member_tracked_items")
        .insert({
          user_id: user.id,
          label: item.label,
          href: item.href,
          item_type: item.itemType,
          notes: item.notes,
        })
        .select("id, created_at")
        .maybeSingle();
      if (!error && data?.id) {
        saved = { ...item, id: String(data.id), createdAt: String(data.created_at) };
      } else {
        setDashboardStatus("local");
      }
    }

    const next = [saved, ...watchlist.filter((current) => current.label !== saved.label)].slice(0, 40);
    setWatchlist(next);
    writeLocal(STORAGE_KEYS.watchlist, next);
    setWatchForm({ label: "", href: "", itemType: "official", notes: "" });
    trackRepWatchrEvent("watchlist_add", {
      item_type: saved.itemType,
      storage: user ? "account" : "local",
      total_items: next.length,
    });
  }

  async function removeWatchItem(item: WatchItem) {
    const next = watchlist.filter((current) => current.id !== item.id);
    setWatchlist(next);
    writeLocal(STORAGE_KEYS.watchlist, next);
    if (user && !item.id.startsWith("seed") && !item.id.startsWith("watch-")) {
      await supabase.from("member_tracked_items").delete().eq("id", item.id).eq("user_id", user.id);
    }
  }

  async function saveSourceDraft(status: SourceDraft["status"] = "draft", submissionId?: string) {
    if (!packetForm.targetName.trim() || !packetForm.sourceUrl.trim() || !packetForm.claimSummary.trim()) {
      setNotice("Add a target, public source URL, and summary before saving a source packet.");
      return null;
    }

    const draft: SourceDraft = {
      id: makeId("source-draft"),
      targetName: packetForm.targetName.trim(),
      jurisdiction: packetForm.jurisdiction.trim(),
      sourceUrl: packetForm.sourceUrl.trim(),
      sourceType: packetForm.sourceType,
      claimSummary: packetForm.claimSummary.trim(),
      checkRequest: packetForm.checkRequest.trim(),
      publicFlag: packetForm.publicFlag,
      packetText: generatedPacket,
      status,
      createdAt: nowIso(),
    };

    let saved = draft;
    if (user) {
      const { data, error } = await supabase
        .from("member_source_packet_drafts")
        .insert({
          user_id: user.id,
          target_name: draft.targetName,
          jurisdiction: draft.jurisdiction || null,
          source_url: draft.sourceUrl,
          source_type: draft.sourceType,
          claim_summary: draft.claimSummary,
          check_request: draft.checkRequest,
          public_flag: draft.publicFlag,
          packet_text: draft.packetText,
          status: draft.status,
          source_submission_id: submissionId ?? null,
        })
        .select("id, created_at")
        .maybeSingle();
      if (!error && data?.id) {
        saved = { ...draft, id: String(data.id), createdAt: String(data.created_at) };
      } else {
        setDashboardStatus("local");
      }
    }

    const next = [saved, ...sourceDrafts].slice(0, 20);
    setSourceDrafts(next);
    writeLocal(STORAGE_KEYS.sourceDrafts, next);
    setNotice(status === "submitted" ? "Source packet submitted to review." : "Source packet draft saved.");
    return saved;
  }

  async function submitSourcePacket() {
    if (!packetForm.targetName.trim() || !packetForm.sourceUrl.trim() || !packetForm.claimSummary.trim() || !packetForm.checkRequest.trim()) {
      setNotice("Add target, source URL, summary, and what needs to be checked before submitting.");
      return;
    }

    setPacketSubmitting(true);
    setNotice("");
    trackRepWatchrEvent("source_submit_started", {
      source_type: packetForm.sourceType,
      target_type: "member_source_packet",
    });
    const payload = {
      submitterEmail: currentEmail,
      targetName: packetForm.targetName,
      targetType: "member_source_packet",
      jurisdiction: packetForm.jurisdiction,
      sourceUrl: packetForm.sourceUrl,
      sourceType: packetForm.sourceType,
      claimSummary: packetForm.claimSummary,
      checkRequest: packetForm.checkRequest,
      publicFlag: packetForm.publicFlag,
      ...collectSourceAttribution(),
      metadata: { intake: "member_dashboard_source_packet" },
    };

    try {
      const response = await fetch("/api/source-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => null)) as SourceSubmissionResponse | null;

      if (response.ok && data?.submissionId) {
        const submissionId = data.submissionId;
        const packet = data.packet || buildClientSourcePacket({ ...payload, submissionId });
        storeLatestSourceSubmission({
          submissionId,
          packet,
          nextAction: data.nextAction || "Watch the dashboard for review status and add another public source if one is missing.",
          shareUrl: data.shareUrl || "https://www.repwatchr.com/submit-source",
          targetName: packetForm.targetName,
          sourceUrl: packetForm.sourceUrl,
          createdAt: nowIso(),
        });
        await copyText(packet);
        await saveSourceDraft("submitted", submissionId);
        setSourceSubmissions((current) => [
          {
            id: submissionId,
            target_name: packetForm.targetName,
            source_title: packetForm.sourceType,
            source_url: packetForm.sourceUrl,
            status: "new",
            created_at: nowIso(),
          },
          ...current,
        ]);
        setNotice("Submitted to review and copied to your clipboard.");
        trackRepWatchrEvent("source_submit_completed", {
          source_type: packetForm.sourceType,
          target_type: "member_source_packet",
          submission_id: submissionId,
        });
      } else {
        await copyText(data?.packet || generatedPacket);
        setNotice(data?.error || "Queue unavailable. Packet copied as a backup.");
      }
    } catch {
      await copyText(generatedPacket);
      setNotice("Queue unavailable. Packet copied as a backup.");
    } finally {
      setPacketSubmitting(false);
    }
  }

  async function saveRecordsRequest() {
    if (!recordForm.state.trim() || !recordForm.agency.trim()) {
      setNotice("Add the state and agency/public body before saving the request.");
      return;
    }
    if (!recordForm.namesOffices.trim() && !recordForm.meetingEvent.trim() && !recordForm.notes.trim()) {
      setNotice("Add the names/offices, meeting/date/event, or notes before saving the request.");
      return;
    }

    const generated = buildRecordsRequestDrafts(recordForm);
    const draft: RecordsRequest = {
      id: makeId("records"),
      state: recordForm.state.trim().toUpperCase(),
      agency: recordForm.agency.trim(),
      jurisdiction: recordForm.jurisdiction.trim(),
      recordType: recordForm.recordType,
      subject: buildRecordRequestSubject(recordForm),
      dateRange: recordForm.dateRange.trim(),
      namesOffices: recordForm.namesOffices.trim(),
      meetingEvent: recordForm.meetingEvent.trim(),
      deliveryMethod: recordForm.deliveryMethod,
      requesterName: recordForm.requesterName.trim(),
      requesterEmail: recordForm.requesterEmail.trim(),
      requesterPhone: recordForm.requesterPhone.trim(),
      notes: recordForm.notes.trim(),
      draftText: generated.draftText,
      emailText: generated.emailText,
      followUpText: generated.followUpText,
      overdueText: generated.overdueText,
      denialText: generated.denialText,
      shareWithRepWatchr: recordForm.shareWithRepWatchr,
      status: "draft",
      createdAt: nowIso(),
    };

    let saved = draft;
    if (user) {
      const { data, error } = await supabase
        .from("member_public_record_requests")
        .insert({
          user_id: user.id,
          state: draft.state,
          agency: draft.agency,
          jurisdiction: draft.jurisdiction || null,
          record_type: draft.recordType,
          subject: draft.subject,
          date_range: draft.dateRange || null,
          names_offices: draft.namesOffices || null,
          meeting_event: draft.meetingEvent || null,
          preferred_delivery_method: draft.deliveryMethod || null,
          requester_name: draft.requesterName || null,
          requester_email: draft.requesterEmail || null,
          requester_phone: draft.requesterPhone || null,
          notes: draft.notes || null,
          draft_text: draft.draftText,
          email_text: draft.emailText,
          follow_up_text: draft.followUpText,
          overdue_follow_up_text: draft.overdueText,
          denial_clarification_text: draft.denialText,
          share_with_repwatchr: draft.shareWithRepWatchr,
          shared_at: draft.shareWithRepWatchr ? nowIso() : null,
          status: draft.status,
        })
        .select("id, created_at")
        .maybeSingle();
      if (!error && data?.id) {
        saved = { ...draft, id: String(data.id), createdAt: String(data.created_at) };
      } else {
        setDashboardStatus("local");
      }
    }

    const next = [saved, ...recordsRequests].slice(0, 20);
    setRecordsRequests(next);
    writeLocal(STORAGE_KEYS.recordsRequests, next);
    trackRepWatchrEvent("public_records_request_created", {
      state: draft.state,
      record_type: draft.recordType,
      shared_with_repwatchr: draft.shareWithRepWatchr,
      storage: user ? "account" : "local",
    });
    setNotice(draft.shareWithRepWatchr ? "Public records request saved and shared with RepWatchr admin review." : "Public records request draft saved.");
  }

  async function updateRecordsRequestStatus(id: string, status: RecordsRequest["status"]) {
    const next = recordsRequests.map((request) => (request.id === id ? { ...request, status } : request));
    setRecordsRequests(next);
    writeLocal(STORAGE_KEYS.recordsRequests, next);
    if (user && !id.startsWith("records-")) {
      const updatePayload: Record<string, string> = { status };
      if (status === "sent") updatePayload.sent_at = nowIso();
      if (status === "response_received") updatePayload.response_received_at = nowIso();
      if (status === "partially_fulfilled") updatePayload.partially_fulfilled_at = nowIso();
      if (status === "denied") updatePayload.denied_at = nowIso();
      if (status === "overdue") updatePayload.overdue_at = nowIso();
      if (status === "closed") updatePayload.closed_at = nowIso();
      await supabase
        .from("member_public_record_requests")
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", user.id);
    }
  }

  async function saveDigestPreference() {
    writeLocal(STORAGE_KEYS.digest, digestPreference);
    if (user) {
      const { error } = await supabase.from("member_digest_preferences").upsert({
        user_id: user.id,
        weekly_digest_enabled: digestPreference.weeklyDigestEnabled,
        email: currentEmail,
        topics: digestPreference.topics,
      });
      if (error) {
        setDashboardStatus("local");
        setNotice("Digest preference saved locally. Apply the data-health migration to store it on the account.");
        return;
      }
    }
    setNotice(digestPreference.weeklyDigestEnabled ? "Weekly digest preference saved." : "Weekly digest turned off.");
  }

  function addTimelineEvent() {
    if (!timelineEventForm.claim.trim()) {
      setNotice("Add a claim or event before adding it to the timeline.");
      return;
    }

    setTimelineEvents((current) => [
      ...current,
      {
        id: makeId("event"),
        ...timelineEventForm,
        claim: timelineEventForm.claim.trim(),
      },
    ]);
    setTimelineEventForm({ date: "", claim: "", sourceLink: "", missingProof: "", nextRecord: "" });
  }

  async function saveTimelineStarter() {
    if (!timelineForm.title.trim() || timelineEvents.length === 0) {
      setNotice("Add a timeline title and at least one event before saving.");
      return;
    }

    const timeline: TimelineStarter = {
      id: makeId("timeline"),
      title: timelineForm.title.trim(),
      jurisdiction: timelineForm.jurisdiction.trim(),
      events: timelineEvents,
      missingProof: timelineForm.missingProof.trim(),
      nextRecords: timelineForm.nextRecords.trim(),
      timelineText: timelineDraftText,
      createdAt: nowIso(),
    };

    let saved = timeline;
    if (user) {
      const { data, error } = await supabase
        .from("member_timeline_starters")
        .insert({
          user_id: user.id,
          title: timeline.title,
          jurisdiction: timeline.jurisdiction || null,
          events: timeline.events,
          missing_proof: timeline.missingProof || null,
          next_records: timeline.nextRecords || null,
          timeline_text: timeline.timelineText,
        })
        .select("id, created_at")
        .maybeSingle();
      if (!error && data?.id) {
        saved = { ...timeline, id: String(data.id), createdAt: String(data.created_at) };
      } else {
        setDashboardStatus("local");
      }
    }

    const next = [saved, ...timelines].slice(0, 20);
    setTimelines(next);
    writeLocal(STORAGE_KEYS.timelines, next);
    setNotice("Timeline starter saved.");
  }

  async function askFaretta() {
    if (!farettaForm.prompt.trim()) {
      setNotice("Add a research question before asking Faretta.");
      return;
    }

    setFarettaLoading(true);
    setNotice("");
    const sourceLinks = splitSourceLinks(farettaForm.sourceLinks);
    const message = [
      farettaForm.prompt.trim(),
      "",
      "RepWatchr member dashboard instruction: answer only with source gaps, public records to pull, safer wording, and next questions. Do not make unsupported findings.",
      sourceLinks.length ? `Source links:\n${sourceLinks.map((link, index) => `${index + 1}. ${link}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/faretta/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          history: [],
          tier: "member",
          userContext: {
            page: "member_dashboard",
            sourceLinks,
          },
        }),
      });
      const body = (await response.json().catch(() => null)) as { reply?: string | null } | null;
      const reply = [
        body?.reply?.trim() || "Start by identifying the official source, date, target agency, and missing public record.",
        "",
        "Dashboard guardrail: treat this as a research note. Pull the records before publishing a stronger claim.",
      ].join("\n");
      setFarettaReply(reply);
    } catch {
      setFarettaReply(
        [
          "Start by identifying the official source, date, target agency, and missing public record.",
          "Next records to pull: agenda, minutes, vote record, filing, donor record, contract, or public statement.",
          "Dashboard guardrail: treat this as a research note. Pull the records before publishing a stronger claim.",
        ].join("\n"),
      );
    } finally {
      setFarettaLoading(false);
    }
  }

  async function saveFarettaNote() {
    if (!farettaForm.prompt.trim() || !farettaReply.trim()) {
      setNotice("Ask Faretta first, then save the research note.");
      return;
    }

    const note: FarettaNote = {
      id: makeId("faretta-note"),
      prompt: farettaForm.prompt.trim(),
      sourceLinks: splitSourceLinks(farettaForm.sourceLinks),
      noteText: farettaReply,
      createdAt: nowIso(),
    };

    let saved = note;
    if (user) {
      const { data, error } = await supabase
        .from("member_faretta_notes")
        .insert({
          user_id: user.id,
          prompt: note.prompt,
          source_links: note.sourceLinks,
          note_text: note.noteText,
          saved_from: "dashboard",
        })
        .select("id, created_at")
        .maybeSingle();
      if (!error && data?.id) {
        saved = { ...note, id: String(data.id), createdAt: String(data.created_at) };
      } else {
        setDashboardStatus("local");
      }
    }

    const next = [saved, ...farettaNotes].slice(0, 20);
    setFarettaNotes(next);
    writeLocal(STORAGE_KEYS.farettaNotes, next);
    setNotice("Faretta research note saved.");
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  return (
    <main className="bg-[#f6f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Member dashboard</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-blue-950 sm:text-5xl">
                Build the record before you share the claim.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                {currentEmail} / {profile?.verified ? "verified profile" : "verification pending"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Metric label="Watching" value={watchlist.length} />
              <Metric label="Drafts" value={sourceDrafts.length + recordsRequests.length + timelines.length} />
              <Metric label="Submissions" value={sourceSubmissions.length} />
              <Metric label="Tier" value={membershipTier.name.replace(" Access", "")} />
            </div>
          </div>
          {notice ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
              {notice}
            </div>
          ) : null}
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Membership tier</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
                {membershipTier.name}
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
                {membershipTier.summary} {billingEnabled ? "Paid upgrades are enabled." : "Founder access stays open while paid billing is staged."}
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">
                Storage: {dashboardStatus === "synced" ? "Account" : "Local"} / Billing: {billingEnabled ? "enabled" : "not required yet"}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:w-[560px]">
              <Metric label="Watchlist limit" value={membershipTier.limits.watchlistItems} />
              <Metric label="Packet limit" value={membershipTier.limits.savedPackets} />
              <Metric label="Request drafts" value={membershipTier.limits.publicRecordDrafts} />
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {MEMBERSHIP_TIERS.map((tier) => (
              <MembershipTierCard key={tier.id} tier={tier} active={tier.id === membershipTier.id} billingEnabled={billingEnabled} />
            ))}
          </div>
        </section>

        <LeadRepVerificationCard
          sourceSubmissions={sourceSubmissions.length}
          reviewItems={sourceSubmissions.filter((submission) => ["new", "needs_review", "needs_more_info"].includes(submission.status)).length}
          proofDrafts={sourceDrafts.length}
        />

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <ToolPanel eyebrow="What changed since last visit" title="Current saved work">
            <p className="text-sm font-semibold leading-6 text-slate-700">{lastVisitSummary}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Metric label="Saved targets" value={watchlist.length} />
              <Metric label="Open requests" value={recordsRequests.filter((request) => !["closed", "denied"].includes(request.status)).length} />
              <Metric label="Review items" value={sourceSubmissions.filter((submission) => ["new", "needs_review", "needs_more_info"].includes(submission.status)).length} />
            </div>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Real utility only: saved records, changed statuses, missing sources, and next public records to pull.
            </p>
          </ToolPanel>
          <ToolPanel eyebrow="Weekly digest" title="Choose what RepWatchr should summarize">
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm font-black text-blue-950">
              <input
                type="checkbox"
                checked={digestPreference.weeklyDigestEnabled}
                onChange={(event) => setDigestPreference((current) => ({ ...current, weeklyDigestEnabled: event.target.checked }))}
              />
              Send a weekly utility digest when email is configured
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {digestTopicOptions.map((topic) => {
                const checked = digestPreference.topics.includes(topic);
                return (
                  <label key={topic} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setDigestPreference((current) => ({
                          ...current,
                          topics: event.target.checked
                            ? Array.from(new Set([...current.topics, topic]))
                            : current.topics.filter((item) => item !== topic),
                        }));
                      }}
                    />
                    {topic}
                  </label>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={saveDigestPreference} className="secondary-button">
                Save Digest
              </button>
              <Link href="/dashboard/notifications" className="secondary-button">
                Open notification center
              </Link>
            </div>
          </ToolPanel>
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Contributor roles</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">Pick the work you can actually do.</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONTRIBUTOR_ROLES.map((role) => (
              <div key={role.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-black text-blue-950">{role.label}</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{role.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Watchlist", "#watchlist"],
            ["Packets", "#source-packet"],
            ["Requests", "#records-request"],
            ["Timeline", "#timeline"],
            ["Faretta", "#faretta-helper"],
            ["Submissions", "#my-submissions"],
            ["Upgrade", "#paid-services"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm hover:border-red-300 hover:text-red-700"
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="watchlist" className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ToolPanel eyebrow="Watchlist" title="Saved targets">
            <form onSubmit={saveWatchItem} className="grid gap-3">
              <input
                value={watchForm.label}
                onChange={(event) => setWatchForm((current) => ({ ...current, label: event.target.value }))}
                placeholder="Name, race, issue, board, agency, attorney, or outlet"
                className="field"
              />
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <input
                  value={watchForm.href}
                  onChange={(event) => setWatchForm((current) => ({ ...current, href: event.target.value }))}
                  placeholder="/officials/ted-cruz or public URL"
                  className="field"
                />
                <select
                  value={watchForm.itemType}
                  onChange={(event) => setWatchForm((current) => ({ ...current, itemType: event.target.value as WatchItemType }))}
                  className="field font-black"
                >
                  {watchItemTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={watchForm.notes}
                onChange={(event) => setWatchForm((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                placeholder="Why this target matters"
                className="field resize-none"
              />
              <button className="primary-button">Save To Watchlist</button>
            </form>
          </ToolPanel>
          <ToolPanel eyebrow="Open files" title="What you are watching">
            <div className="grid gap-3">
              {watchlist.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-blue-950">{item.label}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
                        {statusLabel(item.itemType)} / {formatDate(item.createdAt)}
                      </p>
                      {item.notes ? <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">{item.notes}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <Link href={item.href} className="mini-button">
                        Open
                      </Link>
                      <button type="button" onClick={() => removeWatchItem(item)} className="mini-button text-slate-500">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ToolPanel>
        </section>

        <section id="source-packet" className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ToolPanel eyebrow="Source Packet Builder" title="Build and submit a clean packet">
            <div className="grid gap-3">
              {membershipTier.id === "free_founder" ? (
                <UpgradePrompt
                  title="Need more saved packets later?"
                  message={membershipUpgradeMessage("watcher_pro")}
                  href="#paid-services"
                />
              ) : null}
              <input
                value={packetForm.targetName}
                onChange={(event) => setPacketForm((current) => ({ ...current, targetName: event.target.value }))}
                placeholder="Target official, agency, race, board, or issue"
                className="field"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={packetForm.jurisdiction}
                  onChange={(event) => setPacketForm((current) => ({ ...current, jurisdiction: event.target.value }))}
                  placeholder="Jurisdiction"
                  className="field"
                />
                <select
                  value={packetForm.sourceType}
                  onChange={(event) => setPacketForm((current) => ({ ...current, sourceType: event.target.value }))}
                  className="field font-black"
                >
                  {sourceTypes.map((type) => (
                    <option key={type} value={type}>
                      {statusLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={packetForm.sourceUrl}
                onChange={(event) => setPacketForm((current) => ({ ...current, sourceUrl: event.target.value }))}
                placeholder="https:// public source URL"
                className="field"
              />
              <textarea
                value={packetForm.claimSummary}
                onChange={(event) => setPacketForm((current) => ({ ...current, claimSummary: event.target.value }))}
                rows={4}
                placeholder="What the source shows"
                className="field resize-none"
              />
              <textarea
                value={packetForm.checkRequest}
                onChange={(event) => setPacketForm((current) => ({ ...current, checkRequest: event.target.value }))}
                rows={4}
                placeholder="What RepWatchr should check, attach, compare, or correct"
                className="field resize-none"
              />
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={packetForm.publicFlag}
                  onChange={(event) => setPacketForm((current) => ({ ...current, publicFlag: event.target.checked }))}
                  className="mt-1"
                />
                Public-source summary can be shown after review
              </label>
              <div className="grid gap-2 sm:grid-cols-4">
                <button type="button" onClick={() => saveSourceDraft("draft")} className="secondary-button">
                  Save Draft
                </button>
                <button type="button" onClick={submitSourcePacket} disabled={packetSubmitting} className="primary-button sm:col-span-2">
                  {packetSubmitting ? "Submitting..." : "Submit To Review"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadTextFile(`${safeFileName(packetForm.targetName || "source-packet")}.md`, generatedPacket)}
                  className="secondary-button"
                >
                  Export MD
                </button>
              </div>
            </div>
          </ToolPanel>
          <ToolPanel eyebrow="Packet preview" title="Copy/export backup">
            <textarea readOnly value={generatedPacket} rows={16} className="field min-h-80 resize-none font-mono text-xs" />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => copyText(generatedPacket)} className="secondary-button">
                Copy Text
              </button>
              <button
                type="button"
                onClick={() => downloadTextFile(`${safeFileName(packetForm.targetName || "source-packet")}.txt`, generatedPacket)}
                className="secondary-button"
              >
                Export Text
              </button>
            </div>
          </ToolPanel>
        </section>

        <section id="records-request" className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ToolPanel eyebrow="Public Records Request Drafts" title="Public Records Request Generator">
            <div className="grid gap-3">
              {membershipTier.id === "free_founder" ? (
                <UpgradePrompt
                  title="Expanded records drafting is a paid-tier tool."
                  message={membershipUpgradeMessage("watcher_pro")}
                  href="#paid-services"
                />
              ) : null}
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
                RepWatchr is a public-records research tool, not legal advice. Verify deadlines and appeal rights for the agency and state before relying on them.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={recordForm.state}
                  onChange={(event) => setRecordForm((current) => ({ ...current, state: event.target.value.toUpperCase().slice(0, 24) }))}
                  placeholder="State, e.g. TX"
                  className="field"
                />
                <input
                  value={recordForm.agency}
                  onChange={(event) => setRecordForm((current) => ({ ...current, agency: event.target.value }))}
                  placeholder="Agency, public body, district, or board"
                  className="field"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={recordForm.jurisdiction}
                  onChange={(event) => setRecordForm((current) => ({ ...current, jurisdiction: event.target.value }))}
                  placeholder="City, county, district, or jurisdiction"
                  className="field"
                />
                <input
                  value={recordForm.dateRange}
                  onChange={(event) => setRecordForm((current) => ({ ...current, dateRange: event.target.value }))}
                  placeholder="Date range, e.g. Jan. 1, 2025 to present"
                  className="field"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={recordForm.recordType}
                  onChange={(event) => setRecordForm((current) => ({ ...current, recordType: event.target.value }))}
                  className="field font-black"
                >
                  {recordTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={recordForm.deliveryMethod}
                  onChange={(event) => setRecordForm((current) => ({ ...current, deliveryMethod: event.target.value }))}
                  className="field font-black"
                >
                  {deliveryMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={recordForm.namesOffices}
                onChange={(event) => setRecordForm((current) => ({ ...current, namesOffices: event.target.value }))}
                rows={3}
                placeholder="Names/offices involved: officials, board members, departments, vendors, campaigns, staff, or offices"
                className="field resize-none"
              />
              <textarea
                value={recordForm.meetingEvent}
                onChange={(event) => setRecordForm((current) => ({ ...current, meetingEvent: event.target.value }))}
                rows={3}
                placeholder="Meeting, date, vote, event, agenda item, contract, filing, incident, or decision"
                className="field resize-none"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={recordForm.requesterName}
                  onChange={(event) => setRecordForm((current) => ({ ...current, requesterName: event.target.value }))}
                  placeholder="Requester name"
                  className="field"
                />
                <input
                  type="email"
                  value={recordForm.requesterEmail}
                  onChange={(event) => setRecordForm((current) => ({ ...current, requesterEmail: event.target.value }))}
                  placeholder="Requester email"
                  className="field"
                />
                <input
                  value={recordForm.requesterPhone}
                  onChange={(event) => setRecordForm((current) => ({ ...current, requesterPhone: event.target.value }))}
                  placeholder="Requester phone"
                  className="field"
                />
              </div>
              <textarea
                value={recordForm.notes}
                onChange={(event) => setRecordForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                placeholder="Notes: what needs to be checked, why the record matters, preferred format, fee limit, or narrowing terms"
                className="field resize-none"
              />
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={recordForm.shareWithRepWatchr}
                  onChange={(event) => setRecordForm((current) => ({ ...current, shareWithRepWatchr: event.target.checked }))}
                  className="mt-1"
                />
                Share this request with RepWatchr admin review. Leave unchecked to keep it private to your dashboard.
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={saveRecordsRequest} className="primary-button">
                  Save Draft
                </button>
                <button type="button" onClick={() => copyText(activeRecordsDraftText)} className="secondary-button">
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadTextFile(`${safeFileName(recordForm.agency || "records-request")}-${recordPreviewKey}.txt`, activeRecordsDraftText)}
                  className="secondary-button"
                >
                  Export
                </button>
              </div>
            </div>
          </ToolPanel>
          <ToolPanel eyebrow="Request status" title="Saved requests">
            <div className="mb-3 flex flex-wrap gap-2">
              {recordDraftViews.map((view) => (
                <button
                  key={view.value}
                  type="button"
                  onClick={() => setRecordPreviewKey(view.value)}
                  className={recordPreviewKey === view.value ? "primary-button" : "secondary-button"}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <textarea readOnly value={activeRecordsDraftText} rows={16} className="field min-h-80 resize-none font-mono text-xs" />
            <SavedRecordsRequests requests={recordsRequests} onStatusChange={updateRecordsRequestStatus} />
          </ToolPanel>
        </section>

        <section id="timeline" className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ToolPanel eyebrow="Timeline Starter" title="Dates, claims, source links, gaps">
            <div className="grid gap-3">
              <input
                value={timelineForm.title}
                onChange={(event) => setTimelineForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Timeline title"
                className="field"
              />
              <input
                value={timelineForm.jurisdiction}
                onChange={(event) => setTimelineForm((current) => ({ ...current, jurisdiction: event.target.value }))}
                placeholder="Jurisdiction"
                className="field"
              />
              <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                <input
                  type="date"
                  value={timelineEventForm.date}
                  onChange={(event) => setTimelineEventForm((current) => ({ ...current, date: event.target.value }))}
                  className="field"
                />
                <input
                  value={timelineEventForm.claim}
                  onChange={(event) => setTimelineEventForm((current) => ({ ...current, claim: event.target.value }))}
                  placeholder="Claim or event"
                  className="field"
                />
              </div>
              <input
                value={timelineEventForm.sourceLink}
                onChange={(event) => setTimelineEventForm((current) => ({ ...current, sourceLink: event.target.value }))}
                placeholder="Source link"
                className="field"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <textarea
                  value={timelineEventForm.missingProof}
                  onChange={(event) => setTimelineEventForm((current) => ({ ...current, missingProof: event.target.value }))}
                  rows={3}
                  placeholder="Missing proof"
                  className="field resize-none"
                />
                <textarea
                  value={timelineEventForm.nextRecord}
                  onChange={(event) => setTimelineEventForm((current) => ({ ...current, nextRecord: event.target.value }))}
                  rows={3}
                  placeholder="Next record to pull"
                  className="field resize-none"
                />
              </div>
              <button type="button" onClick={addTimelineEvent} className="secondary-button">
                Add Event
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <textarea
                  value={timelineForm.missingProof}
                  onChange={(event) => setTimelineForm((current) => ({ ...current, missingProof: event.target.value }))}
                  rows={3}
                  placeholder="Overall missing proof"
                  className="field resize-none"
                />
                <textarea
                  value={timelineForm.nextRecords}
                  onChange={(event) => setTimelineForm((current) => ({ ...current, nextRecords: event.target.value }))}
                  rows={3}
                  placeholder="Next records to pull"
                  className="field resize-none"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={saveTimelineStarter} className="primary-button">
                  Save Timeline
                </button>
                <button type="button" onClick={() => copyText(timelineDraftText)} className="secondary-button">
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadTextFile(`${safeFileName(timelineForm.title || "timeline")}.md`, timelineDraftText)}
                  className="secondary-button"
                >
                  Export
                </button>
              </div>
            </div>
          </ToolPanel>
          <ToolPanel eyebrow="Timeline preview" title={`${timelineEvents.length} event${timelineEvents.length === 1 ? "" : "s"} staged`}>
            <textarea readOnly value={timelineDraftText} rows={16} className="field min-h-80 resize-none font-mono text-xs" />
            <SavedTimelines timelines={timelines} />
          </ToolPanel>
        </section>

        <section id="faretta-helper" className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ToolPanel eyebrow="Faretta AI Research Helper" title="Ask for source gaps and next records">
            <div className="grid gap-3">
              <textarea
                value={farettaForm.prompt}
                onChange={(event) => setFarettaForm((current) => ({ ...current, prompt: event.target.value }))}
                rows={5}
                placeholder="What are you trying to check?"
                className="field resize-none"
              />
              <textarea
                value={farettaForm.sourceLinks}
                onChange={(event) => setFarettaForm((current) => ({ ...current, sourceLinks: event.target.value }))}
                rows={3}
                placeholder="Source links, one per line"
                className="field resize-none"
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={askFaretta} disabled={farettaLoading} className="primary-button">
                  {farettaLoading ? "Checking..." : "Ask Faretta"}
                </button>
                <button type="button" onClick={saveFarettaNote} className="secondary-button">
                  Save Note
                </button>
                <Link href="/faretta-ai" className="secondary-button text-center">
                  Full Console
                </Link>
              </div>
            </div>
          </ToolPanel>
          <ToolPanel eyebrow="AI note" title="Research output">
            <textarea
              readOnly
              value={farettaReply || "Faretta notes appear here. Save only source gaps, public records to pull, safer wording, and next questions."}
              rows={13}
              className="field min-h-72 resize-none font-mono text-xs"
            />
            <SavedFarettaNotes notes={farettaNotes} />
          </ToolPanel>
        </section>

        <section id="my-submissions" className="mt-5 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
          <ToolPanel eyebrow="My Submissions" title="Review status">
            <div className="grid grid-cols-2 gap-2">
              {["new", "needs_review", "verified", "needs_more_info", "attached_to_profile", "rejected"].map((status) => (
                <Metric key={status} label={statusLabel(status)} value={submissionsByStatus[status] ?? 0} />
              ))}
            </div>
          </ToolPanel>
          <ToolPanel eyebrow="Submitted packets" title="Source queue">
            <div className="grid gap-3">
              {sourceSubmissions.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                  No submitted source packets are tied to this account yet.
                </p>
              ) : (
                sourceSubmissions.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-blue-950">{item.source_title || item.target_name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {item.target_name} / {formatDate(item.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-black text-blue-700 hover:text-red-700">
                      Open source
                    </a>
                  </div>
                ))
              )}
            </div>
          </ToolPanel>
        </section>

        <section id="paid-services" className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Upgrade / paid services</p>
              <h2 className="mt-2 text-2xl font-black text-blue-950">When the record needs more work</h2>
            </div>
            <Link href="/services" className="secondary-button text-center">
              All Services
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {paidServices.map((service) => (
              <Link key={service.slug} href={`/services/${service.slug}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                    {service.eyebrow}
                  </span>
                  <span className="text-lg font-black text-red-700">{service.priceLabel}</span>
                </div>
                <h3 className="mt-3 text-lg font-black text-blue-950">{service.name}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{service.summary}</p>
              </Link>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TierFeatureCard
              title="Alerts / digests"
              minimumTier="watcher_pro"
              active={tierMeetsMinimum(membershipTier.id, "watcher_pro")}
              message="Watcher Pro expands saved targets into alerts and digests."
            />
            <TierFeatureCard
              title="Export tools"
              minimumTier="watcher_pro"
              active={tierMeetsMinimum(membershipTier.id, "watcher_pro")}
              message="Watcher Pro unlocks larger packet/request export workflows."
            />
            <TierFeatureCard
              title="Race/source trackers"
              minimumTier="research_desk"
              active={tierMeetsMinimum(membershipTier.id, "research_desk")}
              message="Research Desk adds structured trackers for active races and source lanes."
            />
            <TierFeatureCard
              title="Team workspace"
              minimumTier="research_desk"
              active={tierMeetsMinimum(membershipTier.id, "research_desk")}
              message="Research Desk is the tier for shared team review and priority source work."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function LeadRepVerificationCard({
  sourceSubmissions,
  reviewItems,
  proofDrafts,
}: {
  sourceSubmissions: number;
  reviewItems: number;
  proofDrafts: number;
}) {
  return (
    <section className="mt-4 rounded-lg border border-blue-200 bg-blue-950 p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">LeadRep agent bus</p>
          <h2 className="mt-2 text-2xl font-black leading-tight">Proof and verification results</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
            GitHub Actions writes dry-run handoffs to Supabase and GitHub before any Grok API call, public update,
            outreach, or package promotion. Weak signals stay marked as candidates until reviewed.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm lg:w-[440px]">
          <Metric label="Submissions" value={sourceSubmissions} />
          <Metric label="Review queue" value={reviewItems} />
          <Metric label="Proof drafts" value={proofDrafts} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ["Agent runs", "Stored server-side in Supabase with RLS enabled and no public policies."],
          ["Package ideas", "Candidate revenue packages only; no buyer-facing offer until approved."],
          ["Verification signals", "Source, confidence, and next verification step required before use."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-white/15 bg-white/10 p-3">
            <p className="text-sm font-black">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xl font-black text-blue-950">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function ToolPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MembershipTierCard({
  tier,
  active,
  billingEnabled,
}: {
  tier: MembershipTier;
  active: boolean;
  billingEnabled: boolean;
}) {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-blue-950">{tier.name}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{tier.priceLabel}</p>
        </div>
        {active ? (
          <span className="rounded-full bg-blue-950 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white">
            Active
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-slate-600">{tier.summary}</p>
      <div className="mt-3 grid gap-1">
        {tier.features.slice(0, 4).map((feature) => (
          <p key={feature} className="text-xs font-semibold leading-5 text-slate-700">
            - {feature}
          </p>
        ))}
      </div>
      {!active ? (
        <Link href={billingEnabled ? tier.upgradeHref : "#paid-services"} className="mt-3 inline-flex text-xs font-black uppercase tracking-wide text-red-700 hover:text-blue-900">
          {billingEnabled ? "Upgrade path" : "Staged for later"}
        </Link>
      ) : null}
    </div>
  );
}

function UpgradePrompt({ title, message, href }: { title: string; message: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-950 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-white">
      <span className="block text-xs font-black uppercase tracking-wide text-blue-900">{title}</span>
      {message}
    </Link>
  );
}

function TierFeatureCard({
  title,
  minimumTier,
  active,
  message,
}: {
  title: string;
  minimumTier: MembershipTierId;
  active: boolean;
  message: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-blue-950">{title}</p>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${active ? "bg-emerald-100 text-emerald-900" : "bg-white text-amber-900"}`}>
          {active ? "Available" : "Upgrade"}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-700">{message}</p>
      {!active ? (
        <p className="mt-3 text-xs font-black uppercase tracking-wide text-amber-900">
          {membershipUpgradeMessage(minimumTier)}
        </p>
      ) : null}
    </div>
  );
}

function SavedRecordsRequests({
  requests,
  onStatusChange,
}: {
  requests: RecordsRequest[];
  onStatusChange: (id: string, status: RecordsRequest["status"]) => void;
}) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3">
      {requests.slice(0, 5).map((request) => (
        <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-black text-blue-950">{request.agency}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {request.state || "State pending"} / {request.recordType} / {formatDate(request.createdAt)}
              </p>
              {request.meetingEvent || request.namesOffices ? (
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">
                  {[request.meetingEvent, request.namesOffices].filter(Boolean).join(" / ")}
                </p>
              ) : null}
              {request.shareWithRepWatchr ? (
                <span className="mt-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900">
                  Shared with RepWatchr
                </span>
              ) : null}
            </div>
            <div className="grid gap-2">
              <select
                value={request.status}
                onChange={(event) => onStatusChange(request.id, event.target.value as RecordsRequest["status"])}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-blue-950"
              >
                {recordRequestStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => copyText(request.emailText || request.draftText)} className="mini-button">
                Copy Email
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SavedTimelines({ timelines }: { timelines: TimelineStarter[] }) {
  if (timelines.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3">
      {timelines.slice(0, 4).map((timeline) => (
        <div key={timeline.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="font-black text-blue-950">{timeline.title}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {timeline.events.length} event{timeline.events.length === 1 ? "" : "s"} / {formatDate(timeline.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

function SavedFarettaNotes({ notes }: { notes: FarettaNote[] }) {
  if (notes.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3">
      {notes.slice(0, 4).map((note) => (
        <div key={note.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="font-black text-blue-950">{note.prompt}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {note.sourceLinks.length} source link{note.sourceLinks.length === 1 ? "" : "s"} / {formatDate(note.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
