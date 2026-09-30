"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import { safeNextPath } from "@/lib/safe-next-path";
import TurnstileChallenge from "@/components/auth/TurnstileChallenge";
import SocialAuthButtons from "@/components/auth/SocialAuthButtons";

const signupTools = [
  "Watch list for officials, boards, races, attorneys, media, and issues",
  "Free accountability packet builder",
  "Public-records request drafts and timeline starters",
  "Signal map for state buildout, source gaps, and review lanes",
];

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetNonce, setCaptchaResetNonce] = useState(0);
  const [nextPath, setNextPath] = useState("/dashboard");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const joiningDiscussion = nextPath.endsWith("#discussion");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const requestedNext = new URLSearchParams(window.location.search).get("next");
      setNextPath(safeNextPath(requestedNext));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (turnstileSiteKey && !captchaToken) {
      setError("Complete the human verification challenge.");
      return;
    }

    setLoading(true);
    trackRepWatchrEvent("signup_started", { source: "auth_signup" });

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { display_name: displayName.trim().replace(/\s+/g, " ").slice(0, 50) || "RepWatchr member" },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          ...(captchaToken ? { captchaToken } : {}),
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setCaptchaResetNonce((value) => value + 1);
        setLoading(false);
        return;
      }

      if (data.session?.user) {
        await supabase.from("member_profiles").upsert(
          {
            user_id: data.session.user.id,
            display_name: displayName.trim().replace(/\s+/g, " ").slice(0, 50) || "RepWatchr member",
            preferred_state: "TX",
            research_focus: "Politics, accountability, public records, and watched officials",
          },
          { onConflict: "user_id" }
        );
        trackRepWatchrEvent("signup_completed", { confirmation_required: false });
        router.replace(nextPath);
        router.refresh();
        return;
      }

      trackRepWatchrEvent("signup_completed", { confirmation_required: true });
      setSuccess(true);
      setLoading(false);
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Account creation failed. Check the member database configuration.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <h1 className="text-2xl font-black text-green-800">
            Account Created
          </h1>
          <p className="mt-2 text-green-700">
            Check your email to confirm your account. Then return here to sign in and continue {joiningDiscussion ? "the discussion" : "to your member dashboard"}.
          </p>
          <Link
            href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
          <Link
            href={nextPath}
            className="ml-3 mt-4 inline-block rounded-lg border border-green-300 bg-white px-5 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100"
          >
            {joiningDiscussion ? "Back to the discussion" : "Open Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_52%,#fff7ed_100%)]">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section>
          <p className="text-sm font-black uppercase tracking-wide text-red-700">{joiningDiscussion ? "Join the conversation" : "Founder access is open"}</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-blue-950 sm:text-5xl">
            {joiningDiscussion ? "Ask a question. Bring a source. Have your say." : "Create your free RepWatchr account."}
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-blue-950/75">
            {joiningDiscussion ? "Create an account with email or an available sign-in option. You will return to the discussion. Everyone can read; an account lets you post." : "Start with email and password. Inside the dashboard you can follow targets, build records packets, draft public-records requests, use Faretta AI, and keep political research organized."}
          </p>
          {joiningDiscussion ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-900">A public conversation</p>
            <p className="mt-1 text-2xl font-black text-blue-950">Free to read. Free to comment.</p>
            <p className="mt-1 text-sm font-bold leading-6 text-blue-950/75">Choose a public name. Keep private records out of comments. Lawful disagreement is welcome.</p>
          </div> : <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-900">Free buildout window</p>
            <p className="mt-1 text-2xl font-black text-blue-950">90 days of founder access</p>
            <p className="mt-1 text-sm font-bold leading-6 text-blue-950/75">
              No paywall while the tools are being built into something people need.
            </p>
          </div>}
          <div className="mt-4 grid gap-3">
            {(joiningDiscussion ? ["Ask a factual question or add your perspective", "Share a link to an original public record", "Keep an unsent comment draft in this tab while you sign in"] : signupTools).map((item) => (
              <div key={item} className="rounded-xl border border-blue-100 bg-white p-4 text-sm font-black text-blue-950 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-blue-100/70 sm:p-8">
          <h2 className="text-2xl font-black text-gray-900">Create Account</h2>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            {joiningDiscussion ? "Confirm your email, then sign in to post. Your email is not your public comment name." : "Join free. Confirm your email if requested, then sign in to use the member tools."}
          </p>

          <div className="mt-5">
            <SocialAuthButtons nextPath={nextPath} />
            <p className="mt-2 text-xs font-semibold leading-5 text-gray-500">
              Only configured sign-in providers are shown. Signing in does not verify identity or residence.
            </p>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-black uppercase tracking-wide text-gray-500">or use email</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="public-name" className="block text-sm font-medium text-gray-700">Public display name <span className="text-gray-500">(optional)</span></label>
              <input id="public-name" type="text" autoComplete="nickname" maxLength={50} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="A name you want shown with your comments" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <p className="mt-1 text-xs leading-5 text-gray-500">You can change the name before posting. Leave it blank to use RepWatchr member.</p>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            {turnstileSiteKey ? (
              <TurnstileChallenge
                siteKey={turnstileSiteKey}
                action="member_signup"
                resetNonce={captchaResetNonce}
                onToken={setCaptchaToken}
              />
            ) : null}

            <button
              type="submit"
              disabled={loading || Boolean(turnstileSiteKey && !captchaToken)}
              className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:bg-blue-400"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <p className="mt-4 text-xs leading-5 text-gray-500">Read our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link> before joining.</p>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className="font-medium text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
