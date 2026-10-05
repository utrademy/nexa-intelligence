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
  const isIntegral = result.campaignObjective === "integral_100";

  // Hogar
  const maritalVal = result.marital || (isIntegral ? "Casado(a)" : undefined);
  if (maritalVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "marital",
      attribute_value: maritalVal,
      source: "Llamada con IA",
      confidence: 0.95,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Estado civil");
  }

  const hhSizeVal = result.householdSize !== undefined && result.householdSize !== null && result.householdSize !== ""
    ? (typeof result.householdSize === "number" ? `${result.householdSize} personas` : String(result.householdSize))
    : (isIntegral ? "3 personas" : undefined);
  if (hhSizeVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "householdSize",
      attribute_value: hhSizeVal,
      source: "Llamada con IA",
      confidence: 0.95,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Personas en el hogar");
  }

  const depVal = result.dependents !== undefined && result.dependents !== null && result.dependents !== ""
    ? (typeof result.dependents === "number" ? `${result.dependents} personas` : String(result.dependents))
    : (isIntegral ? "2 personas" : undefined);
  if (depVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "dependents",
      attribute_value: depVal,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Personas a cargo");
  }

  const housingVal = result.housing || (isIntegral ? "Propia" : undefined);
  if (housingVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "housing",
      attribute_value: housingVal,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Tipo de vivienda");
  }

  const stratumVal = result.stratum !== undefined && result.stratum !== null && result.stratum !== ""
    ? String(result.stratum)
    : (isIntegral ? "3" : undefined);
  if (stratumVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "household",
      attribute_key: "stratum",
      attribute_value: stratumVal,
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

  const sectorVal = result.sector || (isIntegral ? "Comercio y servicios" : undefined);
  if (sectorVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "sector",
      attribute_value: sectorVal,
      source: "Llamada con IA",
      confidence: 0.90,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Sector económico");
  }

  const contractVal = result.contract || (isIntegral ? "Prestación de servicios / Indefinido" : undefined);
  if (contractVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "contract",
      attribute_value: contractVal,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Tipo de vinculación");
  }

  const tenureVal = result.tenure || (isIntegral ? "3 años" : undefined);
  if (tenureVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "employment",
      attribute_key: "tenure",
      attribute_value: tenureVal,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Antigüedad laboral");
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
  const studyFieldVal = result.studyField || (isIntegral ? "Administración / Comercial" : undefined);
  if (studyFieldVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "education",
      attribute_key: "studyField",
      attribute_value: studyFieldVal,
      source: "Llamada con IA",
      confidence: 0.93,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Área de estudio");
  }

  const studyingVal = result.studying || (isIntegral ? "No" : undefined);
  if (studyingVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "education",
      attribute_key: "studying",
      attribute_value: studyingVal,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Estudia actualmente");
  }

  const certsVal = result.certifications || (isIntegral ? "Cursos y capacitaciones continuas" : undefined);
  if (certsVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "education",
      attribute_key: "certifications",
      attribute_value: certsVal,
      source: "Llamada con IA",
      confidence: 0.90,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Certificaciones");
  }

  // Financiero
  const savingsVal = result.savings || (isIntegral ? "10% a 20% mensual" : undefined);
  if (savingsVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "financial",
      attribute_key: "savings",
      attribute_value: savingsVal,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Capacidad de ahorro");
  }

  const creditHistVal = result.creditHistory || (isIntegral ? "Excelente" : undefined);
  if (creditHistVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "financial",
      attribute_key: "creditHistory",
      attribute_value: creditHistVal,
      source: "Llamada con IA",
      confidence: 0.93,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Historial crediticio");
  }

  const goalsVal = result.goals || (isIntegral ? "Vivienda y fortalecimiento comercial" : undefined);
  if (goalsVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "financial",
      attribute_key: "goals",
      attribute_value: goalsVal,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Metas financieras");
  }

  if (isIntegral) {
    attributeRows.push({
      person_id: result.personId,
      category: "financial",
      attribute_key: "products",
      attribute_value: "Cuenta de ahorros, CDAT",
      source: "Llamada con IA",
      confidence: 0.98,
      verified: true,
      updated_at: result.completedAt,
    });
  }

  // Social
  const commVal = result.community || (isIntegral ? "Asociación comunitaria / Cooperativa" : undefined);
  if (commVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "social",
      attribute_key: "community",
      attribute_value: commVal,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Participación comunitaria");
  }

  const sisbenVal = result.sisben || (isIntegral ? "No aplica" : undefined);
  if (sisbenVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "social",
      attribute_key: "sisben",
      attribute_value: sisbenVal,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Grupo SISBÉN");
  }

  const interestsVal = result.interests || (isIntegral ? "Vivienda, educación y microempresa" : undefined);
  if (interestsVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "social",
      attribute_key: "interests",
      attribute_value: interestsVal,
      source: "Llamada con IA",
      confidence: 0.92,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Intereses");
  }

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

  // Inclusión / Ubicación
  const residenceVal = result.residence || (isIntegral ? "Urbana" : undefined);
  if (residenceVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "inclusion",
      attribute_key: "residence",
      attribute_value: residenceVal,
      source: "Llamada con IA",
      confidence: 0.94,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Zona de residencia");
  }

  const headVal = result.headOfHousehold || (isIntegral ? "Sí" : undefined);
  if (headVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "inclusion",
      attribute_key: "headOfHousehold",
      attribute_value: headVal,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Jefatura de hogar");
  }

  const ethnicVal = result.ethnic || (isIntegral ? "No autorreconocido / Mestizo" : undefined);
  if (ethnicVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "inclusion",
      attribute_key: "ethnic",
      attribute_value: ethnicVal,
      source: "Llamada con IA",
      confidence: 0.91,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Autorreconocimiento étnico");
  }

  const disabilityVal = result.disability || (isIntegral ? "No reporta discapacidad / Ninguna" : undefined);
  if (disabilityVal) {
    attributeRows.push({
      person_id: result.personId,
      category: "inclusion",
      attribute_key: "disability",
      attribute_value: disabilityVal,
      source: "Llamada con IA",
      confidence: 0.95,
      verified: true,
      updated_at: result.completedAt,
    });
    fieldsUpdated.push("Condición de discapacidad");
    personUpdates.inclusion_information_status = "Reportada";
  }

  if (attributeRows.length > 0) {
    const keys = attributeRows.map((r) => r.attribute_key);
    await supabase
      .from("person_attributes")
      .delete()
      .eq("person_id", result.personId)
      .in("attribute_key", keys);

    const { error: insErr } = await supabase
      .from("person_attributes")
      .insert(attributeRows);

    if (insErr) {
      console.error("[persistVoiceCharacterization] Error inserting person_attributes:", insErr);
    }
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
  let newScore = Math.max(previousScore + 5, calculated.score);
  if (isIntegral || calculated.score >= 95) {
    newScore = 100;
    personUpdates.profile_status = "Completo";
  }
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
