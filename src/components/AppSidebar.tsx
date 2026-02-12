import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, Users, Bell, Archive, Plus, Menu, X, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLeadsContext } from "@/contexts/LeadsContext";
import noooLogoFull from "@/assets/nooo-logo-full.png";

const navItems = [
  { to: "/", icon: LayoutGrid, label: "Overview" },
  { to: "/leads", icon: Users, label: "Leads Database" },
  { to: "/leads/urgent", icon: Bell, label: "Priority", showBadge: true },
  { to: "/archive", icon: Archive, label: "Archive" },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { allLeads } = useLeadsContext();
  const urgentCount = allLeads.filter(l => l.urgency_score >= 90).length;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <img src={noooLogoFull} alt="No Ordinary Offices" className="h-10" />
        </div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
          Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5 flex-1">
        {navItems.map(item => {
          const isActive = item.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.to) && item.to !== "/";
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
              {item.showBadge && urgentCount > 0 && (
                <span className="ml-auto bg-muted text-muted-foreground text-[10px] py-0.5 px-2 rounded-full font-semibold border border-border">
                  {urgentCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Nooo User</p>
            <p className="text-[10px] text-muted-foreground truncate">Workspace Admin</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-50 bg-card shadow-sm border"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
