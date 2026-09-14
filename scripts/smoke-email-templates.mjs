#!/usr/bin/env node
/**
 * Guard the Supabase auth email templates.
 *
 * These are pasted into a dashboard by hand, which is the failure mode worth
 * catching: a template that renders fine in a browser can still be broken as
 * an email. A mistyped variable ships a literal "{{ .ConfirmationURL }}" as
 * the href, and the reader gets an email whose only button goes nowhere. That
 * is invisible in a preview and obvious to every recipient.
 *
 * Also writes rendered previews with sample values to
 * .previews/email/*.html so the templates can be opened in a browser as the
 * reader will see them, variables filled in.
 *
 * Run: npm run smoke:email-templates
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dir = resolve(root, "supabase", "email-templates");
const previewDir = resolve(root, ".previews", "email");

/** Gmail clips a message past 102 KB and hides everything after, footer included. */
const GMAIL_CLIP_BYTES = 102 * 1024;

/** Which Supabase variables each template must carry to actually work. */
const REQUIRED = {
  "confirm-signup": ["{{ .ConfirmationURL }}", "{{ .Token }}", "{{ .Email }}"],
  "magic-link": ["{{ .ConfirmationURL }}", "{{ .Token }}"],
  "reset-password": ["{{ .ConfirmationURL }}", "{{ .Token }}"],
  "change-email": ["{{ .ConfirmationURL }}", "{{ .Token }}", "{{ .Email }}", "{{ .NewEmail }}"],
  invite: ["{{ .ConfirmationURL }}", "{{ .Token }}", "{{ .Email }}"],
  reauthentication: ["{{ .Token }}"],
};

/** Reauthentication gets a bare code from Supabase. A button here would 404. */
const NO_LINK = new Set(["reauthentication"]);

const SAMPLE = {
  "{{ .ConfirmationURL }}": "https://www.repwatchr.com/auth/callback?token=sample&type=signup&next=%2Fdashboard",
  "{{ .Token }}": "481920",
  "{{ .TokenHash }}": "sample-token-hash",
  "{{ .Email }}": "voter@example.com",
  "{{ .NewEmail }}": "new-address@example.com",
  "{{ .SiteURL }}": "https://www.repwatchr.com",
};

const failures = [];
const fail = (name, message) => failures.push(`${name}: ${message}`);

const files = readdirSync(dir).filter((f) => f.endsWith(".html")).sort();

for (const expected of Object.keys(REQUIRED)) {
  if (!files.includes(`${expected}.html`)) fail(expected, "template file is missing");
}

for (const file of files) {
  const name = file.replace(/\.html$/, "");
  const html = readFileSync(resolve(dir, file), "utf8");
  const bytes = Buffer.byteLength(html);

  if (!REQUIRED[name]) {
    fail(name, "unexpected template; add it to REQUIRED so its variables are checked");
    continue;
  }

  for (const variable of REQUIRED[name]) {
    if (!html.includes(variable)) fail(name, `missing required variable ${variable}`);
  }

  // A variable that survives into the sent mail as literal text means it was
  // spelled wrong. Supabase leaves unknown names untouched rather than erroring.
  for (const found of html.match(/\{\{[^}]*\}\}/g) ?? []) {
    if (!(found in SAMPLE)) fail(name, `unknown template variable ${found}`);
  }

  if (bytes > GMAIL_CLIP_BYTES) {
    fail(name, `${Math.round(bytes / 1024)} KB exceeds Gmail's ${GMAIL_CLIP_BYTES / 1024} KB clip threshold`);
  }

  // Images are fetched by the reader's mail client, which has no idea what
  // site the mail came from. A root-relative src resolves against the mail
  // host and shows a broken image to everyone.
  for (const src of html.match(/<img[^>]+src="([^"]*)"/g) ?? []) {
    if (!/src="https:\/\//.test(src)) fail(name, `image src must be an absolute https URL: ${src}`);
  }

  // Images are off by default in most clients, so a logo may never load. The
  // name has to be readable without it, in live text.
  if (!/>REPWATCHR</.test(html)) fail(name, "wordmark must be live text so it survives images being blocked");
  if (!/<img[^>]+alt="[^"]+"/.test(html)) fail(name, "logo needs alt text for images-off and screen readers");

  const hasLink = /<a[^>]+href="\{\{ \.ConfirmationURL \}\}"/.test(html);
  if (NO_LINK.has(name) && hasLink) fail(name, "Supabase sends no URL for this template; the button would go nowhere");
  if (!NO_LINK.has(name) && !hasLink) fail(name, "no button wired to {{ .ConfirmationURL }}");

  // Ryan's house style. Easy to reintroduce by pasting copy from elsewhere.
  if (html.includes("—") || html.includes("–")) fail(name, "contains an em or en dash");

  if (!/color-scheme/.test(html)) fail(name, "no color-scheme hint; dark mode clients will invert the palette");
}

mkdirSync(previewDir, { recursive: true });
for (const file of files) {
  let html = readFileSync(resolve(dir, file), "utf8");
  for (const [variable, value] of Object.entries(SAMPLE)) html = html.split(variable).join(value);
  writeFileSync(resolve(previewDir, file), html, "utf8");
}

if (failures.length > 0) {
  console.error(`\nEmail template check FAILED (${failures.length})`);
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}

console.log(`Email templates OK: ${files.length} checked, previews in .previews/email/`);
