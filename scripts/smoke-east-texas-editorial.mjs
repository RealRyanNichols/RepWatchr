import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const territory = read("src/lib/east-texas-launch-territory.ts");
const desk = read("src/app/east-texas/page.tsx");
const pipeline = read("src/lib/editorial-publishing.ts");
const social = read("src/lib/social-autopost.ts");
const migration = read("supabase/migrations/20260727074500_editorial_publishing_pipeline.sql");
const cron = JSON.parse(read("vercel.json"));

for (const required of ["Harrison", "Marion", "Gregg", "Upshur", "Harleton", "Longview", "Marshall", "Jefferson"]) {
  assert(territory.includes(`"${required}"`), `Launch territory is missing ${required}.`);
}
for (const gate of ["portrait", "biography", "officialContact", "publicSources", "socialLinks", "currentReview"]) {
  assert(territory.includes(gate), `Profile readiness gate is missing ${gate}.`);
}
assert(desk.includes("No free passes"), "East Texas editorial promise is missing.");
assert(desk.includes("The office decides the evidence"), "Role-aware accountability explanation is missing.");
assert(pipeline.includes('process.env.EDITORIAL_AUTOPUBLISH_ENABLED === "true"'), "Autopublishing is not explicitly gated.");
assert(pipeline.includes("primaryCount >= 1") && pipeline.includes("publishers >= 2"), "Source diversity gate is missing.");
assert(social.includes("/news/${row.slug}"), "Social posting does not point to the original RepWatchr article.");
assert(social.includes('["pending", "partial"]'), "Partial social failures cannot be retried.");
assert(migration.includes("repwatchr_articles_publish_gate"), "Database publish constraint is missing.");
assert(migration.includes("jsonb_array_length(source_links) >= 2"), "Database source-count gate is missing.");

const editorialCron = cron.crons.find((entry) => entry.path === "/api/cron/editorial-publishing");
assert(editorialCron?.schedule === "15 13 * * *", "Editorial cadence must run once daily, not produce more than the 3–5 story target.");

console.log("East Texas editorial and publishing smoke check passed.");
