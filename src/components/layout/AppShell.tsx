import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopHeader } from "./TopHeader";
import { DemoModeBanner } from "./DemoModeBanner";

interface AppShellProps {
  breadcrumb?: React.ReactNode;
}

export function AppShell({ breadcrumb }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DemoModeBanner />
          <TopHeader breadcrumb={breadcrumb} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
