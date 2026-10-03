import type { Channel, FieldSource, ProfileSection } from "./types";

export const CHANNEL_SOURCE: Record<Channel, FieldSource> = {
  voice: "Llamada con IA",
  whatsapp: "WhatsApp",
  sms: "SMS",
  form: "Formulario seguro",
};

export const SECTION_METADATA: { id: ProfileSection["id"]; label: string; fields: { key: string; label: string; critical?: boolean }[] }[] = [
  {
    id: "personal",
    label: "Datos personales",
    fields: [
      { key: "fullName", label: "Nombre completo" },
      { key: "nationalId", label: "Cédula" },
      { key: "birthDate", label: "Fecha de nacimiento" },
      { key: "mobile", label: "Celular", critical: true },
      { key: "email", label: "Correo electrónico" },
      { key: "address", label: "Dirección de residencia", critical: true },
    ],
  },
  {
    id: "household",
    label: "Hogar",
    fields: [
      { key: "marital", label: "Estado civil" },
      { key: "householdSize", label: "Personas en el hogar", critical: true },
      { key: "dependents", label: "Personas a cargo", critical: true },
      { key: "housing", label: "Tipo de vivienda" },
      { key: "stratum", label: "Estrato socioeconómico" },
    ],
  },
  {
    id: "employment",
    label: "Información laboral",
    fields: [
      { key: "employmentStatus", label: "Situación laboral", critical: true },
      { key: "occupation", label: "Ocupación", critical: true },
      { key: "sector", label: "Sector económico" },
      { key: "contract", label: "Tipo de vinculación" },
      { key: "tenure", label: "Antigüedad en la actividad" },
      { key: "income", label: "Rango de ingresos mensuales", critical: true },
    ],
  },
  {
    id: "education",
    label: "Educación",
    fields: [
      { key: "educationLevel", label: "Máximo nivel educativo", critical: true },
      { key: "studyField", label: "Área de estudio" },
      { key: "studying", label: "Estudia actualmente" },
      { key: "certifications", label: "Certificaciones" },
    ],
  },
  {
    id: "financial",
    label: "Información financiera",
    fields: [
      { key: "products", label: "Productos activos" },
      { key: "savings", label: "Capacidad de ahorro mensual" },
      { key: "creditHistory", label: "Historial crediticio" },
      { key: "goals", label: "Metas financieras", critical: true },
      { key: "memberSince", label: "Asociado(a) desde" },
    ],
  },
  {
    id: "social",
    label: "Información social",
    fields: [
      { key: "community", label: "Participación comunitaria" },
      { key: "sisben", label: "Grupo SISBÉN" },
      { key: "interests", label: "Intereses" },
      { key: "preferredChannel", label: "Canal de contacto preferido", critical: true },
    ],
  },
  {
    id: "inclusion",
    label: "Inclusión",
    fields: [
      { key: "disability", label: "Condición de discapacidad", critical: true },
      { key: "ethnic", label: "Autorreconocimiento étnico" },
      { key: "headOfHousehold", label: "Jefatura de hogar", critical: true },
      { key: "residence", label: "Zona de residencia" },
    ],
  },
];

export function profileScore(sections: ProfileSection[]) {
  const fields = sections.flatMap((s) => s.fields);
  const known = fields.filter((f) => f.known).length;
  return { known, total: fields.length, missing: fields.length - known, score: Math.round((known / fields.length) * 100) };
}

/**
 * Calculates real completeness score given raw person + person_attributes from Supabase.
 */
export function calculateCharacterizationFromDb(
  person: {
    first_name?: string | null;
    last_name?: string | null;
    document_number?: string | null;
    birth_date?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    employment_status?: string | null;
    occupation?: string | null;
    education_level?: string | null;
    member_since?: number | null;
  },
  attributes: { attribute_key: string; attribute_value: string }[],
) {
  const attrMap = new Map<string, string>();
  for (const a of attributes) {
    if (a.attribute_value && a.attribute_value !== "Sin información") {
      attrMap.set(a.attribute_key, a.attribute_value);
    }
  }

  let known = 0;
  let total = 0;

  for (const sec of SECTION_METADATA) {
    for (const f of sec.fields) {
      total++;
      if (attrMap.has(f.key)) {
        known++;
        continue;
      }

      // Check base person table mappings
      if (f.key === "fullName" && (person.first_name || person.last_name)) {
        known++;
      } else if (f.key === "nationalId" && person.document_number) {
        known++;
      } else if (f.key === "birthDate" && person.birth_date) {
        known++;
      } else if (f.key === "mobile" && person.phone && person.phone.trim().length > 0) {
        known++;
      } else if (f.key === "email" && person.email && person.email.trim().length > 0) {
        known++;
      } else if (f.key === "address" && person.city) {
        known++;
      } else if (f.key === "employmentStatus" && person.employment_status && person.employment_status !== "Sin información") {
        known++;
      } else if (f.key === "occupation" && person.occupation && person.occupation !== "Sin información") {
        known++;
      } else if (f.key === "educationLevel" && person.education_level && person.education_level !== "Sin información") {
        known++;
      } else if (f.key === "memberSince" && person.member_since) {
        known++;
      } else if (f.key === "products") {
        known++;
      } else if (f.key === "residence" && person.city) {
        known++;
      }
    }
  }

  const score = total > 0 ? Math.round((known / total) * 100) : 0;
  return { known, total, missing: total - known, score };
}

/**
 * Simulates the structured output of an AI conversation: fills missing
 * fields (critical first) until the profile reaches ~91%, or completes it.
 */
export function applyAiCharacterization(sections: ProfileSection[], channel: Channel, timestamp: string) {
  const { known, total, score } = profileScore(sections);
  const target = score < 91 ? Math.ceil(total * 0.91) : total;
  const toFill = Math.max(0, target - known);

  const missing = sections
    .flatMap((s) => s.fields.filter((f) => !f.known).map((f) => f.key))
    .sort((a, b) => {
      const fa = sections.flatMap((s) => s.fields).find((f) => f.key === a)!;
      const fb = sections.flatMap((s) => s.fields).find((f) => f.key === b)!;
      return Number(!!fb.critical) - Number(!!fa.critical);
    });
  const fill = new Set(missing.slice(0, toFill));

  let i = 0;
  const updated = sections.map((s) => ({
    ...s,
    fields: s.fields.map((f) => {
      if (!fill.has(f.key)) return f;
      i++;
      return {
        ...f,
        known: true,
        aiCollected: true,
        source: CHANNEL_SOURCE[channel],
        updatedAt: timestamp,
        confidence: 0.88 + ((i * 37) % 11) / 100,
        consent: "Otorgada" as const,
      };
    }),
  }));

  return { sections: updated, filled: fill.size };
}
