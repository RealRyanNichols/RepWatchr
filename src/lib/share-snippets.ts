import { absoluteUrl } from "@/lib/seo";

export type ShareSnippetKind =
  | "confirmed_public_record"
  | "needs_source"
  | "public_question"
  | "watch_profile"
  | "correction"
  | "race";

export type ShareSnippetInput = {
  kind: ShareSnippetKind;
  name: string;
  fact?: string;
  topic?: string;
  question?: string;
  path: string;
  sourceUrl?: string;
};

function safeText(value: string | undefined, fallback = "") {
  return (value ?? fallback)
    .replace(/\b(exposed|criminal|fraudster|traitor|corrupt|guilty)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

export function getSafeShareLine(input: ShareSnippetInput) {
  const name = safeText(input.name, "this record");
  const url = absoluteUrl(input.path);
  const source = input.sourceUrl ? ` Source: ${input.sourceUrl}.` : "";

  switch (input.kind) {
    case "confirmed_public_record":
      return `RepWatchr has a source-backed public record for ${name}: ${safeText(input.fact, "open the record for details")}.${source || ` ${url}`}`;
    case "needs_source":
      return `RepWatchr is looking for a public source on ${name} about ${safeText(input.topic, "this record")}. Add a source here: ${url}.`;
    case "public_question":
      return `Public question for ${name}: ${safeText(input.question, "Which public source confirms this record?")} Source/context: ${url}.`;
    case "watch_profile":
      return `I'm watching public-record updates for ${name} on RepWatchr: ${url}.`;
    case "correction":
      return `See something wrong on this RepWatchr profile? Request a correction here: ${url}.`;
    case "race":
      return `Follow public-record updates for ${name} here: ${url}.`;
  }
}

export function getDefaultPublicQuestion(name: string) {
  return `Which public source confirms the current record for ${safeText(name, "this official or public body")}?`;
}
