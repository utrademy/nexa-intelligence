import { NextResponse } from "next/server";
import { getRealCampaignAnalytics } from "@/lib/analytics/campaign-analytics";
import { getCampaignFeedInteractions } from "@/lib/campaigns/campaign-service";
import { fetchCampaignsFromDb } from "@/lib/supabase/data-service";
import type { Channel } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId requerido" }, { status: 400 });
    }

    const [analytics, interactions, dbCampaigns] = await Promise.all([
      getRealCampaignAnalytics(campaignId),
      getCampaignFeedInteractions(50, campaignId),
      fetchCampaignsFromDb(),
    ]);

    const targetDb = (dbCampaigns || []).find((c) => c.id === campaignId);
    const campaign = targetDb
      ? {
          id: targetDb.id,
          name: targetDb.name,
          objective: targetDb.description || "Campaña de caracterización de población con IA.",
          status: (targetDb.status as any) || "Activa",
          audience: analytics.audience,
          contacted: analytics.contacted,
          responded: analytics.responded,
          completed: analytics.completed,
          channels: ["voice", "whatsapp", "form"] as Channel[],
          startDate: targetDb.created_at ? targetDb.created_at.slice(0, 10) : "2026-10-01",
          endDate: "2026-12-31",
          owner: "Laura Mantilla",
        }
      : null;

    return NextResponse.json({
      analytics,
      interactions,
      campaign,
    });
  } catch (err: any) {
    console.error("[api/campaigns/analytics] Error fetching campaign analytics:", err);
    return NextResponse.json(
      { error: err?.message || "Error al obtener analítica de la campaña" },
      { status: 500 },
    );
  }
}
