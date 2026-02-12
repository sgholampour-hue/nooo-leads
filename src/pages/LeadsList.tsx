import { useState } from "react";
import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Mail, MessageSquare, SlidersHorizontal } from "lucide-react";
import { exportToCSV } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { motion } from "framer-motion";

interface LeadsListProps {
  urgentOnly?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-destructive font-bold";
  if (score >= 70) return "text-warning font-bold";
  if (score >= 50) return "text-foreground font-medium";
  if (score > 0) return "text-muted-foreground";
  return "text-muted-foreground";
}

function extractCity(address: string) {
  const parts = address.split(",");
  if (parts.length >= 2) {
    // Get last part, trim, remove postal code
    const last = parts[parts.length - 1].trim();
    return last.replace(/^\d{4}\s*[A-Z]{0,2}\s*/, "");
  }
  return address;
}

function extractStreet(address: string) {
  const parts = address.split(",");
  return parts[0]?.trim() || address;
}

function extractDomain(website: string) {
  try {
    const url = new URL(website);
    return url.hostname.replace("www.", "");
  } catch {
    return website;
  }
}

export default function LeadsList({ urgentOnly = false }: LeadsListProps) {
  const { leads, filters, setFilters } = useLeadsContext();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const displayLeads = urgentOnly ? leads.filter(l => l.urgency_score >= 90) : leads;

  return (
    <AppLayout>
      <PageTransition className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              {urgentOnly ? "Priority" : "Leads Database"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter records..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 pr-4 py-1.5 bg-muted border border-border rounded-md text-xs focus:ring-1 focus:ring-foreground focus:outline-none w-48 focus:bg-card placeholder:text-muted-foreground"
              />
            </div>
            <Select value={filters.urgency} onValueChange={(v) => setFilters({ ...filters, urgency: v })}>
              <SelectTrigger className="w-[130px] h-8 text-xs border-border">
                <SelectValue placeholder="Urgency: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Urgency: All</SelectItem>
                <SelectItem value="high">High (90+)</SelectItem>
                <SelectItem value="medium">Medium (50-89)</SelectItem>
                <SelectItem value="low">Low (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => exportToCSV(displayLeads)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile: Card view */}
        {isMobile ? (
          <div className="space-y-2">
            {/* Mobile search */}
            <div className="relative sm:hidden mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter records..."
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-md text-xs focus:ring-1 focus:ring-foreground focus:outline-none focus:bg-card placeholder:text-muted-foreground"
              />
            </div>
            {displayLeads.length === 0 && (
              <p className="text-center py-12 text-muted-foreground text-sm">No leads found</p>
            )}
            {displayLeads.map(lead => (
              <Card
                key={lead.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                onClick={() => navigate(`/leads/${lead.id}`)}
              >
                <div className="flex items-start gap-3">
                  <span className={`text-sm tabular-nums ${getScoreColor(lead.urgency_score)} shrink-0 w-8`}>
                    {lead.urgency_score > 0 ? lead.urgency_score : "—"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{lead.bedrijfsnaam}</p>
                    <p className="text-[10px] text-muted-foreground">{extractDomain(lead.website)}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{extractCity(lead.office_address)}</span>
                      <span className="font-semibold text-foreground">{lead.expiration_year}</span>
                      {lead.note_count > 0 && (
                        <span className="ml-auto flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {lead.note_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Desktop: Table */
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lease Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 hidden xl:table-cell">Contact</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">Notes</th>
                </tr>
              </thead>
              <tbody>
                {displayLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
                      No leads found
                    </td>
                  </tr>
                )}
                {displayLeads.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="px-5 py-4">
                      <span className={`text-sm tabular-nums ${getScoreColor(lead.urgency_score)}`}>
                        {lead.urgency_score > 0 ? lead.urgency_score : "—"}
                        {lead.urgency_score >= 90 && " 🔥"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{lead.bedrijfsnaam}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{extractDomain(lead.website)}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-sm text-foreground">{extractStreet(lead.office_address)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{extractCity(lead.office_address)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-foreground">{lead.expiration_year}</p>
                      <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{lead.lease_duration.toUpperCase().replace("JAAR", "Y").replace(" ", "")} LEASE</p>
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell" onClick={e => e.stopPropagation()}>
                      {lead.cfo_email ? (
                        <a href={`mailto:${lead.cfo_email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Mail className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground/30 text-[10px] italic">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {lead.note_count > 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-xs font-medium text-foreground">
                          {lead.note_count}
                        </span>
                      ) : null}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
              <span>Showing 1-{displayLeads.length} of {displayLeads.length}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs h-7" disabled>Prev</Button>
                <Button variant="outline" size="sm" className="text-xs h-7" disabled>Next</Button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </AppLayout>
  );
}
