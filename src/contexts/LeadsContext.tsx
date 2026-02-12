import React, { createContext, useContext } from "react";
import { useLeads } from "@/hooks/useLeads";

type LeadsContextType = ReturnType<typeof useLeads>;

const LeadsContext = createContext<LeadsContextType | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const leadsData = useLeads();
  return <LeadsContext.Provider value={leadsData}>{children}</LeadsContext.Provider>;
}

export function useLeadsContext() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeadsContext must be used within LeadsProvider");
  return ctx;
}
