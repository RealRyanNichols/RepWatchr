import { homepageStructuredData } from "@/lib/homepage-structured-data";
import {
  REPWATCHR_ORGANIZATION_ID,
  datasetJsonLd,
  newsArticleJsonLd,
  organizationJsonLd,
} from "@/lib/structured-data";

/**
 * Builds the real JSON-LD and checks that RepWatchr is one entity in it.
 *
 * Nesting an Organization node inside `creator` or `publisher` without an
 * `@id` produces an ANONYMOUS node: it states the relationship but does not
 * point at the canonical entity, so consumers see several RepWatchr
 * organizations. A source-code check cannot tell that apart from a reference,
 * so this evaluates what the site actually emits — including the homepage
 * graph, which is the most-crawled one on the site.
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

/**
 * A mention must carry the canonical `@id`.
 *
 * It may carry other properties alongside it. In JSON-LD a node bearing an
 * `@id` IS that node, so repeating `@type` or `name` there describes the same
 * identified entity rather than creating a second one — an earlier version of
 * this probe rejected that and would have failed a valid graph. Anonymity is
 * the defect, not verbosity.
 */
function checkReference(label: string, value: unknown) {
  if (!value || typeof value !== "object") {
    problems.push(`${label} is missing.`);
    return;
  }
  const node = value as Record<string, unknown>;
  if (node["@id"] !== REPWATCHR_ORGANIZATION_ID) {
    problems.push(
      `${label} does not carry the canonical organization @id, so it describes a separate RepWatchr entity: ${JSON.stringify(node)}`,
    );
  }
}

const REPWATCHR_NAMES = new Set(["repwatchr"]);

/**
 * Walk an emitted graph for any node that claims to BE RepWatchr the
 * organization while going unidentified.
 *
 * The NewsArticle byline ("RepWatchr Editorial Desk") is deliberately its own
 * anonymous node: a desk is not the outlet, and that field makes no publisher
 * claim. Only nodes naming the outlet itself are required to be identified.
 */
function findAnonymousRepWatchrOrgs(value: unknown, path: string, found: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findAnonymousRepWatchrOrgs(item, `${path}[${index}]`, found));
    return found;
  }
  if (!value || typeof value !== "object") return found;

  const node = value as Record<string, unknown>;
  const type = String(node["@type"] ?? "");
  const name = String(node.name ?? "").trim().toLowerCase();
  if (type.includes("Organization") && REPWATCHR_NAMES.has(name) && node["@id"] !== REPWATCHR_ORGANIZATION_ID) {
    found.push(`${path} (${JSON.stringify(node).slice(0, 160)})`);
  }

  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("@")) continue;
    findAnonymousRepWatchrOrgs(child, `${path}.${key}`, found);
  }
  return found;
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

// The homepage graph itself, not a stand-in built from the same helper.
const homepage = homepageStructuredData();
const homepageDataset = homepage.find(
  (node) => (node as Record<string, unknown>)["@type"] === "Dataset",
) as Record<string, unknown> | undefined;

if (!homepageDataset) {
  problems.push("The homepage graph no longer publishes a Dataset node.");
} else {
  checkReference("Homepage Dataset creator", homepageDataset.creator);
}

const anonymousOnHomepage = findAnonymousRepWatchrOrgs(homepage, "homepage");
for (const location of anonymousOnHomepage) {
  problems.push(`The homepage graph declares an unidentified RepWatchr organization at ${location}`);
}

const anonymousOnArticle = findAnonymousRepWatchrOrgs(article, "newsArticle");
for (const location of anonymousOnArticle) {
  problems.push(`A news article declares an unidentified RepWatchr organization at ${location}`);
}

console.log(
  JSON.stringify({
    organizationId: org["@id"],
    homepageNodeTypes: homepage.map((node) => (node as Record<string, unknown>)["@type"]),
    problems,
  }),
);
