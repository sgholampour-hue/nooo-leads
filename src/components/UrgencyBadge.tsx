import { Badge } from "@/components/ui/badge";
import { getUrgencyLabel, getUrgencyColor } from "@/lib/urgency";

export function UrgencyBadge({ score }: { score: number }) {
  return (
    <Badge className={`${getUrgencyColor(score)} font-semibold text-xs`}>
      {score > 0 ? `${score} — ${getUrgencyLabel(score)}` : getUrgencyLabel(score)}
    </Badge>
  );
}
