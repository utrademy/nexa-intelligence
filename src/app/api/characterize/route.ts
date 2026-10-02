import { getSupabaseServerClient } from "@/lib/supabase/server";

interface CharacterizePayload {
  personId: string;
  score: number;
  channel: string;
  fields?: {
    category: string;
    key: string;
    value: string;
    confidence?: number;
  }[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CharacterizePayload;
    const { personId, score, channel, fields } = body;

    if (!personId || typeof score !== "number") {
      return Response.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 1. Update person record in Supabase
    const { data: personData, error: personError } = await supabase
      .from("people")
      .update({
        characterization_score: score,
        profile_status: "Actualizado por IA",
        updated_at: new Date().toISOString(),
      })
      .eq("id", personId)
      .select("id, organization_id")
      .single();

    if (personError) {
      console.warn("[characterize] Could not update person in DB (might be in fallback mode):", personError.message);
      // Still return success for client responsiveness
      return Response.json({ success: true, persisted: false });
    }

    const orgId = personData?.organization_id;

    // 2. Persist updated attributes if provided
    if (fields && fields.length > 0) {
      const rows = fields.map((f) => ({
        person_id: personId,
        category: f.category,
        attribute_key: f.key,
        attribute_value: f.value,
        source: "AI_DEMO",
        confidence: f.confidence ?? 0.92,
        verified: true,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("person_attributes").upsert(rows, { onConflict: "person_id, attribute_key" });
    }

    // 3. Insert interaction record
    if (orgId) {
      await supabase.from("interactions").insert({
        organization_id: orgId,
        person_id: personId,
        channel: channel.toUpperCase(),
        direction: "OUTBOUND",
        status: "COMPLETED",
        summary: `Caracterización completada mediante canal ${channel}. Datos recopilados y verificados.`,
        ai_generated: true,
      });
    }

    return Response.json({ success: true, persisted: true });
  } catch (err) {
    console.error("[characterize] API error:", err);
    return Response.json({ error: "Error interno al persistir actualización" }, { status: 500 });
  }
}
