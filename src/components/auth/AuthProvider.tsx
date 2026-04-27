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

interface UserProfile {
  county: string;
  district?: string;
  verified: boolean;
  displayName?: string;
  homeLocation?: string;
  preferredState?: string;
  researchFocus?: string;
  publicProfileEnabled?: boolean;
  verificationUpdatedAt?: string;
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

    async function loadMemberApiState() {
      try {
        const response = await fetch("/api/member/session", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) return false;

        const data = (await response.json()) as {
          user: User | null;
          profile: UserProfile | null;
          roles: UserRole[];
        };

        if (!data.user || !mounted) return false;

        setUser(data.user);
        setProfile(data.profile);
        setRoles(data.roles?.length ? data.roles : ["voter"]);
        return true;
      } catch {
        return false;
      }
    }

    async function loadAccountState(currentUser: User | null) {
      if (!mounted) return;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setRoles([]);
        return;
      }

      try {
        const [profileResult, memberProfileResult, rolesResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("county, district, verified")
            .eq("user_id", currentUser.id)
            .maybeSingle(),
          supabase
            .from("member_profiles")
            .select("display_name, home_location, preferred_state, research_focus, public_profile_enabled")
            .eq("user_id", currentUser.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id),
        ]);

        if (!mounted) return;
        const residentProfile = profileResult.data as {
          county: string | null;
          district?: string | null;
          verified: boolean | null;
        } | null;
        const memberProfile = memberProfileResult.data as {
          display_name: string | null;
          home_location: string | null;
          preferred_state: string | null;
          research_focus: string | null;
          public_profile_enabled: boolean | null;
        } | null;
        setProfile({
          county: residentProfile?.county ?? "",
          district: residentProfile?.district ?? undefined,
          verified: Boolean(residentProfile?.verified),
          displayName: memberProfile?.display_name ?? undefined,
          homeLocation: memberProfile?.home_location ?? undefined,
          preferredState: memberProfile?.preferred_state ?? "TX",
          researchFocus: memberProfile?.research_focus ?? undefined,
          publicProfileEnabled: Boolean(memberProfile?.public_profile_enabled),
        });
        const nextRoles = ((rolesResult.data ?? []) as Array<{ role: UserRole }>).map((item) => item.role);
        setRoles(nextRoles.length ? nextRoles : ["voter"]);
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
        if (currentUser) {
          await loadAccountState(currentUser);
        } else {
          const loadedMemberApi = await loadMemberApiState();
          if (!loadedMemberApi) await loadAccountState(null);
        }
      } catch {
        const loadedMemberApi = await loadMemberApiState();
        if (!loadedMemberApi) await loadAccountState(null);
      }
      if (!mounted) return;
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        await loadAccountState(currentUser);
      } else {
        const loadedMemberApi = await loadMemberApiState();
        if (!loadedMemberApi) await loadAccountState(null);
      }
      if (!mounted) return;
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await fetch("/api/member/logout", { method: "POST", credentials: "include" }).catch(() => {});
    await supabase.auth.signOut().catch(() => {});
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
