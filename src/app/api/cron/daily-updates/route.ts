import { fetchDailyNewsClips, persistDailyNewsClips } from "@/lib/daily-news-clips";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const fetched = await fetchDailyNewsClips();
  const persisted = await persistDailyNewsClips(fetched.clips);

  return Response.json({
    ok: !persisted.error,
    sourceCount: fetched.sourceCount,
    clipsFound: fetched.clips.length,
    clipsInserted: persisted.inserted,
    clipsSkipped: persisted.skipped,
    supabaseConfigured: persisted.configured,
    fetchErrors: fetched.errors,
    error: persisted.error,
  });
}
