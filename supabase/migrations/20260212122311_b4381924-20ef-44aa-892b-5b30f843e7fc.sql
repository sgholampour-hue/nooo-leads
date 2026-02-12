
-- Allow anon users to insert, update, delete leads (internal tool, no auth)
CREATE POLICY "Allow public insert on leads"
ON public.leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on leads"
ON public.leads FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on leads"
ON public.leads FOR DELETE
USING (true);

-- Add update/delete policies for lead_status_history
CREATE POLICY "Allow public update on lead_status_history"
ON public.lead_status_history FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on lead_status_history"
ON public.lead_status_history FOR DELETE
USING (true);
