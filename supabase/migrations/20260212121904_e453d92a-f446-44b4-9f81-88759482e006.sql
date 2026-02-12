
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kvk_number BIGINT,
  bedrijfsnaam TEXT NOT NULL,
  website TEXT DEFAULT '',
  office_address TEXT DEFAULT '',
  relocation_start TEXT DEFAULT '',
  expiration_year TEXT DEFAULT '',
  lease_duration TEXT DEFAULT '',
  linkedin_page TEXT DEFAULT '',
  cfo_email TEXT DEFAULT '',
  snippet TEXT DEFAULT '',
  gevonden_op TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sheet_row_index INTEGER,
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS (public read for now since no auth)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no auth in this app)
CREATE POLICY "Allow public read access on leads"
  ON public.leads FOR SELECT
  USING (true);

-- Allow service role to insert/update (edge function uses service role)
CREATE POLICY "Allow service role full access on leads"
  ON public.leads FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create lead_notes table
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by TEXT DEFAULT 'Gebruiker',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note_type TEXT DEFAULT 'general',
  is_pinned BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on lead_notes"
  ON public.lead_notes FOR SELECT USING (true);

CREATE POLICY "Allow public insert on lead_notes"
  ON public.lead_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on lead_notes"
  ON public.lead_notes FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on lead_notes"
  ON public.lead_notes FOR DELETE USING (true);

-- Create lead_status_history table
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new',
  changed_by TEXT DEFAULT 'Systeem',
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT DEFAULT ''
);

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on lead_status_history"
  ON public.lead_status_history FOR SELECT USING (true);

CREATE POLICY "Allow public insert on lead_status_history"
  ON public.lead_status_history FOR INSERT WITH CHECK (true);

-- Create index on kvk_number for upsert matching
CREATE UNIQUE INDEX idx_leads_kvk_number ON public.leads(kvk_number) WHERE kvk_number IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
