"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { auditLogger } from "@/lib/auditLogger";

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  display_name: string | null;
  email: string;
  profile_type: 'admin' | 'member';
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  password_set: boolean;
  onboarding_completed: boolean;
  eris_balance: number;
}

export interface OrgData {
  id: string;
  name: string;
  logo_url: string | null;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  org: OrgData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateErisBalance: (newBalance: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  org: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateErisBalance: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);

const fetchProfile = async (userId: string, retries = 3, passedToken?: string) => {
    try {
      // Use passed token if available (e.g. right after signUp), else get from session
      let token = passedToken
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token
      }
      if (!token) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return fetchProfile(userId, retries - 1)
        }
        setProfile(null)
        return
      }

      // Fetch via server route — uses supabaseAdmin scoped to this user's JWT
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const { profile: data, org: orgData } = await res.json()
        setProfile(data)
        if (orgData) setOrg(orgData)
        else setOrg(null)
      } else if (res.status === 404) {
        // Profile doesn't exist yet (e.g. just signed up, profile being created)
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return fetchProfile(userId, retries - 1)
        }
        setProfile(null)
      } else {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000))
          return fetchProfile(userId, retries - 1)
        }
        console.error('Profile fetch failed:', await res.text())
        setProfile(null)
      }
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000))
        return fetchProfile(userId, retries - 1)
      }
      console.error('Profile fetch failed after retries:', err)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        const { profile: data, org: orgData } = await res.json()
        setUser(session.user)
        setProfile(data)
        if (orgData) setOrg(orgData)
        else setOrg(null)
      }
    } catch (err) {
      console.warn('refreshProfile failed:', err)
    }
  }

  const updateErisBalance = async (newBalance: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ eris_balance: newBalance })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
    } catch (error: any) {
      console.error("Failed to update ERIS balance:", error.message);
      if (error.message === 'Failed to fetch') {
        alert("Error de conexión: No se pudo sincronizar el balance de ERIS. Por favor verifica tu conexión a internet o el estado de Supabase.");
      }
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (currentUser) {
        if (session && typeof window !== 'undefined') {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax; Secure`;
        }
        setUser(currentUser);
        await fetchProfile(currentUser.id);
      } else {
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
        }
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        if (session && typeof window !== 'undefined') {
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax; Secure`;
        }
        await fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          await auditLogger.log('LOGIN', 'Sesión iniciada correctamente', {}, 'log-in');
        }
      } else {
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
        }
        setProfile(null);
        setOrg(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await auditLogger.log('LOGOUT', 'Sesión cerrada por el usuario', {}, 'log-out');
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
    }
    setUser(null);
    setProfile(null);
    setOrg(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, org, loading, signOut, refreshProfile, updateErisBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
