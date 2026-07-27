import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const componentPath = path.join(
  root,
  "src/components/editorial/EditorialOpening.tsx",
);
const pagePath = path.join(root, "src/app/daily-wire/page.tsx");

const component = fs.readFileSync(componentPath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");

const assertions = [
  [
    component.includes("type EditorialOpeningProps") &&
      component.includes("facts: readonly ["),
    "the shared opening requires a compact typed fact rail",
  ],
  [
    component.includes("<Image") &&
      component.includes("fill") &&
      component.includes('sizes="(min-width: 1024px) 53vw, 100vw"'),
    "the dominant image is responsive and layout-stable",
  ],
  [
    component.includes("<h1") &&
      component.includes("question") &&
      component.includes("primaryAction"),
    "the opening requires one headline, accountability question, and primary action",
  ],
  [
    page.includes('import EditorialOpening from "@/components/editorial/EditorialOpening"') &&
      (page.match(/<EditorialOpening/g) ?? []).length === 1,
    "Daily Watch Wire uses the shared opening exactly once",
  ],
  [
    page.includes("washington-accountability-blue-hour.webp") &&
      page.includes("Open newest receipt"),
    "Daily Watch Wire gives the visual a source-led next action",
  ],
  [
    page.includes('aria-label="Daily Watch Wire lanes"') &&
      page.includes('id="wire-records"'),
    "lane navigation and the record target remain available",
  ],
];

const failures = assertions
  .filter(([passes]) => !passes)
  .map(([, message]) => message);

if (failures.length) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(`Editorial opening QA passed (${assertions.length} assertions).`);
