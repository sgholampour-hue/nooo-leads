import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, AlertTriangle, Plus, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import noooLogo from "@/assets/nooo-logo.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/leads", icon: Users, label: "Alle Leads" },
  { to: "/leads/urgent", icon: AlertTriangle, label: "Urgent" },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={noooLogo} alt="NOOO Logo" className="h-10 brightness-0 invert" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {navItems.map(item => {
          const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to) && item.to !== "/";
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 space-y-2">
        <NavLink to="/leads/new" onClick={() => setMobileOpen(false)}>
          <Button className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 rounded-lg">
            <Plus className="h-4 w-4" />
            Nieuwe Lead
          </Button>
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-50 bg-card shadow-md border"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex w-60 min-h-screen bg-sidebar text-sidebar-foreground flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
