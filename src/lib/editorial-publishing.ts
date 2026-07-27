import { createHash } from "node:crypto";
import { fetchDailyNewsClips, persistDailyNewsClips, type DailyNewsClip } from "@/lib/daily-news-clips";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type GeneratedStory = {
  title: string;
  dek: string;
  content: string;
  topic_key: string;
  scope: "national" | "texas" | "east-texas";
  tags: string[];
  midterm_relevance: 0 | 1 | 2 | 3;
  risk_flags: string[];
};

const PROMPT_VERSION = "repwatchr-editorial-v1";

function slugify(value: string) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
  return `${base}-${new Date().toISOString().slice(0, 10)}`;
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of Array.isArray(response.output) ? response.output : []) {
    if (!item || typeof item !== "object") continue;
    for (const part of Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : []) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") return (part as { text: string }).text;
    }
  }
  return "";
}

async function writeStory(clips: DailyNewsClip[]): Promise<{ story: GeneratedStory; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const model = process.env.EDITORIAL_MODEL ?? "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.15,
      input: [
        {
          role: "system",
          content: "Write restrained, readable public-accountability reporting for RepWatchr. Use only supplied source facts. Separate confirmed facts, attributed reporting, open questions, and public reaction. Never infer corruption, motive, guilt, popularity, or causation. Do not endorse a party or candidate. Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Create one original 650-1000 word RepWatchr article. Use short paragraphs, descriptive subheads, a clear why-it-matters section, what-is-confirmed, what-remains-unknown, and what-to-watch-next.",
            output: { title: "", dek: "", content: "", topic_key: "", scope: "national", tags: [], midterm_relevance: 0, risk_flags: [] },
            sources: clips.map((clip) => ({
              title: clip.title,
              summary: clip.summary,
              publisher: clip.sourceName,
              url: clip.sourceUrl,
              published_at: clip.publishedAt,
              source_tier: clip.sourceWatchId.includes("official") ? "official_record" : "named_news",
            })),
          }),
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI returned HTTP ${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  const story = JSON.parse(extractOutputText(payload)) as GeneratedStory;
  if (!story.title || !story.dek || !story.content || story.content.length < 1800) throw new Error("Generated article failed completeness checks");
  return { story, model };
}

function rankClip(clip: DailyNewsClip) {
  const text = `${clip.title} ${clip.summary}`.toLowerCase();
  const eastTexas = ["harleton", "longview", "marshall", "harrison county", "gregg county", "marion county", "upshur county", "east texas"]
    .filter((term) => text.includes(term)).length;
  const civic = ["election", "candidate", "vote", "congress", "governor", "senate", "house", "ethics", "investigation", "budget"]
    .filter((term) => text.includes(term)).length;
  return eastTexas * 35 + civic * 20 + (clip.publishedAt ? new Date(clip.publishedAt).getTime() / 1e12 : 0);
}

function chooseSourceSets(clips: DailyNewsClip[], count: number) {
  const selected = clips.filter((clip) => clip.sourceUrl.startsWith("http")).sort((a, b) => rankClip(b) - rankClip(a));
  const used = new Set<string>();
  const sets: DailyNewsClip[][] = [];
  for (const lead of selected) {
    if (sets.length >= count || used.has(lead.id)) continue;
    const terms = new Set(lead.matchedTerms.map((term) => term.toLowerCase()));
    const related = selected.filter((candidate) =>
      !used.has(candidate.id) &&
      candidate.id !== lead.id &&
      candidate.sourceName !== lead.sourceName &&
      candidate.matchedTerms.some((term) => terms.has(term.toLowerCase())),
    );
    if (!related.length) continue;
    const set = [lead, related[0]];
    set.forEach((clip) => used.add(clip.id));
    sets.push(set);
  }
  return sets;
}

export async function runEditorialPublishing({ targetCount = 4, dryRun = false } = {}) {
  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, error: "Supabase admin is not configured", drafted: 0, published: 0, held: 0 };
  const fetched = await fetchDailyNewsClips();
  await persistDailyNewsClips(fetched.clips);
  const existing = await admin.from("repwatchr_articles").select("source_clip_ids").gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  const recentIds = new Set((existing.data ?? []).flatMap((row: { source_clip_ids?: string[] }) => row.source_clip_ids ?? []));
  const sourceSets = chooseSourceSets(fetched.clips.filter((clip) => !recentIds.has(clip.id)), Math.max(3, Math.min(5, targetCount)));
  if (dryRun) return { ok: true, dryRun, candidates: sourceSets.map((set) => set.map((clip) => clip.title)), drafted: 0, published: 0, held: 0 };

  const run = await admin.from("repwatchr_editorial_runs").insert({ status: "started", target_count: targetCount }).select("id").single();
  let drafted = 0, published = 0, held = 0;
  const errors: string[] = [];
  for (const sources of sourceSets) {
    try {
      const { story, model } = await writeStory(sources);
      const primaryCount = sources.filter((clip) => clip.sourceWatchId.includes("official")).length;
      const publishers = new Set(sources.map((clip) => clip.sourceName)).size;
      const riskFlags = Array.isArray(story.risk_flags) ? story.risk_flags.filter(Boolean) : ["invalid_risk_flags"];
      const autoApproved =
        process.env.EDITORIAL_AUTOPUBLISH_ENABLED === "true" &&
        primaryCount >= 1 &&
        publishers >= 2 &&
        riskFlags.length === 0;
      const now = new Date().toISOString();
      const digest = createHash("sha256").update(sources.map((clip) => clip.sourceUrl).sort().join("|")).digest("hex");
      const { error } = await admin.from("repwatchr_articles").insert({
        slug: slugify(story.title),
        title: story.title,
        dek: story.dek,
        content: story.content,
        topic_key: story.topic_key,
        scope: story.scope,
        tags: story.tags,
        source_links: sources.map((clip) => ({ title: `${clip.sourceName}: ${clip.title}`, url: clip.sourceUrl, type: clip.sourceWatchId.includes("official") ? "official" : "news" })),
        source_clip_ids: sources.map((clip) => clip.id),
        primary_source_count: primaryCount,
        independent_publisher_count: publishers,
        midterm_relevance: story.midterm_relevance,
        risk_flags: riskFlags,
        editorial_status: autoApproved ? "approved" : "in_review",
        publish_status: autoApproved ? "published" : "draft",
        reviewed_by: autoApproved ? "RepWatchr automated source gate v1" : null,
        reviewed_at: autoApproved ? now : null,
        published_at: autoApproved ? now : null,
        model,
        prompt_version: PROMPT_VERSION,
        metadata: { source_digest: digest },
      });
      if (error) throw new Error(error.message);
      drafted += 1;
      if (autoApproved) published += 1; else held += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown editorial error");
      held += 1;
    }
  }
  if (run.data?.id) await admin.from("repwatchr_editorial_runs").update({
    status: errors.length ? (published ? "partial" : "failed") : "completed",
    drafted_count: drafted, published_count: published, held_count: held,
    error_message: errors.join(" | ") || null, completed_at: new Date().toISOString(),
  }).eq("id", run.data.id);
  return { ok: published >= 3 && errors.length === 0, drafted, published, held, errors };
}
