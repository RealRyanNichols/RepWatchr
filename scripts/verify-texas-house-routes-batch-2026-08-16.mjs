import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const baseUrl = (process.env.REPWATCHR_SMOKE_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const districts = [
  1, 4, 5, 17, 29, 37, 51, 63, 68, 70, 74, 75, 80,
  84, 90, 91, 104, 139, 141, 143, 144, 145, 148, 149, 150,
];

for (const district of districts) {
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "officials", "state", `tx-house-hd${district}.json`), "utf8"));
  const [profileResponse, portraitResponse] = await Promise.all([
    fetch(`${baseUrl}/officials/${profile.id}`, { redirect: "manual" }),
    fetch(`${baseUrl}${profile.photo}`, { redirect: "manual" }),
  ]);
  if (profileResponse.status !== 200 || portraitResponse.status !== 200) {
    throw new Error(`${profile.id}: route status ${profileResponse.status}/${portraitResponse.status}`);
  }
  const html = await profileResponse.text();
  if (!html.includes(profile.name) || !html.toLowerCase().includes("voting record") || !html.includes("4,507")) {
    throw new Error(`${profile.id}: profile page is missing identity or record-level vote evidence`);
  }
  if (html.includes("undefined undefined") || html.includes("Application error")) {
    throw new Error(`${profile.id}: profile page contains an error marker`);
  }
  if (!(portraitResponse.headers.get("content-type") || "").startsWith("image/")) {
    throw new Error(`${profile.id}: portrait route returned a non-image content type`);
  }
}

console.log(`Profile and portrait routes passed for ${districts.length} Texas House officials at ${baseUrl}.`);
