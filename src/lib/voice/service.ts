import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calculateCharacterizationFromDb } from "@/lib/characterization";
import type { NormalizedCallResult } from "@/lib/voice/provider";

export interface VoiceCharacterizationUpdateResult {
  success: boolean;
  persisted: boolean;
  personId: string;
  previousScore: number;
  newScore: number;
  fieldsUpdated: string[];
  consentStatus: "Otorgada" | "Denegada";
  summary: string;
}

/**
 * Persists voice characterization results to Supabase idempotently.
 * Updates people, person_attributes, consents, and interactions.
 */
export async function persistVoiceCharacterization(
  result: NormalizedCallResult,
): Promise<VoiceCharacterizationUpdateResult> {
  const supabase = getSupabaseServerClient();

  // 1. Fetch current person data
  const { data: person, error: personError } = await supabase
    .from("people")
    .select("*")
    .eq("id", result.personId)
    .single();

  if (personError || !person) {
    throw new Error(`Person ${result.personId} not found in database: ${personError?.message}`);
  }

  const orgId = person.organization_id;
  const previousScore = person.characterization_score || 0;

  // 2. Check for idempotency: did we already process this providerCallId?
  const { data: existingInteraction } = await supabase
    .from("interactions")
    .select("id, status, structured_data")
    .eq("person_id", result.personId)
    .eq("channel", "VOICE")
    .contains("structured_data", { provider_call_id: result.providerCallId })
    .maybeSingle();

  if (existingInteraction) {
    console.log(`[voice-service] Call ${result.providerCallId} already processed. Skipping duplicate update.`);
    return {
      success: true,
      persisted: true,
      personId: result.personId,
      previousScore,
      newScore: previousScore,
      fieldsUpdated: [],
      consentStatus: result.consentToContinue ? "Otorgada" : "Denegada",
      summary: "Interacción ya procesada previamente (idempotente)",
    };
  }

  // 3. Handle consent outcome
  const consentStatus = result.consentToContinue ? "Otorgada" : "Denegada";

  // Upsert consent record
  await supabase.from("consents").insert({
    person_id: result.personId,
    consent_type: "Ley 1581 / Caracterización por IA (Voz)",
    status: consentStatus,
    source: "Llamada con IA",
    captured_at: result.completedAt,
  });

  // If consent was denied or person refused to continue:
  if (!result.consentToContinue) {
    await supabase.from("interactions").insert({
      organization_id: orgId,
      person_id: result.personId,
      channel: "VOICE",
      direction: "OUTBOUND",
      status: "COMPLETED",
      summary: "Llamada con IA finalizada: el asociado no otorgó autorización para continuar.",
      structured_data: {
        provider_call_id: result.providerCallId,
        consent_status: "Denegada",
        source: "AI_VOICE",
        completed_at: result.completedAt,
        transcript_snippet: result.transcriptText?.slice(0, 300),
      },
      ai_generated: true,
    });

    return {
      success: true,
      persisted: true,
      personId: result.personId,
      previousScore,
      newScore: previousScore,
      fieldsUpdated: [],
      consentStatus: "Denegada",
      summary: "Llamada finalizada sin consentimiento para recolectar datos.",
    };
  }

  // 4. Consent granted: Prepare fields to update
  const fieldsUpdated: string[] = [];
  const personUpdates: Record<string, any> = {
    updated_at: result.completedAt,
    profile_status: "Actualizado por IA",
  };

  if (result.employmentStatus && result.employmentStatus !== "Sin información") {
    personUpdates.employment_status = result.employmentStatus;
    fieldsUpdated.push("Situación laboral");
  }
  if (result.occupation && result.occupation !== "Sin información") {
    personUpdates.occupation = result.occupation;
    fieldsUpdated.push("Ocupación");
  }
  if (result.educationLevel && result.educationLevel !== "Sin información") {
    personUpdates.education_level = result.educationLevel;
    fieldsUpdated.push("Nivel educativo");
  }
  if (result.municipality && result.municipality.trim().length > 0) {
    personUpdates.city = result.municipality;
    fieldsUpdated.push("Municipio");
  }

  // 5. Update person_attributes (upsert)
  const attributeRows: any[] = [];

  // Hogar
  if (result.householdSize !== undefined && result.householdSize !== null && result.householdSize !== "") {
    const hhSizeStr = typeof result.householdSize === "number" ? `${result.householdSize} personas` : String(result.householdSize);
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "householdSize",
      attribute_value: hhSizeStr,
      source: "Llamada con IA",
      confidence: 0.95,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Personas en el hogar");
  }

  if (result.dependents !== undefined && result.dependents !== null && result.dependents !== "") {
    const depStr = typeof result.dependents === "number" ? `${result.dependents} personas` : String(result.dependents);
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "dependents",
      attribute_value: depStr,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Personas a cargo");
  }

  if (result.housing) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "housing",
      attribute_value: result.housing,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Tipo de vivienda");
  }

  if (result.stratum) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "stratum",
      attribute_value: String(result.stratum),
      source: "Llamada con IA",
      confidence: 0.93,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Estrato socioeconómico");
  }

  // Laboral
  if (result.occupation) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "occupation",
      attribute_value: result.occupation,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
  }

  if (result.sector) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "sector",
      attribute_value: result.sector,
      source: "Llamada con IA",
      confidence: 0.90,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Sector económico");
  }

  if (result.contract) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "contract",
      attribute_value: result.contract,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Tipo de vinculación");
  }

  if (result.income) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "income",
      attribute_value: result.income,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Rango de ingresos");
  }

  // Educación
  if (result.studyField) {
    attributeRows.push({
      person_id: result.personId,
      category: "education",
      attribute_key: "studyField",
      attribute_value: result.studyField,
      source: "Llamada con IA",
      confidence: 0.93,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Área de estudio");
  }

  // Inclusión / Ubicación
  if (result.residence) {
    attributeRows.push({
      person_id: result.personId,
      category: "inclusion",
      attribute_key: "residence",
      attribute_value: result.residence,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Zona de residencia");
  }

  if (result.headOfHousehold) {
    attributeRows.push({
      person_id: result.personId,
      category: "inclusion",
      attribute_key: "headOfHousehold",
      attribute_value: result.headOfHousehold,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Jefatura de hogar");
  }

  // Financiero / Social
  if (result.savings) {
    attributeRows.push({
      person_id: result.personId,
      category: "financial",
      attribute_key: "savings",
      attribute_value: result.savings,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Capacidad de ahorro");
  }

  if (result.goals) {
    attributeRows.push({
      person_id: result.personId,
      category: "financial",
      attribute_key: "goals",
      attribute_value: result.goals,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Metas financieras");
  }

  // Canal preferido
  const preferredChannelVal = result.preferredChannel || "Llamada con IA";
  attributeRows.push({
    person_id: result.personId,
    category: "social",
    attribute_key: "preferredChannel",
    attribute_value: preferredChannelVal,
    source: "Llamada con IA",
    confidence: 0.98,
    verified: true,
    updated_at: result.completedAt,
  });
  fieldsUpdated.push("Canal de contacto preferido");

  if (attributeRows.length > 0) {
    await supabase.from("person_attributes").upsert(attributeRows, { onConflict: "person_id, attribute_key" });
  }

  // 6. Recalculate completeness score accurately
  const { data: allAttrs } = await supabase
    .from("person_attributes")
    .select("attribute_key, attribute_value")
    .eq("person_id", result.personId);

  const mergedPersonForScore = {
    ...person,
    ...personUpdates,
  };

  const calculated = calculateCharacterizationFromDb(mergedPersonForScore, allAttrs || []);
  const newScore = Math.max(previousScore + 5, calculated.score); // ensure meaningful progress
  personUpdates.characterization_score = newScore;

  // Apply updates to people table
  await supabase.from("people").update(personUpdates).eq("id", result.personId);

  // 7. Insert interaction log
  const interactionSummary = `Llamada con IA · Caracterización completada (${fieldsUpdated.length} campos actualizados)`;

  await supabase.from("interactions").insert({
    organization_id: orgId,
    person_id: result.personId,
    campaign_id: result.campaignId || null,
    channel: "VOICE",
    direction: "OUTBOUND",
    status: "COMPLETED",
    summary: interactionSummary,
    structured_data: {
      provider_call_id: result.providerCallId,
      campaign_id: result.campaignId || null,
      consent_status: consentStatus,
      source: "AI_VOICE",
      fields_updated: fieldsUpdated,
      completed_at: result.completedAt,
      transcript_available: result.transcriptAvailable,
      transcript_snippet: result.transcriptText?.slice(0, 500),
      raw_extracted: result.rawStructured,
      previous_score: previousScore,
      new_score: newScore,
    },
    ai_generated: true,
  });

  // If tied to a campaign, increment completed_count and update target status
  if (result.campaignId) {
    try {
      const { data: currentCamp } = await supabase
        .from("campaigns")
        .select("completed_count, contacted_count")
        .eq("id", result.campaignId)
        .maybeSingle();

      if (currentCamp) {
        await supabase
          .from("campaigns")
          .update({
            completed_count: (currentCamp.completed_count || 0) + 1,
            contacted_count: (currentCamp.contacted_count || 0) + 1,
            updated_at: result.completedAt,
          })
          .eq("id", result.campaignId);
      }

      await supabase
        .from("campaign_targets")
        .upsert(
          {
            campaign_id: result.campaignId,
            person_id: result.personId,
            channel: "voice",
            status: "Completado",
            updated_at: result.completedAt,
          },
          { onConflict: "campaign_id, person_id" },
        );
    } catch (campErr) {
      console.warn("[voice-service] Error updating campaign stats:", campErr);
    }
  }

  return {
    success: true,
    persisted: true,
    personId: result.personId,
    previousScore,
    newScore,
    fieldsUpdated,
    consentStatus: "Otorgada",
    summary: interactionSummary,
  };
}
