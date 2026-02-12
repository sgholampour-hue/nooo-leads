import { useState, useEffect, useCallback } from "react";
import { Lead, LeadWithStats, LeadNote, LeadStatusHistory, LeadFilters } from "@/types/leads";
import { mockLeads, mockNotes, mockStatusHistory } from "@/data/mockLeads";
import { calculateUrgency } from "@/lib/urgency";

const LEADS_KEY = "nooo_leads";
const NOTES_KEY = "nooo_notes";
const STATUS_KEY = "nooo_status_history";

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useLeads() {
  const [leads, setLeadsRaw] = useState<Lead[]>(() => loadFromStorage(LEADS_KEY, mockLeads));
  const [notes, setNotesRaw] = useState<LeadNote[]>(() => loadFromStorage(NOTES_KEY, mockNotes));
  const [statusHistory, setStatusHistoryRaw] = useState<LeadStatusHistory[]>(() => loadFromStorage(STATUS_KEY, mockStatusHistory));
  const [filters, setFilters] = useState<LeadFilters>({ search: "", year: "all", urgency: "all" });

  const setLeads = useCallback((data: Lead[]) => { setLeadsRaw(data); saveToStorage(LEADS_KEY, data); }, []);
  const setNotes = useCallback((data: LeadNote[]) => { setNotesRaw(data); saveToStorage(NOTES_KEY, data); }, []);
  const setStatusHistory = useCallback((data: LeadStatusHistory[]) => { setStatusHistoryRaw(data); saveToStorage(STATUS_KEY, data); }, []);

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

  const addLead = (lead: Omit<Lead, "id" | "created_at" | "updated_at" | "gevonden_op">) => {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      gevonden_op: new Date().toISOString(),
    };
    setLeads([...leads, newLead]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(leads.map(l => l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l));
  };

  const deleteLead = (id: string) => {
    setLeads(leads.filter(l => l.id !== id));
    setNotes(notes.filter(n => n.lead_id !== id));
    setStatusHistory(statusHistory.filter(s => s.lead_id !== id));
  };

  return {
    leads: filteredLeads,
    allLeads: leadsWithStats,
    notes,
    statusHistory,
    filters,
    setFilters,
    addLead,
    updateLead,
    deleteLead,
    setNotes,
    setStatusHistory,
  };
}
