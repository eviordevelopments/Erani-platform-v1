"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function deleteFeedbackAction(id: string, userId: string) {
  try {
    // Verificar que el usuario que intenta borrar sea el dueño
    // El formato del ID es FB-XXXXXX_UUID
    if (id.includes('_') && !id.includes(`_${userId}`)) {
      return { success: false, error: "Unauthorized: You can only delete your own feedback." };
    }

    const { error } = await supabaseAdmin
      .from("feedback")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting feedback (Server Action):", error);
    return { success: false, error: error.message };
  }
}

export async function editFeedbackAction(id: string, userId: string, updates: any) {
  try {
    if (id.includes('_') && !id.includes(`_${userId}`)) {
      return { success: false, error: "Unauthorized: You can only edit your own feedback." };
    }

    const { error } = await supabaseAdmin
      .from("feedback")
      .update({
        title: updates.title,
        description: updates.description,
        type: updates.type,
        priority: updates.priority,
      })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error editing feedback (Server Action):", error);
    return { success: false, error: error.message };
  }
}

export async function addFeedbackAction(item: any) {
  try {
    const { error } = await supabaseAdmin
      .from("feedback")
      .insert({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        priority: item.priority,
        reported_by: item.reportedBy,
        created_at: item.createdAt,
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error adding feedback (Server Action):", error);
    return { success: false, error: error.message };
  }
}

export async function updateFeedbackStatusAction(id: string, status: string) {
  try {
    const { error } = await supabaseAdmin
      .from("feedback")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error updating feedback status (Server Action):", error);
    return { success: false, error: error.message };
  }
}
