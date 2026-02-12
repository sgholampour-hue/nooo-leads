import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
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

    const GOOGLE_SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY");
    if (!GOOGLE_SHEETS_API_KEY) throw new Error("GOOGLE_SHEETS_API_KEY not set");

    const GOOGLE_SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID");
    if (!GOOGLE_SHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all data from Sheet1
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Leads?key=${GOOGLE_SHEETS_API_KEY}`;
    const res = await fetch(sheetUrl);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Sheets API error [${res.status}]: ${errText}`);
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

    console.log("Normalized headers:", JSON.stringify(headers));

    // Map column indices
    const col = (name: string) => headers.indexOf(name);

    const leadsToUpsert = dataRows.map((row, idx) => {
      const get = (name: string) => {
        const i = col(name);
        return i >= 0 && i < row.length ? row[i]?.trim() || "" : "";
      };

      const kvkStr = get("kvk_number");
      const kvkNum = kvkStr ? parseInt(kvkStr, 10) : null;

      return {
        kvk_number: isNaN(kvkNum as number) ? null : kvkNum,
        bedrijfsnaam: get("bedrijfsnaam") || `Unknown ${idx}`,
        website: get("website"),
        office_address: get("office_address"),
        relocation_start: get("relocation_start"),
        expiration_year: get("expiration_year"),
        lease_duration: get("lease_duration"),
        linkedin_page: get("linkedin_page"),
        cfo_email: get("cfo_email"),
        snippet: get("snippet"),
        gevonden_op: get("gevonden_op") || new Date().toISOString(),
        sheet_row_index: idx + 2, // 1-indexed header + data
        is_archived: false,
      };
    });

    // Filter out rows without bedrijfsnaam
    const validLeads = leadsToUpsert.filter(l => l.bedrijfsnaam && !l.bedrijfsnaam.startsWith("Unknown"));

    // Upsert using sheet_row_index as the unique key
    let synced = 0;
    for (const lead of validLeads) {
      // Try to find existing by kvk_number first, then sheet_row_index
      const { data: existing } = lead.kvk_number
        ? await supabase.from("leads").select("id").eq("kvk_number", lead.kvk_number).maybeSingle()
        : await supabase.from("leads").select("id").eq("sheet_row_index", lead.sheet_row_index).maybeSingle();

      if (existing) {
        const { error } = await supabase.from("leads").update(lead).eq("id", existing.id);
        if (error) console.error("Update error:", error);
        else synced++;
      } else {
        const { error } = await supabase.from("leads").insert(lead);
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
    return new Response(
      JSON.stringify({ error: "Sync failed. Check server logs for details." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
