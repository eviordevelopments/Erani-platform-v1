"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getSettingsDataAction(orgId: string) {
  try {
    const { data: team, error: teamErr } = await supabaseAdmin
      .from('org_members')
      .select('*, profiles(full_name, email, avatar_url)')
      .eq('organization_id', orgId);

    const { data: auditLogs, error: logErr } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(15);

    return { 
      success: true, 
      team: team || [], 
      auditLogs: auditLogs || [] 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateOrgAction(orgId: string, orgData: any) {
  try {
    const updatePayload: any = {
      name: orgData.name,
      bio: orgData.bio,
      sector: orgData.sector,
      team_size: orgData.teamSize,
      annual_revenue: orgData.annualRevenue || 0,
      goals: orgData.goals,
      recovery_email: orgData.recoveryEmail,
    };
    if (orgData.logoUrl !== undefined) updatePayload.logo_url = orgData.logoUrl;
    if (orgData.auditNotificationRecipients !== undefined) {
      updatePayload.audit_notification_recipients = orgData.auditNotificationRecipients;
    }

    const { error } = await supabaseAdmin
      .from('organizations')
      .update(updatePayload)
      .eq('id', orgId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserProfileAction(userId: string, profileData: any) {
  try {
    const updatePayload: any = {};
    if (profileData.fullName !== undefined) updatePayload.full_name = profileData.fullName;
    if (profileData.role !== undefined) updatePayload.role = profileData.role;
    if (profileData.avatarUrl !== undefined) updatePayload.avatar_url = profileData.avatarUrl;

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleFeatureAction(orgId: string, featureKey: string, value: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ [featureKey]: value })
      .eq('id', orgId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
