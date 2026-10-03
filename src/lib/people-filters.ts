import type { Person } from "./types";

export interface PeopleFilters {
  location: string;
  age: string;
  employment: string;
  education: string;
  characterization: string;
  profileStatus: string;
  inclusion: string;
  campaignStatus: string;
}

export const EMPTY_FILTERS: PeopleFilters = {
  location: "",
  age: "",
  employment: "",
  education: "",
  characterization: "",
  profileStatus: "",
  inclusion: "",
  campaignStatus: "",
};

export const FILTER_LABELS: Record<keyof PeopleFilters, string> = {
  location: "Municipio",
  age: "Edad",
  employment: "Situación laboral",
  education: "Educación",
  characterization: "Caracterización",
  profileStatus: "Estado del perfil",
  inclusion: "Información de inclusión",
  campaignStatus: "Estado de campaña",
};

export function inAgeRange(age: number, range: string) {
  if (!range) return true;
  const clean = range.trim();
  if (clean.includes("65")) return age >= 65;
  const parts = clean.split(/[-–—\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    if (!isNaN(min) && !isNaN(max)) {
      return age >= min && age <= max;
    }
  }
  return true;
}

export function inScoreRange(score: number, range: string) {
  if (!range) return true;
  const clean = range.toLowerCase().replace(/\s+/g, " ").trim();
  if (clean.includes("menos") || clean.includes("<") || clean.includes("50 %") && !clean.includes("50–") && !clean.includes("50-")) {
    return score < 50;
  }
  if (clean.includes("50") && clean.includes("69")) {
    return score >= 50 && score < 70;
  }
  if (clean.includes("70") && clean.includes("84")) {
    return score >= 70 && score < 85;
  }
  if (clean.includes("85") || clean.includes("más") || clean.includes("mas") || clean.includes(">")) {
    return score >= 85;
  }
  return true;
}

function normalizeStr(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterPeople(people: Person[], query: string, f: PeopleFilters) {
  const q = normalizeStr(query);
  const qDigits = query.replace(/\D/g, "");
  return people.filter((p) => {
    if (q) {
      const matchName = normalizeStr(p.fullName).includes(q);
      const matchCity = normalizeStr(p.city).includes(q);
      const matchId = p.id.toLowerCase().includes(query.trim().toLowerCase());
      const matchNationalId = qDigits.length > 0 && p.nationalId.replace(/\D/g, "").includes(qDigits);
      if (!matchName && !matchCity && !matchId && !matchNationalId) return false;
    }
    if (f.location && normalizeStr(p.city) !== normalizeStr(f.location)) return false;
    if (f.age && !inAgeRange(p.age, f.age)) return false;
    if (f.employment && normalizeStr(p.employment) !== normalizeStr(f.employment)) return false;
    if (f.education && normalizeStr(p.education) !== normalizeStr(f.education)) return false;
    if (f.characterization && !inScoreRange(p.characterization, f.characterization)) return false;
    if (f.profileStatus && normalizeStr(p.profileStatus) !== normalizeStr(f.profileStatus)) return false;
    if (f.inclusion && normalizeStr(p.inclusion) !== normalizeStr(f.inclusion)) return false;
    if (f.campaignStatus && normalizeStr(p.campaignStatus) !== normalizeStr(f.campaignStatus)) return false;
    return true;
  });
}

