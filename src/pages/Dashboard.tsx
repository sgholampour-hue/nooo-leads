import { Building2, AlertCircle, Mail, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { allLeads, notes } = useLeadsContext();
  const navigate = useNavigate();

  const totalLeads = allLeads.length;
  const urgentLeads = allLeads.filter(l => l.urgency_score >= 90).length;
  const withEmail = allLeads.filter(l => l.cfo_email).length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentLeads = allLeads.filter(l => l.created_at >= sevenDaysAgo).length;

  // Chart data: leads by expiration year
  const yearCounts: Record<string, number> = {};
  allLeads.forEach(l => {
    const yr = l.expiration_year || "Unknown";
    yearCounts[yr] = (yearCounts[yr] || 0) + 1;
  });
  const chartData = Object.entries(yearCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  const getBarColor = (year: string) => {
    const y = parseInt(year);
    const current = new Date().getFullYear();
    if (isNaN(y)) return "hsl(var(--muted-foreground))";
    if (y <= current) return "hsl(var(--destructive))";
    if (y <= current + 1) return "hsl(var(--warning))";
    return "hsl(var(--success))";
  };

  // Recent notes across all leads
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(note => {
      const lead = allLeads.find(l => l.id === note.lead_id);
      return { ...note, bedrijfsnaam: lead?.bedrijfsnaam || "Onbekend" };
    });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overzicht van alle vastgoed leads</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Totaal Leads" value={totalLeads} icon={<Building2 className="h-5 w-5" />} />
          <StatCard title="Hoge Urgentie" value={urgentLeads} icon={<AlertCircle className="h-5 w-5" />} subtitle="Expireert ≤ dit jaar" />
          <StatCard title="Met Email" value={withEmail} icon={<Mail className="h-5 w-5" />} subtitle={`${totalLeads > 0 ? Math.round(withEmail / totalLeads * 100) : 0}% bereikbaar`} />
          <StatCard title="Nieuw (7d)" value={recentLeads} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Leads per Expiratie Jaar</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.year)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Recente Activiteit</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentNotes.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">Nog geen activiteit</p>
              )}
              {recentNotes.map(note => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/leads/${note.lead_id}`)}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{note.bedrijfsnaam}</p>
                    <p className="text-xs text-muted-foreground truncate">{note.note_text}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(note.created_at).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
