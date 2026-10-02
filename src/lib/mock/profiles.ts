import type {
  FieldSource,
  Person,
  PersonDocument,
  PersonInteraction,
  PersonProfile,
  ProfileField,
  ProfileSection,
  ProfileSectionId,
} from "@/lib/types";
import { PEOPLE, REFERENCE_DATE } from "./people";
import { createRng, hashString } from "./random";

type Rng = ReturnType<typeof createRng>;

interface FieldSpec {
  key: string;
  label: string;
  critical?: boolean;
  value: (p: Person, r: Rng) => string;
}

const MONTHS = ["ene", "mar", "may", "jul", "sep", "nov"];
const ascii = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const SECTION_SPECS: { id: ProfileSectionId; label: string; fields: FieldSpec[] }[] = [
  {
    id: "personal",
    label: "Datos personales",
    fields: [
      { key: "fullName", label: "Nombre completo", value: (p) => p.fullName },
      { key: "nationalId", label: "Cédula", value: (p) => p.nationalId },
      { key: "birthDate", label: "Fecha de nacimiento", value: (p, r) => `${r.int(1, 28)} ${r.pick(MONTHS)} ${2026 - p.age}` },
      { key: "mobile", label: "Celular", critical: true, value: (_, r) => `+57 3${r.int(0, 2)}${r.int(0, 9)} ${r.int(100, 999)} ${r.int(1000, 9999)}` },
      { key: "email", label: "Correo electrónico", value: (p) => `${ascii(p.firstName)}.${ascii(p.lastName.split(" ")[0])}@correo.co` },
      { key: "address", label: "Dirección de residencia", critical: true, value: (p, r) => `Cra ${r.int(10, 45)} #${r.int(20, 110)}-${r.int(10, 90)}, ${p.city}` },
    ],
  },
  {
    id: "household",
    label: "Hogar",
    fields: [
      { key: "marital", label: "Estado civil", value: (_, r) => r.pick(["Casado(a)", "Soltero(a)", "Unión libre", "Divorciado(a)"]) },
      { key: "householdSize", label: "Personas en el hogar", critical: true, value: (_, r) => `${r.int(1, 6)} personas` },
      { key: "dependents", label: "Personas a cargo", critical: true, value: (_, r) => `${r.int(0, 3)}` },
      { key: "housing", label: "Tipo de vivienda", value: (_, r) => r.pick(["Propia", "Arrendada", "Familiar", "Propia con hipoteca"]) },
      { key: "stratum", label: "Estrato socioeconómico", value: (_, r) => `Estrato ${r.int(1, 5)}` },
    ],
  },
  {
    id: "employment",
    label: "Información laboral",
    fields: [
      { key: "employmentStatus", label: "Situación laboral", critical: true, value: (p) => (p.employment === "Sin información" ? "Independiente" : p.employment) },
      { key: "occupation", label: "Ocupación", critical: true, value: (_, r) => r.pick(["Comerciante", "Auxiliar administrativo(a)", "Enfermero(a)", "Productor(a) agrícola", "Coordinador(a) logístico(a)", "Docente", "Técnico(a) en sistemas"]) },
      { key: "sector", label: "Sector económico", value: (_, r) => r.pick(["Comercio", "Salud", "Agricultura", "Educación", "Servicios", "Manufactura"]) },
      { key: "contract", label: "Tipo de vinculación", value: (_, r) => r.pick(["Término indefinido", "Término fijo", "Prestación de servicios", "Negocio propio"]) },
      { key: "tenure", label: "Antigüedad en la actividad", value: (_, r) => `${r.int(1, 15)} años` },
      { key: "income", label: "Rango de ingresos mensuales", critical: true, value: (_, r) => r.pick(["1–2 SMMLV", "2–3 SMMLV", "3–5 SMMLV", "Más de 5 SMMLV"]) },
    ],
  },
  {
    id: "education",
    label: "Educación",
    fields: [
      { key: "educationLevel", label: "Máximo nivel educativo", critical: true, value: (p) => (p.education === "Sin información" ? "Técnico" : p.education) },
      { key: "studyField", label: "Área de estudio", value: (_, r) => r.pick(["Administración de empresas", "Contaduría", "Enfermería", "Agronomía", "Ingeniería de sistemas", "Comercio"]) },
      { key: "studying", label: "Estudia actualmente", value: (_, r) => r.pick(["No", "Sí — jornada nocturna", "No — interesado(a) en formación"]) },
      { key: "certifications", label: "Certificaciones", value: (_, r) => r.pick(["SENA — Gestión empresarial", "Manipulación de alimentos", "Ninguna reportada", "Marketing digital"]) },
    ],
  },
  {
    id: "financial",
    label: "Información financiera",
    fields: [
      { key: "products", label: "Productos activos", value: () => "Cuenta de ahorros, CDAT" },
      { key: "savings", label: "Capacidad de ahorro mensual", value: (_, r) => r.pick(["Menos de $200.000", "$200.000 – $500.000", "$500.000 – $1.000.000"]) },
      { key: "creditHistory", label: "Historial crediticio", value: (_, r) => r.pick(["Al día", "Excelente", "Sin historial crediticio"]) },
      { key: "goals", label: "Metas financieras", critical: true, value: (_, r) => r.pick(["Ampliar su negocio", "Compra de vivienda", "Educación de los hijos", "Ahorro para el retiro"]) },
      { key: "memberSince", label: "Asociado(a) desde", value: (p) => `${p.memberSince}` },
    ],
  },
  {
    id: "social",
    label: "Información social",
    fields: [
      { key: "community", label: "Participación comunitaria", value: (_, r) => r.pick(["Junta de acción comunal", "Asociación de productores", "Ninguna reportada", "Voluntariado parroquial"]) },
      { key: "sisben", label: "Grupo SISBÉN", value: (_, r) => r.pick(["B4", "C2", "C5", "No registrado"]) },
      { key: "interests", label: "Intereses", value: (_, r) => r.pick(["Educación financiera, emprendimiento", "Programas de vivienda", "Formación y certificaciones"]) },
      { key: "preferredChannel", label: "Canal de contacto preferido", critical: true, value: (_, r) => r.pick(["WhatsApp", "Llamada telefónica", "Correo electrónico"]) },
    ],
  },
  {
    id: "inclusion",
    label: "Inclusión",
    fields: [
      { key: "disability", label: "Condición de discapacidad", critical: true, value: () => "No reporta discapacidad" },
      { key: "ethnic", label: "Autorreconocimiento étnico", value: () => "Ninguno" },
      { key: "headOfHousehold", label: "Jefatura de hogar", critical: true, value: (p, r) => (p.gender === "F" && r.next() > 0.4 ? "Sí — mujer cabeza de hogar" : "No") },
      { key: "residence", label: "Zona de residencia", value: (p) => (["San Gil", "Socorro"].includes(p.city) ? "Rural" : "Urbana") },
    ],
  },
];

const MARIA_MISSING = new Set([
  "address", "dependents", "householdSize", "occupation", "income", "contract",
  "educationLevel", "certifications", "goals", "interests", "preferredChannel",
  "disability", "headOfHousehold",
]);

const MARIA_OVERRIDES: Record<string, string> = {
  birthDate: "14 mar 1988",
  mobile: "+57 315 482 7731",
  email: "maria.rodriguez@correo.co",
  address: "Cra 27 #45-18, Barrio Sotomayor, Bucaramanga",
  marital: "Casada",
  householdSize: "4 personas",
  dependents: "2",
  housing: "Propia",
  stratum: "Estrato 3",
  employmentStatus: "Independiente",
  occupation: "Propietaria de panadería (microempresa)",
  sector: "Comercio",
  contract: "Negocio propio",
  tenure: "6 años",
  income: "3–5 SMMLV",
  educationLevel: "Técnico — SENA",
  studyField: "Producción de alimentos",
  studying: "No — interesada en formación",
  certifications: "Manipulación de alimentos",
  products: "Cuenta de ahorros, CDAT, Microcrédito",
  savings: "$500.000 – $1.000.000",
  creditHistory: "Excelente",
  goals: "Ampliar la panadería y comprar equipos",
  community: "Junta de acción comunal",
  sisben: "C2",
  interests: "Educación financiera, emprendimiento",
  preferredChannel: "WhatsApp",
  disability: "No reporta discapacidad",
  ethnic: "Ninguno",
  headOfHousehold: "No — hogar compartido",
  residence: "Urbana",
};

const LEGACY_SOURCES: FieldSource[] = ["Core financiero", "Vinculación en oficina", "App móvil"];

function daysAgo(days: number) {
  const d = new Date(`${REFERENCE_DATE}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function buildSections(person: Person, r: Rng): ProfileSection[] {
  const isMaria = person.id === PEOPLE[0].id;
  const allSpecs = SECTION_SPECS.flatMap((s) => s.fields);
  const total = allSpecs.length;
  const missingTarget = Math.round(total * (1 - person.characterization / 100));
  const alwaysKnown = new Set(["fullName", "nationalId", "memberSince", "products"]);

  const candidates = allSpecs.filter((f) => !alwaysKnown.has(f.key)).map((f) => f.key);
  const missing = new Set<string>();
  if (isMaria) {
    MARIA_MISSING.forEach((k) => missing.add(k));
  } else {
    const pool = [...candidates];
    while (missing.size < Math.min(missingTarget, pool.length)) {
      const idx = Math.floor(r.next() * pool.length);
      missing.add(pool.splice(idx, 1)[0]);
    }
  }

  return SECTION_SPECS.map((section) => ({
    id: section.id,
    label: section.label,
    fields: section.fields.map<ProfileField>((spec) => {
      const value = (isMaria && MARIA_OVERRIDES[spec.key]) || spec.value(person, r);
      const known = !missing.has(spec.key);
      return {
        key: spec.key,
        label: spec.label,
        value,
        known,
        critical: spec.critical,
        source: known ? r.pick(LEGACY_SOURCES) : undefined,
        updatedAt: known ? daysAgo(r.int(60, 900)) : undefined,
      };
    }),
  }));
}

function buildInteractions(person: Person, r: Rng): PersonInteraction[] {
  const isMaria = person.id === PEOPLE[0].id;
  return [
    {
      id: "i1",
      date: daysAgo(47),
      channel: "branch",
      title: "Visita a oficina — Sede Cabecera",
      description: isMaria
        ? "Renovación de CDAT. El asesor registró que la información laboral está desactualizada."
        : "Revisión de productos realizada en oficina.",
      outcome: "Completada",
    },
    {
      id: "i2",
      date: daysAgo(96),
      channel: "app",
      title: "Sesión en la app móvil",
      description: "Consultó el simulador de microcrédito para financiación de equipos.",
      outcome: "Completada",
    },
    {
      id: "i3",
      date: daysAgo(140),
      channel: "whatsapp",
      title: "Notificación de servicio por WhatsApp",
      description: "Recordatorio de pago entregado y leído.",
      outcome: "Completada",
    },
    {
      id: "i4",
      date: daysAgo(r.int(200, 320)),
      channel: "voice",
      title: "Llamada de asesoría",
      description: "El asociado no contestó. No se dejó mensaje de voz.",
      outcome: "Sin respuesta",
    },
  ];
}

function buildDocuments(person: Person): PersonDocument[] {
  const isMaria = person.id === PEOPLE[0].id;
  return [
    { id: "d1", name: "Cédula de ciudadanía", type: "Identidad", status: "Verificado", updatedAt: daysAgo(1100) },
    { id: "d2", name: "Acuerdo de vinculación", type: "Contrato", status: "Verificado", updatedAt: daysAgo(1100) },
    { id: "d3", name: "Autorización de tratamiento de datos (Ley 1581)", type: "Autorización", status: isMaria ? "Pendiente" : "Verificado", updatedAt: isMaria ? undefined : daysAgo(300) },
    { id: "d4", name: "Certificado de ingresos", type: "Financiero", status: isMaria ? "Vencido" : "Verificado", updatedAt: daysAgo(540) },
    { id: "d5", name: "RUT — Registro Único Tributario", type: "Tributario", status: isMaria ? "Faltante" : "Pendiente" },
    { id: "d6", name: "Certificado de residencia", type: "Residencia", status: "Faltante" },
  ];
}

export function buildProfile(person: Person): PersonProfile {
  const r = createRng(hashString(person.id));
  const sections = buildSections(person, r);
  const personal = sections.find((s) => s.id === "personal")!;
  const isMaria = person.id === PEOPLE[0].id;

  return {
    person,
    phone: personal.fields.find((f) => f.key === "mobile")!.value,
    email: personal.fields.find((f) => f.key === "email")!.value,
    sections,
    interactions: buildInteractions(person, r),
    documents: buildDocuments(person),
    products: isMaria ? ["Cuenta de ahorros", "CDAT 180 días", "Microcrédito"] : ["Cuenta de ahorros", "CDAT"],
    riskSignals: isMaria
      ? [
          "Información laboral verificada hace más de 3 años",
          "Composición del hogar desconocida — afecta la elegibilidad de productos",
          "Atributos de inclusión no reportados",
        ]
      : ["El perfil tiene campos críticos sin verificar"],
  };
}
