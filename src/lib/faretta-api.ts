import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type FarettaMessage = {
  role: "user" | "faretta" | "assistant";
  content: string;
};

const allowedKinds = new Set(["search", "chat", "research_note", "prompt_button"]);

async function collectStreamText(response: Response) {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assembled = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event.split("\n");
      let type = "message";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) type = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }

      if (!data) continue;

      try {
        const parsed = JSON.parse(data);
        if (type === "content_block_delta" && parsed?.delta?.type === "text_delta") {
          assembled += parsed.delta.text ?? "";
        }
        if (type === "error") {
          throw new Error(parsed?.error ?? "Faretta AI stream error.");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("Faretta AI stream error")) {
          throw error;
        }
      }
    }
  }

  return assembled.trim();
}

export async function handleFarettaChatRequest(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: FarettaMessage[];
      userContext?: Record<string, unknown>;
      tier?: "free" | "core" | "ultra";
    };

    const message = body.message?.trim() ?? "";
    if (!message || message.length > 5000) {
      return NextResponse.json({ error: "Message is required and must be under 5000 characters." }, { status: 400 });
    }

    const endpoint =
      process.env.FARETTA_CHAT_URL ??
      process.env.NEXT_PUBLIC_FARETTA_CHAT_URL ??
      process.env.GIDEON_CHAT_URL ??
      process.env.NEXT_PUBLIC_GIDEON_CHAT_URL;
    if (!endpoint) {
      return NextResponse.json({ reply: null, fallback: true });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    const bearer = process.env.FARETTA_CHAT_BEARER ?? process.env.GIDEON_CHAT_BEARER ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (bearer) headers.authorization = `Bearer ${bearer}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        project: "repwatchr",
        tier: body.tier ?? "free",
        user_name: user?.email ?? "RepWatchr user",
        user_context: {
          userId: user?.id ?? null,
          product: "RepWatchr",
          ...(body.userContext ?? {}),
        },
        message,
        history: (body.history ?? []).map((item) => ({
          role: item.role === "faretta" ? "assistant" : item.role,
          content: item.content,
        })),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        { error: `Faretta AI chat returned ${response.status}.`, details: details.slice(0, 300) },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      return NextResponse.json({ reply: await collectStreamText(response), fallback: false });
    }

    const data = await response.json().catch(() => null);
    return NextResponse.json({
      reply: data?.reply ?? data?.content ?? data?.message ?? null,
      fallback: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reach Faretta AI." },
      { status: 500 },
    );
  }
}

export async function handleFarettaCollectRequest(request: Request) {
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
      return NextResponse.json({ error: "Unsupported Faretta AI interaction type." }, { status: 400 });
    }

    if (!content || content.length > 5000) {
      return NextResponse.json({ error: "Content is required and must be under 5000 characters." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const interactionsTable = process.env.FARETTA_INTERACTIONS_TABLE ?? "gideon_interactions";
    const { error } = await supabase.from(interactionsTable).insert({
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
    return NextResponse.json({ error: "Unable to collect Faretta AI interaction." }, { status: 500 });
  }
}
