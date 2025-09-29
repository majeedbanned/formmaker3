"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Phone,
  GraduationCap,
  User,
  AlertCircle,
  UserCheck,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

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

export default function StudentsSearchWidget() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch students with server-side search
  const fetchStudents = useCallback(async (searchQuery: string = "", isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }
      
      const url = searchQuery 
        ? `/api/widget/students-search?search=${encodeURIComponent(searchQuery)}&limit=1000`
        : `/api/widget/students-search?limit=1000`;
        
      const response = await fetch(url, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllStudents(data.students || []);
        setTotalCount(data.count || 0);
        setError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در دریافت اطلاعات");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات"
      );
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (
      user?.userType &&
      (user.userType === "school" || user.userType === "teacher")
    ) {
      fetchStudents("", true);
    }
  }, [user, fetchStudents]);

  // Search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      fetchStudents(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, fetchStudents]);

  // Display students (server-side filtered)
  const displayStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return allStudents.slice(0, 6); // Show first 6 students when no search
    }
    return allStudents.slice(0, 10); // Show max 10 results when searching
  }, [allStudents, searchTerm]);

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
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            این ویجت فقط برای مدیران و معلمان در دسترس است
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-gray-800">
            <Users className="h-5 w-5 ml-2 text-blue-600" />
            جستجوی دانش‌آموزان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-bold text-gray-800">
            <AlertCircle className="h-5 w-5 ml-2 text-red-600" />
            جستجوی دانش‌آموزان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-2">خطا در بارگذاری اطلاعات</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center text-lg font-bold text-gray-800">
            <Users className="h-5 w-5 ml-2 text-blue-600" />
            جستجوی دانش‌آموزان
            <span className="mr-2 text-sm font-normal text-gray-500">
              ({searchTerm ? `${totalCount} نتیجه` : `${totalCount} دانش‌آموز`})
            </span>
          </CardTitle>
          <Link href="/admin/students">
            <Button variant="outline" size="sm">
              مشاهده همه
              <ExternalLink className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          {searchLoading && (
            <div className="absolute left-3 top-3">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          <Input
            placeholder="جستجو بر اساس نام، نام خانوادگی، کد دانش‌آموزی یا کلاس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pr-10 ${searchLoading ? 'pl-10' : ''}`}
            disabled={searchLoading}
          />
        </div>
      </CardHeader>

      <CardContent>
        {displayStudents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "دانش‌آموزی یافت نشد" : "دانش‌آموزی موجود نیست"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "عبارت جستجو را تغییر دهید و دوباره تلاش کنید"
                : user?.userType === "teacher"
                ? "در حال حاضر دانش‌آموزی در کلاس‌های شما وجود ندارد"
                : "هنوز دانش‌آموزی در سیستم ثبت نشده است"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {displayStudents.map((student) => {
              const primaryPhone = getPrimaryPhone(student.data.phones);
              const className = getStudentClassName(student);

              return (
                <div
                  key={student._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-blue-50"
                >
                  <div className="flex items-start space-x-4 space-x-reverse">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {student.data.avatar?.path ? (
                        <img
                          src={student.data.avatar.path}
                          alt={`${student.data.studentName} ${student.data.studentFamily}`}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {student.data.studentName.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {student.data.studentName}{" "}
                            {student.data.studentFamily}
                          </h4>
                          <div className="flex items-center space-x-3 space-x-reverse text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <User className="h-3 w-3 ml-1" />
                              {student.data.studentCode}
                            </span>
                            <span className="flex items-center">
                              <GraduationCap className="h-3 w-3 ml-1" />
                              {className}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {student.data.isActive ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <UserCheck className="h-3 w-3 ml-1" />
                              فعال
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                              غیرفعال
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Contact & Additional Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-600">
                          {primaryPhone && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 ml-1" />
                              {primaryPhone.number}
                              <span className="text-gray-400 mr-1">
                                ({primaryPhone.owner})
                              </span>
                            </span>
                          )}
                          {student.data.birthDate && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 ml-1" />
                              {student.data.birthDate}
                            </span>
                          )}
                        </div>

                        {user?.userType === "school" && (
                          <Link href={`/admin/students/${student._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                            >
                              جزئیات
                              <ExternalLink className="h-3 w-3 mr-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show more button if there are more results */}
            {searchTerm && totalCount > displayStudents.length && (
              <div className="text-center pt-4">
                <Link
                  href={`/admin/students?search=${encodeURIComponent(
                    searchTerm
                  )}`}
                >
                  <Button variant="outline" size="sm">
                    مشاهده همه نتایج ({totalCount})
                    <ExternalLink className="h-4 w-4 mr-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
