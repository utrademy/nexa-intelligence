import { NextResponse } from "next/server";
import { getRealSegmentPreview } from "@/lib/campaigns/campaign-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const incompletenessFilter = searchParams.get("incompletenessFilter") as any;
    const city = searchParams.get("city") || undefined;
    const employmentStatus = searchParams.get("employmentStatus") || undefined;
    const educationLevel = searchParams.get("educationLevel") || undefined;
    const missingField = searchParams.get("missingField") || undefined;
    const limit = Number(searchParams.get("limit")) || 10;

    const people = await getRealSegmentPreview(
      {
        incompletenessFilter,
        city,
        employmentStatus,
        educationLevel,
        missingField,
      },
      limit,
    );

    return NextResponse.json({ people });
  } catch (err: any) {
    console.error("[api/campaigns/preview] Error fetching preview:", err);
    return NextResponse.json({ error: err.message || "Error al previsualizar asociados" }, { status: 500 });
  }
}
