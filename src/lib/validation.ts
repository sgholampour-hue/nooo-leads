import { z } from "zod";

export const leadSchema = z.object({
  bedrijfsnaam: z.string().min(1, "Bedrijfsnaam is verplicht").max(200, "Bedrijfsnaam mag maximaal 200 tekens zijn"),
  kvk_number: z.union([
    z.number().int().positive().max(99999999, "KvK nummer mag maximaal 8 cijfers zijn"),
    z.null(),
  ]).optional(),
  website: z.string().max(500, "Website mag maximaal 500 tekens zijn").optional().or(z.literal("")),
  cfo_email: z.string().email("Ongeldig e-mailadres").max(255).optional().or(z.literal("")),
  linkedin_page: z.string().max(500, "LinkedIn mag maximaal 500 tekens zijn").optional().or(z.literal("")),
  office_address: z.string().max(500, "Adres mag maximaal 500 tekens zijn").optional().or(z.literal("")),
  expiration_year: z.string().regex(/^\d{4}$/, "Moet een geldig jaar zijn (bijv. 2026)").optional().or(z.literal("")),
  lease_duration: z.string().max(50, "Lease duur mag maximaal 50 tekens zijn").optional().or(z.literal("")),
  relocation_start: z.string().max(50, "Verhuizing start mag maximaal 50 tekens zijn").optional().or(z.literal("")),
  snippet: z.string().max(2000, "Omschrijving mag maximaal 2000 tekens zijn").optional().or(z.literal("")),
});

export const noteSchema = z.object({
  note_text: z.string().min(1, "Notitie mag niet leeg zijn").max(5000, "Notitie mag maximaal 5000 tekens zijn"),
  note_type: z.string().max(50).optional(),
  created_by: z.string().max(100).optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export function validateLead(data: unknown) {
  return leadSchema.safeParse(data);
}

export function validateNote(data: unknown) {
  return noteSchema.safeParse(data);
}
