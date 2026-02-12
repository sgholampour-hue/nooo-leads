import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { FileEdit, CheckCircle, AlertTriangle, MoreHorizontal } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/PageTransition";

export default function Dashboard() {
  const { allLeads, notes } = useLeadsContext();
  const navigate = useNavigate();

  const totalLeads = allLeads.length;
  const urgentLeads = allLeads.filter(l => l.urgency_score >= 90).length;
  const withEmail = allLeads.filter(l => l.cfo_email).length;
  const verifiedPct = totalLeads > 0 ? Math.round((withEmail / totalLeads) * 100) : 0;

  // Chart data: leads by expiration year
  const yearCounts: Record<string, number> = {};
  allLeads.forEach(l => {
    const yr = l.expiration_year || "Unknown";
    if (yr === "Unknown") return;
    const y = parseInt(yr);
    if (y >= 2028) {
      yearCounts["2028+"] = (yearCounts["2028+"] || 0) + 1;
    } else {
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;
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
    if (diffHrs < 48) return "Yesterday";
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  return (
    <AppLayout>
      <PageTransition className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Overview</h1>
            <p className="text-muted-foreground text-xs mt-1">Portfolio performance & incoming signals.</p>
          </div>
          <select className="bg-card border border-border text-xs rounded-md px-3 py-1.5 focus:ring-1 focus:ring-foreground focus:outline-none text-muted-foreground font-medium">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>YTD</option>
          </select>
        </div>

        {/* Stat Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Leads */}
          <StaggerItem>
            <HoverCard className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Total Leads</p>
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
            <HoverCard className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">High Urgency</p>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <h3 className="text-3xl font-display font-bold text-foreground tracking-tight">{urgentLeads}</h3>
              </div>
              <p className="text-destructive text-[10px] font-medium">Requires immediate action</p>
            </HoverCard>
          </StaggerItem>

          {/* Verified */}
          <StaggerItem>
            <HoverCard className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Verified</p>
                </div>
                <h3 className="text-3xl font-display font-bold text-foreground tracking-tight">{verifiedPct}%</h3>
              </div>
              <p className="text-muted-foreground text-[10px]">{withEmail} verified contacts</p>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lease Expirations Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground tracking-tight">Lease Expirations</h3>
                <p className="text-muted-foreground text-xs">Distribution by year</p>
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
                        item.year === chartData[0]?.year
                          ? 'bg-[hsl(152,40%,35%)] group-hover:bg-[hsl(152,40%,30%)]'
                          : 'bg-[hsl(152,30%,65%)] group-hover:bg-[hsl(152,30%,55%)]'
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
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
            <h3 className="font-display font-bold text-lg text-foreground tracking-tight mb-6">Recent Activity</h3>
            <div className="space-y-5 flex-1 overflow-hidden relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-0 w-px bg-border" />

              {recentNotes.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-8">No recent activity</p>
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
                      {note.note_type === 'general' ? 'Note added' :
                       note.note_type === 'contact_attempt' ? 'Contact Attempt' :
                       note.note_type === 'meeting' ? 'Meeting' :
                       note.note_type === 'follow_up' ? 'Follow-up' :
                       note.note_type === 'proposal' ? 'Proposal Sent' : 'Update'}
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
