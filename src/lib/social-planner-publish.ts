/**
 * Posts drafts a human already approved in /admin/planner.
 *
 * This replaces the old path where the cron picked its own story and posted it
 * unattended. The only thing this function can publish is a row that cleared
 * the review gate, and the database refuses to mark anything posted that was
 * not approved by a named reviewer.
 */

import { publishApprovedText } from "@/lib/social-autopost";
import { claimDueDrafts, markDraftFailed, markDraftPosted, type SocialDraftRow } from "@/lib/social-planner";

export type PlannerPublishResult = {
  ok: boolean;
  dryRun: boolean;
  considered: number;
  posted: number;
  failed: number;
  skippedReason?: string;
  results: Array<{ id: string; platform: string; hook: string; status: "posted" | "failed" | "would_post"; detail?: string }>;
};

function platformEnabled(platform: string) {
  if (platform === "facebook") {
    return Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN);
  }
  return Boolean(
    process.env.X_USER_ACCESS_TOKEN ||
      process.env.X_REFRESH_TOKEN ||
      (process.env.X_CLIENT_ID && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function postLink(draft: SocialDraftRow) {
  if (draft.link_url) return draft.link_url;
  return draft.source_links[0]?.url ?? null;
}

export async function runPlannerPublish({
  dryRun = false,
  limit = 3,
}: { dryRun?: boolean; limit?: number } = {}): Promise<PlannerPublishResult> {
  const base: PlannerPublishResult = { ok: true, dryRun, considered: 0, posted: 0, failed: 0, results: [] };

  const queue = await claimDueDrafts(limit);
  if (!queue.ok) {
    return { ...base, ok: false, skippedReason: queue.problems.join(" ") };
  }

  base.considered = queue.drafts.length;
  if (queue.drafts.length === 0) {
    return { ...base, skippedReason: "Nothing approved is due." };
  }

  for (const draft of queue.drafts) {
    if (dryRun) {
      base.results.push({ id: draft.id, platform: draft.platform, hook: draft.hook, status: "would_post" });
      continue;
    }

    if (!platformEnabled(draft.platform)) {
      base.failed += 1;
      const detail = `${draft.platform} credentials are not configured on this deployment.`;
      await markDraftFailed(draft.id, detail);
      base.results.push({ id: draft.id, platform: draft.platform, hook: draft.hook, status: "failed", detail });
      continue;
    }

    try {
      const response = await publishApprovedText(draft.platform, draft.body, postLink(draft));
      await markDraftPosted(draft.id, response.platformPostId);
      base.posted += 1;
      base.results.push({ id: draft.id, platform: draft.platform, hook: draft.hook, status: "posted" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown posting error";
      await markDraftFailed(draft.id, detail);
      base.failed += 1;
      base.results.push({ id: draft.id, platform: draft.platform, hook: draft.hook, status: "failed", detail });
    }
  }

  base.ok = base.failed === 0;
  return base;
}
