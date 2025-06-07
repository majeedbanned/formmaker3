"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GradeListsViewProps {
  userType: "teacher" | "school";
  userCode?: string;
  schoolCode: string;
  onEditGradeList: (gradeListData: any) => void;
}

export function GradeListsView({
  userType,
  userCode,
  schoolCode,
  onEditGradeList,
}: GradeListsViewProps) {
  const [gradeLists, setGradeLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGradeLists();
  }, [userType, userCode, schoolCode]);

  const fetchGradeLists = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        schoolCode,
        ...(userType === "teacher" && userCode && { teacherCode: userCode }),
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

  const filteredGradeLists = gradeLists.filter(
    (gradeList) =>
      gradeList.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeList.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeList.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gradeList.teacherName &&
        gradeList.teacherName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در عنوان، کلاس، درس یا استاد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={fetchGradeLists} variant="outline">
          بروزرسانی
        </Button>
      </div>

      {filteredGradeLists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "هیچ نمره‌ای با این مشخصات یافت نشد"
                  : userType === "teacher"
                  ? "هنوز هیچ نمره‌ای ثبت نکرده‌اید"
                  : "هیچ نمره‌ای در سیستم یافت نشد"}
              </p>
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
