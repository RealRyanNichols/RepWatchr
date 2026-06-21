import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanText } from "@/lib/source-submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedChannels = new Set([
  "copy",
  "native",
  "x",
  "facebook",
  "linkedin",
  "snippet",
  "talking_point",
  "public_question",
  "watch_record",
]);
const allowedEvents = new Set([
  "share_copy_clicked",
  "native_share_clicked",
  "social_share_clicked",
  "source_snippet_copied",
  "profile_watch_clicked",
]);
const excludedPrefixes = ["/admin", "/api", "/auth", "/dashboard", "/login", "/create-account"];

function normalizePath(value: unknown) {
  const path = cleanText(value, 500).split("?")[0].split("#")[0];
  if (!path.startsWith("/")) return "";
  if (excludedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return "";
  return path;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
    channel?: unknown;
    eventName?: unknown;
    template?: unknown;
    title?: unknown;
    snippetType?: unknown;
  } | null;
  const path = normalizePath(body?.path);
  const channel = cleanText(body?.channel, 40);
  const eventName = cleanText(body?.eventName, 120);
  const template = cleanText(body?.template, 80);
  const title = cleanText(body?.title, 255);
  const snippetType = cleanText(body?.snippetType, 80);

  if (!path || !allowedChannels.has(channel) || !allowedEvents.has(eventName)) {
    return NextResponse.json({ ok: false, error: "Invalid share event." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return new Response(null, { status: 204 });

  const officialId = path.match(/^\/officials\/([^/?#]+)/)?.[1] ?? null;
  const schoolBoardMatch = path.match(/^\/school-boards\/([^/?#]+)\/([^/?#]+)/);
  const { error } = await admin.from("site_share_events").insert({
    path,
    channel,
    profile_type: officialId ? "official" : schoolBoardMatch ? "school_board" : null,
    profile_id: officialId || schoolBoardMatch?.[2] || null,
    district_slug: schoolBoardMatch?.[1] || null,
    metadata: {
      event_name: eventName,
      template,
      title,
      snippet_type: snippetType,
      source: "repwatchr_share_card",
    },
  });

  if (error) {
    console.warn(JSON.stringify({ level: "warn", msg: "share_event_insert_skipped", error: error.message }));
    return new Response(null, { status: 204 });
  }

  return NextResponse.json({ ok: true });
}
