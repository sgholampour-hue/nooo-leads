export interface Lead {
  id: string;
  kvk_number: number;
  bedrijfsnaam: string;
  website: string;
  office_address: string;
  relocation_start: string;
  expiration_year: string;
  lease_duration: string;
  linkedin_page: string;
  cfo_email: string;
  snippet: string;
  gevonden_op: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  ai_score: number | null;
  ai_reden: string | null;
}

export interface LeadWithStats extends Lead {
  urgency_score: number;
  note_count: number;
  last_note_at: string | null;
  current_status: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note_text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  note_type: string;
  is_pinned: boolean;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  status: string;
  changed_by: string;
  changed_at: string;
  notes: string;
}

export type NoteType = 'general' | 'contact_attempt' | 'meeting' | 'follow_up' | 'proposal';

export interface LeadFilters {
  search: string;
  year: string;
  urgency: string;
}
