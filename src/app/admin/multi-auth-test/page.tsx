"use client";

import { useState } from "react";
import { useMultiAuth } from "@/hooks/useMultiAuth";
import { LoginDialog } from "@/components/ui/login-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, UserRound, BookOpenCheck, Plus, X } from "lucide-react";

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

export default function MultiAuthTestPage() {
  const {
    users,
    activeUser,
    addUser,
    switchUser,
    removeUser,
    isLoading,
    error,
  } = useMultiAuth();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [switchingUser, setSwitchingUser] = useState<string | null>(null);

  const handleLogin = async (credentials: {
    userType: "school" | "teacher" | "student";
    schoolCode: string;
    username: string;
    password: string;
  }) => {
    await addUser(credentials);
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      setSwitchingUser(userId);
      await switchUser(userId);
      // Note: Will redirect to dashboard after successful switch, so setSwitchingUser(null) is not needed
    } catch (error) {
      console.error("Failed to switch user:", error);
      setSwitchingUser(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(userId);
    } catch (error) {
      console.error("Failed to remove user:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">تست سیستم چند کاربره</h1>
        <p className="text-gray-600">
          این صفحه برای تست قابلیت ورود و جابجایی بین کاربران مختلف طراحی شده
          است
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          خطا: {error}
        </div>
      )}

      {/* Active User */}
      {activeUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>کاربر فعال</span>
              <Badge variant="default">فعال</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {(() => {
                const UserIcon = getUserIcon(activeUser.userType);
                return <UserIcon className="h-8 w-8 text-blue-500" />;
              })()}
              <div>
                <h3 className="font-semibold">{activeUser.name}</h3>
                <p className="text-sm text-gray-600">
                  {getUserTypeLabel(activeUser.userType)} -{" "}
                  {activeUser.schoolCode}
                </p>
                <p className="text-xs text-gray-500">
                  نام کاربری: {activeUser.username}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>لیست کاربران ({users.length})</span>
            <Button
              onClick={() => setShowLoginDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              افزودن کاربر
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ کاربری وارد نشده است
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const UserIcon = getUserIcon(user.userType);
                const isActive = user.id === activeUser?.id;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActive
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-6 w-6 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-gray-600">
                          {getUserTypeLabel(user.userType)} - {user.schoolCode}
                        </p>
                      </div>
                      {isActive && (
                        <Badge variant="default" className="mr-2">
                          فعال
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <Button
                          onClick={() => handleSwitchUser(user.id)}
                          size="sm"
                          variant="outline"
                          disabled={switchingUser === user.id}
                        >
                          {switchingUser === user.id
                            ? "در حال جابجایی..."
                            : "انتخاب"}
                        </Button>
                      )}
                      {users.length > 1 && (
                        <Button
                          onClick={() => handleRemoveUser(user.id)}
                          size="sm"
                          variant="destructive"
                          className="p-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Dialog */}
      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLogin={handleLogin}
      />
    </div>
  );
}
