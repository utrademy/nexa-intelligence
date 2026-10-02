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
  if (range === "65+") return age >= 65;
  const [min, max] = range.split("–").map(Number);
  return age >= min && age <= max;
}

function inScoreRange(score: number, range: string) {
  switch (range) {
    case "Menos de 50 %":
      return score < 50;
    case "50–69 %":
      return score >= 50 && score < 70;
    case "70–84 %":
      return score >= 70 && score < 85;
    case "85 % o más":
      return score >= 85;
    default:
      return true;
  }
}

export function filterPeople(people: Person[], query: string, f: PeopleFilters) {
  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  return people.filter((p) => {
    if (q && !(p.fullName.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.id.includes(q) || (qDigits && p.nationalId.replace(/\D/g, "").includes(qDigits)))) return false;
    if (f.location && p.city !== f.location) return false;
    if (f.age && !inAgeRange(p.age, f.age)) return false;
    if (f.employment && p.employment !== f.employment) return false;
    if (f.education && p.education !== f.education) return false;
    if (f.characterization && !inScoreRange(p.characterization, f.characterization)) return false;
    if (f.profileStatus && p.profileStatus !== f.profileStatus) return false;
    if (f.inclusion && p.inclusion !== f.inclusion) return false;
    if (f.campaignStatus && p.campaignStatus !== f.campaignStatus) return false;
    return true;
  });
}
