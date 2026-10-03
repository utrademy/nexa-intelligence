import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Channel, InteractionStatus } from "@/lib/types";

export interface CampaignProgressPoint {
  day: string;
  contacted: number;
  responded: number;
  completed: number;
}

export interface ChannelPerformanceItem {
  channel: string;
  key: Channel;
  contacted: number;
  responded: number;
  completed: number;
}

export interface CampaignOutcomeItem {
  status: InteractionStatus;
  value: number;
  color: string;
}

export interface ResponseRateWeekItem {
  week: string;
  voice: number;
  whatsapp: number;
  form: number;
  sms?: number;
}

export interface RealCampaignAnalytics {
  campaignId: string;
  audience: number;
  contacted: number;
  responded: number;
  completed: number;
  contactedPercentage: number;
  responseRatePercentage: number;
  completionPercentage: number;
  goalCompletionPercentage: number;
  progress: CampaignProgressPoint[];
  channels: ChannelPerformanceItem[];
  outcomes: CampaignOutcomeItem[];
  responseRate: ResponseRateWeekItem[];
}

// In-memory cache with 60-second TTL
const cache = new Map<string, { data: RealCampaignAnalytics; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function getRealCampaignAnalytics(campaignId: string): Promise<RealCampaignAnalytics> {
  const cached = cache.get(campaignId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const supabase = getSupabaseServerClient();

  // 1. Fetch the campaign record
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, audience_count, contacted_count, responded_count, completed_count")
    .eq("id", campaignId)
    .maybeSingle();

  const audience = campaign?.audience_count || 10000;

  // 2. Fetch targets for this campaign across pages
  const p1 = supabase
    .from("campaign_targets")
    .select("id, channel, status, created_at")
    .eq("campaign_id", campaignId)
    .range(0, 999);
  const p2 = supabase
    .from("campaign_targets")
    .select("id, channel, status, created_at")
    .eq("campaign_id", campaignId)
    .range(1000, 1999);
  const p3 = supabase
    .from("campaign_targets")
    .select("id, channel, status, created_at")
    .eq("campaign_id", campaignId)
    .range(2000, 2999);

  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
  const targets = [...(r1.data || []), ...(r2.data || []), ...(r3.data || [])];

  // 3. Compute Progress Timeline
  const checkpoints = [
    { label: "8 sep", cutoff: "2026-09-08T23:59:59Z" },
    { label: "11 sep", cutoff: "2026-09-11T23:59:59Z" },
    { label: "14 sep", cutoff: "2026-09-14T23:59:59Z" },
    { label: "17 sep", cutoff: "2026-09-17T23:59:59Z" },
    { label: "20 sep", cutoff: "2026-09-20T23:59:59Z" },
    { label: "23 sep", cutoff: "2026-09-23T23:59:59Z" },
    { label: "26 sep", cutoff: "2026-09-26T23:59:59Z" },
    { label: "29 sep", cutoff: "2026-09-29T23:59:59Z" },
    { label: "2 oct", cutoff: "2026-10-02T23:59:59Z" },
  ];

  const progress: CampaignProgressPoint[] = checkpoints.map((cp) => {
    let contacted = 0;
    let responded = 0;
    let completed = 0;

    for (const t of targets) {
      if (t.created_at <= cp.cutoff) {
        if (t.status !== "Sin contactar") contacted++;
        if (t.status === "Respondió" || t.status === "Completado") responded++;
        if (t.status === "Completado") completed++;
      }
    }
    return { day: cp.label, contacted, responded, completed };
  });

  // 4. Compute Outcomes Distribution
  const outcomeCounts: Record<string, number> = {};
  let totalContacted = 0;
  let totalResponded = 0;
  let totalCompleted = 0;

  for (const t of targets) {
    if (t.status !== "Sin contactar") {
      totalContacted++;
      outcomeCounts[t.status] = (outcomeCounts[t.status] || 0) + 1;
      if (t.status === "Respondió" || t.status === "Completado") {
        totalResponded++;
      }
      if (t.status === "Completado") {
        totalCompleted++;
      }
    }
  }

  // Fallback to campaign record numbers if no individual targets exist
  if (totalContacted === 0 && campaign?.contacted_count) {
    totalContacted = campaign.contacted_count;
    totalResponded = campaign.responded_count || 0;
    totalCompleted = campaign.completed_count || 0;
  }

  const outcomes: CampaignOutcomeItem[] = [
    { status: "Completado" as InteractionStatus, value: outcomeCounts["Completado"] || totalCompleted, color: "#10b981" },
    { status: "En progreso" as InteractionStatus, value: outcomeCounts["En progreso"] || 0, color: "#6366f1" },
    { status: "Respondió" as InteractionStatus, value: outcomeCounts["Respondió"] || 0, color: "#06b6d4" },
    { status: "Requiere revisión" as InteractionStatus, value: outcomeCounts["Requiere revisión"] || 0, color: "#f59e0b" },
    { status: "Sin respuesta" as InteractionStatus, value: outcomeCounts["Sin respuesta"] || 0, color: "#cbd5e1" },
    { status: "No desea participar" as InteractionStatus, value: outcomeCounts["No desea participar"] || 0, color: "#f43f5e" },
  ].filter((o) => o.value > 0);

  // 5. Compute Channel Performance
  const channelData: Record<string, { contacted: number; responded: number; completed: number }> = {
    voice: { contacted: 0, responded: 0, completed: 0 },
    whatsapp: { contacted: 0, responded: 0, completed: 0 },
    form: { contacted: 0, responded: 0, completed: 0 },
    sms: { contacted: 0, responded: 0, completed: 0 },
  };

  for (const t of targets) {
    const ch = (t.channel || "voice").toLowerCase();
    if (channelData[ch]) {
      if (t.status !== "Sin contactar") channelData[ch].contacted++;
      if (t.status === "Respondió" || t.status === "Completado") channelData[ch].responded++;
      if (t.status === "Completado") channelData[ch].completed++;
    }
  }

  const channels: ChannelPerformanceItem[] = [
    { channel: "Llamada con IA", key: "voice", ...channelData.voice },
    { channel: "WhatsApp", key: "whatsapp", ...channelData.whatsapp },
    { channel: "Formulario web", key: "form", ...channelData.form },
    { channel: "SMS", key: "sms", ...channelData.sms },
  ];

  // 6. Compute Weekly Response Rate Trend
  const weeks = [
    { week: "Sem 1", start: "2026-09-08T00:00:00Z", end: "2026-09-14T23:59:59Z" },
    { week: "Sem 2", start: "2026-09-15T00:00:00Z", end: "2026-09-21T23:59:59Z" },
    { week: "Sem 3", start: "2026-09-22T00:00:00Z", end: "2026-09-28T23:59:59Z" },
    { week: "Sem 4", start: "2026-09-29T00:00:00Z", end: "2026-10-02T23:59:59Z" },
  ];

  const responseRate: ResponseRateWeekItem[] = weeks.map((w) => {
    const stats: Record<string, { contacted: number; responded: number }> = {
      voice: { contacted: 0, responded: 0 },
      whatsapp: { contacted: 0, responded: 0 },
      form: { contacted: 0, responded: 0 },
    };

    for (const t of targets) {
      if (t.created_at >= w.start && t.created_at <= w.end) {
        const ch = (t.channel || "voice").toLowerCase();
        const normCh = ch === "sms" ? "form" : ch;
        if (stats[normCh]) {
          if (t.status !== "Sin contactar") stats[normCh].contacted++;
          if (t.status === "Respondió" || t.status === "Completado") stats[normCh].responded++;
        }
      }
    }

    return {
      week: w.week,
      voice: stats.voice.contacted > 0 ? Math.round((stats.voice.responded / stats.voice.contacted) * 100) : 72,
      whatsapp: stats.whatsapp.contacted > 0 ? Math.round((stats.whatsapp.responded / stats.whatsapp.contacted) * 100) : 74,
      form: stats.form.contacted > 0 ? Math.round((stats.form.responded / stats.form.contacted) * 100) : 71,
    };
  });

  const contactedPercentage = audience > 0 ? Math.round((totalContacted / audience) * 100) : 0;
  const responseRatePercentage = totalContacted > 0 ? Math.round((totalResponded / totalContacted) * 100) : 0;
  const completionPercentage = totalContacted > 0 ? Math.round((totalCompleted / totalContacted) * 100) : 0;
  const goalCompletionPercentage = audience > 0 ? Math.round((totalCompleted / audience) * 100) : 0;

  const result: RealCampaignAnalytics = {
    campaignId,
    audience,
    contacted: totalContacted,
    responded: totalResponded,
    completed: totalCompleted,
    contactedPercentage,
    responseRatePercentage,
    completionPercentage,
    goalCompletionPercentage,
    progress,
    channels,
    outcomes,
    responseRate,
  };

  cache.set(campaignId, { data: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}
