"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface FormData {
  databaseName: string;
  domain: string;
  schoolCode: string;
  schoolName: string;
  maghta: string;
}

interface DatabaseInfo {
  name: string;
  size: number;
}

interface CreateSchoolResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default function CreateNewSchoolPage() {
  // Login state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Hardcoded password - in production, this should be more secure
  const ADMIN_PASSWORD = "357611123qwe!@#QQ";

  const [formData, setFormData] = useState<FormData>({
    databaseName: "",
    domain: "",
    schoolCode: "",
    schoolName: "",
    maghta: "1",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateSchoolResponse | null>(null);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [deletingDatabase, setDeletingDatabase] = useState<string | null>(null);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (loginPassword === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        setLoginError("");
      } else {
        setLoginError("رمز عبور اشتباه است");
      }
      setLoginLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginPassword("");
    setLoginError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchDatabases = async () => {
    setLoadingDatabases(true);
    try {
      const response = await fetch("/api/admin/list-databases");
      const data = await response.json();
      if (data.success) {
        setDatabases(data.databases);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
    } finally {
      setLoadingDatabases(false);
    }
  };

  const handleDeleteDatabase = async (databaseName: string) => {
    if (!confirm(`آیا از حذف پایگاه داده "${databaseName}" اطمینان دارید؟ این عملیات قابل بازگشت نیست.`)) {
      return;
    }

    setDeletingDatabase(databaseName);
    try {
      const response = await fetch("/api/admin/delete-database", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ databaseName }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchDatabases(); // Refresh the list
        alert("پایگاه داده با موفقیت حذف شد");
      } else {
        alert(`خطا در حذف پایگاه داده: ${data.message}`);
      }
    } catch (error) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setDeletingDatabase(null);
    }
  };

  // Load databases on component mount
  React.useEffect(() => {
    fetchDatabases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.databaseName || !formData.domain || !formData.schoolCode || !formData.schoolName) {
      setResult({
        success: false,
        message: "لطفاً تمام فیلدها را پر کنید"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/create-new-school", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data: CreateSchoolResponse = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form on success
        setFormData({
          databaseName: "",
          domain: "",
          schoolCode: "",
          schoolName: "",
          maghta: "1",
        });
        // Refresh database list
        await fetchDatabases();
      }
    } catch (error) {
      setResult({
        success: false,
        message: "خطا در ارتباط با سرور",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-2xl font-bold">
              ورود به سیستم مدیریت مدارس
            </CardTitle>
            <p className="text-right text-gray-600 mt-2">
              برای دسترسی به این بخش، رمز عبور را وارد کنید
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6" dir="rtl">
              <div className="space-y-2">
                <Label htmlFor="loginPassword" className="text-right">
                  رمز عبور
                </Label>
                <Input
                  id="loginPassword"
                  name="loginPassword"
                  type="password"
                  placeholder="رمز عبور را وارد کنید"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="text-right"
                  disabled={loginLoading}
                />
                {/* <p className="text-sm text-gray-500 text-right">
                  رمز عبور: admin123
                </p> */}
              </div>

              {loginError && (
                <Alert className="border-red-200 bg-red-50">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {loginError}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loginLoading || !loginPassword}
                className="w-full"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  "ورود"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Logout Button */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="text-right"
        >
          خروج از سیستم
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New School Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-2xl font-bold">
              ایجاد مدرسه جدید
            </CardTitle>
            <p className="text-right text-gray-600 mt-2">
              برای ایجاد مدرسه جدید، اطلاعات زیر را وارد کنید. این عملیات یک پایگاه داده جدید ایجاد کرده و جداول اساسی را کپی می‌کند.
            </p>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-right">
                نام مدرسه
              </Label>
              <Input
                id="schoolName"
                name="schoolName"
                type="text"
                placeholder="نام کامل مدرسه را وارد کنید"
                value={formData.schoolName}
                onChange={handleInputChange}
                className="text-right"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="databaseName" className="text-right">
                نام پایگاه داده
              </Label>
              <Input
                id="databaseName"
                name="databaseName"
                type="text"
                placeholder="نام پایگاه داده را وارد کنید"
                value={formData.databaseName}
                onChange={handleInputChange}
                className="text-right"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 text-right">
                نام پایگاه داده باید منحصر به فرد باشد و فقط شامل حروف انگلیسی، اعداد و خط تیره باشد
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain" className="text-right">
                دامنه
              </Label>
              <Input
                id="domain"
                name="domain"
                type="text"
                placeholder="example.com"
                value={formData.domain}
                onChange={handleInputChange}
                className="text-right"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 text-right">
                دامنه‌ای که مدرسه از آن استفاده خواهد کرد
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolCode" className="text-right">
                کد مدرسه
              </Label>
              <Input
                id="schoolCode"
                name="schoolCode"
                type="text"
                placeholder="کد منحصر به فرد مدرسه"
                value={formData.schoolCode}
                onChange={handleInputChange}
                className="text-right"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 text-right">
                کد منحصر به فرد که برای شناسایی مدرسه استفاده می‌شود (همچنین به عنوان نام کاربری و رمز عبور استفاده خواهد شد)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maghta" className="text-right">
                مقطع تحصیلی
              </Label>
              <select
                id="maghta"
                name="maghta"
                value={formData.maghta}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-right"
                disabled={loading}
              >
                <option value="1">ابتدایی</option>
                <option value="2">متوسطه اول</option>
                <option value="3">متوسطه دوم</option>
                <option value="4">پیش دبستانی</option>
                <option value="5">آموزشکاه زبان</option>
              </select>
            </div>

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message}
                    {result.error && (
                      <div className="mt-1 text-sm opacity-75">
                        جزئیات خطا: {result.error}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  در حال ایجاد مدرسه...
                </>
              ) : (
                "ایجاد مدرسه جدید"
              )}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg" dir="rtl">
            <h3 className="font-semibold text-blue-900 mb-2">عملیات انجام شده:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ایجاد پایگاه داده جدید با نام مشخص شده</li>
              <li>• کپی و به‌روزرسانی جدول schools با اطلاعات وارد شده</li>
              <li>• کپی جدول adminsystemmenues همراه با محتویات</li>
              <li>• کپی جدول adminsystems همراه با محتویات</li>
              <li>• کپی و به‌روزرسانی جدول pageModules با کد مدرسه</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right text-2xl font-bold">
            مدیریت پایگاه‌های داده
          </CardTitle>
          <p className="text-right text-gray-600 mt-2">
            لیست پایگاه‌های داده موجود و امکان حذف آن‌ها
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" dir="rtl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">پایگاه‌های داده</h3>
              <Button 
                onClick={fetchDatabases} 
                disabled={loadingDatabases}
                variant="outline"
                size="sm"
              >
                {loadingDatabases ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال بارگذاری...
                  </>
                ) : (
                  "بروزرسانی لیست"
                )}
              </Button>
            </div>

            {loadingDatabases ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {databases.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">هیچ پایگاه داده‌ای یافت نشد</p>
                ) : (
                  databases.map((db) => (
                    <div
                      key={db.name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{db.name}</h4>
                        <p className="text-sm text-gray-500">
                          حجم: {(db.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDeleteDatabase(db.name)}
                        disabled={deletingDatabase === db.name}
                        variant="destructive"
                        size="sm"
                      >
                        {deletingDatabase === db.name ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            در حال حذف...
                          </>
                        ) : (
                          "حذف"
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

