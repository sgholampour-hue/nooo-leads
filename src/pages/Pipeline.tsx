import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, GripVertical, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LeadWithStats } from "@/types/leads";

/** Pipeline phases in order */
const PHASES = [
  { key: "lead", label: "Lead", color: "bg-muted text-muted-foreground" },
  { key: "contact_opgenomen", label: "Contact opgenomen", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { key: "in_gesprek", label: "In gesprek", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { key: "afgesloten", label: "Afgesloten", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
] as const;

type PhaseKey = typeof PHASES[number]["key"];

function getPhaseForStatus(status: string): PhaseKey {
  if (["contact_opgenomen", "contacted"].includes(status)) return "contact_opgenomen";
  if (["in_gesprek", "in_progress", "meeting", "proposal"].includes(status)) return "in_gesprek";
  if (["afgesloten", "closed", "won", "lost"].includes(status)) return "afgesloten";
  return "lead";
}

export default function Pipeline() {
  const { allLeads, statusHistory, refreshLeads } = useLeadsContext();
  const navigate = useNavigate();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<PhaseKey | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Get unique expiration years for filter
  const activeLeads = allLeads.filter(l => !l.is_archived);
  const years = [...new Set(activeLeads.map(l => l.expiration_year).filter(y => y && y !== "Unknown" && y !== ""))].sort();

  // Apply filters
  const filteredLeads = activeLeads.filter(lead => {
    if (urgencyFilter === "high" && lead.urgency_score < 90) return false;
    if (urgencyFilter === "medium" && (lead.urgency_score < 50 || lead.urgency_score >= 90)) return false;
    if (urgencyFilter === "low" && lead.urgency_score >= 50) return false;
    if (yearFilter !== "all" && lead.expiration_year !== yearFilter) return false;
    return true;
  });

  // Group non-archived leads by pipeline phase
  const grouped: Record<PhaseKey, LeadWithStats[]> = {
    lead: [],
    contact_opgenomen: [],
    in_gesprek: [],
    afgesloten: [],
  };

  filteredLeads.forEach(lead => {
      const phase = getPhaseForStatus(lead.current_status);
      grouped[phase].push(lead);
    });

  // Sort each column by urgency descending
  for (const key of Object.keys(grouped) as PhaseKey[]) {
    grouped[key].sort((a, b) => b.urgency_score - a.urgency_score);
  }

  const moveToPhase = useCallback(async (leadId: string, newPhase: PhaseKey) => {
    // Optimistic: immediately move the lead in UI
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const { error } = await supabase.from("lead_status_history").insert({
      lead_id: leadId,
      status: newPhase,
      changed_by: "Gebruiker",
      notes: `Verplaatst naar ${PHASES.find(p => p.key === newPhase)?.label}`,
    });
    if (error) {
      console.error("Error updating pipeline phase:", error);
      toast.error("Kon fase niet bijwerken");
      return;
    }
    toast.success(`Verplaatst naar ${PHASES.find(p => p.key === newPhase)?.label}`);
    // Realtime subscription will auto-refresh; also trigger manual refresh
    await refreshLeads();
  }, [refreshLeads, allLeads]);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent, phase: PhaseKey) => {
    e.preventDefault();
    setDragOverPhase(phase);
  };

  const handleDragLeave = () => {
    setDragOverPhase(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPhase: PhaseKey) => {
    e.preventDefault();
    setDragOverPhase(null);
    if (!draggedLead) return;

    const lead = allLeads.find(l => l.id === draggedLead);
    if (!lead) return;

    const currentPhase = getPhaseForStatus(lead.current_status);
    if (currentPhase === targetPhase) {
      setDraggedLead(null);
      return;
    }

    await moveToPhase(draggedLead, targetPhase);
    setDraggedLead(null);
  };

  return (
    <AppLayout>
      <PageTransition className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              Pijplijn
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sleep leads tussen fasen om de voortgang bij te houden
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="Urgentie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle urgentie</SelectItem>
                <SelectItem value="high">Hoog (90+)</SelectItem>
                <SelectItem value="medium">Medium (50-89)</SelectItem>
                <SelectItem value="low">Laag (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Jaar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle jaren</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y!}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Phase summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {PHASES.map(phase => (
            <div key={phase.key} className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${phase.color}`}>
                {grouped[phase.key].length}
              </span>
              <span className="text-xs font-medium text-foreground">{phase.label}</span>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <LayoutGroup>
        <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
          {PHASES.map(phase => (
            <div
              key={phase.key}
              className={`flex flex-col rounded-xl border transition-colors ${
                dragOverPhase === phase.key
                  ? "border-foreground/30 bg-accent/50"
                  : "border-border bg-muted/30"
              }`}
              onDragOver={e => handleDragOver(e, phase.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, phase.key)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${phase.color.split(" ")[0]}`} />
                  <span className="text-xs font-semibold text-foreground">{phase.label}</span>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {grouped[phase.key].length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
                {grouped[phase.key].length === 0 && (
                  <p className="text-center text-[10px] text-muted-foreground py-8">
                    Geen leads
                  </p>
                )}
                <AnimatePresence mode="popLayout">
                {grouped[phase.key].map((lead, i) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
                  >
                    <Card
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onDragEnd={() => setDraggedLead(null)}
                     className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
                        draggedLead === lead.id ? "opacity-40 scale-95" : ""
                      } ${
                        lead.urgency_score >= 90 ? "border-l-2 border-l-destructive" :
                        lead.urgency_score >= 70 ? "border-l-2 border-l-warning" :
                        lead.urgency_score >= 50 ? "border-l-2 border-l-primary" : ""
                      }`}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {lead.bedrijfsnaam}
                          </p>
                          {lead.office_address && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {lead.office_address}
                            </p>
                          )}
                      <div className="flex items-center gap-2 mt-2">
                            {lead.urgency_score > 0 && (
                              <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                                lead.urgency_score >= 90 ? "bg-destructive/15 text-destructive" :
                                lead.urgency_score >= 70 ? "bg-warning/15 text-warning" :
                                lead.urgency_score >= 50 ? "bg-primary/15 text-primary" : "text-muted-foreground"
                              }`}>
                                {lead.urgency_score}
                              </span>
                            )}
                            {lead.expiration_year && lead.expiration_year !== "Unknown" && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                {lead.expiration_year}
                              </Badge>
                            )}
                            {lead.note_count > 0 && (
                              <span className="ml-auto flex items-center gap-0.5 text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                <span className="text-[10px]">{lead.note_count}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
        </LayoutGroup>
      </PageTransition>
    </AppLayout>
  );
}
