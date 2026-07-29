const racePath = "/elections/texas/marion-county-judge-2026";
const dinaProfilePath = "/candidates/dina-k-carroll";
const lafleurProfilePath = "/officials/leward-j-lafleur-ii";
const portraitPaths = [
  "/images/races/marion-county-judge-2026/dina-carroll-portrait.jpg",
  "/images/races/marion-county-judge-2026/leward-lafleur-portrait.jpg",
];

const routeChecks = [
  {
    path: racePath,
    label: "Marion County race route",
    markers: [
      "Dina K. Carroll",
      "Leward J. LaFleur II",
      "Live community pulse",
      "If the election were today, who would you support?",
      "See the people—not campaign placeholders",
      "dina-carroll-portrait.jpg",
      "leward-lafleur-portrait.jpg",
    ],
  },
  {
    path: dinaProfilePath,
    label: "Dina Carroll profile route",
    markers: [
      "Dina K. Carroll",
      "Current ballot status",
      "dina-carroll-portrait.jpg",
    ],
  },
  {
    path: lafleurProfilePath,
    label: "Leward LaFleur profile route",
    markers: [
      "Leward J. LaFleur II",
      "Marion County Judge",
      "leward-lafleur-portrait.jpg",
    ],
  },
];

const pollApiPath = "/api/races/marion-county-judge-2026/poll";

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

function readJpegDimensions(bytes) {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }

    if (length < 2) break;
    offset += 2 + length;
  }

  return null;
}

const baseUrl = resolveBaseUrl(
  process.argv[2] || process.env.REPWATCHR_DEPLOY_BASE_URL,
);
const failures = [];

for (const routeCheck of routeChecks) {
  try {
    const routeUrl = new URL(routeCheck.path, baseUrl);
    const response = await fetchExact(routeUrl, routeCheck.label);
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("text/html")) {
      throw new Error(
        `${routeCheck.label} returned non-HTML content-type: ${contentType || "missing"}`,
      );
    }

    const html = await response.text();
    const normalizedHtml = html.toLowerCase();

    for (const marker of routeCheck.markers) {
      if (!normalizedHtml.includes(marker.toLowerCase())) {
        failures.push(`${routeCheck.label} is missing required marker: ${marker}`);
      }
    }

    for (const marker of forbiddenPlaceholderMarkers) {
      if (normalizedHtml.includes(marker.toLowerCase())) {
        failures.push(`${routeCheck.label} still contains placeholder marker: ${marker}`);
      }
    }

    if (!normalizedHtml.includes('property="og:image"')) {
      failures.push(`${routeCheck.label} is missing an Open Graph image`);
    }
  } catch (error) {
    failures.push(error.message);
  }
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

    const dimensions = readJpegDimensions(bytes);
    if (!dimensions || dimensions.width < 800 || dimensions.height < 800) {
      throw new Error(
        `portrait ${portraitPath} is below the 800 × 800 release threshold`,
      );
    }
  } catch (error) {
    failures.push(error.message);
  }
}

try {
  const pollUrl = new URL(pollApiPath, baseUrl);
  const response = await fetchExact(pollUrl, "Marion County community pulse API");
  const payload = await response.json();

  if (
    payload.enabled !== true ||
    typeof payload.canVote !== "boolean" ||
    payload.question !== "If the election were today, who would you support?" ||
    payload.minimumSample !== 25 ||
    !Array.isArray(payload.options) ||
    payload.options.length !== 2
  ) {
    failures.push("the community pulse API returned an invalid public contract");
  }

  const optionIds = payload.options.map((option) => option.optionId);
  for (const expected of ["dina-k-carroll", "leward-j-lafleur-ii"]) {
    if (!optionIds.includes(expected)) {
      failures.push(`the community pulse API is missing option ${expected}`);
    }
  }

  if (
    payload.responseCount < payload.minimumSample &&
    payload.options.some(
      (option) => option.votes !== null || option.percent !== null,
    )
  ) {
    failures.push("the community pulse API exposed a candidate split below threshold");
  }
} catch (error) {
  failures.push(error.message);
}

if (failures.length > 0) {
  console.error("Marion County post-deploy verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Marion County post-deploy verification passed for ${baseUrl.origin}.`);
console.log(`Verified routes: ${routeChecks.length}`);
console.log(`Verified portraits: ${portraitPaths.length}`);
console.log("Verified community pulse: live aggregate contract and threshold");
