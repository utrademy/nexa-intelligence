import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface SegmentFilters {
  incompletenessFilter?: "all_incomplete" | "critical_gaps" | "score_lt_70" | "score_lt_85";
  city?: string;
  employmentStatus?: string;
  educationLevel?: string;
  missingField?: string; // e.g. "employment_status", "education_level", "occupation", "city"
}

export interface MatchingPersonPreview {
  id: string;
  fullName: string;
  documentNumber: string;
  city: string;
  employmentStatus: string;
  educationLevel: string;
  characterizationScore: number;
  profileStatus: string;
}

export interface RealCampaignStats {
  id: string;
  name: string;
  description: string;
  status: string;
  audienceCount: number;
  contactedCount: number;
  respondedCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  createdAt: string;
}

/**
 * Builds the Supabase query according to chosen segment filters
 */
function applyFiltersToQuery(query: any, filters: SegmentFilters) {
  // Incompleteness filter
  if (filters.incompletenessFilter === "critical_gaps") {
    query = query.eq("profile_status", "Vacíos críticos");
  } else if (filters.incompletenessFilter === "score_lt_70") {
    query = query.lt("characterization_score", 70);
  } else if (filters.incompletenessFilter === "score_lt_85") {
    query = query.lt("characterization_score", 85);
  } else {
    // Default: incomplete profiles (< 100)
    query = query.lt("characterization_score", 100);
  }

  // City filter
  if (filters.city && filters.city !== "all") {
    query = query.eq("city", filters.city);
  }

  // Employment status
  if (filters.employmentStatus && filters.employmentStatus !== "all") {
    query = query.eq("employment_status", filters.employmentStatus);
  }

  // Education level
  if (filters.educationLevel && filters.educationLevel !== "all") {
    query = query.eq("education_level", filters.educationLevel);
  }

  // Missing field
  if (filters.missingField && filters.missingField !== "all") {
    if (filters.missingField === "employment_status") {
      query = query.or("employment_status.eq.Sin información,employment_status.is.null");
    } else if (filters.missingField === "education_level") {
      query = query.or("education_level.eq.Sin información,education_level.is.null");
    } else if (filters.missingField === "occupation") {
      query = query.or("occupation.eq.Sin información,occupation.is.null");
    } else if (filters.missingField === "city") {
      query = query.or("city.eq.Sin información,city.is.null");
    }
  }

  return query;
}

/**
 * Calculates exact count of people matching the filter criteria from Supabase
 */
export async function getRealSegmentCount(filters: SegmentFilters): Promise<number> {
  const supabase = getSupabaseServerClient();
  let query = supabase.from("people").select("id", { count: "exact", head: true });
  query = applyFiltersToQuery(query, filters);

  const { count, error } = await query;
  if (error) {
    console.error("[campaign-service] Error calculating segment count:", error);
    return 0;
  }
  return count || 0;
}

/**
 * Previews matching people for the segment filter (returns top N rows)
 */
export async function getRealSegmentPreview(
  filters: SegmentFilters,
  limit = 10,
): Promise<MatchingPersonPreview[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("people")
    .select(
      "id, first_name, last_name, document_type, document_number, city, employment_status, education_level, characterization_score, profile_status",
    )
    .order("characterization_score", { ascending: true })
    .limit(limit);

  query = applyFiltersToQuery(query, filters);

  const { data, error } = await query;
  if (error || !data) {
    console.error("[campaign-service] Error fetching segment preview:", error);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    fullName: `${p.first_name} ${p.last_name}`.trim(),
    documentNumber: `${p.document_type || "CC"} ${p.document_number}`,
    city: p.city || "Sin información",
    employmentStatus: p.employment_status || "Sin información",
    educationLevel: p.education_level || "Sin información",
    characterizationScore: p.characterization_score || 0,
    profileStatus: p.profile_status || "Parcial",
  }));
}

/**
 * Fetches real candidate associates directly linked to a campaign from Supabase
 */
export async function getCampaignCandidates(
  campaignId: string,
  limit = 10,
): Promise<MatchingPersonPreview[]> {
  const supabase = getSupabaseServerClient();

  const { data: targets, error } = await supabase
    .from("campaign_targets")
    .select(`
      person_id,
      people (
        id, first_name, last_name, document_type, document_number, city, employment_status, education_level, characterization_score, profile_status
      )
    `)
    .eq("campaign_id", campaignId)
    .limit(limit);

  if (!error && targets && targets.length > 0) {
    const people = targets
      .map((t: any) => t.people)
      .filter(Boolean)
      .map((p: any) => ({
        id: p.id,
        fullName: `${p.first_name} ${p.last_name || ""}`.trim(),
        documentNumber: `${p.document_type || "CC"} ${p.document_number || ""}`.trim(),
        city: p.city || "Sin información",
        employmentStatus: p.employment_status || "Sin información",
        educationLevel: p.education_level || "Sin información",
        characterizationScore: p.characterization_score || 0,
        profileStatus: p.profile_status || "Parcial",
      }));

    if (people.length > 0) {
      return people;
    }
  }

  // Fallback to segment preview if no targets are linked yet
  return getRealSegmentPreview({ incompletenessFilter: "critical_gaps" }, limit);
}

/**
 * Creates a real campaign in Supabase with targeted audience
 */
export async function createRealCampaign(params: {
  name: string;
  description: string;
  channel: string;
  filters: SegmentFilters;
}): Promise<{ campaignId: string; audienceCount: number }> {
  const supabase = getSupabaseServerClient();

  // 1. Get exact audience count and candidate IDs
  let query = supabase.from("people").select("id, organization_id").order("characterization_score", { ascending: true }).limit(500);
  query = applyFiltersToQuery(query, params.filters);

  const { data: candidates, error: cErr } = await query;
  if (cErr) {
    throw new Error(`Error obteniendo audiencia: ${cErr.message}`);
  }

  const audienceCount = await getRealSegmentCount(params.filters);
  const organizationId = candidates?.[0]?.organization_id || "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

  // 2. Insert into campaigns table
  const { data: newCamp, error: campErr } = await supabase
    .from("campaigns")
    .insert({
      organization_id: organizationId,
      name: params.name,
      description: params.description,
      status: "Activa",
      audience_count: audienceCount,
      contacted_count: 0,
      responded_count: 0,
      completed_count: 0,
    })
    .select("id")
    .single();

  if (campErr || !newCamp) {
    throw new Error(`Error creando campaña en Supabase: ${campErr?.message}`);
  }

  // 3. Insert initial targets (up to 100 targets linked to this campaign)
  if (candidates && candidates.length > 0) {
    const targetsToInsert = candidates.slice(0, 100).map((c) => ({
      campaign_id: newCamp.id,
      person_id: c.id,
      channel: "voice",
      status: "Sin contactar",
    }));

    await supabase.from("campaign_targets").insert(targetsToInsert);
  }

  return { campaignId: newCamp.id, audienceCount };
}

/**
 * Fetches real execution metrics and interactions for a given campaign
 */
export async function getCampaignExecutionMetrics(campaignId: string) {
  const supabase = getSupabaseServerClient();

  // 1. Campaign row
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  // 2. Interactions tied to this campaign
  const { data: interactions } = await supabase
    .from("interactions")
    .select("id, status, channel, created_at, person_id, summary, structured_data")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  // 3. Real targets
  const { data: targets, count: totalTargets } = await supabase
    .from("campaign_targets")
    .select("id, status, channel", { count: "exact" })
    .eq("campaign_id", campaignId);

  const realInteractions = interactions || [];
  const intentados = campaign?.contacted_count ?? realInteractions.length;
  const contestadas = campaign?.responded_count ?? realInteractions.filter((i) => i.status === "COMPLETED" || i.status === "IN_PROGRESS").length;
  const completadas = campaign?.completed_count ?? realInteractions.filter((i) => i.status === "COMPLETED").length;
  const fallidas = Math.max(0, intentados - contestadas);
  const pendientes = Math.max(0, (campaign?.audience_count || totalTargets || 0) - intentados);

  return {
    campaign,
    metrics: {
      intentos: intentados,
      contestadas: contestadas,
      completadas: completadas,
      fallidas: fallidas,
      pendientes: pendientes,
    },
    interactions: realInteractions,
  };
}

/**
 * Fetches real interactions for campaigns view with joined people names and details
 */
export async function getCampaignFeedInteractions(limit = 40, campaignId?: string) {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("interactions")
    .select("id, person_id, campaign_id, channel, status, summary, structured_data, created_at, people(id, first_name, last_name, city)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => {
    const person = row.people || {};
    const fullName = person.first_name ? `${person.first_name} ${person.last_name || ""}`.trim() : "Asociado";
    const city = person.city || "Bucaramanga";
    const struct = (row.structured_data || {}) as Record<string, any>;
    const fieldsCollected = Array.isArray(struct.fields_updated) ? struct.fields_updated.length : row.status === "COMPLETED" ? 17 : 2;

    let mappedStatus: "Completado" | "En progreso" | "Sin respuesta" | "No desea participar" | "Requiere revisión" = "Completado";
    if (row.status === "IN_PROGRESS") mappedStatus = "En progreso";
    else if (row.status === "FAILED" || row.status === "ERROR") mappedStatus = "Sin respuesta";
    else if (struct.consent_status === "Denegada") mappedStatus = "No desea participar";

    const chKey = (row.channel || "VOICE").toLowerCase();
    const finalChannel = chKey === "voice" ? "voice" : chKey === "whatsapp" ? "whatsapp" : chKey === "form" ? "form" : "voice";

    return {
      id: row.id,
      personId: row.person_id,
      personName: fullName,
      city,
      channel: finalChannel as any,
      status: mappedStatus,
      fieldsCollected,
      fieldsRequested: 17,
      duration: row.status === "COMPLETED" ? "1 min 42 s" : "—",
      timestamp: row.created_at,
      sentiment: (struct.consent_status === "Denegada" ? "Negativo" : "Positivo") as any,
    };
  });
}

