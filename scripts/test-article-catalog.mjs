import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
function load(file, modules) {
  const source = fs.readFileSync(
    new URL(`../${file}`, import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", compiled)(
    (id) => {
      if (!(id in modules)) throw new Error(`Unexpected dependency: ${id}`);
      return modules[id];
    },
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}
const date = new Date(Date.now() - 86400000).toISOString();
const records = Array.from({ length: 151 }, (_, i) => ({
  slug: `article-${i}`,
  title: `Article ${i}`,
  dek: "Summary",
  content: "Public content",
  author: "Test desk",
  scope: "texas",
  published_at: date,
  reviewed_at: date,
  reviewed_by: "Source reviewer",
  topic_key: `topic-${i}`,
  source_links: [{ url: "https://example.invalid/source", title: "Source" }],
  tags: [],
  official_ids: [],
  midterm_relevance: 0,
}));
let calls = [];
const client = {
  from(table) {
    assert.equal(table, "repwatchr_articles");
    let slug, limit;
    const query = {
      select(columns) {
        assert.ok(!columns.includes("metadata"));
        return query;
      },
      eq(key, value) {
        calls.push([key, value]);
        if (key === "slug") slug = value;
        return query;
      },
      lte() {
        return query;
      },
      order() {
        return query;
      },
      limit(value) {
        limit = value;
        return query;
      },
      async maybeSingle() {
        assert.equal(limit, undefined);
        return { data: records.find((row) => row.slug === slug) };
      },
      then(resolve) {
        return Promise.resolve({ data: records.slice(0, limit) }).then(resolve);
      },
    };
    return query;
  },
};
const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
  oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.invalid";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-only";
const published = load("src/lib/published-articles.ts", {
  "@supabase/supabase-js": { createClient: () => client },
  "@/lib/editorial-visuals": { toEditorialThumbnailMessage: (value) => value },
});
assert.equal(
  (await published.getPublishedArticle("article-150")).id,
  "article-150",
);
assert.equal(
  (await published.getPublishedArticle("article-150")).reviewedBy,
  "Source reviewer",
);
assert.equal((await published.getPublishedArticles()).length, 100);
assert.equal(await published.getPublishedArticle("../private"), undefined);
assert.ok(
  calls.some(
    ([key, value]) => key === "editorial_status" && value === "approved",
  ),
);
assert.ok(
  calls.some(
    ([key, value]) => key === "publish_status" && value === "published",
  ),
);
const catalog = load("src/lib/article-catalog.ts", {
  "@/lib/data": {
    getAllNews: () => [
      { id: "shared", title: "Repository source", publishedAt: date },
      {
        id: "future",
        publishedAt: new Date(Date.now() + 86400000).toISOString(),
      },
      { id: "invalid", publishedAt: "invalid" },
    ],
  },
  "@/lib/published-articles": {
    getPublishedArticles: async () => [
      { id: "shared", title: "Database source", publishedAt: date },
      { id: "database-only", publishedAt: date },
    ],
  },
});
const combined = await catalog.getPublicArticleCatalog();
assert.equal(combined.length, 2);
assert.equal(
  combined.find((a) => a.id === "shared").title,
  "Repository source",
);
assert.ok(combined.some((a) => a.id === "database-only"));
if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldKey;
console.log(
  "Article lookup/catalog passed: older-than-100 lookup, review metadata, public columns, slug validation, unified precedence and future/invalid exclusion.",
);
