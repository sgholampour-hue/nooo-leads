import { AppSidebar } from "@/components/AppSidebar";
import { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-4 pt-14 sm:p-6 sm:pt-14 lg:pt-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
