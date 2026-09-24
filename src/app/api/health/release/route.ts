export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "repwatchr",
    release: process.env.REPWATCHR_RELEASE_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    hosting: process.env.REPWATCHR_HOSTING ?? (process.env.VERCEL ? "Vercel" : "unlabelled"),
  }, { headers: { "Cache-Control": "no-store" } });
}
