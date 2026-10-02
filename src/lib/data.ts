import * as campaigns from "./mock/campaigns";
import * as dashboard from "./mock/dashboard";
import * as knowledge from "./mock/knowledge";
import { FILTER_OPTIONS, PEOPLE, TOTAL_POPULATION } from "./mock/people";
import { buildProfile } from "./mock/profiles";
import { fetchCampaignsFromDb, fetchPeopleFromDb, fetchPersonProfileFromDb } from "./supabase/data-service";

// Data access layer.
// Connects to Supabase PostgreSQL with seamless fallback to mock data
// if the database has not yet been initialized or credentials are missing.

export async function getDashboardData() {
  return {
    kpis: dashboard.DASHBOARD_KPIS,
    coverage: dashboard.COVERAGE_BREAKDOWN,
    coverageByDimension: dashboard.COVERAGE_BY_DIMENSION,
    age: dashboard.AGE_DISTRIBUTION,
    geo: dashboard.GEO_DISTRIBUTION,
    employment: dashboard.EMPLOYMENT_DISTRIBUTION,
    trend: dashboard.COMPLETENESS_TREND,
    insights: dashboard.AI_INSIGHTS,
    campaigns: campaigns.CAMPAIGNS,
  };
}

export async function getPeople() {
  const dbData = await fetchPeopleFromDb();
  if (dbData && dbData.people.length > 0) {
    console.log(`[data] Loaded ${dbData.people.length} people from Supabase`);
    const locations = Array.from(new Set(dbData.people.map((p) => p.city))).filter(Boolean);
    const filterOptions = {
      ...FILTER_OPTIONS,
      location: locations.length > 0 ? locations : FILTER_OPTIONS.location,
    };
    return {
      people: dbData.people,
      total: TOTAL_POPULATION,
      filterOptions,
      fromDatabase: true,
    };
  }

  console.warn("[data] Fallback: using mock people because Supabase returned no data");
  return {
    people: PEOPLE,
    total: TOTAL_POPULATION,
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
  return { areas: knowledge.KNOWLEDGE_AREAS, documents: knowledge.KNOWLEDGE_DOCUMENTS };
}
