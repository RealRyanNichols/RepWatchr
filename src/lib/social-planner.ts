/**
 * The social planner: drafts, the rules they have to clear, and the queue.
 *
 * A scheduled Claude session gathers material and writes the copy, because the
 * Vercel runtime has no access to Fieldy, Notion, or Drive. This module is the
 * part that does not trust it: every draft is validated here before it is
 * stored, and approval is a human act recorded by name.
 *
 * Two of Ryan's standing rules are enforced mechanically rather than left to
 * whoever is writing:
 *
 *   1. "Don't try to sell anyone." Sales and CTA language is rejected outright.
 *   2. His social-post style: no em dashes, short lines, hook first.
 *
 * A rule a model is merely asked to follow drifts. A rule that rejects the
 * write does not.
 */

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const SOCIAL_PLATFORMS = ["x", "facebook"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const DRAFT_SOURCE_KINDS = [
  "daily_wire",
  "notion",
  "google_drive",
  "fieldy_lead",
  "x_trending",
  "manual",
] as const;
export type DraftSourceKind = (typeof DRAFT_SOURCE_KINDS)[number];

export const DRAFT_FLAVORS = [
  "receipts",
  "curiosity",
  "local-accountability",
  "legal-precision",
  "short-punch",
  "pressure-build",
  "record-correction",
] as const;
export type DraftFlavor = (typeof DRAFT_FLAVORS)[number];

export const DRAFT_SCOPES = ["home-district", "east-texas", "texas", "national"] as const;
export type DraftScope = (typeof DRAFT_SCOPES)[number];

export const X_BODY_LIMIT = 280;

export type DraftSourceLink = { title: string; url: string };

export type SocialDraftInput = {
  platform: SocialPlatform;
  body: string;
  linkUrl?: string | null;
  flavor?: DraftFlavor;
  sourceKind: DraftSourceKind;
  sourceLinks: DraftSourceLink[];
  sourceNote?: string | null;
  conversationParticipants?: string[];
  scope: DraftScope;
  officialIds?: string[];
  scheduledFor?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Language that turns a report into a pitch.
 *
 * This is the "do not sell anyone" rule. It is deliberately blunt: the planner
 * is for reporting the record, and anything reading like marketing copy belongs
 * on an offer page written by hand, not in a scheduled post.
 */
const SALES_PATTERNS: Array<{ id: string; pattern: RegExp; why: string }> = [
  { id: "cta_buy", pattern: /\b(buy|purchase|order) (now|today)\b/i, why: "a purchase call to action" },
  { id: "cta_signup", pattern: /\b(sign ?up|subscribe|join) (now|today)\b/i, why: "a signup call to action" },
  { id: "book_call", pattern: /\b(book|schedule) (a|your) (call|strategy call|consult\w*)\b/i, why: "a booking pitch" },
  { id: "dm_me", pattern: /\b(dm|message|text) me\b/i, why: "a solicitation to contact" },
  { id: "link_in_bio", pattern: /\blink in (bio|profile)\b/i, why: "an influencer CTA" },
  { id: "limited", pattern: /\b(limited time|act now|don'?t miss out|spots? (are )?(left|available)|while supplies last)\b/i, why: "urgency marketing" },
  { id: "discount", pattern: /\b(\d+% off|discount|coupon|promo code|free trial|special offer)\b/i, why: "a discount offer" },
  { id: "hire", pattern: /\b(hire me|work with me|let me build|i can build (you|your))\b/i, why: "a services pitch" },
  { id: "donate", pattern: /\b(donate|chip in|contribute|support my|fund my|gofundme)\b/i, why: "a fundraising ask" },
  { id: "share_cta", pattern: /\b(read and share|please share|share this post|smash that|like and share)\b/i, why: "engagement-farming" },
  { id: "follow_cta", pattern: /\bfollow (me|us) for\b/i, why: "a follow pitch" },
];

/**
 * Style rules from Ryan's own social-post guidance. Violations are errors, not
 * suggestions, because the whole point of a scheduled lane is that nobody is
 * reading every line before it is drafted.
 */
export type VoiceViolation = { rule: string; detail: string };

export function checkVoiceRules(body: string, platform: SocialPlatform): VoiceViolation[] {
  const violations: VoiceViolation[] = [];
  const text = body.trim();

  if (!text) {
    violations.push({ rule: "empty", detail: "The post body is empty." });
    return violations;
  }

  // "No em dashes" in social posts, stated explicitly in the project rules.
  if (/[—–]/.test(text)) {
    violations.push({
      rule: "no_em_dash",
      detail: "Social posts use no em or en dashes. Break the line instead.",
    });
  }

  for (const rule of SALES_PATTERNS) {
    const match = text.match(rule.pattern);
    if (match) {
      violations.push({
        rule: `no_selling:${rule.id}`,
        detail: `"${match[0]}" reads as ${rule.why}. This lane reports the record and does not sell.`,
      });
    }
  }

  // "Do not say 'this article discusses'" - no throat-clearing before the point.
  if (/^(this (article|post|piece|thread)|in this (post|article)|today (i|we) (want|wanted) to)/i.test(text)) {
    violations.push({
      rule: "no_preamble",
      detail: "Open with what happened, not with a description of the post.",
    });
  }

  const lines = text.split("\n");
  const hook = lines[0]?.trim() ?? "";
  if (hook.length > 120) {
    violations.push({
      rule: "hook_too_long",
      detail: `The first line runs ${hook.length} characters. It has to stop the scroll, so keep it under 120.`,
    });
  }

  // Long unbroken paragraphs read as academic, which the style rules reject.
  const longestParagraph = Math.max(...text.split(/\n\s*\n/).map((block) => block.replace(/\s+/g, " ").trim().length));
  if (longestParagraph > 420) {
    violations.push({
      rule: "wall_of_text",
      detail: `A block runs ${longestParagraph} characters with no break. Use short lines and spacing.`,
    });
  }

  if (platform === "x" && text.length > X_BODY_LIMIT) {
    violations.push({
      rule: "x_too_long",
      detail: `X allows ${X_BODY_LIMIT} characters. This is ${text.length}.`,
    });
  }

  return violations;
}

export type DraftValidation = { ok: true; normalized: NormalizedDraft } | { ok: false; problems: string[] };

export type NormalizedDraft = {
  platform: SocialPlatform;
  body: string;
  hook: string;
  link_url: string | null;
  flavor: DraftFlavor;
  source_kind: DraftSourceKind;
  source_links: DraftSourceLink[];
  source_note: string | null;
  conversation_participants: string[];
  requires_confirmation: boolean;
  scope: DraftScope;
  official_ids: string[];
  scheduled_for: string | null;
  idempotency_key: string | null;
  metadata: Record<string, unknown>;
};

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

/**
 * Validate an incoming draft.
 *
 * Every draft needs a source. The planner exists to report the record, and a
 * post with nothing to point at is an assertion, which is the thing this whole
 * site is built to avoid.
 */
export function validateDraft(input: SocialDraftInput): DraftValidation {
  const problems: string[] = [];

  if (!SOCIAL_PLATFORMS.includes(input.platform)) {
    problems.push(`platform must be one of ${SOCIAL_PLATFORMS.join(", ")}`);
  }
  if (!DRAFT_SOURCE_KINDS.includes(input.sourceKind)) {
    problems.push(`sourceKind must be one of ${DRAFT_SOURCE_KINDS.join(", ")}`);
  }
  if (!DRAFT_SCOPES.includes(input.scope)) {
    problems.push(`scope must be one of ${DRAFT_SCOPES.join(", ")}`);
  }

  const flavor = input.flavor ?? "receipts";
  if (!DRAFT_FLAVORS.includes(flavor)) {
    problems.push(`flavor must be one of ${DRAFT_FLAVORS.join(", ")}`);
  }

  const body = (input.body ?? "").trim();
  const sourceLinks = (input.sourceLinks ?? []).filter(
    (link) => link && isHttpUrl(link.url) && typeof link.title === "string" && link.title.trim(),
  );

  if (sourceLinks.length === 0) {
    problems.push("Every draft needs at least one source link a reader can open.");
  }

  if (input.linkUrl != null && !isHttpUrl(input.linkUrl)) {
    problems.push("linkUrl must be an http(s) URL when present.");
  }

  for (const violation of checkVoiceRules(body, input.platform)) {
    problems.push(`${violation.rule}: ${violation.detail}`);
  }

  // A Fieldy lead is drawn from a recorded conversation with other people in
  // it. It can suggest what to look into; it never becomes the source, and it
  // never clears review without Ryan naming himself on it.
  const participants = (input.conversationParticipants ?? []).map((name) => name.trim()).filter(Boolean);
  const requiresConfirmation = input.sourceKind === "fieldy_lead";

  if (requiresConfirmation) {
    const onlyFieldySources = sourceLinks.every((link) => /fieldy/i.test(link.url));
    if (onlyFieldySources) {
      problems.push(
        "A Fieldy lead cannot cite only the conversation. Point at the public record the conversation pointed you toward.",
      );
    }
  }

  if (problems.length) return { ok: false, problems };

  return {
    ok: true,
    normalized: {
      platform: input.platform,
      body,
      hook: body.split("\n")[0]!.trim().slice(0, 200),
      link_url: input.linkUrl ?? null,
      flavor,
      source_kind: input.sourceKind,
      source_links: sourceLinks,
      source_note: input.sourceNote?.trim() || null,
      conversation_participants: participants,
      requires_confirmation: requiresConfirmation,
      scope: input.scope,
      official_ids: input.officialIds ?? [],
      scheduled_for: input.scheduledFor ?? null,
      idempotency_key: input.idempotencyKey ?? null,
      metadata: input.metadata ?? {},
    },
  };
}

export type SocialDraftRow = NormalizedDraft & {
  id: string;
  editorial_status: "in_review" | "approved" | "rejected";
  publish_status: "draft" | "posted" | "failed" | "archived";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  posted_at: string | null;
  post_url: string | null;
  post_error: string | null;
  created_at: string;
  updated_at: string;
};

const TABLE = "repwatchr_social_drafts";

export async function insertDraft(input: SocialDraftInput) {
  const validation = validateDraft(input);
  if (!validation.ok) return { ok: false as const, problems: validation.problems };

  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, problems: ["Supabase service role is not configured."] };

  const { data, error } = await client
    .from(TABLE)
    .insert(validation.normalized)
    .select()
    .single();

  if (error) return { ok: false as const, problems: [error.message] };
  return { ok: true as const, draft: data as SocialDraftRow };
}

export async function listDrafts(options: { status?: "in_review" | "approved" | "rejected"; limit?: number } = {}) {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, problems: ["Supabase service role is not configured."], drafts: [] };

  let query = client.from(TABLE).select("*").order("created_at", { ascending: false }).limit(options.limit ?? 100);
  if (options.status) query = query.eq("editorial_status", options.status);

  const { data, error } = await query;
  if (error) return { ok: false as const, problems: [error.message], drafts: [] };
  return { ok: true as const, problems: [], drafts: (data ?? []) as SocialDraftRow[] };
}

/**
 * Approve or reject. `reviewedBy` is required and is stored, because the
 * database refuses to mark anything posted without a named reviewer on it.
 */
export async function reviewDraft(input: {
  id: string;
  decision: "approved" | "rejected";
  reviewedBy: string;
  reviewNote?: string | null;
  body?: string;
  scheduledFor?: string | null;
}) {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, problems: ["Supabase service role is not configured."] };

  const reviewedBy = input.reviewedBy.trim();
  if (!reviewedBy) return { ok: false as const, problems: ["A reviewer name is required."] };

  const patch: Record<string, unknown> = {
    editorial_status: input.decision,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    review_note: input.reviewNote?.trim() || null,
  };

  // Ryan editing the copy before approving is the normal path, so re-run the
  // rules on whatever he actually approved rather than what was drafted.
  if (typeof input.body === "string") {
    const { data: existing, error: readError } = await client
      .from(TABLE)
      .select("platform")
      .eq("id", input.id)
      .single();
    if (readError) return { ok: false as const, problems: [readError.message] };

    const body = input.body.trim();
    const violations = checkVoiceRules(body, existing.platform as SocialPlatform);
    if (violations.length) {
      return { ok: false as const, problems: violations.map((v) => `${v.rule}: ${v.detail}`) };
    }
    patch.body = body;
    patch.hook = body.split("\n")[0]!.trim().slice(0, 200);
  }

  if (input.scheduledFor !== undefined) patch.scheduled_for = input.scheduledFor;

  const { data, error } = await client.from(TABLE).update(patch).eq("id", input.id).select().single();
  if (error) return { ok: false as const, problems: [error.message] };
  return { ok: true as const, draft: data as SocialDraftRow };
}

/**
 * Drafts cleared to post: approved, not yet posted, and due.
 *
 * This only reads. Nothing here may be sent to a platform without first
 * winning `claimDraftForPosting`, because selecting a row does not stop
 * another run from selecting the same one.
 */
export async function listDueDrafts(limit = 3) {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, problems: ["Supabase service role is not configured."], drafts: [] };

  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("editorial_status", "approved")
    .eq("publish_status", "draft")
    .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
    .order("scheduled_for", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) return { ok: false as const, problems: [error.message], drafts: [] };
  return { ok: true as const, problems: [], drafts: (data ?? []) as SocialDraftRow[] };
}

/**
 * Take exclusive ownership of a draft before sending it.
 *
 * The update is conditional on the row still being 'draft', so if two runs
 * overlap exactly one of them moves it and the other gets nothing back. Without
 * this, a send that succeeds but whose result fails to record leaves the row
 * selectable and the next run posts it again, duplicating it under Ryan's name.
 *
 * Returns true only when this caller is the one that moved the row.
 */
export async function claimDraftForPosting(id: string) {
  const client = getSupabaseAdminClient();
  if (!client) return false;

  const { data, error } = await client
    .from(TABLE)
    .update({ publish_status: "posting" })
    .eq("id", id)
    .eq("publish_status", "draft")
    .eq("editorial_status", "approved")
    .select("id");

  return !error && (data?.length ?? 0) === 1;
}

/** Hand a claimed draft back when it turns out it cannot be sent. */
export async function releaseDraftClaim(id: string) {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const };
  const { error } = await client
    .from(TABLE)
    .update({ publish_status: "draft" })
    .eq("id", id)
    .eq("publish_status", "posting");
  return { ok: !error };
}

export async function markDraftPosted(id: string, postUrl: string | null) {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const };
  const { error } = await client
    .from(TABLE)
    .update({ publish_status: "posted", posted_at: new Date().toISOString(), post_url: postUrl, post_error: null })
    .eq("id", id);
  return { ok: !error };
}

export async function markDraftFailed(id: string, message: string) {
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const };
  const { error } = await client
    .from(TABLE)
    .update({ publish_status: "failed", post_error: message.slice(0, 1000) })
    .eq("id", id);
  return { ok: !error };
}
