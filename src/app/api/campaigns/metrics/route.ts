import { NextResponse } from "next/server";
import { getCampaignExecutionMetrics } from "@/lib/campaigns/campaign-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId requerido" }, { status: 400 });
    }

    const data = await getCampaignExecutionMetrics(campaignId);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[api/campaigns/metrics] Error fetching metrics:", err);
    return NextResponse.json({ error: err.message || "Error al consultar métricas" }, { status: 500 });
  }
}
