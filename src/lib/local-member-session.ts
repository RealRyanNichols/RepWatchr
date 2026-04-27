"use client";

import type { User } from "@supabase/supabase-js";

export const LOCAL_MEMBER_SESSION_KEY = "repwatchr.member.local-session.v1";

type LocalMemberSession = {
  id: string;
  email: string;
  createdAt: string;
};

function idFromEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0;
  }

  return `local-${Math.abs(hash).toString(36)}`;
}

export function saveLocalMemberSession(email: string) {
  if (typeof window === "undefined") return;

  const normalizedEmail = email.trim().toLowerCase();
  const session: LocalMemberSession = {
    id: idFromEmail(normalizedEmail),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(LOCAL_MEMBER_SESSION_KEY, JSON.stringify(session));
}

export function readLocalMemberSession(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_MEMBER_SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as LocalMemberSession;
    if (!session.email || !session.id) return null;

    return {
      id: session.id,
      aud: "authenticated",
      role: "authenticated",
      email: session.email,
      email_confirmed_at: session.createdAt,
      phone: "",
      confirmed_at: session.createdAt,
      last_sign_in_at: session.createdAt,
      app_metadata: {
        provider: "email",
        providers: ["email"],
      },
      user_metadata: {},
      identities: [],
      created_at: session.createdAt,
      updated_at: session.createdAt,
      is_anonymous: false,
    } as User;
  } catch {
    return null;
  }
}

export function clearLocalMemberSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_MEMBER_SESSION_KEY);
}

export function isLocalMemberUserId(id: string | undefined) {
  return Boolean(id?.startsWith("local-"));
}
