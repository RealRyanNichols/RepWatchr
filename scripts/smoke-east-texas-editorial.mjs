import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const territory = read("src/lib/east-texas-launch-territory.ts");
const desk = read("src/app/east-texas/page.tsx");
const pipeline = read("src/lib/editorial-publishing.ts");
const social = read("src/lib/social-autopost.ts");
const editorialRoute = read("src/app/api/cron/editorial-publishing/route.ts");
const socialRoute = read("src/app/api/cron/hourly-social-posts/route.ts");
const environmentExample = read(".env.local.example");
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
assert(editorialRoute.includes('process.env.EDITORIAL_PIPELINE_ENABLED !== "true"'), "Editorial publishing needs an explicit server-side release gate.");
assert(socialRoute.includes('process.env.SOCIAL_PIPELINE_V2_ENABLED !== "true"'), "Social distribution needs an explicit server-side release gate.");
assert(environmentExample.includes("EDITORIAL_PIPELINE_ENABLED=false"), "The editorial release gate must default to off.");
assert(environmentExample.includes("SOCIAL_PIPELINE_V2_ENABLED=false"), "The social release gate must default to off.");
assert(social.includes('process.env.FACEBOOK_AUTOPOST_ENABLED === "true"'), "Facebook needs an independent posting kill switch.");
assert(social.includes('process.env.X_AUTOPOST_ENABLED === "true"'), "X needs an independent posting kill switch.");

const editorialCron = cron.crons.find((entry) => entry.path === "/api/cron/editorial-publishing");
assert(!editorialCron, "Editorial publishing must not be scheduled until its database and editorial acceptance checks pass.");

console.log("East Texas editorial release-gate smoke check passed.");
