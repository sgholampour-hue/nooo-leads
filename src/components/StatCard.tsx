import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
  trend?: string;
}

export function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-success font-medium mt-1">{trend}</p>}
      </div>
    </Card>
  );
}
