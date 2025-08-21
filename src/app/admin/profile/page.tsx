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

interface StudentProfileData {
  _id: string;
  data: {
    studentName: string;
    studentFamily: string;
    studentCode: string;
    schoolCode: string;
    birthDate?: string;
    phones?: Array<{ owner: string; number: string }>;
    avatar?: {
      path: string;
      filename: string;
    };
    codemelli?: string;
    birthplace?: string;
    IDserial?: string;
    fatherEducation?: string;
    motherEducation?: string;
    fatherJob?: string;
    fatherWorkPlace?: string;
    motherJob?: string;
    infos?: string[];
    address?: string;
    postalcode?: string;
    classCode?: Array<{ label: string; value: string }>;
    groups?: Array<{ label: string; value: string }>;
  };
}

function StudentProfileContent() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Only allow students to access this page
  useEffect(() => {
    if (user && user.userType !== "student") {
      window.location.href = "/noaccess";
      return;
    }
  }, [user]);

  // Fetch student profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || user.userType !== "student") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/students/${user.id}`, {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data.student);
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

  const handleInfosChange = (value: string, checked: boolean) => {
    if (!profileData) return;

    const currentInfos = profileData.data.infos || [];
    let newInfos;

    if (checked) {
      newInfos = [...currentInfos, value];
    } else {
      newInfos = currentInfos.filter(info => info !== value);
    }

    handleInputChange('infos', newInfos);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    const formData = new FormData();
    formData.append('file', avatarFile);
    formData.append('studentId', user.id);

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/students/upload-avatar', {
        method: 'POST',
        headers: {
          "x-domain": window.location.host,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({
          ...prev!,
          data: {
            ...prev!.data,
            avatar: data.avatar
          }
        }));
        setAvatarFile(null);
        setSuccess("تصویر با موفقیت بارگذاری شد");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در بارگذاری تصویر");
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

      const response = await fetch('/api/students/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          studentId: user.id,
          profileData: {
            birthDate: profileData.data.birthDate,
            phones: profileData.data.phones,
            codemelli: profileData.data.codemelli,
            birthplace: profileData.data.birthplace,
            IDserial: profileData.data.IDserial,
            fatherEducation: profileData.data.fatherEducation,
            motherEducation: profileData.data.motherEducation,
            fatherJob: profileData.data.fatherJob,
            fatherWorkPlace: profileData.data.fatherWorkPlace,
            motherJob: profileData.data.motherJob,
            infos: profileData.data.infos,
            address: profileData.data.address,
            postalcode: profileData.data.postalcode,
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

  if (!user || user.userType !== "student") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">دسترسی غیرمجاز</h2>
            <p className="text-gray-600">این صفحه فقط برای دانش آموزان قابل دسترسی است.</p>
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

  const educationOptions = [
    { label: "دیپلم", value: "دیپلم" },
    { label: "کاردانی", value: "کاردانی" },
    { label: "کارشناسی", value: "کارشناسی" },
    { label: "کارشناسی ارشد", value: "کارشناسی ارشد" },
    { label: "دکترا", value: "دکترا" },
  ];

  const phoneOwnerOptions = [
    { label: "پدر", value: "پدر" },
    { label: "مادر", value: "مادر" },
    { label: "دانش آموز", value: "دانش آموز" },
    { label: "دانش آموز شماره مجازی", value: "دانش آموز شماره مجازی" },
  ];

  const infosOptions = [
    { value: "shahid", label: "شهدا و جانبازان" },
    { value: "anjoman", label: "انجمن مدرسه" },
    { value: "schoolbus", label: "متقاضی سرویس مدرسه" },
    { value: "farhangison", label: " فرزند فرهنگی" },
    { value: "komite", label: "کمیته" },
    { value: "atba", label: "اتباع" },
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
                    src={profileData.data.avatar ? `/avatars/${profileData.data.avatar.filename}` : undefined}
                    alt="پروفایل"
                  />
                  <AvatarFallback className="text-2xl">
                    {profileData.data.studentName[0]}{profileData.data.studentFamily[0]}
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
                  {profileData.data.studentName} {profileData.data.studentFamily}
                </h3>
                <p className="text-gray-600">کد دانش آموزی: {profileData.data.studentCode}</p>
                {profileData.data.classCode && profileData.data.classCode.length > 0 && (
                  <p className="text-gray-600">
                    کلاس: {profileData.data.classCode.map(c => c.label).join(", ")}
                  </p>
                )}
                {profileData.data.groups && profileData.data.groups.length > 0 && (
                  <p className="text-gray-600">
                    گروه‌ها: {profileData.data.groups.map(g => g.label).join(", ")}
                  </p>
                )}
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
                          // Format the date to a string before saving
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
                    <Label htmlFor="codemelli">کد ملی</Label>
                    <Input
                      id="codemelli"
                      value={profileData.data.codemelli || ''}
                      onChange={(e) => handleInputChange('codemelli', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="birthplace">محل تولد</Label>
                    <Input
                      id="birthplace"
                      value={profileData.data.birthplace || ''}
                      onChange={(e) => handleInputChange('birthplace', e.target.value)}
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

            {/* Family Information */}
            <Card>
              <CardHeader>
                <CardTitle>اطلاعات خانواده</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fatherEducation">تحصیلات پدر</Label>
                    <Select
                      value={profileData.data.fatherEducation || ''}
                      onValueChange={(value) => handleInputChange('fatherEducation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="motherEducation">تحصیلات مادر</Label>
                    <Select
                      value={profileData.data.motherEducation || ''}
                      onValueChange={(value) => handleInputChange('motherEducation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fatherJob">شغل پدر</Label>
                    <Input
                      id="fatherJob"
                      value={profileData.data.fatherJob || ''}
                      onChange={(e) => handleInputChange('fatherJob', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="fatherWorkPlace">محل کار پدر</Label>
                    <Input
                      id="fatherWorkPlace"
                      value={profileData.data.fatherWorkPlace || ''}
                      onChange={(e) => handleInputChange('fatherWorkPlace', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="motherJob">شغل مادر</Label>
                    <Input
                      id="motherJob"
                      value={profileData.data.motherJob || ''}
                      onChange={(e) => handleInputChange('motherJob', e.target.value)}
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
                <div>
                  <Label>اطلاعات جمعی</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {infosOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={option.value}
                          checked={profileData.data.infos?.includes(option.value) || false}
                          onCheckedChange={(checked) => handleInfosChange(option.value, checked as boolean)}
                        />
                        <Label htmlFor={option.value} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">آدرس</Label>
                  <Textarea
                    id="address"
                    value={profileData.data.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="postalcode">کد پستی</Label>
                  <Input
                    id="postalcode"
                    value={profileData.data.postalcode || ''}
                    onChange={(e) => handleInputChange('postalcode', e.target.value)}
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

export default function StudentProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentProfileContent />
    </Suspense>
  );
}
