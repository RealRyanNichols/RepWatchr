"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";
import type { SuperAdminSnapshot, SuperAdminWatchItem } from "@/lib/superadmin-data";

type TabId = "overview" | "watch" | "cases" | "intake" | "questions" | "decisions" | "analytics";

type LiveCount = {
  label: string;
  table: string;
  count: number | null;
  status: "green" | "yellow" | "red";
  detail: string;
};

type RecentCase = {
  id: string;
  title: string;
  status: string;
  priority: string;
  visibility_status: string;
  source_site: string | null;
  created_at: string;
};

type RecentQuestion = {
  id: string;
  target_name: string;
  status: string;
  visibility_status: string;
  question: string;
  created_at: string;
};

type OfficeTask = {
  id: string;
  title: string;
  severity: "red" | "yellow" | "green";
  status: string;
  category: string;
  created_at: string;
};

type OperatorAsk = {
  id: string;
  question: string;
  status: string;
  options: string[];
  selected_option: string | null;
  response_notes: string | null;
  created_at: string;
};

type PageViewSummary = {
  period: string;
  page_views: number;
  unique_daily_visitors: number;
  last_view_at: string | null;
};

type CaseForm = {
  title: string;
  summary: string;
  priority: "red" | "yellow" | "green";
  targetType: string;
  targetName: string;
  targetId: string;
  districtSlug: string;
  profileUrl: string;
  question: string;
};

type QuestionForm = {
  targetType: string;
  targetName: string;
  targetId: string;
  districtSlug: string;
  question: string;
  dueDate: string;
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "watch", label: "Must Watch" },
  { id: "cases", label: "Case Builder" },
  { id: "intake", label: "Faretta Intake" },
  { id: "questions", label: "Profile Questions" },
  { id: "decisions", label: "Decision Desk" },
  { id: "analytics", label: "Analytics" },
];

const decisionCards = [
  {
    id: "vercel-analytics-bridge",
    question: "How should RepWatchr pull page views and unique views into this office?",
    context: "Vercel already tracks page views. RepWatchr needs a durable export path before those numbers can sit beside Supabase counts.",
    options: ["Use Vercel dashboard for now", "Add Vercel API token", "Export weekly CSV"],
  },
  {
    id: "faretta-intake-source",
    question: "How should Faretta.Legal send case submissions into RepWatchr?",
    context: "The endpoint accepts webhook posts with a shared secret, title, summary, targets, evidence links, and submitter notes.",
    options: ["Webhook with shared secret", "Manual CSV import", "Supabase direct insert"],
  },
  {
    id: "publication-threshold",
    question: "What review threshold should trigger a public case file?",
    context: "The office can hold, send for response, publish with revision, or escalate into an article and case file after review.",
    options: ["Source-backed public record only", "Two-source minimum", "Admin decides case by case"],
  },
];

const emptyCaseForm: CaseForm = {
  title: "",
  summary: "",
  priority: "yellow",
  targetType: "school_board",
  targetName: "",
  targetId: "",
  districtSlug: "",
  profileUrl: "",
  question: "",
};

const emptyQuestionForm: QuestionForm = {
  targetType: "official",
  targetName: "",
  targetId: "",
  districtSlug: "",
  question: "",
  dueDate: "",
};

const previewLiveCounts: LiveCount[] = [
  { label: "Citizen votes", table: "citizen_votes", count: 1284, status: "green", detail: "Approve and disapprove votes from public profiles." },
  { label: "Citizen grades", table: "citizen_grades", count: 412, status: "green", detail: "A-F accountability grades attached to officials and candidates." },
  { label: "Comments", table: "comments", count: 96, status: "yellow", detail: "Public discussion rows waiting on moderation rules." },
  { label: "Faretta interactions", table: "faretta_interactions", count: 238, status: "green", detail: "Search, chat, note, and prompt-button interactions." },
  { label: "Profile activation requests", table: "profile_claims", count: 7, status: "yellow", detail: "24 total profile_claims rows, pending shown here." },
  { label: "Accountability cases", table: "accountability_cases", count: 18, status: "yellow", detail: "Case-builder and Faretta.Legal intake rows." },
  { label: "Faretta form submissions", table: "faretta_case_submissions", count: 6, status: "yellow", detail: "Cases received from Faretta.Legal intake." },
  { label: "Profile questions", table: "profile_questions", count: 31, status: "yellow", detail: "Questions attached to target profiles." },
  { label: "Open office tasks", table: "operator_tasks", count: 14, status: "yellow", detail: "Ryan-facing to-dos tracked inside the office." },
  { label: "Open asks for Ryan", table: "operator_asks", count: 5, status: "yellow", detail: "Clickable choices that replace numbered chat replies." },
  { label: "RepWatchr page views", table: "site_page_views", count: 3487, status: "green", detail: "Owned public-page views collected without storing raw IPs or raw user agents." },
  { label: "Unique daily visitors", table: "site_unique_daily_visitors", count: 1194, status: "green", detail: "Distinct daily anonymous visitor hashes from the owned tracker." },
];

const previewCases: RecentCase[] = [
  {
    id: "preview-case-1",
    title: "Tyler ISD vendor conflict review",
    status: "intake_review",
    priority: "red",
    visibility_status: "private_review",
    source_site: "faretta_legal",
    created_at: "2026-04-29T14:10:00.000Z",
  },
  {
    id: "preview-case-2",
    title: "Public-records delay tracker",
    status: "question_sent",
    priority: "yellow",
    visibility_status: "sent_to_target",
    source_site: "repwatchr_admin",
    created_at: "2026-04-29T12:30:00.000Z",
  },
  {
    id: "preview-case-3",
    title: "School-board source gap bundle",
    status: "held_private",
    priority: "green",
    visibility_status: "held",
    source_site: "repwatchr_admin",
    created_at: "2026-04-28T20:15:00.000Z",
  },
];

const previewQuestions: RecentQuestion[] = [
  {
    id: "preview-question-1",
    target_name: "Tyler ISD Board Member",
    status: "needs_review",
    visibility_status: "private_review",
    question: "Please identify any public vote, agenda item, contract, or disclosure tied to the vendor relationship flagged in the submission.",
    created_at: "2026-04-29T14:12:00.000Z",
  },
  {
    id: "preview-question-2",
    target_name: "County records office",
    status: "sent",
    visibility_status: "sent_to_target",
    question: "What is the documented reason for the delayed public-records response, and what date was the request first received?",
    created_at: "2026-04-29T11:02:00.000Z",
  },
];

const previewTasks: OfficeTask[] = [
  {
    id: "preview-task-1",
    title: "Finish Dallas-area school-board source review",
    severity: "red",
    status: "open",
    category: "Texas buildout",
    created_at: "2026-04-29T13:45:00.000Z",
  },
  {
    id: "preview-task-2",
    title: "Connect Vercel Analytics export to office counts",
    severity: "yellow",
    status: "open",
    category: "Analytics",
    created_at: "2026-04-29T10:20:00.000Z",
  },
  {
    id: "preview-task-3",
    title: "Review pending profile activation requests",
    severity: "yellow",
    status: "open",
    category: "Claims",
    created_at: "2026-04-28T21:05:00.000Z",
  },
];

const previewAsks: OperatorAsk[] = [
  {
    id: "preview-ask-1",
    question: "Should public case files require two source-backed records before publication?",
    status: "open",
    options: ["Two-source minimum", "Admin decides case by case", "Public record only"],
    selected_option: null,
    response_notes: null,
    created_at: "2026-04-29T09:35:00.000Z",
  },
  {
    id: "preview-ask-2",
    question: "Where should profile activation requests land first?",
    status: "open",
    options: ["Claims queue", "SuperAdmin overview", "Email digest"],
    selected_option: null,
    response_notes: null,
    created_at: "2026-04-28T18:00:00.000Z",
  },
];

function previewId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function formatCount(value: number | null) {
  if (value === null) return "Needs migration";
  return value.toLocaleString();
}

function toneClasses(status: "red" | "yellow" | "green") {
  return {
    red: "border-red-200 bg-red-50 text-red-900",
    yellow: "border-amber-200 bg-amber-50 text-amber-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[status];
}

function toneDot(status: "red" | "yellow" | "green") {
  return {
    red: "bg-red-600",
    yellow: "bg-amber-500",
    green: "bg-emerald-600",
  }[status];
}

function Glyph({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-grid h-5 w-5 place-items-center rounded-full border border-current text-[10px] font-black ${className}`}>
      {value}
    </span>
  );
}

async function countRows(
  supabase: ReturnType<typeof createClient>,
  table: string,
  filter?: { column: string; value: string },
) {
  const query = filter
    ? supabase.from(table).select("*", { count: "exact", head: true }).eq(filter.column, filter.value)
    : supabase.from(table).select("*", { count: "exact", head: true });
  const { count, error } = await query;
  if (error) return { count: null, error: error.message };
  return { count: count ?? 0, error: "" };
}

function officeReply(input: string, snapshot: SuperAdminSnapshot, counts: LiveCount[]) {
  const text = input.toLowerCase();
  const cases = counts.find((item) => item.table === "accountability_cases")?.count ?? 0;
  const claims = counts.find((item) => item.table === "profile_claims")?.count ?? 0;
  const questions = counts.find((item) => item.table === "profile_questions")?.count ?? 0;

  if (!input.trim()) {
    return `Current read: ${snapshot.visibleProfiles.toLocaleString()} profiles are visible, ${snapshot.openResearchItems.toLocaleString()} research items remain open, ${claims} activation requests are pending, and ${cases} accountability cases are tracked.`;
  }
  if (text.includes("page") || text.includes("view") || text.includes("analytics")) {
    return "Next move: connect a Vercel Analytics export or token. Supabase counts are live here now, but page views and unique views need that bridge before they can be live office numbers.";
  }
  if (text.includes("case") || text.includes("faretta")) {
    return `Next move: use Case Builder or the /api/faretta/intake webhook. The case stays private until you choose send, hold, publish, or escalate. Current cases: ${cases}.`;
  }
  if (text.includes("question") || text.includes("answer")) {
    return `Next move: attach a profile question to the official, district, or school board member. Current profile questions: ${questions}.`;
  }
  if (text.includes("school") || text.includes("texas")) {
    return `Texas buildout read: ${snapshot.schoolBoardProfiles.toLocaleString()} school-board dossiers across ${snapshot.schoolBoardDistricts} districts. Completion is ${snapshot.schoolBoardCompletion}%.`;
  }
  return "The clean next move is to turn that into a task, case, or profile question so it becomes trackable inside the office.";
}

export default function SuperAdminOfficeClient({
  initialSnapshot,
  initialWatchItems,
  previewMode = false,
}: {
  initialSnapshot: SuperAdminSnapshot;
  initialWatchItems: SuperAdminWatchItem[];
  previewMode?: boolean;
}) {
  const { user, roles, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [liveCounts, setLiveCounts] = useState<LiveCount[]>(previewMode ? previewLiveCounts : []);
  const [recentCases, setRecentCases] = useState<RecentCase[]>(previewMode ? previewCases : []);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>(previewMode ? previewQuestions : []);
  const [tasks, setTasks] = useState<OfficeTask[]>(previewMode ? previewTasks : []);
  const [asks, setAsks] = useState<OperatorAsk[]>(previewMode ? previewAsks : []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [command, setCommand] = useState("");
  const [reply, setReply] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("Texas buildout");
  const [taskSeverity, setTaskSeverity] = useState<"red" | "yellow" | "green">("yellow");
  const [caseForm, setCaseForm] = useState<CaseForm>(emptyCaseForm);
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm);
  const [pickedDefaults, setPickedDefaults] = useState<Record<string, string>>({});

  const isOperator = previewMode || roles.some((role) => ["admin", "reviewer", "researcher"].includes(role));

  useEffect(() => {
    if (previewMode) return;
    if (loading || !user || !isOperator) return;
    let mounted = true;

    async function loadOfficeData() {
      const [
        votes,
        grades,
        comments,
        interactions,
        claims,
        pendingClaims,
        cases,
        farettaCases,
        questions,
        openTasks,
        openAsks,
        pageViews,
        caseRows,
        questionRows,
        taskRows,
        askRows,
      ] = await Promise.all([
        countRows(supabase, "citizen_votes"),
        countRows(supabase, "citizen_grades"),
        countRows(supabase, "comments"),
        countRows(supabase, "faretta_interactions"),
        countRows(supabase, "profile_claims"),
        countRows(supabase, "profile_claims", { column: "status", value: "pending" }),
        countRows(supabase, "accountability_cases"),
        countRows(supabase, "accountability_cases", { column: "source_site", value: "faretta_legal" }),
        countRows(supabase, "profile_questions"),
        countRows(supabase, "operator_tasks", { column: "status", value: "open" }),
        countRows(supabase, "operator_asks", { column: "status", value: "open" }),
        supabase.from("site_page_view_summary").select("period, page_views, unique_daily_visitors, last_view_at").eq("period", "all_time").maybeSingle(),
        supabase.from("accountability_cases").select("id, title, status, priority, visibility_status, source_site, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("profile_questions").select("id, target_name, status, visibility_status, question, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("operator_tasks").select("id, title, severity, status, category, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("operator_asks").select("id, question, status, options, selected_option, response_notes, created_at").order("created_at", { ascending: false }).limit(8),
      ]);

      if (!mounted) return;

      const pageViewSummary = pageViews.error ? null : pageViews.data as PageViewSummary | null;
      const pageViewsError = pageViews.error?.message;
      setLiveCounts([
        { label: "Citizen votes", table: "citizen_votes", count: votes.count, status: votes.count && votes.count > 0 ? "green" : "yellow", detail: votes.error || "Rows from approve and disapprove voting." },
        { label: "Citizen grades", table: "citizen_grades", count: grades.count, status: grades.count && grades.count > 0 ? "green" : "yellow", detail: grades.error || "Rows from A-F grading." },
        { label: "Comments", table: "comments", count: comments.count, status: comments.count && comments.count > 0 ? "green" : "yellow", detail: comments.error || "Public discussion rows." },
        { label: "Faretta interactions", table: "faretta_interactions", count: interactions.count, status: interactions.count === null ? "red" : interactions.count > 0 ? "green" : "yellow", detail: interactions.error || "Search, chat, note, and prompt-button interactions." },
        { label: "Profile activation requests", table: "profile_claims", count: pendingClaims.count, status: pendingClaims.count === null ? "red" : pendingClaims.count > 0 ? "yellow" : "green", detail: pendingClaims.error || `${claims.count ?? 0} total profile_claims rows, pending shown here.` },
        { label: "Accountability cases", table: "accountability_cases", count: cases.count, status: cases.count === null ? "red" : cases.count > 0 ? "yellow" : "green", detail: cases.error || "Case-builder and Faretta.Legal intake rows." },
        { label: "Faretta form submissions", table: "faretta_case_submissions", count: farettaCases.count, status: farettaCases.count === null ? "red" : farettaCases.count > 0 ? "yellow" : "green", detail: farettaCases.error || "Cases received from Faretta.Legal intake." },
        { label: "Profile questions", table: "profile_questions", count: questions.count, status: questions.count === null ? "red" : questions.count > 0 ? "yellow" : "green", detail: questions.error || "Questions attached to target profiles." },
        { label: "Open office tasks", table: "operator_tasks", count: openTasks.count, status: openTasks.count === null ? "red" : openTasks.count > 0 ? "yellow" : "green", detail: openTasks.error || "Ryan-facing to-dos tracked inside the office." },
        { label: "Open asks for Ryan", table: "operator_asks", count: openAsks.count, status: openAsks.count === null ? "red" : openAsks.count > 0 ? "yellow" : "green", detail: openAsks.error || "Clickable choices that replace numbered chat replies." },
        {
          label: "RepWatchr page views",
          table: "site_page_views",
          count: pageViewSummary?.page_views ?? null,
          status: pageViews.error ? "red" : pageViewSummary?.page_views ? "green" : "yellow",
          detail: pageViewsError || "Owned public-page views. Raw IP addresses and raw user agents are not stored.",
        },
        {
          label: "Unique daily visitors",
          table: "site_unique_daily_visitors",
          count: pageViewSummary?.unique_daily_visitors ?? null,
          status: pageViews.error ? "red" : pageViewSummary?.unique_daily_visitors ? "green" : "yellow",
          detail: pageViewsError || "Distinct daily anonymous visitor hashes from public-page traffic.",
        },
      ]);
      if (!caseRows.error) setRecentCases((caseRows.data ?? []) as RecentCase[]);
      if (!questionRows.error) setRecentQuestions((questionRows.data ?? []) as RecentQuestion[]);
      if (!taskRows.error) setTasks((taskRows.data ?? []) as OfficeTask[]);
      if (!askRows.error) {
        const normalized = ((askRows.data ?? []) as Array<Omit<OperatorAsk, "options"> & { options: unknown }>).map((ask) => ({
          ...ask,
          options: Array.isArray(ask.options) ? ask.options.map(String) : [],
        }));
        setAsks(normalized);
      }
    }

    loadOfficeData();
    const interval = window.setInterval(loadOfficeData, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [isOperator, loading, previewMode, supabase, user]);

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setError("");
    if (previewMode) {
      setTasks((current) => [{
        id: previewId("preview-task"),
        title: taskTitle.trim(),
        category: taskCategory.trim() || "General",
        severity: taskSeverity,
        status: "open",
        created_at: new Date().toISOString(),
      }, ...current]);
      setTaskTitle("");
      setMessage("Preview task added. Real saves still require SuperAdmin access.");
      return;
    }
    if (!user) return;
    const { data, error: insertError } = await supabase.from("operator_tasks").insert({
      title: taskTitle.trim(),
      category: taskCategory.trim() || "General",
      severity: taskSeverity,
      status: "open",
      created_by: user.id,
    }).select("id, title, severity, status, category, created_at").single();
    if (insertError) return setError(insertError.message);
    setTasks((current) => [data as OfficeTask, ...current]);
    setTaskTitle("");
    setMessage("Office task added.");
  }

  async function addCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!caseForm.title.trim() || !caseForm.summary.trim()) return;
    setError("");
    if (previewMode) {
      const newCase: RecentCase = {
        id: previewId("preview-case"),
        title: caseForm.title.trim(),
        status: "intake_review",
        priority: caseForm.priority,
        visibility_status: "private_review",
        source_site: "repwatchr_preview",
        created_at: new Date().toISOString(),
      };
      setRecentCases((current) => [newCase, ...current]);
      if (caseForm.question.trim() && caseForm.targetName.trim()) {
        setRecentQuestions((current) => [{
          id: previewId("preview-question"),
          target_name: caseForm.targetName.trim(),
          status: "needs_review",
          visibility_status: "private_review",
          question: caseForm.question.trim(),
          created_at: new Date().toISOString(),
        }, ...current]);
      }
      setCaseForm(emptyCaseForm);
      setMessage("Preview case created. Real cases stay private until an operator reviews them.");
      setReply("Preview case created. Next move: verify sources, attach the target profile, then decide whether to send a question for response or hold it private.");
      return;
    }
    if (!user) return;
    const { data: newCase, error: caseError } = await supabase.from("accountability_cases").insert({
      title: caseForm.title.trim(),
      summary: caseForm.summary.trim(),
      source_site: "repwatchr_admin",
      status: "intake_review",
      priority: caseForm.priority,
      visibility_status: "private_review",
      created_by: user.id,
    }).select("id, title, status, priority, visibility_status, source_site, created_at").single();
    if (caseError || !newCase) return setError(caseError?.message ?? "Could not create case.");

    if (caseForm.targetName.trim()) {
      await supabase.from("accountability_case_entities").insert({
        case_id: newCase.id,
        entity_type: caseForm.targetType,
        entity_id: caseForm.targetId.trim() || null,
        entity_name: caseForm.targetName.trim(),
        district_slug: caseForm.districtSlug.trim() || null,
        profile_url: caseForm.profileUrl.trim() || null,
        involvement: "subject_of_review",
      });
    }
    if (caseForm.question.trim() && caseForm.targetName.trim()) {
      await supabase.from("profile_questions").insert({
        case_id: newCase.id,
        target_type: caseForm.targetType,
        target_id: caseForm.targetId.trim() || null,
        district_slug: caseForm.districtSlug.trim() || null,
        target_name: caseForm.targetName.trim(),
        question: caseForm.question.trim(),
        status: "needs_review",
        visibility_status: "private_review",
        created_by: user.id,
      });
    }
    setRecentCases((current) => [newCase as RecentCase, ...current]);
    setCaseForm(emptyCaseForm);
    setMessage("Case created and indexed for review.");
    setReply("Case created. Next move: verify sources, attach the target profile, then decide whether to send a question for response or hold it private.");
  }

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!questionForm.targetName.trim() || !questionForm.question.trim()) return;
    setError("");
    if (previewMode) {
      setRecentQuestions((current) => [{
        id: previewId("preview-question"),
        target_name: questionForm.targetName.trim(),
        status: "needs_review",
        visibility_status: "private_review",
        question: questionForm.question.trim(),
        created_at: new Date().toISOString(),
      }, ...current]);
      setQuestionForm(emptyQuestionForm);
      setMessage("Preview profile question created.");
      return;
    }
    if (!user) return;
    const { data, error: insertError } = await supabase.from("profile_questions").insert({
      target_type: questionForm.targetType,
      target_id: questionForm.targetId.trim() || null,
      district_slug: questionForm.districtSlug.trim() || null,
      target_name: questionForm.targetName.trim(),
      question: questionForm.question.trim(),
      due_at: questionForm.dueDate ? new Date(questionForm.dueDate).toISOString() : null,
      status: "needs_review",
      visibility_status: "private_review",
      created_by: user.id,
    }).select("id, target_name, status, visibility_status, question, created_at").single();
    if (insertError) return setError(insertError.message);
    setRecentQuestions((current) => [data as RecentQuestion, ...current]);
    setQuestionForm(emptyQuestionForm);
    setMessage("Profile question created.");
  }

  async function updateCase(caseId: string, status: string, visibilityStatus: string) {
    setError("");
    if (previewMode) {
      setRecentCases((current) => current.map((item) => item.id === caseId ? { ...item, status, visibility_status: visibilityStatus } : item));
      setMessage("Preview case decision updated.");
      return;
    }
    if (!user) return;
    const { error: updateError } = await supabase.from("accountability_cases").update({
      status,
      visibility_status: visibilityStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", caseId);
    if (updateError) return setError(updateError.message);

    const questionUpdate =
      status === "question_sent"
        ? { status: "sent", visibility_status: "sent_to_target", sent_at: new Date().toISOString() }
        : status === "approved_public"
          ? { visibility_status: "public" }
          : status === "held_private"
            ? { status: "closed", visibility_status: "held" }
            : status === "escalate_article"
              ? { status: "escalate", visibility_status: "private_review" }
              : null;
    if (questionUpdate) await supabase.from("profile_questions").update(questionUpdate).eq("case_id", caseId);

    setRecentCases((current) => current.map((item) => item.id === caseId ? { ...item, status, visibility_status: visibilityStatus } : item));
    setMessage("Case decision updated.");
  }

  async function saveDecision(question: string, context: string, options: string[], option: string) {
    setPickedDefaults((current) => ({ ...current, [question]: option }));
    setReply(`Saved decision: ${option}.`);
    if (previewMode) {
      setAsks((current) => [{
        id: previewId("preview-ask"),
        question,
        status: "answered",
        options,
        selected_option: option,
        response_notes: context,
        created_at: new Date().toISOString(),
      }, ...current]);
      return;
    }
    if (!user) return;
    const { data, error: insertError } = await supabase.from("operator_asks").insert({
      question,
      context,
      options,
      selected_option: option,
      response_notes: "Selected from built-in SuperAdmin decision card.",
      status: "answered",
      created_by: user.id,
      answered_by: user.id,
    }).select("id, question, status, options, selected_option, response_notes, created_at").single();
    if (insertError) return setError(insertError.message);
    const saved = data as Omit<OperatorAsk, "options"> & { options: unknown };
    setAsks((current) => [{ ...saved, options: Array.isArray(saved.options) ? saved.options.map(String) : [] }, ...current]);
  }

  async function answerAsk(askId: string, option: string) {
    if (previewMode) {
      setAsks((current) => current.map((ask) => ask.id === askId ? { ...ask, selected_option: option, status: "answered" } : ask));
      setMessage("Preview decision saved.");
      return;
    }
    if (!user) return;
    const { error: updateError } = await supabase.from("operator_asks").update({
      selected_option: option,
      status: "answered",
      answered_by: user.id,
    }).eq("id", askId);
    if (updateError) return setError(updateError.message);
    setAsks((current) => current.map((ask) => ask.id === askId ? { ...ask, selected_option: option, status: "answered" } : ask));
    setMessage("Decision saved.");
  }

  async function addAsk(question: string, options: string[]) {
    if (!question.trim()) return;
    if (previewMode) {
      setAsks((current) => [{
        id: previewId("preview-ask"),
        question: question.trim(),
        status: "open",
        options,
        selected_option: null,
        response_notes: null,
        created_at: new Date().toISOString(),
      }, ...current]);
      setMessage("Preview decision card added.");
      return;
    }
    if (!user) return;
    const { data, error: insertError } = await supabase.from("operator_asks").insert({
      question: question.trim(),
      options,
      status: "open",
      created_by: user.id,
    }).select("id, question, status, options, selected_option, response_notes, created_at").single();
    if (insertError) return setError(insertError.message);
    const saved = data as Omit<OperatorAsk, "options"> & { options: unknown };
    setAsks((current) => [{ ...saved, options: Array.isArray(saved.options) ? saved.options.map(String) : [] }, ...current]);
    setMessage("Decision card added.");
  }

  if (!previewMode && loading) return <div className="mx-auto max-w-7xl px-4 py-16"><div className="h-96 animate-pulse rounded-3xl bg-gray-100" /></div>;

  if (!previewMode && (!user || !isOperator)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Glyph value="A" className="mx-auto h-10 w-10 text-base text-blue-900" />
        <h1 className="mt-4 text-2xl font-black text-gray-950">SuperAdmin access required</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">This office requires an admin, reviewer, or researcher role in Supabase.</p>
      </div>
    );
  }

  const pendingClaims = liveCounts.find((item) => item.table === "profile_claims")?.count;
  const cases = liveCounts.find((item) => item.table === "accountability_cases")?.count;
  const questions = liveCounts.find((item) => item.table === "profile_questions")?.count;

  return (
    <div className="bg-slate-950 text-white">
      {previewMode ? (
        <div className="border-b border-amber-300/30 bg-amber-300 px-4 py-3 text-center text-sm font-black text-slate-950">
          Preview mode: mock office data only. The real SuperAdmin office still requires an admin, reviewer, or researcher role.
        </div>
      ) : null}
      <section className="border-b border-white/10 bg-[linear-gradient(135deg,#06142f_0%,#0f2f57_55%,#7f1d1d_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-200">RepWatchr SuperAdmin</p>
              <h1 className="mt-2 text-3xl font-black sm:text-5xl">Accountability office</h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-50/80">Buildout progress, live review queues, case intake, profile questions, Ryan decision cards, and source-backed escalation in one workspace.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/buildout" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">Buildout</Link>
              <Link href="/admin/claims" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-black text-white hover:bg-white/10">Claim queue</Link>
              <Link href="/admin/content-review" className="rounded-xl border border-white/25 px-4 py-3 text-sm font-black text-white hover:bg-white/10">Content review</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric label="Profiles live" value={initialSnapshot.visibleProfiles.toLocaleString()} detail={`${initialSnapshot.nonSchoolOfficials} officials plus ${initialSnapshot.schoolBoardProfiles} school-board dossiers`} />
            <HeroMetric label="Texas school board" value={`${initialSnapshot.schoolBoardCompletion}%`} detail={`${initialSnapshot.schoolBoardDistricts} districts loaded`} />
            <HeroMetric label="Activation requests" value={formatCount(pendingClaims ?? null)} detail="Pending profile_claims rows" />
            <HeroMetric label="Cases and questions" value={`${formatCount(cases ?? null)} / ${formatCount(questions ?? null)}`} detail="Cases / profile questions" />
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition ${activeTab === tab.id ? "bg-white text-blue-950" : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message ? <Notice tone="green">{message}</Notice> : null}
        {error ? <Notice tone="red">{error}</Notice> : null}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            {activeTab === "overview" ? <Overview snapshot={initialSnapshot} liveCounts={liveCounts} /> : null}
            {activeTab === "watch" ? <Watch watchItems={initialWatchItems} tasks={tasks} taskTitle={taskTitle} taskCategory={taskCategory} taskSeverity={taskSeverity} setTaskTitle={setTaskTitle} setTaskCategory={setTaskCategory} setTaskSeverity={setTaskSeverity} addTask={addTask} /> : null}
            {activeTab === "cases" ? <CaseBuilder caseForm={caseForm} setCaseForm={setCaseForm} addCase={addCase} cases={recentCases} updateCase={updateCase} /> : null}
            {activeTab === "intake" ? <Intake cases={recentCases} /> : null}
            {activeTab === "questions" ? <Questions questionForm={questionForm} setQuestionForm={setQuestionForm} addQuestion={addQuestion} questions={recentQuestions} /> : null}
            {activeTab === "decisions" ? <Decisions asks={asks} pickedDefaults={pickedDefaults} saveDecision={saveDecision} answerAsk={answerAsk} addAsk={addAsk} /> : null}
            {activeTab === "analytics" ? <Analytics liveCounts={liveCounts} snapshot={initialSnapshot} /> : null}
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2"><Glyph value="R" className="text-blue-200" /><h2 className="text-lg font-black">Office reply</h2></div>
              <label className="mt-4 block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-300">Type what you want to study</span>
                <textarea value={command} onChange={(event) => setCommand(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm font-semibold leading-6 text-white outline-none focus:border-blue-300" placeholder="Example: show me the next case review move" />
              </label>
              <button type="button" onClick={() => setReply(officeReply(command, initialSnapshot, liveCounts))} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950 hover:bg-blue-50"><Glyph value="R" className="h-4 w-4" />Talk back</button>
              <p className="mt-4 rounded-xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm font-semibold leading-6 text-blue-50">{reply || "Type a command and I will answer with the next operational move based on dashboard data."}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-black">Red / yellow / green</h2>
              <div className="mt-4 space-y-2">
                {liveCounts.slice(0, 6).map((item) => <StatusRow key={item.table} item={item} />)}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Notice({ tone, children }: { tone: "green" | "red"; children: ReactNode }) {
  const classes = tone === "green" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-red-400/30 bg-red-500/10 text-red-100";
  return <div className={`mb-4 rounded-xl border p-4 text-sm font-bold ${classes}`}>{children}</div>;
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-blue-100">{label}</p><p className="mt-1 text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs font-semibold leading-5 text-blue-50/75">{detail}</p></div>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white p-5 text-slate-950 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-red-700">{eyebrow}</p><h2 className="mt-1 text-2xl font-black">{title}</h2><div className="mt-5">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-600">{label}</span><div className="mt-1">{children}</div></label>;
}

function ReadoutCard({ label, value, detail, glyph }: { label: string; value: string; detail: string; glyph: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3 text-blue-900"><p className="text-xs font-black uppercase tracking-wide">{label}</p><Glyph value={glyph} /></div><p className="mt-2 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></div>;
}

function StatusRow({ item }: { item: LiveCount }) {
  return <div className={`rounded-xl border p-3 text-sm font-bold ${toneClasses(item.status)}`}><div className="flex items-center justify-between gap-3"><span>{item.label}</span><span>{formatCount(item.count)}</span></div><p className="mt-1 text-xs font-semibold opacity-80">{item.detail}</p></div>;
}

function Overview({ snapshot, liveCounts }: { snapshot: SuperAdminSnapshot; liveCounts: LiveCount[] }) {
  return (
    <Panel eyebrow="Progress artifact" title="Live operational readout">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ReadoutCard label="Source URLs" value={snapshot.sourceUrls.toLocaleString()} detail="Loaded public source URLs." glyph="S" />
        <ReadoutCard label="Open research" value={snapshot.openResearchItems.toLocaleString()} detail="Gaps and empty source URLs." glyph="R" />
        <ReadoutCard label="Red flags" value={snapshot.redFlagItems.toLocaleString()} detail="Sourced red-flag rows." glyph="F" />
        <ReadoutCard label="Scorecards" value={snapshot.scorecards.toLocaleString()} detail="Loaded scorecard files." glyph="G" />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {liveCounts.map((item) => (
          <div key={item.table} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${toneDot(item.status)}`} /><p className="font-black">{item.label}</p></div><p className="text-xl font-black text-blue-950">{formatCount(item.count)}</p></div>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Watch({
  watchItems,
  tasks,
  taskTitle,
  taskCategory,
  taskSeverity,
  setTaskTitle,
  setTaskCategory,
  setTaskSeverity,
  addTask,
}: {
  watchItems: SuperAdminWatchItem[];
  tasks: OfficeTask[];
  taskTitle: string;
  taskCategory: string;
  taskSeverity: "red" | "yellow" | "green";
  setTaskTitle: (value: string) => void;
  setTaskCategory: (value: string) => void;
  setTaskSeverity: (value: "red" | "yellow" | "green") => void;
  addTask: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel eyebrow="Must watch" title="Red, yellow, green board">
      <div className="grid gap-3 lg:grid-cols-2">
        {watchItems.map((item) => <Link key={item.id} href={item.href ?? "/admin/superadmin"} className={`block rounded-xl border p-4 transition hover:-translate-y-0.5 ${toneClasses(item.status)}`}><div className="flex items-center justify-between gap-3"><p className="font-black">{item.label}</p><span className="text-lg font-black">{item.value}</span></div><p className="mt-2 text-xs font-semibold leading-5 opacity-80">{item.detail}</p></Link>)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <form onSubmit={addTask} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black">Add a to-do</p>
          <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500" placeholder="Example: Finish Tyler ISD remaining seats" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input value={taskCategory} onChange={(event) => setTaskCategory(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500" placeholder="Category" />
            <select value={taskSeverity} onChange={(event) => setTaskSeverity(event.target.value as "red" | "yellow" | "green")} className="rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-500"><option value="red">Red</option><option value="yellow">Yellow</option><option value="green">Green</option></select>
          </div>
          <button type="submit" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-white hover:bg-red-700"><Glyph value="+" className="h-4 w-4" />Add task</button>
        </form>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black">Recent to-dos</p>
          <div className="mt-3 space-y-2">
            {tasks.length === 0 ? <p className="text-sm font-semibold text-slate-500">No office tasks loaded yet.</p> : null}
            {tasks.map((task) => <div key={task.id} className={`rounded-xl border p-3 text-sm ${toneClasses(task.severity)}`}><div className="flex items-center justify-between gap-3"><span className="font-black">{task.title}</span><span className="text-xs font-black uppercase">{task.status}</span></div><p className="mt-1 text-xs font-semibold opacity-75">{task.category}</p></div>)}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function CaseBuilder({ caseForm, setCaseForm, addCase, cases, updateCase }: { caseForm: CaseForm; setCaseForm: (value: CaseForm) => void; addCase: (event: FormEvent<HTMLFormElement>) => void; cases: RecentCase[]; updateCase: (caseId: string, status: string, visibilityStatus: string) => Promise<void> }) {
  return (
    <Panel eyebrow="Case builder" title="Index a claim, target, and question">
      <form onSubmit={addCase} className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Case title"><input className="input-office" value={caseForm.title} onChange={(event) => setCaseForm({ ...caseForm, title: event.target.value })} placeholder="Short case name" /></Field>
          <Field label="Priority"><select className="input-office" value={caseForm.priority} onChange={(event) => setCaseForm({ ...caseForm, priority: event.target.value as CaseForm["priority"] })}><option value="red">Red, must watch</option><option value="yellow">Yellow, needs review</option><option value="green">Green, background</option></select></Field>
        </div>
        <Field label="Submission summary"><textarea className="input-office min-h-28" value={caseForm.summary} onChange={(event) => setCaseForm({ ...caseForm, summary: event.target.value })} placeholder="What happened, what evidence exists, what is missing." /></Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Target type"><select className="input-office" value={caseForm.targetType} onChange={(event) => setCaseForm({ ...caseForm, targetType: event.target.value })}><option value="official">Official</option><option value="school_board">School board member</option><option value="district">School district</option><option value="government_entity">Government entity</option><option value="organization">Organization</option><option value="other">Other</option></select></Field>
          <Field label="Target name"><input className="input-office" value={caseForm.targetName} onChange={(event) => setCaseForm({ ...caseForm, targetName: event.target.value })} placeholder="Person, school, agency, or entity" /></Field>
          <Field label="Profile or entity ID"><input className="input-office" value={caseForm.targetId} onChange={(event) => setCaseForm({ ...caseForm, targetId: event.target.value })} placeholder="Optional RepWatchr ID" /></Field>
          <Field label="District slug"><input className="input-office" value={caseForm.districtSlug} onChange={(event) => setCaseForm({ ...caseForm, districtSlug: event.target.value })} placeholder="Optional school-board district slug" /></Field>
        </div>
        <Field label="Profile URL"><input className="input-office" value={caseForm.profileUrl} onChange={(event) => setCaseForm({ ...caseForm, profileUrl: event.target.value })} placeholder="/officials/name or /school-boards/district/member" /></Field>
        <Field label="Question to prepare for the profile"><textarea className="input-office min-h-24" value={caseForm.question} onChange={(event) => setCaseForm({ ...caseForm, question: event.target.value })} placeholder="What should the official, district, or entity answer before publication?" /></Field>
        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-black text-white hover:bg-red-700"><Glyph value="C" className="h-4 w-4" />Create case</button>
      </form>
      <RecentCases cases={cases} updateCase={updateCase} />
    </Panel>
  );
}

function Intake({ cases }: { cases: RecentCase[] }) {
  return <Panel eyebrow="Faretta.Legal bridge" title="Webhook and manual intake"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">Webhook endpoint</p><code className="mt-2 block rounded-lg bg-slate-950 px-3 py-3 text-xs font-bold text-blue-100">POST /api/faretta/intake</code><p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Faretta.Legal can post submissions with an x-faretta-secret header. The route creates a private case, links targets, and prepares profile questions for review.</p></div><div className="mt-4 grid gap-3 md:grid-cols-3"><ReadoutCard label="Headers" value="1 secret" detail="x-faretta-secret or Bearer token." glyph="H" /><ReadoutCard label="Body" value="JSON" detail="title, summary, submitter, targets, evidence links." glyph="J" /><ReadoutCard label="Default status" value="Private" detail="No public posting until review." glyph="P" /></div><RecentCases cases={cases} /></Panel>;
}

function Questions({ questionForm, setQuestionForm, addQuestion, questions }: { questionForm: QuestionForm; setQuestionForm: (value: QuestionForm) => void; addQuestion: (event: FormEvent<HTMLFormElement>) => void; questions: RecentQuestion[] }) {
  return (
    <Panel eyebrow="Accountability questions" title="Attach a question to a profile">
      <form onSubmit={addQuestion} className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Target type"><select className="input-office" value={questionForm.targetType} onChange={(event) => setQuestionForm({ ...questionForm, targetType: event.target.value })}><option value="official">Official</option><option value="school_board">School board member</option><option value="district">School district</option><option value="government_entity">Government entity</option><option value="organization">Organization</option></select></Field>
          <Field label="Target name"><input className="input-office" value={questionForm.targetName} onChange={(event) => setQuestionForm({ ...questionForm, targetName: event.target.value })} /></Field>
          <Field label="Target ID"><input className="input-office" value={questionForm.targetId} onChange={(event) => setQuestionForm({ ...questionForm, targetId: event.target.value })} /></Field>
          <Field label="District slug"><input className="input-office" value={questionForm.districtSlug} onChange={(event) => setQuestionForm({ ...questionForm, districtSlug: event.target.value })} /></Field>
        </div>
        <Field label="Question or submission to send"><textarea className="input-office min-h-28" value={questionForm.question} onChange={(event) => setQuestionForm({ ...questionForm, question: event.target.value })} /></Field>
        <Field label="Response due date"><input type="datetime-local" className="input-office" value={questionForm.dueDate} onChange={(event) => setQuestionForm({ ...questionForm, dueDate: event.target.value })} /></Field>
        <button type="submit" className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-black text-white hover:bg-red-700"><Glyph value="S" className="h-4 w-4" />Create question</button>
      </form>
      <div className="mt-6 grid gap-3">
        {questions.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No profile questions loaded yet.</p> : null}
        {questions.map((question) => <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">{question.target_name}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-600">{question.status}</span></div><p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{question.question}</p><p className="mt-2 text-xs font-bold text-slate-500">Visibility: {question.visibility_status}</p></div>)}
      </div>
    </Panel>
  );
}

function Decisions({ asks, pickedDefaults, saveDecision, answerAsk, addAsk }: { asks: OperatorAsk[]; pickedDefaults: Record<string, string>; saveDecision: (question: string, context: string, options: string[], option: string) => Promise<void>; answerAsk: (askId: string, option: string) => Promise<void>; addAsk: (question: string, options: string[]) => Promise<void> }) {
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptions, setCustomOptions] = useState("");
  return (
    <Panel eyebrow="Questions for Ryan" title="Clickable decision desk">
      <div className="grid gap-3">
        {decisionCards.map((card) => <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">{card.question}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{card.context}</p><div className="mt-3 flex flex-wrap gap-2">{card.options.map((option) => <button key={option} type="button" onClick={() => saveDecision(card.question, card.context, card.options, option)} className={`rounded-xl px-3 py-2 text-xs font-black ${pickedDefaults[card.question] === option ? "bg-blue-950 text-white" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-400"}`}>{option}</button>)}</div></div>)}
      </div>
      <form className="mt-6 rounded-xl border border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); const options = customOptions.split(",").map((option) => option.trim()).filter(Boolean); addAsk(customQuestion, options); setCustomQuestion(""); setCustomOptions(""); }}>
        <p className="text-sm font-black">Add a custom decision card</p>
        <input className="input-office mt-3" value={customQuestion} onChange={(event) => setCustomQuestion(event.target.value)} placeholder="Question" />
        <input className="input-office mt-3" value={customOptions} onChange={(event) => setCustomOptions(event.target.value)} placeholder="Options separated by commas" />
        <button type="submit" className="mt-3 rounded-xl bg-blue-950 px-4 py-3 text-sm font-black text-white hover:bg-red-700">Add decision</button>
      </form>
      <div className="mt-6 grid gap-3">
        {asks.map((ask) => <div key={ask.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">{ask.question}</p><p className="mt-1 text-xs font-bold uppercase text-slate-500">Status: {ask.status}{ask.selected_option ? `, selected: ${ask.selected_option}` : ""}</p><div className="mt-3 flex flex-wrap gap-2">{ask.options.map((option) => <button key={option} type="button" onClick={() => answerAsk(ask.id, option)} className={`rounded-full border px-3 py-1 text-xs font-black ${ask.selected_option === option ? "border-blue-900 bg-blue-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"}`}>{option}</button>)}</div></div>)}
      </div>
    </Panel>
  );
}

function Analytics({ liveCounts, snapshot }: { liveCounts: LiveCount[]; snapshot: SuperAdminSnapshot }) {
  const rows: LiveCount[] = [
    ...liveCounts,
    { label: "Vercel page views", table: "vercel_page_views", count: null, status: "yellow", detail: "Vercel Analytics is mounted. Importing its official totals requires a Web Analytics drain or export." },
    { label: "Vercel unique views", table: "vercel_unique_views", count: null, status: "yellow", detail: "Use the Vercel dashboard now, or connect a drain when the project plan supports it." },
  ];
  return <Panel eyebrow="Analytics" title="What is tracked, pulled, or waiting on a bridge"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{rows.map((item) => <div key={item.table} className={`rounded-xl border p-4 ${toneClasses(item.status)}`}><p className="text-xs font-black uppercase tracking-wide">{item.label}</p><p className="mt-1 text-3xl font-black">{formatCount(item.count)}</p><p className="mt-2 text-xs font-semibold leading-5 opacity-80">{item.detail}</p></div>)}</div><div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-black">Static inventory snapshot</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{snapshot.visibleProfiles.toLocaleString()} profiles, {snapshot.sourceUrls.toLocaleString()} source URLs, {snapshot.scorecards} scorecards, {snapshot.fundingSummaries} funding summaries, {snapshot.newsArticles} articles.</p></div></Panel>;
}

function RecentCases({ cases, updateCase }: { cases: RecentCase[]; updateCase?: (caseId: string, status: string, visibilityStatus: string) => Promise<void> }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-black">Recent cases</p>
      <div className="mt-3 grid gap-3">
        {cases.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No cases loaded yet.</p> : null}
        {cases.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">{item.title}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-600">{item.priority}</span></div>
            <p className="mt-1 text-xs font-bold uppercase text-slate-500">{item.status} | {item.visibility_status} | {item.source_site ?? "manual"}</p>
            {updateCase ? <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => updateCase(item.id, "held_private", "held")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-amber-400">Hold private</button><button type="button" onClick={() => updateCase(item.id, "question_sent", "sent_to_target")} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-900 hover:border-blue-500">Send for answer</button><button type="button" onClick={() => updateCase(item.id, "approved_public", "public")} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900 hover:border-emerald-500">Make public</button><button type="button" onClick={() => updateCase(item.id, "escalate_article", "private_review")} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-900 hover:border-red-500">Escalate article</button></div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
