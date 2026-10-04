import { NextResponse } from "next/server";
import { voiceProvider } from "@/lib/voice/provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { callId, personId } = await request.json();
    if (!callId) {
      return NextResponse.json({ error: "callId requerido" }, { status: 400 });
    }

    // Cancel in provider (Vapi DELETE /call/{id})
    const cancelled = await voiceProvider.cancelCall(callId);

    // Update interaction in Supabase if in progress
    if (personId) {
      const supabase = getSupabaseServerClient();
      await supabase
        .from("interactions")
        .update({
          status: "CANCELLED",
          summary: "Llamada con IA cancelada por el usuario desde el panel.",
        })
        .eq("person_id", personId)
        .eq("channel", "VOICE")
        .eq("status", "IN_PROGRESS")
        .contains("structured_data", { provider_call_id: callId });
    }

    return NextResponse.json({ success: true, cancelled });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error al cancelar la llamada" }, { status: 500 });
  }
}
