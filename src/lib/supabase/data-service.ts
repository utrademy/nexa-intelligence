import { getSupabaseServerClient } from "./server";
import type { DatabasePerson, DatabasePersonAttribute, DatabaseInteraction, DatabaseConsent, DatabaseCampaign } from "./types";
import type {
  CampaignStatus,
  Channel,
  EducationLevel,
  EmploymentStatus,
  FieldSource,
  InclusionInfo,
  Person,
  PersonDocument,
  PersonInteraction,
  PersonProfile,
  ProfileField,
  ProfileSection,
  ProfileSectionId,
  ProfileStatus,
} from "@/lib/types";

export function mapDbPersonToPerson(db: DatabasePerson, campStatus?: CampaignStatus): Person {
  return {
    id: db.id,
    firstName: db.first_name,
    lastName: db.last_name,
    fullName: `${db.first_name} ${db.last_name}`.trim(),
    nationalId: `${db.document_type || "CC"} ${db.document_number}`,
    gender: (db.gender as "F" | "M") || "F",
    age: db.age ?? 35,
    city: db.city || "Bucaramanga",
    department: db.department || "Santander",
    employment: (db.employment_status as EmploymentStatus) || "Sin información",
    education: (db.education_level as EducationLevel) || "Sin información",
    characterization: db.characterization_score ?? 0,
    profileStatus: (db.profile_status as ProfileStatus) || "Parcial",
    inclusion: (db.inclusion_information_status as InclusionInfo) || "Pendiente",
    campaignStatus: campStatus || "Sin contactar",
    lastInteraction: {
      date: db.last_interaction_at ? db.last_interaction_at.slice(0, 10) : "2026-09-15",
      channel: "whatsapp",
    },
    memberSince: db.member_since || 2018,
    segment: db.segment || "Ahorro tradicional",
  };
}

export async function fetchPeopleFromDb(): Promise<{ people: Person[]; total: number } | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: peopleData, error: peopleError, count } = await supabase
      .from("people")
      .select("*, campaign_targets(status)", { count: "exact" })
      .order("characterization_score", { ascending: false });

    if (peopleError || !peopleData || peopleData.length === 0) {
      if (peopleError) {
        console.warn("[supabase] Failed to fetch people:", peopleError.message);
      }
      return null;
    }

    const people: Person[] = peopleData.map((row: any) => {
      const campStatus = row.campaign_targets?.[0]?.status as CampaignStatus | undefined;
      return mapDbPersonToPerson(row as DatabasePerson, campStatus);
    });

    return { people, total: count || people.length };
  } catch (err) {
    console.warn("[supabase] fetchPeople error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

const SECTION_TEMPLATE: { id: ProfileSectionId; label: string; fields: { key: string; label: string; critical?: boolean }[] }[] = [
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

export async function fetchPersonProfileFromDb(id: string): Promise<PersonProfile | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: pData, error: pError } = await supabase
      .from("people")
      .select("*, campaign_targets(status)")
      .eq("id", id)
      .single();

    if (pError || !pData) {
      return null;
    }

    const person = mapDbPersonToPerson(pData as DatabasePerson, pData.campaign_targets?.[0]?.status);

    // Fetch attributes
    const { data: attrData } = await supabase
      .from("person_attributes")
      .select("*")
      .eq("person_id", id);

    // Fetch interactions
    const { data: intData } = await supabase
      .from("interactions")
      .select("*")
      .eq("person_id", id)
      .order("created_at", { ascending: false });

    // Fetch consents
    const { data: consentData } = await supabase
      .from("consents")
      .select("*")
      .eq("person_id", id);

    const attrMap = new Map<string, DatabasePersonAttribute>();
    if (attrData) {
      for (const attr of attrData) {
        attrMap.set(attr.attribute_key, attr);
      }
    }

    // Default values derived from person record
    const baseValues: Record<string, string> = {
      fullName: person.fullName,
      nationalId: person.nationalId,
      birthDate: pData.birth_date || `14 mar ${2026 - person.age}`,
      mobile: pData.phone || "+57 315 482 7731",
      email: pData.email || `${person.firstName.toLowerCase()}.${person.lastName.split(" ")[0].toLowerCase()}@correo.co`,
      address: `Cra 27 #45-18, ${person.city}`,
      employmentStatus: person.employment,
      occupation: pData.occupation || (person.employment === "Independiente" ? "Comerciante" : "Sin información"),
      educationLevel: person.education,
      memberSince: String(person.memberSince),
      products: "Cuenta de ahorros, CDAT",
      residence: person.city === "San Gil" ? "Rural" : "Urbana",
    };

    const sections: ProfileSection[] = SECTION_TEMPLATE.map((sec) => ({
      id: sec.id,
      label: sec.label,
      fields: sec.fields.map<ProfileField>((f) => {
        const storedAttr = attrMap.get(f.key);
        if (storedAttr) {
          return {
            key: f.key,
            label: f.label,
            value: storedAttr.attribute_value,
            known: true,
            critical: f.critical,
            source: (storedAttr.source as FieldSource) || "Core financiero",
            confidence: storedAttr.confidence ?? 0.95,
            updatedAt: storedAttr.updated_at ? storedAttr.updated_at.slice(0, 10) : undefined,
            aiCollected: storedAttr.source === "AI_DEMO" || storedAttr.source === "Llamada con IA",
          };
        }

        // Check if we have a base known value
        const val = baseValues[f.key];
        const isAlwaysKnown = f.key === "fullName" || f.key === "nationalId" || f.key === "memberSince";
        const isSpecificKnown = val && val !== "Sin información" && (f.key === "mobile" || f.key === "email" || f.key === "employmentStatus" || f.key === "educationLevel" || f.key === "residence");

        if (isAlwaysKnown || isSpecificKnown) {
          return {
            key: f.key,
            label: f.label,
            value: val || "",
            known: true,
            critical: f.critical,
            source: "Core financiero",
          };
        }

        return {
          key: f.key,
          label: f.label,
          value: val || "Sin información",
          known: false,
          critical: f.critical,
        };
      }),
    }));

    // Interactions
    const interactions: PersonInteraction[] = (intData && intData.length > 0)
      ? intData.map((it: DatabaseInteraction) => ({
          id: it.id,
          date: it.created_at ? it.created_at.slice(0, 10) : "2026-09-01",
          channel: (it.channel.toLowerCase() as Channel | "branch" | "app") || "branch",
          title: it.summary || "Interacción registrada",
          description: it.summary || "Registro de contacto en sistema",
          outcome: "Completada",
        }))
      : [
          {
            id: "i1",
            date: "2026-08-16",
            channel: "branch",
            title: "Visita a oficina — Sede Cabecera",
            description: "Renovación de CDAT y consulta de estado de cuenta.",
            outcome: "Completada",
          },
        ];

    // Documents
    const hasConsent = consentData?.some((c: DatabaseConsent) => c.status === "Otorgada");
    const documents: PersonDocument[] = [
      { id: "d1", name: "Cédula de ciudadanía", type: "Identidad", status: "Verificado", updatedAt: "2023-10-15" },
      { id: "d2", name: "Acuerdo de vinculación", type: "Contrato", status: "Verificado", updatedAt: "2023-10-15" },
      {
        id: "d3",
        name: "Autorización de tratamiento de datos (Ley 1581)",
        type: "Autorización",
        status: hasConsent ? "Verificado" : "Pendiente",
        updatedAt: hasConsent ? "2026-01-10" : undefined,
      },
      { id: "d4", name: "Certificado de ingresos", type: "Financiero", status: "Verificado", updatedAt: "2025-04-12" },
      { id: "d5", name: "RUT — Registro Único Tributario", type: "Tributario", status: "Pendiente" },
    ];

    return {
      person,
      phone: pData.phone || "+57 315 482 7731",
      email: pData.email || `${person.firstName.toLowerCase()}@correo.co`,
      sections,
      interactions,
      documents,
      products: ["Cuenta de ahorros", "CDAT 180 días"],
      riskSignals: person.characterization < 70 ? ["El perfil tiene campos críticos sin verificar"] : [],
    };
  } catch (err) {
    console.warn("[supabase] fetchPersonProfile error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function fetchCampaignsFromDb(): Promise<DatabaseCampaign[] | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data as DatabaseCampaign[];
  } catch {
    return null;
  }
}
