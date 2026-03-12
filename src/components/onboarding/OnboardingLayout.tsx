import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OnboardingSidebar } from "./OnboardingSidebar";

export function OnboardingLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <OnboardingSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background px-4">
            <SidebarTrigger />
            <span className="ml-3 text-sm font-medium text-muted-foreground">Módulo de Onboarding</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
