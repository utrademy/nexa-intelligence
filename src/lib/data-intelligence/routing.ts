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
    /datos\s+de\s+inclusion\s+y/,
    /analiza\s+(nuestra|los\s+datos|la\s+poblacion|la\s+muestra)/,
    /problemas\s+ves\s+en\s+nuestra/,
    /estado\s+de\s+nuestra\s+caracterizacion/,
  ];

  for (const regex of metricQueries) {
    if (regex.test(q)) return true;
  }

  return false;
}
