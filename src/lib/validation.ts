import { z } from "zod";

// --- Lead validation schema ---
// OWASP: Schema-based validation with type checks, length limits, format validation
export const leadSchema = z.object({
  bedrijfsnaam: z.string().trim().min(1, "Bedrijfsnaam is verplicht").max(200, "Bedrijfsnaam mag maximaal 200 tekens zijn"),
  kvk_number: z.union([
    z.number().int().positive().max(99999999, "KvK nummer mag maximaal 8 cijfers zijn"),
    z.null(),
  ]).optional(),
  website: z.string().trim().max(500, "Website mag maximaal 500 tekens zijn").optional().or(z.literal("")),
  cfo_email: z.string().trim().email("Ongeldig e-mailadres").max(255).optional().or(z.literal("")),
  linkedin_page: z.string().trim().max(500, "LinkedIn mag maximaal 500 tekens zijn").optional().or(z.literal("")),
  office_address: z.string().trim().max(500, "Adres mag maximaal 500 tekens zijn").optional().or(z.literal("")),
  expiration_year: z.string().regex(/^\d{4}$/, "Moet een geldig jaar zijn (bijv. 2026)").optional().or(z.literal("")),
  lease_duration: z.string().trim().max(50, "Lease duur mag maximaal 50 tekens zijn").optional().or(z.literal("")),
  relocation_start: z.string().trim().max(50, "Verhuizing start mag maximaal 50 tekens zijn").optional().or(z.literal("")),
  snippet: z.string().trim().max(2000, "Omschrijving mag maximaal 2000 tekens zijn").optional().or(z.literal("")),
});

// --- Note validation schema ---
export const noteSchema = z.object({
  note_text: z.string().trim().min(1, "Notitie mag niet leeg zijn").max(5000, "Notitie mag maximaal 5000 tekens zijn"),
  note_type: z.enum(["general", "contact_attempt", "meeting", "follow_up", "proposal"]).optional(),
  created_by: z.string().trim().max(100).optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// --- Allowlisted fields to prevent mass assignment ---
// OWASP: Only permit known fields; reject unexpected properties
const ALLOWED_LEAD_FIELDS = [
  "bedrijfsnaam", "kvk_number", "website", "cfo_email", "linkedin_page",
  "office_address", "expiration_year", "lease_duration", "relocation_start",
  "snippet", "is_archived",
] as const;

/**
 * Validate and sanitize lead data. Returns only allowlisted fields.
 * Rejects unexpected fields to prevent mass assignment attacks.
 */
export function validateLead(data: unknown) {
  const result = leadSchema.safeParse(data);
  if (!result.success) return result;

  // Strip any fields not in the allowlist
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_LEAD_FIELDS) {
    if (key in result.data) {
      sanitized[key] = (result.data as Record<string, unknown>)[key];
    }
  }
  return { success: true as const, data: sanitized as LeadFormData };
}

/**
 * Validate note data with strict type checking.
 */
export function validateNote(data: unknown) {
  return noteSchema.safeParse(data);
}

/**
 * Sanitize a partial lead update. Only allows known fields through.
 */
export function sanitizeLeadUpdate(updates: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_LEAD_FIELDS) {
    if (key in updates) {
      sanitized[key] = updates[key];
    }
  }
  return sanitized;
}
