export type Channel = "voice" | "whatsapp" | "sms" | "form";

export type EmploymentStatus =
  | "Empleado"
  | "Independiente"
  | "Desempleado"
  | "Pensionado"
  | "Estudiante"
  | "Informal"
  | "Sin información";

export type EducationLevel =
  | "Primaria"
  | "Secundaria"
  | "Técnico"
  | "Tecnólogo"
  | "Profesional"
  | "Posgrado"
  | "Sin información";

export type ProfileStatus =
  | "Completo"
  | "Parcial"
  | "Vacíos críticos"
  | "Actualizado por IA";

export type CampaignStatus =
  | "Sin contactar"
  | "Contactado"
  | "Respondió"
  | "Completado"
  | "No desea participar";

export type InclusionInfo = "Reportada" | "Parcial" | "Pendiente";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalId: string;
  gender: "F" | "M";
  age: number;
  city: string;
  department: string;
  employment: EmploymentStatus;
  education: EducationLevel;
  characterization: number;
  profileStatus: ProfileStatus;
  inclusion: InclusionInfo;
  campaignStatus: CampaignStatus;
  lastInteraction: { date: string; channel: Channel | "branch" | "app" };
  memberSince: number;
  segment: string;
}

export type FieldSource = "Core financiero" | "Vinculación en oficina" | "App móvil" | "Llamada con IA" | "WhatsApp" | "SMS" | "Formulario seguro";

export interface ProfileField {
  key: string;
  label: string;
  value: string;
  known: boolean;
  critical?: boolean;
  source?: FieldSource;
  updatedAt?: string;
  confidence?: number;
  consent?: "Otorgada" | "Pendiente";
  aiCollected?: boolean;
}

export type ProfileSectionId =
  | "personal"
  | "household"
  | "employment"
  | "education"
  | "financial"
  | "social"
  | "inclusion";

export interface ProfileSection {
  id: ProfileSectionId;
  label: string;
  fields: ProfileField[];
}

export interface PersonInteraction {
  id: string;
  date: string;
  channel: Channel | "branch" | "app";
  title: string;
  description: string;
  outcome: "Completada" | "Sin respuesta" | "En progreso" | "Información actualizada";
}

export interface PersonDocument {
  id: string;
  name: string;
  type: string;
  status: "Verificado" | "Pendiente" | "Faltante" | "Vencido";
  updatedAt?: string;
}

export interface PersonProfile {
  person: Person;
  phone: string;
  email: string;
  sections: ProfileSection[];
  interactions: PersonInteraction[];
  documents: PersonDocument[];
  products: string[];
  riskSignals: string[];
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  icon: "users" | "phone" | "gauge" | "alert" | "sparkles" | "refresh" | "target" | "send" | "reply" | "check" | "percent";
  tone?: "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan" | "slate";
}

export interface AiInsight {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "opportunity" | "info";
  metric?: string;
  action?: string;
}

export type AiCampaignState = "Activa" | "Programada" | "Finalizada" | "Borrador" | "En pausa";

export interface AiCampaign {
  id: string;
  name: string;
  objective: string;
  status: AiCampaignState;
  audience: number;
  contacted: number;
  responded: number;
  completed: number;
  channels: Channel[];
  startDate: string;
  endDate: string;
  owner: string;
}

export type InteractionStatus =
  | "Completado"
  | "En progreso"
  | "Sin respuesta"
  | "No desea participar"
  | "Requiere revisión";

export interface CampaignInteraction {
  id: string;
  personId: string;
  personName: string;
  city: string;
  channel: Channel;
  status: InteractionStatus;
  fieldsCollected: number;
  fieldsRequested: number;
  duration: string;
  timestamp: string;
  sentiment: "Positivo" | "Neutral" | "Negativo";
}

export type KnowledgeAreaId = "labor-law" | "social-security" | "osh" | "sergio-flores" | "other";

export interface KnowledgeArea {
  id: KnowledgeAreaId;
  name: string;
  description: string;
  documents: number;
  lastUpdated: string;
  coverage: number;
}

export type DocumentAiStatus = "Indexado" | "Procesando" | "Requiere revisión" | "Error";

export interface KnowledgeDocument {
  id: string;
  title: string;
  area: KnowledgeAreaId;
  source: string;
  format: "PDF" | "DOCX";
  pages: number;
  lastUpdated: string;
  status: DocumentAiStatus;
  description?: string;
  chunkCount?: number;
  fileSize?: number;
  isReal?: boolean;
}

export interface SourceCitation {
  id: string;
  title: string;
  area: KnowledgeAreaId | "population";
  excerpt: string;
  reference: string;
  relevance: number;
  page?: number;
  documentId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "done" | "error";
  createdAt: string;
  dataUsed?: boolean;
  sampleSize?: number;
  sources?: SourceCitation[];
}

export interface LaborAiTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LaborAiRequest {
  question: string;
  history?: LaborAiTurn[];
  includeOrgContext?: boolean;
}

export type LaborAiResponse =
  | {
      answer: string;
      dataUsed?: boolean;
      sampleSize?: number;
      sources?: SourceCitation[];
    }
  | { error: string };


