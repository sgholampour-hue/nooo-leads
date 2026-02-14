import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { FileEdit, CheckCircle, AlertTriangle, MoreHorizontal, RefreshCw, ArrowRight } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/PageTransition";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const { allLeads, notes, statusHistory, refreshLeads } = useLeadsContext();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-google-sheets");
      if (error) throw error;
      toast.success(`Sync voltooid: ${data?.synced || 0} leads gesynchroniseerd`);
      refreshLeads?.();
    } catch (e: any) {
      // Handle rate limiting (429) gracefully
      if (e?.status === 429 || e?.message?.includes("429")) {
        toast.error("Te veel verzoeken. Wacht even en probeer het opnieuw.");
      } else {
        toast.error("Sync mislukt: " + (e.message || "Onbekende fout"));
      }
    } finally {
      setSyncing(false);
    }
  };

  const totalLeads = allLeads.length;
  const urgentLeads = allLeads.filter(l => l.urgency_score >= 90).length;
  const withEmail = allLeads.filter(l => l.cfo_email).length;
  const verifiedPct = totalLeads > 0 ? Math.round((withEmail / totalLeads) * 100) : 0;

  // Chart data: leads by expiration year
  const yearCounts: Record<string, number> = {};
  allLeads.forEach(l => {
    const yr = l.expiration_year || "Unknown";
    if (yr === "Unknown" || yr === "") return;
    const y = parseInt(yr);
    if (isNaN(y)) return;
    if (y >= 2030) {
      yearCounts["2030+"] = (yearCounts["2030+"] || 0) + 1;
    } else if (y >= 2026) {
      yearCounts[String(y)] = (yearCounts[String(y)] || 0) + 1;
    }
  });
  const chartData = Object.entries(yearCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  // Recent notes
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(note => {
      const lead = allLeads.find(l => l.id === note.lead_id);
      return { ...note, bedrijfsnaam: lead?.bedrijfsnaam || "Onbekend" };
    });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 24) {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    if (diffHrs < 48) return "Gisteren";
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  return (
    <AppLayout>
      <PageTransition className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Overzicht</h1>
            <p className="text-muted-foreground text-xs mt-1">Portfolio prestaties & inkomende signalen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md bg-card hover:bg-muted transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Synchroniseren..." : "Synchroniseer"}
            </button>
            <select className="bg-card border border-border text-xs rounded-md px-3 py-1.5 focus:ring-1 focus:ring-foreground focus:outline-none text-muted-foreground font-medium">
              <option>Laatste 30 dagen</option>
              <option>Laatste kwartaal</option>
              <option>Jaar tot nu</option>
            </select>
          </div>
        </div>

        {/* Stat Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Leads */}
          <StaggerItem>
            <HoverCard className="bento-hover bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Totaal Leads</p>
                </div>
                <h3 className="text-3xl font-display font-bold text-foreground tracking-tight">{totalLeads}</h3>
              </div>
              <div className="flex items-center gap-1 text-success bg-success/10 border border-success/20 w-fit px-2 py-0.5 rounded-md text-[10px] font-bold">
                <span>+12.5%</span>
              </div>
            </HoverCard>
          </StaggerItem>

          {/* High Urgency */}
          <StaggerItem>
            <HoverCard className="bento-hover bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Hoge Urgentie</p>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <h3 className="text-3xl font-display font-bold text-foreground tracking-tight">{urgentLeads}</h3>
              </div>
              <p className="text-destructive text-[10px] font-medium">Vereist directe actie</p>
            </HoverCard>
          </StaggerItem>

          {/* Verified */}
          <StaggerItem>
            <HoverCard className="bento-hover bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Geverifieerd</p>
                </div>
                <h3 className="text-3xl font-display font-bold text-foreground tracking-tight">{verifiedPct}%</h3>
              </div>
              <p className="text-muted-foreground text-[10px]">{withEmail} geverifieerde contacten</p>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Pipeline Overview */}
        <PipelineSummary allLeads={allLeads} statusHistory={statusHistory} navigate={navigate} />

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lease Expirations Chart */}
          <div className="lg:col-span-2 bento-hover bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground tracking-tight">Lease Expiraties</h3>
                <p className="text-muted-foreground text-xs">Verdeling per jaar</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            {/* Minimalist Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-6 px-4 pb-2 border-b border-border">
              {chartData.map((item) => (
                <div key={item.year} className="flex flex-col items-center gap-3 flex-1 group">
                  <div className="w-full bg-muted rounded-t-md h-48 relative flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-md transition-colors ${
                        item.count === maxCount
                          ? 'bg-foreground group-hover:bg-foreground/90'
                          : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
                      }`}
                      style={{ height: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{item.year}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bento-hover bg-card border border-border rounded-xl p-6 flex flex-col">
            <h3 className="font-display font-bold text-lg text-foreground tracking-tight mb-6">Recente Activiteit</h3>
            <div className="space-y-5 flex-1 overflow-hidden relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-0 w-px bg-border" />

              {recentNotes.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-8">Geen recente activiteit</p>
              )}

              {recentNotes.map((note, i) => (
                <div
                  key={note.id}
                  className="flex gap-4 relative cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/leads/${note.lead_id}`)}
                >
                  <div className={`w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0 z-10 shadow-sm ${
                    note.note_type === 'contact_attempt' || note.note_type === 'follow_up'
                      ? 'text-foreground'
                      : note.note_type === 'meeting' || note.note_type === 'proposal'
                      ? 'text-foreground'
                      : i === recentNotes.length - 1
                      ? 'text-destructive'
                      : 'text-foreground'
                  }`}>
                    {note.note_type === 'general' ? (
                      <FileEdit className="h-3.5 w-3.5" />
                    ) : note.note_type === 'contact_attempt' || note.note_type === 'meeting' ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-foreground text-xs font-semibold">
                      {note.note_type === 'general' ? 'Notitie toegevoegd' :
                       note.note_type === 'contact_attempt' ? 'Contactpoging' :
                       note.note_type === 'meeting' ? 'Vergadering' :
                       note.note_type === 'follow_up' ? 'Follow-up' :
                       note.note_type === 'proposal' ? 'Voorstel verstuurd' : 'Update'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-foreground/80 font-medium">{note.bedrijfsnaam}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">{formatTime(note.created_at)}</p>

                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}

const PHASES = [
  { key: "lead", label: "Lead", color: "bg-muted" },
  { key: "contact_opgenomen", label: "Contact opgenomen", color: "bg-blue-500" },
  { key: "in_gesprek", label: "In gesprek", color: "bg-amber-500" },
  { key: "afgesloten", label: "Afgesloten", color: "bg-emerald-500" },
] as const;

function getPhaseForStatus(status: string): string {
  if (["contact_opgenomen", "contacted"].includes(status)) return "contact_opgenomen";
  if (["in_gesprek", "in_progress", "meeting", "proposal"].includes(status)) return "in_gesprek";
  if (["afgesloten", "closed", "won", "lost"].includes(status)) return "afgesloten";
  return "lead";
}

function PipelineSummary({ allLeads, statusHistory, navigate }: { allLeads: any[]; statusHistory: any[]; navigate: any }) {
  const activeLeads = allLeads.filter(l => !l.is_archived);
  const counts: Record<string, number> = { lead: 0, contact_opgenomen: 0, in_gesprek: 0, afgesloten: 0 };

  activeLeads.forEach(lead => {
    const lastStatus = statusHistory
      .filter((s: any) => s.lead_id === lead.id)
      .sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())[0];
    const phase = getPhaseForStatus(lastStatus?.status || lead.current_status || "new");
    counts[phase] = (counts[phase] || 0) + 1;
  });

  const total = activeLeads.length || 1;

  return (
    <div
      className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/pipeline")}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-display font-bold text-foreground tracking-tight">Pijplijn</h3>
          <p className="text-muted-foreground text-xs">{activeLeads.length} actieve leads</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      {/* Progress bar */}
      <div className="flex rounded-full h-2.5 overflow-hidden mb-4">
        {PHASES.map(phase => (
          <div
            key={phase.key}
            className={`${phase.color} transition-all`}
            style={{ width: `${(counts[phase.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PHASES.map(phase => (
          <div key={phase.key} className="text-center">
            <p className="text-lg font-display font-bold text-foreground">{counts[phase.key]}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{phase.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
