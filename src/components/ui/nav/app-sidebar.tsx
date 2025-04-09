"use client";

import * as React from "react";
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/ui/nav/nav-main";
import { NavProjects } from "@/components/ui/nav/nav-projects";
import { NavUser } from "@/components/ui/nav/nav-user";
import { TeamSwitcher } from "@/components/ui/nav/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

// This is sample data.
const data = {
  defaultUser: {
    name: "کاربر مهمان",
    email: "guest@example.com",
    avatar: "/avatars/default.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "اطلاعات اولیه",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "اطلاعات مدرسه/آموزشکاه",
          url: "/admin/schools",
          system: "school",
          requiredPermission: "show",
        },
        {
          title: "دانش آموزان",
          url: "/admin/students",
          system: "student",
          requiredPermission: "show",
        },
        {
          title: "معلمان",
          url: "/admin/teachers",
          system: "teacher",
          requiredPermission: "show",
        },
      ],
    },

    {
      title: "اطلاعات پایه",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "تعریف دروس",
          url: "/admin/courses",
          system: "courses",
          requiredPermission: "show",
        },
        {
          title: "تعریف کلاس ها",
          url: "/admin/classes",
          system: "classes",
          requiredPermission: "show",
        },
      ],
    },

    {
      title: "امکانات",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "دفتر کلاسی",
          url: "/admin/classsheet",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "گزارش نمرات ماهانه",
          url: "/admin/monthlygrade",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "گزارش نمرات سالانه",
          url: "/admin/monthgradeall",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "فرم ها",
          url: "/admin/forms",
          system: "importstudents",
          requiredPermission: "show",
        },
        ,
        {
          title: "پرینت",
          url: "/admin/prints",
          system: "importstudents",
          requiredPermission: "show",
        },
        ,
        {
          title: "کویری",
          url: "/admin/query",
          system: "importstudents",
          requiredPermission: "show",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasPermission } = useAuth();

  // Filter navigation items based on permissions
  const filteredNavMain = React.useMemo(() => {
    if (!user) return [];
    // console.log("uu", user);
    return data.navMain
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          hasPermission(item.system, item.requiredPermission)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [user, hasPermission]);

  // Convert auth user to NavUser format
  const navUser = React.useMemo(() => {
    if (!user) return data.defaultUser;

    return {
      name: user.name,
      email: user.username + "@school.com", // Using username as email since we don't have email
      avatar: "/avatars/default.jpg", // Using default avatar since we don't have avatars
    };
  }, [user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
