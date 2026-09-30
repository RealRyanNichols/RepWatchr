import assert from "node:assert/strict";
import { getPollRequestOrigin, getPollVerificationConfig, verifyPollTurnstile } from "../src/lib/poll-verification";

function proxied(host: string, extra: Record<string, string> = {}) {
  return new Request("http://127.0.0.1:3102/api/races/marion-county-judge-2026/poll", { headers: { host, ...extra } });
}
assert.equal(getPollRequestOrigin(proxied("www.repwatchr.com"), "DigitalOcean", "production")?.origin, "https://www.repwatchr.com");
assert.equal(getPollRequestOrigin(proxied("repwatchr.com:443"), "DigitalOcean", "production")?.hostname, "repwatchr.com");
for (const host of ["foreign.example", "www.repwatchr.com.foreign.example", "www.repwatchr.com@foreign.example", "www.repwatchr.com:3502", "127.0.0.1:3502", "www.repwatchr.com,foreign.example", "www.repwatchr.com/path"]) {
  assert.equal(getPollRequestOrigin(proxied(host), "DigitalOcean", "production"), null);
}
assert.equal(getPollRequestOrigin(proxied("127.0.0.1:3502"), "DigitalOcean", "development")?.origin, "http://127.0.0.1:3502");
assert.equal(getPollRequestOrigin(proxied("foreign.example", { "x-forwarded-host": "www.repwatchr.com" }), "DigitalOcean", "production"), null);
assert.equal(getPollRequestOrigin(new Request("https://www.repwatchr.com/api/races/test/poll"), "Vercel", "production")?.origin, "https://www.repwatchr.com");

assert.deepEqual(getPollVerificationConfig("DigitalOcean", "", ""), { provider: "unavailable", siteKey: null });
assert.equal(getPollVerificationConfig("DigitalOcean", "site", "").provider, "unavailable");
assert.equal(getPollVerificationConfig("Vercel", "", "").provider, "botid");
assert.deepEqual(getPollVerificationConfig("DigitalOcean", "site", "secret"), { provider: "turnstile", siteKey: "site" });

let requests = 0;
const response = (body: unknown, status = 200): typeof fetch => (async (_url, init) => {
  requests += 1;
  assert.equal(JSON.parse(String(init?.body)).secret, "private-test-secret");
  assert.equal(init?.cache, "no-store");
  return new Response(JSON.stringify(body), { status });
}) as typeof fetch;
const good = { success: true, hostname: "www.repwatchr.com", action: "race_vote" };
assert.equal(await verifyPollTurnstile("token", "www.repwatchr.com", "private-test-secret", response(good)), "verified");
for (const bad of [null, [], { ...good, success: "true" }, { ...good, hostname: "evil.example" }, { ...good, action: "signup" }, { success: false, "error-codes": ["timeout-or-duplicate"] }]) {
  assert.equal(await verifyPollTurnstile("token", "www.repwatchr.com", "private-test-secret", response(bad)), "rejected");
}
const before = requests;
for (const token of [undefined, "", "x".repeat(2049)]) {
  assert.equal(await verifyPollTurnstile(token, "www.repwatchr.com", "private-test-secret", response(good)), "rejected");
}
assert.equal(requests, before);
assert.equal(await verifyPollTurnstile("token", "www.repwatchr.com", undefined, response(good)), "unavailable");
assert.equal(await verifyPollTurnstile("token", "www.repwatchr.com", "1x0000000000000000000000000000000AA", response(good)), "unavailable");
assert.equal(await verifyPollTurnstile("token", "www.repwatchr.com", "private-test-secret", response(good, 503)), "unavailable");
assert.equal(await verifyPollTurnstile("token", "www.repwatchr.com", "private-test-secret", (async () => { throw new Error("network failure"); }) as typeof fetch), "unavailable");
console.log("Poll verification: proxy origin/host boundaries, provider selection, hostname/action binding, rejection, replay failure, and outage handling passed.");
