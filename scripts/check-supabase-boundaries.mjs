#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const srcRoot = join(root, "src");
const dangerousClientPattern =
  /process\.env\.SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdminClient|from\s+["']@\/lib\/supabase-admin["']|from\s+["']\.\.?\/.*supabase-admin["']/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      yield* walk(path);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) yield path;
  }
}

const violations = [];

for (const path of walk(srcRoot)) {
  const rel = relative(root, path);
  const text = readFileSync(path, "utf8");
  const isClientComponent = /^\s*["']use client["'];?/m.test(text);

  if (isClientComponent && dangerousClientPattern.test(text)) {
    violations.push(rel);
  }
}

if (violations.length > 0) {
  console.error("Service-role boundary check failed. Review these files:");
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log("Service-role boundary check passed.");
