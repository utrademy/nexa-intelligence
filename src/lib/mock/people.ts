import type {
  CampaignStatus,
  EducationLevel,
  EmploymentStatus,
  InclusionInfo,
  Person,
  ProfileStatus,
} from "@/lib/types";
import { createRng } from "./random";

export const TOTAL_POPULATION = 500_000;
export const REFERENCE_DATE = "2026-10-02";

const FEMALE_NAMES = [
  "María", "Luisa", "Camila", "Valentina", "Daniela", "Paula", "Andrea", "Carolina",
  "Natalia", "Juliana", "Diana", "Lina", "Sandra", "Claudia", "Adriana", "Marcela",
  "Ángela", "Yuliana", "Tatiana", "Laura", "Catalina", "Mónica", "Sofía", "Gabriela",
] as const;

const MALE_NAMES = [
  "Juan", "Carlos", "Andrés", "Santiago", "Felipe", "Sebastián", "Jorge", "Luis",
  "Diego", "Camilo", "Mateo", "Alejandro", "Óscar", "Fabián", "Hernán", "Julián",
  "Esteban", "Mauricio", "Ricardo", "Nicolás", "Edwin", "Wilson", "Germán", "Iván",
] as const;

const LAST_NAMES = [
  "Rodríguez", "Gómez", "Martínez", "Díaz", "Pérez", "Sánchez", "Ramírez", "Torres",
  "Flórez", "Vargas", "Rojas", "Moreno", "Jiménez", "Castro", "Ortiz", "Rueda",
  "Suárez", "Mantilla", "Serrano", "Quintero", "Ardila", "Galvis", "Cáceres", "Duarte",
  "Prada", "Pinzón", "Acevedo", "Villamizar", "Barrera", "Niño", "Cárdenas", "Herrera",
] as const;

export const LOCATIONS = [
  { city: "Bucaramanga", department: "Santander", weight: 30 },
  { city: "Floridablanca", department: "Santander", weight: 14 },
  { city: "Girón", department: "Santander", weight: 8 },
  { city: "Piedecuesta", department: "Santander", weight: 8 },
  { city: "Barrancabermeja", department: "Santander", weight: 6 },
  { city: "San Gil", department: "Santander", weight: 4 },
  { city: "Socorro", department: "Santander", weight: 3 },
  { city: "Bogotá", department: "Bogotá D.C.", weight: 10 },
  { city: "Medellín", department: "Antioquia", weight: 5 },
  { city: "Cúcuta", department: "Norte de Santander", weight: 6 },
  { city: "Tunja", department: "Boyacá", weight: 3 },
  { city: "Valledupar", department: "Cesar", weight: 3 },
] as const;

const EMPLOYMENT: readonly (readonly [EmploymentStatus, number])[] = [
  ["Empleado", 38],
  ["Independiente", 20],
  ["Informal", 11],
  ["Pensionado", 9],
  ["Desempleado", 6],
  ["Estudiante", 5],
  ["Sin información", 11],
];

const EDUCATION: readonly (readonly [EducationLevel, number])[] = [
  ["Primaria", 8],
  ["Secundaria", 26],
  ["Técnico", 17],
  ["Tecnólogo", 13],
  ["Profesional", 18],
  ["Posgrado", 6],
  ["Sin información", 12],
];

const SEGMENTS = [
  "Ahorro tradicional",
  "Microempresarios",
  "Asociados jóvenes",
  "Crédito de libranza",
  "Asociados mayores",
  "Productores rurales",
] as const;

function isoDaysAgo(days: number) {
  const d = new Date(`${REFERENCE_DATE}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function statusFor(score: number, rngValue: number): ProfileStatus {
  if (score >= 88) return rngValue > 0.55 ? "Actualizado por IA" : "Completo";
  if (score >= 55) return "Parcial";
  return "Vacíos críticos";
}

function campaignFor(score: number, r: ReturnType<typeof createRng>): CampaignStatus {
  if (score >= 88) return r.weighted([["Completado", 7], ["Respondió", 2], ["Sin contactar", 1]] as const);
  return r.weighted([
    ["Sin contactar", 5],
    ["Contactado", 3],
    ["Respondió", 1],
    ["No desea participar", 1],
  ] as const);
}

function buildPeople(count: number): Person[] {
  const r = createRng(20261002);
  const people: Person[] = [];

  for (let i = 0; i < count; i++) {
    const gender: Person["gender"] = r.next() > 0.48 ? "F" : "M";
    const firstName = r.pick(gender === "F" ? FEMALE_NAMES : MALE_NAMES);
    const lastName = `${r.pick(LAST_NAMES)} ${r.pick(LAST_NAMES)}`;
    const loc = r.weighted(LOCATIONS.map((l) => [l, l.weight] as const));
    const age = Math.min(84, Math.max(18, Math.round(22 + r.next() * 30 + r.next() * 22 - 4)));
    let employment = r.weighted(EMPLOYMENT);
    if (age >= 63 && r.next() > 0.35) employment = "Pensionado";
    if (age <= 23 && r.next() > 0.5) employment = "Estudiante";
    const education = r.weighted(EDUCATION);
    const base = 48 + r.next() * 30 + r.next() * 22;
    const characterization = Math.round(
      Math.min(100, base - (employment === "Sin información" ? 12 : 0) - (education === "Sin información" ? 8 : 0)),
    );
    const inclusion: InclusionInfo =
      characterization >= 85 ? "Reportada" : characterization >= 55 ? r.pick(["Reportada", "Parcial", "Pendiente"] as const) : r.pick(["Parcial", "Pendiente", "Pendiente"] as const);
    const channel = r.weighted([["branch", 3], ["app", 3], ["whatsapp", 3], ["voice", 2], ["form", 1]] as const);

    people.push({
      id: `nx-${100001 + i}`,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      nationalId: `CC ${r.int(10, 99)}.${r.int(100, 999)}.${r.int(100, 999)}`,
      gender,
      age,
      city: loc.city,
      department: loc.department,
      employment,
      education,
      characterization,
      profileStatus: statusFor(characterization, r.next()),
      inclusion,
      campaignStatus: campaignFor(characterization, r),
      lastInteraction: { date: isoDaysAgo(r.int(0, 160)), channel },
      memberSince: r.int(2004, 2025),
      segment: r.pick(SEGMENTS),
    });
  }

  people[0] = {
    ...people[0],
    firstName: "María",
    lastName: "Rodríguez Serrano",
    fullName: "María Rodríguez Serrano",
    nationalId: "CC 63.548.217",
    gender: "F",
    age: 38,
    city: "Bucaramanga",
    department: "Santander",
    employment: "Independiente",
    education: "Técnico",
    characterization: 62,
    profileStatus: "Parcial",
    inclusion: "Pendiente",
    campaignStatus: "Sin contactar",
    lastInteraction: { date: isoDaysAgo(47), channel: "branch" },
    memberSince: 2014,
    segment: "Microempresarios",
  };

  return people;
}

export const PEOPLE: Person[] = buildPeople(320);

export const FILTER_OPTIONS = {
  location: Array.from(new Set(LOCATIONS.map((l) => l.city))),
  age: ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"],
  employment: EMPLOYMENT.map(([e]) => e),
  education: EDUCATION.map(([e]) => e),
  characterization: ["Menos de 50 %", "50–69 %", "70–84 %", "85 % o más"],
  profileStatus: ["Completo", "Parcial", "Vacíos críticos", "Actualizado por IA"] as ProfileStatus[],
  inclusion: ["Reportada", "Parcial", "Pendiente"] as InclusionInfo[],
  campaignStatus: ["Sin contactar", "Contactado", "Respondió", "Completado", "No desea participar"] as CampaignStatus[],
};
