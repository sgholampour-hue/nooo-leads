import { useLeadsContext } from "@/contexts/LeadsContext";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Archive as ArchiveIcon } from "lucide-react";

export default function Archive() {
  return (
    <AppLayout>
      <PageTransition className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Archief</h1>
          <p className="text-muted-foreground text-xs mt-1">Gearchiveerde leads en afgesloten deals.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ArchiveIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-bold text-foreground mb-1">Geen gearchiveerde leads</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Wanneer je leads archiveert, verschijnen ze hier. Archiveer leads vanaf de lead detailpagina.
          </p>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
