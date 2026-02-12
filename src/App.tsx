import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LeadsProvider } from "@/contexts/LeadsContext";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import LeadsList from "./pages/LeadsList";
import LeadDetail from "./pages/LeadDetail";
import NewLead from "./pages/NewLead";
import NotFound from "./pages/NotFound";
import Archive from "./pages/Archive";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Laden...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <LeadsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadsList />} />
          <Route path="/leads/urgent" element={<LeadsList urgentOnly />} />
          <Route path="/leads/archive" element={<Archive />} />
          <Route path="/leads/new" element={<NewLead />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </LeadsProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthenticatedApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
