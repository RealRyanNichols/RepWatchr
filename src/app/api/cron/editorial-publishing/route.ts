import { runEditorialPublishing } from "@/lib/editorial-publishing";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const result = await runEditorialPublishing({
    targetCount: Number(url.searchParams.get("count") ?? "4"),
    dryRun: url.searchParams.get("dryRun") === "1",
  });
  return Response.json(result, { status: result.ok ? 200 : 500 });
}

