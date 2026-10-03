import * as campaigns from "./mock/campaigns";
import * as knowledge from "./mock/knowledge";
import { FILTER_OPTIONS, PEOPLE } from "./mock/people";
import { buildProfile } from "./mock/profiles";
import type { Channel } from "./types";
import { fetchCampaignsFromDb, fetchPeopleFromDb, fetchPersonProfileFromDb } from "./supabase/data-service";
import { getRealCampaignAnalytics } from "./analytics/campaign-analytics";
import { getCampaignFeedInteractions, getRealSegmentCount } from "./campaigns/campaign-service";
import { getRealIndexedCount, getRealKnowledgeDocuments } from "./knowledge/db";
import { getDashboardAnalytics } from "./analytics/dashboard";

// Data access layer.
// Connects to Supabase PostgreSQL with real analytics calculations.

export async function getDashboardData() {
  const [analytics, dbCampaigns] = await Promise.all([
    getDashboardAnalytics(),
    fetchCampaignsFromDb(),
  ]);

  let campaignList: typeof campaigns.CAMPAIGNS = campaigns.CAMPAIGNS;
  if (dbCampaigns && dbCampaigns.length > 0) {
    campaignList = dbCampaigns
      .map((camp) => ({
        id: camp.id,
        name: camp.name,
        objective: camp.description || "Campaña de caracterización de población con IA.",
        status: (camp.status as any) || "Activa",
        audience: camp.audience_count,
        contacted: camp.contacted_count,
        responded: camp.responded_count,
        completed: camp.completed_count,
        channels: ["voice", "whatsapp", "form"] as Channel[],
        startDate: camp.created_at.slice(0, 10),
        endDate: "2026-12-31",
        owner: "Laura Mantilla",
      }))
      .sort((a, b) => (b.contacted || 0) - (a.contacted || 0));
  }

  return {
    kpis: analytics.kpis,
    coverage: analytics.coverage,
    coverageByDimension: analytics.coverageByDimension,
    age: analytics.age,
    geo: analytics.geo,
    employment: analytics.employment,
    education: analytics.education,
    segments: analytics.segments,
    missingFields: analytics.missingFields,
    inclusionStats: analytics.inclusionStats,
    completenessDistribution: analytics.completenessDistribution,
    insights: analytics.aiFindings,
    totalProfiles: analytics.totalProfiles,
    contactableProfiles: analytics.contactableProfiles,
    contactablePercentage: analytics.contactablePercentage,
    averageCharacterization: analytics.averageCharacterization,
    completeProfiles: analytics.completeProfiles,
    completePercentage: analytics.completePercentage,
    pendingProfiles: analytics.pendingProfiles,
    pendingPercentage: analytics.pendingPercentage,
    criticalGapProfiles: analytics.criticalGapProfiles,
    criticalGapsPercentage: analytics.criticalGapsPercentage,
    profilesUpdatedByAI: analytics.profilesUpdatedByAI,
    santanderPercentage: analytics.santanderPercentage,
    campaigns: campaignList,
  };
}

export async function getPeople() {
  const dbData = await fetchPeopleFromDb();
  if (dbData && dbData.people.length > 0) {
    console.log(`[data] Loaded ${dbData.people.length} people from Supabase (Total: ${dbData.total})`);
    const getUnique = (arr: (string | undefined | null)[], fallback: readonly string[]) => {
      const unique = Array.from(new Set(arr.filter((v): v is string => Boolean(v && v.trim()))));
      return unique.length > 0 ? unique : Array.from(fallback);
    };

    const filterOptions = {
      ...FILTER_OPTIONS,
      location: getUnique(dbData.people.map((p) => p.city), FILTER_OPTIONS.location),
      employment: getUnique(dbData.people.map((p) => p.employment), FILTER_OPTIONS.employment),
      education: getUnique(dbData.people.map((p) => p.education), FILTER_OPTIONS.education),
      profileStatus: getUnique(dbData.people.map((p) => p.profileStatus), FILTER_OPTIONS.profileStatus),
      inclusion: getUnique(dbData.people.map((p) => p.inclusion), FILTER_OPTIONS.inclusion),
      campaignStatus: getUnique(dbData.people.map((p) => p.campaignStatus), FILTER_OPTIONS.campaignStatus),
    };
    return {
      people: dbData.people,
      total: dbData.total,
      filterOptions,
      fromDatabase: true,
    };
  }

  console.warn("[data] Fallback: using mock people because Supabase returned no data");
  return {
    people: PEOPLE,
    total: PEOPLE.length,
    filterOptions: FILTER_OPTIONS,
    fromDatabase: false,
  };
}

export async function getPersonProfile(id: string) {
  const dbProfile = await fetchPersonProfileFromDb(id);
  if (dbProfile) {
    console.log(`[data] Loaded profile for ${dbProfile.person.fullName} (${id}) from Supabase`);
    return dbProfile;
  }
  console.warn(`[data] Fallback: profile ${id} loaded from mock`);
  const person = PEOPLE.find((p) => p.id === id);
  return person ? buildProfile(person) : null;
}

export async function getCampaignData() {
  const [dbCampaigns, feedInteractions] = await Promise.all([
    fetchCampaignsFromDb(),
    getCampaignFeedInteractions(50),
  ]);

  let campaignList: typeof campaigns.CAMPAIGNS = campaigns.CAMPAIGNS;

  if (dbCampaigns && dbCampaigns.length > 0) {
    campaignList = dbCampaigns.map((camp) => ({
      id: camp.id,
      name: camp.name,
      objective: camp.description || "Campaña de caracterización de población con IA.",
      status: (camp.status as any) || "Activa",
      audience: camp.audience_count,
      contacted: camp.contacted_count,
      responded: camp.responded_count,
      completed: camp.completed_count,
      channels: ["voice", "whatsapp", "form"] as Channel[],
      startDate: camp.created_at.slice(0, 10),
      endDate: "2026-12-31",
      owner: "Laura Mantilla",
    }));
  }

  // The primary organizational campaign is the main active population campaign
  const primaryCampaign =
    campaignList.find((c) => c.id === "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22") ||
    campaignList.find((c) => (c.contacted || 0) > 0) ||
    campaignList[0] ||
    campaigns.FEATURED_CAMPAIGN;

  const mergedInteractions = feedInteractions.length > 0 ? feedInteractions : campaigns.CAMPAIGN_INTERACTIONS;

  // Real campaign analytics and presets computed dynamically from live database
  const [campaignAnalytics, sizeAll, sizeCritical, sizeLt70, sizeLt85] = await Promise.all([
    getRealCampaignAnalytics(primaryCampaign.id),
    getRealSegmentCount({ incompletenessFilter: "all_incomplete" }),
    getRealSegmentCount({ incompletenessFilter: "critical_gaps" }),
    getRealSegmentCount({ incompletenessFilter: "score_lt_70" }),
    getRealSegmentCount({ incompletenessFilter: "score_lt_85" }),
  ]);

  const audiencePresets = [
    { id: "all_incomplete", name: "Población con caracterización incompleta", description: "Asociados con puntaje de caracterización menor a 100%", size: sizeAll },
    { id: "critical", name: "Vacíos críticos — Santander", description: "Perfiles prioritarios con vacíos críticos de información", size: sizeCritical },
    { id: "score_lt_70", name: "Puntaje bajo (< 70%)", description: "Asociados que requieren enriquecimiento integral", size: sizeLt70 },
    { id: "score_lt_85", name: "Puntaje medio (< 85%)", description: "Asociados con información básica pero sin datos laborales", size: sizeLt85 },
  ];

  const featuredCampaign = {
    ...primaryCampaign,
    audience: campaignAnalytics.audience,
    contacted: campaignAnalytics.contacted,
    responded: campaignAnalytics.responded,
    completed: campaignAnalytics.completed,
  };

  const finalCampaignList = [
    featuredCampaign,
    ...campaignList.filter((c) => c.id !== featuredCampaign.id),
  ];

  return {
    campaigns: finalCampaignList,
    featured: featuredCampaign,
    progress: campaignAnalytics.progress,
    channels: campaignAnalytics.channels,
    outcomes: campaignAnalytics.outcomes,
    responseRate: campaignAnalytics.responseRate,
    interactions: mergedInteractions,
    audiencePresets,
    collectableFields: campaigns.COLLECTABLE_FIELDS,
  };
}

export async function getKnowledgeData() {
  const [realDocs, realCount] = await Promise.all([
    getRealKnowledgeDocuments(),
    getRealIndexedCount(),
  ]);

  // Real document counts and coverage per architectural knowledge area
  const areas = knowledge.KNOWLEDGE_AREAS.map((a) => {
    const areaDocs = realDocs.filter((d) => d.area === a.id && d.status === "Indexado");
    const count = areaDocs.length;
    return {
      ...a,
      documents: count,
      coverage: count > 0 ? 100 : 0,
      lastUpdated: areaDocs[0]?.lastUpdated || "2026-10-02",
    };
  });

  return {
    areas,
    documents: realDocs, // Exclusively real documents that exist in Supabase PostgreSQL
    realIndexedCount: realCount,
  };
}
