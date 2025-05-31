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
      title: "مدیریت مالی",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "سیستم حسابداری",
          url: "/admin/accounting",
          system: "school",
          requiredPermission: "show",
        },
      ],
    },

    {
      title: "ارتباطات",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: " ارسال پیامک",
          url: "/admin/sms",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: " 2ارسال پیامک",
          url: "/admin/smssend",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+ارسال پیام الکترونیکی",
          url: "/admin/messages",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "آنلاین چت",
          url: "/admin/mychat",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: " ارسال نوتیفیکیشن",
          url: "/admin/notificationsend",
          system: "importstudents",
          requiredPermission: "show",
        },
      ],
    },

    {
      title: "آزمون ها",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "*تعریف آزمون[آنلاین/حضوری]",
          url: "/admin/exam",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "آزمون های آنلاین",
          url: "/admin/onlineexam",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "  بانک سوالات آنلاین",
          url: "/admin/questionbank",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "*بانک سوالات من",
          url: "/admin/myquestionbank",
          system: "importstudents",
          requiredPermission: "show",
        },
      ],
    },
    {
      title: "آزمون ها",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "+دفتر کلاسی",
          url: "/admin/classsheet",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+دفتر کلاس دانش آموز",
          url: "/admin/studentclasssheet",
          system: "importstudents",
          requiredPermission: "show",
        },

        {
          title: "+گزارش زمان خط",
          url: "/admin/dailytimeline",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+سیستم حسابداری",
          url: "/admin/accounting",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+گزارش نمرات ماهانه",
          url: "/admin/monthlygrade",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+گزارش جدول هفتگی",
          url: "/admin/weeklySchedule",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+رویدادها",
          url: "/admin/agenda",
          system: "importstudents",
          requiredPermission: "show",
        },

        {
          title: " انتشارات",
          url: "/admin/publication",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+گزارش نمرات سالانه",
          url: "/admin/monthlygradeoverall",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+کارنامه ها",
          url: "/admin/reportcards",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+گزارش فعالیت معلمان",
          url: "/admin/teacheractivities",
          system: "importstudents",
          requiredPermission: "show",
        },

        {
          title: "+گزارش حضور و غیاب",
          url: "/admin/presencereport",
          system: "importstudents",
          requiredPermission: "show",
        },

        // {
        //   title: "فرم ها",
        //   url: "/admin/forms",
        //   system: "importstudents",
        //   requiredPermission: "show",
        // },

        {
          title: "+ساخت فرم ها",
          url: "/admin/formbuilder",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "پرینت",
          url: "/admin/prints",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "کویری",
          url: "/admin/query",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "هوش مصنوعی",
          url: "/admin/chatbot7",
          system: "importstudents",
          requiredPermission: "show",
        },

        {
          title: "گروه ها",
          url: "/admin/studentsgroups",
          system: "importstudents",
          requiredPermission: "show",
        },

        {
          title: "+صندوق پیام",
          url: "/admin/inbox",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+بانک فایل ها",
          url: "/admin/fileexplorer",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "+کلاس های آنلاین",
          url: "/admin/onlineclasses",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "کلاس های من",
          url: "/admin/myclass",
          system: "importstudents",
          requiredPermission: "show",
        },
        {
          title: "*گفتگوی آنلاین",
          url: "/admin/chatrooms",
          system: "importstudents",
          requiredPermission: "show",
        },

        {
          title: " گفتگوی شناور",
          url: "/admin/floatingchat",
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
        items: section.items
          .filter(
            (item) =>
              item && hasPermission(item.system, item.requiredPermission)
          )
          .map((item) => ({
            title: item.title,
            url: item.url,
          })),
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
