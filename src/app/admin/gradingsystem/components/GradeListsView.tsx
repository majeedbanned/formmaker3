"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FileText,
  Search,
  Eye,
  Edit,
  Calendar,
  User,
  Users,
  BookOpen,
  TrendingUp,
  Loader2,
  CreditCard,
  Filter,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GradeListsViewProps {
  userType: "teacher" | "school";
  userCode?: string;
  schoolCode: string;
  onEditGradeList: (gradeListData: any) => void;
  isAdminTeacher?: boolean;
}

export function GradeListsView({
  userType,
  userCode,
  schoolCode,
  onEditGradeList,
  isAdminTeacher = false,
}: GradeListsViewProps) {
  const router = useRouter();
  const [gradeLists, setGradeLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [error, setError] = useState("");

  // Filter options
  const [teachers, setTeachers] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    fetchGradeLists();
  }, [userType, userCode, schoolCode, isAdminTeacher]);

  useEffect(() => {
    // Extract unique filter options from grade lists
    if (gradeLists.length > 0) {
      const uniqueTeachers = [
        ...new Set(gradeLists.map((gl) => gl.teacherName).filter(Boolean)),
      ];
      const uniqueClasses = [
        ...new Set(gradeLists.map((gl) => gl.className).filter(Boolean)),
      ];
      const uniqueCourses = [
        ...new Set(gradeLists.map((gl) => gl.courseName).filter(Boolean)),
      ];

      setTeachers(uniqueTeachers);
      setClasses(uniqueClasses);
      setCourses(uniqueCourses);
    }
  }, [gradeLists]);

  const fetchGradeLists = async () => {
    try {
      setLoading(true);

      // Admin teachers don't pass teacherCode to see all grade lists
      const params = new URLSearchParams({
        schoolCode,
        ...(userType === "teacher" && !isAdminTeacher && userCode && { teacherCode: userCode }),
      });

      const response = await fetch(`/api/gradingsystem/grade-lists?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch grade lists");
      }

      const data = await response.json();
      setGradeLists(data.gradeLists || []);
    } catch (error) {
      console.error("Error fetching grade lists:", error);
      setError("خطا در دریافت فهرست نمرات");
    } finally {
      setLoading(false);
    }
  };

  const handleEditGradeList = async (gradeList: any) => {
    try {
      // Fetch full grade list data including individual grades
      const response = await fetch(
        `/api/gradingsystem/grade-list/${gradeList._id}?schoolCode=${schoolCode}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch grade list details");
      }

      const data = await response.json();
      onEditGradeList(data.gradeListData);
    } catch (error) {
      console.error("Error fetching grade list details:", error);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTeacher("");
    setSelectedClass("");
    setSelectedCourse("");
  };

  const filteredGradeLists = gradeLists.filter((gradeList) => {
    const matchesSearch =
      gradeList.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeList.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeList.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gradeList.teacherName &&
        gradeList.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTeacher =
      !selectedTeacher || gradeList.teacherName === selectedTeacher;
    const matchesClass =
      !selectedClass || gradeList.className === selectedClass;
    const matchesCourse =
      !selectedCourse || gradeList.courseName === selectedCourse;

    return matchesSearch && matchesTeacher && matchesClass && matchesCourse;
  });

  const hasActiveFilters = selectedTeacher || selectedClass || selectedCourse;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">در حال بارگذاری فهرست نمرات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchGradeLists} className="mt-4">
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در عنوان، کلاس، درس یا استاد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-right"
            />
          </div>
          <Button onClick={fetchGradeLists} variant="outline">
            بروزرسانی
          </Button>
        </div>

        {/* Advanced Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <span className="font-medium">فیلترهای پیشرفته</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                پاک کردن همه
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Teacher Filter - Only show for school users */}
            {userType === "school" && teachers.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">معلم</label>
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب معلم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">همه معلمان</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher} value={teacher}>
                        {teacher}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Class Filter */}
            {classes.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">کلاس</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">همه کلاس‌ها</SelectItem>
                    {classes.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Course Filter */}
            {courses.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">درس</label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب درس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">همه دروس</SelectItem>
                    {courses.map((courseName) => (
                      <SelectItem key={courseName} value={courseName}>
                        {courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  فیلترهای فعال:
                </span>
                {selectedTeacher && (
                  <Badge variant="secondary" className="gap-1">
                    معلم: {selectedTeacher}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedTeacher("")}
                    />
                  </Badge>
                )}
                {selectedClass && (
                  <Badge variant="secondary" className="gap-1">
                    کلاس: {selectedClass}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedClass("")}
                    />
                  </Badge>
                )}
                {selectedCourse && (
                  <Badge variant="secondary" className="gap-1">
                    درس: {selectedCourse}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedCourse("")}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredGradeLists.length} نتیجه از {gradeLists.length} نمره
            {hasActiveFilters && " (فیلتر شده)"}
          </span>
          {filteredGradeLists.length !== gradeLists.length && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              نمایش همه نمرات
            </Button>
          )}
        </div>
      </div>

      {filteredGradeLists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || hasActiveFilters
                  ? "هیچ نمره‌ای با این مشخصات یافت نشد"
                  : userType === "teacher"
                  ? "هنوز هیچ نمره‌ای ثبت نکرده‌اید"
                  : "هیچ نمره‌ای در سیستم یافت نشد"}
              </p>
              {(searchTerm || hasActiveFilters) && (
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="mt-3"
                >
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGradeLists.map((gradeList) => {
            const createdDate = new Date(gradeList.createdAt);
            const updatedDate = new Date(gradeList.updatedAt);
            const isUpdated = gradeList.createdAt !== gradeList.updatedAt;

            return (
              <Card
                key={gradeList._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">
                        {gradeList.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {gradeList.className}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {gradeList.courseName}
                        </span>
                        {userType === "school" && gradeList.teacherName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {gradeList.teacherName}
                          </span>
                        )}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUpdated && (
                        <Badge variant="outline" className="text-xs">
                          ویرایش شده
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {gradeList.gradeCount} نمره
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        میانگین کلاس
                      </p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-lg font-bold">
                          {gradeList.statistics?.average?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          از ۲۰
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        قبول
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-green-600">
                          {gradeList.statistics?.passing || 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          نفر
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        مردود
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="font-medium text-red-600">
                          {gradeList.statistics?.failing || 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          نفر
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {isUpdated ? "آخرین ویرایش" : "تاریخ ثبت"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDistanceToNow(
                            isUpdated ? updatedDate : createdDate,
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditGradeList(gradeList)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      مشاهده
                    </Button>

                    {(userType === "teacher" || userType === "school") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGradeList(gradeList)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        ویرایش
                      </Button>
                    )}
                    {(userType === "teacher" || userType === "school") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          router.push(
                            `/admin/gradingsystem/report/${gradeList._id}?schoolCode=${schoolCode}`
                          )
                        }
                      >
                        <FileText className="h-4 w-4" />
                        گزارش
                      </Button>
                    )}

                    {(userType === "teacher" || userType === "school") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() =>
                          router.push(
                            `/admin/gradingsystem/gradecards/${gradeList._id}?schoolCode=${schoolCode}`
                          )
                        }
                      >
                        <CreditCard className="h-4 w-4" />
                        کارنامه دانش‌آموزان
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
