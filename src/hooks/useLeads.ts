import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadWithStats, LeadNote, LeadStatusHistory, LeadFilters } from "@/types/leads";
import { calculateUrgency } from "@/lib/urgency";
import { validateLead, sanitizeLeadUpdate } from "@/lib/validation";

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [statusHistory, setStatusHistory] = useState<LeadStatusHistory[]>([]);
  const [filters, setFilters] = useState<LeadFilters>({ search: "", year: "all", urgency: "all" });
  const [loading, setLoading] = useState(true);

  // Fetch leads from Supabase
  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching leads:", error);
    else setLeads((data || []) as Lead[]);
  }, []);

  const fetchArchivedLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });
    if (error) console.error("Error fetching archived leads:", error);
    else setArchivedLeads((data || []) as Lead[]);
  }, []);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("lead_notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching notes:", error);
    else setNotes((data || []) as LeadNote[]);
  }, []);

  const fetchStatusHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("lead_status_history")
      .select("*")
      .order("changed_at", { ascending: false });
    if (error) console.error("Error fetching status:", error);
    else setStatusHistory((data || []) as LeadStatusHistory[]);
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchLeads(), fetchArchivedLeads(), fetchNotes(), fetchStatusHistory()]);
      setLoading(false);
    };
    loadAll();

    // Realtime subscription for leads
    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchLeads();
        fetchArchivedLeads();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_notes" }, () => {
        fetchNotes();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lead_status_history" }, () => {
        fetchStatusHistory();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads, fetchArchivedLeads, fetchNotes, fetchStatusHistory]);

  const leadsWithStats: LeadWithStats[] = leads.map(lead => {
    const leadNotes = notes.filter(n => n.lead_id === lead.id);
    const lastStatus = statusHistory
      .filter(s => s.lead_id === lead.id)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];
    return {
      ...lead,
      urgency_score: calculateUrgency(lead.expiration_year),
      note_count: leadNotes.length,
      last_note_at: leadNotes.length > 0 ? leadNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null,
      current_status: lastStatus?.status || "new",
    };
  });

  const filteredLeads = leadsWithStats
    .filter(l => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!l.bedrijfsnaam.toLowerCase().includes(s) && !l.office_address.toLowerCase().includes(s) && !String(l.kvk_number).includes(s)) return false;
      }
      if (filters.year !== "all") {
        if (filters.year === "unknown") { if (l.expiration_year !== "Unknown") return false; }
        else { if (l.expiration_year !== filters.year) return false; }
      }
      if (filters.urgency === "high" && l.urgency_score < 90) return false;
      if (filters.urgency === "medium" && (l.urgency_score < 50 || l.urgency_score >= 90)) return false;
      if (filters.urgency === "low" && l.urgency_score >= 50) return false;
      return true;
    })
    .sort((a, b) => b.urgency_score - a.urgency_score);

  // OWASP: Validate all input before database insertion; strip unexpected fields
  const addLead = async (lead: Omit<Lead, "id" | "created_at" | "updated_at" | "gevonden_op">) => {
    const validation = validateLead(lead);
    if (!validation.success) {
      console.error("Validation failed:", validation);
      return null;
    }
    const insertData = { ...validation.data, gevonden_op: new Date().toISOString() } as any;
    const { data, error } = await supabase.from("leads").insert(insertData).select().single();
    if (error) { console.error("Error adding lead:", error); return null; }
    await fetchLeads();
    return data as Lead;
  };

  // OWASP: Sanitize partial updates to only allow known fields
  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const sanitized = sanitizeLeadUpdate(updates as Record<string, unknown>);
    if (Object.keys(sanitized).length === 0) return;
    const { error } = await supabase.from("leads").update(sanitized).eq("id", id);
    if (error) console.error("Error updating lead:", error);
    else await fetchLeads();
  };

  const deleteLead = async (id: string) => {
    await supabase.from("lead_notes").delete().eq("lead_id", id);
    await supabase.from("lead_status_history").delete().eq("lead_id", id);
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) console.error("Error deleting lead:", error);
    else await fetchLeads();
  };

  const archiveLead = async (id: string) => {
    const { error } = await supabase.from("leads").update({ is_archived: true }).eq("id", id);
    if (error) console.error("Error archiving lead:", error);
    else { await fetchLeads(); await fetchArchivedLeads(); }
  };

  const unarchiveLead = async (id: string) => {
    const { error } = await supabase.from("leads").update({ is_archived: false }).eq("id", id);
    if (error) console.error("Error unarchiving lead:", error);
    else { await fetchLeads(); await fetchArchivedLeads(); }
  };

  const setNotesWithSync = useCallback(async (newNotes: LeadNote[]) => {
    // This is used by useNotes hook - we just refetch
    setNotes(newNotes);
  }, []);

  const setStatusHistoryWithSync = useCallback(async (newHistory: LeadStatusHistory[]) => {
    setStatusHistory(newHistory);
  }, []);

  const archivedLeadsWithStats: LeadWithStats[] = archivedLeads.map(lead => {
    const leadNotes = notes.filter(n => n.lead_id === lead.id);
    const lastStatus = statusHistory
      .filter(s => s.lead_id === lead.id)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];
    return {
      ...lead,
      urgency_score: calculateUrgency(lead.expiration_year),
      note_count: leadNotes.length,
      last_note_at: leadNotes.length > 0 ? leadNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null,
      current_status: lastStatus?.status || "new",
    };
  });

  return {
    leads: filteredLeads,
    allLeads: leadsWithStats,
    archivedLeads: archivedLeadsWithStats,
    notes,
    statusHistory,
    filters,
    setFilters,
    addLead,
    updateLead,
    deleteLead,
    archiveLead,
    unarchiveLead,
    setNotes: setNotesWithSync,
    setStatusHistory: setStatusHistoryWithSync,
    loading,
    refreshLeads: fetchLeads,
  };
}
