"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Settings, AlertCircle, Key } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

interface PreferencesData {
  allowStudentsToChangeProfile: boolean;
}

interface PasswordChangeData {
  newPassword: string;
  confirmPassword: string;
}

export default function PreferencesPage() {
  const { user, isLoading } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesData>({
    allowStudentsToChangeProfile: false,
  });
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      if (isLoading) return;
      
      if (!user || user.userType !== "school") {
        setError("فقط مدیران مدرسه می‌توانند به تنظیمات دسترسی داشته باشند");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/preferences", {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences || { allowStudentsToChangeProfile: false });
        } else {
          // If no preferences found, use defaults
          setPreferences({ allowStudentsToChangeProfile: false });
        }
      } catch (err) {
        console.error("Error fetching preferences:", err);
        setError("خطا در بارگذاری تنظیمات");
        toast.error("خطا در بارگذاری تنظیمات");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user, isLoading]);

  // Save preferences
  const handleSave = async () => {
    if (!user || user.userType !== "school") return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          preferences,
        }),
      });

      if (response.ok) {
        toast.success("تنظیمات با موفقیت ذخیره شد");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ذخیره تنظیمات");
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError(err instanceof Error ? err.message : "خطا در ذخیره تنظیمات");
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      allowStudentsToChangeProfile: checked,
    }));
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!user || user.userType !== "school") return;

    // Validation
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("لطفاً همه فیلدها را پر کنید");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("رمز عبور جدید و تأیید آن مطابقت ندارند");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);

      const response = await fetch("/api/preferences/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("رمز عبور با موفقیت تغییر کرد");
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در تغییر رمز عبور");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError(err instanceof Error ? err.message : "خطا در تغییر رمز عبور");
      toast.error("خطا در تغییر رمز عبور");
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle password input change
  const handlePasswordInputChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center m-4">
        <h3 className="text-yellow-700 font-medium text-lg mb-2">
          دسترسی نامعتبر
        </h3>
        <p className="text-yellow-600">
          لطفا وارد حساب کاربری خود شوید تا بتوانید به این بخش دسترسی پیدا کنید.
        </p>
      </div>
    );
  }

  if (user.userType !== "school") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
        <h3 className="text-red-700 font-medium text-lg mb-2">
          دسترسی محدود
        </h3>
        <p className="text-red-600">
          فقط مدیران مدرسه می‌توانند به تنظیمات دسترسی داشته باشند.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
        <h3 className="text-red-700 font-medium text-lg mb-2">
          خطا در بارگذاری تنظیمات
        </h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="p-4" dir="rtl">
      <PageHeader
        title="تنظیمات سیستم"
        subtitle="مدیریت تنظیمات عمومی سیستم"
        icon={<Settings className="w-6 h-6" />}
        gradient={true}
      />

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general" className="flex items-center space-x-2 space-x-reverse">
              <Settings className="h-4 w-4" />
              <span>تنظیمات عمومی</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center space-x-2 space-x-reverse">
              <Key className="h-4 w-4" />
              <span>تغییر رمز عبور</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            {/* Main Preferences Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                  <Settings className="h-5 w-5 ml-2 text-blue-600" />
                  تنظیمات دسترسی دانش‌آموزان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Profile Access Setting */}
                <div className="flex items-start space-x-3 space-x-reverse">
                  <Checkbox
                    id="allowStudentsToChangeProfile"
                    checked={preferences.allowStudentsToChangeProfile}
                    onCheckedChange={handleCheckboxChange}
                    className="mt-1"
                  />
                  <div className="space-y-2">
                    <Label
                      htmlFor="allowStudentsToChangeProfile"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      اجازه تغییر اطلاعات پروفایل به دانش‌آموزان
                    </Label>
                    <p className="text-sm text-gray-600">
                      با فعال کردن این گزینه، دانش‌آموزان می‌توانند اطلاعات پروفایل خود را تغییر دهند.
                      در غیر این صورت، فقط مدیران مدرسه قادر به ویرایش اطلاعات دانش‌آموزان خواهند بود.
                    </p>
                  </div>
                </div>

                {/* Information Alert */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>توجه:</strong> این تنظیمات بر روی تمام دانش‌آموزان مدرسه اعمال می‌شود.
                    تغییرات پس از ذخیره فوراً اعمال خواهند شد.
                  </AlertDescription>
                </Alert>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Settings Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-800">
                  خلاصه تنظیمات فعلی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">دسترسی دانش‌آموزان به ویرایش پروفایل:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      preferences.allowStudentsToChangeProfile
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {preferences.allowStudentsToChangeProfile ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                  <Key className="h-5 w-5 ml-2 text-blue-600" />
                  تغییر رمز عبور کاربر مدرسه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Error Alert */}
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">رمز عبور جدید</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                    placeholder="رمز عبور جدید خود را وارد کنید"
                    className="text-right"
                  />
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأیید رمز عبور جدید</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange("confirmPassword", e.target.value)}
                    placeholder="رمز عبور جدید را مجدداً وارد کنید"
                    className="text-right"
                  />
                </div>

                {/* Password Requirements */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>نکات امنیتی:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                      <li>رمز عبور باید حداقل ۶ کاراکتر باشد</li>
                      <li>از ترکیب حروف، اعداد و نمادها استفاده کنید</li>
                      <li>رمز عبور قوی انتخاب کنید تا امنیت حساب شما حفظ شود</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Change Password Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    {changingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

