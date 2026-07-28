import { safeNextPath } from "../src/lib/safe-next-path.ts";

const accepted = new Map([
  ["/dashboard", "/dashboard"],
  ["/dashboard?watch=official-123", "/dashboard?watch=official-123"],
  ["/elections/texas/marion-county-judge-2026#community-poll", "/elections/texas/marion-county-judge-2026#community-poll"],
  ["/officials/../candidates/dina-k-carroll", "/candidates/dina-k-carroll"],
]);

const rejected = [
  null,
  "",
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "/%5cevil.example",
  "/%255cevil.example",
  "/%2f%2fevil.example",
  "/%252f%252fevil.example",
  "/dashboard%0d%0aLocation:%20https://evil.example",
  " /dashboard",
  "/dashboard ",
  "%",
];

for (const [input, expected] of accepted) {
  const actual = safeNextPath(input);
  if (actual !== expected) {
    throw new Error(`Expected ${JSON.stringify(input)} to normalize to ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
  }
}

for (const input of rejected) {
  const actual = safeNextPath(input);
  if (actual !== "/dashboard") {
    throw new Error(`Expected ${JSON.stringify(input)} to fail closed, got ${JSON.stringify(actual)}.`);
  }
}

console.log("Safe member return-path smoke passed.");
