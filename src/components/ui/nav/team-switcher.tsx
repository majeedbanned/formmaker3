"use client";

import * as React from "react";
import {
  ChevronsUpDown,
  Plus,
  School,
  UserRound,
  BookOpenCheck,
  X,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMultiAuth } from "@/hooks/useMultiAuth";
import { LoginDialog } from "@/components/ui/login-dialog";

// Map user types to icons
const getUserIcon = (userType: string) => {
  switch (userType) {
    case "school":
      return School;
    case "teacher":
      return UserRound;
    case "student":
      return BookOpenCheck;
    default:
      return UserRound;
  }
};

// Map user types to Persian labels
const getUserTypeLabel = (userType: string) => {
  switch (userType) {
    case "school":
      return "مدرسه";
    case "teacher":
      return "معلم";
    case "student":
      return "دانش آموز";
    default:
      return "کاربر";
  }
};

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { users, activeUser, addUser, switchUser, removeUser } = useMultiAuth();
  const [showLoginDialog, setShowLoginDialog] = React.useState(false);
  const [switchingUserId, setSwitchingUserId] = React.useState<string | null>(
    null
  );
  const [deletingUserId, setDeletingUserId] = React.useState<string | null>(
    null
  );

  if (!activeUser) {
    return null;
  }

  const UserIcon = getUserIcon(activeUser.userType);

  const handleLogin = async (credentials: {
    userType: "school" | "teacher" | "student";
    schoolCode: string;
    username: string;
    password: string;
  }) => {
    await addUser(credentials);
  };

  const handleRemoveUser = async (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (deletingUserId === userId) return; // Prevent multiple clicks

    setDeletingUserId(userId);
    try {
      await removeUser(userId);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <UserIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeUser.name}
                  </span>
                  <span className="truncate text-xs">
                    {getUserTypeLabel(activeUser.userType)}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Users Lists
              </DropdownMenuLabel>
              {users.map((user) => {
                const UserItemIcon = getUserIcon(user.userType);
                const isActive = user.id === activeUser.id;
                return (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => {
                      if (!isActive && switchingUserId !== user.id) {
                        setSwitchingUserId(user.id);
                        switchUser(user.id).catch(() =>
                          setSwitchingUserId(null)
                        );
                      }
                    }}
                    className={`gap-2 p-2 ${
                      isActive ? "bg-accent" : ""
                    } relative group ${
                      switchingUserId === user.id || deletingUserId === user.id
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <UserItemIcon className="size-4 shrink-0" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {getUserTypeLabel(user.userType)}
                      </div>
                    </div>
                    {users.length > 1 && (
                      <button
                        onClick={(e) => handleRemoveUser(user.id, e)}
                        className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-all z-10 ${
                          deletingUserId === user.id
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                        type="button"
                        disabled={deletingUserId === user.id}
                      >
                        <X className="size-3" />
                      </button>
                    )}
                    {isActive && (
                      <DropdownMenuShortcut>فعال</DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setShowLoginDialog(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  Add user
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLogin={handleLogin}
      />
    </>
  );
}
