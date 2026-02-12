import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadsContext } from "@/contexts/LeadsContext";

const routeLabels: Record<string, string> = {
  "/": "Overview",
  "/leads": "Database",
  "/leads/urgent": "Priority",
  "/leads/new": "New Lead",
  "/archive": "Archive",
};

export function TopHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { filters, setFilters } = useLeadsContext();

  const label = routeLabels[location.pathname] || "Detail";

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
        <Home className="h-3.5 w-3.5" />
        <span>/</span>
        <span className="text-foreground">{label}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="pl-9 pr-4 py-1.5 bg-muted border border-border rounded-md text-xs focus:ring-1 focus:ring-foreground focus:outline-none w-48 transition-all focus:w-64 focus:bg-card placeholder:text-muted-foreground"
          />
        </div>
        <div className="h-4 w-px bg-border hidden sm:block" />
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors relative text-muted-foreground">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-destructive rounded-full ring-2 ring-card" />
        </button>
        <Button
          size="sm"
          className="text-xs font-medium gap-1.5 shadow-sm"
          onClick={() => navigate("/leads/new")}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
      </div>
    </header>
  );
}
