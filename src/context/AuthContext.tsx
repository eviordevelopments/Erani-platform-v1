"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { auditLogger } from "@/lib/auditLogger";
import { getProfileDataAction } from "@/app/actions/profileActions";

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
  paid_subscription: boolean;
  eris_balance: number;
  subscription_activated_at: string | null;
  [key: string]: any;
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

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const res = await getProfileDataAction(userId);

      if (!res.success) {
        if (res.code === 'PGRST116') {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return fetchProfile(userId, retries - 1);
          }
        } else if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return fetchProfile(userId, retries - 1);
        }
        console.error('Profile fetch failed:', res.error);
        setProfile(null);
        return;
      }

      setProfile(res.profile);
      setOrg(res.org || null);
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchProfile(userId, retries - 1);
      }
      console.error('Profile fetch failed after retries:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    try {
      const res = await getProfileDataAction(user.id);

      if (!res.success) {
        console.warn('refreshProfile failed:', res.error);
        return;
      }

      setUser(user);
      setProfile(res.profile);
      setOrg(res.org || null);
    } catch (err) {
      console.warn('refreshProfile failed:', err);
    }
  };

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

  const clearSbCookies = () => {
    if (typeof window === 'undefined') return;
    document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure';
    document.cookie = 'sb-access-token=; max-age=0; SameSite=Lax; Secure';
    document.cookie = 'sb-access-token=; path=/dashboard; max-age=0; SameSite=Lax; Secure';
    document.cookie = 'sb-access-token=; path=/login; max-age=0; SameSite=Lax; Secure';
    document.cookie = 'sb-access-token=; path=/register; max-age=0; SameSite=Lax; Secure';
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (currentUser) {
        clearSbCookies();
        setUser(currentUser);
        await fetchProfile(currentUser.id, 3);
      } else {
        clearSbCookies();
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        clearSbCookies();
        await fetchProfile(session.user.id, 3);
        if (event === 'SIGNED_IN') {
          auditLogger.log('LOGIN', 'Sesión iniciada correctamente', {}, 'log-in').catch(() => {});
        }
      } else {
        clearSbCookies();
        setProfile(null);
        setOrg(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    auditLogger.log('LOGOUT', 'Sesión cerrada por el usuario', {}, 'log-out').catch(() => {});
    await supabase.auth.signOut();
    clearSbCookies();
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
