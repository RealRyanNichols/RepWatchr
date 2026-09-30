export type PollVerificationConfig = {
  provider: "turnstile" | "botid" | "unavailable";
  siteKey: string | null;
};

export { getSiteRequestOrigin as getPollRequestOrigin } from "./site-request-origin";

/** DigitalOcean must never silently fall back to Vercel's challenge service. */
export function getPollVerificationConfig(hosting: string | undefined, siteKey: string | undefined, secretKey: string | undefined): PollVerificationConfig {
  if (siteKey?.trim() && secretKey?.trim()) return { provider: "turnstile", siteKey: siteKey.trim() };
  return { provider: hosting === "DigitalOcean" ? "unavailable" : "botid", siteKey: null };
}

export async function verifyPollTurnstile(token: unknown, hostname: string, secretKey: string | undefined, fetcher: typeof fetch = fetch): Promise<"verified" | "rejected" | "unavailable"> {
  if (!secretKey?.trim()) return "unavailable";
  if (typeof token !== "string" || token.length < 1 || token.length > 2048) return "rejected";
  // Cloudflare's public testing keys must not authorize production votes.
  if (["www.repwatchr.com", "repwatchr.com"].includes(hostname) && /^[123]x0{8}/.test(secretKey)) return "unavailable";
  try {
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) return "unavailable";
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return "rejected";
    const verification = result as Record<string, unknown>;
    return verification.success === true && verification.hostname === hostname && verification.action === "race_vote" ? "verified" : "rejected";
  } catch {
    return "unavailable";
  }
}
