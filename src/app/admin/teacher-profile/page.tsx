"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, CalendarIcon, PhoneIcon, HomeIcon, Save, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "@/components/PageHeader";
import Image from "next/image";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface TeacherProfileData {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
    schoolCode: string;
    birthDate?: string;
    phones?: Array<{ owner: string; number: string }>;
    avatar?: {
      path: string;
      filename: string;
    };
    marrageStatus?: string;
    jobStatus?: string;
    paye?: string[];
    personelID?: string;
    nationalCode?: string;
    originalService?: string;
    originalServiceUnit?: string;
    employmentStatus?: string;
    educationDegree?: string;
    educationMajor?: string;
    teachingMajor?: string;
    teachingTitle?: string;
    workingHours?: string;
    nonWorkingHours?: string;
    bankAccount?: string;
    bankName?: string;
    maritalStatus?: string;
    pot?: string;
    educationStatus?: string;
    resignationStatus?: string;
    workHistory?: string;
    managementHistory?: string;
    exactAddress?: string;
    IDserial?: string;
  };
}

function TeacherProfileContent() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<TeacherProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Only allow teachers to access this page
  useEffect(() => {
    if (user && user.userType !== "teacher") {
      window.location.href = "/noaccess";
      return;
    }
  }, [user]);

  // Fetch teacher profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || user.userType !== "teacher") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/teachers/${user.id}`, {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data.teacher);
        } else {
          throw new Error("خطا در دریافت اطلاعات پروفایل");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    if (!profileData) return;

    setProfileData(prev => ({
      ...prev!,
      data: {
        ...prev!.data,
        [field]: value
      }
    }));
  };

  const handlePhoneChange = (index: number, field: 'owner' | 'number', value: string) => {
    if (!profileData) return;

    const newPhones = [...(profileData.data.phones || [])];
    if (!newPhones[index]) {
      newPhones[index] = { owner: '', number: '' };
    }
    newPhones[index][field] = value;

    handleInputChange('phones', newPhones);
  };

  const addPhone = () => {
    if (!profileData) return;
    const newPhones = [...(profileData.data.phones || []), { owner: '', number: '' }];
    handleInputChange('phones', newPhones);
  };

  const removePhone = (index: number) => {
    if (!profileData) return;
    const newPhones = profileData.data.phones?.filter((_, i) => i !== index) || [];
    handleInputChange('phones', newPhones);
  };

  const handlePayeChange = (value: string, checked: boolean) => {
    if (!profileData) return;

    const currentPaye = profileData.data.paye || [];
    let newPaye;

    if (checked) {
      newPaye = [...currentPaye, value];
    } else {
      newPaye = currentPaye.filter(paye => paye !== value);
    }

    handleInputChange('paye', newPaye);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    try {
      setError(null);
      setSuccess(null);

      // Step 1: Upload the image file
      const uploadFormData = new FormData();
      uploadFormData.append('file', avatarFile);

      const uploadResponse = await fetch('/api/upload/avatars', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || "خطا در آپلود تصویر");
      }

      // Step 2: Save avatar info to database
      const avatarData = {
        filename: uploadData.filename,
        originalName: uploadData.originalName,
        path: uploadData.url,
        size: uploadData.size,
        type: uploadData.type,
        uploadedAt: uploadData.uploadedAt,
      };

      const saveResponse = await fetch('/api/teachers/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          teacherId: user.id,
          profileData: {
            avatar: avatarData
          }
        }),
      });

      if (saveResponse.ok) {
        setProfileData(prev => ({
          ...prev!,
          data: {
            ...prev!.data,
            avatar: avatarData
          }
        }));
        setAvatarFile(null);
        setSuccess("تصویر با موفقیت بارگذاری و ذخیره شد");
      } else {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "خطا در ذخیره اطلاعات تصویر");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری تصویر");
    }
  };

  const handleSave = async () => {
    if (!profileData || !user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/teachers/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          teacherId: user.id,
          profileData: {
            birthDate: profileData.data.birthDate,
            phones: profileData.data.phones,
            marrageStatus: profileData.data.marrageStatus,
            jobStatus: profileData.data.jobStatus,
            paye: profileData.data.paye,
            personelID: profileData.data.personelID,
            nationalCode: profileData.data.nationalCode,
            originalService: profileData.data.originalService,
            originalServiceUnit: profileData.data.originalServiceUnit,
            employmentStatus: profileData.data.employmentStatus,
            educationDegree: profileData.data.educationDegree,
            educationMajor: profileData.data.educationMajor,
            teachingMajor: profileData.data.teachingMajor,
            teachingTitle: profileData.data.teachingTitle,
            workingHours: profileData.data.workingHours,
            nonWorkingHours: profileData.data.nonWorkingHours,
            bankAccount: profileData.data.bankAccount,
            bankName: profileData.data.bankName,
            maritalStatus: profileData.data.maritalStatus,
            pot: profileData.data.pot,
            educationStatus: profileData.data.educationStatus,
            resignationStatus: profileData.data.resignationStatus,
            workHistory: profileData.data.workHistory,
            managementHistory: profileData.data.managementHistory,
            exactAddress: profileData.data.exactAddress,
            IDserial: profileData.data.IDserial,
          }
        }),
      });

      if (response.ok) {
        setSuccess("اطلاعات با موفقیت ذخیره شد");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در ذخیره اطلاعات");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.userType !== "teacher") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">دسترسی غیرمجاز</h2>
            <p className="text-gray-600">این صفحه فقط برای معلمان قابل دسترسی است.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">خطا</h2>
            <p className="text-gray-600">اطلاعات پروفایل یافت نشد.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const marriageStatusOptions = [
    { label: "مجرد", value: "single" },
    { label: "متاهل", value: "married" },
  ];

  const jobStatusOptions = [
    { label: "رسمی", value: "official" },
    { label: "غیررسمی", value: "unofficial" },
    { label: "بازنشسته", value: "retired" },
  ];

  const phoneOwnerOptions = [
    { label: "معلم", value: "معلم" },
    { label: "شماره مجازی", value: "شماره مجازی" },
  ];

  const payeOptions = [
    { value: "1", label: "ابتدایی" },
    { value: "2", label: "اول متوسطه" },
    { value: "3", label: "دوم متوسطه" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <PageHeader
          title="پروفایل من"
          subtitle="ویرایش اطلاعات شخصی"
          icon={<UserIcon className="w-6 h-6" />}
          gradient={true}
        />

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                اطلاعات کلی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  <AvatarImage
                    src={profileData.data.avatar ? profileData.data.avatar.path : undefined}
                    alt="پروفایل"
                  />
                  <AvatarFallback className="text-2xl">
                    {profileData.data.teacherName ? profileData.data.teacherName[0] : 'T'}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="mb-2"
                  />
                  {avatarFile && (
                    <Button onClick={uploadAvatar} size="sm" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      بارگذاری تصویر
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-center border-t pt-4">
                <h3 className="font-semibold text-lg">
                  {profileData.data.teacherName}
                </h3>
                <p className="text-gray-600">کد معلم: {profileData.data.teacherCode}</p>
              </div>
            </CardContent>
          </Card>

          {/* Editable Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  اطلاعات شخصی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthDate">تاریخ تولد</Label>
                    <div dir="ltr" className="relative">
                      <DatePicker
                        value={profileData.data.birthDate || null}
                        onChange={(date) => {
                          const formattedDate = date
                            ? date.format("YYYY/MM/DD")
                            : null;
                          handleInputChange('birthDate', formattedDate);
                        }}
                        calendar={persian}
                        locale={persian_fa}
                        format="YYYY/MM/DD"
                        containerClassName="w-full"
                        inputClass="w-full p-2 border border-gray-300 rounded-md text-right bg-white"
                        placeholder="YYYY/MM/DD"
                        calendarPosition="bottom-right"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nationalCode">کد ملی</Label>
                    <Input
                      id="nationalCode"
                      value={profileData.data.nationalCode || ''}
                      onChange={(e) => handleInputChange('nationalCode', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="IDserial">شماره شناسنامه</Label>
                    <Input
                      id="IDserial"
                      value={profileData.data.IDserial || ''}
                      onChange={(e) => handleInputChange('IDserial', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="personelID">شماره پرسنلی</Label>
                    <Input
                      id="personelID"
                      value={profileData.data.personelID || ''}
                      onChange={(e) => handleInputChange('personelID', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5" />
                  اطلاعات تماس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.data.phones?.map((phone, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>صاحب شماره</Label>
                      <Select
                        value={phone.owner}
                        onValueChange={(value) => handlePhoneChange(index, 'owner', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent>
                          {phoneOwnerOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label>شماره تلفن</Label>
                      <Input
                        value={phone.number}
                        onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                        placeholder="شماره تلفن"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePhone(index)}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPhone}>
                  افزودن شماره تلفن
                </Button>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات شغلی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marrageStatus">وضعیت تاهل</Label>
                    <Select
                      value={profileData.data.marrageStatus || ''}
                      onValueChange={(value) => handleInputChange('marrageStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {marriageStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="jobStatus">وضعیت استخدامی</Label>
                    <Select
                      value={profileData.data.jobStatus || ''}
                      onValueChange={(value) => handleInputChange('jobStatus', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStatusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>پایه تدریس</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {payeOptions.map(option => (
                        <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={option.value}
                            checked={profileData.data.paye?.includes(option.value) || false}
                            onCheckedChange={(checked) => handlePayeChange(option.value, checked as boolean)}
                          />
                          <Label htmlFor={option.value} className="text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="educationDegree">مدرک تحصیلی</Label>
                    <Input
                      id="educationDegree"
                      value={profileData.data.educationDegree || ''}
                      onChange={(e) => handleInputChange('educationDegree', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="educationMajor">رشته تحصیلی</Label>
                    <Input
                      id="educationMajor"
                      value={profileData.data.educationMajor || ''}
                      onChange={(e) => handleInputChange('educationMajor', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="teachingMajor">رشته اصلی تدریس</Label>
                    <Input
                      id="teachingMajor"
                      value={profileData.data.teachingMajor || ''}
                      onChange={(e) => handleInputChange('teachingMajor', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5" />
                  اطلاعات تکمیلی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workingHours">ساعت موظف</Label>
                    <Input
                      id="workingHours"
                      value={profileData.data.workingHours || ''}
                      onChange={(e) => handleInputChange('workingHours', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nonWorkingHours">ساعت غیر موظف</Label>
                    <Input
                      id="nonWorkingHours"
                      value={profileData.data.nonWorkingHours || ''}
                      onChange={(e) => handleInputChange('nonWorkingHours', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankAccount">شماره حساب بانک</Label>
                    <Input
                      id="bankAccount"
                      value={profileData.data.bankAccount || ''}
                      onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankName">نام بانک</Label>
                    <Input
                      id="bankName"
                      value={profileData.data.bankName || ''}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="exactAddress">آدرس دقیق</Label>
                  <Textarea
                    id="exactAddress"
                    value={profileData.data.exactAddress || ''}
                    onChange={(e) => handleInputChange('exactAddress', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="workHistory">سابقه کار</Label>
                  <Textarea
                    id="workHistory"
                    value={profileData.data.workHistory || ''}
                    onChange={(e) => handleInputChange('workHistory', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="managementHistory">سابقه معاونت و مدیریت</Label>
                  <Textarea
                    id="managementHistory"
                    value={profileData.data.managementHistory || ''}
                    onChange={(e) => handleInputChange('managementHistory', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TeacherProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherProfileContent />
    </Suspense>
  );
}






