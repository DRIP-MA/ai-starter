"use client";

import { authClient } from "@/lib/auth-client";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NoOrganization } from "@/components/organization/no-organization";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: organizations, isPending: isLoadingOrgs } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: isLoadingActive } =
    authClient.useActiveOrganization();

  // Show loading state while checking organizations
  if (isLoadingOrgs || isLoadingActive) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-32" />
          <Skeleton className="mx-auto h-10 w-40" />
        </div>
      </div>
    );
  }

  // Show no organization flow if user has no organizations
  if (!organizations || organizations.length === 0) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <NoOrganization />
      </div>
    );
  }

  // Show no organization flow if user has organizations but none is active
  if (!activeOrganization) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <NoOrganization />
      </div>
    );
  }

  // Normal dashboard with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
