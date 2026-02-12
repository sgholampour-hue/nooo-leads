import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Archive as ArchiveIcon, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Archive() {
  const { archivedLeads, unarchiveLead } = useLeadsContext();
  const navigate = useNavigate();

  const handleUnarchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await unarchiveLead(id);
    toast.success("Lead hersteld uit archief");
  };

  return (
    <AppLayout>
      <PageTransition className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Archief</h1>
          <p className="text-muted-foreground text-xs mt-1">Gearchiveerde leads en afgesloten deals.</p>
        </div>

        {archivedLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ArchiveIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-foreground mb-1">Geen gearchiveerde leads</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Wanneer je leads archiveert, verschijnen ze hier. Archiveer leads vanaf de lead detailpagina.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Bedrijf</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Locatie</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Lease Expiratie</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">Actie</th>
                </tr>
              </thead>
              <tbody>
                {archivedLeads.map((lead, i) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{lead.bedrijfsnaam}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm text-muted-foreground">{lead.office_address}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm font-semibold text-foreground">{lead.expiration_year}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={(e) => handleUnarchive(e, lead.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Herstellen
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
              {archivedLeads.length} gearchiveerde lead{archivedLeads.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </PageTransition>
    </AppLayout>
  );
}
