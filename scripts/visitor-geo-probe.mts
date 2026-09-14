import { classifyVisitor, visitorGeoFromHeaders } from "@/lib/visitor-geo";

/**
 * The classifier decides who the audience is, so the cases that matter are the
 * ones where a wrong answer would send the beat in the wrong direction.
 */

const problems: string[] = [];

function expect(label: string, got: string, want: string) {
  if (got !== want) problems.push(`${label}: expected ${want}, got ${got}`);
}

expect("Longview, TX", classifyVisitor({ city: "Longview", region: "TX", country: "US" }).tier, "home-district");
expect("Marshall, TX", classifyVisitor({ city: "Marshall", region: "TX", country: "US" }).tier, "home-district");

// A city name alone is not a district. Longview, Washington is not East Texas,
// and filing it as a constituent would be the whole point of this missed.
expect("Longview, WA", classifyVisitor({ city: "Longview", region: "WA", country: "US" }).tier, "national");

// Launch territory outside the HD-7 / TX-01 footprint.
expect("Texarkana, TX", classifyVisitor({ city: "Texarkana", region: "TX", country: "US" }).tier, "east-texas");

expect("Austin, TX", classifyVisitor({ city: "Austin", region: "TX", country: "US" }).tier, "texas");
expect("Phoenix, AZ", classifyVisitor({ city: "Phoenix", region: "AZ", country: "US" }).tier, "national");
expect("London, GB", classifyVisitor({ city: "London", region: "ENG", country: "GB" }).tier, "outside");

// Missing city still places the reader in Texas rather than guessing local.
expect("unknown city in TX", classifyVisitor({ city: null, region: "TX", country: "US" }).tier, "texas");
expect("nothing at all", classifyVisitor({}).tier, "national");

// Case and encoding both come off the wire in forms that must still match.
expect("lowercase longview", classifyVisitor({ city: "longview", region: "tx", country: "US" }).tier, "home-district");
expect(
  "percent-encoded Mount Pleasant",
  classifyVisitor({ city: "Mount%20Pleasant", region: "TX", country: "US" }).tier,
  "east-texas",
);

// The header path is what production actually uses.
const headers = new Headers({
  // Kilgore is in Gregg County, which is HD-7, so it reads as home-district.
  "x-vercel-ip-city": "Kilgore",
  "x-vercel-ip-country-region": "TX",
  "x-vercel-ip-country": "US",
});
const fromHeaders = visitorGeoFromHeaders(headers);
expect("headers: Kilgore TX", fromHeaders.tier, "home-district");
if (fromHeaders.city !== "Kilgore") problems.push(`headers city not decoded: ${fromHeaders.city}`);

// No headers at all (local dev, a bot) must not throw.
const empty = visitorGeoFromHeaders(new Headers());
if (!empty.tier) problems.push("An empty header set produced no tier.");

console.log(JSON.stringify({ problems }));
