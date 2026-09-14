#!/usr/bin/env node
/**
 * Build the Supabase auth email templates.
 *
 * Supabase sends the account emails, not this app, so the templates live in
 * the dashboard (Authentication > Emails) rather than in the Next.js render
 * path. That makes them easy to leave looking like a default: a bare white
 * page, a naked link, and a from-address nobody recognizes. A reader who does
 * not trust the email does not click it, and on this site the click is how
 * they get an account at all.
 *
 * So the templates are generated here from one layout and written to
 * supabase/email-templates/*.html, which is what gets pasted into the
 * dashboard. One layout means the six emails cannot drift apart, and a brand
 * change is one edit here instead of six paste jobs.
 *
 * Constraints these are written against, which is why the markup looks dated:
 *   - Tables, not flexbox or grid. Outlook renders through Word.
 *   - Inline styles. Gmail strips <style> in some clients and all of it in
 *     forwarded copies.
 *   - Absolute image URLs, and the design has to read with images OFF, which
 *     most clients default to. The wordmark is therefore live text, never an
 *     image, and the logo only ever decorates.
 *   - No web fonts. Inter is the site face; email gets the system stack.
 *
 * Run: npm run email:templates
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", "supabase", "email-templates");

/* ------------------------------------------------------------------ brand */

const SITE = "https://www.repwatchr.com";
const MARK = `${SITE}/images/email/repwatchr-mark.png`;

/**
 * Where RepWatchr is operated from, shown in the footer.
 *
 * Bulk commercial mail has to carry a real postal address. These six are
 * transactional, which is exempt, so this is a locale and not an assertion of
 * a mailing address. Put a real one here if you ever send a newsletter from
 * the same domain.
 */
const LOCALE_LINE = "East Texas";

/**
 * Token lifetime as worded in the emails.
 *
 * Supabase defaults to 3600 seconds. If you change the OTP expiry in
 * Authentication > Providers > Email, change this line and rebuild, because a
 * template that promises an hour on a ten minute token teaches readers the
 * email is wrong.
 */
const EXPIRY_PHRASE = "about an hour";

const c = {
  navy: "#06172f",
  navy2: "#0b2a55",
  blue: "#1d4ed8",
  crimson: "#b42318",
  gold: "#d6b35a",
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  line: "#dbe6f3",
  page: "#eef3f9",
  card: "#ffffff",
  codeBg: "#f5f8fc",
};

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, 'Courier New', monospace";

/* ----------------------------------------------------------------- pieces */

/**
 * The hidden line most clients show next to the subject in the inbox list.
 *
 * Without it the preview is scraped from the first visible text, which here
 * would be the wordmark, so every RepWatchr email would preview identically
 * as "REPWATCHR REPWATCHR". The run of zero-width joiners stops the client
 * from spilling body copy in after the intended line.
 */
function preheader(text) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${text}${"&#8204;&nbsp;".repeat(60)}</div>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                    <tr>
                      <td align="center" bgcolor="${c.navy2}" style="border-radius:10px;">
                        <a href="${href}" style="display:inline-block;padding:16px 36px;font-family:${FONT};font-size:16px;font-weight:700;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
                      </td>
                    </tr>
                  </table>`;
}

/**
 * The code block.
 *
 * Supabase mails a link and a numeric code for the same request. The link is
 * what most people use, but it breaks whenever a mail client rewrites URLs for
 * scanning, and it cannot be used at all on a different device from the one
 * holding the inbox. The code covers both, so it is shown rather than hidden
 * behind "having trouble?".
 */
function codeBlock(label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 auto;">
                    <tr>
                      <td align="center" bgcolor="${c.codeBg}" style="border:1px solid ${c.line};border-radius:10px;padding:18px 12px;">
                        <div style="font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${c.muted};">${label}</div>
                        <div style="font-family:${MONO};font-size:30px;font-weight:700;letter-spacing:6px;color:${c.navy};padding-top:8px;">{{ .Token }}</div>
                      </td>
                    </tr>
                  </table>`;
}

function paragraph(html, { top = 16 } = {}) {
  return `<p style="margin:${top}px 0 0;font-family:${FONT};font-size:16px;line-height:26px;color:${c.body};">${html}</p>`;
}

/* ----------------------------------------------------------------- layout */

function layout({ preview, heading, intro, action, note, footerNote }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>RepWatchr</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  /* Progressive only. Every rule that matters is inlined below. */
  body { margin:0 !important; padding:0 !important; width:100% !important; }
  a { color:${c.blue}; }
  @media only screen and (max-width:620px) {
    .rw-shell { width:100% !important; }
    .rw-pad { padding-left:22px !important; padding-right:22px !important; }
    .rw-h1 { font-size:23px !important; line-height:31px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${c.page};color-scheme:light;">
${preheader(preview)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${c.page}" style="background-color:${c.page};">
  <tr>
    <td align="center" style="padding:28px 12px 40px;">

      <table role="presentation" class="rw-shell" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">

        <!-- Tricolor rule. Two pixels of brand that survive images being off. -->
        <tr>
          <td style="font-size:0;line-height:0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="58%" bgcolor="${c.navy2}" height="5" style="font-size:0;line-height:0;border-radius:6px 0 0 0;">&nbsp;</td>
                <td width="27%" bgcolor="${c.crimson}" height="5" style="font-size:0;line-height:0;">&nbsp;</td>
                <td width="15%" bgcolor="${c.gold}" height="5" style="font-size:0;line-height:0;border-radius:0 6px 0 0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Masthead -->
        <tr>
          <td class="rw-pad" align="center" bgcolor="${c.card}" style="background-color:${c.card};border-left:1px solid ${c.line};border-right:1px solid ${c.line};padding:32px 40px 22px;">
            <a href="${SITE}" style="text-decoration:none;">
              <img src="${MARK}" width="76" height="76" alt="RepWatchr" style="display:block;margin:0 auto 14px;border:0;outline:none;width:76px;height:76px;" />
              <div style="font-family:${FONT};font-size:23px;font-weight:800;letter-spacing:4px;color:${c.navy};">REPWATCHR</div>
            </a>
            <div style="font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${c.muted};padding-top:7px;">Voting records &middot; Public records &middot; Receipts</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="rw-pad" bgcolor="${c.card}" style="background-color:${c.card};border-left:1px solid ${c.line};border-right:1px solid ${c.line};padding:8px 40px 34px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr><td style="border-top:1px solid ${c.line};font-size:0;line-height:0;padding-top:26px;">&nbsp;</td></tr>
              <tr>
                <td>
                  <h1 class="rw-h1" style="margin:0;font-family:${FONT};font-size:26px;line-height:34px;font-weight:800;color:${c.navy};">${heading}</h1>
                  ${intro}
                </td>
              </tr>
              <tr><td style="padding-top:28px;">${action}</td></tr>
              ${note ? `<tr><td style="padding-top:26px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="border-left:3px solid ${c.gold};padding:2px 0 2px 14px;"><p style="margin:0;font-family:${FONT};font-size:14px;line-height:23px;color:${c.muted};">${note}</p></td></tr></table></td></tr>` : ""}
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="rw-pad" bgcolor="${c.navy}" style="background-color:${c.navy};padding:26px 40px 28px;border-radius:0 0 6px 6px;">
            <p style="margin:0;font-family:${FONT};font-size:13px;line-height:22px;color:#c8d6ea;">
              <a href="${SITE}" style="color:#ffffff;font-weight:700;text-decoration:none;">www.repwatchr.com</a><br />
              HD-7 and TX-01 first. Then East Texas. Then Texas.
            </p>
            <p style="margin:14px 0 0;font-family:${FONT};font-size:12px;line-height:20px;color:#8ea6c6;">
              ${footerNote}
            </p>
            <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;line-height:20px;color:#7891b4;">
              RepWatchr &middot; ${LOCALE_LINE}
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>
`;
}

/* -------------------------------------------------------------- templates */

const NOT_YOU_IGNORE =
  "You are getting this because this address was used at repwatchr.com. If that was not you, ignore this email and nothing happens.";

const templates = {
  "confirm-signup": {
    subject: "Confirm your RepWatchr account",
    preview: "One click and your account is live.",
    heading: "Confirm your email",
    intro:
      paragraph("You created a RepWatchr account. Confirm this address and you are in.") +
      paragraph(
        "An account gets you a watch list, community grades on the officials you actually vote for, and the records as they land.",
      ),
    action: `${button("{{ .ConfirmationURL }}", "Confirm my email")}
                  <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
                  ${codeBlock("Or enter this code")}`,
    note: `The link and the code both expire in ${EXPIRY_PHRASE}. If the button does not work, copy this into your browser:<br /><span style="word-break:break-all;color:${c.blue};">{{ .ConfirmationURL }}</span>`,
    footerNote: `Somebody signed up with ${"{{ .Email }}"}. If that was not you, ignore this email and no account is activated.`,
  },

  "magic-link": {
    subject: "Your RepWatchr sign-in link",
    preview: "Your one time sign-in link and code.",
    heading: "Here is your sign-in link",
    intro:
      paragraph("No password needed. This link signs you in once and then it is dead.") +
      paragraph(
        "Reading the email on a different device from the one you want to sign in on? Use the code instead.",
      ),
    action: `${button("{{ .ConfirmationURL }}", "Sign me in")}
                  <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
                  ${codeBlock("One time code")}`,
    note: `Good for ${EXPIRY_PHRASE}, then it stops working. Never forward this email. Anyone holding this link can sign in as you.`,
    footerNote: NOT_YOU_IGNORE,
  },

  "reset-password": {
    subject: "Reset your RepWatchr password",
    preview: "Set a new password on your RepWatchr account.",
    heading: "Reset your password",
    intro:
      paragraph("Somebody asked to reset the password on this account. If that was you, set a new one here.") +
      paragraph("Your current password keeps working until you finish this. Nothing has changed yet."),
    action: `${button("{{ .ConfirmationURL }}", "Set a new password")}
                  <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
                  ${codeBlock("Or enter this code")}`,
    note: `This expires in ${EXPIRY_PHRASE}. If you did not ask for it, ignore this email and your password stays exactly as it is.`,
    footerNote: NOT_YOU_IGNORE,
  },

  "change-email": {
    subject: "Confirm your new RepWatchr email",
    preview: "Confirm the email change on your account.",
    heading: "Confirm your new email",
    intro:
      paragraph(
        `You asked to move this account from <strong style="color:${c.ink};">{{ .Email }}</strong> to <strong style="color:${c.ink};">{{ .NewEmail }}</strong>.`,
      ) + paragraph("Confirm it and the new address takes over. Until then you keep signing in with the old one."),
    action: `${button("{{ .ConfirmationURL }}", "Confirm the change")}
                  <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
                  ${codeBlock("Or enter this code")}`,
    note: `This expires in ${EXPIRY_PHRASE}. If you did not ask to change your email, ignore this and nothing moves.`,
    footerNote: NOT_YOU_IGNORE,
  },

  invite: {
    subject: "You have been invited to RepWatchr",
    preview: "An invitation to RepWatchr is waiting.",
    heading: "You have been invited",
    intro:
      paragraph("Somebody at RepWatchr invited you to an account. Accept it and set your password.") +
      paragraph("RepWatchr tracks voting records, public records, and money for the officials on your ballot."),
    action: `${button("{{ .ConfirmationURL }}", "Accept the invite")}
                  <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
                  ${codeBlock("Or enter this code")}`,
    note: `The invite expires in ${EXPIRY_PHRASE}. If you were not expecting it, ignore this email.`,
    footerNote: `This invitation was sent to ${"{{ .Email }}"}. If it was not meant for you, ignore it and no account is created.`,
  },

  reauthentication: {
    subject: "Your RepWatchr verification code",
    preview: "Your verification code.",
    heading: "Your verification code",
    intro: paragraph("Enter this code on RepWatchr to confirm it is you before the change goes through."),
    // No link here on purpose: Supabase sends a bare token for reauthentication.
    action: codeBlock("Verification code"),
    note: `Good for ${EXPIRY_PHRASE}. RepWatchr will never ask you for this code by phone, text, or direct message.`,
    footerNote: NOT_YOU_IGNORE,
  },
};

/* ------------------------------------------------------------------- emit */

mkdirSync(outDir, { recursive: true });

const written = [];
for (const [name, spec] of Object.entries(templates)) {
  const html = layout(spec);
  const file = resolve(outDir, `${name}.html`);
  writeFileSync(file, html, "utf8");
  written.push({ name, subject: spec.subject, bytes: Buffer.byteLength(html) });
}

for (const row of written) {
  console.log(`  ${row.name.padEnd(18)} ${String(Math.round(row.bytes / 102.4) / 10).padStart(5)} KB   ${row.subject}`);
}
console.log(`\nWrote ${written.length} templates to supabase/email-templates/`);
