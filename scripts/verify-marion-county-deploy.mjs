const racePath = "/elections/texas/marion-county-judge-2026";
const portraitPaths = [
  "/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg",
  "/images/races/marion-county-judge-2026/leward-lafleur-portrait.jpg",
];

const requiredHtmlMarkers = [
  "Dina K. Carroll",
  "Leward J. LaFleur II",
  "Highest verified public image",
  "Full profiles",
  "Accountability",
];

const forbiddenPlaceholderMarkers = [
  "High-resolution photo release requested",
  "Portrait authorization pending",
  "Two different claims on county leadership",
];

function usage() {
  console.error(
    "Usage: npm run verify:marion-deploy -- https://preview-or-production.example",
  );
  process.exit(2);
}

function resolveBaseUrl(value) {
  if (!value) usage();

  let url;
  try {
    url = new URL(value);
  } catch {
    usage();
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    usage();
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url;
}

async function fetchExact(url, label) {
  let response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      headers: {
        "user-agent": "RepWatchr post-deploy verifier",
      },
    });
  } catch (error) {
    throw new Error(`${label} request failed: ${error.message}`);
  }

  if (response.status !== 200) {
    const location = response.headers.get("location");
    const redirectNote = location ? ` (redirected to ${location})` : "";
    throw new Error(`${label} returned HTTP ${response.status}${redirectNote}`);
  }

  return response;
}

const baseUrl = resolveBaseUrl(
  process.argv[2] || process.env.REPWATCHR_DEPLOY_BASE_URL,
);
const failures = [];

try {
  const routeUrl = new URL(racePath, baseUrl);
  const response = await fetchExact(routeUrl, "Marion County race route");
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(
      `Marion County race route returned non-HTML content-type: ${contentType || "missing"}`,
    );
  }

  const html = await response.text();
  const normalizedHtml = html.toLowerCase();

  for (const marker of requiredHtmlMarkers) {
    if (!normalizedHtml.includes(marker.toLowerCase())) {
      failures.push(`race HTML is missing required marker: ${marker}`);
    }
  }

  for (const marker of forbiddenPlaceholderMarkers) {
    if (normalizedHtml.includes(marker.toLowerCase())) {
      failures.push(`race HTML still contains placeholder marker: ${marker}`);
    }
  }
} catch (error) {
  failures.push(error.message);
}

for (const portraitPath of portraitPaths) {
  try {
    const portraitUrl = new URL(portraitPath, baseUrl);
    const response = await fetchExact(portraitUrl, `portrait ${portraitPath}`);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (!contentType.startsWith("image/")) {
      throw new Error(
        `portrait ${portraitPath} returned non-image content-type: ${contentType || "missing"}`,
      );
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (
      bytes.length < 1_024 ||
      bytes[0] !== 0xff ||
      bytes[1] !== 0xd8 ||
      bytes[2] !== 0xff
    ) {
      throw new Error(`portrait ${portraitPath} did not return a valid JPEG body`);
    }
  } catch (error) {
    failures.push(error.message);
  }
}

if (failures.length > 0) {
  console.error("Marion County post-deploy verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Marion County post-deploy verification passed for ${baseUrl.origin}.`);
console.log(`Verified route: ${new URL(racePath, baseUrl)}`);
console.log(`Verified portraits: ${portraitPaths.length}`);
