import { NextResponse } from "next/server";
import { voiceProvider, VOICE_CONFIG } from "@/lib/voice/provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, destinationPhone, customerName, campaignId } = body;

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

    // Verify person exists in DB and fetch existing attributes
    const supabase = getSupabaseServerClient();
    const { data: person, error: pError } = await supabase
      .from("people")
      .select("id, first_name, last_name, organization_id, characterization_score, city, phone, email, employment_status, occupation, education_level, member_since")
      .eq("id", personId)
      .single();

    if (pError || !person) {
      return NextResponse.json({ error: "Persona no encontrada" }, { status: 404 });
    }

    // Fetch existing attributes to know what is already known vs missing
    const { data: attrRows } = await supabase
      .from("person_attributes")
      .select("attribute_key, attribute_value")
      .eq("person_id", personId);

    const attrMap = new Map<string, string>();
    for (const a of attrRows || []) {
      if (a.attribute_value && a.attribute_value !== "Sin información") {
        attrMap.set(a.attribute_key, a.attribute_value);
      }
    }

    const knownSummary: string[] = [];
    const missingFields: string[] = [];

    // 1. Ubicación y vivienda
    if (person.city) {
      knownSummary.push(`Ciudad o municipio de residencia: ${person.city}`);
    } else if (attrMap.has("municipality")) {
      knownSummary.push(`Ciudad o municipio de residencia: ${attrMap.get("municipality")}`);
    } else {
      missingFields.push("Municipio o ciudad de residencia");
    }

    if (attrMap.has("housing") || attrMap.has("stratum")) {
      knownSummary.push(`Vivienda: ${attrMap.get("housing") || "Propia/Arriendo"} (Estrato ${attrMap.get("stratum") || ""})`.trim());
    } else {
      missingFields.push("Tipo de vivienda (propia o arriendo) y estrato socioeconómico");
    }

    // 2. Conformación del hogar
    if (attrMap.has("householdSize") || attrMap.has("dependents")) {
      knownSummary.push(`Hogar: ${attrMap.get("householdSize") || "N/D"} personas (${attrMap.get("dependents") || "0"} a cargo)`);
    } else {
      missingFields.push("Conformación del hogar (número de personas y personas a cargo económicamente)");
    }

    // 3. Situación laboral y ocupación
    const empStatus = person.employment_status || attrMap.get("employmentStatus");
    const occup = person.occupation || attrMap.get("occupation");
    if (empStatus && empStatus !== "Sin información") {
      knownSummary.push(`Situación laboral: ${empStatus}`);
    } else {
      missingFields.push("Situación laboral actual");
    }

    if (occup && occup !== "Sin información") {
      knownSummary.push(`Ocupación principal: ${occup}`);
    } else {
      missingFields.push("Ocupación, oficio o actividad principal");
    }

    // 4. Educación
    const edu = person.education_level || attrMap.get("educationLevel");
    if (edu && edu !== "Sin información") {
      knownSummary.push(`Nivel educativo: ${edu}`);
    } else {
      missingFields.push("Nivel educativo más alto alcanzado y área de estudio");
    }

    // 5. Inclusión y salud / discapacidad
    if (attrMap.has("disability")) {
      knownSummary.push(`Condición de salud / discapacidad: ${attrMap.get("disability")}`);
    } else {
      missingFields.push("Condición de salud o discapacidad física/médica permanente");
    }

    // 6. Ingresos y metas financieras
    if (attrMap.has("income")) {
      knownSummary.push(`Rango de ingresos: ${attrMap.get("income")}`);
    } else {
      missingFields.push("Rango aproximado de ingresos mensuales");
    }

    if (attrMap.has("goals") || attrMap.has("savings")) {
      knownSummary.push(`Metas financieras: ${attrMap.get("goals") || attrMap.get("savings")}`);
    } else {
      missingFields.push("Metas de ahorro o financieras para este año");
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
      campaignId: campaignId || undefined,
      knownSummary,
      missingFields,
    });

    // Log call initiation
    await supabase.from("interactions").insert({
      organization_id: person.organization_id,
      person_id: person.id,
      campaign_id: campaignId || null,
      channel: "VOICE",
      direction: "OUTBOUND",
      status: "IN_PROGRESS",
      summary: `Llamada con IA iniciada al número autorizado (${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-2)}).`,
      structured_data: {
        provider_call_id: result.callId,
        provider: result.provider,
        status: result.status,
        campaign_id: campaignId || null,
        started_at: new Date().toISOString(),
      },
      ai_generated: true,
    });

    return NextResponse.json({
      success: true,
      callId: result.callId,
      status: result.status,
      campaignId: campaignId || null,
    });
  } catch (err: any) {
    console.error("[api/voice/call] Error initiating call:", err);
    return NextResponse.json(
      { error: "Error al iniciar la llamada", message: err?.message || String(err) },
      { status: 500 },
    );
  }
}
