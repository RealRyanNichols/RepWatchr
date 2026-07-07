const baseUrl = (process.env.REPWATCHR_SMOKE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const jsonOutput = process.argv.includes("--json");
const allowKnownGaps = process.argv.includes("--allow-known-gaps");

const routes = [
  { label: "homepage", path: "/", type: "public", checkText: "RepWatchr" },
  { label: "known gap search redirects to Faretta AI", path: "/search", type: "gap", knownGap: true },
  { label: "officials", path: "/officials", type: "public", checkText: "official" },
  { label: "official profile", path: "/officials/ted-cruz", type: "public", checkText: "Ted Cruz" },
  { label: "submit source", path: "/submit-source", type: "public", checkText: "source" },
  { label: "free packet", path: "/free-packet", type: "public", checkText: "packet" },
  { label: "public records response", path: "/tools/public-records-response", type: "public", checkText: "records" },
  { label: "services", path: "/services", type: "public", checkText: "services" },
  { label: "quick record check service", path: "/services/quick-record-check", type: "public", checkText: "Quick" },
  { label: "sample race", path: "/elections/texas/texas-us-senate-2026", type: "public", checkText: "Senate" },
  { label: "sample story", path: "/news/uap-file-dump-congress-attention-2026", type: "public", checkText: "UAP" },
  { label: "privacy", path: "/privacy", type: "public", checkText: "Privacy" },
  { label: "methodology", path: "/methodology", type: "public", checkText: "methodology" },
  { label: "sitemap", path: "/sitemap.xml", type: "seo", contentType: "xml" },
  { label: "robots", path: "/robots.txt", type: "seo", checkText: "Sitemap" },
  { label: "dashboard", path: "/dashboard", type: "private", allowRedirect: true },
  { label: "admin", path: "/admin", type: "private", allowRedirect: true },
  { label: "admin quality", path: "/admin/quality", type: "private", allowRedirect: true },
  { label: "known gap source packet tool alias", path: "/tools/source-packet-builder", type: "gap", knownGap: true },
  { label: "known gap public records request tool", path: "/tools/public-records-request", type: "gap", knownGap: true },
  { label: "known gap package route", path: "/packages/quick-record-check", type: "gap", knownGap: true },
  { label: "known gap official record brief package route", path: "/packages/official-record-brief", type: "gap", knownGap: true },
  { label: "known gap local race source pack package route", path: "/packages/local-race-source-pack", type: "gap", knownGap: true },
  { label: "known gap election watch desk package route", path: "/packages/election-watch-desk", type: "gap", knownGap: true },
  { label: "known gap jurisdiction hub route", path: "/jurisdictions/texas", type: "gap", knownGap: true },
  { label: "known gap dashboard privacy", path: "/dashboard/privacy", type: "gap", knownGap: true, allowRedirect: true },
  { label: "known gap admin analytics", path: "/admin/analytics", type: "gap", knownGap: true, allowRedirect: true },
  { label: "known gap admin sources", path: "/admin/sources", type: "gap", knownGap: true, allowRedirect: true },
  { label: "known gap admin monetization", path: "/admin/monetization", type: "gap", knownGap: true, allowRedirect: true },
  { label: "known gap admin seo", path: "/admin/seo", type: "gap", knownGap: true, allowRedirect: true },
];

const forbiddenPublicText = [
  "Stripe link not configured yet",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "OPENAI_API_KEY",
  "undefined undefined",
];

function result(route, status, note, ok) {
  return { label: route.label, path: route.path, type: route.type, status, note, ok };
}

async function checkRoute(route) {
  let response;
  try {
    response = await fetch(`${baseUrl}${route.path}`, {
      redirect: "manual",
      headers: {
        "user-agent": "RepWatchr QA route smoke check",
      },
    });
  } catch (error) {
    return result(route, 0, error instanceof Error ? error.message : "request failed", false);
  }

  if (route.knownGap) {
    const isMissing = response.status === 404 || response.status === 308 || response.status === 307 || response.status === 302 || response.status === 301;
    return result(
      route,
      response.status,
      isMissing ? "known route gap documented" : "known gap now responds; review route inventory",
      allowKnownGaps ? true : !isMissing,
    );
  }

  const okStatus = response.status >= 200 && response.status < 400;
  if (!okStatus) return result(route, response.status, `unexpected HTTP ${response.status}`, false);

  if (response.status >= 300) {
    if (!route.allowRedirect) return result(route, response.status, "unexpected redirect", false);
    return result(route, response.status, response.headers.get("location") || "redirect", true);
  }

  const contentType = response.headers.get("content-type") || "";
  if (route.contentType === "xml" && !contentType.includes("xml")) {
    return result(route, response.status, `expected XML but got ${contentType}`, false);
  }
  if (!route.contentType && !contentType.includes("text/html") && route.type !== "seo") {
    return result(route, response.status, `expected HTML but got ${contentType}`, false);
  }

  const body = await response.text();
  if (route.type === "private") {
    const lower = body.toLowerCase();
    const gated = lower.includes("requires supabase auth") || lower.includes("supabase auth is required") || lower.includes("login") || lower.includes("admin offline") || lower.includes("member database offline") || lower.includes("quality desk offline");
    const exposed = lower.includes("admin dashboard") || lower.includes("member dashboard") || lower.includes("server-side admin role verified");
    if (exposed && !gated) return result(route, response.status, "private content appears publicly accessible", false);
    if (!gated && response.status === 200) return result(route, response.status, "private route returned 200 without a clear auth gate", false);
  }
  const forbidden = forbiddenPublicText.find((text) => body.includes(text));
  if (forbidden) return result(route, response.status, `forbidden public text: ${forbidden}`, false);
  if (route.checkText && !body.toLowerCase().includes(route.checkText.toLowerCase())) {
    return result(route, response.status, `missing expected text: ${route.checkText}`, false);
  }

  return result(route, response.status, "ok", true);
}

async function main() {
  const results = [];
  for (const route of routes) {
    results.push(await checkRoute(route));
  }
  const failures = results.filter((item) => !item.ok);

  if (jsonOutput) {
    console.log(JSON.stringify({ baseUrl, ok: failures.length === 0, results }, null, 2));
  } else {
    console.log(`RepWatchr route smoke results for ${baseUrl}`);
    for (const item of results) {
      console.log(`${item.ok ? "PASS" : "FAIL"} ${item.status} ${item.path} - ${item.note}`);
    }
  }

  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
