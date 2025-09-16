"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Navigation data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Bot,
      items: [
        {
          title: "All Projects",
          url: "/projects",
        },
        {
          title: "Create New",
          url: "/projects/new",
        },
      ],
    },
    {
      title: "Organization",
      url: "/organization",
      icon: BookOpen,
      items: [
        {
          title: "Members",
          url: "/organization/members",
        },
        {
          title: "Invitations",
          url: "/organization/invitations",
        },
        {
          title: "Settings",
          url: "/organization/settings",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "Subscription",
          url: "/settings/subscription",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Getting Started",
      url: "/projects/getting-started",
      icon: Frame,
    },
    {
      name: "Analytics Dashboard",
      url: "/projects/analytics",
      icon: PieChart,
    },
    {
      name: "API Integration",
      url: "/projects/api",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
