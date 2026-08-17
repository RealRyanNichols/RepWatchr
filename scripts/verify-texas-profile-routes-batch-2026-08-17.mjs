import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const houseDistricts = [20, 39, 103, 119, 125, 126, 133, 136, 146, 147];
const federalDistricts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17];
const profiles = [
  ...houseDistricts.map((district) => `src/data/officials/state/tx-house-hd${district}.json`),
  ...federalDistricts.map((district) => `src/data/officials/federal/us-house-tx${district}.json`),
].map((relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")));

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

const errors = [];
for (const profile of profiles) {
  const [profileResponse, portraitResponse] = await Promise.all([
    fetch(`${baseUrl}/officials/${profile.id}`),
    fetch(`${baseUrl}${profile.photo}`),
  ]);
  if (profileResponse.status !== 200 || portraitResponse.status !== 200) errors.push(`${profile.id}: route status ${profileResponse.status}/${portraitResponse.status}`);
  const html = decodeHtml(await profileResponse.text());
  if (!html.includes(profile.name) || !html.includes(profile.district) || !html.includes("Official links, public receipts, and the missing record")) errors.push(`${profile.id}: rendered identity/source content missing`);
  if (!html.includes("No verified sentiment result is published") || !html.includes("No approved critical item is loaded") || !html.includes("No approved article has been classified as positive coverage")) errors.push(`${profile.id}: evidence gates not visible`);
  if (html.includes("Application error") || html.includes("Internal Server Error")) errors.push(`${profile.id}: rendered error overlay`);
  if (!(portraitResponse.headers.get("content-type") ?? "").startsWith("image/")) errors.push(`${profile.id}: portrait route is not an image`);
}

if (profiles.length !== 25) errors.push(`Expected 25 profiles; found ${profiles.length}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Profile and portrait routes passed for ${profiles.length} Texas officials at ${baseUrl}.`);
