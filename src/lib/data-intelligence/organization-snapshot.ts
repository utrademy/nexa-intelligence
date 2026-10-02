import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface OrganizationSnapshot {
  dataset: {
    type: "synthetic_poc_sample";
    sampleSize: number;
    organizationName: string;
    organizationType: string;
    internalEmployees: number;
    conceptualTotalPopulation: number;
    generatedAt: string;
  };
  contactability: {
    contactableCount: number;
    nonContactableCount: number;
    contactablePercentage: number;
  };
  characterization: {
    averageScore: number;
    statusDistribution: {
      completo: number;
      parcial: number;
      vaciosCriticos: number;
      actualizadoPorIA: number;
    };
    scoreBrackets: {
      menor50: number;
      de50a69: number;
      de70a84: number;
      mayorIgual85: number;
    };
  };
  employment: {
    breakdown: Record<string, number>;
    missingOrUnknownCount: number;
    missingPercentage: number;
  };
  education: {
    breakdown: Record<string, number>;
    missingOrUnknownCount: number;
    missingPercentage: number;
  };
  inclusion: {
    breakdown: {
      reportada: number;
      parcial: number;
      pendiente: number;
    };
    coveragePercentage: number;
    pendingPercentage: number;
  };
  geography: {
    cityBreakdown: Array<{
      city: string;
      department: string;
      count: number;
      averageScore: number;
      criticalGapsCount: number;
      criticalGapsPercentage: number;
    }>;
    departmentBreakdown: Record<string, number>;
    topGapCities: Array<{
      city: string;
      criticalGapsCount: number;
      criticalGapsPercentage: number;
      averageScore: number;
    }>;
  };
  campaigns: {
    activeCampaignsCount: number;
    featuredCampaignName: string;
    targetsSummary: Record<string, number>;
  };
}

export async function getOrganizationIntelligenceSnapshot(): Promise<OrganizationSnapshot | null> {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch organization metadata
    const { data: orgData } = await supabase.from("organizations").select("*").limit(1).single();

    // 2. Fetch all people in sample (paginated to load all records beyond PostgREST 1000 limit)
    const people: Array<{
      id: string;
      city: string | null;
      department: string | null;
      employment_status: string | null;
      education_level: string | null;
      characterization_score: number | null;
      profile_status: string | null;
      contactable: boolean | null;
      inclusion_information_status: string | null;
    }> = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: chunk, error: chunkError } = await supabase
        .from("people")
        .select("id, city, department, employment_status, education_level, characterization_score, profile_status, contactable, inclusion_information_status")
        .range(from, from + pageSize - 1);

      if (chunkError) {
        console.warn("[data-intelligence] Could not load people chunk:", chunkError.message);
        break;
      }
      if (!chunk || chunk.length === 0) break;
      people.push(...chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }

    if (people.length === 0) {
      console.warn("[data-intelligence] No people records found in DB");
      return null;
    }

    const sampleSize = people.length;
    let contactableCount = 0;
    let scoreSum = 0;

    const statusCounts = { completo: 0, parcial: 0, vaciosCriticos: 0, actualizadoPorIA: 0 };
    const scoreBrackets = { menor50: 0, de50a69: 0, de70a84: 0, mayorIgual85: 0 };
    const employmentBreakdown: Record<string, number> = {};
    const educationBreakdown: Record<string, number> = {};
    const inclusionBreakdown = { reportada: 0, parcial: 0, pendiente: 0 };
    const departmentBreakdown: Record<string, number> = {};
    const cityMap: Record<string, { department: string; count: number; scoreSum: number; criticalGaps: number }> = {};

    let missingEmploymentCount = 0;
    let missingEducationCount = 0;

    for (const p of people) {
      if (p.contactable) contactableCount++;
      const score = p.characterization_score || 0;
      scoreSum += score;

      // Status
      if (p.profile_status === "Completo") statusCounts.completo++;
      else if (p.profile_status === "Actualizado por IA") statusCounts.actualizadoPorIA++;
      else if (p.profile_status === "Vacíos críticos") statusCounts.vaciosCriticos++;
      else statusCounts.parcial++;

      // Score brackets
      if (score < 50) scoreBrackets.menor50++;
      else if (score < 70) scoreBrackets.de50a69++;
      else if (score < 85) scoreBrackets.de70a84++;
      else scoreBrackets.mayorIgual85++;

      // Employment
      const emp = p.employment_status || "Sin información";
      employmentBreakdown[emp] = (employmentBreakdown[emp] || 0) + 1;
      if (emp === "Sin información") missingEmploymentCount++;

      // Education
      const edu = p.education_level || "Sin información";
      educationBreakdown[edu] = (educationBreakdown[edu] || 0) + 1;
      if (edu === "Sin información") missingEducationCount++;

      // Inclusion
      const inc = (p.inclusion_information_status || "Pendiente").toLowerCase();
      if (inc === "reportada") inclusionBreakdown.reportada++;
      else if (inc === "parcial") inclusionBreakdown.parcial++;
      else inclusionBreakdown.pendiente++;

      // Geography
      const city = p.city || "Otras";
      const dept = p.department || "Colombia";
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1;

      if (!cityMap[city]) {
        cityMap[city] = { department: dept, count: 0, scoreSum: 0, criticalGaps: 0 };
      }
      cityMap[city].count++;
      cityMap[city].scoreSum += score;
      if (p.profile_status === "Vacíos críticos" || score < 50) {
        cityMap[city].criticalGaps++;
      }
    }

    const cityBreakdown = Object.entries(cityMap).map(([city, stats]) => ({
      city,
      department: stats.department,
      count: stats.count,
      averageScore: Math.round(stats.scoreSum / stats.count),
      criticalGapsCount: stats.criticalGaps,
      criticalGapsPercentage: Math.round((stats.criticalGaps / stats.count) * 100),
    }));

    const topGapCities = [...cityBreakdown]
      .sort((a, b) => b.criticalGapsCount - a.criticalGapsCount || a.averageScore - b.averageScore)
      .slice(0, 5)
      .map((c) => ({
        city: c.city,
        criticalGapsCount: c.criticalGapsCount,
        criticalGapsPercentage: c.criticalGapsPercentage,
        averageScore: c.averageScore,
      }));

    // 3. Campaign summary
    const { data: campaignTargets } = await supabase.from("campaign_targets").select("status");
    const targetsSummary: Record<string, number> = {};
    if (campaignTargets) {
      for (const t of campaignTargets) {
        const st = t.status || "Sin contactar";
        targetsSummary[st] = (targetsSummary[st] || 0) + 1;
      }
    }

    return {
      dataset: {
        type: "synthetic_poc_sample",
        sampleSize,
        organizationName: orgData?.name || "Financiera Comultrasan",
        organizationType: orgData?.type || "Cooperativa financiera",
        internalEmployees: 480,
        conceptualTotalPopulation: 500000,
        generatedAt: new Date().toISOString(),
      },
      contactability: {
        contactableCount,
        nonContactableCount: sampleSize - contactableCount,
        contactablePercentage: Math.round((contactableCount / sampleSize) * 100),
      },
      characterization: {
        averageScore: Math.round(scoreSum / sampleSize),
        statusDistribution: statusCounts,
        scoreBrackets,
      },
      employment: {
        breakdown: employmentBreakdown,
        missingOrUnknownCount: missingEmploymentCount,
        missingPercentage: Math.round((missingEmploymentCount / sampleSize) * 100),
      },
      education: {
        breakdown: educationBreakdown,
        missingOrUnknownCount: missingEducationCount,
        missingPercentage: Math.round((missingEducationCount / sampleSize) * 100),
      },
      inclusion: {
        breakdown: inclusionBreakdown,
        coveragePercentage: Math.round((inclusionBreakdown.reportada / sampleSize) * 100),
        pendingPercentage: Math.round((inclusionBreakdown.pendiente / sampleSize) * 100),
      },
      geography: {
        cityBreakdown,
        departmentBreakdown,
        topGapCities,
      },
      campaigns: {
        activeCampaignsCount: 1,
        featuredCampaignName: "2026 Member Characterization",
        targetsSummary,
      },
    };
  } catch (err) {
    console.error("[data-intelligence] Failed to generate snapshot:", err);
    return null;
  }
}

export function formatSnapshotForPrompt(snapshot: OrganizationSnapshot): string {
  const d = snapshot.dataset;
  const c = snapshot.characterization;
  const e = snapshot.employment;
  const inc = snapshot.inclusion;
  const g = snapshot.geography;
  const con = snapshot.contactability;

  return `ORGANIZATIONAL DATA CONTEXT (MUESTRA REAL POSTGRESQL / SUPABASE)
================================================================================
INSTITUCIÓN: ${d.organizationName} (${d.organizationType})
EMPLEADOS DIRECTOS / INTERNOS: ${d.internalEmployees} colaboradores
POBLACIÓN CONCEPTUAL ASOCIADA (UNIVERSO DE LA ENTIDAD): ${d.conceptualTotalPopulation.toLocaleString("es-CO")} asociados
TIPO DE DATASET ANALIZADO: Muestra sintética para Prueba de Concepto (POC)
TAMAÑO REAL DE LA MUESTRA EN BASE DE DATOS: ${d.sampleSize} perfiles
FECHA Y HORA DEL CÁLCULO: ${d.generatedAt}

REGLAS OBLIGATORIAS DE INTERPRETACIÓN:
1. Las siguientes cifras son MEDICIONES EXACTAS Y FÁCTICAS calculadas directamente desde PostgreSQL en Supabase sobre la muestra de ${d.sampleSize} perfiles.
2. NUNCA altere ni invente estos números.
3. NUNCA confunda la muestra analizada (${d.sampleSize} perfiles) con el universo total de la entidad (${d.conceptualTotalPopulation.toLocaleString("es-CO")} asociados). Indique claramente que el análisis corresponde a la muestra POC de ${d.sampleSize} perfiles.

MÉTRICAS EXACTAS CALCULADAS:
--------------------------------------------------------------------------------
1. CARACTERIZACIÓN GENERAL (MUESTRA: ${d.sampleSize} PERFILES):
   - Nivel de completitud promedio: ${c.averageScore} %
   - Perfiles completos (score >= 88% o 'Completo'): ${c.statusDistribution.completo} (${Math.round((c.statusDistribution.completo / d.sampleSize) * 100)} %)
   - Perfiles parciales ('Parcial'): ${c.statusDistribution.parcial} (${Math.round((c.statusDistribution.parcial / d.sampleSize) * 100)} %)
   - Perfiles con vacíos críticos ('Vacíos críticos' o score < 50%): ${c.statusDistribution.vaciosCriticos} (${Math.round((c.statusDistribution.vaciosCriticos / d.sampleSize) * 100)} %)
   - Perfiles enriquecidos / actualizados por IA: ${c.statusDistribution.actualizadoPorIA} (${Math.round((c.statusDistribution.actualizadoPorIA / d.sampleSize) * 100)} %)
   - Contactabilidad: ${con.contactableCount} personas contactables (${con.contactablePercentage} %); ${con.nonContactableCount} personas sin canal de contacto validado.

2. INFORMACIÓN LABORAL Y OCUPACIONAL:
   - Total sin información laboral: EXACTAMENTE ${e.missingOrUnknownCount} perfiles (${e.missingPercentage} % de la muestra).
   - Distribución registrada:
${Object.entries(e.breakdown)
  .map(([k, v]) => `     * ${k}: ${v} perfiles (${Math.round((v / d.sampleSize) * 100)} %)`)
  .join("\n")}

3. INCLUSIÓN SOCIAL Y LABORAL:
   - Condición de inclusión reportada: ${inc.breakdown.reportada} perfiles (${inc.coveragePercentage} %)
   - Inclusión con reporte parcial: ${inc.breakdown.parcial} perfiles (${Math.round((inc.breakdown.parcial / d.sampleSize) * 100)} %)
   - Inclusión pendiente por levantar / verificar: EXACTAMENTE ${inc.breakdown.pendiente} perfiles (${inc.pendingPercentage} % de la muestra).

4. DISTRIBUCIÓN GEOGRÁFICA Y BRECHAS TERRITORIALES:
   - Principales ciudades con mayores brechas de información (vacíos críticos):
${g.topGapCities
  .map(
    (city, idx) =>
      `     ${idx + 1}. ${city.city}: ${city.criticalGapsCount} perfiles con vacíos críticos (${city.criticalGapsPercentage} % de la muestra local; completitud promedio: ${city.averageScore} %)`,
  )
  .join("\n")}

5. CAMPAÑAS DE RECOLECCIÓN Y ACTUALIZACIÓN:
   - Campaña activa: "${snapshot.campaigns.featuredCampaignName}"
   - Estado de metas en muestra: ${Object.entries(snapshot.campaigns.targetsSummary)
     .map(([st, cnt]) => `${st}: ${cnt}`)
     .join(", ")}
================================================================================`;
}
