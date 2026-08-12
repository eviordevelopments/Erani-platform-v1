"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getProfileDataAction(userId: string) {
  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      return { success: false, error: profileError.message, code: profileError.code };
    }

    let org = null;
    if (profile?.organization_id) {
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();
        
      if (!orgError && orgData) {
        org = orgData;
      }
    }

    return { success: true, profile, org };
  } catch (error: any) {
    console.error("getProfileDataAction exception:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
