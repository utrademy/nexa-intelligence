import { NextResponse } from "next/server";
import { voiceProvider } from "@/lib/voice/provider";
import { persistVoiceCharacterization } from "@/lib/voice/service";
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

    // 2. Check if Supabase has recorded the completion interaction
    let dbUpdated = false;
    let newScore: number | undefined;
    let fieldsUpdated: string[] | undefined;

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
        fieldsUpdated = struct?.fields_updated;
      }

      // If call failed or was not answered, update interaction state in DB only if no data was collected
      if (
        !dbUpdated &&
        !statusData.hasData &&
        (statusData.status === "not_answered" || statusData.notAnswered || statusData.status === "failed")
      ) {
        await supabase
          .from("interactions")
          .update({
            status: "FAILED",
            summary: `Llamada con IA no completada: ${statusData.error || "El asociado no contestó o rechazó la llamada."}`,
          })
          .eq("person_id", personId)
          .eq("channel", "VOICE")
          .eq("status", "IN_PROGRESS")
          .contains("structured_data", { provider_call_id: callId });
      }

      // 3. Fallback persistence: if call ended with data or consent outcome but webhook hasn't stored it yet
      if (
        !dbUpdated &&
        (statusData.completed || statusData.hasData || statusData.consentDenied) &&
        statusData.rawCallData
      ) {
        try {
          const normalized = voiceProvider.normalizeCallResult(statusData.rawCallData);
          if (normalized) {
            const persistResult = await persistVoiceCharacterization(normalized);
            if (persistResult.persisted) {
              dbUpdated = true;
              newScore = persistResult.newScore;
              fieldsUpdated = persistResult.fieldsUpdated;
            }
          }
        } catch (persistErr) {
          console.warn("[/api/voice/status] Fallback persist attempt error:", persistErr);
        }
      }
    }

    const normalized = statusData.rawCallData ? voiceProvider.normalizeCallResult(statusData.rawCallData) : null;
    const extractedData = normalized?.rawStructured || statusData.rawCallData?.analysis?.structuredData || {};

    return NextResponse.json({
      callId,
      status: statusData.status,
      completed: statusData.completed,
      notAnswered: Boolean(statusData.notAnswered),
      consentDenied: Boolean(statusData.consentDenied),
      hasData: Boolean(statusData.hasData || (fieldsUpdated && fieldsUpdated.length > 0)),
      dbUpdated,
      newScore,
      fieldsUpdated: fieldsUpdated || [],
      extractedData,
      error: statusData.error,
      endedReason: statusData.endedReason,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error al consultar estado" }, { status: 500 });
  }
}
