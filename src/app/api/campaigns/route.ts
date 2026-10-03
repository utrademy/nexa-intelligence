import { NextResponse } from "next/server";
import { getRealSegmentCount, createRealCampaign } from "@/lib/campaigns/campaign-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const incompletenessFilter = searchParams.get("incompletenessFilter") as any;
    const city = searchParams.get("city") || undefined;
    const employmentStatus = searchParams.get("employmentStatus") || undefined;
    const educationLevel = searchParams.get("educationLevel") || undefined;
    const missingField = searchParams.get("missingField") || undefined;

    const count = await getRealSegmentCount({
      incompletenessFilter,
      city,
      employmentStatus,
      educationLevel,
      missingField,
    });

    return NextResponse.json({ count });
  } catch (err: any) {
    console.error("[api/campaigns] Error calculating count:", err);
    return NextResponse.json({ error: err.message || "Error al calcular audiencia" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, channel = "voice", filters } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "El nombre de la campaña es obligatorio" }, { status: 400 });
    }

    const result = await createRealCampaign({
      name: name.trim(),
      description: description || "Campaña de caracterización con IA",
      channel,
      filters: filters || {},
    });

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      audienceCount: result.audienceCount,
    });
  } catch (err: any) {
    console.error("[api/campaigns] Error creating campaign:", err);
    return NextResponse.json({ error: err.message || "Error al crear la campaña" }, { status: 500 });
  }
}
