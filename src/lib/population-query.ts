import type { Person } from "./types";

// Mock natural-language query over the loaded sample. Results are scaled to
// the full population. Replace with a real NL → query service later.

export interface PopulationAnswer {
  count: number;
  share: number;
  groupLabel: string;
  topicLabel: string;
  topCity?: { name: string; share: number };
  summary: string;
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const TOPICS: { match: RegExp; label: string; test: (p: Person) => boolean }[] = [
  { match: /labor|empleo|ocupaci|trabaj|ingreso/, label: "información laboral incompleta", test: (p) => p.employment === "Sin información" || p.characterization < 70 },
  { match: /educa|estudi/, label: "información educativa incompleta", test: (p) => p.education === "Sin información" || p.characterization < 65 },
  { match: /inclusi|discapacid|etnic/, label: "información de inclusión pendiente", test: (p) => p.inclusion !== "Reportada" },
  { match: /critic|vacio/, label: "vacíos críticos de información", test: (p) => p.profileStatus === "Vacíos críticos" },
  { match: /contact|campa/, label: "pendientes de contacto", test: (p) => p.campaignStatus === "Sin contactar" },
];

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

export function answerPopulationQuestion(question: string, people: Person[], total: number, cities: readonly string[]): PopulationAnswer {
  const q = normalize(question);

  const range = q.match(/(\d{2})\s*(?:y|a|-|–|al?)\s*(\d{2})/);
  const minAge = range ? Number(range[1]) : undefined;
  const maxAge = range ? Number(range[2]) : undefined;
  const older = !range && q.match(/(?:mayores de|mas de)\s*(\d{2})/);

  const city = cities.find((c) => q.includes(normalize(c)));
  const topic = TOPICS.find((t) => t.match.test(q)) ?? { label: "información incompleta", test: (p: Person) => p.characterization < 85 };

  const group = people.filter((p) => {
    if (minAge !== undefined && maxAge !== undefined && (p.age < minAge || p.age > maxAge)) return false;
    if (older && p.age <= Number(older[1])) return false;
    if (city && p.city !== city) return false;
    return true;
  });
  const matches = group.filter(topic.test);

  const count = roundTo((matches.length / people.length) * total, 10);
  const share = group.length ? Math.round((matches.length / group.length) * 100) : 0;

  const byCity = new Map<string, number>();
  matches.forEach((p) => byCity.set(p.city, (byCity.get(p.city) ?? 0) + 1));
  const [topName, topCount] = [...byCity.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  const groupParts = [
    minAge !== undefined ? `entre ${minAge} y ${maxAge} años` : older ? `mayores de ${older[1]} años` : null,
    city ? `en ${city}` : null,
  ].filter(Boolean);
  const groupLabel = groupParts.length ? `Asociados ${groupParts.join(" ")}` : "Todos los asociados";

  return {
    count,
    share,
    groupLabel,
    topicLabel: topic.label,
    topCity: !city && topName ? { name: topName, share: Math.round((topCount / matches.length) * 100) } : undefined,
    summary: `Representan el ${share} % del grupo consultado.`,
  };
}
