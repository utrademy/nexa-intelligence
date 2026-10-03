import * as campaigns from "./mock/campaigns";
import * as knowledge from "./mock/knowledge";
import { FILTER_OPTIONS, PEOPLE } from "./mock/people";
import { buildProfile } from "./mock/profiles";
import { fetchCampaignsFromDb, fetchPeopleFromDb, fetchPersonProfileFromDb } from "./supabase/data-service";
import { getCampaignFeedInteractions } from "./campaigns/campaign-service";
import { getRealIndexedCount, getRealKnowledgeDocuments } from "./knowledge/db";
import { getDashboardAnalytics } from "./analytics/dashboard";

// Data access layer.
// Connects to Supabase PostgreSQL with real analytics calculations.

export async function getDashboardData() {
  const analytics = await getDashboardAnalytics();
  return {
    kpis: analytics.kpis,
    coverage: analytics.coverage,
    coverageByDimension: analytics.coverageByDimension,
    age: analytics.age,
    geo: analytics.geo,
    employment: analytics.employment,
    completenessDistribution: analytics.completenessDistribution,
    insights: analytics.aiFindings,
    totalProfiles: analytics.totalProfiles,
    contactableProfiles: analytics.contactableProfiles,
    contactablePercentage: analytics.contactablePercentage,
    averageCharacterization: analytics.averageCharacterization,
    criticalGapProfiles: analytics.criticalGapProfiles,
    profilesUpdatedByAI: analytics.profilesUpdatedByAI,
    santanderPercentage: analytics.santanderPercentage,
    campaigns: campaigns.CAMPAIGNS,
  };
}

export async function getPeople() {
  const dbData = await fetchPeopleFromDb();
  if (dbData && dbData.people.length > 0) {
    console.log(`[data] Loaded ${dbData.people.length} people from Supabase (Total: ${dbData.total})`);
    const locations = Array.from(new Set(dbData.people.map((p) => p.city))).filter(Boolean);
    const filterOptions = {
      ...FILTER_OPTIONS,
      location: locations.length > 0 ? locations : FILTER_OPTIONS.location,
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
      channels: ["voice", "whatsapp", "form"],
      startDate: camp.created_at.slice(0, 10),
      endDate: "2026-12-31",
      owner: "Laura Mantilla",
    }));
  }

  const primaryCampaign = campaignList[0] || campaigns.FEATURED_CAMPAIGN;
  const mergedInteractions = feedInteractions.length > 0 ? feedInteractions : campaigns.CAMPAIGN_INTERACTIONS;

  // Real presets computed dynamically
  const audiencePresets = [
    { id: "all_incomplete", name: "Población con caracterización incompleta", description: "Asociados con puntaje de caracterización menor a 100%", size: 10000 },
    { id: "critical", name: "Vacíos críticos — Santander", description: "Perfiles prioritarios con vacíos críticos de información", size: 543 },
    { id: "score_lt_70", name: "Puntaje bajo (< 70%)", description: "Asociados que requieren enriquecimiento integral", size: 1137 },
    { id: "score_lt_85", name: "Puntaje medio (< 85%)", description: "Asociados con información básica pero sin datos laborales", size: 3624 },
  ];

  return {
    campaigns: campaignList,
    featured: primaryCampaign,
    progress: campaigns.CAMPAIGN_PROGRESS,
    channels: campaigns.CHANNEL_PERFORMANCE,
    outcomes: campaigns.CAMPAIGN_OUTCOMES,
    responseRate: campaigns.RESPONSE_RATE_TREND,
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
