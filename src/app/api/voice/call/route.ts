import { NextResponse } from "next/server";
import { voiceProvider, VOICE_CONFIG } from "@/lib/voice/provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, destinationPhone, customerName } = body;

    if (!personId || !destinationPhone) {
      return NextResponse.json(
        { error: "Se requiere personId y número de teléfono de destino autorizado." },
        { status: 400 },
      );
    }

    // Safety verification: do not dial empty or synthetic test strings
    const cleanPhone = destinationPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone.startsWith("+") || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Formato de teléfono inválido. Debe incluir código de país, p.ej. +573001234567" },
        { status: 400 },
      );
    }

    // Verify person exists in DB
    const supabase = getSupabaseServerClient();
    const { data: person, error: pError } = await supabase
      .from("people")
      .select("id, first_name, last_name, organization_id, characterization_score")
      .eq("id", personId)
      .single();

    if (pError || !person) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
    }

    // Check if voice API key is ready
    if (!VOICE_CONFIG.apiKey) {
      return NextResponse.json(
        {
          error: "MANUAL_ACTION_REQUIRED",
          message:
            "El proveedor de Voice AI aún requiere configuración de VOICE_PROVIDER_API_KEY en las variables de entorno.",
          configured: {
            apiKey: false,
            phoneNumberId: Boolean(VOICE_CONFIG.configuredPhoneNumberId),
          },
        },
        { status: 412 },
      );
    }

    const fullName = customerName || `${person.first_name} ${person.last_name}`;
    const result = await voiceProvider.startCharacterizationCall({
      personId,
      destinationPhone: cleanPhone,
      customerName: fullName,
    });

    // Log call initiation
    await supabase.from("interactions").insert({
      organization_id: person.organization_id,
      person_id: person.id,
      channel: "VOICE",
      direction: "OUTBOUND",
      status: "IN_PROGRESS",
      summary: `Llamada con IA iniciada al número autorizado (${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-2)}).`,
      structured_data: {
        provider_call_id: result.callId,
        provider: result.provider,
        status: result.status,
        started_at: new Date().toISOString(),
      },
      ai_generated: true,
    });

    return NextResponse.json({
      success: true,
      callId: result.callId,
      status: result.status,
    });
  } catch (err: any) {
    console.error("[api/voice/call] Error initiating call:", err);
    return NextResponse.json(
      { error: "Error al iniciar la llamada", message: err?.message || String(err) },
      { status: 500 },
    );
  }
}
