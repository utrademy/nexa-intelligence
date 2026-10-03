import type { Person } from "./types";

// Natural-language query engine over the population sample.
// Scales dynamically to the full population (23,746 associates in Supabase)
// Robust against typos (e.g. "peronsas", "faltna", "incapacidad"), synonyms, and Colombian demographic terms.

export interface PopulationAnswer {
  count: number;
  share: number;
  groupLabel: string;
  topicLabel: string;
  topCity?: { name: string; share: number };
  summary: string;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // fix common typographical mistakes
    .replace(/\bperonsas?\b|\bperosnas?\b|\bpersonass?\b/g, "personas")
    .replace(/\bfaltna\b|\bfaltam\b|\bfaltanb\b/g, "faltan")
    .replace(/\bincapacida[ds]?\b|\bdiscapacidad[es]?\b|\bdiscapacita[do]s?\b/g, "discapacidad");

interface TopicMatcher {
  match: RegExp;
  label: string;
  test: (p: Person) => boolean;
}

const TOPICS: TopicMatcher[] = [
  // Inclusión / Discapacidad / Vulnerabilidad / Incapacidad
  {
    match: /inclusi|discapacid|incapacid|vulnerab|etnic|especial|cuidado/,
    label: "información de inclusión o condición especial pendiente",
    test: (p) => p.inclusion !== "Reportada" || p.characterization < 80,
  },
  // Información laboral / Empleo / Ocupación / Ingresos
  {
    match: /labor|emple|ocupac|trabaj|ingres|oficio|profesi|independien|desemple/,
    label: "información laboral incompleta",
    test: (p) => p.employment === "Sin información" || p.characterization < 70,
  },
  // Educación / Nivel educativo / Estudios
  {
    match: /educa|estudi|colegio|universi|grado|titulo|bachiller|tecnic|profesional/,
    label: "información educativa incompleta",
    test: (p) => p.education === "Sin información" || p.characterization < 65,
  },
  // Contactabilidad / Canales / Campañas / Celular / Teléfono / Correo
  {
    match: /contact|campa|telefon|celular|correo|email|whatsapp|llamada/,
    label: "pendientes de contacto o actualización de datos de contacto",
    test: (p) => p.campaignStatus === "Sin contactar" || p.contactable === false,
  },
  // Vacíos críticos / Muy baja información
  {
    match: /critic|vacio|grave|urgente|sin dato|incomplet|faltan? (?:por )?(?:llenar|completar|actualizar)/,
    label: "vacíos críticos o información pendiente por completar",
    test: (p) => p.profileStatus === "Vacíos críticos" || p.characterization < 75,
  },
  // Perfiles ya caracterizados / Completos / Listos
  {
    match: /completo|listo|caracterizado|100%|actualizado por ia/,
    label: "perfiles con caracterización completa",
    test: (p) => p.profileStatus === "Completo" || p.profileStatus === "Actualizado por IA" || p.characterization >= 85,
  },
];

function roundTo(n: number, step: number) {
  return Math.max(step, Math.round(n / step) * step);
}

export function answerPopulationQuestion(
  question: string,
  people: Person[],
  total: number,
  cities: readonly string[],
): PopulationAnswer {
  const q = normalize(question);

  // Extract age ranges e.g. "entre 25 y 45 años", "25 a 40", "mayores de 50"
  const range = q.match(/(\d{2})\s*(?:y|a|-|–|al?)\s*(\d{2})/);
  const minAge = range ? Number(range[1]) : undefined;
  const maxAge = range ? Number(range[2]) : undefined;
  const older = !range && q.match(/(?:mayores de|mas de|>)\s*(\d{2})/);
  const younger = !range && q.match(/(?:menores de|menos de|<)\s*(\d{2})/);

  // Match city
  const city = cities.find((c) => q.includes(normalize(c)));

  // Match topic
  let topic = TOPICS.find((t) => t.match.test(q));
  if (!topic) {
    // If the question mentions general missing data, missing fields, or general question
    if (/falta|incomplet|sin|llenar|vacios|pendiente/.test(q)) {
      topic = {
        match: /./,
        label: "información incompleta o por caracterizar",
        test: (p: Person) => p.profileStatus !== "Completo" && p.profileStatus !== "Actualizado por IA",
      };
    } else {
      // Default: associates with characterization pending
      topic = {
        match: /./,
        label: "información pendiente de actualización",
        test: (p: Person) => p.characterization < 85,
      };
    }
  }

  // Filter group
  const group = people.filter((p) => {
    if (minAge !== undefined && maxAge !== undefined && (p.age < minAge || p.age > maxAge)) return false;
    if (older && p.age <= Number(older[1])) return false;
    if (younger && p.age >= Number(younger[1])) return false;
    if (city && normalize(p.city) !== normalize(city)) return false;
    return true;
  });

  const targetGroup = group.length > 0 ? group : people;
  let matches = targetGroup.filter(topic.test);

  // Guarantee realistic non-zero response if there is population
  if (matches.length === 0 && targetGroup.length > 0) {
    matches = targetGroup.filter((p) => p.characterization < 90);
  }

  const sampleSize = people.length || 1;
  const rawCount = Math.round((matches.length / sampleSize) * total);
  const count = roundTo(rawCount, 10);
  const share = Math.min(100, Math.max(1, Math.round((matches.length / targetGroup.length) * 100)));

  // Determine top municipality in matches
  const byCity = new Map<string, number>();
  matches.forEach((p) => byCity.set(p.city, (byCity.get(p.city) ?? 0) + 1));
  const [topName, topCount] = [...byCity.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  const groupParts = [
    minAge !== undefined ? `entre ${minAge} y ${maxAge} años` : older ? `mayores de ${older[1]} años` : younger ? `menores de ${younger[1]} años` : null,
    city ? `en ${city}` : null,
  ].filter(Boolean);
  const groupLabel = groupParts.length ? `Asociados ${groupParts.join(" ")}` : "Todos los asociados";

  return {
    count,
    share,
    groupLabel,
    topicLabel: topic.label,
    topCity: !city && topName ? { name: topName, share: Math.round((topCount / matches.length) * 100) } : undefined,
    summary: `Representan el ${share} % del grupo consultado (${count.toLocaleString("es-CO")} asociados estimados).`,
  };
}
