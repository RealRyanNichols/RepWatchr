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
import type { User } from "@supabase/supabase-js";

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

function appMetadataRoles(user: User): UserRole[] {
  const appMetadata = user.app_metadata as Record<string, unknown>;
  const roles = new Set<UserRole>();
  if (appMetadata.role === "admin") roles.add("admin");
  if (Array.isArray(appMetadata.roles)) {
    for (const role of appMetadata.roles) {
      if (
        role === "admin" ||
        role === "reviewer" ||
        role === "researcher" ||
        role === "claimed_official" ||
        role === "journalist" ||
        role === "voter"
      ) {
        roles.add(role);
      }
    }
  }
  return [...roles];
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

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
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setRoles([]);
        return;
      }

      const [profileResult, rolesResult] = await withTimeout(
        Promise.all([
          supabase
            .from("profiles")
            .select("county, district, verified")
            .eq("user_id", currentUser.id)
            .single(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id),
        ]).then(([profileLookup, rolesLookup]): [ProfileLookupResult, RolesLookupResult] => [
          { data: (profileLookup.data as UserProfile | null) ?? null },
          { data: (rolesLookup.data as Array<{ role: UserRole }> | null) ?? [] },
        ]),
        [{ data: null }, { data: [] }]
      );

      if (!mounted) return;
      setProfile(profileResult.data);
      setRoles([...new Set([...(rolesResult.data ?? []).map((item) => item.role), ...appMetadataRoles(currentUser)])]);
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
