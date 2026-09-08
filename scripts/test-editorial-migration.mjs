// Isolated Postgres tests only. This script never accepts a database URL.
import assert from "node:assert/strict";
import fs from "node:fs";
const { PGlite } = await import(
  process.env.REPWATCHR_PGLITE_PATH || "@electric-sql/pglite"
);
const db = new PGlite();
await db.exec(
  "create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon, authenticated, service_role;",
);
const migration = fs.readFileSync(
  new URL(
    "../supabase/migrations/20260908_editorial_articles.sql",
    import.meta.url,
  ),
  "utf8",
);
await db.exec(migration);
await db.exec(migration);
async function as(role, query) {
  await db.exec("begin");
  try {
    await db.exec(`set local role ${role}`);
    const result = await db.query(query);
    await db.exec("commit");
    return result;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}
const insert = (slug, extra = "", values = "") =>
  `insert into repwatchr_articles(slug,title,dek,content,topic_key,scope${extra}) values ('${slug}','Test article','Test summary',repeat('Isolated test content. ',10),'test','texas'${values})`;
await as("service_role", insert("private-draft"));
const fields =
  ",editorial_status,publish_status,reviewed_by,reviewed_at,published_at,source_links,idempotency_key";
const publication = (date, key) =>
  `,'approved','published','Source review',now(),${date},'[{"url":"https://example.invalid/record","title":"Test source"}]','${key}'`;
await as(
  "service_role",
  insert(
    "public-article",
    fields,
    publication("now()-interval '1 day'", "unique-public"),
  ),
);
await as(
  "service_role",
  insert(
    "scheduled-article",
    fields,
    publication("now()+interval '1 day'", "unique-future"),
  ),
);
await assert.rejects(() =>
  as(
    "service_role",
    insert("unreviewed-publish", ",publish_status", ",'published'"),
  ),
);
await assert.rejects(() =>
  as(
    "service_role",
    insert(
      "empty-sources",
      ",editorial_status,publish_status,reviewed_by,reviewed_at,published_at",
      ",'approved','published','Review',now(),now()",
    ),
  ),
);
await assert.rejects(() =>
  as(
    "service_role",
    insert("duplicate-run", fields, publication("now()", "unique-public")),
  ),
);
for (const role of ["anon", "authenticated"]) {
  assert.deepEqual(
    (
      await as(
        role,
        "select slug,title,content from repwatchr_articles order by slug",
      )
    ).rows.map((r) => r.slug),
    ["public-article"],
  );
  for (const query of [
    insert("client-write"),
    "select metadata from repwatchr_articles",
    "select risk_flags from repwatchr_articles",
    "select * from repwatchr_editorial_runs",
    "truncate repwatchr_articles",
    "update repwatchr_articles set editorial_status='approved'",
    "delete from repwatchr_articles",
  ])
    await assert.rejects(() => as(role, query));
}
assert.equal(
  (await as("service_role", "select count(*)::int n from repwatchr_articles"))
    .rows[0].n,
  3,
);
console.log(
  "Editorial migration passed: repeatable schema, public-only reads, hidden drafts/future articles, private metadata, denied client writes, review/source constraints and idempotency.",
);
await db.close();
