import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const allowedKinds = new Set(["search", "chat", "research_note", "prompt_button"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      kind?: string;
      content?: string;
      pagePath?: string;
      metadata?: Record<string, unknown>;
    };
    const kind = body.kind ?? "chat";
    const content = body.content?.trim() ?? "";

    if (!allowedKinds.has(kind)) {
      return NextResponse.json({ error: "Unsupported Gideon interaction type." }, { status: 400 });
    }

    if (!content || content.length > 5000) {
      return NextResponse.json({ error: "Content is required and must be under 5000 characters." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("gideon_interactions").insert({
      user_id: user?.id ?? null,
      kind,
      content,
      page_path: body.pagePath ?? null,
      metadata: body.metadata ?? {},
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to collect Gideon interaction." }, { status: 500 });
  }
}
