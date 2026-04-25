"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

import type { ReactNode } from "react";

type Provider = "facebook" | "twitter";

interface SocialLoginButtonsProps {
  redirectTo?: string;
}

const providers: { id: Provider; label: string; icon: ReactNode; bgClass: string; hoverClass: string }[] = [
  {
    id: "facebook",
    label: "Facebook",
    bgClass: "bg-[#1877F2] text-white",
    hoverClass: "hover:bg-[#166FE5]",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    bgClass: "bg-black text-white",
    hoverClass: "hover:bg-gray-800",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export default function SocialLoginButtons({ redirectTo }: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSocialLogin(provider: Provider) {
    setLoading(provider);
    setError("");

    const next = redirectTo || "/dashboard";
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        : `/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-semibold leading-5 text-gray-500">
        These buttons work when Facebook and X providers are enabled in Supabase.
      </p>
      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleSocialLogin(provider.id)}
          disabled={loading !== null}
          className={`flex w-full items-center justify-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${provider.bgClass} ${provider.hoverClass} disabled:opacity-50`}
        >
          {loading === provider.id ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            provider.icon
          )}
          Continue with {provider.label}
        </button>
      ))}

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
