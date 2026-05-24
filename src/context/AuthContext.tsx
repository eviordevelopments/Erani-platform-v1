"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { auditLogger } from "@/lib/auditLogger";

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateErisBalance: (newBalance: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateErisBalance: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as Profile);
      } else if (error && retries > 0) {
        console.warn(`Retrying profile fetch... (${retries} left)`, error.message);
        await new Promise(r => setTimeout(r, 1000));
        return fetchProfile(userId, retries - 1);
      }
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchProfile(userId, retries - 1);
      }
      console.error("Profile fetch failed after retries:", err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;

    const { data: { user: refreshedUser }, error: userError } = await supabase.auth.getUser();
    if (!userError && refreshedUser) {
      setUser(refreshedUser);
    }

    await fetchProfile(user.id);
  };

  const updateErisBalance = async (newBalance: number) => {
    if (!user) return;
    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        data: { eris_balance: newBalance }
      });
      
      if (error) throw error;
      
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error: any) {
      console.error("Failed to update ERIS balance:", error.message);
      if (error.message === 'Failed to fetch') {
        alert("Error de conexión: No se pudo sincronizar el balance de ERIS. Por favor verifica tu conexión a internet o el estado de Supabase.");
      }
    }
  };

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      
      if (currentUser) {
        // Initialize ERIS balance if it doesn't exist
        if (currentUser.user_metadata?.eris_balance === undefined) {
          const { data: { user: updatedUser } } = await supabase.auth.updateUser({
            data: { eris_balance: 100 }
          });
          setUser(updatedUser ?? currentUser);
        } else {
          setUser(currentUser);
        }
        await fetchProfile(currentUser.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
        if (event === 'SIGNED_IN') {
          await auditLogger.log('LOGIN', 'Sesión iniciada correctamente', {}, 'log-in');
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await auditLogger.log('LOGOUT', 'Sesión cerrada por el usuario', {}, 'log-out');
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, updateErisBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
