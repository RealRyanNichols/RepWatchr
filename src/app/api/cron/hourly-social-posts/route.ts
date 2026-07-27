import { runHourlySocialAutopost } from "@/lib/social-autopost";

export const dynamic = "force-dynamic";

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
  const result = await runHourlySocialAutopost({ dryRun });

  return Response.json(result, { status: result.ok ? 200 : 500 });
}
