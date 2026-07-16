"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { trackRepWatchrEvent } from "@/lib/client-analytics";

type SocialProvider = "facebook" | "twitter";

type SocialAuthButtonsProps = {
  nextPath?: string;
  compact?: boolean;
};

const providerLabels: Record<SocialProvider, string> = {
  facebook: "Continue with Facebook",
  twitter: "Continue with X",
};

export default function SocialAuthButtons({
  nextPath = "/dashboard",
  compact = false,
}: SocialAuthButtonsProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  async function startSocialLogin(provider: SocialProvider) {
    setError("");
    setLoadingProvider(provider);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoadingProvider(null);
        return;
      }

      trackRepWatchrEvent("social_login_started", {
        provider: provider === "twitter" ? "x" : provider,
        next_path: nextPath,
      });
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : "Social sign-in could not start.");
      setLoadingProvider(null);
    }
  }

  return (
    <div>
      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : ""}`}>
        {(Object.keys(providerLabels) as SocialProvider[]).map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => startSocialLogin(provider)}
            disabled={Boolean(loadingProvider)}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 font-black text-white transition disabled:cursor-wait disabled:opacity-60 ${
              compact ? "py-2.5 text-xs" : "py-3 text-sm"
            } ${provider === "facebook" ? "bg-[#1877f2] hover:bg-[#1268d3]" : "bg-black hover:bg-slate-800"}`}
          >
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-sm"
            >
              {provider === "facebook" ? "f" : "X"}
            </span>
            {loadingProvider === provider ? "Connecting…" : providerLabels[provider]}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
