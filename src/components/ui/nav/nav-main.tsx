"use client";

import { ChevronLeft, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  onToggle,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  onToggle?: (index: number) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>پارس پلاس- اتوماسیون هوشمند آموزشی</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => (
          <Collapsible
            key={item.title}
            asChild
            open={item.isActive}
            onOpenChange={() => {
              if (onToggle) {
                onToggle(index);
              }
            }}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {/* <div className="flex items-end w-full justify-between"> */}
                  {item.icon && <item.icon />}

                  <span className="ml-auto">{item.title}</span>

                  <ChevronLeft className=" transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90" />

                  {/* </div> */}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="border-r">
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a className=" justify-end" href={subItem.url}>
                          <span className="text-blue-400 mr-2">
                            {subItem.title}
                          </span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
