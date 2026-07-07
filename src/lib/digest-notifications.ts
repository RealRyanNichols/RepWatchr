import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanText } from "@/lib/source-submissions";

export const DIGEST_TYPES = [
  "weekly_watchlist",
  "daily_watchlist",
  "source_review_update",
  "records_request_update",
  "contribution_update",
  "race_update",
  "jurisdiction_update",
  "package_update",
  "admin_test",
] as const;

export type DigestType = (typeof DIGEST_TYPES)[number];

export type NotificationPreferences = {
  id?: string;
  user_id: string;
  email: string | null;
  weekly_digest: boolean;
  daily_digest: boolean;
  breaking_alerts: boolean;
  watched_official_updates: boolean;
  watched_race_updates: boolean;
  watched_jurisdiction_updates: boolean;
  source_review_updates: boolean;
  contribution_updates: boolean;
  package_updates: boolean;
  records_request_updates: boolean;
  email_consent_at: string | null;
  unsubscribed_at: string | null;
};

export type DigestPreviewItem = {
  entityType: string;
  entityId: string;
  title: string;
  summary: string;
  url: string;
  priority: number;
  metadata?: Record<string, string | number | boolean | null>;
};

export type DigestPreviewSection = {
  key: string;
  title: string;
  summary: string;
  items: DigestPreviewItem[];
};

export type DigestPreview = {
  digestType: DigestType;
  subject: string;
  generatedAt: string;
  sendingEnabled: boolean;
  sendingStatus: string;
  consentRequired: boolean;
  sections: DigestPreviewSection[];
};

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

const publicOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.repwatchr.com";

function absoluteUrl(path: string) {
  if (!path) return publicOrigin;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${publicOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getDefaultNotificationPreferences(userId: string, email?: string | null): NotificationPreferences {
  return {
    user_id: userId,
    email: email ?? null,
    weekly_digest: true,
    daily_digest: false,
    breaking_alerts: false,
    watched_official_updates: true,
    watched_race_updates: true,
    watched_jurisdiction_updates: true,
    source_review_updates: true,
    contribution_updates: true,
    package_updates: false,
    records_request_updates: true,
    email_consent_at: null,
    unsubscribed_at: null,
  };
}

function isEmail(value: string | null | undefined) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function emailConfig() {
  const provider = cleanText(process.env.EMAIL_PROVIDER, 40).toLowerCase();
  const enabled = process.env.ENABLE_EMAIL_SENDING === "true";
  const fromEmail = cleanText(process.env.FROM_EMAIL, 255);
  const resendKey = process.env.RESEND_API_KEY || "";
  const sendgridKey = process.env.SENDGRID_API_KEY || "";
  const postmarkKey = process.env.POSTMARK_API_KEY || "";
  const providerKey =
    provider === "resend" ? resendKey : provider === "sendgrid" ? sendgridKey : provider === "postmark" ? postmarkKey : "";
  const ready = enabled && Boolean(provider) && Boolean(providerKey) && Boolean(fromEmail);

  return {
    enabled,
    ready,
    provider,
    fromEmail,
    providerKey,
    reason: !enabled
      ? "ENABLE_EMAIL_SENDING is false."
      : !provider
        ? "EMAIL_PROVIDER is not configured."
        : !providerKey
          ? "Email provider API key is not configured."
          : !fromEmail
            ? "FROM_EMAIL is not configured."
            : "",
  };
}

export function isEmailSendingEnabled() {
  return emailConfig().ready;
}

export function getEmailSendingStatus() {
  const config = emailConfig();
  if (config.ready) return `Email sending enabled through ${config.provider}.`;
  return `Email sending disabled: ${config.reason}`;
}

async function safeSelect<T>(callback: (supabase: SupabaseAdmin) => Promise<{ data: T[] | null; error: { message?: string } | null }>) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [] as T[];
  try {
    const { data, error } = await callback(supabase);
    if (error) return [] as T[];
    return data ?? [];
  } catch {
    return [] as T[];
  }
}

export async function getNotificationPreferences(userId: string, email?: string | null): Promise<NotificationPreferences> {
  const supabase = getSupabaseAdminClient();
  const defaults = getDefaultNotificationPreferences(userId, email);
  if (!supabase) return defaults;

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return defaults;
  return {
    ...defaults,
    ...(data as Partial<NotificationPreferences>),
    email: typeof data.email === "string" ? data.email : email ?? null,
  };
}

export async function ensureNotificationPreferences(userId: string, email?: string | null) {
  const supabase = getSupabaseAdminClient();
  const defaults = getDefaultNotificationPreferences(userId, email);
  if (!supabase) return defaults;

  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: userId,
        email: email ?? null,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();

  if (error || !data) return getNotificationPreferences(userId, email);
  return {
    ...defaults,
    ...(data as Partial<NotificationPreferences>),
    email: typeof data.email === "string" ? data.email : email ?? null,
  };
}

function item(entityType: string, entityId: string, title: string, summary: string, url: string, priority = 0): DigestPreviewItem {
  return { entityType, entityId, title, summary, url, priority };
}

function emptyItem(title: string, summary: string, url = "/dashboard"): DigestPreviewItem {
  return item("next_action", "empty", title, summary, url, 0);
}

export async function generateDigestPreview(userId: string): Promise<DigestPreview> {
  const preferences = await getNotificationPreferences(userId);
  const sendingEnabled = isEmailSendingEnabled();
  const sendingStatus = getEmailSendingStatus();
  const consentRequired = !preferences.email_consent_at || Boolean(preferences.unsubscribed_at);

  type WatchItem = { id: string; label: string | null; href: string | null; item_type: string | null; notes: string | null };
  type SourceSubmission = { id: string; target_name: string | null; status: string | null; source_title: string | null; created_at: string | null };
  type RecordsResponse = { id: string; response_title: string | null; agency_name: string | null; status: string | null; sensitivity_status: string | null };
  type RecordsRequest = { id: string; agency: string | null; subject: string | null; status: string | null; created_at: string | null };

  const [watchItems, sourceSubmissions, recordsResponses, recordsRequests] = await Promise.all([
    safeSelect<WatchItem>(async (supabase) =>
      await supabase
        .from("member_tracked_items")
        .select("id, label, href, item_type, notes")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ),
    safeSelect<SourceSubmission>(async (supabase) =>
      await supabase
        .from("source_submissions")
        .select("id, target_name, status, source_title, created_at")
        .eq("submitter_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ),
    safeSelect<RecordsResponse>(async (supabase) =>
      await supabase
        .from("records_responses")
        .select("id, response_title, agency_name, status, sensitivity_status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ),
    safeSelect<RecordsRequest>(async (supabase) =>
      await supabase
        .from("member_public_record_requests")
        .select("id, agency, subject, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ),
  ]);

  const watched = watchItems.map((watch) =>
    item(
      watch.item_type || "watch_item",
      watch.id,
      watch.label || "Watched record",
      watch.notes || "Saved to your RepWatchr watchlist.",
      watch.href || "/dashboard",
      40,
    ),
  );

  const sourceUpdates = [
    ...sourceSubmissions.map((submission) =>
      item(
        "source_submission",
        submission.id,
        `${submission.target_name || "Source"} is ${submission.status || "new"}`,
        submission.source_title || "Your submitted source is in the review queue.",
        "/dashboard",
        ["verified", "attached_to_profile"].includes(submission.status || "") ? 80 : 50,
      ),
    ),
    ...recordsResponses.map((response) =>
      item(
        "records_response",
        response.id,
        `${response.response_title || response.agency_name || "Records response"} is ${response.status || "new"}`,
        `Sensitivity status: ${(response.sensitivity_status || "needs_review").replaceAll("_", " ")}.`,
        "/dashboard/records-responses",
        response.sensitivity_status === "safe_public_record" ? 80 : 55,
      ),
    ),
  ];

  const gapItems = watchItems.slice(0, 5).map((watch) => {
    const type = watch.item_type || "official";
    const title = watch.label || "Watched record";
    const gap =
      type === "race"
        ? "Missing finance link or filing source"
        : type === "school_board"
          ? "Missing agenda, minutes, or member source"
          : "Missing official source, vote source, or profile correction";
    return item("source_gap", watch.id, `${gap}: ${title}`, "Submit one public source or build a packet from the next record you find.", "/submit-source", 45);
  });

  const recordsRequestItems = recordsRequests.map((request) =>
    item(
      "records_request",
      request.id,
      `${request.agency || "Records request"} is ${request.status || "draft"}`,
      request.subject || "Update your request status or attach the response when it arrives.",
      "/dashboard",
      request.status === "overdue" ? 85 : 45,
    ),
  );

  const questionItems = watchItems.slice(0, 4).map((watch) =>
    item(
      "public_question",
      watch.id,
      `Ask this public question about ${watch.label || "this record"}`,
      `Which public source confirms the latest update for ${watch.label || "this official, race, or body"}?`,
      watch.href || "/search",
      35,
    ),
  );

  const packageItems =
    preferences.package_updates || watchItems.some((watch) => ["race", "school_board"].includes(watch.item_type || ""))
      ? [
          item(
            "package_interest",
            "source_pack",
            "Package fit: monitored race or public body",
            "If you need RepWatchr to organize the records, request a source-first review package. No guaranteed outcome, just cleaner receipts.",
            "/services",
            20,
          ),
        ]
      : [];

  const sections: DigestPreviewSection[] = [
    {
      key: "watchlist_changes",
      title: "Watchlist changes",
      summary: "Saved officials, races, bodies, and issues that create return paths.",
      items: watched.length ? watched : [emptyItem("No watchlist changes yet", "Add an official, race, school board, or issue to start a useful digest.", "/search")],
    },
    {
      key: "source_review_updates",
      title: "Source review updates",
      summary: "Submitted sources and records responses that need attention.",
      items: sourceUpdates.length ? sourceUpdates.slice(0, 8) : [emptyItem("No source review updates", "Submit one public source to start building a review trail.", "/submit-source")],
    },
    {
      key: "suggested_source_gaps",
      title: "Suggested source gaps",
      summary: "Records that would make watched pages more useful.",
      items: gapItems.length ? gapItems : [emptyItem("No watchlist source gaps yet", "Watch a profile or race first, then RepWatchr can suggest the next source.", "/search")],
    },
    {
      key: "public_questions",
      title: "Public questions to ask",
      summary: "Safe questions users can ask before a meeting, story, or source submission.",
      items: questionItems.length ? questionItems : [emptyItem("Start with one public question", "Where is the official source for the record people are arguing about?", "/free-packet")],
    },
    {
      key: "records_requests",
      title: "Records request updates",
      summary: "Drafts and request statuses that can turn into response packets.",
      items: recordsRequestItems.length ? recordsRequestItems.slice(0, 6) : [emptyItem("No records requests tracked", "Draft a request in the dashboard, then attach the agency response when it arrives.", "/dashboard")],
    },
    {
      key: "recommended_next_action",
      title: "Recommended next action",
      summary: "One action that makes the record more useful.",
      items: [
        item("next_action", "submit_source", "Submit one missing source", "Add the public URL, summary, and what needs to be checked.", "/submit-source", 95),
        item("next_action", "build_packet", "Build a source packet", "Turn one receipt into a copyable packet before a meeting or story.", "/free-packet", 90),
        item("next_action", "records_response", "Attach a records response", "If an agency replied, keep it private until review clears the summary.", "/tools/public-records-response", 85),
      ],
    },
    {
      key: "package_interest",
      title: "Package interest if relevant",
      summary: "Only shown when watched records suggest a clear monitoring use case.",
      items: packageItems.length ? packageItems : [emptyItem("No package push", "RepWatchr will not add sales pressure without a relevant watched record or package signal.", "/dashboard/notifications")],
    },
  ];

  return {
    digestType: preferences.daily_digest ? "daily_watchlist" : "weekly_watchlist",
    subject: preferences.daily_digest ? "RepWatchr daily watchlist preview" : "RepWatchr weekly watchlist preview",
    generatedAt: new Date().toISOString(),
    sendingEnabled,
    sendingStatus,
    consentRequired,
    sections,
  };
}

export function flattenDigestPreviewItems(preview: DigestPreview) {
  return preview.sections.flatMap((section) =>
    section.items.map((digestItem) => ({
      ...digestItem,
      metadata: {
        ...(digestItem.metadata ?? {}),
        section: section.key,
      },
    })),
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderDigestEmail(preview: DigestPreview) {
  const htmlSections = preview.sections
    .map(
      (section) => `
        <section style="margin:24px 0;padding:18px;border:1px solid #dbe3ef;border-radius:14px;background:#ffffff;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#b42318;">${escapeHtml(section.title)}</p>
          <p style="margin:0 0 14px 0;font-size:14px;line-height:1.5;color:#475569;">${escapeHtml(section.summary)}</p>
          ${section.items
            .map(
              (digestItem) => `
                <div style="padding:12px 0;border-top:1px solid #edf2f7;">
                  <a href="${escapeHtml(absoluteUrl(digestItem.url))}" style="font-size:16px;font-weight:800;color:#0f2e63;text-decoration:none;">${escapeHtml(digestItem.title)}</a>
                  <p style="margin:6px 0 0 0;font-size:13px;line-height:1.5;color:#475569;">${escapeHtml(digestItem.summary)}</p>
                </div>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("");

  const html = `
    <main style="font-family:Arial,sans-serif;background:#f6f9fc;padding:28px;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;">
        <h1 style="font-size:30px;line-height:1.1;margin:0;color:#0f172a;">${escapeHtml(preview.subject)}</h1>
        <p style="font-size:14px;line-height:1.6;color:#475569;">Search. Grade. Source. Share. This digest is based on your own RepWatchr watchlist, submissions, and dashboard activity.</p>
        ${htmlSections}
        <p style="font-size:12px;line-height:1.6;color:#64748b;">Manage digest settings or unsubscribe in your RepWatchr dashboard: <a href="${escapeHtml(absoluteUrl("/dashboard/notifications"))}">${escapeHtml(absoluteUrl("/dashboard/notifications"))}</a></p>
      </div>
    </main>
  `;

  const text = [
    preview.subject,
    "",
    "Search. Grade. Source. Share.",
    "",
    ...preview.sections.flatMap((section) => [
      section.title,
      section.summary,
      ...section.items.flatMap((digestItem) => [
        `- ${digestItem.title}`,
        `  ${digestItem.summary}`,
        `  ${absoluteUrl(digestItem.url)}`,
      ]),
      "",
    ]),
    `Manage digest settings: ${absoluteUrl("/dashboard/notifications")}`,
  ].join("\n");

  return { html, text };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}) {
  const config = emailConfig();
  if (!config.ready) {
    return { ok: true, sent: false, disabled: true, provider: config.provider || "none", reason: config.reason };
  }
  if (!isEmail(to)) return { ok: false, sent: false, provider: config.provider, error: "Recipient email is invalid." };

  const fromEmail = from || config.fromEmail;
  if (config.provider === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.providerKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html, text }),
    });
    const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    return response.ok
      ? { ok: true, sent: true, provider: "resend", id: body?.id ?? "" }
      : { ok: false, sent: false, provider: "resend", error: body?.message || "Resend send failed." };
  }

  if (config.provider === "sendgrid") {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.providerKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });
    return response.ok
      ? { ok: true, sent: true, provider: "sendgrid", id: response.headers.get("x-message-id") || "" }
      : { ok: false, sent: false, provider: "sendgrid", error: "SendGrid send failed." };
  }

  if (config.provider === "postmark") {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": config.providerKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ From: fromEmail, To: to, Subject: subject, HtmlBody: html, TextBody: text }),
    });
    const body = (await response.json().catch(() => null)) as { MessageID?: string; Message?: string } | null;
    return response.ok
      ? { ok: true, sent: true, provider: "postmark", id: body?.MessageID ?? "" }
      : { ok: false, sent: false, provider: "postmark", error: body?.Message || "Postmark send failed." };
  }

  return { ok: false, sent: false, provider: config.provider, error: "Unsupported EMAIL_PROVIDER." };
}

export async function sendDigest(digestQueueId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, sent: false, error: "Supabase admin client is not configured." };

  const { data: queue, error: queueError } = await supabase
    .from("digest_queue")
    .select("*")
    .eq("id", digestQueueId)
    .maybeSingle();

  if (queueError || !queue) return { ok: false, sent: false, error: queueError?.message || "Digest queue row not found." };

  const preferences = await getNotificationPreferences(String(queue.user_id));
  if (!preferences.email_consent_at || preferences.unsubscribed_at) {
    await supabase.from("digest_queue").update({ status: "canceled", error_message: "Email consent missing or user unsubscribed." }).eq("id", digestQueueId);
    return { ok: true, sent: false, disabled: true, reason: "Email consent missing or user unsubscribed." };
  }
  if (!preferences.email) {
    await supabase.from("digest_queue").update({ status: "failed", error_message: "No recipient email." }).eq("id", digestQueueId);
    return { ok: false, sent: false, error: "No recipient email." };
  }

  const preview = (queue.payload && typeof queue.payload === "object" ? queue.payload : await generateDigestPreview(String(queue.user_id))) as DigestPreview;
  const rendered = renderDigestEmail(preview);
  const result = await sendEmail({
    to: preferences.email,
    subject: queue.subject || preview.subject,
    html: rendered.html,
    text: rendered.text,
  });

  await supabase
    .from("digest_queue")
    .update({
      status: result.sent ? "sent" : result.disabled ? "sending_disabled" : "failed",
      sent_at: result.sent ? new Date().toISOString() : null,
      error_message: result.sent ? null : result.reason || result.error || null,
    })
    .eq("id", digestQueueId);

  await supabase.from("notification_events").insert({
    user_id: queue.user_id,
    digest_queue_id: digestQueueId,
    event_type: result.sent ? "digest_email_sent" : "digest_email_failed",
    metadata: { provider: result.provider || "none", disabled: Boolean(result.disabled), error: result.error || result.reason || null },
  });

  return result;
}
