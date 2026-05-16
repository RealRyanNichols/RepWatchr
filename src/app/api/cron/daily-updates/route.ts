import { fetchDailyNewsClips, persistDailyNewsClips } from "@/lib/daily-news-clips";
import { runDailyProfileUpdates } from "@/lib/daily-profile-updates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const fetched = await fetchDailyNewsClips();
  const persisted = await persistDailyNewsClips(fetched.clips);
  const profileUpdates = await runDailyProfileUpdates(fetched.clips);

  return Response.json({
    ok: !persisted.error && profileUpdates.ok,
    scope: "federal_state_daily",
    sourceCount: fetched.sourceCount + profileUpdates.modules.length,
    clipsFound: fetched.clips.length,
    clipsInserted: persisted.inserted,
    clipsSkipped: persisted.skipped,
    supabaseConfigured: persisted.configured,
    fetchErrors: fetched.errors,
    profileUpdates,
    error: persisted.error ?? profileUpdates.modules.find((module) => module.status === "error")?.error,
  });
}
