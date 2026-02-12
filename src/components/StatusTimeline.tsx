import { Card } from "@/components/ui/card";
import { LeadStatusHistory } from "@/types/leads";
import { CheckCircle, Clock, AlertTriangle, Send, Star, Circle } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: typeof Circle; colorClass: string }> = {
  new: { label: "Nieuw", icon: Star, colorClass: "bg-muted text-muted-foreground" },
  contacted: { label: "Gecontacteerd", icon: Send, colorClass: "bg-primary text-primary-foreground" },
  urgent: { label: "Urgent", icon: AlertTriangle, colorClass: "bg-destructive text-destructive-foreground" },
  meeting_planned: { label: "Meeting Gepland", icon: Clock, colorClass: "bg-warning text-warning-foreground" },
  proposal_sent: { label: "Voorstel Verstuurd", icon: Send, colorClass: "bg-primary text-primary-foreground" },
  won: { label: "Gewonnen", icon: CheckCircle, colorClass: "bg-success text-success-foreground" },
  lost: { label: "Verloren", icon: Circle, colorClass: "bg-muted text-muted-foreground" },
};

function getConfig(status: string) {
  return statusConfig[status] || { label: status, icon: Circle, colorClass: "bg-muted text-muted-foreground" };
}

interface StatusTimelineProps {
  history: LeadStatusHistory[];
}

export function StatusTimeline({ history }: StatusTimelineProps) {
  const sorted = [...history].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

  if (sorted.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold text-foreground mb-3">Status Geschiedenis</h3>
        <p className="text-sm text-muted-foreground text-center py-6">Nog geen statuswijzigingen</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-foreground mb-4">Status Geschiedenis</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        <div className="space-y-4">
          {sorted.map((entry, idx) => {
            const config = getConfig(entry.status);
            const Icon = config.icon;
            return (
              <div key={entry.id} className="relative flex gap-4">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{config.label}</p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-0.5">{entry.notes}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.changed_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {entry.changed_by && (
                    <p className="text-xs text-muted-foreground/60 mt-1">door {entry.changed_by}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
