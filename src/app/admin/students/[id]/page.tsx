"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Phone,
  Calendar,
  GraduationCap,
  ArrowRight,
  UserCheck,
  Users,
  ClipboardList,
  BookOpen,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import PresenceTab from "./components/PresenceTab";
import GradesTab from "./components/GradesTab";
import ReportCardTab from "./components/ReportCardTab";
import StudentFormsTab from "./components/StudentFormsTab";

interface Student {
  _id: string;
  data: {
    studentName: string;
    studentFamily: string;
    studentCode: string;
    classCode: Array<{ label: string; value: string }>;
    schoolCode: string;
    phones: Array<{ owner: string; number: string }>;
    avatar?: {
      path: string;
      filename: string;
    };
    birthDate?: string;
    isActive: boolean;
    groups?: Array<{ label: string; value: string }>;
  };
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("presence");

  // Fetch student data
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/students/${studentId}`, {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStudent(data.student);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "خطا در دریافت اطلاعات دانش‌آموز");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات"
        );
      } finally {
        setLoading(false);
      }
    };

    if (
      studentId &&
      user?.userType &&
      (user.userType === "school" || user.userType === "teacher")
    ) {
      fetchStudent();
    }
  }, [studentId, user]);

  // Get class name for a student
  const getStudentClassName = (student: Student) => {
    if (student.data.classCode && student.data.classCode.length > 0) {
      return student.data.classCode.map((c) => c.label).join(", ");
    }
    return "بدون کلاس";
  };

  // Get primary phone number
  const getPrimaryPhone = (
    phones: Array<{ owner: string; number: string }>
  ) => {
    if (!phones || phones.length === 0) return null;
    return phones[0];
  };

  if (!user || (user.userType !== "school" && user.userType !== "teacher")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              این صفحه فقط برای مدیران و معلمان در دسترس است
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-2">خطا در بارگذاری اطلاعات</p>
            <p className="text-sm text-gray-500">{error}</p>
            <Link href="/admin/students">
              <Button className="mt-4" variant="outline">
                <ArrowRight className="h-4 w-4 ml-2" />
                بازگشت به لیست دانش‌آموزان
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryPhone = getPrimaryPhone(student.data.phones);
  const className = getStudentClassName(student);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link href="/admin/students">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              پروفایل دانش‌آموز
            </h1>
            <p className="text-gray-600">مشاهده جزئیات و گزارش‌های دانش‌آموز</p>
          </div>
        </div>
      </div>

      {/* Student Header Card */}
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6 space-x-reverse">
            {/* Avatar */}
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarImage
                src={student.data.avatar?.path}
                alt={`${student.data.studentName} ${student.data.studentFamily}`}
              />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {student.data.studentName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {student.data.studentName} {student.data.studentFamily}
                  </h2>
                  <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600 mt-2">
                    <span className="flex items-center">
                      <User className="h-4 w-4 ml-1" />
                      کد دانش‌آموزی: {student.data.studentCode}
                    </span>
                    <span className="flex items-center">
                      <GraduationCap className="h-4 w-4 ml-1" />
                      کلاس: {className}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {student.data.isActive ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <UserCheck className="h-3 w-3 ml-1" />
                      فعال
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                      غیرفعال
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact & Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {primaryPhone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 ml-2 text-blue-500" />
                    <span className="font-medium ml-1">
                      {primaryPhone.owner}:
                    </span>
                    <span>{primaryPhone.number}</span>
                  </div>
                )}
                {student.data.birthDate && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 ml-2 text-green-500" />
                    <span className="font-medium ml-1">تاریخ تولد:</span>
                    <span>{student.data.birthDate}</span>
                  </div>
                )}
                {student.data.groups && student.data.groups.length > 0 && (
                  <div className="flex items-center text-gray-600 md:col-span-2">
                    <Users className="h-4 w-4 ml-2 text-purple-500" />
                    <span className="font-medium ml-1">گروه‌ها:</span>
                    <div className="flex flex-wrap gap-1 mr-1">
                      {student.data.groups.map((group, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {group.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger
            value="presence"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <ClipboardList className="h-4 w-4" />
            <span>حضور و غیاب</span>
          </TabsTrigger>
          <TabsTrigger
            value="grades"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <TrendingUp className="h-4 w-4" />
            <span>نمرات</span>
          </TabsTrigger>
          <TabsTrigger
            value="reportcard"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <GraduationCap className="h-4 w-4" />
            <span>کارنامه</span>
          </TabsTrigger>
          <TabsTrigger
            value="behavior"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <MessageSquare className="h-4 w-4" />
            <span>فرم‌ها</span>
          </TabsTrigger>
          <TabsTrigger
            value="assignments"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <BookOpen className="h-4 w-4" />
            <span>تکالیف</span>
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <User className="h-4 w-4" />
            <span>مالی</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presence" className="mt-6">
          <PresenceTab studentId={studentId} student={student} />
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <GradesTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="reportcard" className="mt-6">
          <ReportCardTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="behavior" className="mt-6">
          <StudentFormsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 ml-2 text-purple-600" />
                تکالیف و پروژه‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">این بخش در حال توسعه است</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 ml-2 text-orange-600" />
                اطلاعات مالی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">این بخش در حال توسعه است</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
