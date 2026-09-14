# RepWatchr auth emails

The six emails Supabase sends when somebody signs up, signs in with a one time
link, resets a password, changes an address, gets invited, or reauthenticates.

Supabase owns the send, so these templates live in its dashboard rather than in
the Next.js render path. They are generated here so the six cannot drift apart
and so a brand change is one edit instead of six paste jobs.

```
npm run email:templates        # rebuild the HTML from scripts/build-email-templates.mjs
npm run smoke:email-templates  # check them, and write previews to .previews/email/
```

Open anything in `.previews/email/` in a browser to see an email exactly as a
reader gets it, sample values filled in.

---

## Fix the sender first

**The template is the smaller half of the problem.** On Supabase's built in
mail service the emails come from `noreply@mail.app.supabase.io`, an address
nobody recognizes on a domain that is not RepWatchr. No amount of branding
inside the message survives a from-line like that, and cautious readers, which
is most of this audience, will not click a link in it.

That service is also rate limited to a handful of messages per hour and is
documented as not for production use. Once the limit is hit, signups fail
silently for everyone until the hour rolls over.

So set custom SMTP before anything else:

1. Verify `repwatchr.com` with your mail provider (Resend, Postmark, SES).
   That means adding the SPF, DKIM, and DMARC DNS records it gives you. Skip
   these and the mail lands in spam no matter how it looks.
2. Supabase dashboard → **Project Settings → Authentication → SMTP Settings**
   → enable custom SMTP.
   - Sender email: `noreply@repwatchr.com`
   - Sender name: `RepWatchr`
   - Host, port, user, pass: from the provider.
3. Raise the rate limit while you are there:
   **Authentication → Rate Limits → "Rate limit for sending emails."** The
   default assumes the built in service.
4. Send yourself a test signup and confirm it lands in the inbox, not spam.

A reply-to on a real monitored address is worth setting too. People answer
these emails even when told not to.

---

## Install the templates

Supabase dashboard → **Authentication → Emails**. For each template below,
paste the file's full contents into the message body and set the subject line.

| Supabase template | File | Subject line |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | Confirm your RepWatchr account |
| Magic Link | `magic-link.html` | Your RepWatchr sign-in link |
| Reset Password | `reset-password.html` | Reset your RepWatchr password |
| Change Email Address | `change-email.html` | Confirm your new RepWatchr email |
| Invite user | `invite.html` | You have been invited to RepWatchr |
| Reauthentication | `reauthentication.html` | Your RepWatchr verification code |

Then check **Authentication → URL Configuration**:

- Site URL: `https://www.repwatchr.com`
- Redirect URLs must include `https://www.repwatchr.com/auth/callback` and the
  Vercel preview pattern if you want links to work from preview deploys.

A confirmation link that redirects somewhere not on that allow list silently
drops the reader on the site root with no session, which looks identical to a
broken email.

---

## What is in the design, and why

- **The wordmark is live text, not an image.** Most mail clients block remote
  images by default. If the name were part of the logo file, a blocked image
  would leave a blank email from an unknown sender, which is the worst possible
  version of this message. The eagle mark only ever decorates.
- **The mark is 13 KB, not 845 KB.** `public/images/email/repwatchr-mark.png`
  is a trimmed, email sized cut of the site logo. The full logo is 845 KB,
  which is a slow load on a phone on rural data.
- **Both a link and a code, every time.** Supabase issues both for the same
  request. Links break when a corporate mail scanner rewrites URLs, and a link
  is useless when the inbox is on a different device from the browser. The code
  covers both cases, so it is shown rather than hidden behind "trouble?".
- **Tables and inline styles.** Outlook renders through Word, and Gmail strips
  `<style>` blocks in forwarded copies.
- **Each email says what happens if it was not you.** The reader's first
  question on an unexpected auth email is whether they have been hacked.
  Answering it in the message is what makes the message feel safe.

## Things that will break these

- **Changing the OTP expiry** without updating `EXPIRY_PHRASE` in
  `scripts/build-email-templates.mjs`. The emails promise about an hour. A
  template that promises an hour on a ten minute token teaches readers the
  email is wrong.
- **Editing the HTML in the dashboard instead of here.** The next
  `npm run email:templates` will not know about it. Edit the script, rebuild,
  repaste.
- **Moving or renaming `public/images/email/repwatchr-mark.png`.** The `<img>`
  src is absolute and points at production. Deleting it breaks the logo in
  every email already sent.
