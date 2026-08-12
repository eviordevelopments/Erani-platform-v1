import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  try {
    const orgId = req.headers.get("x-org-id");
    if (!orgId) {
      return NextResponse.json({ error: "No organization ID provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("operations")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const orgId = req.headers.get("x-org-id") || payload.organization_id;
    
    if (!orgId) {
       return NextResponse.json({ error: "No organization ID provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("operations")
      .insert({ ...payload, organization_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const payload = await req.json();
    const { id, ...updates } = payload;
    
    if (!id) {
       return NextResponse.json({ error: "No operation ID provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("operations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
       return NextResponse.json({ error: "No operation ID provided" }, { status: 400 });
    }

    const { error } = await supabase
      .from("operations")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
