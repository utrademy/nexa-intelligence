import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx !== -1) {
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1).trim();
    process.env[k] = v;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRIMARY_CAMPAIGN_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

// Seeded PRNG for deterministic, high quality distribution
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rand = createRng(20261003);

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomWeighted<T>(items: [T, number][]): T {
  const total = items.reduce((acc, [, w]) => acc + w, 0);
  let r = rand() * total;
  for (const [val, w] of items) {
    if (r <= w) return val;
    r -= w;
  }
  return items[items.length - 1][0];
}

async function seedCampaignData() {
  console.log("=== SEEDING REAL CAMPAIGN DATA IN SUPABASE ===");

  // 1. Fetch people from Supabase across pages
  console.log("1. Fetching people candidates across pages...");
  const p1 = supabase.from("people").select("id, first_name, last_name, city, characterization_score").range(0, 999);
  const p2 = supabase.from("people").select("id, first_name, last_name, city, characterization_score").range(1000, 1999);
  const p3 = supabase.from("people").select("id, first_name, last_name, city, characterization_score").range(2000, 2999);

  const [res1, res2, res3] = await Promise.all([p1, p2, p3]);
  const people = [...(res1.data || []), ...(res2.data || []), ...(res3.data || [])];

  if (people.length === 0) {
    throw new Error(`Failed to fetch people`);
  }
  console.log(`Found ${people.length} people for campaign targeting.`);

  // 2. Clear old targets for primary campaign
  console.log("2. Cleaning old targets for primary campaign...");
  const { error: delErr } = await supabase
    .from("campaign_targets")
    .delete()
    .eq("campaign_id", PRIMARY_CAMPAIGN_ID);

  if (delErr) {
    console.warn("Delete error (might be empty):", delErr.message);
  }

  // 3. Build rich target rows spanning Sep 8 to Oct 2, 2026
  console.log("3. Generating realistic target progression...");

  // 9 Checkpoint days
  const checkDates = [
    new Date("2026-09-08T10:00:00Z"),
    new Date("2026-09-11T11:00:00Z"),
    new Date("2026-09-14T12:00:00Z"),
    new Date("2026-09-17T13:00:00Z"),
    new Date("2026-09-20T14:00:00Z"),
    new Date("2026-09-23T15:00:00Z"),
    new Date("2026-09-26T16:00:00Z"),
    new Date("2026-09-29T17:00:00Z"),
    new Date("2026-10-02T16:30:00Z"),
  ];

  // Target counts to assign across checkpoints (cumulative contacted reaching ~2,100)
  // Increments per checkpoint: [160, 240, 250, 260, 250, 260, 250, 240, 210] = 2,120 contacted
  // Plus 580 "Sin contactar" = 2,700 total targets
  const increments = [160, 240, 250, 260, 250, 260, 250, 240, 210];

  const targetRows: any[] = [];
  let personIdx = 0;

  for (let step = 0; step < checkDates.length; step++) {
    const baseDate = checkDates[step];
    const count = increments[step];

    for (let i = 0; i < count && personIdx < people.length; i++) {
      const p = people[personIdx++];
      
      // Channel: 40% whatsapp, 38% voice, 14% form, 8% sms
      const channel = randomWeighted([
        ["whatsapp", 40],
        ["voice", 38],
        ["form", 14],
        ["sms", 8],
      ]);

      // Status for contacted targets:
      // ~58% Completado, ~16% Respondió, ~12% En progreso, ~8% Sin respuesta, ~4% No desea participar, ~2% Requiere revisión
      const status = randomWeighted([
        ["Completado", 58],
        ["Respondió", 16],
        ["En progreso", 12],
        ["Sin respuesta", 8],
        ["No desea participar", 4],
        ["Requiere revisión", 2],
      ]);

      // Random jitter on timestamp within 1-2 days before baseDate
      const jitterHours = Math.floor(rand() * 48);
      const createdAt = new Date(baseDate.getTime() - jitterHours * 3600 * 1000).toISOString();

      targetRows.push({
        campaign_id: PRIMARY_CAMPAIGN_ID,
        person_id: p.id,
        channel,
        status,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }
  }

  // Add 580 "Sin contactar" targets in queue
  for (let i = 0; i < 580 && personIdx < people.length; i++) {
    const p = people[personIdx++];
    const channel = randomWeighted([
      ["voice", 40],
      ["whatsapp", 35],
      ["form", 15],
      ["sms", 10],
    ]);
    const createdAt = new Date("2026-10-02T18:00:00Z").toISOString();
    targetRows.push({
      campaign_id: PRIMARY_CAMPAIGN_ID,
      person_id: p.id,
      channel,
      status: "Sin contactar",
      created_at: createdAt,
      updated_at: createdAt,
    });
  }

  console.log(`Prepared ${targetRows.length} target rows to insert.`);

  // Insert in batches of 400
  const BATCH_SIZE = 400;
  for (let i = 0; i < targetRows.length; i += BATCH_SIZE) {
    const chunk = targetRows.slice(i, i + BATCH_SIZE);
    const { error: insErr } = await supabase.from("campaign_targets").insert(chunk);
    if (insErr) {
      throw new Error(`Batch insert error at ${i}: ${insErr.message}`);
    }
    console.log(`  Inserted batch ${i + 1} - ${Math.min(i + BATCH_SIZE, targetRows.length)}`);
  }

  // 4. Calculate exact resulting metrics
  const contactedTargets = targetRows.filter((t) => t.status !== "Sin contactar");
  const respondedTargets = targetRows.filter((t) => t.status === "Respondió" || t.status === "Completado");
  const completedTargets = targetRows.filter((t) => t.status === "Completado");

  const contactedCount = contactedTargets.length;
  const respondedCount = respondedTargets.length;
  const completedCount = completedTargets.length;

  console.log(`\nMetrics Summary for Campaign 1:`);
  console.log(`  Total targets: ${targetRows.length}`);
  console.log(`  Contacted: ${contactedCount}`);
  console.log(`  Responded: ${respondedCount}`);
  console.log(`  Completed: ${completedCount}`);

  // 5. Update campaigns table row
  console.log("5. Updating campaigns row in Supabase...");
  const { error: upErr } = await supabase
    .from("campaigns")
    .update({
      name: "Caracterización de Asociados 2026",
      description: "Campaña multicanal de actualización de datos sociodemográficos y laborales con IA.",
      status: "Activa",
      audience_count: 10000,
      contacted_count: contactedCount,
      responded_count: respondedCount,
      completed_count: completedCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", PRIMARY_CAMPAIGN_ID);

  if (upErr) {
    throw new Error(`Failed to update campaign: ${upErr.message}`);
  }

  // 6. Enrich interactions table with 80 rich recent interactions
  console.log("6. Enriching interactions table for primary campaign...");
  // Clear old primary campaign interactions
  await supabase.from("interactions").delete().eq("campaign_id", PRIMARY_CAMPAIGN_ID);

  const sampleTargets = contactedTargets.slice(0, 85);
  const interactionRows: any[] = [];

  const callSummaries = [
    "Llamada con IA — Caracterización completada exitosamente. Se actualizaron datos de ocupación, tipo de contrato y rango salarial.",
    "Llamada con IA — Asociado confirmó situación laboral actual como empleado formal y nivel educativo profesional.",
    "Llamada con IA — Asociado no contestó la llamada después de 4 timbres. Reintentar en horario vespertino.",
    "Llamada con IA — Asociado manifestó no tener tiempo disponible en el momento. Reagendado para mañana.",
    "Llamada con IA — Se recolectó información básica de vivienda y personas a cargo con consentimiento expreso.",
    "Llamada con IA — Asociado ejerció derecho de desistimiento bajo Ley 1581 de 2012.",
  ];

  const waSummaries = [
    "Conversación WhatsApp — Formulario interactivo diligenciado. 15 campos socioeconómicos confirmados.",
    "Conversación WhatsApp — Asociado actualizó dirección de correspondencia y correo electrónico verificado.",
    "Conversación WhatsApp — Mensaje entregado y leído. Asociado inició el flujo de actualización con IA.",
    "Conversación WhatsApp — Asociado solicitó enlace seguro para diligenciar desde computador.",
  ];

  const formSummaries = [
    "Formulario web seguro — Registro completo de ingresos mensuales y actividad económica principal.",
    "Formulario web seguro — Validación de datos familiares y metas de ahorro del asociado.",
  ];

  for (let idx = 0; idx < sampleTargets.length; idx++) {
    const t = sampleTargets[idx];
    const ch = t.channel;
    const isCompleted = t.status === "Completado";
    const isOptOut = t.status === "No desea participar";
    const isFailed = t.status === "Sin respuesta";

    let summary = "";
    if (ch === "voice") {
      summary = isCompleted
        ? randomChoice(callSummaries.slice(0, 2))
        : isFailed
        ? callSummaries[2]
        : isOptOut
        ? callSummaries[5]
        : callSummaries[3];
    } else if (ch === "whatsapp") {
      summary = isCompleted ? randomChoice(waSummaries.slice(0, 2)) : randomChoice(waSummaries.slice(2));
    } else {
      summary = randomChoice(formSummaries);
    }

    const fieldsCount = isCompleted ? Math.floor(14 + rand() * 4) : isFailed ? 0 : Math.floor(2 + rand() * 6);
    const channelEnum = ch === "voice" ? "VOICE" : ch === "whatsapp" ? "WHATSAPP" : ch === "sms" ? "SMS" : "WEB";

    interactionRows.push({
      organization_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      campaign_id: PRIMARY_CAMPAIGN_ID,
      person_id: t.person_id,
      channel: channelEnum,
      direction: "OUTBOUND",
      status: isCompleted ? "COMPLETED" : isFailed ? "FAILED" : "IN_PROGRESS",
      summary,
      structured_data: {
        fields_updated: isCompleted ? ["employment_status", "occupation", "education_level", "income_bracket"] : ["phone_verified"],
        consent_status: isOptOut ? "Denegada" : "Otorgada",
        characterization_delta: isCompleted ? "+25%" : "+5%",
      },
      ai_generated: true,
      created_at: t.created_at,
    });
  }

  const { error: interInsErr } = await supabase.from("interactions").insert(interactionRows);
  if (interInsErr) {
    console.warn("Error inserting interactions:", interInsErr.message);
  } else {
    console.log(`Inserted ${interactionRows.length} rich interactions.`);
  }

  console.log("\n=== SEEDING COMPLETED SUCCESSFULLY ===");
}

seedCampaignData().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
