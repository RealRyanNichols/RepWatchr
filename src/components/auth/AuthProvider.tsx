"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  clearLocalMemberSession,
  readLocalMemberSession,
} from "@/lib/local-member-session";

interface UserProfile {
  county: string;
  district?: string;
  verified: boolean;
}

type UserRole =
  | "admin"
  | "reviewer"
  | "researcher"
  | "claimed_official"
  | "journalist"
  | "voter";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  roles: UserRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    async function loadAccountState(currentUser: User | null, localFallback = false) {
      if (!mounted) return;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setRoles([]);
        return;
      }

      if (localFallback) {
        setProfile(null);
        setRoles(["voter"]);
        return;
      }

      try {
        const [profileResult, rolesResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("county, district, verified")
            .eq("user_id", currentUser.id)
            .single(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id),
        ]);

        if (!mounted) return;
        setProfile((profileResult.data as UserProfile | null) ?? null);
        setRoles(((rolesResult.data ?? []) as Array<{ role: UserRole }>).map((item) => item.role));
      } catch {
        if (!mounted) return;
        setProfile(null);
        setRoles(["voter"]);
      }
    }

    const getSession = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const localUser = currentUser ? null : readLocalMemberSession();
        await loadAccountState(currentUser ?? localUser, Boolean(!currentUser && localUser));
      } catch {
        const localUser = readLocalMemberSession();
        await loadAccountState(localUser, Boolean(localUser));
      }
      if (!mounted) return;
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      const localUser = currentUser ? null : readLocalMemberSession();
      await loadAccountState(currentUser ?? localUser, Boolean(!currentUser && localUser));
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    clearLocalMemberSession();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
