const baseUrl = process.env.REPWATCHR_SMOKE_BASE_URL || "http://127.0.0.1:3000";

const routes = [
  { label: "homepage", path: "/" },
  { label: "officials", path: "/officials" },
  { label: "school boards", path: "/school-boards" },
  { label: "services", path: "/services" },
  { label: "submit source", path: "/submit-source" },
  { label: "signup", path: "/auth/signup" },
  { label: "dashboard", path: "/dashboard", allowRedirect: true },
  { label: "admin", path: "/admin", allowRedirect: true },
  { label: "article/story", path: "/news/health-care-costs-midterms-2026" },
  { label: "official profile", path: "/officials/ted-cruz" },
];

const forbiddenPublicText = [
  "Stripe link not configured yet",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "undefined undefined",
];

async function checkRoute(route) {
  const response = await fetch(`${baseUrl}${route.path}`, {
    redirect: "manual",
    headers: {
      "user-agent": "RepWatchr route smoke check",
    },
  });

  const okStatus = response.status >= 200 && response.status < 400;
  if (!okStatus) {
    throw new Error(`${route.label} ${route.path} returned HTTP ${response.status}`);
  }

  if (response.status >= 300) {
    if (!route.allowRedirect) {
      throw new Error(`${route.label} ${route.path} redirected unexpectedly with HTTP ${response.status}`);
    }
    return { ...route, status: response.status, note: response.headers.get("location") || "redirect" };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    throw new Error(`${route.label} ${route.path} returned non-HTML content-type: ${contentType}`);
  }

  const html = await response.text();
  const forbidden = forbiddenPublicText.find((text) => html.includes(text));
  if (forbidden) {
    throw new Error(`${route.label} ${route.path} exposes forbidden text: ${forbidden}`);
  }
  if (!html.includes("RepWatchr")) {
    throw new Error(`${route.label} ${route.path} is missing RepWatchr brand text`);
  }

  return { ...route, status: response.status, note: "ok" };
}

async function main() {
  const results = [];
  for (const route of routes) {
    results.push(await checkRoute(route));
  }

  console.log("Route smoke checks passed:");
  for (const result of results) {
    console.log(`- ${result.label}: ${result.path} (${result.status}, ${result.note})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
