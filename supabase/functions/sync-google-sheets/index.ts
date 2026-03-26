import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Rate Limiting (in-memory, per-instance) ---
// OWASP: Protect against brute-force and abuse on public endpoints
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS_PER_IP = 5; // Max 5 requests per IP per minute
const RATE_LIMIT_MAX_REQUESTS_PER_USER = 10; // Max 10 requests per user per minute

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimiter = new Map<string, RateLimitEntry>();
const userLimiter = new Map<string, RateLimitEntry>();

function checkRateLimit(
  limiter: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = limiter.get(key);

  if (!entry || now >= entry.resetAt) {
    // Window expired or first request — start fresh
    limiter.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    // Over limit — return retry-after in seconds
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipLimiter) {
    if (now >= entry.resetAt) ipLimiter.delete(key);
  }
  for (const [key, entry] of userLimiter) {
    if (now >= entry.resetAt) userLimiter.delete(key);
  }
}, 60_000);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- IP-based rate limiting ---
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const ipCheck = checkRateLimit(ipLimiter, clientIp, RATE_LIMIT_MAX_REQUESTS_PER_IP);
    if (!ipCheck.allowed) {
      const retryAfterSec = Math.ceil(ipCheck.retryAfterMs / 1000);
      return new Response(
        JSON.stringify({ error: "Te veel verzoeken. Probeer het later opnieuw." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    // --- Authenticate the caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- User-based rate limiting (after authentication) ---
    const userId = claimsData.claims.sub as string;
    const userCheck = checkRateLimit(userLimiter, userId, RATE_LIMIT_MAX_REQUESTS_PER_USER);
    if (!userCheck.allowed) {
      const retryAfterSec = Math.ceil(userCheck.retryAfterMs / 1000);
      return new Response(
        JSON.stringify({ error: "Te veel verzoeken. Probeer het later opnieuw." }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    // --- Secrets: all API keys are stored as server-side secrets, never exposed client-side ---
    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY not set");

    const GOOGLE_SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID");
    if (!GOOGLE_SHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all data from Sheet1
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(GOOGLE_SHEET_ID)}/values/Leads?key=${encodeURIComponent(GOOGLE_SHEETS_API_KEY)}`;
    const res = await fetch(sheetUrl);
    if (!res.ok) {
      const errText = await res.text();
      // OWASP: Don't leak internal error details to client
      console.error(`Google Sheets API error [${res.status}]: ${errText}`);
      throw new Error("Failed to fetch data from external source.");
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];
    if (rows.length < 2) {
      return new Response(JSON.stringify({ message: "No data rows found", synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawHeaders = rows[0].map((h: string) => h.trim());
    // Normalize headers: lowercase and replace spaces with underscores
    const headers = rawHeaders.map((h: string) => h.toLowerCase().replace(/\s+/g, '_'));
    const dataRows = rows.slice(1);

    // Map column indices
    const col = (name: string) => headers.indexOf(name);

    // --- Strict input sanitization for each row ---
    // OWASP: Validate and sanitize all external input before database insertion
    const ALLOWED_FIELDS = [
      "kvk_number", "bedrijfsnaam", "website", "office_address",
      "relocation_start", "expiration_year", "lease_duration",
      "linkedin_page", "cfo_email", "snippet", "gevonden_op",
      "sheet_row_index", "is_archived", "ai_score", "ai_reden",
    ];

    const leadsToUpsert = dataRows.map((row, idx) => {
      const get = (name: string) => {
        const i = col(name);
        const val = i >= 0 && i < row.length ? row[i]?.trim() || "" : "";
        return val.substring(0, 2000);
      };

      const kvkStr = get("kvk_number");
      const kvkNum = kvkStr ? parseInt(kvkStr, 10) : null;

      const bedrijfsnaam = get("bedrijfsnaam") || `Unknown ${idx}`;
      const cfo_email = get("cfo_email");
      const expiration_year = get("expiration_year");

      const aiScoreRaw = get("ai_score");
      const aiScore = aiScoreRaw ? parseInt(aiScoreRaw, 10) : null;

      return {
        kvk_number: isNaN(kvkNum as number) || (kvkNum as number) > 99999999 || (kvkNum as number) < 0 ? null : kvkNum,
        bedrijfsnaam: bedrijfsnaam.substring(0, 200),
        website: get("website").substring(0, 500),
        office_address: get("office_address").substring(0, 500),
        relocation_start: get("relocation_start").substring(0, 50),
        expiration_year: /^\d{4}$/.test(expiration_year) ? expiration_year : "",
        lease_duration: get("lease_duration").substring(0, 50),
        linkedin_page: get("linkedin_page").substring(0, 500),
        cfo_email: cfo_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfo_email) ? cfo_email.substring(0, 255) : "",
        snippet: get("snippet"),
        gevonden_op: get("gevonden_op") || new Date().toISOString(),
        sheet_row_index: idx + 2,
        is_archived: false,
        ai_score: !isNaN(aiScore as number) && (aiScore as number) >= 1 && (aiScore as number) <= 10 ? aiScore : null,
        ai_reden: get("ai_reden").substring(0, 1000) || null,
      };
    });

    // Filter out rows without bedrijfsnaam
    const validLeads = leadsToUpsert.filter(l => l.bedrijfsnaam && !l.bedrijfsnaam.startsWith("Unknown"));

    // Upsert using sheet_row_index as the unique key
    let synced = 0;
    for (const lead of validLeads) {
      // Strip any unexpected fields (defense in depth)
      const sanitizedLead: Record<string, unknown> = {};
      for (const key of ALLOWED_FIELDS) {
        if (key in lead) sanitizedLead[key] = (lead as Record<string, unknown>)[key];
      }

      // Try to find existing by kvk_number first, then sheet_row_index
      const { data: existing } = lead.kvk_number
        ? await supabase.from("leads").select("id").eq("kvk_number", lead.kvk_number).maybeSingle()
        : await supabase.from("leads").select("id").eq("sheet_row_index", lead.sheet_row_index).maybeSingle();

      if (existing) {
        const { error } = await supabase.from("leads").update(sanitizedLead).eq("id", existing.id);
        if (error) console.error("Update error:", error);
        else synced++;
      } else {
        const { error } = await supabase.from("leads").insert(sanitizedLead);
        if (error) console.error("Insert error:", error);
        else synced++;
      }
    }

    return new Response(
      JSON.stringify({ message: "Sync complete", synced, total: validLeads.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    // OWASP: Return generic error message, log details server-side only
    return new Response(
      JSON.stringify({ error: "Sync failed. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
