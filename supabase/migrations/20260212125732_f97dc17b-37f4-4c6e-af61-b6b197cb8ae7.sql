
-- Drop all existing permissive public policies on leads
DROP POLICY IF EXISTS "Allow public delete on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public read access on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update on leads" ON public.leads;
DROP POLICY IF EXISTS "Allow service role full access on leads" ON public.leads;

-- Drop all existing permissive public policies on lead_notes
DROP POLICY IF EXISTS "Allow public delete on lead_notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Allow public insert on lead_notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Allow public read access on lead_notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Allow public update on lead_notes" ON public.lead_notes;

-- Drop all existing permissive public policies on lead_status_history
DROP POLICY IF EXISTS "Allow public delete on lead_status_history" ON public.lead_status_history;
DROP POLICY IF EXISTS "Allow public insert on lead_status_history" ON public.lead_status_history;
DROP POLICY IF EXISTS "Allow public read on lead_status_history" ON public.lead_status_history;
DROP POLICY IF EXISTS "Allow public update on lead_status_history" ON public.lead_status_history;

-- leads: authenticated users only
CREATE POLICY "Authenticated users can read leads"
  ON public.leads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (true);

-- lead_notes: authenticated users only
CREATE POLICY "Authenticated users can read lead_notes"
  ON public.lead_notes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lead_notes"
  ON public.lead_notes FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead_notes"
  ON public.lead_notes FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete lead_notes"
  ON public.lead_notes FOR DELETE TO authenticated
  USING (true);

-- lead_status_history: authenticated users only
CREATE POLICY "Authenticated users can read lead_status_history"
  ON public.lead_status_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert lead_status_history"
  ON public.lead_status_history FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update lead_status_history"
  ON public.lead_status_history FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete lead_status_history"
  ON public.lead_status_history FOR DELETE TO authenticated
  USING (true);
