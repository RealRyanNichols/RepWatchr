import { runPlannerPublish } from "@/lib/social-planner-publish";
import { runHourlySocialAutopost } from "@/lib/social-autopost";

/**
 * The scheduled posting run.
 *
 * Default behaviour is the planner lane: publish only drafts a human approved
 * in /admin/planner. The old unattended lane, which picked its own story from
 * the wire and posted it with nobody reading it first, is still reachable but
 * now has to be asked for by name and stays off unless someone deliberately
 * sets SOCIAL_AUTOPOST_UNATTENDED=true.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.SOCIAL_PIPELINE_V2_ENABLED !== "true") {
    return Response.json({
      ok: true,
      enabled: false,
      skippedReason: "Social distribution is disabled on this deployment",
    });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dry_run") === "true";

  if (process.env.SOCIAL_AUTOPOST_UNATTENDED === "true") {
    const result = await runHourlySocialAutopost({ dryRun });
    return Response.json({ lane: "unattended", ...result }, { status: result.ok ? 200 : 500 });
  }

  const result = await runPlannerPublish({ dryRun });
  return Response.json({ lane: "planner", ...result }, { status: result.ok ? 200 : 500 });
}
