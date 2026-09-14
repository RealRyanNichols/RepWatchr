/**
 * Posts drafts a human already approved in /admin/planner.
 *
 * This replaces the old path where the cron picked its own story and posted it
 * unattended. The only thing this function can publish is a row that cleared
 * the review gate, and the database refuses to mark anything posted that was
 * not approved by a named reviewer.
 */

import { publishApprovedText } from "@/lib/social-autopost";
import {
  claimDraftForPosting,
  listDueDrafts,
  markDraftFailed,
  markDraftPosted,
  type SocialDraftRow,
} from "@/lib/social-planner";

export type PlannerPublishResult = {
  ok: boolean;
  dryRun: boolean;
  considered: number;
  posted: number;
  failed: number;
  skippedReason?: string;
  results: Array<{ id: string; platform: string; hook: string; status: "posted" | "failed" | "would_post" | "skipped"; detail?: string }>;
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

  const queue = await listDueDrafts(limit);
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

    // Take the row before calling the platform. Selecting it is not enough:
    // if the send succeeds and recording the result fails, an unclaimed row is
    // still 'draft' and the next run posts it a second time.
    const claimed = await claimDraftForPosting(draft.id);
    if (!claimed) {
      base.results.push({
        id: draft.id,
        platform: draft.platform,
        hook: draft.hook,
        status: "skipped",
        detail: "Another run claimed this draft first.",
      });
      continue;
    }

    try {
      const response = await publishApprovedText(draft.platform, draft.body, postLink(draft));
      const recorded = await markDraftPosted(draft.id, response.platformPostId);
      base.posted += 1;

      if (!recorded.ok) {
        // The post went out. The row stays 'posting', which keeps it out of
        // every future run: a draft stuck mid-flight is a state to look at,
        // never one to retry into a duplicate.
        base.ok = false;
        base.results.push({
          id: draft.id,
          platform: draft.platform,
          hook: draft.hook,
          status: "posted",
          detail: "Posted, but the result could not be recorded. The row is held in 'posting' and will not be retried.",
        });
      } else {
        base.results.push({ id: draft.id, platform: draft.platform, hook: draft.hook, status: "posted" });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown posting error";
      // The send itself failed, so nothing is live and the row can carry the
      // reason rather than being handed back for a silent retry.
      await markDraftFailed(draft.id, detail);
      base.failed += 1;
      base.results.push({ id: draft.id, platform: draft.platform, hook: draft.hook, status: "failed", detail });
    }
  }

  // `&&`, not `=`. A post that went out but could not be recorded sets ok false
  // above without incrementing `failed`, and a plain assignment here would
  // overwrite that and report a clean run.
  base.ok = base.ok && base.failed === 0;
  return base;
}
