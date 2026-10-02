import type { IntelligenceMode } from "@/lib/types";

/**
 * Determines whether a user question requires organizational data from Supabase.
 * Keeps the routing simple, deterministic, and fast.
 */
export function shouldFetchOrganizationalData(question: string): boolean {
  if (!question || typeof question !== "string") return false;
  const q = question.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Explicit organizational terms
  const orgTerms = [
    "nuestra poblacion",
    "nuestros asociados",
    "nuestra base",
    "nuestra muestra",
    "nuestros datos",
    "nuestra organizacion",
    "nuestra caracterizacion",
    "nuestros perfiles",
    "nuestros colaboradores",
    "en nuestra empresa",
    "en nuestra entidad",
    "de nuestra entidad",
    "comultrasan",
    "priorizar la recoleccion",
    "recoleccion de informacion",
    "donde deberiamos priorizar",
  ];

  for (const term of orgTerms) {
    if (q.includes(term)) return true;
  }

  // Question patterns querying specific sample metrics
  const metricQueries = [
    /cuant[ao]s?\s+(personas?|asociados?|empleados?|perfiles?|casos?)/,
    /cuant[ao]s?\s+tienen\s+(informacion|empleo|datos|vacios|inclusi)/,
    /que\s+porcentaje\s+(tiene|de|representa)/,
    /en\s+que\s+ciudades\s+(tenemos|hay|se\s+presentan)/,
    /principales\s+brechas/,
    /brechas\s+de\s+(informacion|caracterizacion|empleo|inclusion|datos)/,
    /vacios\s+criticos/,
    /informacion\s+(laboral|de\s+empleo|ocupacional)\s+incompleta/,
    /datos\s+de\s+(inclusion|caracterizacion)/,
    /analiza\s+(nuestra|los\s+datos|la\s+poblacion|la\s+muestra|nuestros\s+datos)/,
    /problemas\s+ves\s+en\s+nuestra/,
    /estado\s+de\s+nuestra\s+caracterizacion/,
  ];

  for (const regex of metricQueries) {
    if (regex.test(q)) return true;
  }

  return false;
}

export interface ClassificationResult {
  mode: IntelligenceMode;
  asksOrg: boolean;
  asksKnowledge: boolean;
  canUseOrg: boolean;
  canUseKnowledge: boolean;
}

/**
 * Classifies a user query into one of four deterministic modes:
 * - COMBINED: User asks for organizational data AND legal knowledge, with both toggles active.
 * - ORGANIZATIONAL: User asks for organizational metrics with Org Context active.
 * - KNOWLEDGE: User asks for legal/normative advice with Knowledge filter active.
 * - GENERAL: Neither active or query is purely general conceptual legal guidance.
 */
export function classifyQuestionContext(
  question: string,
  options: {
    includeOrgContext: boolean;
    hasActiveKnowledgeFilters: boolean;
    shouldRetrieveDocs: boolean;
  }
): ClassificationResult {
  const asksOrg = shouldFetchOrganizationalData(question);
  const asksKnowledge = options.shouldRetrieveDocs;

  const canUseOrg = options.includeOrgContext && asksOrg;
  const canUseKnowledge = options.hasActiveKnowledgeFilters && asksKnowledge;

  let mode: IntelligenceMode = "GENERAL";
  if (canUseOrg && canUseKnowledge) {
    mode = "COMBINED";
  } else if (canUseOrg) {
    mode = "ORGANIZATIONAL";
  } else if (canUseKnowledge) {
    mode = "KNOWLEDGE";
  } else {
    mode = "GENERAL";
  }

  return {
    mode,
    asksOrg,
    asksKnowledge,
    canUseOrg,
    canUseKnowledge,
  };
}
