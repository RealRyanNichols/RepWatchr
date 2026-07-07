import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/SAFE_AI_WRITING_ASSISTANT.md",
  "docs/AI_LANGUAGE_GUARDRAILS.md",
  "supabase-ai-writing-assistant.sql",
  "src/lib/safe-ai-writing.ts",
  "src/app/api/ai/writing-assistant/route.ts",
  "src/components/ai-writing/SafeAIWriter.tsx",
  "src/components/free-packet/FreePacketFunnel.tsx",
  "src/components/records-responses/RecordsResponseIntakeForm.tsx",
];

const requiredSnippets = [
  ["src/lib/feature-flags.ts", "ENABLE_AI_WRITING_ASSISTANT"],
  ["src/lib/safe-ai-writing.ts", "validatePublicContentSafety"],
  ["src/lib/safe-ai-writing.ts", "FORBIDDEN_OUTPUT_TERMS"],
  ["src/app/api/ai/writing-assistant/route.ts", "autoPublish: false"],
  ["src/app/api/ai/writing-assistant/route.ts", "humanReviewRequired: true"],
  ["src/components/ai-writing/SafeAIWriter.tsx", "AIWritingDisabledNotice"],
  ["src/components/ai-writing/SafeAIWriter.tsx", "InsertAITextButton"],
  ["src/components/ai-writing/SafeAIWriter.tsx", "CopyAITextButton"],
  ["src/components/free-packet/FreePacketFunnel.tsx", "Draft safe summary"],
  ["src/components/records-responses/RecordsResponseIntakeForm.tsx", "Draft safe review summary"],
  ["src/app/api/analytics/event/route.ts", "ai_writer_generated"],
  ["src/lib/client-analytics.ts", "ai_writer_text_inserted"],
  ["supabase-ai-writing-assistant.sql", "alter table public.ai_writing_runs enable row level security"],
  ["supabase-ai-writing-assistant.sql", "ENABLE_AI_WRITING_ASSISTANT"],
  ["docs/AI_LANGUAGE_GUARDRAILS.md", "Do not generate these terms as assertions"],
];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    failed = true;
  }
}

for (const [file, snippet] of requiredSnippets) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  if (!text.includes(snippet)) {
    console.error(`Missing required snippet in ${file}: ${snippet}`);
    failed = true;
  }
}

const route = readFileSync("src/app/api/ai/writing-assistant/route.ts", "utf8");
if (route.includes("OPENAI_API_KEY")) {
  console.error("AI writing route should not reference OPENAI_API_KEY directly; provider logic belongs in the server library.");
  failed = true;
}

if (failed) process.exit(1);
console.log("Safe AI writing assistant smoke check passed.");
