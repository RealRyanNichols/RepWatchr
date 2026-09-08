"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient, isSupabaseAuthEnabled } from "@/lib/supabase";
import { getMemberAssurance, type MemberAssurance } from "@/lib/member-assurance";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  county: string | null;
  district: string | null;
  verified: boolean;
  paidAccount: boolean;
  personVerified: boolean;
  residenceVerified: boolean;
}

type UserRole =
  | "admin"
  | "reviewer"
  | "researcher"
  | "claimed_official"
  | "journalist"
  | "voter";

type ProfileLookupResult = { data: UserProfile | null };
type RolesLookupResult = { data: Array<{ role: UserRole }> | null };
type UserLookupResult = { data: { user: User | null }; error: unknown | null };

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

async function withTimeout<T>(task: Promise<T>, fallback: T, timeoutMs = 3500) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    let accountLoadVersion = 0;

    if (!isSupabaseAuthEnabled) {
      window.setTimeout(() => {
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }, 0);
      return () => {
        mounted = false;
      };
    }

    async function loadAccountState(currentUser: User | null) {
      if (!mounted) return;
      const version = ++accountLoadVersion;
      setUser(currentUser);
      setProfile(null);
      setRoles([]);

      if (!currentUser) {
        setProfile(null);
        setRoles([]);
        return;
      }

      const [profileResult, rolesResult] = await withTimeout(
        Promise.all([
          supabase
            .from("member_assurance")
            .select("account_fee_status, person_status, person_verified_at, person_expires_at, residence_status, residence_verified_at, residence_expires_at, county, district")
            .eq("user_id", currentUser.id)
            .single(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id),
        ]).then(([profileLookup, rolesLookup]): [ProfileLookupResult, RolesLookupResult] => [
          { data: getMemberAssurance(profileLookup.error ? null : profileLookup.data as MemberAssurance | null) },
          { data: (rolesLookup.data as Array<{ role: UserRole }> | null) ?? [] },
        ]),
        [{ data: null }, { data: [] }]
      );

      if (!mounted || version !== accountLoadVersion) return;
      setProfile(profileResult.data);
      setRoles((rolesResult.data ?? []).map((item) => item.role));
    }

    const getSession = async () => {
      const sessionResult = await withTimeout<UserLookupResult>(
        supabase.auth.getUser().then((result): UserLookupResult => ({
          data: { user: result.data.user ?? null },
          error: result.error,
        })),
        { data: { user: null }, error: null }
      );
      const currentUser = sessionResult.data.user;
      await loadAccountState(currentUser);
      if (!mounted) return;
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      await loadAccountState(currentUser);
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
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
