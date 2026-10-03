import * as campaigns from "./mock/campaigns";
import * as knowledge from "./mock/knowledge";
import { FILTER_OPTIONS, PEOPLE } from "./mock/people";
import { buildProfile } from "./mock/profiles";
import { fetchCampaignsFromDb, fetchPeopleFromDb, fetchPersonProfileFromDb } from "./supabase/data-service";
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
  const dbCampaigns = await fetchCampaignsFromDb();
  let campaignList = campaigns.CAMPAIGNS;

  if (dbCampaigns && dbCampaigns.length > 0) {
    const primary = dbCampaigns[0];
    campaignList = [
      {
        id: primary.id,
        name: primary.name,
        objective: primary.description || "Campaña multicanal de actualización de datos sociodemográficos y laborales.",
        status: (primary.status as any) || "Activa",
        audience: primary.audience_count,
        contacted: primary.contacted_count,
        responded: primary.responded_count,
        completed: primary.completed_count,
        channels: ["voice", "whatsapp", "form"],
        startDate: primary.created_at.slice(0, 10),
        endDate: "2026-12-31",
        owner: "Laura Mantilla",
      },
      ...campaigns.CAMPAIGNS.slice(1),
    ];
  }

  return {
    campaigns: campaignList,
    featured: campaigns.FEATURED_CAMPAIGN,
    progress: campaigns.CAMPAIGN_PROGRESS,
    channels: campaigns.CHANNEL_PERFORMANCE,
    outcomes: campaigns.CAMPAIGN_OUTCOMES,
    responseRate: campaigns.RESPONSE_RATE_TREND,
    interactions: campaigns.CAMPAIGN_INTERACTIONS,
    audiencePresets: campaigns.AUDIENCE_PRESETS,
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
