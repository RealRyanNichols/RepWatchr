import {
  REPWATCHR_ORGANIZATION_ID,
  datasetJsonLd,
  newsArticleJsonLd,
  organizationJsonLd,
} from "@/lib/structured-data";

/**
 * Builds the real JSON-LD and checks that RepWatchr is one entity in it.
 *
 * Nesting an Organization node inside `creator` or `publisher` states the
 * relationship but produces an anonymous node, not a reference. A source-code
 * check cannot tell those apart, so this evaluates what the site actually
 * emits: the canonical node carries a stable @id, and every other mention is
 * a bare reference to it.
 */

const problems: string[] = [];

const org = organizationJsonLd() as Record<string, unknown>;
if (org["@id"] !== REPWATCHR_ORGANIZATION_ID) {
  problems.push(
    `The canonical organization node has no stable @id (got ${JSON.stringify(org["@id"])}), so nothing can reference it.`,
  );
}
if (org["@type"] !== "NewsMediaOrganization") {
  problems.push(`The canonical organization is typed ${JSON.stringify(org["@type"])}, not NewsMediaOrganization.`);
}

/** A reference is exactly {"@id": ...} — anything with @type is a second entity. */
function checkReference(label: string, value: unknown) {
  if (!value || typeof value !== "object") {
    problems.push(`${label} is missing.`);
    return;
  }
  const node = value as Record<string, unknown>;
  if (node["@id"] !== REPWATCHR_ORGANIZATION_ID) {
    problems.push(
      `${label} does not reference the canonical organization; it declares a separate RepWatchr entity: ${JSON.stringify(node)}`,
    );
    return;
  }
  if ("@type" in node) {
    problems.push(`${label} carries its own @type alongside @id, which re-declares the entity rather than referencing it.`);
  }
}

const dataset = datasetJsonLd({
  name: "probe",
  path: "/probe",
  description: "probe",
}) as Record<string, unknown>;
checkReference("Dataset creator", dataset.creator);

const article = newsArticleJsonLd({
  headline: "probe",
  description: "probe",
  path: "/news/probe",
  datePublished: "2026-01-01T00:00:00Z",
  authorName: "probe",
}) as Record<string, unknown>;
checkReference("NewsArticle publisher", article.publisher);

console.log(JSON.stringify({ organizationId: org["@id"], problems }));
