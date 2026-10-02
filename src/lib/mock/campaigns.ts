import type { AiCampaign, CampaignInteraction, Channel, InteractionStatus } from "@/lib/types";
import { PEOPLE } from "./people";
import { createRng } from "./random";

export const CAMPAIGNS: AiCampaign[] = [
  {
    id: "cmp-2026-char",
    name: "Caracterización de Asociados 2026",
    objective: "Completar información laboral, del hogar y de inclusión de asociados priorizados.",
    status: "Activa",
    audience: 2500,
    contacted: 1874,
    responded: 1302,
    completed: 1085,
    channels: ["voice", "whatsapp", "form"],
    startDate: "2026-09-08",
    endDate: "2026-10-31",
    owner: "Laura Mantilla",
  },
  {
    id: "cmp-micro",
    name: "Actualización de ingresos — Microempresarios",
    objective: "Actualizar rango de ingresos y actividad económica de titulares de microcrédito.",
    status: "Activa",
    audience: 4200,
    contacted: 2310,
    responded: 1586,
    completed: 1247,
    channels: ["whatsapp", "sms", "form"],
    startDate: "2026-09-15",
    endDate: "2026-11-15",
    owner: "Andrés Galvis",
  },
  {
    id: "cmp-inclusion",
    name: "Autorreconocimiento e inclusión",
    objective: "Recolección voluntaria de atributos de inclusión con autorización expresa.",
    status: "Programada",
    audience: 6800,
    contacted: 0,
    responded: 0,
    completed: 0,
    channels: ["form", "whatsapp"],
    startDate: "2026-10-12",
    endDate: "2026-12-12",
    owner: "Laura Mantilla",
  },
  {
    id: "cmp-youth",
    name: "Actualización de contacto — Asociados jóvenes",
    objective: "Validar celular y correo electrónico de asociados entre 18 y 30 años.",
    status: "Finalizada",
    audience: 3100,
    contacted: 3012,
    responded: 2480,
    completed: 2294,
    channels: ["whatsapp", "voice"],
    startDate: "2026-07-01",
    endDate: "2026-08-15",
    owner: "Camilo Rueda",
  },
];

export const FEATURED_CAMPAIGN = CAMPAIGNS[0];

export const CAMPAIGN_PROGRESS = [
  { day: "8 sep", contacted: 120, responded: 64, completed: 41 },
  { day: "11 sep", contacted: 340, responded: 198, completed: 142 },
  { day: "14 sep", contacted: 560, responded: 351, completed: 268 },
  { day: "17 sep", contacted: 790, responded: 512, completed: 401 },
  { day: "20 sep", contacted: 1010, responded: 668, completed: 539 },
  { day: "23 sep", contacted: 1240, responded: 840, completed: 690 },
  { day: "26 sep", contacted: 1480, responded: 1012, completed: 841 },
  { day: "29 sep", contacted: 1690, responded: 1170, completed: 968 },
  { day: "2 oct", contacted: 1874, responded: 1302, completed: 1085 },
];

export const CHANNEL_PERFORMANCE: { channel: string; key: Channel; contacted: number; responded: number; completed: number }[] = [
  { channel: "Llamada con IA", key: "voice", contacted: 742, responded: 468, completed: 371 },
  { channel: "WhatsApp", key: "whatsapp", contacted: 816, responded: 622, completed: 541 },
  { channel: "SMS / Formulario", key: "form", contacted: 316, responded: 212, completed: 173 },
];

export const CAMPAIGN_OUTCOMES: { status: InteractionStatus; value: number; color: string }[] = [
  { status: "Completado", value: 1085, color: "#10b981" },
  { status: "En progreso", value: 217, color: "#6366f1" },
  { status: "Requiere revisión", value: 100, color: "#f59e0b" },
  { status: "Sin respuesta", value: 398, color: "#cbd5e1" },
  { status: "No desea participar", value: 74, color: "#f43f5e" },
];

export const RESPONSE_RATE_TREND = [
  { week: "Sem 1", voice: 58, whatsapp: 71, form: 61 },
  { week: "Sem 2", voice: 61, whatsapp: 74, form: 64 },
  { week: "Sem 3", voice: 63, whatsapp: 77, form: 66 },
  { week: "Sem 4", voice: 64, whatsapp: 79, form: 68 },
];

const STATUSES: readonly (readonly [InteractionStatus, number])[] = [
  ["Completado", 46],
  ["En progreso", 14],
  ["Sin respuesta", 20],
  ["No desea participar", 6],
  ["Requiere revisión", 9],
];

function buildInteractions(): CampaignInteraction[] {
  const r = createRng(7731);
  return PEOPLE.slice(1, 61).map((p, i) => {
    const status = r.weighted(STATUSES);
    const channel = r.weighted([["whatsapp", 5], ["voice", 4], ["form", 2]] as const);
    const requested = r.int(6, 12);
    const collected =
      status === "Completado" ? requested : status === "Requiere revisión" ? requested - r.int(1, 3) : status === "En progreso" ? r.int(1, requested - 2) : 0;
    const minutes = r.int(1, 6);
    const hour = 8 + Math.floor(i / 6);
    return {
      id: `int-${i + 1}`,
      personId: p.id,
      personName: p.fullName,
      city: p.city,
      channel,
      status,
      fieldsCollected: collected,
      fieldsRequested: requested,
      duration: status === "Sin respuesta" ? "—" : channel === "form" ? `${minutes + 2} min ${r.int(10, 59)} s` : `${minutes} min ${r.int(10, 59)} s`,
      timestamp: `2026-10-02T${String(Math.min(hour, 18)).padStart(2, "0")}:${String(r.int(0, 59)).padStart(2, "0")}:00`,
      sentiment: status === "No desea participar" ? "Negativo" : r.weighted([["Positivo", 6], ["Neutral", 3], ["Negativo", 1]] as const),
    };
  });
}

export const CAMPAIGN_INTERACTIONS = buildInteractions();

export const AUDIENCE_PRESETS = [
  { id: "critical", name: "Vacíos críticos — Santander", description: "Perfiles sin información laboral o del hogar", size: 2500 },
  { id: "youth", name: "Asociados de 25 a 45 años con perfil parcial", description: "Mayor oportunidad de caracterización", size: 18_420 },
  { id: "micro", name: "Microempresarios", description: "Rango de ingresos con más de 24 meses de antigüedad", size: 4200 },
  { id: "inclusion", name: "Información de inclusión pendiente", description: "Autorreconocimiento voluntario", size: 6800 },
];

export const COLLECTABLE_FIELDS = [
  "Situación laboral",
  "Ocupación",
  "Rango de ingresos mensuales",
  "Personas en el hogar",
  "Personas a cargo",
  "Nivel educativo",
  "Dirección de residencia",
  "Canal de contacto preferido",
  "Condición de discapacidad (voluntario)",
  "Metas financieras",
];
