import * as campaigns from "./mock/campaigns";
import * as dashboard from "./mock/dashboard";
import * as knowledge from "./mock/knowledge";
import { FILTER_OPTIONS, PEOPLE, TOTAL_POPULATION } from "./mock/people";
import { buildProfile } from "./mock/profiles";

// Data access layer. Every function is async so mocks can be replaced
// with Supabase / API calls without changing the pages that consume them.

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
  return { people: PEOPLE, total: TOTAL_POPULATION, filterOptions: FILTER_OPTIONS };
}

export async function getPersonProfile(id: string) {
  const person = PEOPLE.find((p) => p.id === id);
  return person ? buildProfile(person) : null;
}

export async function getCampaignData() {
  return {
    campaigns: campaigns.CAMPAIGNS,
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
