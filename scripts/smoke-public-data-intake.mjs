import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

// Execute the real validation and route with a database double. Never send test
// requests to a production inbox or issue a real API key.
const require = createRequire(import.meta.url);
function load(relative, dependencies = {}) {
  const filename = fileURLToPath(new URL(relative, import.meta.url));
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(source, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: (name) => {
      if (name in dependencies) return dependencies[name];
      if (name === "crypto") return require("node:crypto");
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: {} },
    URL,
  }, { filename });
  return loadedModule.exports;
}

const config = load("../src/lib/public-data-api-config.ts");
const cleaning = load("../src/lib/source-submissions.ts");
const library = load("../src/lib/public-data-api.ts", {
  "@/lib/feature-flags": {},
  "@/lib/public-data-api-config": config,
  "@/lib/source-submissions": cleaning,
  "@/lib/supabase-admin": {},
});
let inserted = [];
let databaseAvailable = true;
let databaseError = null;
const client = {
  from: (table) => {
    assert.equal(table, "api_access_requests");
    return { insert: (row) => {
      inserted.push(row);
      return { select: () => ({ maybeSingle: async () => ({
        data: databaseError ? null : { id: "test-reference" }, error: databaseError,
      }) }) };
    } };
  },
};
const route = load("../src/app/api/public-data-api/request-access/route.ts", {
  "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
  "@/lib/supabase-server": { createServerSupabaseClient: () => { throw new Error("Anonymous test must not load auth"); } },
  "@/lib/supabase-admin": { getSupabaseAdminClient: () => databaseAvailable ? client : null },
  "@/lib/public-data-api": { ...library, recordApiUsageEvent: async () => ({ skipped: true }) },
});
const valid = {
  email: " researcher@example.org ", name: "Researcher", organization: "",
  jurisdictionFocus: "Harrison County, Texas", requestedScope: "public_profiles_read",
  useCase: "A weekly CSV of public officeholders and linked roster changes.",
};
const request = (body) => new Request("https://repwatchr.example/api/public-data-api/request-access", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
});
for (const invalid of [null, [], {}, { ...valid, email: "bad" }, { ...valid, name: "" },
  { ...valid, useCase: " " }, { ...valid, jurisdictionFocus: "" },
  { ...valid, requestedScope: "admin_internal" }, { ...valid, requestedScope: "unknown" }]) {
  assert.equal((await route.POST(request(invalid))).status, 400);
}
assert.equal(inserted.length, 0, "Invalid requests must not write to the database");
const response = await route.POST(request({ ...valid, status: "approved", userId: "forged", scopes: ["admin_internal"] }));
assert.equal(response.status, 200);
assert.equal((await response.json()).id, "test-reference");
assert.equal(inserted[0].status, "new");
assert.equal(inserted[0].user_id, null);
assert.equal(inserted[0].email, "researcher@example.org");
assert.equal(inserted[0].jurisdiction_focus, valid.jurisdictionFocus);
assert.equal(inserted[0].requested_scope, "public_profiles_read");
assert.equal("scopes" in inserted[0], false);

databaseError = { code: "TEST_FAILURE", message: "private database details" };
const failed = await route.POST(request(valid));
assert.equal(failed.status, 503);
assert.equal((await failed.text()).includes(databaseError.message), false);
databaseAvailable = false;
inserted = [];
assert.equal((await route.POST(request(valid))).status, 503);
assert.equal(inserted.length, 0);
console.log("Public data intake passed: validation, pending-only storage, reference, and safe failures.");
