export interface DatabaseOrganization {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  created_at: string;
}

export interface DatabasePerson {
  id: string;
  organization_id: string;
  document_type: string;
  document_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  department: string | null;
  employment_status: string | null;
  occupation: string | null;
  education_level: string | null;
  characterization_score: number;
  profile_status: string;
  contactable: boolean;
  inclusion_information_status: string;
  last_interaction_at: string | null;
  member_since: number | null;
  segment: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabasePersonAttribute {
  id: string;
  person_id: string;
  category: string;
  attribute_key: string;
  attribute_value: string;
  source: string | null;
  confidence: number | null;
  verified: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCampaign {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  audience_count: number;
  contacted_count: number;
  responded_count: number;
  completed_count: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCampaignTarget {
  id: string;
  campaign_id: string;
  person_id: string;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInteraction {
  id: string;
  organization_id: string;
  person_id: string;
  campaign_id: string | null;
  channel: string;
  direction: string;
  status: string;
  summary: string | null;
  structured_data: Record<string, unknown> | null;
  ai_generated: boolean;
  created_at: string;
}

export interface DatabaseConsent {
  id: string;
  person_id: string;
  consent_type: string;
  status: string;
  source: string;
  captured_at: string;
  created_at: string;
}
