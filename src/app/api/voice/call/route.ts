import { NextResponse } from "next/server";
import { voiceProvider, VOICE_CONFIG } from "@/lib/voice/provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personId, destinationPhone, customerName, campaignId, campaignObjective = "integral_100" } = body;

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

    // 1. Personal y Ubicación
    if (person.city) {
      knownSummary.push(`Ciudad o municipio de residencia: ${person.city}`);
    } else if (attrMap.has("municipality")) {
      knownSummary.push(`Ciudad o municipio de residencia: ${attrMap.get("municipality")}`);
    } else {
      missingFields.push("Municipio o ciudad de residencia");
    }

    // 2. Hogar
    if (attrMap.has("marital")) {
      knownSummary.push(`Estado civil: ${attrMap.get("marital")}`);
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Estado civil actual");
    }

    if (attrMap.has("housing") || attrMap.has("stratum")) {
      knownSummary.push(`Vivienda: ${attrMap.get("housing") || "Propia/Arriendo"} (Estrato ${attrMap.get("stratum") || ""})`.trim());
    } else {
      missingFields.push("Tipo de vivienda (propia o arriendo) y estrato socioeconómico");
    }

    if (attrMap.has("householdSize") || attrMap.has("dependents")) {
      knownSummary.push(`Hogar: ${attrMap.get("householdSize") || "N/D"} personas (${attrMap.get("dependents") || "0"} a cargo)`);
    } else {
      missingFields.push("Conformación del hogar (número de personas y personas a cargo económicamente)");
    }

    // 3. Laboral
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

    if (attrMap.has("sector") || attrMap.has("contract")) {
      knownSummary.push(`Sector y tipo de contrato: ${attrMap.get("sector") || "N/D"} (${attrMap.get("contract") || ""})`.trim());
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Sector económico y tipo de vinculación laboral o contrato");
    }

    if (attrMap.has("tenure")) {
      knownSummary.push(`Antigüedad en la actividad: ${attrMap.get("tenure")}`);
    } else if (campaignObjective === "integral_100" || campaignObjective === "actualizar_informacion") {
      missingFields.push("Antigüedad en su ocupación o empleo actual");
    }

    if (attrMap.has("income")) {
      knownSummary.push(`Rango de ingresos: ${attrMap.get("income")}`);
    } else {
      missingFields.push("Rango aproximado de ingresos mensuales");
    }

    // 4. Educación
    const edu = person.education_level || attrMap.get("educationLevel");
    if (edu && edu !== "Sin información") {
      knownSummary.push(`Nivel educativo: ${edu}`);
    } else {
      missingFields.push("Nivel educativo más alto alcanzado y área de estudio");
    }

    if (attrMap.has("studying") || attrMap.has("certifications")) {
      knownSummary.push(`Estudios actuales / certificaciones: ${attrMap.get("studying") || "N/D"} (${attrMap.get("certifications") || ""})`.trim());
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Si se encuentra estudiando actualmente y certificaciones obtenidas");
    }

    // 5. Financiero
    if (attrMap.has("savings")) {
      knownSummary.push(`Capacidad de ahorro: ${attrMap.get("savings")}`);
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Capacidad o hábito de ahorro mensual estimado");
    }

    if (attrMap.has("creditHistory")) {
      knownSummary.push(`Historial crediticio: ${attrMap.get("creditHistory")}`);
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Historial o experiencia crediticia previa");
    }

    if (attrMap.has("goals")) {
      knownSummary.push(`Metas financieras: ${attrMap.get("goals")}`);
    } else {
      missingFields.push("Metas de ahorro o financieras para este año");
    }

    // 6. Social
    if (attrMap.has("community") || attrMap.has("sisben") || attrMap.has("interests")) {
      knownSummary.push(`Social: ${attrMap.get("community") || "N/D"}, SISBÉN: ${attrMap.get("sisben") || "N/D"}`);
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Participación comunitaria, grupo SISBÉN e intereses personales");
    }

    if (attrMap.has("preferredChannel")) {
      knownSummary.push(`Canal de contacto preferido: ${attrMap.get("preferredChannel")}`);
    } else {
      missingFields.push("Canal de contacto preferido (llamada, WhatsApp, etc.)");
    }

    // 7. Inclusión
    if (attrMap.has("disability")) {
      knownSummary.push(`Condición de salud / discapacidad: ${attrMap.get("disability")}`);
    } else {
      missingFields.push("Condición de salud o discapacidad física/médica permanente");
    }

    if (attrMap.has("ethnic")) {
      knownSummary.push(`Autorreconocimiento étnico: ${attrMap.get("ethnic")}`);
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Autorreconocimiento étnico");
    }

    if (attrMap.has("headOfHousehold")) {
      knownSummary.push(`Jefatura de hogar: ${attrMap.get("headOfHousehold")}`);
    } else if (campaignObjective === "integral_100") {
      missingFields.push("Jefatura de hogar (si es cabeza de familia)");
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
      campaignObjective,
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
      summary: `Llamada con IA (${campaignObjective}) iniciada al número autorizado (${cleanPhone.slice(0, 4)}***${cleanPhone.slice(-2)}).`,
      structured_data: {
        provider_call_id: result.callId,
        provider: result.provider,
        status: result.status,
        campaign_id: campaignId || null,
        campaign_objective: campaignObjective,
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
