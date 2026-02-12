import { useState } from "react";
import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { UrgencyBadge } from "@/components/UrgencyBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, MessageSquare, Trash2, Eye, X, ChevronRight } from "lucide-react";
import { getRowUrgencyClass } from "@/lib/urgency";
import { exportToCSV } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface LeadsListProps {
  urgentOnly?: boolean;
}

export default function LeadsList({ urgentOnly = false }: LeadsListProps) {
  const { leads, filters, setFilters, deleteLead } = useLeadsContext();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const displayLeads = urgentOnly ? leads.filter(l => l.urgency_score >= 90) : leads;

  const allSelected = displayLeads.length > 0 && displayLeads.every(l => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayLeads.map(l => l.id)));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Weet je zeker dat je ${selectedIds.size} leads wilt verwijderen?`)) {
      selectedIds.forEach(id => deleteLead(id));
      toast.success(`${selectedIds.size} leads verwijderd`);
      setSelectedIds(new Set());
    }
  };

  const handleBulkExport = () => {
    const selected = displayLeads.filter(l => selectedIds.has(l.id));
    exportToCSV(selected);
    toast.success(`${selected.length} leads geëxporteerd`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) {
      deleteLead(id);
      toast.success(`${name} verwijderd`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {urgentOnly ? "Urgente Leads" : "Alle Leads"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {displayLeads.length} {displayLeads.length === 1 ? "lead" : "leads"} gevonden
            </p>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {someSelected && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-primary/5 border border-primary/20 p-3 rounded-lg">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} geselecteerd
            </span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Verwijderen</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedIds(new Set())}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center bg-card p-3 sm:p-4 rounded-lg border">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek bedrijf, locatie, KvK..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filters.year} onValueChange={(v) => setFilters({ ...filters, year: v })}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Jaar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle jaren</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
                <SelectItem value="unknown">Onbekend</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.urgency} onValueChange={(v) => setFilters({ ...filters, urgency: v })}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Urgentie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle levels</SelectItem>
                <SelectItem value="high">Hoog (90+)</SelectItem>
                <SelectItem value="medium">Middel (50-89)</SelectItem>
                <SelectItem value="low">Laag (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="shrink-0 sm:hidden" onClick={() => exportToCSV(displayLeads)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="hidden sm:flex" onClick={() => exportToCSV(displayLeads)}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Mobile: Card view */}
        {isMobile ? (
          <div className="space-y-2">
            {displayLeads.length === 0 && (
              <p className="text-center py-12 text-muted-foreground">Geen leads gevonden</p>
            )}
            {displayLeads.map(lead => (
              <Card
                key={lead.id}
                className={`p-3.5 cursor-pointer active:scale-[0.99] transition-transform ${selectedIds.has(lead.id) ? "bg-primary/5 border-primary/30" : ""}`}
                onClick={() => navigate(`/leads/${lead.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{lead.bedrijfsnaam}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.office_address}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <UrgencyBadge score={lead.urgency_score} />
                      <span className="text-xs text-muted-foreground">Exp: {lead.expiration_year}</span>
                      {lead.note_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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
          /* Desktop: Table view */
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecteer alles"
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Urgentie</TableHead>
                  <TableHead>Bedrijf</TableHead>
                  <TableHead className="hidden lg:table-cell">Locatie</TableHead>
                  <TableHead>Lease</TableHead>
                  <TableHead className="hidden md:table-cell">Verhuizing</TableHead>
                  <TableHead className="hidden xl:table-cell">Contact</TableHead>
                  <TableHead className="w-[60px]">
                    <MessageSquare className="h-4 w-4" />
                  </TableHead>
                  <TableHead className="w-[80px]">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Geen leads gevonden
                    </TableCell>
                  </TableRow>
                )}
                {displayLeads.map(lead => (
                  <TableRow
                    key={lead.id}
                    className={`cursor-pointer ${getRowUrgencyClass(lead.urgency_score)} ${selectedIds.has(lead.id) ? "bg-primary/5" : ""}`}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(lead.id)}
                        onCheckedChange={() => toggleSelect(lead.id)}
                        aria-label={`Selecteer ${lead.bedrijfsnaam}`}
                      />
                    </TableCell>
                    <TableCell><UrgencyBadge score={lead.urgency_score} /></TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{lead.bedrijfsnaam}</p>
                        <p className="text-xs text-muted-foreground">KvK: {lead.kvk_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{lead.office_address}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{lead.expiration_year}</p>
                      <p className="text-xs text-muted-foreground">{lead.lease_duration}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{lead.relocation_start}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {lead.cfo_email && (
                        <a
                          href={`mailto:${lead.cfo_email}`}
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-primary hover:underline truncate max-w-[120px] block"
                        >
                          {lead.cfo_email}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.note_count > 0 && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {lead.note_count}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/leads/${lead.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(lead.id, lead.bedrijfsnaam)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
