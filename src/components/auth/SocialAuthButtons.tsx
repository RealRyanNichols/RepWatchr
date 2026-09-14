"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import { safeNextPath } from "@/lib/safe-next-path";

/**
 * Sign-in providers.
 *
 * Each of these is only half a feature: the button calls Supabase, and Supabase
 * only answers if that provider has been enabled in the project's Auth settings
 * with a client id and secret from the provider's own developer console. A
 * provider that is not configured returns "provider is not enabled", which is
 * handled below by pointing the reader at email signup rather than leaving them
 * on a dead button.
 *
 * Order is deliberate. Google carries the most accounts, Apple is what iPhone
 * users reach for, and Facebook is where this audience already is.
 */
type SocialProvider = "google" | "apple" | "facebook" | "twitter";

type SocialAuthButtonsProps = {
  nextPath?: string;
  compact?: boolean;
};

const PROVIDERS: Array<{
  id: SocialProvider;
  label: string;
  mark: string;
  className: string;
  /** Set the matching NEXT_PUBLIC_ flag to "false" to hide a provider you have not configured yet. */
  flag: string;
}> = [
  {
    id: "google",
    label: "Continue with Google",
    mark: "G",
    className: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
    flag: "NEXT_PUBLIC_AUTH_GOOGLE",
  },
  {
    id: "apple",
    label: "Continue with Apple",
    mark: "",
    className: "bg-black text-white hover:bg-slate-800",
    flag: "NEXT_PUBLIC_AUTH_APPLE",
  },
  {
    id: "facebook",
    label: "Continue with Facebook",
    mark: "f",
    className: "bg-[#1877f2] text-white hover:bg-[#1268d3]",
    flag: "NEXT_PUBLIC_AUTH_FACEBOOK",
  },
  {
    id: "twitter",
    label: "Continue with X",
    mark: "X",
    className: "bg-black text-white hover:bg-slate-800",
    flag: "NEXT_PUBLIC_AUTH_TWITTER",
  },
];

// Read at module scope: NEXT_PUBLIC_ values are inlined at build time, so they
// cannot be looked up from a variable key at runtime.
const ENABLED: Record<string, boolean> = {
  NEXT_PUBLIC_AUTH_GOOGLE: process.env.NEXT_PUBLIC_AUTH_GOOGLE !== "false",
  NEXT_PUBLIC_AUTH_APPLE: process.env.NEXT_PUBLIC_AUTH_APPLE !== "false",
  NEXT_PUBLIC_AUTH_FACEBOOK: process.env.NEXT_PUBLIC_AUTH_FACEBOOK !== "false",
  NEXT_PUBLIC_AUTH_TWITTER: process.env.NEXT_PUBLIC_AUTH_TWITTER !== "false",
};

const PROVIDER_NAMES: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
  facebook: "Facebook",
  twitter: "X",
};

export default function SocialAuthButtons({
  nextPath = "/dashboard",
  compact = false,
}: SocialAuthButtonsProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  const providers = PROVIDERS.filter((provider) => ENABLED[provider.flag]);
  if (providers.length === 0) return null;

  async function startSocialLogin(provider: SocialProvider) {
    setError("");
    setLoadingProvider(provider);

    try {
      const safeReturnPath = safeNextPath(nextPath);
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeReturnPath)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (oauthError) {
        setError(
          /provider is not enabled/i.test(oauthError.message)
            ? `${PROVIDER_NAMES[provider]} sign-in is not connected yet. Use email below, it works now.`
            : oauthError.message,
        );
        setLoadingProvider(null);
        return;
      }

      trackRepWatchrEvent("social_login_started", {
        provider: provider === "twitter" ? "x" : provider,
        next_path: safeReturnPath,
      });
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : "Social sign-in could not start.");
      setLoadingProvider(null);
    }
  }

  return (
    <div>
      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => startSocialLogin(provider.id)}
            disabled={Boolean(loadingProvider)}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 font-black transition disabled:cursor-wait disabled:opacity-60 ${
              compact ? "py-2.5 text-xs" : "py-3 text-sm"
            } ${provider.className}`}
          >
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-full bg-current/10 text-sm"
            >
              {provider.mark}
            </span>
            {loadingProvider === provider.id ? "Connecting…" : provider.label}
          </button>
        ))}
      </div>
      {error ? (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-800">
          <p>{error}</p>
          <Link
            href={`/auth/signup?next=${encodeURIComponent(safeNextPath(nextPath))}`}
            className="mt-1 inline-flex underline underline-offset-2"
          >
            Create a profile with email
          </Link>
        </div>
      ) : null}
    </div>
  );
}
