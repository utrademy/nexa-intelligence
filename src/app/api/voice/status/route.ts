import { NextResponse } from "next/server";
import { voiceProvider } from "@/lib/voice/provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const personId = searchParams.get("personId");

  if (!callId) {
    return NextResponse.json({ error: "callId requerido" }, { status: 400 });
  }

  try {
    // 1. Check provider status
    const statusData = await voiceProvider.getCallStatus(callId);

    // 2. Also check if Supabase has recorded the completion interaction
    let dbUpdated = false;
    let newScore: number | undefined;

    if (personId) {
      const supabase = getSupabaseServerClient();
      const { data: interaction } = await supabase
        .from("interactions")
        .select("id, status, structured_data")
        .eq("person_id", personId)
        .eq("channel", "VOICE")
        .eq("status", "COMPLETED")
        .contains("structured_data", { provider_call_id: callId })
        .maybeSingle();

      if (interaction) {
        dbUpdated = true;
        const struct = interaction.structured_data as any;
        newScore = struct?.new_score;
      }
    }

    return NextResponse.json({
      callId,
      status: statusData.status,
      completed: statusData.completed || dbUpdated,
      dbUpdated,
      newScore,
      error: statusData.error,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error al consultar estado" }, { status: 500 });
  }
}
