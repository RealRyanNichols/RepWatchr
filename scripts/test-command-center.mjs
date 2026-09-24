import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync("src/lib/command-center-metrics.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { summarizeTraffic } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const event = (overrides = {}) => ({ event_name: "page_view", anonymous_session_id: "browser-1", route: "/news/story?private=discard", referrer: "https://x.com/example?token=discard", utm_source: null, device_kind: "mobile", created_at: "2026-09-23T12:00:00Z", ...overrides });
const report = summarizeTraffic([
  event(), event(), event({ anonymous_session_id: null }),
  event({ device_kind: "bot", anonymous_session_id: "bot" }),
  event({ event_name: "article_open" }), event({ event_name: "social_share_clicked" }),
  event({ event_name: "signup_completed" }),
], 7, new Date("2026-09-23T13:00:00Z"));
assert.equal(report.views, 3);
assert.equal(report.browsers, 1);
assert.equal(report.clicks, 2);
assert.equal(report.articleOpens, 1);
assert.equal(report.daily.length, 7);
assert.equal(report.daily.at(-1).views, 3);
assert.deepEqual(report.pages, [{ label: "/news/story", count: 3 }]);
assert.deepEqual(report.sources, [{ label: "x.com", count: 3 }]);
assert.equal(summarizeTraffic([], 7).views, 0);
const page = readFileSync("src/app/admin/command-center/page.tsx", "utf8");
assert(page.indexOf("await requireAdminPageAccess()") < page.indexOf("await getCommandCenter("));
assert(page.includes("index: false"));
console.log("Command center: bot filtering, metric separation, privacy, empty state and auth boundary passed.");
